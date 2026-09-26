const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://beta.teamwoodenstreet.com/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // 1. Inspect missing alt images
    const missingAltImages = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs.filter(img => !img.getAttribute('alt') || img.getAttribute('alt').trim() === '').map(img => ({
            src: img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy'),
            className: img.className,
            parentClass: img.parentElement ? img.parentElement.className : ''
        }));
    });

    console.log('Images missing alt text count:', missingAltImages.length);
    console.log(JSON.stringify(missingAltImages, null, 2));

    // 2. Test search bar interaction
    console.log('\nTesting Search Bar...');
    const searchSelectors = ['input[name="keyword"]', '#search', 'input[placeholder*="Search"]', '.search-input'];
    for (const sel of searchSelectors) {
        const input = await page.$(sel);
        if (input) {
            console.log(`Found search input with selector: ${sel}`);
            await input.click();
            await input.fill('sofa');
            await page.waitForTimeout(2000);
            
            // Capture network or DOM dropdown elements
            const dropdownHTML = await page.evaluate(() => {
                const containers = document.querySelectorAll('.search-dropdown, .search-result, .autocomplete, .autosuggest, ul.search-list, div[class*="search"]');
                return Array.from(containers).map(c => ({ class: c.className, id: c.id, text: c.innerText.substring(0, 100) }));
            });
            console.log('Search Dropdown Elements in DOM:', dropdownHTML);
            break;
        }
    }

    await browser.close();
})();
