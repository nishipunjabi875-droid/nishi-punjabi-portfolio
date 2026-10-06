const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('https://www.woodenstreet.com/product/lorenz-3-seater-sofa-cotton-jade-ivory', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const atc = page.locator('button:has-text("ADD TO CART")').first();
  if (await atc.isVisible()) {
    await atc.click();
    await page.waitForTimeout(4000);
  }

  await page.goto('https://www.woodenstreet.com/cart', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  const divs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('div, section, article, tr, li'))
      .filter(el => el.className && typeof el.className === 'string' && (el.className.includes('cart') || el.className.includes('Cart') || el.className.includes('product') || el.className.includes('item')))
      .map(el => ({ tag: el.tagName, className: el.className, textSnippet: (el.innerText || '').slice(0, 50) }));
  });

  console.log('Cart DOM elements with class:', JSON.stringify(divs, null, 2));
  await browser.close();
})();
