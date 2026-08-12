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
    
    // Setup request routing to allow Tag Manager and block heavy trackers
    await page.route('**/*', (route) => {
      const req = route.request();
      const type = req.resourceType();
      const url = req.url();

      const shouldBlock = 
        type === 'font' || 
        url.includes('facebook.net') || 
        url.includes('hotjar') || 
        url.includes('doubleclick');

      if (shouldBlock) {
        route.abort();
      } else {
        route.continue();
      }
    });

    await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(6000); // Wait for page to hydrate

    // Dismiss promo popups
    await page.keyboard.press('Escape');
    await page.evaluate(() => {
      const closeButtons = document.querySelectorAll('button[aria-label="Close"], button[class*="DialogClose"], button[class*="close"]');
      closeButtons.forEach(btn => btn.click());
    }).catch(() => {});
    await page.waitForTimeout(1000);

    // Locate and click the "+ More" thumbnail button
    const moreButton = page.locator('.image-gallery-thumbnail', { hasText: /\+\d+\s+More/i }).first();
    console.log(`"+ More" button visible: ${await moreButton.isVisible()}`);
    
    if (await moreButton.isVisible()) {
      console.log('Clicking "+ More" button...');
      await moreButton.click({ force: true });
      await page.waitForTimeout(3000);

      // Check how many image-gallery elements are visible now
      console.log('Scanning page state after click...');
      const videos = page.locator('video');
      console.log(`Visible video tags: ${await videos.count()}`);

      const iframes = page.locator('iframe');
      console.log(`Visible iframe tags: ${await iframes.count()}`);

      // Count buttons and thumbnails again
      const thumbs = page.locator('.image-gallery-thumbnail');
      const tCount = await thumbs.count();
      console.log(`Total thumbnails count after click: ${tCount}`);
      for (let i = 0; i < tCount; i++) {
        const isVisible = await thumbs.nth(i).isVisible();
        const text = await thumbs.nth(i).innerText().catch(() => '');
        const cls = await thumbs.nth(i).getAttribute('class').catch(() => '');
        console.log(`Thumb ${i} (Visible: ${isVisible}): Text="${text}" | Class="${cls}"`);
      }

      await page.screenshot({ path: 'reports/samiha_after_more_click.png' });
      console.log('Saved screenshot: reports/samiha_after_more_click.png');
    }

  } catch (err) {
    console.error('Scan error:', err.message);
  } finally {
    await browser.close();
  }
})();
