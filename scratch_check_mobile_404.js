const { chromium } = require('playwright');

(async () => {
    console.log('=== Checking 404 Links on Mobile Viewport (Beta Homepage) ===\n');

    const targetUrl = 'https://beta.teamwoodenstreet.com/';
    const browser = await chromium.launch({ headless: true });
    
    // Mobile context (iPhone 13 / Chrome Mobile)
    const context = await browser.newContext({
        viewport: { width: 375, height: 812 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        isMobile: true,
        hasTouch: true
    });

    const page = await context.newPage();

    try {
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(3000);
    } catch (e) {
        console.log(`Page load note: ${e.message}`);
    }

    // Try to open Mobile Drawer / Hamburger Menu / Category Menu if present
    console.log('Opening mobile menus / hamburger menu / category drawers...');
    const menuTriggers = [
        'header .hamburger', 'header .menu-icon', 'header [aria-label="menu"]',
        '#menu-toggle', '.mobile-menu-toggle', '.header-hamburger', '.burger-menu',
        '.cat-menu', '.category-slider a', '.category-list a', '.nav-toggle',
        '.header-left button', '.mobile-nav-icon', '.sidebar-toggle', '.menu-btn'
    ];

    for (const sel of menuTriggers) {
        try {
            const btns = await page.$$(sel);
            for (const btn of btns) {
                if (await btn.isVisible()) {
                    console.log(`- Clicking menu trigger: ${sel}`);
                    await btn.click().catch(() => {});
                    await page.waitForTimeout(1000);
                }
            }
        } catch (e) {}
    }

    // Expand accordion / subcategory toggles if available
    const accordionTriggers = ['.menu-drawer .has-child', '.mobile-menu .dropdown', '.sub-menu-toggle', '.accordion-header', '.cat-item', '.category-accordion', 'li.has-sub > a', '.menu-list .arrow'];
    for (const sel of accordionTriggers) {
        try {
            const btns = await page.$$(sel);
            for (const btn of btns.slice(0, 30)) {
                if (await btn.isVisible()) {
                    await btn.click().catch(() => {});
                    await page.waitForTimeout(300);
                }
            }
        } catch (e) {}
    }

    // Scroll down to load mobile lazy loaded sections
    console.log('Scrolling down mobile page...');
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 300;
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

    await page.waitForTimeout(2000);

    // Extract all link elements
    console.log('Extracting all anchor elements on mobile...');
    const links = await page.evaluate((sourcePage) => {
        const anchors = Array.from(document.querySelectorAll('a'));
        return anchors.map((a, index) => {
            const rawHref = a.getAttribute('href') || '';
            const fullUrl = a.href || '';
            let text = (a.innerText || a.textContent || '').trim().replace(/\s+/g, ' ');
            if (!text) {
                const img = a.querySelector('img');
                if (img) text = img.getAttribute('alt') || img.getAttribute('title') || '[Banner/Image]';
                else text = a.getAttribute('title') || a.getAttribute('aria-label') || '[Icon/Link]';
            }

            // Categorize container
            let container = 'Mobile Body';
            if (a.closest('header') || a.closest('.mobile-header') || a.closest('.header')) container = 'Mobile Header';
            else if (a.closest('.mobile-menu') || a.closest('.drawer') || a.closest('.sidebar') || a.closest('.navigation') || a.closest('.menu')) container = 'Mobile Drawer / Menu';
            else if (a.closest('footer') || a.closest('.footer')) container = 'Mobile Footer';
            else if (a.closest('.category-slider') || a.closest('.categories') || a.closest('.cat-slider') || a.closest('.shop-by-category')) container = 'Mobile Categories';

            return {
                id: index + 1,
                rawHref,
                fullUrl,
                linkText: text.substring(0, 100),
                container
            };
        });
    }, targetUrl);

    console.log(`Total anchor tags found on mobile: ${links.length}`);

    // Filter HTTP URLs
    const httpLinks = links.filter(l => l.fullUrl && l.fullUrl.startsWith('http'));
    const uniqueUrls = [...new Set(httpLinks.map(l => l.fullUrl))];
    console.log(`Unique HTTP URLs on mobile: ${uniqueUrls.length}`);

    const urlStatusCache = new Map();
    const batchSize = 15;

    for (let i = 0; i < uniqueUrls.length; i += batchSize) {
        const batch = uniqueUrls.slice(i, i + batchSize);
        await Promise.all(batch.map(async (url) => {
            try {
                const res = await page.request.get(url, { timeout: 20000, maxRedirects: 5 });
                const status = res.status();
                const finalUrl = res.url();
                let isSoft404 = false;

                if (status === 200) {
                    const text = await res.text();
                    if (text.includes('404 Page Not Found') || text.includes('page-not-found') || text.includes('Looking for something?')) {
                        const titleMatch = text.match(/<title>(.*?)<\/title>/i);
                        if (titleMatch && (titleMatch[1].toLowerCase().includes('404') || titleMatch[1].toLowerCase().includes('not found'))) {
                            isSoft404 = true;
                        }
                    }
                }

                urlStatusCache.set(url, { status, finalUrl, isSoft404, error: null });
            } catch (err) {
                urlStatusCache.set(url, { status: 'Error', finalUrl: url, isSoft404: false, error: err.message });
            }
        }));
    }

    await browser.close();

    // Results analysis
    const broken404s = [];
    const otherErrors = [];

    links.forEach(item => {
        if (!item.fullUrl || !item.fullUrl.startsWith('http')) return;
        const info = urlStatusCache.get(item.fullUrl);
        if (!info) return;

        if (info.status === 404 || info.isSoft404) {
            broken404s.push({ ...item, ...info });
        } else if (typeof info.status === 'number' && info.status >= 400) {
            otherErrors.push({ ...item, ...info });
        }
    });

    console.log('\n=== MOBILE 404 AUDIT RESULTS ===');
    console.log(`Total 404 / Soft-404 Links Found: ${broken404s.length}`);
    if (broken404s.length > 0) {
        broken404s.forEach((b, idx) => {
            console.log(`${idx + 1}. [${b.container}] "${b.linkText}" -> ${b.fullUrl} (Status: ${b.status}${b.isSoft404 ? ' Soft-404' : ''})`);
        });
    } else {
        console.log('No 404 links found in initial mobile scan.');
    }

    console.log(`\nOther Errors (e.g. 500, 403, network): ${otherErrors.length}`);
    otherErrors.forEach((e, idx) => {
        console.log(`${idx + 1}. [${e.container}] "${e.linkText}" -> ${e.fullUrl} (Status: ${e.status}, Error: ${e.error})`);
    });

})();
