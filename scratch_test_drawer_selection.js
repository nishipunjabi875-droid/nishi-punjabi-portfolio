const { chromium } = require('playwright');
const path = require('path');

(async () => {
    console.log('Testing Drawer Opening & Order ID selection details...');
    const authPath = path.resolve(__dirname, 'auth.json');
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ storageState: authPath });
    const page = await context.newPage();

    const targetUrl = 'https://www.woodenstreet.com/help-center/tickets?default=create';
    console.log(`Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Click trigger to open order selector drawer
    const trigger = page.locator('div:has-text("Click to select Order ID"), div:has-text("Order ID:"), div:has-text("Select Your Order ID")').first();
    console.log('Trigger text:', await trigger.textContent().catch(() => 'N/A'));
    await trigger.click({ force: true }).catch(() => {});
    await page.waitForTimeout(2000);

    // Inspect drawer contents
    const drawerDetails = await page.evaluate(() => {
        const drawer = document.querySelector('div.style_sidebar__e3yOK') || 
                       document.querySelector('[class*="sidebar" i]') || 
                       document.querySelector('div[class*="drawer" i]') ||
                       document.body;

        const orderCards = Array.from(drawer.querySelectorAll('div.border, li, div[class*="rounded"]')).map(el => {
            const text = (el.textContent || '').trim().replace(/\s+/g, ' ');
            const checkbox = el.querySelector('input[type="checkbox"], input[type="radio"]');
            return {
                text: text.substring(0, 100),
                hasCheckbox: !!checkbox,
                checkboxChecked: checkbox ? checkbox.checked : false,
                checkboxValue: checkbox ? checkbox.value : null,
                outerHTML: el.outerHTML.substring(0, 150)
            };
        }).filter(item => item.text.includes('Order ID') || item.text.includes('#'));

        const checkboxes = Array.from(drawer.querySelectorAll('input[type="checkbox"], input[type="radio"]')).map(cb => ({
            id: cb.id,
            name: cb.name,
            value: cb.value,
            checked: cb.checked,
            parentText: cb.parentElement ? cb.parentElement.textContent.trim().substring(0, 50) : ''
        }));

        return { orderCards, checkboxes };
    });

    console.log('\n--- DRAWER ORDER CARDS ---');
    console.log(JSON.stringify(drawerDetails.orderCards, null, 2));

    console.log('\n--- DRAWER CHECKBOXES ---');
    console.log(JSON.stringify(drawerDetails.checkboxes, null, 2));

    await browser.close();
})();
