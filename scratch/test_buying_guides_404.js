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

  console.log('====================================================');
  console.log('CHECKING BUYING GUIDE LINKS FOR 404 / PAGE ERRORS');
  console.log('====================================================\n');

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const page = await context.newPage();
    let httpStatus = null;
    
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      httpStatus = response ? response.status() : 'No response';
      
      const title = await page.title();
      
      // Check if page content contains explicit 404 indications
      const bodyText = await page.innerText('body');
      
      const is404Heading = await page.locator('h1, h2, .heading, .title').evaluateAll(elements => 
        elements.some(el => el.textContent.includes('404') || el.textContent.toLowerCase().includes('page not found'))
      );
      
      const has404Image = await page.locator('img[src*="404"]').count() > 0;
      
      console.log(`[Link ${i + 1}] ${url}`);
      console.log(`  HTTP Status Code: ${httpStatus}`);
      console.log(`  Page Title: "${title}"`);
      console.log(`  Is 404 Heading: ${is404Heading}`);
      console.log(`  Has 404 Image: ${has404Image}`);
      console.log(`  Is 404 Status / Error: ${httpStatus === 404 || is404Heading}`);
      console.log('----------------------------------------------------');
    } catch (err) {
      console.log(`[Link ${i + 1}] ${url}`);
      console.log(`  ERROR loading page: ${err.message}`);
      console.log('----------------------------------------------------');
    } finally {
      await page.close();
    }
  }

  await browser.close();
})();
