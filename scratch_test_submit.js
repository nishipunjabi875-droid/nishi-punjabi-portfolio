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

  console.log('=== TEST 1 ===');
  await page.goto(config.ticketUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  await TicketHelper.selectOrderId(page, config.orderId);
  await TicketHelper.selectL1Option(page, { label: 'Order Status and tracking', value: 'Order Status and tracking' });
  await TicketHelper.selectL2Option(page, { label: 'Order Track', value: 'Order Track' });

  const res1 = await TicketHelper.submitTicketAndVerify(page, 'Order Status and tracking', 'Order Track', config.orderId);
  console.log('Result 1:', res1);

  console.log('\n=== TEST 2 ===');
  await TicketHelper.ensureOnTicketPage(page);
  await TicketHelper.selectOrderId(page, config.orderId);
  await TicketHelper.selectL1Option(page, { label: 'Delivery Related Concern', value: 'Order Placement to Shipment' });
  await TicketHelper.selectL2Option(page, { label: 'Delivery Delayed', value: 'Delivery Delayed' });

  const res2 = await TicketHelper.submitTicketAndVerify(page, 'Delivery Related Concern', 'Delivery Delayed', config.orderId);
  console.log('Result 2:', res2);

  await browser.close();
})();
