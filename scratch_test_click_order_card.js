const { chromium } = require('playwright');
const path = require('path');

(async () => {
    console.log('Testing clicking specific order card in drawer...');
    const authPath = path.resolve(__dirname, 'auth.json');
    
    const browser = await chromium.launch({ headless: false, slowMo: 500 });
    const context = await browser.newContext({ storageState: authPath });
    const page = await context.newPage();

    const targetUrl = 'https://www.woodenstreet.com/help-center/tickets?default=create';
    console.log(`Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Click trigger to open order selector drawer
    const trigger = page.locator('div:has-text("Click to select Order ID"), div:has-text("Order ID:"), div:has-text("Select Your Order ID")').first();
    console.log('Clicking trigger div...');
    await trigger.click({ force: true }).catch(() => {});
    await page.waitForTimeout(1500);

    // Target a specific order card or first order card in side drawer
    const targetOrderId = '1098413';
    console.log(`Searching for Order Card with ID #${targetOrderId}...`);

    const drawer = page.locator('div.style_sidebar__e3yOK, [class*="sidebar" i], div:has-text("Select Order")').last();

    // Find card with matching order text
    const matchingCard = drawer.locator('div.border, div[class*="rounded-lg"]').filter({ hasText: `#${targetOrderId}` }).first();
    
    if (await matchingCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`Found matching order card for #${targetOrderId}. Clicking...`);
        // Click checkbox inside matching card or click matching card
        const cb = matchingCard.locator('input[type="checkbox"]').first();
        if (await cb.isVisible().catch(() => false)) {
            await cb.check({ force: true });
        } else {
            await matchingCard.click({ force: true });
        }
    } else {
        console.log(`Matching card #${targetOrderId} not found, clicking first available order card...`);
        const firstCard = drawer.locator('div.border, div[class*="rounded-lg"]').first();
        const cb = firstCard.locator('input[type="checkbox"]').first();
        if (await cb.isVisible().catch(() => false)) {
            await cb.check({ force: true });
        } else {
            await firstCard.click({ force: true });
        }
    }

    await page.waitForTimeout(1000);

    // Close side drawer overlay
    console.log('Closing side drawer...');
    const closeBtn = drawer.locator('button.style_closeButton__dLuIk, button[aria-label="Close"], button:has-text("Done")').first();
    if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await closeBtn.click({ force: true }).catch(() => {});
    } else {
        await page.keyboard.press('Escape').catch(() => {});
    }

    await page.waitForTimeout(1500);

    // Inspect select dropdowns after selecting order
    const selectCount = await page.locator('select').count();
    console.log(`Select dropdowns visible on form after selection: ${selectCount}`);

    const selectsInfo = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('select')).map(s => ({
            name: s.name,
            options: Array.from(s.options).map(o => o.text.trim())
        }));
    });
    console.log('Dropdowns:', JSON.stringify(selectsInfo, null, 2));

    await page.waitForTimeout(3000);
    await browser.close();
})();
