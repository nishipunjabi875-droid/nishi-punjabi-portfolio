const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://www.woodenstreet.com/product/lorenz-3-seater-sofa-cotton-jade-ivory', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  const swatches = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('*')).filter(el => {
      const txt = (el.innerText || '').trim();
      return (txt === '1 Seater' || txt === '2 Seater' || txt === '3 Seater' || txt === 'Jade Ivory') && el.clientWidth > 0;
    }).map(el => ({ tag: el.tagName, className: el.className, text: el.innerText.trim(), id: el.id }));
  });

  console.log('PDP Swatch Elements:', swatches);
  await browser.close();
})();
