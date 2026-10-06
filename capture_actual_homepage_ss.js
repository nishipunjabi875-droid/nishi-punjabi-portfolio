const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
    console.log('🚀 Starting Actual Homepage Banner Inspection & Screenshot Capture...');

    const browser = await chromium.launch({ headless: true });
    
    const targets = [
        { name: 'Beta Homepage', url: 'https://beta.teamwoodenstreet.com/', prefix: 'beta' },
        { name: 'Production Homepage', url: 'https://www.woodenstreet.com/', prefix: 'prod' }
    ];

    const reportsDir = path.join(__dirname, 'reports');
    const screenshotsDir = path.join(reportsDir, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    for (const target of targets) {
        console.log(`\n==================================================`);
        console.log(`Auditing & Capturing: ${target.name} (${target.url})`);
        console.log(`==================================================`);

        const context = await browser.newContext({
            viewport: { width: 1440, height: 900 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            extraHTTPHeaders: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            }
        });

        const page = await context.newPage();
        
        // CDP Clear Cache & Disable Network Cache
        try {
            const client = await context.newCDPSession(page);
            await client.send('Network.clearBrowserCache');
            await client.send('Network.setCacheDisabled', { cacheDisabled: true });
            await context.clearCookies();
        } catch (e) {
            console.log('CDP Cache Clear notice:', e.message);
        }

        console.log(`Navigating to ${target.url}...`);
        await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
        await page.waitForTimeout(2000);

        // Dismiss popups
        const closeSelectors = [
            'button[class*="absolute right-0 -top-8"]',
            'img[src*="modal-close-img.svg"]',
            'span.style_closemenu__LjqMy',
            'button:has-text("Accept")',
            'button:has-text("Got it")',
            '.modal-close',
            '#close-login',
            '.close-login'
        ];
        for (const sel of closeSelectors) {
            const els = await page.$$(sel).catch(() => []);
            for (const el of els) {
                if (await el.isVisible().catch(() => false)) {
                    await el.click().catch(() => {});
                }
            }
        }

        // Force swap data-src lazy images
        await page.evaluate(() => {
            document.querySelectorAll('img[data-src], img[data-lazy], img[data-original]').forEach(img => {
                const src = img.getAttribute('data-src') || img.getAttribute('data-lazy') || img.getAttribute('data-original');
                if (src && !img.src.includes(src)) img.src = src;
            });
        });

        // Wait for all images to complete loading
        await page.evaluate(async () => {
            const imgs = Array.from(document.querySelectorAll('img'));
            await Promise.all(imgs.map(img => {
                if (img.complete && img.naturalWidth > 0) return Promise.resolve();
                return new Promise(resolve => {
                    const t = setTimeout(resolve, 3000);
                    img.addEventListener('load', () => { clearTimeout(t); resolve(); });
                    img.addEventListener('error', () => { clearTimeout(t); resolve(); });
                });
            })).catch(() => {});
        });

        // Freeze animation transitions
        await page.evaluate(() => {
            const style = document.createElement('style');
            style.innerHTML = `*, *::before, *::after { animation-play-state: paused !important; transition-duration: 0s !important; }`;
            document.head.appendChild(style);
        });

        await page.waitForTimeout(2000);

        // Extract main hero banner details
        const bannersInfo = await page.evaluate(() => {
            const bannerElements = Array.from(document.querySelectorAll('section img, .hero-banner img, .home-slider img, .banner-section img, img[src*="banner"], img[src*="sale"], img[src*="strip"], img[src*="slider"]'));
            return bannerElements.map(img => ({
                src: img.src,
                alt: img.alt || img.title || '',
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
                parentHref: img.closest('a') ? img.closest('a').href : ''
            }));
        });

        console.log(`Extracted ${bannersInfo.length} banner images on ${target.name}:`);
        bannersInfo.slice(0, 10).forEach((b, idx) => {
            console.log(`  [Banner ${idx+1}] ALT: "${b.alt}" | Width: ${b.naturalWidth} | SRC: ${b.src}`);
        });

        // Capture full page screenshot
        const fullScreenshotPath = path.join(screenshotsDir, `${target.prefix}_homepage_actual_full.png`);
        await page.screenshot({ path: fullScreenshotPath, fullPage: true });
        console.log(`📸 Full Page Screenshot saved to: ${fullScreenshotPath}`);

        // Capture viewport hero section screenshot
        const heroScreenshotPath = path.join(screenshotsDir, `${target.prefix}_homepage_actual_hero.png`);
        await page.screenshot({ path: heroScreenshotPath, fullPage: false });
        console.log(`📸 Hero Viewport Screenshot saved to: ${heroScreenshotPath}`);

        await page.close();
        await context.close();
    }

    await browser.close();
    console.log('\n✅ Actual Homepage Screenshot Capture Complete!');
})();
