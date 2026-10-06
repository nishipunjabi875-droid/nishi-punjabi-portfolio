const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const authPath = path.resolve(__dirname, 'auth.json');
  console.log('Testing auth.json session...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: fs.existsSync(authPath) ? authPath : undefined
  });
  const page = await context.newPage();

  await page.goto('https://www.woodenstreet.com/help-center/tickets?default=create', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  console.log('Page URL:', page.url());
  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('Body snippet:', bodyText.replace(/\s+/g, ' '));

  const isLoginPrompt = await page.evaluate(() => {
    return !!document.querySelector('input[placeholder*="Enter Mobile No." i], #login-mobile');
  });

  console.log('Is login modal visible?:', isLoginPrompt);

  await browser.close();
})();
