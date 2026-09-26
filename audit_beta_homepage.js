const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
    console.log('Launching browser to test https://beta.teamwoodenstreet.com/ ...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    const page = await context.newPage();
    
    const consoleErrors = [];
    const failedNetworkRequests = [];
    
    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push({ text: msg.text(), location: msg.location() });
        }
    });

    page.on('response', response => {
        const status = response.status();
        const url = response.url();
        if (status >= 400) {
            failedNetworkRequests.push({ url, status, statusText: response.statusText() });
        }
    });

    const targetUrl = 'https://beta.teamwoodenstreet.com/';
    console.log(`Navigating to ${targetUrl}...`);
    
    try {
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(5000);
    } catch (e) {
        console.log(`Navigation error/timeout, proceeding... (${e.message})`);
    }

    // Take initial screenshot
    await page.screenshot({ path: 'beta_homepage_initial.png', fullPage: false });

    // Scroll down gradually to trigger lazy loading & render all sections
    console.log('Scrolling down to trigger lazy load...');
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 400;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight || totalHeight > 25000) {
                    clearInterval(timer);
                    resolve();
                }
            }, 150);
        });
    });

    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'beta_homepage_scrolled.png', fullPage: false });

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    // Hover over top navigation items to ensure mega menus are rendered in DOM
    console.log('Hovering top nav items for mega menus...');
    const topNavSelectors = ['header nav a', 'header ul li', '.navigation a', '.header-menu a', '.nav-item', 'header a'];
    for (const selector of topNavSelectors) {
        const items = await page.$$(selector);
        if (items.length > 0) {
            console.log(`Hovering ${items.length} items found for selector '${selector}'`);
            for (let i = 0; i < Math.min(items.length, 25); i++) {
                try {
                    await items[i].hover({ timeout: 800 }).catch(() => {});
                } catch (e) {}
            }
            break;
        }
    }

    await page.waitForTimeout(2000);

    // Extract all links
    console.log('Extracting all anchor tags and image elements...');
    const linkData = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a'));
        return anchors.map(a => {
            const href = a.getAttribute('href');
            const fullUrl = a.href;
            const text = (a.innerText || a.textContent || '').trim().replace(/\s+/g, ' ');
            
            let parentSection = 'Body';
            if (a.closest('header') || a.closest('.header') || a.closest('#header')) parentSection = 'Header';
            else if (a.closest('footer') || a.closest('.footer') || a.closest('#footer')) parentSection = 'Footer';
            else if (a.closest('nav') || a.closest('.menu') || a.closest('.nav')) parentSection = 'Navigation';

            return { href, fullUrl, text: text.substring(0, 100), parentSection };
        });
    });

    console.log(`Extracted total ${linkData.length} links on page.`);

    // Extract image elements and check for broken src or naturalWidth === 0
    const imageData = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs.map(img => ({
            src: img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy'),
            alt: img.alt || '',
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            isComplete: img.complete
        }));
    });

    const brokenImagesInDOM = imageData.filter(img => img.src && img.isComplete && (img.naturalWidth === 0 || img.naturalHeight === 0));
    console.log(`Total images: ${imageData.length}, Broken in DOM (width/height 0): ${brokenImagesInDOM.length}`);

    // Categorize links
    const emptyOrHashLinks = [];
    const internalLinks = [];
    const externalLinks = [];

    const baseHost = new URL(targetUrl).hostname;

    for (const item of linkData) {
        const { href, fullUrl, text, parentSection } = item;
        if (!href || href.trim() === '' || href === '#' || href.startsWith('javascript:')) {
            emptyOrHashLinks.push(item);
            continue;
        }

        try {
            const urlObj = new URL(fullUrl);
            if (urlObj.hostname === baseHost || urlObj.hostname === 'www.woodenstreet.com' || urlObj.hostname.includes('woodenstreet')) {
                internalLinks.push(item);
            } else {
                externalLinks.push(item);
            }
        } catch (e) {
            emptyOrHashLinks.push(item);
        }
    }

    console.log(`Classification: Empty/Hash/JS: ${emptyOrHashLinks.length}, Internal/WoodenStreet: ${internalLinks.length}, External: ${externalLinks.length}`);

    // De-duplicate internal links by fullUrl
    const uniqueInternalMap = new Map();
    for (const item of internalLinks) {
        if (!uniqueInternalMap.has(item.fullUrl)) {
            uniqueInternalMap.set(item.fullUrl, item);
        }
    }
    const uniqueInternalLinks = Array.from(uniqueInternalMap.values());
    console.log(`Unique internal URLs to test: ${uniqueInternalLinks.length}`);

    // Check link status using HTTP request
    const linkCheckResults = [];
    const batchSize = 10;
    
    console.log('Testing internal URLs status codes...');
    for (let i = 0; i < uniqueInternalLinks.length; i += batchSize) {
        const batch = uniqueInternalLinks.slice(i, i + batchSize);
        await Promise.all(batch.map(async (item) => {
            let status = null;
            let finalUrl = null;
            let errorMsg = null;
            let isSoft404 = false;

            try {
                const res = await page.request.get(item.fullUrl, { timeout: 25000, maxRedirects: 5 });
                status = res.status();
                finalUrl = res.url();

                if (status === 200) {
                    const bodyText = await res.text();
                    // Check soft 404 indicators
                    if (bodyText.includes('404 Page Not Found') || bodyText.includes('Page Not Found') || bodyText.includes('page-not-found') || bodyText.includes('Looking for something?')) {
                        const titleMatch = bodyText.match(/<title>(.*?)<\/title>/i);
                        if (titleMatch && (titleMatch[1].toLowerCase().includes('404') || titleMatch[1].toLowerCase().includes('not found'))) {
                            isSoft404 = true;
                        }
                    }
                }
            } catch (err) {
                errorMsg = err.message;
            }

            linkCheckResults.push({
                ...item,
                status,
                finalUrl,
                errorMsg,
                isSoft404
            });
        }));
        if ((i + batchSize) % 50 === 0 || i + batchSize >= uniqueInternalLinks.length) {
            console.log(`Checked ${Math.min(i + batchSize, uniqueInternalLinks.length)} / ${uniqueInternalLinks.length}...`);
        }
    }

    const broken404s = linkCheckResults.filter(r => r.status === 404 || r.isSoft404);
    const otherErrors = linkCheckResults.filter(r => r.status && r.status >= 400 && r.status !== 404);
    const fetchFails = linkCheckResults.filter(r => !r.status && r.errorMsg);

    console.log('\n--- AUDIT SUMMARY ---');
    console.log(`Total 404 links: ${broken404s.length}`);
    console.log(`Other HTTP Error links (500, 403, etc.): ${otherErrors.length}`);
    console.log(`Fetch Failure links: ${fetchFails.length}`);
    console.log(`Empty / # / JS void links: ${emptyOrHashLinks.length}`);
    console.log(`Broken Image elements in DOM: ${brokenImagesInDOM.length}`);
    console.log(`Console JS Errors: ${consoleErrors.length}`);
    console.log(`Failed Network Requests: ${failedNetworkRequests.length}`);

    // Save summary report to JSON
    const report = {
        timestamp: new Date().toISOString(),
        targetUrl,
        totalLinksExtracted: linkData.length,
        uniqueInternalUrlsTested: uniqueInternalLinks.length,
        broken404Links: broken404s,
        otherHttpErrors: otherErrors,
        fetchFailures: fetchFails,
        emptyOrHashLinks: emptyOrHashLinks,
        brokenImagesInDOM: brokenImagesInDOM,
        consoleErrors: consoleErrors,
        failedNetworkRequests: failedNetworkRequests.filter(r => r.status >= 400)
    };

    fs.writeFileSync('beta_homepage_audit_report.json', JSON.stringify(report, null, 2));
    console.log('Report saved to beta_homepage_audit_report.json');

    await browser.close();
})();
