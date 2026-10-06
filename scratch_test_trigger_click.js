const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const authPath = path.resolve(__dirname, 'auth.json');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: fs.existsSync(authPath) ? authPath : undefined
  });
  const page = await context.newPage();

  console.log('Navigating to Ticket Page...');
  await page.goto('https://www.woodenstreet.com/help-center/tickets?default=create', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const trigger = page.locator('div').filter({ hasText: /^Click to select Order ID$/ }).first();
  console.log('Is trigger visible?:', await trigger.isVisible());

  if (await trigger.isVisible()) {
    console.log('Clicking trigger...');
    await trigger.click();
    await page.waitForTimeout(2000);

    const isDrawerVisible = await page.locator('.style_sidebar__e3yOK').isVisible().catch(() => false);
    console.log('Is side drawer visible after click?:', isDrawerVisible);
  }

  await browser.close();
})();
