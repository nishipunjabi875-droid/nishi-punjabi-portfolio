const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const authPath = path.resolve(__dirname, 'auth.json');
  const browser = await chromium.launch({ headless: true });
  
  let contextOptions = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 }
  };

  if (fs.existsSync(authPath)) {
    contextOptions.storageState = authPath;
  }

  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  console.log('Navigating to Help Center Tickets page...');
  await page.goto('https://www.woodenstreet.com/help-center/tickets?default=create', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Take initial screenshot
  await page.screenshot({ path: 'scratch_ticket_initial.png' });

  // Inspect all text elements containing 'Order' or 'select'
  const orderElements = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    return all
      .filter(el => {
        const text = (el.innerText || '').trim();
        return (text.includes('Order') || text.includes('Select') || text.includes('Click')) && text.length < 100;
      })
      .map(el => ({
        tag: el.tagName,
        className: el.className,
        id: el.id,
        text: (el.innerText || '').trim().replace(/\s+/g, ' '),
        outerHTML: el.outerHTML.slice(0, 150)
      })).slice(0, 30);
  });

  console.log('--- POTENTIAL ORDER ID TRIGGERS ---');
  console.log(JSON.stringify(orderElements, null, 2));

  // Also check all div/button/input elements on the form
  const formState = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input, select, button, div[class*="border"]')).map(el => ({
      tag: el.tagName,
      className: el.className,
      text: (el.textContent || '').trim().slice(0, 50),
      placeholder: el.placeholder || '',
      type: el.type || ''
    }));
    return inputs;
  });

  console.log('\n--- FORM ELEMENTS ---');
  console.log(JSON.stringify(formState.slice(0, 30), null, 2));

  await browser.close();
})();
