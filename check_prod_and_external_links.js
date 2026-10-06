const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://beta.teamwoodenstreet.com/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const report = JSON.parse(fs.readFileSync('domain_mismatch_report.json', 'utf8'));
    const prodLinks = report.prodLinksSample;

    console.log('Testing hardcoded production links status...');
    for (const item of prodLinks) {
        try {
            const res = await page.request.get(item.rawHref, { timeout: 15000 });
            console.log(`URL: ${item.rawHref} | Status: ${res.status()}`);
        } catch (e) {
            console.log(`URL: ${item.rawHref} | Error: ${e.message}`);
        }
    }

    await browser.close();
})();
