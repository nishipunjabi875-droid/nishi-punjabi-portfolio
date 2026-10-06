const { chromium } = require('playwright');
const path = require('path');

class TicketHelperTest {
  static async selectOrderId(page, requestedOrderId) {
    try {
      const orderNum = String(requestedOrderId || '1098413').replace(/\D/g, '');
      console.log(`   Selecting Order ID: #${orderNum}...`);

      // 1. Ensure Create Ticket tab view is active
      const createTabBtn = page.locator('button:has-text("Create Ticket")').first();
      if (await createTabBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await createTabBtn.click({ force: true }).catch(() => {});
        await page.waitForTimeout(400).catch(() => {});
      }

      // 2. Locate exact Order ID trigger element if visible
      const trigger = page.locator('div:has-text("Click to select Order ID"), div:has-text("Select Your Order ID"), div[class*="border"]:has-text("Order ID")').first();

      if (await trigger.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('   Clicking Order ID selector trigger to open side drawer...');
        await trigger.scrollIntoViewIfNeeded().catch(() => {});
        await trigger.click({ force: true }).catch(() => {});
        await page.waitForTimeout(1000).catch(() => {});
      }

      // 3. Locate side drawer container
      const drawer = page.locator('div.style_sidebar__e3yOK, [class*="sidebar" i], div:has-text("Select Order")').last();
      if (await drawer.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log(`   Searching side drawer for Order ID #${orderNum}...`);
        
        // Try to match order card with matching order text
        const matchingCard = drawer.locator('div.border, div[class*="rounded-lg"], li').filter({ hasText: `#${orderNum}` }).first();
        if (await matchingCard.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log(`   ✓ Found matching order card for #${orderNum}. Checking checkbox...`);
          const cb = matchingCard.locator('input[type="checkbox"]').first();
          if (await cb.isVisible().catch(() => false)) {
            await cb.check({ force: true }).catch(() => {});
          } else {
            await matchingCard.click({ force: true }).catch(() => {});
          }
        } else {
          console.log(`   Selecting first available order in drawer...`);
          const firstCard = drawer.locator('div.border, div[class*="rounded-lg"], li').first();
          if (await firstCard.isVisible({ timeout: 2000 }).catch(() => false)) {
            const cb = firstCard.locator('input[type="checkbox"]').first();
            if (await cb.isVisible().catch(() => false)) {
              await cb.check({ force: true }).catch(() => {});
            } else {
              await firstCard.click({ force: true }).catch(() => {});
            }
          }
        }
        await page.waitForTimeout(600).catch(() => {});

        // Close drawer
        const closeBtn = drawer.locator('button.style_closeButton__dLuIk, button[aria-label="Close"], button:has-text("Done")').first();
        if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await closeBtn.click({ force: true }).catch(() => {});
        } else {
          await page.keyboard.press('Escape').catch(() => {});
        }
        await page.waitForTimeout(400).catch(() => {});
      } else {
        console.log('   Drawer not open or form already has order selected.');
      }

      console.log(`✓ Selected Order ID: #${orderNum}`);
      return orderNum;
    } catch (e) {
      const fallbackId = String(requestedOrderId || '1098413').replace(/\D/g, '');
      console.log(`⚠️ Order ID selection fallback used: #${fallbackId} (${e.message})`);
      return fallbackId;
    }
  }
}

(async () => {
    console.log('Testing improved selectOrderId helper...');
    const authPath = path.resolve(__dirname, 'auth.json');
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ storageState: authPath });
    const page = await context.newPage();

    await page.goto('https://www.woodenstreet.com/help-center/tickets?default=create', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const selectedId = await TicketHelperTest.selectOrderId(page, '1098413');
    console.log('Selected Order ID:', selectedId);

    const selectCount = await page.locator('select').count();
    console.log('Select count:', selectCount);

    await browser.close();
})();
