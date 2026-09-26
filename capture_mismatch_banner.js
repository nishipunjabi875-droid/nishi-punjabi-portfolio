const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    await page.goto('https://beta.teamwoodenstreet.com/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Find the banner image with src containing all-sofa-cum-beds.jpg
    const bannerInfo = await page.evaluate(() => {
        const img = document.querySelector('img[src*="all-sofa-cum-beds.jpg"]');
        if (!img) return null;

        const a = img.closest('a');
        return {
            imgSrc: img.src,
            imgAlt: img.getAttribute('alt'),
            href: a ? a.href : null,
            parentHTML: a ? a.outerHTML.substring(0, 400) : ''
        };
    });

    console.log('Banner Info:', JSON.stringify(bannerInfo, null, 2));

    // Scroll to the element and screenshot
    const element = await page.$('img[src*="all-sofa-cum-beds.jpg"]');
    if (element) {
        await element.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);

        // Add visual indicator box
        await element.evaluate(el => {
            const parent = el.closest('a');
            if (parent) {
                parent.style.border = '6px solid #ef4444';
                parent.style.boxShadow = '0 0 25px rgba(239, 68, 68, 0.8)';
            }
        });

        await page.screenshot({ path: 'mismatch_banner_location.png' });
        console.log('Saved screenshot to mismatch_banner_location.png');
    }

    await browser.close();
})();
