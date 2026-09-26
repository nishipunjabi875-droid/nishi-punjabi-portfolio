const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    console.log('=== Deep Audit of https://beta.teamwoodenstreet.com/ ===\n');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    const consoleErrors = [];
    const consoleWarnings = [];
    const uncaughtExceptions = [];
    const failedNetworkRequests = [];
    const slowRequests = [];

    // 1. Listen for console errors & warnings
    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push({ text: msg.text(), location: msg.location() });
        } else if (msg.type() === 'warning') {
            consoleWarnings.push({ text: msg.text() });
        }
    });

    // 2. Listen for page uncaught errors
    page.on('pageerror', err => {
        uncaughtExceptions.push({ message: err.message, stack: err.stack });
    });

    // 3. Listen for network requests and responses
    const requestStartTimes = new Map();
    page.on('request', req => {
        requestStartTimes.set(req.url(), Date.now());
    });

    page.on('response', res => {
        const status = res.status();
        const url = res.url();
        const startTime = requestStartTimes.get(url);
        const duration = startTime ? Date.now() - startTime : 0;

        if (status >= 400) {
            failedNetworkRequests.push({ url, status, statusText: res.statusText(), resourceType: res.request().resourceType() });
        }
        if (duration > 3000) {
            slowRequests.push({ url, durationMs: duration, status });
        }
    });

    const targetUrl = 'https://beta.teamwoodenstreet.com/';
    console.log(`[1] Navigating to ${targetUrl}...`);
    const startTime = Date.now();
    let loadError = null;

    try {
        await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 60000 });
    } catch (e) {
        loadError = e.message;
        console.log(`Navigation note: ${e.message}`);
    }
    const pageLoadTimeMs = Date.now() - startTime;

    console.log(`[2] Page loaded in ${(pageLoadTimeMs / 1000).toFixed(2)}s`);

    // 4. Scroll down gradually to load all lazy components & triggers
    console.log('[3] Scrolling down to trigger lazy loading & dynamically injected scripts...');
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 400;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight || totalHeight > 30000) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });

    await page.waitForTimeout(3000);

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    // 5. Inspect Links for empty / placeholder / invalid hrefs
    console.log('[4] Checking DOM links for placeholder / hash / invalid hrefs...');
    const linkAudit = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a'));
        const emptyOrHash = [];
        const javascriptVoid = [];
        const totalAnchors = anchors.length;

        anchors.forEach(a => {
            const href = a.getAttribute('href');
            const text = (a.innerText || a.textContent || '').trim().replace(/\s+/g, ' ');
            const outerHTML = a.outerHTML.substring(0, 150);

            if (href === null || href === '' || href === '#') {
                emptyOrHash.push({ text: text || '[No Text]', href, outerHTML });
            } else if (href.startsWith('javascript:')) {
                javascriptVoid.push({ text: text || '[No Text]', href, outerHTML });
            }
        });

        return { totalAnchors, emptyOrHash, javascriptVoid };
    });

    // 6. Inspect Images in DOM (broken / naturalWidth === 0 / alt attributes)
    console.log('[5] Checking DOM images for rendering errors & missing alt text...');
    const imageAudit = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        const brokenImages = [];
        const missingAlt = [];
        const missingSrc = [];

        imgs.forEach(img => {
            const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy') || img.getAttribute('srcset');
            const alt = img.getAttribute('alt');
            
            if (!src || src.trim() === '') {
                missingSrc.push({ outerHTML: img.outerHTML.substring(0, 150) });
            } else if (img.complete && (img.naturalWidth === 0 || img.naturalHeight === 0)) {
                brokenImages.push({ src, alt: alt || '[No Alt]', naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
            }

            if (!alt || alt.trim() === '') {
                missingAlt.push({ src: src ? src.substring(0, 80) : '[No Src]' });
            }
        });

        return {
            totalImages: imgs.length,
            brokenImages,
            missingAltCount: missingAlt.length,
            missingSrc
        };
    });

    // 7. Interactive Component Testing (Search Autosuggest, Pincode Modal, Mobile Header)
    console.log('[6] Testing interactive components (Search bar, Pincode modal, etc.)...');
    
    // Test Search input
    let searchStatus = 'Not Tested';
    try {
        const searchInput = await page.$('input[name="keyword"], input[type="search"], #search, .search-input, input[placeholder*="Search"]');
        if (searchInput) {
            await searchInput.fill('sofa');
            await page.waitForTimeout(2000);
            const suggestions = await page.$$('.suggestion-item, .search-dropdown, .autocomplete-suggestions, ul.search-list li, .search-results-list li');
            searchStatus = `Search input working, found ${suggestions.length} autosuggest items`;
        } else {
            searchStatus = 'Search input selector not found';
        }
    } catch (e) {
        searchStatus = `Search test error: ${e.message}`;
    }

    // 8. Meta tags & SEO check
    console.log('[7] Checking SEO meta tags...');
    const seoAudit = await page.evaluate(() => {
        const title = document.title;
        const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content');
        const metaOgTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
        const h1s = Array.from(document.querySelectorAll('h1')).map(h => h.innerText.trim());
        const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href');

        return {
            title,
            metaDesc: metaDesc || null,
            metaOgTitle: metaOgTitle || null,
            h1Count: h1s.length,
            h1Texts: h1s,
            canonical: canonical || null
        };
    });

    console.log('\n=== AUDIT COMPLETE ===');
    console.log(`Page Title: ${seoAudit.title}`);
    console.log(`Page Load Time: ${(pageLoadTimeMs / 1000).toFixed(2)}s`);
    console.log(`Console Errors: ${consoleErrors.length}`);
    console.log(`Uncaught Exceptions: ${uncaughtExceptions.length}`);
    console.log(`Failed Network Requests: ${failedNetworkRequests.length}`);
    console.log(`Slow Requests (>3s): ${slowRequests.length}`);
    console.log(`DOM Broken Images: ${imageAudit.brokenImages.length}`);
    console.log(`Images Missing Alt Text: ${imageAudit.missingAltCount} / ${imageAudit.totalImages}`);
    console.log(`Empty/Hash Links ('#' or empty href): ${linkAudit.emptyOrHash.length}`);
    console.log(`Javascript Void Links: ${linkAudit.javascriptVoid.length}`);
    console.log(`Search Test: ${searchStatus}`);

    const fullReport = {
        timestamp: new Date().toISOString(),
        targetUrl,
        pageLoadTimeMs,
        seoAudit,
        consoleErrors,
        consoleWarnings,
        uncaughtExceptions,
        failedNetworkRequests,
        slowRequests,
        imageAudit,
        linkAudit,
        searchStatus
    };

    fs.writeFileSync('deep_home_audit.json', JSON.stringify(fullReport, null, 2));
    console.log('\nDetailed audit results saved to deep_home_audit.json');

    await browser.close();
})();
