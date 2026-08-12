const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();
  
  try {
    const url = 'https://beta.teamwoodenstreet.com/product/samiha-sheesham-wood-side-and-end-table-black-finish';
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(6000); // Wait for page to hydarate

    console.log('\n--- Page Title ---');
    console.log('Title:', await page.title());

    console.log('\n--- Scanning common video containers ---');
    const classes = ['.image-gallery', '.image-gallery-thumbnail', '.videoSlider', '.swiper-slide', '.isvideo'];
    for (const cls of classes) {
      console.log(`Selector "${cls}" count: ${await page.locator(cls).count()}`);
    }

    console.log('\n--- Extracting all buttons ---');
    const buttons = page.locator('button');
    const bCount = await buttons.count();
    console.log(`Buttons count: ${bCount}`);
    for (let i = 0; i < bCount; i++) {
      const btn = buttons.nth(i);
      const text = await btn.innerText().catch(() => '');
      const cls = await btn.getAttribute('class').catch(() => '');
      console.log(`Button ${i}: Text="${text}" | Class="${cls}"`);
    }

    console.log('\n--- Extracting all img tags ---');
    const imgs = page.locator('img');
    const imgCount = await imgs.count();
    console.log(`Images count: ${imgCount}`);
    for (let i = 0; i < Math.min(imgCount, 40); i++) {
      const img = imgs.nth(i);
      const alt = await img.getAttribute('alt').catch(() => '');
      const src = await img.getAttribute('src').catch(() => '');
      console.log(`Img ${i}: Alt="${alt}" | Src="${src ? src.substring(0, 100) : ''}"`);
    }

  } catch (err) {
    console.error('Scan error:', err.message);
  } finally {
    await browser.close();
  }
})();
