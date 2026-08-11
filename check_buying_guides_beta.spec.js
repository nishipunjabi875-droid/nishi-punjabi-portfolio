const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BUYING_GUIDE_URLS = [
    'https://beta.teamwoodenstreet.com/sofa-buying-guide',
    'https://beta.teamwoodenstreet.com/beds-buying-guide',
    'https://beta.teamwoodenstreet.com/dining-buying-guide',
    'https://beta.teamwoodenstreet.com/tv-unit-buying-guide',
    'https://beta.teamwoodenstreet.com/mattress-buying-guide',
    'https://beta.teamwoodenstreet.com/wardrobe-buying-guide'
];

test('Audit all Buying Guide pages on Beta environment for broken links, 404s, unlinked buttons, and redirections', async ({ page, request }) => {
    test.setTimeout(600000); // 10 minutes total timeout

    const allPageResults = [];

    for (const guideUrl of BUYING_GUIDE_URLS) {
        console.log(`\n======================================================`);
        console.log(`🔍 AUDITING BUYING GUIDE: ${guideUrl}`);
        console.log(`======================================================`);

        try {
            await page.goto(guideUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
        } catch (e) {
            console.error(`Failed to navigate to ${guideUrl}: ${e.message}`);
            allPageResults.push({
                guideUrl,
                pageTitle: 'Navigation Failed',
                error: e.message,
                elements: []
            });
            continue;
        }

        const pageTitle = await page.title();

        // Scroll to bottom to ensure dynamic elements & lazy images load
        await page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 350;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;
                    if (totalHeight >= scrollHeight) {
                        clearInterval(timer);
                        window.scrollTo(0, 0);
                        resolve();
                    }
                }, 80);
            });
        });

        // Extract all anchors, buttons, and clickable elements
        const extractedElements = await page.evaluate(() => {
            const elements = [];
            
            // 1. All <a> elements
            const anchors = Array.from(document.querySelectorAll('a'));
            anchors.forEach((a, idx) => {
                let text = (a.innerText || a.textContent || a.getAttribute('aria-label') || a.getAttribute('title') || '').trim().replace(/\s+/g, ' ');
                if (!text) {
                    const img = a.querySelector('img');
                    if (img) {
                        text = (img.getAttribute('alt') || img.getAttribute('title') || 'Image Link').trim();
                    }
                }
                if (!text) text = '[No Text / Icon Link]';

                const rawHref = a.getAttribute('href');
                const resolvedHref = a.href || (rawHref ? new URL(rawHref, document.baseURI).href : '');

                let section = 'Body';
                const container = a.closest('header, footer, nav, section, article, div[class*="header"], div[class*="footer"], div[id], div[class*="guide"]');
                if (container) {
                    if (a.closest('header, nav, .header, .top-header')) section = 'Header / Navigation';
                    else if (a.closest('footer, .footer, .bottom-footer')) section = 'Footer';
                    else {
                        const heading = container.querySelector('h1, h2, h3, h4, h5, h6');
                        if (heading) section = heading.innerText.trim().replace(/\s+/g, ' ');
                        else if (container.id) section = '#' + container.id;
                        else if (container.className && typeof container.className === 'string') {
                            section = '.' + container.className.split(' ')[0];
                        }
                    }
                }

                elements.push({
                    index: idx + 1,
                    elementType: 'Anchor (<a>)',
                    text,
                    rawHref,
                    resolvedHref,
                    section
                });
            });

            // 2. All <button> elements
            const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]'));
            buttons.forEach((btn, idx) => {
                let text = (btn.innerText || btn.textContent || btn.getAttribute('value') || btn.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ');
                if (!text) text = '[Button without Text]';

                const rawHref = btn.getAttribute('href') || btn.getAttribute('data-href') || btn.getAttribute('onclick') || null;
                const resolvedHref = rawHref && rawHref.startsWith('http') ? rawHref : (rawHref ? new URL(rawHref, document.baseURI).href : null);

                let section = 'Body';
                const container = btn.closest('header, footer, nav, section, article, div[class*="header"], div[class*="footer"], div[id]');
                if (container) {
                    if (btn.closest('header, nav, .header')) section = 'Header / Navigation';
                    else if (btn.closest('footer, .footer')) section = 'Footer';
                    else {
                        const heading = container.querySelector('h1, h2, h3, h4, h5, h6');
                        if (heading) section = heading.innerText.trim().replace(/\s+/g, ' ');
                        else if (container.id) section = '#' + container.id;
                    }
                }

                elements.push({
                    index: anchors.length + idx + 1,
                    elementType: 'Button (<button>)',
                    text,
                    rawHref,
                    resolvedHref,
                    section
                });
            });

            return elements;
        });

        console.log(`Extracted ${extractedElements.length} total links & buttons on ${guideUrl}`);

        // Classify links and filter candidates for HTTP auditing
        const itemsToAudit = [];
        const uniqueUrlMap = new Map();

        extractedElements.forEach(item => {
            const raw = item.rawHref ? item.rawHref.trim() : '';

            // Check if unlinked / dummy href
            if (!raw || raw === '#' || raw === 'javascript:void(0);' || raw === 'javascript:;' || raw.startsWith('javascript:')) {
                item.isUnlinked = true;
                item.statusCategory = 'Unlinked / Empty Href';
                item.statusCode = 'N/A';
                item.finalUrl = 'N/A';
                item.redirectionStatus = 'Unlinked Element';
                item.issueDescription = 'Element is missing target href or uses javascript/empty anchor';
            } else if (raw.startsWith('mailto:') || raw.startsWith('tel:') || raw.startsWith('whatsapp:')) {
                item.isUnlinked = false;
                item.statusCategory = 'Action Link (Email/Tel)';
                item.statusCode = 200;
                item.finalUrl = item.resolvedHref;
                item.redirectionStatus = 'Direct Link';
                item.issueDescription = 'None';
            } else {
                item.isUnlinked = false;
                if (!uniqueUrlMap.has(item.resolvedHref)) {
                    uniqueUrlMap.set(item.resolvedHref, []);
                }
                uniqueUrlMap.get(item.resolvedHref).push(item);
            }
        });

        const uniqueUrls = Array.from(uniqueUrlMap.keys());
        console.log(`Auditing ${uniqueUrls.length} unique URLs via HTTP batch requests...`);

        // Audit unique URLs in parallel batches
        const batchSize = 10;
        const urlAuditResults = new Map();

        for (let i = 0; i < uniqueUrls.length; i += batchSize) {
            const batch = uniqueUrls.slice(i, i + batchSize);

            await Promise.all(batch.map(async (targetUrl) => {
                try {
                    const response = await request.get(targetUrl, {
                        timeout: 15000,
                        maxRedirects: 10
                    });

                    const statusCode = response.status();
                    const finalUrl = response.url();

                    // Check if redirected
                    const isRedirected = (finalUrl !== targetUrl && finalUrl !== targetUrl + '/');
                    const is404 = (statusCode === 404);

                    let statusCategory = 'Valid (200 OK)';
                    let redirectionStatus = 'Direct Link';
                    let issueDescription = 'None';

                    if (is404) {
                        statusCategory = 'Broken (404 Not Found)';
                        issueDescription = 'Page returned 404 Not Found';
                    } else if (statusCode >= 400) {
                        statusCategory = `HTTP Error (${statusCode})`;
                        issueDescription = `HTTP status code ${statusCode}`;
                    } else if (isRedirected) {
                        statusCategory = 'Redirected';
                        redirectionStatus = `Redirected (${statusCode})`;
                        issueDescription = `Redirected from ${targetUrl} to ${finalUrl}`;
                    }

                    urlAuditResults.set(targetUrl, {
                        statusCode,
                        finalUrl,
                        isRedirected,
                        is404,
                        statusCategory,
                        redirectionStatus,
                        issueDescription
                    });

                    if (is404) {
                        console.log(`  ❌ [404] ${targetUrl}`);
                    } else if (isRedirected) {
                        console.log(`  ↪️ [Redirect] ${targetUrl} ===> ${finalUrl}`);
                    }
                } catch (err) {
                    urlAuditResults.set(targetUrl, {
                        statusCode: 'Error',
                        finalUrl: targetUrl,
                        isRedirected: false,
                        is404: false,
                        statusCategory: 'Fetch Error',
                        redirectionStatus: 'Failed',
                        issueDescription: err.message
                    });
                    console.log(`  ⚠️ [Fetch Error] ${targetUrl}: ${err.message}`);
                }
            }));
        }

        // Apply HTTP audit results back to extracted items
        extractedElements.forEach(item => {
            if (!item.isUnlinked && urlAuditResults.has(item.resolvedHref)) {
                const audit = urlAuditResults.get(item.resolvedHref);
                item.statusCode = audit.statusCode;
                item.finalUrl = audit.finalUrl;
                item.isRedirected = audit.isRedirected;
                item.is404 = audit.is404;
                item.statusCategory = audit.statusCategory;
                item.redirectionStatus = audit.redirectionStatus;
                item.issueDescription = audit.issueDescription;
            }
        });

        const guide404Count = extractedElements.filter(e => e.is404).length;
        const guideRedirectCount = extractedElements.filter(e => e.isRedirected).length;
        const guideUnlinkedCount = extractedElements.filter(e => e.isUnlinked).length;
        const guideValidCount = extractedElements.filter(e => e.statusCode === 200 && !e.isRedirected && !e.isUnlinked).length;

        console.log(`Summary for ${guideUrl}:`);
        console.log(`  Total Elements: ${extractedElements.length}`);
        console.log(`  Valid Links (200 OK Direct): ${guideValidCount}`);
        console.log(`  Redirected Links: ${guideRedirectCount}`);
        console.log(`  404 Broken Links: ${guide404Count}`);
        console.log(`  Unlinked / Empty Hrefs: ${guideUnlinkedCount}\n`);

        allPageResults.push({
            guideUrl,
            pageTitle,
            stats: {
                total: extractedElements.length,
                valid: guideValidCount,
                redirected: guideRedirectCount,
                broken404: guide404Count,
                unlinked: guideUnlinkedCount
            },
            elements: extractedElements
        });
    }

    // Save JSON results
    const resultsDir = path.join(__dirname, 'results');
    if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
    }

    const jsonPath = path.join(resultsDir, 'buying_guides_audit_raw.json');
    fs.writeFileSync(jsonPath, JSON.stringify(allPageResults, null, 2), 'utf-8');
    console.log(`\n✅ Saved raw audit results to: ${jsonPath}`);
});
