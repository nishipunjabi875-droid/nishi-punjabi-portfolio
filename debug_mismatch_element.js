const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    console.log('Locating exact DOM position of mismatch link #384...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    await page.goto('https://beta.teamwoodenstreet.com/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Scroll down to load all sections
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

    await page.waitForTimeout(2000);

    // Find the exact anchor element pointing to /all-sofa-cum-beds or having study table alt text
    const details = await page.evaluate(() => {
        const matches = [];
        const anchors = Array.from(document.querySelectorAll('a[href*="all-sofa-cum-beds"]'));
        
        anchors.forEach((a, i) => {
            const img = a.querySelector('img');
            const alt = img ? img.getAttribute('alt') : '';
            const src = img ? (img.src || img.getAttribute('data-src')) : '';
            
            // Get parent section title / header
            let sectionTitle = 'Unknown Section';
            let current = a.parentElement;
            for (let depth = 0; depth < 8; depth++) {
                if (!current) break;
                const heading = current.querySelector('h2, h3, h4, .section-title, .title, p.font-bold');
                if (heading && heading.innerText.trim()) {
                    sectionTitle = heading.innerText.trim();
                    break;
                }
                current = current.parentElement;
            }

            // Get outerHTML excerpt
            const outerHTML = a.outerHTML.substring(0, 300);

            matches.push({
                index: i + 1,
                href: a.href,
                alt,
                src,
                sectionTitle,
                outerHTML
            });
        });

        return matches;
    });

    console.log('Found matching elements:', JSON.stringify(details, null, 2));

    // Also search for any element with alt="woodenstreet - All Study Tables"
    const altMatches = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img[alt*="Study Tables"]'));
        return imgs.map(img => {
            const a = img.closest('a');
            return {
                imgAlt: img.getAttribute('alt'),
                imgSrc: img.src || img.getAttribute('data-src'),
                parentAnchorHref: a ? a.href : 'No parent <a> tag',
                outerHTML: img.parentElement ? img.parentElement.outerHTML.substring(0, 300) : ''
            };
        });
    });

    console.log('\nAll images with "Study Tables" in alt:', JSON.stringify(altMatches, null, 2));

    // Highlight and take a screenshot of the mismatch element if found
    const targetAnchor = await page.$('a[href*="all-sofa-cum-beds"]');
    if (targetAnchor) {
        await targetAnchor.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        // Add prominent red border to highlight in screenshot
        await targetAnchor.evaluate(el => {
            el.style.border = '5px solid red';
            el.style.outline = '5px solid yellow';
            el.style.boxShadow = '0 0 20px red';
        });
        await page.screenshot({ path: 'mismatch_element_highlighted.png' });
        console.log('Saved screenshot: mismatch_element_highlighted.png');
    }

    await browser.close();
})();
