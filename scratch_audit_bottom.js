const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('Launching browser to perform deep audit of home page bottom sections...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  const failedNetworkRequests = [];
  const consoleErrors = [];

  page.on('response', (response) => {
    const status = response.status();
    const url = response.url();
    if (status >= 400) {
      failedNetworkRequests.push({ url, status, statusText: response.statusText(), resourceType: response.request().resourceType() });
    }
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  console.log('Navigating to https://www.woodenstreet.com/ ...');
  await page.goto('https://www.woodenstreet.com/', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3000);

  // Scroll down smoothly to load all lazy sections
  console.log('Scrolling down page step by step to load all bottom sections...');
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let distance = 400;
      let timer = setInterval(() => {
        let scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        if (window.scrollY + window.innerHeight >= scrollHeight - 50) {
          clearInterval(timer);
          resolve();
        }
      }, 150);
    });
  });

  console.log('Waiting 5 seconds for all bottom sections to settle...');
  await page.waitForTimeout(5000);

  // Take screenshot of whole page / bottom
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  await page.screenshot({ path: path.join(screenshotsDir, 'home_full_page.png'), fullPage: true });

  // Audit all DOM sections and images at the bottom
  const auditReport = await page.evaluate(() => {
    const sections = [];
    const allSectionElements = document.querySelectorAll('section, footer, div[class*="footer"], div[class*="Section"]');
    
    allSectionElements.forEach((sec, idx) => {
      const rect = sec.getBoundingClientRect();
      const text = sec.innerText.trim();
      const imgs = Array.from(sec.querySelectorAll('img'));
      const brokenImgs = imgs.filter(img => !img.complete || img.naturalWidth === 0).map(img => ({
        src: img.src,
        alt: img.alt,
        class: img.className
      }));

      // Check if section looks unrendered / skeleton / blank
      const isBlank = text.length === 0 && imgs.length === 0;
      const isSkeleton = sec.innerHTML.includes('animate-pulse') || sec.innerHTML.includes('skeleton');

      sections.push({
        index: idx,
        tagName: sec.tagName,
        className: sec.className,
        id: sec.id,
        textLength: text.length,
        textSnippet: text.substring(0, 120).replace(/\n/g, ' '),
        imgCount: imgs.length,
        brokenImgCount: brokenImgs.length,
        brokenImgs,
        isBlank,
        isSkeleton
      });
    });

    // Extract all hyperlinks in bottom/footer area
    const footerElement = document.querySelector('footer, .style_footerSection__KdicH, div[class*="footer"]');
    const footerLinks = [];
    if (footerElement) {
      footerElement.querySelectorAll('a[href]').forEach(a => {
        footerLinks.push({ href: a.href, text: a.innerText.trim() });
      });
    }

    return {
      totalSections: sections.length,
      sections,
      footerLinkCount: footerLinks.length,
      footerLinks
    };
  });

  await browser.close();

  const finalOutput = {
    totalFailedRequests: failedNetworkRequests.length,
    failedNetworkRequests,
    consoleErrorCount: consoleErrors.length,
    consoleErrors: consoleErrors.slice(0, 20),
    domAudit: auditReport
  };

  fs.writeFileSync(path.join(__dirname, 'deep_home_audit.json'), JSON.stringify(finalOutput, null, 2));
  console.log('Deep audit complete! Saved results to deep_home_audit.json.');
})();
