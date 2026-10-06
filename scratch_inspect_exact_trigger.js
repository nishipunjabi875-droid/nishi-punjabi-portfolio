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

  const triggerInfo = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    const matches = all.filter(el => {
      const children = Array.from(el.children);
      return children.length === 0 && ((el.innerText || '').includes('Click to select Order ID') || (el.placeholder || '').includes('Order ID'));
    });

    return matches.map(m => ({
      tag: m.tagName,
      text: m.innerText,
      placeholder: m.placeholder,
      className: m.className,
      id: m.id,
      parentTag: m.parentElement ? m.parentElement.tagName : null,
      parentClass: m.parentElement ? m.parentElement.className : null
    }));
  });

  console.log('EXACT TRIGGER LEAF ELEMENTS:');
  console.log(JSON.stringify(triggerInfo, null, 2));

  await browser.close();
})();
