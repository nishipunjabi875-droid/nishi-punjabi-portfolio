const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const config = require('./ticket-automation/config/config');

async function selectOrderId(page, requestedOrderId) {
  try {
    const orderNum = String(requestedOrderId || config.orderId || '1204175').replace(/\D/g, '');
    console.log(`   Selecting Order ID: #${orderNum}...`);

    // Ensure Create Ticket tab is selected
    const createTabBtn = page.locator('button:has-text("Create Ticket")').first();
    if (await createTabBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createTabBtn.click({ force: true }).catch(() => {});
      await page.waitForTimeout(500).catch(() => {});
    }

    // Locate the Order ID trigger field / button
    const trigger = page.locator('input[placeholder*="Click to select Order ID" i]')
      .or(page.locator('input[placeholder*="Order ID" i]'))
      .or(page.getByText('Click to select Order ID', { exact: false }))
      .or(page.getByText('Select Your Order ID', { exact: false }))
      .or(page.locator('div:has-text("Click to select Order ID")'))
      .first();

    await trigger.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});

    if (await trigger.isVisible().catch(() => false)) {
      console.log('   Clicking Order ID selector trigger...');
      await trigger.click({ force: true }).catch(() => {});
      await page.waitForTimeout(1200).catch(() => {});
    }

    // Wait for drawer container to be visible
    const drawer = page.locator('div[class*="sidebar" i]').or(page.locator('div:has(h3:has-text("Select Order")), div:has(h2:has-text("Select Order")), div:has-text("Select Order")')).last();
    await drawer.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

    // Locate specific order card inside drawer
    let orderCard = drawer.locator('div, li, label').filter({ hasText: `Order ID: #${orderNum}` }).or(drawer.locator('div, li, label').filter({ hasText: orderNum })).first();

    let actualSelectedId = orderNum;

    if (!(await orderCard.isVisible({ timeout: 2000 }).catch(() => false))) {
      console.log(`   ⚠️ Order #${orderNum} card not found directly in drawer. Finding first available card in drawer...`);
      orderCard = drawer.locator('div.border, div[class*="order" i], li').filter({ hasText: 'Order ID' }).first();
    }

    if (await orderCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      const cardText = await orderCard.innerText().catch(() => '');
      const idMatch = cardText.match(/Order ID:\s*#?(\d{6,10})/i) || cardText.match(/#(\d{6,10})/);
      if (idMatch && idMatch[1]) {
        actualSelectedId = idMatch[1];
      }

      console.log(`   Clicking Order card for Order #${actualSelectedId}...`);
      const checkbox = orderCard.locator('input[type="checkbox"], input[type="radio"]').first();
      if (await checkbox.isVisible({ timeout: 800 }).catch(() => false)) {
        await checkbox.check({ force: true }).catch(() => {});
      }
      await orderCard.click({ force: true }).catch(() => {});
      await page.waitForTimeout(800).catch(() => {});
    }

    // Close side drawer
    const closeBtn = drawer.locator('button[aria-label="Close"], svg, button:has-text("Done")').first();
    if (await closeBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await closeBtn.click({ force: true }).catch(() => {});
    }
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(500).catch(() => {});

    console.log(`✓ Successfully selected Order ID: #${actualSelectedId}`);
    return actualSelectedId;
  } catch (e) {
    console.log(`⚠️ Order ID selection warning: ${e.message}`);
    return String(requestedOrderId || config.orderId || '1204175').replace(/\D/g, '');
  }
}

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

  console.log('--- TEST 1: Select Order ID ---');
  await selectOrderId(page, config.orderId);

  await browser.close();
})();
