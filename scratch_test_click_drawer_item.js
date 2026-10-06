const { chromium } = require('playwright');
const path = require('path');

(async () => {
    console.log('Testing scrolling drawer and clicking order card...');
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
    console.log('Drawer visible:', await drawer.isVisible());

    // Find card with order 1204175
    const orderCard = drawer.locator('div.border.rounded-lg, div.border').filter({ hasText: '1204175' }).first();
    console.log('Order card 1204175 count:', await orderCard.count());

    if (await orderCard.count() > 0) {
        console.log('Scrolling order card into view in drawer...');
        await orderCard.evaluate(el => {
            el.scrollIntoView({ block: 'center', inline: 'center' });
            el.click();
        });
        await page.waitForTimeout(1500);
    }

    // Check selected state after clicking order
    const afterState = await page.evaluate(() => {
        const orderDivText = document.querySelector('div[class*="font-pangram"]')?.textContent || 'Not found';
        const checkboxState = Array.from(document.querySelectorAll('input[type="checkbox"]')).map(cb => ({ checked: cb.checked, text: cb.parentElement?.textContent?.trim().substring(0, 40) }));
        return { orderDivText, checkboxState: checkboxState.filter(c => c.checked) };
    });

    console.log('\n--- AFTER SCROLL & CLICK STATE ---');
    console.log('Selected Order Div Text:', afterState.orderDivText);
    console.log('Checked Checkboxes:', JSON.stringify(afterState.checkboxState, null, 2));

    await page.waitForTimeout(3000);
    await browser.close();
})();
