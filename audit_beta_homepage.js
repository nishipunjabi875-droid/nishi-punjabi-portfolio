const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
    console.log('=== WoodenStreet Beta Homepage Audit (Desktop & Mobile Viewports) ===');
    const targetUrl = 'https://beta.teamwoodenstreet.com/';
    const browser = await chromium.launch({ headless: true });

    const consoleErrors = [];
    const failedNetworkRequests = [];
    const allExtractedItems = [];

    // -------------------------------------------------------------
    // 1. DESKTOP VIEWPORT SCAN (1440x900)
    // -------------------------------------------------------------
    console.log('\n[1/4] Scanning Desktop Viewport (1440x900)...');
    const desktopContext = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const desktopPage = await desktopContext.newPage();

    desktopPage.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push({ device: 'Desktop', text: msg.text(), location: msg.location() });
    });
    desktopPage.on('response', response => {
        if (response.status() >= 400) failedNetworkRequests.push({ device: 'Desktop', url: response.url(), status: response.status(), statusText: response.statusText() });
    });

    try {
        await desktopPage.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await desktopPage.waitForTimeout(3000);
    } catch (e) {
        console.log(`Desktop navigation note: ${e.message}`);
    }

    // Scroll down to trigger lazy loading
    await desktopPage.evaluate(async () => {
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
    await desktopPage.waitForTimeout(2000);

    // Hover mega menu items
    const topNavSelectors = ['header nav a', 'header ul li', '.navigation a', '.header-menu a', '.nav-item', 'header a'];
    for (const selector of topNavSelectors) {
        const items = await desktopPage.$$(selector);
        if (items.length > 0) {
            for (let i = 0; i < Math.min(items.length, 30); i++) {
                try {
                    await items[i].hover({ timeout: 600 }).catch(() => {});
                } catch (e) {}
            }
            break;
        }
    }

    const desktopLinkData = await desktopPage.evaluate((sourceUrl) => {
        const anchors = Array.from(document.querySelectorAll('a'));
        return anchors.map(a => {
            const href = a.getAttribute('href');
            const fullUrl = a.href;
            const text = (a.innerText || a.textContent || '').trim().replace(/\s+/g, ' ');
            let parentSection = 'Body';
            if (a.closest('header') || a.closest('.header')) parentSection = 'Header';
            else if (a.closest('footer') || a.closest('.footer')) parentSection = 'Footer';
            else if (a.closest('.mega-menu') || a.closest('.nav-dropdown')) parentSection = 'Header Mega Menu';

            return { device: 'Desktop', href, fullUrl, text: text.substring(0, 100), parentSection, sourceUrl };
        });
    }, targetUrl);

    console.log(`  - Extracted ${desktopLinkData.length} links on Desktop.`);
    allExtractedItems.push(...desktopLinkData);
    await desktopContext.close();


    // -------------------------------------------------------------
    // 2. MOBILE VIEWPORT SCAN (375x812 iPhone 13)
    // -------------------------------------------------------------
    console.log('\n[2/4] Scanning Mobile Viewport (375x812 iPhone)...');
    const mobileContext = await browser.newContext({
        viewport: { width: 375, height: 812 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        isMobile: true,
        hasTouch: true
    });
    const mobilePage = await mobileContext.newPage();

    mobilePage.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push({ device: 'Mobile', text: msg.text(), location: msg.location() });
    });
    mobilePage.on('response', response => {
        if (response.status() >= 400) failedNetworkRequests.push({ device: 'Mobile', url: response.url(), status: response.status(), statusText: response.statusText() });
    });

    try {
        await mobilePage.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await mobilePage.waitForTimeout(3000);
    } catch (e) {
        console.log(`Mobile navigation note: ${e.message}`);
    }

    // Open Mobile Drawer & Category menus
    const menuTriggers = [
        'header .hamburger', 'header .menu-icon', 'header [aria-label="menu"]',
        '#menu-toggle', '.mobile-menu-toggle', '.header-hamburger', '.burger-menu',
        '.cat-menu', '.category-slider a', '.category-list a', '.nav-toggle'
    ];
    for (const sel of menuTriggers) {
        try {
            const btns = await mobilePage.$$(sel);
            for (const btn of btns) {
                if (await btn.isVisible()) {
                    await btn.click().catch(() => {});
                    await mobilePage.waitForTimeout(800);
                }
            }
        } catch (e) {}
    }

    // Expand mobile category accordions
    const accordionTriggers = ['.menu-drawer .has-child', '.mobile-menu .dropdown', '.sub-menu-toggle', '.accordion-header', '.cat-item', '.category-accordion', 'li.has-sub > a', '.menu-list .arrow'];
    for (const sel of accordionTriggers) {
        try {
            const btns = await mobilePage.$$(sel);
            for (const btn of btns.slice(0, 30)) {
                if (await btn.isVisible()) {
                    await btn.click().catch(() => {});
                    await mobilePage.waitForTimeout(300);
                }
            }
        } catch (e) {}
    }

    // Scroll mobile page
    await mobilePage.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 300;
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
    await mobilePage.waitForTimeout(2000);

    const mobileLinkData = await mobilePage.evaluate((sourceUrl) => {
        const anchors = Array.from(document.querySelectorAll('a'));
        return anchors.map(a => {
            const href = a.getAttribute('href');
            const fullUrl = a.href;
            const text = (a.innerText || a.textContent || '').trim().replace(/\s+/g, ' ');
            let parentSection = 'Mobile Body';
            if (a.closest('header') || a.closest('.mobile-header')) parentSection = 'Mobile Header';
            else if (a.closest('.mobile-menu') || a.closest('.drawer') || a.closest('.sidebar')) parentSection = 'Mobile Drawer / Menu';
            else if (a.closest('footer') || a.closest('.footer')) parentSection = 'Mobile Footer';
            else if (a.closest('.category-slider') || a.closest('.categories')) parentSection = 'Mobile Categories Grid';

            return { device: 'Mobile', href, fullUrl, text: text.substring(0, 100), parentSection, sourceUrl };
        });
    }, targetUrl);

    console.log(`  - Extracted ${mobileLinkData.length} links on Mobile.`);
    allExtractedItems.push(...mobileLinkData);


    // -------------------------------------------------------------
    // 3. CATEGORIZE & DEDUPLICATE LINKS
    // -------------------------------------------------------------
    console.log('\n[3/4] Categorizing extracted links across Desktop and Mobile...');
    const emptyOrHashLinks = [];
    const internalLinks = [];
    const externalLinks = [];
    const baseHost = new URL(targetUrl).hostname;

    for (const item of allExtractedItems) {
        const { href, fullUrl } = item;
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

    console.log(`  - Empty/Hash/JS: ${emptyOrHashLinks.length}`);
    console.log(`  - Internal WoodenStreet URLs: ${internalLinks.length}`);
    console.log(`  - External URLs: ${externalLinks.length}`);

    // Map unique internal URLs to test
    const uniqueInternalMap = new Map();
    for (const item of internalLinks) {
        if (!uniqueInternalMap.has(item.fullUrl)) {
            uniqueInternalMap.set(item.fullUrl, item);
        }
    }
    const uniqueInternalLinks = Array.from(uniqueInternalMap.values());
    console.log(`  - Unique internal URLs to test: ${uniqueInternalLinks.length}`);


    // -------------------------------------------------------------
    // 4. TEST INTERNAL URLS FOR HTTP 404 AND SOFT 404
    // -------------------------------------------------------------
    console.log('\n[4/4] Testing internal URLs status codes...');
    const linkCheckResults = [];
    const batchSize = 15;

    for (let i = 0; i < uniqueInternalLinks.length; i += batchSize) {
        const batch = uniqueInternalLinks.slice(i, i + batchSize);
        await Promise.all(batch.map(async (item) => {
            let status = null;
            let finalUrl = null;
            let errorMsg = null;
            let isSoft404 = false;

            try {
                const res = await mobilePage.request.get(item.fullUrl, { timeout: 20000, maxRedirects: 5 });
                status = res.status();
                finalUrl = res.url();

                if (status === 200) {
                    const bodyText = await res.text();
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

            // Associate result with all occurrences of this fullUrl
            const occurrences = allExtractedItems.filter(x => x.fullUrl === item.fullUrl);
            occurrences.forEach(occ => {
                linkCheckResults.push({
                    ...occ,
                    status,
                    finalUrl,
                    errorMsg,
                    isSoft404
                });
            });
        }));
    }

    await browser.close();

    // -------------------------------------------------------------
    // AUDIT SUMMARY & JSON REPORT
    // -------------------------------------------------------------
    const broken404s = linkCheckResults.filter(r => r.status === 404 || r.isSoft404);
    const otherErrors = linkCheckResults.filter(r => r.status && r.status >= 400 && r.status !== 404);
    const fetchFails = linkCheckResults.filter(r => !r.status && r.errorMsg);

    console.log('\n=================== AUDIT SUMMARY ===================');
    console.log(`Target Environment          : ${targetUrl}`);
    console.log(`Total Extracted Links       : ${allExtractedItems.length} (Desktop: ${desktopLinkData.length}, Mobile: ${mobileLinkData.length})`);
    console.log(`Unique Internal URLs Tested : ${uniqueInternalLinks.length}`);
    console.log(`Total 404 Broken Links      : ${broken404s.length}`);
    console.log(`Other HTTP Error Links      : ${otherErrors.length}`);
    console.log(`Fetch Failures              : ${fetchFails.length}`);
    console.log(`Empty / Hash / JS Links    : ${emptyOrHashLinks.length}`);
    console.log('=====================================================\n');

    if (broken404s.length > 0) {
        console.log('🚨 DETAILED 404 BROKEN LINKS ON BETA:');
        broken404s.forEach((b, idx) => {
            console.log(` ${idx + 1}. [${b.device}] [${b.parentSection}] "${b.text}" -> ${b.fullUrl} (Status: ${b.status}${b.isSoft404 ? ' Soft-404' : ''})`);
        });
        console.log('');
    } else {
        console.log('✅ SUCCESS: No 404 broken links found on Beta!\n');
    }

    // Save summary report to JSON
    const report = {
        timestamp: new Date().toISOString(),
        targetUrl,
        totalLinksExtracted: allExtractedItems.length,
        desktopLinks: desktopLinkData.length,
        mobileLinks: mobileLinkData.length,
        uniqueInternalUrlsTested: uniqueInternalLinks.length,
        total404s: broken404s.length,
        broken404Links: broken404s,
        otherHttpErrors: otherErrors,
        fetchFailures: fetchFails,
        emptyOrHashLinks: emptyOrHashLinks,
        consoleErrors: consoleErrors,
        failedNetworkRequests: failedNetworkRequests.filter(r => r.status >= 400)
    };

    fs.writeFileSync('beta_homepage_audit_report.json', JSON.stringify(report, null, 2));
    console.log('✅ Full audit report saved to beta_homepage_audit_report.json\n');
})();
