const { chromium } = require('playwright');

const urls = [
  'https://beta.teamwoodenstreet.com/sofa-buying-guide',
  'https://beta.teamwoodenstreet.com/beds-buying-guide',
  'https://beta.teamwoodenstreet.com/dining-buying-guide',
  'https://beta.teamwoodenstreet.com/tv-unit-buying-guide',
  'https://beta.teamwoodenstreet.com/mattress-buying-guide',
  'https://beta.teamwoodenstreet.com/wardrobe-buying-guide'
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  console.log('DETAILED PAGE CONTENT INSPECTION:');
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const page = await context.newPage();
    try {
      const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      const status = resp.status();
      const title = await page.title();
      const h1s = await page.$$eval('h1', els => els.map(el => el.textContent.trim()));
      const bodyLength = (await page.innerText('body')).length;
      
      console.log(`[${i+1}] ${url}`);
      console.log(`    Status: ${status}`);
      console.log(`    Title: ${title}`);
      console.log(`    H1: ${h1s.join(' | ')}`);
      console.log(`    Body Content Length: ${bodyLength} chars`);
    } catch (e) {
      console.log(`[${i+1}] ${url} -> ERROR: ${e.message}`);
    } finally {
      await page.close();
    }
  }
  await browser.close();
})();
