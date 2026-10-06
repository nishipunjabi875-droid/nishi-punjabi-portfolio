const { chromium } = require('playwright');
const path = require('path');

(async () => {
    console.log('Testing direct checkbox click with dispatchEvent in drawer...');
    const authPath = path.resolve(__dirname, 'auth.json');
    
    const browser = await chromium.launch({ headless: false, slowMo: 500 });
    const context = await browser.newContext({ storageState: authPath });
    const page = await context.newPage();

    await page.goto('https://www.woodenstreet.com/help-center/tickets?default=create', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Click trigger to open drawer
    const trigger = page.getByText('Click to select Order ID', { exact: true })
        .or(page.locator('div:has-text("Click to select Order ID")')).first();
    await trigger.click({ force: true });
    await page.waitForTimeout(1500);

    const drawer = page.locator('div.style_sidebar__e3yOK, [class*="sidebar" i]').last();

    // Check checkbox inside target card or first card
    const targetOrderId = '1204175';
    console.log(`Searching for Order Card with ID #${targetOrderId}...`);

    const result = await page.evaluate((ordNum) => {
        const sidebar = document.querySelector('div.style_sidebar__e3yOK') || document.querySelector('[class*="sidebar" i]');
        if (!sidebar) return { error: 'Sidebar not found' };

        // Find card containing order number or get first card
        const cards = Array.from(sidebar.querySelectorAll('div.border, div[class*="rounded"]'));
        let targetCard = cards.find(c => c.textContent.includes(ordNum)) || cards[0];

        if (!targetCard) return { error: 'No order card found in sidebar' };

        const cb = targetCard.querySelector('input[type="checkbox"], input[type="radio"]');
        if (cb) {
            cb.scrollIntoView({ block: 'center' });
            cb.checked = true;
            cb.dispatchEvent(new Event('change', { bubbles: true }));
            cb.dispatchEvent(new Event('input', { bubbles: true }));
            cb.click();
            return { success: true, cardText: targetCard.textContent.trim().substring(0, 80) };
        } else {
            targetCard.scrollIntoView({ block: 'center' });
            targetCard.click();
            return { success: true, cardText: targetCard.textContent.trim().substring(0, 80), fallback: true };
        }
    }, targetOrderId);

    console.log('Evaluate result:', JSON.stringify(result, null, 2));
    await page.waitForTimeout(2000);

    // Close sidebar
    const closeBtn = drawer.locator('button.style_closeButton__dLuIk, button[aria-label="Close"], button:has-text("Done")').first();
    if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await closeBtn.click({ force: true }).catch(() => {});
    } else {
        await page.keyboard.press('Escape').catch(() => {});
    }
    await page.waitForTimeout(1500);

    // Check form dropdowns & selected order text
    const formState = await page.evaluate(() => {
        const orderDivText = document.querySelector('div[class*="font-pangram"]')?.textContent || 'Not found';
        const selects = Array.from(document.querySelectorAll('select')).map(s => ({
            name: s.name,
            optionsCount: s.options.length,
            options: Array.from(s.options).map(o => o.text.trim())
        }));
        return { orderDivText, selects };
    });

    console.log('\n--- FINAL FORM STATE AFTER ORDER SELECTION ---');
    console.log('Order Trigger Div Text:', formState.orderDivText);
    console.log('Select Dropdowns Count:', formState.selects.length);
    console.log('Select Dropdowns:', JSON.stringify(formState.selects, null, 2));

    await page.waitForTimeout(3000);
    await browser.close();
})();
