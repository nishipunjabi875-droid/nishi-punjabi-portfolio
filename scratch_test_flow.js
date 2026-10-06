const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const TicketHelper = require('./ticket-automation/utils/ticket-helper');
const config = require('./ticket-automation/config/config');

(async () => {
  const authPath = path.resolve(__dirname, 'auth.json');
  const browser = await chromium.launch({ headless: true });
  
  let contextOptions = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  if (fs.existsSync(authPath)) {
    contextOptions.storageState = authPath;
  }

  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  console.log('--- Step 1: Goto create ticket ---');
  await page.goto(config.ticketUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  console.log('--- Step 2: Select Order ID for test 1 ---');
  await TicketHelper.selectOrderId(page, config.orderId);

  console.log('--- Step 3: Navigate to View Tickets (simulating submitTicketAndVerify) ---');
  await page.goto('https://www.woodenstreet.com/help-center/tickets?default=view', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  console.log('--- Step 4: Call ensureOnTicketPage for test 2 ---');
  await TicketHelper.ensureOnTicketPage(page);
  await page.waitForTimeout(2000);

  console.log('URL now:', page.url());
  console.log('Select count on page now:', await page.locator('select').count());
  console.log('Is l1Select visible now?:', await page.locator('select').first().isVisible());

  console.log('--- Step 5: Call selectOrderId for test 2 ---');
  await TicketHelper.selectOrderId(page, config.orderId);

  console.log('--- Step 6: Call selectL1Option for test 2 ---');
  try {
    await TicketHelper.selectL1Option(page, { label: 'Delivery Related Concern', value: 'Order Placement to Shipment' });
    console.log('SUCCESS: L1 selected!');
  } catch (e) {
    console.error('FAILED IN TEST 2:', e.message);
  }

  await browser.close();
})();
