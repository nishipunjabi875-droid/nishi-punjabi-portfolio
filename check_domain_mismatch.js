const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://beta.teamwoodenstreet.com/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Hover top nav to populate mega menus
    const navItems = await page.$$('header ul li, header nav a');
    for (let i = 0; i < Math.min(navItems.length, 30); i++) {
        try { await navItems[i].hover({ timeout: 500 }).catch(() => {}); } catch(e) {}
    }

    const domainAnalysis = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a'));
        const betaLinks = [];
        const prodLinks = [];
        const relativeLinks = [];
        const otherLinks = [];

        anchors.forEach(a => {
            const rawHref = a.getAttribute('href') || '';
            const fullHref = a.href;
            const text = (a.innerText || '').trim().substring(0, 60);

            if (rawHref.startsWith('/')) {
                relativeLinks.push({ text, rawHref, fullHref });
            } else if (rawHref.includes('beta.teamwoodenstreet.com')) {
                betaLinks.push({ text, rawHref });
            } else if (rawHref.includes('www.woodenstreet.com')) {
                prodLinks.push({ text, rawHref });
            } else {
                otherLinks.push({ text, rawHref });
            }
        });

        return {
            totalAnchors: anchors.length,
            relativeLinksCount: relativeLinks.length,
            betaLinksCount: betaLinks.length,
            prodLinksCount: prodLinks.length,
            otherLinksCount: otherLinks.length,
            prodLinksSample: prodLinks.slice(0, 20)
        };
    });

    fs.writeFileSync('domain_mismatch_report.json', JSON.stringify(domainAnalysis, null, 2));
    console.log(JSON.stringify(domainAnalysis, null, 2));
    await browser.close();
})();
