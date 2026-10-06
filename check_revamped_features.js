const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    console.log('Starting feature and visual inspection of revamped homepage...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 }
    });
    const page = await context.newPage();

    const issues = [];
    const consoleErrors = [];
    const networkFailures = [];

    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
        }
    });

    page.on('response', res => {
        if (res.status() >= 400) {
            networkFailures.push({ url: res.url(), status: res.status() });
        }
    });

    await page.goto('https://beta.teamwoodenstreet.com/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(3000);

    // 1. Check title & meta tags
    const title = await page.title();
    console.log('Page Title:', title);
    if (!title || title.includes('404') || title.includes('Error')) {
        issues.push({ type: 'Page Title Issue', detail: `Homepage title is suspicious: "${title}"` });
    }

    // 2. Check Search Bar
    console.log('Testing search bar functionality...');
    try {
        const searchInput = await page.$('input[name="search"], input[type="search"], input#search, input.search-input, .search-box input');
        if (!searchInput) {
            issues.push({ type: 'Search Bar Issue', detail: 'Could not find main search input on homepage.' });
        } else {
            await searchInput.fill('sofa');
            await page.waitForTimeout(1500);
            const suggestions = await page.$$('.auto-suggest, .search-dropdown, .suggestion-list, .search-results, ul.ui-autocomplete');
            console.log(`Auto-suggest dropdowns visible: ${suggestions.length}`);
        }
    } catch (e) {
        issues.push({ type: 'Search Bar Error', detail: e.message });
    }

    // 3. Check Header Icons (Cart, Wishlist, Profile, Pincode)
    console.log('Testing header interactive elements...');
    const cartIcon = await page.$('a[href*="cart"], .cart-icon, .header-cart, #cart-icon');
    if (!cartIcon) {
        issues.push({ type: 'Header Issue', detail: 'Cart icon link not found in header.' });
    }

    // 4. Check for broken images (src present but not loading)
    const brokenImgs = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs.filter(img => {
            return img.src && img.complete && (img.naturalWidth === 0 || img.naturalHeight === 0);
        }).map(img => ({ src: img.src, alt: img.alt, outerHTML: img.outerHTML.substring(0, 150) }));
    });

    if (brokenImgs.length > 0) {
        console.log(`Found ${brokenImgs.length} broken images.`);
    }

    // 5. Check duplicate or invalid CTA buttons
    const ctas = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a.btn, a.button, .cta'));
        const invalidCtas = [];
        buttons.forEach(b => {
            const text = (b.innerText || '').trim();
            const href = b.getAttribute('href');
            const onclick = b.getAttribute('onclick');
            if (b.tagName.toLowerCase() === 'a' && (!href || href === '#' || href === 'javascript:void(0);') && !onclick) {
                invalidCtas.push({ text, href, tag: b.tagName });
            }
        });
        return invalidCtas;
    });

    console.log(`Unlinked CTA buttons found: ${ctas.length}`);

    // Save report
    const output = {
        title,
        consoleErrorsCount: consoleErrors.length,
        consoleErrorsSample: consoleErrors.slice(0, 10),
        networkFailuresCount: networkFailures.length,
        networkFailuresSample: networkFailures.slice(0, 15),
        brokenImagesCount: brokenImgs.length,
        brokenImages: brokenImgs,
        unlinkedCTAButtonsCount: ctas.length,
        unlinkedCTAButtons: ctas,
        issuesFound: issues
    };

    fs.writeFileSync('revamped_features_audit.json', JSON.stringify(output, null, 2));
    console.log('Feature inspection report saved to revamped_features_audit.json');

    await browser.close();
})();
