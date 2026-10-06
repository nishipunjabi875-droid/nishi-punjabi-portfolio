const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // Add product to cart first
  await page.goto('https://www.woodenstreet.com/product/lorenz-3-seater-sofa-cotton-jade-ivory', { waitUntil: 'domcontentloaded' });
  const atc = page.locator('button:has-text("ADD TO CART")').first();
  if (await atc.isVisible({ timeout: 5000 }).catch(() => false)) {
    await atc.click({ force: true });
    await page.waitForTimeout(3000);
  }

  console.log('Navigating to cart page...');
  await page.goto('https://www.woodenstreet.com/cart', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  console.log('Clicking Place Order button...');
  const placeOrderBtn = page.locator('button#placeOrder, button:has-text("PLACE ORDER"), button:has-text("CONFIRM ORDER")').first();
  if (await placeOrderBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await placeOrderBtn.click({ force: true });
    await page.waitForTimeout(4000);
  }

  console.log('URL after Place Order:', page.url());

  const guestInfo = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input')).map(i => ({
      id: i.id, name: i.name, type: i.type, placeholder: i.placeholder, className: i.className
    }));
    const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]')).map(b => ({
      text: (b.innerText || b.value || '').trim(), className: b.className
    }));
    const text = document.body.innerText;

    return { inputs, buttons, bodySnippet: text.slice(0, 500) };
  });

  console.log('Inputs after Place Order:', guestInfo.inputs);
  console.log('Buttons after Place Order:', guestInfo.buttons);
  console.log('Body snippet:', guestInfo.bodySnippet);

  await browser.close();
})();
