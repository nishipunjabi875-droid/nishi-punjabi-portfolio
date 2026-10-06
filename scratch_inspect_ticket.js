const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

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

  console.log('Navigating...');
  await page.goto('https://www.woodenstreet.com/help-center/tickets?default=create', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  const selects = await page.evaluate(() => {
    const list = Array.from(document.querySelectorAll('select'));
    return list.map(s => ({
      name: s.name,
      id: s.id,
      className: s.className,
      visible: s.offsetParent !== null,
      disabled: s.disabled,
      optionsCount: s.options.length,
      options: Array.from(s.options).map(o => ({ text: o.text, val: o.value }))
    }));
  });

  console.log('ALL SELECTS ON LOAD:');
  console.dir(selects, { depth: null });

  // Now inspect the Order ID selector element!
  const orderIdInputs = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('*'));
    return els.filter(el => (el.innerText || '').includes('Click to select Order ID') || (el.placeholder || '').includes('Order ID'))
      .map(el => ({
        tag: el.tagName,
        text: el.innerText,
        placeholder: el.placeholder,
        className: el.className
      })).slice(0, 10);
  });

  console.log('ORDER ID SELECTOR TRIGGERS:');
  console.dir(orderIdInputs, { depth: null });

  await browser.close();
})();
