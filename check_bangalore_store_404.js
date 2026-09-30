const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    console.log('Starting 404 Link Audit for https://www.woodenstreet.com/furniture-store-bangalore ...');
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    const targetUrl = 'https://www.woodenstreet.com/furniture-store-bangalore';
    
    try {
        console.log(`Navigating to ${targetUrl}...`);
        const initialRes = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        console.log(`Initial page response status: ${initialRes ? initialRes.status() : 'N/A'}`);

        // Wait a bit and scroll down to load lazy components
        await page.waitForTimeout(3000);
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

        // Extract links
        const extractedLinks = await page.evaluate(() => {
            const anchors = Array.from(document.querySelectorAll('a[href]'));
            const imageSources = Array.from(document.querySelectorAll('img[src]'));

            const anchorLinks = anchors.map(a => ({
                type: 'anchor',
                text: (a.textContent || '').trim().replace(/\s+/g, ' '),
                href: a.getAttribute('href'),
                fullUrl: a.href
            }));

            const imgLinks = imageSources.map(img => ({
                type: 'image',
                text: img.alt || 'Image',
                href: img.getAttribute('src'),
                fullUrl: img.src
            }));

            return [...anchorLinks, ...imgLinks];
        });

        console.log(`Total anchor/image items extracted from DOM: ${extractedLinks.length}`);

        // Filter and normalize
        const linkMap = new Map();

        for (const item of extractedLinks) {
            if (!item.fullUrl) continue;
            let rawHref = item.href || '';
            if (rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:') || rawHref.startsWith('#') || rawHref.startsWith('whatsapp:')) {
                continue;
            }

            try {
                const parsed = new URL(item.fullUrl, targetUrl);
                if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') continue;

                const cleanUrl = parsed.href;
                if (!linkMap.has(cleanUrl)) {
                    linkMap.set(cleanUrl, {
                        url: cleanUrl,
                        type: item.type,
                        sampleText: item.text.substring(0, 80),
                        occurrences: 1
                    });
                } else {
                    linkMap.get(cleanUrl).occurrences += 1;
                }
            } catch (e) {
                // Invalid URL
            }
        }

        const uniqueUrls = Array.from(linkMap.values());
        console.log(`Found ${uniqueUrls.length} unique HTTP(S) links/assets to audit.\n`);

        const results = {
            targetUrl,
            scannedAt: new Date().toISOString(),
            totalUniqueUrlsChecked: uniqueUrls.length,
            status404: [],
            otherErrors: [],
            soft404: [],
            passed: 0
        };

        const concurrency = 8;
        let index = 0;

        async function worker() {
            while (index < uniqueUrls.length) {
                const item = uniqueUrls[index++];
                const linkUrl = item.url;

                try {
                    // Try fetch via API request context
                    const res = await context.request.get(linkUrl, {
                        timeout: 15000,
                        maxRedirects: 10
                    });

                    const status = res.status();
                    if (status === 404) {
                        console.log(`❌ [404] ${linkUrl} (Text: "${item.sampleText}")`);
                        results.status404.push({ ...item, status, error: 'HTTP 404 Not Found' });
                    } else if (status >= 400) {
                        console.log(`⚠️ [${status}] ${linkUrl} (Text: "${item.sampleText}")`);
                        results.otherErrors.push({ ...item, status, error: `HTTP Status ${status}` });
                    } else {
                        // Optional check for Soft 404 on HTML pages
                        const contentType = res.headers()['content-type'] || '';
                        if (contentType.includes('text/html') && item.type === 'anchor') {
                            const body = await res.text();
                            if (body.includes('<title>404') || body.includes('Page Not Found') || body.includes('404 - Page Not Found')) {
                                console.log(`🔍 [SOFT 404] ${linkUrl}`);
                                results.soft404.push({ ...item, status, error: 'Soft 404 detected in page content' });
                            } else {
                                results.passed++;
                            }
                        } else {
                            results.passed++;
                        }
                    }
                } catch (err) {
                    console.log(`⚠️ [FETCH ERROR] ${linkUrl} - ${err.message}`);
                    results.otherErrors.push({ ...item, status: 'NETWORK_ERROR', error: err.message });
                }
            }
        }

        const workers = [];
        for (let i = 0; i < concurrency; i++) {
            workers.push(worker());
        }
        await Promise.all(workers);

        console.log('\n================ AUDIT SUMMARY ================');
        console.log(`Total Checked: ${results.totalUniqueUrlsChecked}`);
        console.log(`Passed (200 OK): ${results.passed}`);
        console.log(`Hard 404 Links: ${results.status404.length}`);
        console.log(`Soft 404 Links: ${results.soft404.length}`);
        console.log(`Other Errors/Statuses: ${results.otherErrors.length}`);
        console.log('===============================================\n');

        fs.writeFileSync('bangalore_store_404_report.json', JSON.stringify(results, null, 2));
        console.log('Saved report to bangalore_store_404_report.json');

    } catch (err) {
        console.error('Audit failed with error:', err);
    } finally {
        await browser.close();
    }
})();
