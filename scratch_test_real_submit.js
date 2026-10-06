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

  // Monitor network responses
  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('freshdesk') || url.includes('ticket') || url.includes('help')) {
      console.log(`[NETWORK RESPONSE] ${res.status()} ${url}`);
      try {
        const text = await res.text();
        if (text.length < 1000) {
          console.log(`  Payload: ${text}`);
        } else {
          console.log(`  Payload length: ${text.length}`);
        }
      } catch (e) {}
    }
  });

  console.log('--- Step 1: Goto Ticket creation page ---');
  await page.goto(config.ticketUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  console.log('--- Step 2: Select Order ID ---');
  await TicketHelper.selectOrderId(page, config.orderId);

  console.log('--- Step 3: Select L1 & L2 ---');
  await TicketHelper.selectL1Option(page, { label: 'Order Status and tracking', value: 'Order Status and tracking' });
  await TicketHelper.selectL2Option(page, { label: 'Order Track', value: 'Order Track' });

  const testSubject = `QA Test - ${Date.now()}`;
  console.log(`Subject: ${testSubject}`);

  const subjectInput = page.getByRole('textbox', { name: 'Enter subject' }).or(page.locator('input[placeholder="Enter subject"]')).first();
  await subjectInput.fill(testSubject);

  const descInput = page.getByRole('textbox', { name: 'Describe your issue...' }).or(page.locator('textarea[placeholder="Describe your issue..."]')).first();
  await descInput.fill('QA test description for ticket creation automation');

  console.log('--- Step 4: Submit Ticket ---');
  const submitBtn = page.locator('#tabs-content button[type="submit"], form button[type="submit"], button.style_btn-primary__lUk_R, button[type="submit"], input[type="submit"]')
    .filter({ hasNotText: 'View Tickets' })
    .last();

  await submitBtn.click();
  console.log('Clicked submit button, waiting 5s...');
  await page.waitForTimeout(5000);

  console.log('--- Step 5: Switch to View Tickets tab by clicking tab button ---');
  const viewTicketsTab = page.locator('button:has-text("View Tickets")').first();
  if (await viewTicketsTab.isVisible()) {
    await viewTicketsTab.click();
    await page.waitForTimeout(4000);
  }

  const firstTicketText = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tr, div[class*="ticket" i], div.border'));
    return rows.map(r => (r.innerText || '').trim().replace(/\s+/g, ' ')).filter(t => t.includes('QA Test') || t.includes('Test'));
  });

  console.log('Found created tickets on View Tickets tab:');
  console.log(firstTicketText);

  await browser.close();
})();
