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

  console.log('--- 1. First trigger click (unselected) ---');
  const trigger = page.getByText('Click to select Order ID', { exact: true })
    .or(page.locator('div[class*="border"]').filter({ hasText: 'Order ID' }))
    .first();

  console.log('Trigger visible?:', await trigger.isVisible());
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click({ force: true });
  await page.waitForTimeout(1500);

  // Click card to select order via evaluate
  console.log('--- 2. Click card in drawer via evaluate ---');
  const drawer = page.locator('.style_sidebar__e3yOK, [class*="sidebar" i]').last();
  const card = drawer.locator('div.border, li').first();
  await card.evaluate(el => el.click()).catch(() => {});
  await page.waitForTimeout(1500);

  const textAfter = await trigger.innerText().catch(() => '');
  console.log('Trigger text after order selected:', textAfter.replace(/\s+/g, ' '));

  console.log('--- 3. Second trigger click (when ALREADY selected) ---');
  console.log('Is trigger still visible?:', await trigger.isVisible());
  await trigger.click({ force: true });
  await page.waitForTimeout(1500);

  const drawerVisible2 = await drawer.isVisible().catch(() => false);
  console.log('Is drawer visible on second click?:', drawerVisible2);

  await browser.close();
})();
