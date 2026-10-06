const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  // Desktop
  const desktopCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const dPage = await desktopCtx.newPage();
  await dPage.goto('https://www.woodenstreet.com/product/lorenz-3-seater-sofa-cotton-jade-ivory', { waitUntil: 'domcontentloaded' });
  const atc = dPage.locator('button:has-text("ADD TO CART")').first();
  if (await atc.isVisible({ timeout: 5000 }).catch(() => false)) {
    await atc.click({ force: true });
    await dPage.waitForTimeout(3000);
  }
  await dPage.goto('https://www.woodenstreet.com/cart', { waitUntil: 'domcontentloaded' });
  await dPage.waitForTimeout(3000);
  
  console.log('--- Desktop Cart Selectors ---');
  console.log('h1/h2 text:', await dPage.locator('h1, h2, [class*="title" i]').allInnerTexts().catch(() => []));
  console.log('cart items count:', await dPage.locator('.cart-item, .cart-list-item, div[class*="cartItem" i], [class*="cart-item" i]').count());
  console.log('price details/order summary count:', await dPage.locator('[class*="orderSummary" i], [class*="priceDetails" i], [class*="cartSummary" i]').count());

  // Mobile
  const mPage = await desktopCtx.newPage();
  await mPage.setViewportSize({ width: 375, height: 812 });
  await mPage.goto('https://www.woodenstreet.com/cart', { waitUntil: 'domcontentloaded' });
  await mPage.waitForTimeout(3000);

  console.log('\n--- Mobile Cart Selectors ---');
  console.log('mPage url:', mPage.url());
  console.log('mPage h1/h2 text:', await mPage.locator('h1, h2, [class*="title" i]').allInnerTexts().catch(() => []));
  console.log('mPage cart items count:', await mPage.locator('.cart-item, .cart-list-item, div[class*="cartItem" i], [class*="cart-item" i]').count());

  await browser.close();
})();
