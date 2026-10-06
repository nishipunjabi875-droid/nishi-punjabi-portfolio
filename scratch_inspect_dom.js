const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://www.woodenstreet.com/wooden-sofa', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  
  const categoryFilters = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('*')).filter(el => {
      const txt = el.innerText || '';
      return txt.includes('PRICE RANGE') && txt.includes('FINISH') && el.children.length > 2 && el.clientWidth < 400;
    }).map(el => ({ tag: el.tagName, className: el.className, id: el.id }));
  });

  console.log('Category Filters (Sidebar specific):', categoryFilters);
  await browser.close();
})();
