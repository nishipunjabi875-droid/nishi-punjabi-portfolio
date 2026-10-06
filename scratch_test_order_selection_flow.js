const { chromium } = require('playwright');
const path = require('path');
const TicketHelper = require('./ticket-automation/utils/ticket-helper');
const config = require('./ticket-automation/config/config');

(async () => {
    console.log('Testing Order ID Selection Flow with TicketHelper...');
    const authPath = path.resolve(__dirname, 'auth.json');
    
    const browser = await chromium.launch({ headless: false, slowMo: 300 });
    const context = await browser.newContext({ storageState: authPath });
    const page = await context.newPage();

    const targetUrl = config.ticketUrl;
    console.log(`Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    console.log('Calling TicketHelper.selectOrderId...');
    const selectedId = await TicketHelper.selectOrderId(page, '1098413');
    console.log(`Returned selected order ID: ${selectedId}`);

    // Check if dropdowns appeared
    const selectCount = await page.locator('select').count();
    console.log(`Select dropdowns visible on page: ${selectCount}`);

    if (selectCount > 0) {
        const l1Options = await TicketHelper.discoverL1Options(page);
        console.log(`Discovered L1 Options (${l1Options.length}):`, l1Options);
    } else {
        console.log('❌ Select dropdowns did NOT appear after selecting Order ID!');
    }

    await page.waitForTimeout(5000);
    await browser.close();
})();
