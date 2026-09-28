const { chromium } = require('playwright');
const fs = require('fs-extra');
const path = require('path');
const ExcelJS = require('exceljs');

const TARGET_URL = 'https://beta.teamwoodenstreet.com/';

async function deepAuditDevice(contextOptions, deviceType) {
  console.log(`\n========================================`);
  console.log(` Deep Lazy Loading Audit: ${deviceType.toUpperCase()}`);
  console.log(`========================================\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  const abortedMediaRequests = [];
  const imageNetworkErrors = [];

  page.on('requestfailed', req => {
    const type = req.resourceType();
    if (type === 'media') {
      abortedMediaRequests.push({ url: req.url(), error: req.failure() ? req.failure().errorText : 'Aborted' });
    } else if (type === 'image') {
      imageNetworkErrors.push({ url: req.url(), error: req.failure() ? req.failure().errorText : 'Failed' });
    }
  });

  page.on('response', res => {
    if (res.status() >= 400 && res.request().resourceType() === 'image') {
      imageNetworkErrors.push({ url: res.url(), error: `HTTP ${res.status()}` });
    }
  });

  // Step 1: Navigate to page
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);

  // Audit 1: Above-the-fold (ATF) Hero Banner Lazy Load Check
  const atfHeroCheck = await page.evaluate(() => {
    const heroImgs = Array.from(document.querySelectorAll('a[href*="sale"] img, .hero img, .banner img, [class*="banner"] img, [class*="slider"] img')).slice(0, 3);
    return heroImgs.map(img => ({
      src: img.src || img.getAttribute('data-src'),
      loadingAttr: img.getAttribute('loading'),
      fetchPriority: img.getAttribute('fetchpriority'),
      isLazyInHero: img.getAttribute('loading') === 'lazy',
      naturalWidth: img.naturalWidth,
      complete: img.complete
    }));
  });

  // Audit 2: Layout Shift Risks & Missing Attributes (CLS Risk)
  const clsAndA11yIssues = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    let missingDimensionsCount = 0;
    let missingAltCount = 0;
    let unswappedLazyCount = 0;

    const issues = [];

    imgs.forEach((img, idx) => {
      const hasWidthAttr = img.hasAttribute('width');
      const hasHeightAttr = img.hasAttribute('height');
      const hasAlt = img.hasAttribute('alt') && img.getAttribute('alt').trim() !== '';
      const hasDataSrc = img.hasAttribute('data-src') || img.hasAttribute('data-lazy');

      if (!hasWidthAttr || !hasHeightAttr) {
        missingDimensionsCount++;
      }

      if (!hasAlt) {
        missingAltCount++;
        if (issues.length < 10) {
          issues.push({ type: 'Missing Alt Attribute', src: img.src || 'No src', parent: img.parentElement ? img.parentElement.tagName : 'DIV' });
        }
      }

      if (hasDataSrc && img.getAttribute('data-src') !== img.src) {
        unswappedLazyCount++;
      }
    });

    return {
      totalImages: imgs.length,
      missingDimensionsCount,
      missingAltCount,
      unswappedLazyCount,
      sampleIssues: issues
    };
  });

  // Step 2: Smooth scroll to bottom to trigger all lazy components & media
  const scrollSteps = 12;
  const totalScrollHeight = await page.evaluate(() => document.body.scrollHeight);
  const stepHeight = totalScrollHeight / scrollSteps;

  for (let s = 1; s <= scrollSteps; s++) {
    await page.evaluate((pos) => window.scrollTo(0, pos), stepHeight * s);
    await page.waitForTimeout(800);
  }

  // Audit 3: Oversized Images Audit (Images loaded much larger than displayed dimensions)
  const oversizedImagesAudit = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    const oversized = [];

    imgs.forEach(img => {
      if (img.complete && img.naturalWidth > 0 && img.clientWidth > 0) {
        const ratio = img.naturalWidth / img.clientWidth;
        if (ratio > 2.5 && img.naturalWidth > 1200) { // Image is 2.5x larger than displayed box
          oversized.push({
            src: img.src,
            displayedWidth: img.clientWidth,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            ratio: parseFloat(ratio.toFixed(1))
          });
        }
      }
    });

    return oversized;
  });

  // Audit 4: Video / Media Lazy Load Check
  const videoLazyCheck = await page.evaluate(() => {
    const videos = Array.from(document.querySelectorAll('video'));
    return videos.map(v => ({
      src: v.src || (v.querySelector('source') ? v.querySelector('source').src : ''),
      preload: v.getAttribute('preload'),
      autoplay: v.autoplay,
      paused: v.paused,
      readyState: v.readyState,
      hasError: v.error !== null
    }));
  });

  await context.close();
  await browser.close();

  return {
    deviceType,
    atfHeroCheck,
    clsAndA11yIssues,
    oversizedImagesAudit,
    videoLazyCheck,
    abortedMediaRequests,
    imageNetworkErrors
  };
}

async function runDeepAudit() {
  const desktopOptions = {
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  const mobileOptions = {
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true
  };

  const desktop = await deepAuditDevice(desktopOptions, 'desktop');
  const mobile = await deepAuditDevice(mobileOptions, 'mobile');

  const report = { timestamp: new Date().toISOString(), desktop, mobile };
  const jsonPath = path.join(__dirname, 'deep_lazy_load_issues.json');
  await fs.writeJson(jsonPath, report, { spaces: 2 });

  console.log('\n================ DEEP LAZY LOAD FINDINGS SUMMARY ================');
  console.log(`DESKTOP:`);
  console.log(`  - Missing Dimensions (Width/Height) : ${desktop.clsAndA11yIssues.missingDimensionsCount} / ${desktop.clsAndA11yIssues.totalImages} images`);
  console.log(`  - Missing Alt Attributes             : ${desktop.clsAndA11yIssues.missingAltCount} images`);
  console.log(`  - Oversized Images (>2.5x box size) : ${desktop.oversizedImagesAudit.length} images`);
  console.log(`  - Aborted Video / Media Requests    : ${desktop.abortedMediaRequests.length} videos`);
  console.log(`  - Lazy Load in Hero Banner (LCP Risk): ${desktop.atfHeroCheck.filter(i => i.isLazyInHero).length} hero image(s)`);

  console.log(`\nMOBILE:`);
  console.log(`  - Missing Dimensions (Width/Height) : ${mobile.clsAndA11yIssues.missingDimensionsCount} / ${mobile.clsAndA11yIssues.totalImages} images`);
  console.log(`  - Missing Alt Attributes             : ${mobile.clsAndA11yIssues.missingAltCount} images`);
  console.log(`  - Oversized Images (>2.5x box size) : ${mobile.oversizedImagesAudit.length} images`);
  console.log(`  - Aborted Video / Media Requests    : ${mobile.abortedMediaRequests.length} videos`);
  console.log(`  - Lazy Load in Hero Banner (LCP Risk): ${mobile.atfHeroCheck.filter(i => i.isLazyInHero).length} hero image(s)`);

  console.log('==================================================================\n');
}

runDeepAudit().catch(err => {
  console.error("Error running deep lazy load audit:", err);
  process.exit(1);
});
