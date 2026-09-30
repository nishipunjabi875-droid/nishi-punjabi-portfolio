const { test, expect } = require('@playwright/test');

test('Check 404 links on WoodenStreet Bangalore Store page', async ({ page, request }) => {
    test.setTimeout(180000);
    const targetUrl = 'https://www.woodenstreet.com/furniture-store-bangalore';
    
    console.log(`\nNavigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

    // Scroll to ensure lazy assets/links load
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 500;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight || totalHeight > 15000) {
                    clearInterval(timer);
                    resolve();
                }
            }, 200);
        });
    });

    const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href]'))
            .map(a => a.href)
            .filter(href => {
                return href && 
                       href.startsWith('https://www.woodenstreet.com') && 
                       !href.startsWith('javascript:') && 
                       !href.startsWith('mailto:') && 
                       !href.startsWith('tel:') &&
                       !href.startsWith('#');
            });
    });

    const uniqueLinks = [...new Set(links)];
    console.log(`Found ${uniqueLinks.length} unique internal links to check on the Bangalore store page.\n`);

    const brokenLinks = [];
    const batchSize = 10;

    for (let i = 0; i < uniqueLinks.length; i += batchSize) {
        const batch = uniqueLinks.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (link) => {
            try {
                const response = await request.get(link, { timeout: 15000 });
                const status = response.status();
                
                if (status === 404) {
                    brokenLinks.push({ url: link, status: 404 });
                    console.log(`❌ [404] Not Found: ${link}`);
                } else if (status >= 400) {
                    console.log(`⚠️ [${status}] Error Status: ${link}`);
                }
            } catch (error) {
                console.log(`⚠️ [Fetch Error] ${link} - ${error.message}`);
                brokenLinks.push({ url: link, status: 'Error', message: error.message });
            }
        }));
    }

    console.log('\n====== FINAL REPORT ======');
    if (brokenLinks.length === 0) {
        console.log('✅ SUCCESS: No 404 or broken internal links found on the Bangalore store page!');
    } else {
        console.log(`🚨 FAILURE: Found ${brokenLinks.length} broken/failed link(s):\n`);
        brokenLinks.forEach((bl, index) => {
            console.log(`${index + 1}. URL: ${bl.url} | Status: ${bl.status}`);
        });
    }
    console.log('==========================\n');

    expect(brokenLinks.length, `Test failed because ${brokenLinks.length} broken links were found.`).toBe(0);
});
