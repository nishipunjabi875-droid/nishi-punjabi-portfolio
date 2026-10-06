const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false }); // run headed to see!
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log('Navigating to PDP...');
  await page.goto('https://www.woodenstreet.com/product/lorenz-3-seater-sofa-cotton-jade-ivory', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Dismiss popups
  await page.evaluate(() => {
    document.querySelectorAll('button[class*="close"], .modal-close, [aria-label="Close"]').forEach(b => b.click());
  }).catch(() => {});

  console.log('Clicking Add to Cart...');
  const atc = page.locator('button:has-text("ADD TO CART")').first();
  console.log('atc isVisible:', await atc.isVisible());
  if (await atc.isVisible()) {
    await atc.click();
    await page.waitForTimeout(4000);
  }

  console.log('Navigating to Cart...');
  await page.goto('https://www.woodenstreet.com/cart', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  console.log('Cart page URL:', page.url());
  console.log('Cart body text snippet:', (await page.innerText('body')).slice(0, 400));

  await browser.close();
})();
