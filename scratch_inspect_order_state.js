const { chromium } = require('playwright');
const path = require('path');

(async () => {
    console.log('Inspecting React State & Hidden Inputs after selecting order in drawer...');
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

    // Inspect drawer elements
    const drawerInfo = await page.evaluate(() => {
        const drawer = document.querySelector('div.style_sidebar__e3yOK, [class*="sidebar" i]');
        if (!drawer) return { error: 'Drawer not found' };

        const items = Array.from(drawer.querySelectorAll('div.border, div[class*="rounded"]')).map(el => {
            const cb = el.querySelector('input[type="checkbox"], input[type="radio"]');
            return {
                text: (el.textContent || '').trim().replace(/\s+/g, ' '),
                hasCb: !!cb,
                cbChecked: cb ? cb.checked : false,
                cbOuterHTML: cb ? cb.outerHTML : ''
            };
        }).filter(i => i.text.includes('Order ID'));

        return { items: items.slice(0, 5) };
    });

    console.log('Drawer Items before clicking:', JSON.stringify(drawerInfo, null, 2));

    // Click checkbox of first order card
    const drawer = page.locator('div.style_sidebar__e3yOK, [class*="sidebar" i]').last();
    const firstCard = drawer.locator('div.border, div[class*="rounded-lg"]').first();
    const cb = firstCard.locator('input[type="checkbox"]').first();

    if (await cb.isVisible().catch(() => false)) {
        console.log('Checking checkbox on first order card...');
        await cb.click({ force: true });
        await page.waitForTimeout(1000);
    } else {
        console.log('Clicking first order card div...');
        await firstCard.click({ force: true });
        await page.waitForTimeout(1000);
    }

    // Inspect form & selected state after clicking order
    const postClickState = await page.evaluate(() => {
        const orderDivText = document.querySelector('div[class*="font-pangram"]')?.textContent || 'Not found';
        const allInputs = Array.from(document.querySelectorAll('input')).map(i => ({
            name: i.name,
            id: i.id,
            type: i.type,
            value: i.value,
            checked: i.checked
        }));
        return { orderDivText, allInputs };
    });

    console.log('\n--- POST-CLICK STATE ---');
    console.log('Order Div Text:', postClickState.orderDivText);
    console.log('Inputs:', JSON.stringify(postClickState.allInputs.filter(i => i.value || i.name), null, 2));

    await page.waitForTimeout(3000);
    await browser.close();
})();
