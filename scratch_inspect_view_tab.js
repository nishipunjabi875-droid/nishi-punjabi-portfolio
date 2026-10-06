const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
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

  console.log('Navigating to Ticket Page...');
  await page.goto(config.ticketUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  console.log('Clicking "View Tickets" tab button...');
  const viewTicketsTab = page.locator('button:has-text("View Tickets")').first();
  if (await viewTicketsTab.isVisible()) {
    await viewTicketsTab.click();
    await page.waitForTimeout(3000);
  }

  const viewTabContent = await page.evaluate(() => {
    const text = (document.body.innerText || '');
    return text.substring(0, 2000).replace(/\s+/g, ' ');
  });

  console.log('View Tab Content Text:');
  console.log(viewTabContent);

  await browser.close();
})();
