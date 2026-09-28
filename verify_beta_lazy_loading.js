const { chromium } = require('playwright');
const fs = require('fs-extra');
const path = require('path');
const ExcelJS = require('exceljs');

const TARGET_URL = 'https://beta.teamwoodenstreet.com/';

async function auditLazyLoading(contextOptions, deviceType) {
  console.log(`\n========================================`);
  console.log(` Auditing Lazy Loading on ${deviceType.toUpperCase()}`);
  console.log(` URL: ${TARGET_URL}`);
  console.log(`========================================\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  const failedRequests = [];
  const consoleErrors = [];
  const networkRequests = [];

  page.on('requestfailed', req => {
    failedRequests.push({
      url: req.url(),
      failure: req.failure() ? req.failure().errorText : 'Failed',
      resourceType: req.resourceType()
    });
  });

  page.on('response', res => {
    networkRequests.push({
      url: res.url(),
      status: res.status(),
      resourceType: res.request().resourceType()
    });
    if (res.status() >= 400) {
      failedRequests.push({
        url: res.url(),
        status: res.status(),
        resourceType: res.request().resourceType()
      });
    }
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({ text: msg.text(), location: msg.location() });
    }
  });

  // Step 1: Navigate to home page
  console.log(`[1] Navigating to page...`);
  const initialTime = Date.now();
  await page.goto(TARGET_URL, { waitUntil: 'load', timeout: 60000 });
  const loadDuration = Date.now() - initialTime;
  await page.waitForTimeout(2000);

  // Take screenshot before scrolling (Initial Fold)
  const initialSsPath = path.join(__dirname, `beta_lazy_${deviceType}_initial.png`);
  await page.screenshot({ path: initialSsPath, fullPage: false });
  console.log(` Saved initial fold screenshot to ${initialSsPath}`);

  // Step 2: Audit images before scrolling (Initial state)
  const initialImagesAudit = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs.map((img, idx) => ({
      index: idx,
      src: img.src || img.getAttribute('data-src') || '',
      alt: img.alt || '',
      loadingAttr: img.getAttribute('loading'),
      isLazy: img.getAttribute('loading') === 'lazy' || img.classList.contains('lazy') || img.hasAttribute('data-src'),
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      displayedWidth: img.clientWidth,
      displayedHeight: img.clientHeight,
      isLoaded: img.complete && img.naturalWidth > 0,
      isVisible: img.getBoundingClientRect().top < window.innerHeight && img.getBoundingClientRect().bottom > 0
    }));
  });

  const lazyImagesCount = initialImagesAudit.filter(i => i.isLazy).length;
  console.log(` Initial Load: Total Images: ${initialImagesAudit.length} | Explicit Lazy Loaded: ${lazyImagesCount}`);

  // Step 3: Scroll down incrementally to trigger lazy loading of sections & images
  console.log(`[2] Scrolling down incrementally to trigger lazy loading...`);
  const scrollSteps = 10;
  const totalScrollHeight = await page.evaluate(() => document.body.scrollHeight);
  const stepHeight = totalScrollHeight / scrollSteps;

  const sectionLoadLog = [];

  for (let s = 1; s <= scrollSteps; s++) {
    await page.evaluate((scrollPos) => {
      window.scrollTo({ top: scrollPos, behavior: 'smooth' });
    }, stepHeight * s);

    await page.waitForTimeout(1000); // Wait for lazy load components to trigger & fetch assets

    // Check visible sections & images state at this scroll position
    const stepAudit = await page.evaluate((stepNum) => {
      const imgs = Array.from(document.querySelectorAll('img'));
      const brokenImgs = imgs.filter(img => img.complete && (img.naturalWidth === 0 || img.naturalHeight === 0) && img.src && !img.src.startsWith('data:'));
      
      // Check sections visible in viewport
      const sections = Array.from(document.querySelectorAll('section, header, footer, div[class*="container"], div[class*="section"], div[class*="home"]'));
      const visibleSections = sections.filter(sec => {
        const r = sec.getBoundingClientRect();
        return r.top < window.innerHeight && r.bottom > 0 && r.height > 20;
      }).map(sec => sec.className || sec.tagName);

      return {
        step: stepNum,
        totalImgs: imgs.length,
        loadedImgs: imgs.filter(img => img.complete && img.naturalWidth > 0).length,
        brokenImgsCount: brokenImgs.length,
        brokenImgsList: brokenImgs.map(i => i.src)
      };
    }, s);

    sectionLoadLog.push(stepAudit);
  }

  // Scroll back to top smoothly
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);

  // Take screenshot after full page scroll and render
  const fullSsPath = path.join(__dirname, `beta_lazy_${deviceType}_full.png`);
  await page.screenshot({ path: fullSsPath, fullPage: true });
  console.log(` Saved full page post-scroll screenshot to ${fullSsPath}`);

  // Step 4: Final Image Audit after full scroll
  const finalImagesAudit = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs.map((img, idx) => {
      const isLoaded = img.complete && img.naturalWidth > 0;
      const isBroken = img.complete && img.naturalWidth === 0 && img.src && !img.src.startsWith('data:');
      return {
        index: idx,
        src: img.src || img.getAttribute('data-src') || '',
        alt: img.alt || '',
        loadingAttr: img.getAttribute('loading'),
        isLazy: img.getAttribute('loading') === 'lazy' || img.classList.contains('lazy') || img.hasAttribute('data-src'),
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        displayedWidth: img.clientWidth,
        displayedHeight: img.clientHeight,
        isLoaded,
        isBroken,
        parentTag: img.parentElement ? img.parentElement.tagName : ''
      };
    });
  });

  // Check key homepage components / sections presence & visibility
  const componentsCheck = await page.evaluate(() => {
    const checks = [
      { name: 'Header / Navigation', selector: 'header, .header, nav, [class*="header"]' },
      { name: 'Main Hero Banner / Slider', selector: '[class*="banner"], [class*="slider"], [class*="hero"], .carousel' },
      { name: 'Shop By Category', selector: '[class*="category"], [class*="categories"]' },
      { name: 'Product Carousels / Best Sellers', selector: '[class*="product"], [class*="carousel"], [class*="seller"]' },
      { name: 'Exclusive Collections / Banners', selector: '[class*="collection"], [class*="exclusive"]' },
      { name: 'Customer Testimonials / Reviews', selector: '[class*="testimonial"], [class*="review"]' },
      { name: 'Footer Section', selector: 'footer, .footer, [class*="footer"]' }
    ];

    return checks.map(c => {
      const el = document.querySelector(c.selector);
      if (!el) return { name: c.name, present: false, visible: false, bounds: null };
      const rect = el.getBoundingClientRect();
      return {
        name: c.name,
        present: true,
        visible: rect.height > 0 && rect.width > 0,
        height: Math.round(rect.height)
      };
    });
  });

  const totalImgs = finalImagesAudit.length;
  const successfullyLoadedImgs = finalImagesAudit.filter(i => i.isLoaded).length;
  const brokenImgs = finalImagesAudit.filter(i => i.isBroken);
  const lazyLoadedImgsCount = finalImagesAudit.filter(i => i.isLazy).length;

  console.log(`\n --- Audit Results for ${deviceType.toUpperCase()} ---`);
  console.log(` Total Images on Page: ${totalImgs}`);
  console.log(` Successfully Loaded Images: ${successfullyLoadedImgs} (${((successfullyLoadedImgs / totalImgs) * 100).toFixed(1)}%)`);
  console.log(` Explicitly Lazy Loaded Images: ${lazyLoadedImgsCount}`);
  console.log(` Broken / Zero-Width Images: ${brokenImgs.length}`);
  console.log(` Failed Network Requests: ${failedRequests.length}`);
  console.log(` Console Errors: ${consoleErrors.length}`);

  await context.close();
  await browser.close();

  return {
    deviceType,
    loadDuration,
    totalImgs,
    successfullyLoadedImgs,
    lazyLoadedImgsCount,
    brokenImgs,
    componentsCheck,
    consoleErrors,
    failedRequests,
    finalImagesAudit,
    sectionLoadLog,
    screenshots: {
      initial: initialSsPath,
      full: fullSsPath
    }
  };
}

async function generateReports(desktopAudit, mobileAudit) {
  // 1. JSON Report
  const jsonReportPath = path.join(__dirname, 'lazy_load_audit_report.json');
  await fs.writeJson(jsonReportPath, { desktop: desktopAudit, mobile: mobileAudit, timestamp: new Date().toISOString() }, { spaces: 2 });
  console.log(` Saved JSON report to ${jsonReportPath}`);

  // 2. Excel Report
  const workbook = new ExcelJS.Workbook();
  const summarySheet = workbook.addWorksheet('Lazy Load Summary');
  summarySheet.columns = [
    { header: 'Device Viewport', key: 'device', width: 20 },
    { header: 'Total Images', key: 'totalImgs', width: 16 },
    { header: 'Lazy-Loaded Imgs', key: 'lazyImgs', width: 18 },
    { header: 'Successfully Loaded', key: 'loadedImgs', width: 22 },
    { header: 'Broken / Missing Imgs', key: 'brokenImgs', width: 22 },
    { header: 'Console Errors', key: 'consoleErrors', width: 16 },
    { header: 'Failed Network Requests', key: 'failedRequests', width: 24 },
    { header: 'Lazy Loading Health', key: 'status', width: 24 }
  ];

  summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };

  [desktopAudit, mobileAudit].forEach(audit => {
    const isHealthy = audit.brokenImgs.length === 0 && audit.failedRequests.filter(r => r.resourceType === 'image').length === 0;
    summarySheet.addRow({
      device: audit.deviceType.toUpperCase(),
      totalImgs: audit.totalImgs,
      lazyImgs: audit.lazyLoadedImgsCount,
      loadedImgs: audit.successfullyLoadedImgs,
      brokenImgs: audit.brokenImgs.length,
      consoleErrors: audit.consoleErrors.length,
      failedRequests: audit.failedRequests.length,
      status: isHealthy ? '🟢 PASS (All loaded clean)' : '🔴 WARNING (Issues found)'
    });
  });

  // Broken Images Sheet
  const brokenSheet = workbook.addWorksheet('Broken Images');
  brokenSheet.columns = [
    { header: 'Device', key: 'device', width: 15 },
    { header: 'Image URL', key: 'src', width: 70 },
    { header: 'Alt Text', key: 'alt', width: 30 },
    { header: 'Is Lazy', key: 'isLazy', width: 15 },
    { header: 'Parent Tag', key: 'parentTag', width: 15 }
  ];
  brokenSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  brokenSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC00000' } };

  [desktopAudit, mobileAudit].forEach(audit => {
    audit.brokenImgs.forEach(b => {
      brokenSheet.addRow({
        device: audit.deviceType.toUpperCase(),
        src: b.src,
        alt: b.alt || 'No alt',
        isLazy: b.isLazy ? 'Yes' : 'No',
        parentTag: b.parentTag
      });
    });
  });

  const excelPath = path.join(__dirname, 'lazy_load_audit_report.xlsx');
  await workbook.xlsx.writeFile(excelPath);
  console.log(` Saved Excel report to ${excelPath}`);

  // 3. HTML Interactive Dashboard
  const htmlPath = path.join(__dirname, 'Lazy_Load_Audit_Dashboard.html');
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WoodenStreet Beta - Lazy Load Verification Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Outfit', sans-serif; background-color: #0b0f17; color: #f1f5f9; }
    .glass-card {
      background: rgba(17, 24, 39, 0.7);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 16px;
    }
  </style>
</head>
<body class="p-6 md:p-10 min-h-screen">
  <div class="max-w-7xl mx-auto space-y-8">
    
    <!-- HEADER -->
    <header class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-800">
      <div>
        <div class="flex items-center gap-3">
          <span class="text-3xl">🖼️</span>
          <h1 class="text-3xl font-black text-white">Beta Homepage Lazy Load Audit</h1>
        </div>
        <p class="text-slate-400 mt-1">Verification of lazy loading component rendering, image health & scroll behavior on Desktop & Mobile</p>
      </div>
      <div class="flex items-center gap-3">
        <span class="bg-slate-800 border border-slate-700 text-sky-400 font-mono text-xs px-3 py-1.5 rounded-full">
          Target: https://beta.teamwoodenstreet.com/
        </span>
      </div>
    </header>

    <!-- KEY STATS CARDS -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      <!-- DESKTOP CARD -->
      <div class="glass-card p-6 space-y-4">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <span>💻</span> Desktop Viewport (1920x1080)
          </h2>
          <span class="px-3 py-1 rounded-full text-xs font-bold ${desktopAudit.brokenImgs.length === 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}">
            ${desktopAudit.brokenImgs.length === 0 ? '🟢 All Components Loaded' : `🔴 ${desktopAudit.brokenImgs.length} Broken Images`}
          </span>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-slate-900/60 p-3 rounded-xl">
            <div class="text-xs text-slate-400">Total Images</div>
            <div class="text-2xl font-extrabold text-white mt-1">${desktopAudit.totalImgs}</div>
          </div>
          <div class="bg-slate-900/60 p-3 rounded-xl">
            <div class="text-xs text-slate-400">Explicit Lazy</div>
            <div class="text-2xl font-extrabold text-sky-400 mt-1">${desktopAudit.lazyLoadedImgsCount}</div>
          </div>
          <div class="bg-slate-900/60 p-3 rounded-xl">
            <div class="text-xs text-slate-400">Loaded Clean</div>
            <div class="text-2xl font-extrabold text-emerald-400 mt-1">${desktopAudit.successfullyLoadedImgs}</div>
          </div>
          <div class="bg-slate-900/60 p-3 rounded-xl">
            <div class="text-xs text-slate-400">Broken Imgs</div>
            <div class="text-2xl font-extrabold ${desktopAudit.brokenImgs.length > 0 ? 'text-rose-400' : 'text-slate-400'} mt-1">${desktopAudit.brokenImgs.length}</div>
          </div>
        </div>

        <div class="space-y-2 pt-2">
          <h3 class="text-xs uppercase font-bold text-slate-400 tracking-wider">Component Visibility Status</h3>
          <div class="space-y-1 text-sm">
            ${desktopAudit.componentsCheck.map(c => `
              <div class="flex justify-between items-center py-1 border-b border-slate-800/40">
                <span class="text-slate-300">${c.name}</span>
                <span class="text-xs font-bold ${c.visible ? 'text-emerald-400' : 'text-rose-400'}">
                  ${c.visible ? '🟢 Rendered & Visible' : '🔴 Missing / Hidden'}
                </span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- MOBILE CARD -->
      <div class="glass-card p-6 space-y-4">
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <span>📱</span> Mobile Viewport (iPhone Emulation)
          </h2>
          <span class="px-3 py-1 rounded-full text-xs font-bold ${mobileAudit.brokenImgs.length === 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}">
            ${mobileAudit.brokenImgs.length === 0 ? '🟢 All Components Loaded' : `🔴 ${mobileAudit.brokenImgs.length} Broken Images`}
          </span>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-slate-900/60 p-3 rounded-xl">
            <div class="text-xs text-slate-400">Total Images</div>
            <div class="text-2xl font-extrabold text-white mt-1">${mobileAudit.totalImgs}</div>
          </div>
          <div class="bg-slate-900/60 p-3 rounded-xl">
            <div class="text-xs text-slate-400">Explicit Lazy</div>
            <div class="text-2xl font-extrabold text-sky-400 mt-1">${mobileAudit.lazyLoadedImgsCount}</div>
          </div>
          <div class="bg-slate-900/60 p-3 rounded-xl">
            <div class="text-xs text-slate-400">Loaded Clean</div>
            <div class="text-2xl font-extrabold text-emerald-400 mt-1">${mobileAudit.successfullyLoadedImgs}</div>
          </div>
          <div class="bg-slate-900/60 p-3 rounded-xl">
            <div class="text-xs text-slate-400">Broken Imgs</div>
            <div class="text-2xl font-extrabold ${mobileAudit.brokenImgs.length > 0 ? 'text-rose-400' : 'text-slate-400'} mt-1">${mobileAudit.brokenImgs.length}</div>
          </div>
        </div>

        <div class="space-y-2 pt-2">
          <h3 class="text-xs uppercase font-bold text-slate-400 tracking-wider">Component Visibility Status</h3>
          <div class="space-y-1 text-sm">
            ${mobileAudit.componentsCheck.map(c => `
              <div class="flex justify-between items-center py-1 border-b border-slate-800/40">
                <span class="text-slate-300">${c.name}</span>
                <span class="text-xs font-bold ${c.visible ? 'text-emerald-400' : 'text-rose-400'}">
                  ${c.visible ? '🟢 Rendered & Visible' : '🔴 Missing / Hidden'}
                </span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

    </div>

    <!-- DETAILED AUDIT TABLE: BROKEN OR UNRENDERED IMAGES IF ANY -->
    <div class="glass-card p-6">
      <h3 class="text-lg font-bold text-white mb-4">Detailed Image & Network Failure Audit</h3>
      <div class="overflow-x-auto">
        <table class="min-w-full text-xs text-left text-slate-300">
          <thead class="bg-slate-900 text-slate-400 uppercase">
            <tr>
              <th class="py-2.5 px-4">Device</th>
              <th class="py-2.5 px-4">Type</th>
              <th class="py-2.5 px-4">Asset / URL</th>
              <th class="py-2.5 px-4">Lazy Flag</th>
              <th class="py-2.5 px-4">Status / Error Details</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            ${[
              ...desktopAudit.brokenImgs.map(b => ({ device: 'Desktop', type: 'Broken Image', url: b.src, lazy: b.isLazy ? 'Lazy' : 'Eager', err: 'naturalWidth = 0' })),
              ...mobileAudit.brokenImgs.map(b => ({ device: 'Mobile', type: 'Broken Image', url: b.src, lazy: b.isLazy ? 'Lazy' : 'Eager', err: 'naturalWidth = 0' })),
              ...desktopAudit.failedRequests.map(r => ({ device: 'Desktop', type: 'Failed Network', url: r.url, lazy: '-', err: r.failure || r.status })),
              ...mobileAudit.failedRequests.map(r => ({ device: 'Mobile', type: 'Failed Network', url: r.url, lazy: '-', err: r.failure || r.status }))
            ].length > 0 ? 
            [
              ...desktopAudit.brokenImgs.map(b => ({ device: 'Desktop', type: 'Broken Image', url: b.src, lazy: b.isLazy ? 'Lazy' : 'Eager', err: 'naturalWidth = 0' })),
              ...mobileAudit.brokenImgs.map(b => ({ device: 'Mobile', type: 'Broken Image', url: b.src, lazy: b.isLazy ? 'Lazy' : 'Eager', err: 'naturalWidth = 0' })),
              ...desktopAudit.failedRequests.map(r => ({ device: 'Desktop', type: 'Failed Network', url: r.url, lazy: '-', err: r.failure || r.status })),
              ...mobileAudit.failedRequests.map(r => ({ device: 'Mobile', type: 'Failed Network', url: r.url, lazy: '-', err: r.failure || r.status }))
            ].map(row => `
              <tr class="hover:bg-slate-800/40">
                <td class="py-2.5 px-4 font-bold text-white">${row.device}</td>
                <td class="py-2.5 px-4 font-mono ${row.type.includes('Broken') ? 'text-rose-400' : 'text-amber-400'}">${row.type}</td>
                <td class="py-2.5 px-4 font-mono truncate max-w-md text-sky-400"><a href="${row.url}" target="_blank">${row.url}</a></td>
                <td class="py-2.5 px-4 font-mono text-slate-400">${row.lazy}</td>
                <td class="py-2.5 px-4 font-mono text-rose-400 font-bold">${row.err}</td>
              </tr>
            `).join('') :
            '<tr><td colspan="5" class="py-6 text-center text-slate-500">🎉 No broken images or failed network requests identified during lazy load scrolling! All components render properly!</td></tr>'
            }
          </tbody>
        </table>
      </div>
    </div>

  </div>
</body>
</html>`;

  await fs.writeFile(htmlPath, htmlContent, 'utf-8');
  console.log(` Saved HTML dashboard to ${htmlPath}`);
}

async function runLazyLoadAudit() {
  console.log(" Starting Lazy Load Audit on Beta...");

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

  const desktopAudit = await auditLazyLoading(desktopOptions, 'desktop');
  const mobileAudit = await auditLazyLoading(mobileOptions, 'mobile');

  await generateReports(desktopAudit, mobileAudit);

  console.log("\n AUDIT COMPLETE!");
}

runLazyLoadAudit().catch(err => {
  console.error(" Error running lazy load audit:", err);
  process.exit(1);
});
