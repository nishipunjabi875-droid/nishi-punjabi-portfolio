const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const TicketHelper = require('../ticket-automation/utils/ticket-helper');

(async () => {
  console.log('==================================================');
  console.log('VERIFYING TICKET AUTOMATION FIXES');
  console.log('==================================================\n');

  const authPath = path.resolve(__dirname, '..', 'auth.json');
  console.log('Loading session from auth.json:', fs.existsSync(authPath));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: fs.existsSync(authPath) ? authPath : undefined,
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  console.log('1. Navigating to Help Center Ticket Creation page...');
  await page.goto('https://www.woodenstreet.com/help-center/tickets?default=create', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500);

  console.log('2. Discovering L1 Issue Types...');
  const l1Options = await TicketHelper.discoverL1Options(page);
  console.log(`   Found ${l1Options.length} L1 categories.`);

  console.log('3. Discovering L2 Sub-Issue Types for first L1...');
  const firstL1 = l1Options[0];
  const l2Options = await TicketHelper.discoverL2Options(page, firstL1);
  console.log(`   Found ${l2Options.length} L2 sub-categories for L1 "${firstL1.label}".`);

  const firstL2 = l2Options[0];

  console.log(`4. Submitting test ticket for [L1: "${firstL1.label}" | L2: "${firstL2.label}"]...`);
  const res = await TicketHelper.submitTicketAndVerify(page, firstL1.label, firstL2.label, '1207104');

  console.log('\n==================================================');
  console.log('VERIFICATION RESULT:');
  console.log(JSON.stringify(res, null, 2));
  console.log('==================================================\n');

  await browser.close();

  if (res && res.success && res.ticketId) {
    console.log('✅ Ticket Automation Verification PASSED successfully!');
    process.exit(0);
  } else {
    console.error('❌ Ticket Automation Verification FAILED!');
    process.exit(1);
  }
})();
