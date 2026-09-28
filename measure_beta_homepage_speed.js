const { chromium } = require('playwright');
const fs = require('fs-extra');
const path = require('path');
const ExcelJS = require('exceljs');

const TARGET_URL = 'https://beta.teamwoodenstreet.com/';
const NUM_RUNS = 3;

async function measureSpeed(contextOptions, deviceType) {
  console.log(`\n========================================`);
  console.log(` Starting Speed Test for: ${deviceType.toUpperCase()}`);
  console.log(` URL: ${TARGET_URL}`);
  console.log(`========================================\n`);

  const browser = await chromium.launch({ headless: true });
  const runsResults = [];

  for (let run = 1; run <= NUM_RUNS; run++) {
    console.log(`--- Running ${deviceType} Run ${run}/${NUM_RUNS} ---`);
    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();

    const requests = [];
    const consoleLogs = [];
    const httpErrors = [];

    // Track network requests
    page.on('requestfinished', async (req) => {
      try {
        const res = await req.response();
        const timing = req.timing();
        const sizes = await req.sizes().catch(() => ({ requestBytes: 0, responseBytes: 0, responseBodySize: 0 }));
        
        requests.push({
          url: req.url(),
          resourceType: req.resourceType(),
          status: res ? res.status() : 0,
          durationMs: timing ? Math.max(0, timing.responseEnd) : 0,
          startTimeMs: timing ? timing.startTime : 0,
          responseBytes: sizes.responseBytes || sizes.responseBodySize || 0
        });

        if (res && res.status() >= 400) {
          httpErrors.push({
            url: req.url(),
            status: res.status(),
            statusText: res.statusText()
          });
        }
      } catch (e) {
        // ignore closed request errors
      }
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleLogs.push({ type: msg.type(), text: msg.text() });
      }
    });

    // Inject performance observer setup script before load
    await page.addInitScript(() => {
      window.__lcp = 0;
      window.__cls = 0;
      window.__fcp = 0;

      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            window.__lcp = lastEntry.startTime;
          }
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {}

      try {
        const clsObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              window.__cls += entry.value;
            }
          }
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {}

      try {
        const paintObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              window.__fcp = entry.startTime;
            }
          }
        });
        paintObserver.observe({ type: 'paint', buffered: true });
      } catch (e) {}
    });

    const startTime = Date.now();
    await page.goto(TARGET_URL, { waitUntil: 'load', timeout: 90000 });
    const wallClockLoadTime = Date.now() - startTime;

    // Wait 4 seconds for LCP/CLS observers and lazy assets to stabilize
    await page.waitForTimeout(4000);

    // Save screenshot on first run
    if (run === 1) {
      const ssPath = path.join(__dirname, `beta_homepage_${deviceType}.png`);
      await page.screenshot({ path: ssPath, fullPage: false });
      console.log(` Saved screenshot to ${ssPath}`);
    }

    // Extract window performance metrics
    const perfMetrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] || {};
      const paint = performance.getEntriesByType('paint') || [];

      let fcp = window.__fcp || 0;
      if (!fcp) {
        const fcpEntry = paint.find(p => p.name === 'first-contentful-paint');
        if (fcpEntry) fcp = fcpEntry.startTime;
      }

      const ttfb = nav.responseStart ? (nav.responseStart - nav.requestStart) : 0;
      const domContentLoaded = nav.domContentLoadedEventEnd ? (nav.domContentLoadedEventEnd - nav.startTime) : 0;
      const loadEvent = nav.loadEventEnd ? (nav.loadEventEnd - nav.startTime) : 0;
      const transferSize = nav.transferSize || 0;

      return {
        ttfb: Math.round(ttfb),
        fcp: Math.round(fcp),
        lcp: Math.round(window.__lcp || 0),
        cls: parseFloat((window.__cls || 0).toFixed(3)),
        domContentLoaded: Math.round(domContentLoaded),
        loadEvent: Math.round(loadEvent),
        transferSize: transferSize
      };
    });

    perfMetrics.wallClockLoadTime = wallClockLoadTime;
    perfMetrics.totalRequests = requests.length;

    // Calculate resource breakdown
    const resourceBreakdown = {
      image: { count: 0, bytes: 0 },
      script: { count: 0, bytes: 0 },
      stylesheet: { count: 0, bytes: 0 },
      font: { count: 0, bytes: 0 },
      xhr: { count: 0, bytes: 0 },
      other: { count: 0, bytes: 0 }
    };

    let totalBytes = 0;
    requests.forEach(r => {
      totalBytes += r.responseBytes;
      const type = r.resourceType;
      if (type === 'image') {
        resourceBreakdown.image.count++;
        resourceBreakdown.image.bytes += r.responseBytes;
      } else if (type === 'script') {
        resourceBreakdown.script.count++;
        resourceBreakdown.script.bytes += r.responseBytes;
      } else if (type === 'stylesheet') {
        resourceBreakdown.stylesheet.count++;
        resourceBreakdown.stylesheet.bytes += r.responseBytes;
      } else if (type === 'font') {
        resourceBreakdown.font.count++;
        resourceBreakdown.font.bytes += r.responseBytes;
      } else if (type === 'xhr' || type === 'fetch') {
        resourceBreakdown.xhr.count++;
        resourceBreakdown.xhr.bytes += r.responseBytes;
      } else {
        resourceBreakdown.other.count++;
        resourceBreakdown.other.bytes += r.responseBytes;
      }
    });

    perfMetrics.totalBytes = totalBytes;
    perfMetrics.resourceBreakdown = resourceBreakdown;

    // Sort top 10 slowest requests
    const slowestRequests = [...requests]
      .sort((a, b) => b.durationMs - a.durationMs)
      .slice(0, 10);

    runsResults.push({
      run,
      perfMetrics,
      requests,
      slowestRequests,
      consoleLogs,
      httpErrors
    });

    console.log(`   Run ${run} Metrics: TTFB: ${perfMetrics.ttfb}ms | FCP: ${perfMetrics.fcp}ms | LCP: ${perfMetrics.lcp}ms | CLS: ${perfMetrics.cls} | Load: ${perfMetrics.loadEvent}ms | Requests: ${perfMetrics.totalRequests} | Weight: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);

    await context.close();
  }

  await browser.close();

  // Aggregate stats across runs
  const avg = (arr) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  const avgFloat = (arr) => parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(3));

  const aggregated = {
    deviceType,
    runs: NUM_RUNS,
    ttfb: { avg: avg(runsResults.map(r => r.perfMetrics.ttfb)), min: Math.min(...runsResults.map(r => r.perfMetrics.ttfb)), max: Math.max(...runsResults.map(r => r.perfMetrics.ttfb)) },
    fcp: { avg: avg(runsResults.map(r => r.perfMetrics.fcp)), min: Math.min(...runsResults.map(r => r.perfMetrics.fcp)), max: Math.max(...runsResults.map(r => r.perfMetrics.fcp)) },
    lcp: { avg: avg(runsResults.map(r => r.perfMetrics.lcp)), min: Math.min(...runsResults.map(r => r.perfMetrics.lcp)), max: Math.max(...runsResults.map(r => r.perfMetrics.lcp)) },
    cls: { avg: avgFloat(runsResults.map(r => r.perfMetrics.cls)), min: Math.min(...runsResults.map(r => r.perfMetrics.cls)), max: Math.max(...runsResults.map(r => r.perfMetrics.cls)) },
    domContentLoaded: { avg: avg(runsResults.map(r => r.perfMetrics.domContentLoaded)), min: Math.min(...runsResults.map(r => r.perfMetrics.domContentLoaded)), max: Math.max(...runsResults.map(r => r.perfMetrics.domContentLoaded)) },
    loadEvent: { avg: avg(runsResults.map(r => r.perfMetrics.loadEvent)), min: Math.min(...runsResults.map(r => r.perfMetrics.loadEvent)), max: Math.max(...runsResults.map(r => r.perfMetrics.loadEvent)) },
    wallClockLoadTime: { avg: avg(runsResults.map(r => r.perfMetrics.wallClockLoadTime)), min: Math.min(...runsResults.map(r => r.perfMetrics.wallClockLoadTime)), max: Math.max(...runsResults.map(r => r.perfMetrics.wallClockLoadTime)) },
    totalRequests: { avg: avg(runsResults.map(r => r.perfMetrics.totalRequests)), min: Math.min(...runsResults.map(r => r.perfMetrics.totalRequests)), max: Math.max(...runsResults.map(r => r.perfMetrics.totalRequests)) },
    totalBytes: { avg: avg(runsResults.map(r => r.perfMetrics.totalBytes)), min: Math.min(...runsResults.map(r => r.perfMetrics.totalBytes)), max: Math.max(...runsResults.map(r => r.perfMetrics.totalBytes)) },
    resourceBreakdown: runsResults[0].perfMetrics.resourceBreakdown,
    slowestRequests: runsResults[0].slowestRequests,
    httpErrors: runsResults[0].httpErrors,
    consoleLogs: runsResults[0].consoleLogs,
    runsDetails: runsResults
  };

  return aggregated;
}

function getWebVitalRating(metric, value) {
  if (metric === 'lcp') {
    if (value <= 2500) return { rating: 'Good', color: '#10b981', badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    if (value <= 4000) return { rating: 'Needs Improvement', color: '#f59e0b', badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    return { rating: 'Poor', color: '#f43f5e', badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
  }
  if (metric === 'fcp') {
    if (value <= 1800) return { rating: 'Good', color: '#10b981', badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    if (value <= 3000) return { rating: 'Needs Improvement', color: '#f59e0b', badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    return { rating: 'Poor', color: '#f43f5e', badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
  }
  if (metric === 'cls') {
    if (value <= 0.1) return { rating: 'Good', color: '#10b981', badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    if (value <= 0.25) return { rating: 'Needs Improvement', color: '#f59e0b', badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    return { rating: 'Poor', color: '#f43f5e', badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
  }
  if (metric === 'ttfb') {
    if (value <= 800) return { rating: 'Good', color: '#10b981', badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    if (value <= 1800) return { rating: 'Needs Improvement', color: '#f59e0b', badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    return { rating: 'Poor', color: '#f43f5e', badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
  }
  return { rating: 'N/A', color: '#94a3b8', badgeClass: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
}

async function generateExcelReport(desktopData, mobileData, outputPath) {
  const workbook = new ExcelJS.Workbook();

  const styleHeader = (sheet, columns) => {
    sheet.columns = columns.map(c => ({ header: c.header, key: c.key, width: c.width || 25 }));
    sheet.getRow(1).font = { name: 'Segoe UI', bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'left' };
    sheet.getRow(1).height = 28;
  };

  // 1. COMPARISON & SUMMARY SHEET
  const summarySheet = workbook.addWorksheet('Executive Summary');
  summarySheet.views = [{ showGridLines: true }];

  summarySheet.mergeCells('A1:F1');
  const title = summarySheet.getCell('A1');
  title.value = 'WoodenStreet Beta Homepage - Speed & Performance Benchmark Report';
  title.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FF1F4E78' } };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.getRow(1).height = 36;

  summarySheet.addRow([]);

  // Table header
  summarySheet.addRow(['Performance Metric', 'Desktop (Avg)', 'Desktop Rating', 'Mobile (Avg)', 'Mobile Rating', 'Web Vitals Good Threshold']);
  summarySheet.getRow(3).font = { name: 'Segoe UI', bold: true, color: { argb: 'FFFFFFFF' } };
  summarySheet.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' } };
  summarySheet.getRow(3).height = 24;

  const metricsRows = [
    ['Time to First Byte (TTFB)', `${desktopData.ttfb.avg} ms`, getWebVitalRating('ttfb', desktopData.ttfb.avg).rating, `${mobileData.ttfb.avg} ms`, getWebVitalRating('ttfb', mobileData.ttfb.avg).rating, '≤ 800 ms'],
    ['First Contentful Paint (FCP)', `${desktopData.fcp.avg} ms`, getWebVitalRating('fcp', desktopData.fcp.avg).rating, `${mobileData.fcp.avg} ms`, getWebVitalRating('fcp', mobileData.fcp.avg).rating, '≤ 1,800 ms'],
    ['Largest Contentful Paint (LCP)', `${desktopData.lcp.avg} ms`, getWebVitalRating('lcp', desktopData.lcp.avg).rating, `${mobileData.lcp.avg} ms`, getWebVitalRating('lcp', mobileData.lcp.avg).rating, '≤ 2,500 ms'],
    ['Cumulative Layout Shift (CLS)', `${desktopData.cls.avg}`, getWebVitalRating('cls', desktopData.cls.avg).rating, `${mobileData.cls.avg}`, getWebVitalRating('cls', mobileData.cls.avg).rating, '≤ 0.10'],
    ['DOMContentLoaded Time', `${desktopData.domContentLoaded.avg} ms`, '-', `${mobileData.domContentLoaded.avg} ms`, '-', '≤ 2,000 ms'],
    ['Fully Loaded (Load Event)', `${desktopData.loadEvent.avg} ms`, '-', `${mobileData.loadEvent.avg} ms`, '-', '≤ 3,500 ms'],
    ['Total HTTP Requests', desktopData.totalRequests.avg, '-', mobileData.totalRequests.avg, '-', '≤ 80 requests'],
    ['Total Page Weight (Size)', `${(desktopData.totalBytes.avg / 1024 / 1024).toFixed(2)} MB`, '-', `${(mobileData.totalBytes.avg / 1024 / 1024).toFixed(2)} MB`, '-', '≤ 2.50 MB']
  ];

  metricsRows.forEach(r => summarySheet.addRow(r));

  summarySheet.getColumn(1).width = 32;
  summarySheet.getColumn(2).width = 18;
  summarySheet.getColumn(3).width = 22;
  summarySheet.getColumn(4).width = 18;
  summarySheet.getColumn(5).width = 22;
  summarySheet.getColumn(6).width = 28;

  for (let r = 3; r <= 11; r++) {
    const row = summarySheet.getRow(r);
    row.alignment = { vertical: 'middle' };
    for (let c = 1; c <= 6; c++) {
      row.getCell(c).border = {
        top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
      };
    }
  }

  // 2. DESKTOP DETAILS SHEET
  const dtSheet = workbook.addWorksheet('Desktop Speed Details');
  styleHeader(dtSheet, [
    { header: 'Run #', key: 'run', width: 10 },
    { header: 'TTFB (ms)', key: 'ttfb', width: 15 },
    { header: 'FCP (ms)', key: 'fcp', width: 15 },
    { header: 'LCP (ms)', key: 'lcp', width: 15 },
    { header: 'CLS', key: 'cls', width: 12 },
    { header: 'DOM Content Loaded (ms)', key: 'dom', width: 25 },
    { header: 'Load Event (ms)', key: 'load', width: 18 },
    { header: 'Total Requests', key: 'reqs', width: 16 },
    { header: 'Page Size (MB)', key: 'size', width: 16 }
  ]);

  desktopData.runsDetails.forEach(r => {
    dtSheet.addRow({
      run: r.run,
      ttfb: r.perfMetrics.ttfb,
      fcp: r.perfMetrics.fcp,
      lcp: r.perfMetrics.lcp,
      cls: r.perfMetrics.cls,
      dom: r.perfMetrics.domContentLoaded,
      load: r.perfMetrics.loadEvent,
      reqs: r.perfMetrics.totalRequests,
      size: (r.perfMetrics.totalBytes / 1024 / 1024).toFixed(2)
    });
  });

  // 3. MOBILE DETAILS SHEET
  const mbSheet = workbook.addWorksheet('Mobile Speed Details');
  styleHeader(mbSheet, [
    { header: 'Run #', key: 'run', width: 10 },
    { header: 'TTFB (ms)', key: 'ttfb', width: 15 },
    { header: 'FCP (ms)', key: 'fcp', width: 15 },
    { header: 'LCP (ms)', key: 'lcp', width: 15 },
    { header: 'CLS', key: 'cls', width: 12 },
    { header: 'DOM Content Loaded (ms)', key: 'dom', width: 25 },
    { header: 'Load Event (ms)', key: 'load', width: 18 },
    { header: 'Total Requests', key: 'reqs', width: 16 },
    { header: 'Page Size (MB)', key: 'size', width: 16 }
  ]);

  mobileData.runsDetails.forEach(r => {
    mbSheet.addRow({
      run: r.run,
      ttfb: r.perfMetrics.ttfb,
      fcp: r.perfMetrics.fcp,
      lcp: r.perfMetrics.lcp,
      cls: r.perfMetrics.cls,
      dom: r.perfMetrics.domContentLoaded,
      load: r.perfMetrics.loadEvent,
      reqs: r.perfMetrics.totalRequests,
      size: (r.perfMetrics.totalBytes / 1024 / 1024).toFixed(2)
    });
  });

  // 4. SLOWEST ASSETS SHEET
  const slowSheet = workbook.addWorksheet('Slowest Assets');
  styleHeader(slowSheet, [
    { header: 'Device', key: 'device', width: 12 },
    { header: 'Resource Type', key: 'type', width: 15 },
    { header: 'Duration (ms)', key: 'duration', width: 16 },
    { header: 'Size (KB)', key: 'size', width: 14 },
    { header: 'Asset URL', key: 'url', width: 75 }
  ]);

  desktopData.slowestRequests.forEach(s => {
    slowSheet.addRow({
      device: 'Desktop',
      type: s.resourceType,
      duration: Math.round(s.durationMs),
      size: (s.responseBytes / 1024).toFixed(1),
      url: s.url
    });
  });

  mobileData.slowestRequests.forEach(s => {
    slowSheet.addRow({
      device: 'Mobile',
      type: s.resourceType,
      duration: Math.round(s.durationMs),
      size: (s.responseBytes / 1024).toFixed(1),
      url: s.url
    });
  });

  await workbook.xlsx.writeFile(outputPath);
  console.log(` Excel report generated at ${outputPath}`);
}

async function generateHtmlDashboard(desktopData, mobileData, outputPath) {
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WoodenStreet Beta Homepage - Speed & Performance Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Outfit', sans-serif; background-color: #0b0f17; color: #f1f5f9; }
    .glass-card {
      background: rgba(17, 24, 39, 0.7);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 16px;
    }
    .badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      border-width: 1px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  </style>
</head>
<body class="p-4 md:p-8 min-h-screen">
  <div class="max-w-7xl mx-auto space-y-8">
    
    <!-- HEADER -->
    <header class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-800">
      <div>
        <div class="flex items-center gap-3">
          <span class="text-3xl">🚀</span>
          <h1 class="text-3xl font-black text-white tracking-tight">WoodenStreet Beta Homepage Speed Audit</h1>
        </div>
        <p class="text-slate-400 mt-1">Real-browser Performance, Core Web Vitals, and Network Resource Breakdown</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <span class="text-xs bg-slate-800/80 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-full font-mono">
          URL: <strong class="text-sky-400">https://beta.teamwoodenstreet.com/</strong>
        </span>
        <span class="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full font-semibold">
          Runs: 3 Desktop | 3 Mobile
        </span>
      </div>
    </header>

    <!-- KPI COMPARISON SUMMARY GRID -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      
      <!-- LCP CARD -->
      <div class="glass-card p-5 flex flex-col justify-between">
        <div class="flex justify-between items-start">
          <span class="text-slate-400 text-xs uppercase font-bold tracking-wider">Largest Contentful Paint</span>
          <span class="text-xs text-slate-500">Target ≤ 2.5s</span>
        </div>
        <div class="my-4 grid grid-cols-2 gap-2 border-y border-slate-800/80 py-3">
          <div>
            <div class="text-xs text-slate-400">Desktop</div>
            <div class="text-2xl font-black text-white">${(desktopData.lcp.avg / 1000).toFixed(2)}s</div>
            <span class="badge ${getWebVitalRating('lcp', desktopData.lcp.avg).badgeClass}">${getWebVitalRating('lcp', desktopData.lcp.avg).rating}</span>
          </div>
          <div>
            <div class="text-xs text-slate-400">Mobile</div>
            <div class="text-2xl font-black text-white">${(mobileData.lcp.avg / 1000).toFixed(2)}s</div>
            <span class="badge ${getWebVitalRating('lcp', mobileData.lcp.avg).badgeClass}">${getWebVitalRating('lcp', mobileData.lcp.avg).rating}</span>
          </div>
        </div>
        <div class="text-xs text-slate-500">Main visual content render speed</div>
      </div>

      <!-- FCP CARD -->
      <div class="glass-card p-5 flex flex-col justify-between">
        <div class="flex justify-between items-start">
          <span class="text-slate-400 text-xs uppercase font-bold tracking-wider">First Contentful Paint</span>
          <span class="text-xs text-slate-500">Target ≤ 1.8s</span>
        </div>
        <div class="my-4 grid grid-cols-2 gap-2 border-y border-slate-800/80 py-3">
          <div>
            <div class="text-xs text-slate-400">Desktop</div>
            <div class="text-2xl font-black text-white">${(desktopData.fcp.avg / 1000).toFixed(2)}s</div>
            <span class="badge ${getWebVitalRating('fcp', desktopData.fcp.avg).badgeClass}">${getWebVitalRating('fcp', desktopData.fcp.avg).rating}</span>
          </div>
          <div>
            <div class="text-xs text-slate-400">Mobile</div>
            <div class="text-2xl font-black text-white">${(mobileData.fcp.avg / 1000).toFixed(2)}s</div>
            <span class="badge ${getWebVitalRating('fcp', mobileData.fcp.avg).badgeClass}">${getWebVitalRating('fcp', mobileData.fcp.avg).rating}</span>
          </div>
        </div>
        <div class="text-xs text-slate-500">Initial content render timestamp</div>
      </div>

      <!-- TTFB CARD -->
      <div class="glass-card p-5 flex flex-col justify-between">
        <div class="flex justify-between items-start">
          <span class="text-slate-400 text-xs uppercase font-bold tracking-wider">Time To First Byte</span>
          <span class="text-xs text-slate-500">Target ≤ 800ms</span>
        </div>
        <div class="my-4 grid grid-cols-2 gap-2 border-y border-slate-800/80 py-3">
          <div>
            <div class="text-xs text-slate-400">Desktop</div>
            <div class="text-2xl font-black text-white">${desktopData.ttfb.avg}ms</div>
            <span class="badge ${getWebVitalRating('ttfb', desktopData.ttfb.avg).badgeClass}">${getWebVitalRating('ttfb', desktopData.ttfb.avg).rating}</span>
          </div>
          <div>
            <div class="text-xs text-slate-400">Mobile</div>
            <div class="text-2xl font-black text-white">${mobileData.ttfb.avg}ms</div>
            <span class="badge ${getWebVitalRating('ttfb', mobileData.ttfb.avg).badgeClass}">${getWebVitalRating('ttfb', mobileData.ttfb.avg).rating}</span>
          </div>
        </div>
        <div class="text-xs text-slate-500">Server response latency</div>
      </div>

      <!-- CLS CARD -->
      <div class="glass-card p-5 flex flex-col justify-between">
        <div class="flex justify-between items-start">
          <span class="text-slate-400 text-xs uppercase font-bold tracking-wider">Cumulative Layout Shift</span>
          <span class="text-xs text-slate-500">Target ≤ 0.10</span>
        </div>
        <div class="my-4 grid grid-cols-2 gap-2 border-y border-slate-800/80 py-3">
          <div>
            <div class="text-xs text-slate-400">Desktop</div>
            <div class="text-2xl font-black text-white">${desktopData.cls.avg}</div>
            <span class="badge ${getWebVitalRating('cls', desktopData.cls.avg).badgeClass}">${getWebVitalRating('cls', desktopData.cls.avg).rating}</span>
          </div>
          <div>
            <div class="text-xs text-slate-400">Mobile</div>
            <div class="text-2xl font-black text-white">${mobileData.cls.avg}</div>
            <span class="badge ${getWebVitalRating('cls', mobileData.cls.avg).badgeClass}">${getWebVitalRating('cls', mobileData.cls.avg).rating}</span>
          </div>
        </div>
        <div class="text-xs text-slate-500">Visual stability metric</div>
      </div>

    </div>

    <!-- CHARTS SECTION -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- LOAD TIMES CHART -->
      <div class="glass-card p-6">
        <h3 class="text-lg font-bold text-white mb-4">Desktop vs Mobile Load Metrics (ms)</h3>
        <div class="h-64">
          <canvas id="metricsChart"></canvas>
        </div>
      </div>

      <!-- PAGE WEIGHT & REQUESTS -->
      <div class="glass-card p-6">
        <h3 class="text-lg font-bold text-white mb-4">Page Payload Size (MB) & Request Count</h3>
        <div class="h-64">
          <canvas id="weightChart"></canvas>
        </div>
      </div>
    </div>

    <!-- DETAILED BENCHMARK COMPARISON TABLE -->
    <div class="glass-card overflow-hidden">
      <div class="p-6 border-b border-slate-800/80 flex justify-between items-center">
        <h3 class="text-xl font-extrabold text-white">Full Side-by-Side Performance Matrix</h3>
        <span class="text-xs text-slate-400">Tested on Playwright Chromium Engine</span>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm text-left text-slate-300">
          <thead class="bg-slate-900/90 text-slate-400 uppercase text-xs">
            <tr>
              <th class="py-3 px-6">Metric Description</th>
              <th class="py-3 px-6 text-center">Desktop Avg</th>
              <th class="py-3 px-6 text-center">Desktop Rating</th>
              <th class="py-3 px-6 text-center">Mobile Avg</th>
              <th class="py-3 px-6 text-center">Mobile Rating</th>
              <th class="py-3 px-6 text-center">Recommended Threshold</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            <tr class="hover:bg-slate-800/30">
              <td class="py-4 px-6 font-semibold text-white">Time to First Byte (TTFB)</td>
              <td class="py-4 px-6 text-center font-mono text-sky-400 font-bold">${desktopData.ttfb.avg} ms</td>
              <td class="py-4 px-6 text-center"><span class="badge ${getWebVitalRating('ttfb', desktopData.ttfb.avg).badgeClass}">${getWebVitalRating('ttfb', desktopData.ttfb.avg).rating}</span></td>
              <td class="py-4 px-6 text-center font-mono text-sky-400 font-bold">${mobileData.ttfb.avg} ms</td>
              <td class="py-4 px-6 text-center"><span class="badge ${getWebVitalRating('ttfb', mobileData.ttfb.avg).badgeClass}">${getWebVitalRating('ttfb', mobileData.ttfb.avg).rating}</span></td>
              <td class="py-4 px-6 text-center font-mono text-slate-400">≤ 800 ms</td>
            </tr>
            <tr class="hover:bg-slate-800/30">
              <td class="py-4 px-6 font-semibold text-white">First Contentful Paint (FCP)</td>
              <td class="py-4 px-6 text-center font-mono text-sky-400 font-bold">${desktopData.fcp.avg} ms</td>
              <td class="py-4 px-6 text-center"><span class="badge ${getWebVitalRating('fcp', desktopData.fcp.avg).badgeClass}">${getWebVitalRating('fcp', desktopData.fcp.avg).rating}</span></td>
              <td class="py-4 px-6 text-center font-mono text-sky-400 font-bold">${mobileData.fcp.avg} ms</td>
              <td class="py-4 px-6 text-center"><span class="badge ${getWebVitalRating('fcp', mobileData.fcp.avg).badgeClass}">${getWebVitalRating('fcp', mobileData.fcp.avg).rating}</span></td>
              <td class="py-4 px-6 text-center font-mono text-slate-400">≤ 1,800 ms</td>
            </tr>
            <tr class="hover:bg-slate-800/30">
              <td class="py-4 px-6 font-semibold text-white">Largest Contentful Paint (LCP)</td>
              <td class="py-4 px-6 text-center font-mono text-sky-400 font-bold">${desktopData.lcp.avg} ms</td>
              <td class="py-4 px-6 text-center"><span class="badge ${getWebVitalRating('lcp', desktopData.lcp.avg).badgeClass}">${getWebVitalRating('lcp', desktopData.lcp.avg).rating}</span></td>
              <td class="py-4 px-6 text-center font-mono text-sky-400 font-bold">${mobileData.lcp.avg} ms</td>
              <td class="py-4 px-6 text-center"><span class="badge ${getWebVitalRating('lcp', mobileData.lcp.avg).badgeClass}">${getWebVitalRating('lcp', mobileData.lcp.avg).rating}</span></td>
              <td class="py-4 px-6 text-center font-mono text-slate-400">≤ 2,500 ms</td>
            </tr>
            <tr class="hover:bg-slate-800/30">
              <td class="py-4 px-6 font-semibold text-white">Cumulative Layout Shift (CLS)</td>
              <td class="py-4 px-6 text-center font-mono text-sky-400 font-bold">${desktopData.cls.avg}</td>
              <td class="py-4 px-6 text-center"><span class="badge ${getWebVitalRating('cls', desktopData.cls.avg).badgeClass}">${getWebVitalRating('cls', desktopData.cls.avg).rating}</span></td>
              <td class="py-4 px-6 text-center font-mono text-sky-400 font-bold">${mobileData.cls.avg}</td>
              <td class="py-4 px-6 text-center"><span class="badge ${getWebVitalRating('cls', mobileData.cls.avg).badgeClass}">${getWebVitalRating('cls', mobileData.cls.avg).rating}</span></td>
              <td class="py-4 px-6 text-center font-mono text-slate-400">≤ 0.10</td>
            </tr>
            <tr class="hover:bg-slate-800/30">
              <td class="py-4 px-6 font-semibold text-white">DOM Content Loaded Time</td>
              <td class="py-4 px-6 text-center font-mono text-sky-400 font-bold">${desktopData.domContentLoaded.avg} ms</td>
              <td class="py-4 px-6 text-center"><span class="text-xs text-slate-500">-</span></td>
              <td class="py-4 px-6 text-center font-mono text-sky-400 font-bold">${mobileData.domContentLoaded.avg} ms</td>
              <td class="py-4 px-6 text-center"><span class="text-xs text-slate-500">-</span></td>
              <td class="py-4 px-6 text-center font-mono text-slate-400">≤ 2,000 ms</td>
            </tr>
            <tr class="hover:bg-slate-800/30">
              <td class="py-4 px-6 font-semibold text-white">Fully Loaded Time (Load Event)</td>
              <td class="py-4 px-6 text-center font-mono text-sky-400 font-bold">${desktopData.loadEvent.avg} ms</td>
              <td class="py-4 px-6 text-center"><span class="text-xs text-slate-500">-</span></td>
              <td class="py-4 px-6 text-center font-mono text-sky-400 font-bold">${mobileData.loadEvent.avg} ms</td>
              <td class="py-4 px-6 text-center"><span class="text-xs text-slate-500">-</span></td>
              <td class="py-4 px-6 text-center font-mono text-slate-400">≤ 3,500 ms</td>
            </tr>
            <tr class="hover:bg-slate-800/30">
              <td class="py-4 px-6 font-semibold text-white">Total HTTP Network Requests</td>
              <td class="py-4 px-6 text-center font-mono text-sky-400 font-bold">${desktopData.totalRequests.avg}</td>
              <td class="py-4 px-6 text-center"><span class="text-xs text-slate-500">-</span></td>
              <td class="py-4 px-6 text-center font-mono text-sky-400 font-bold">${mobileData.totalRequests.avg}</td>
              <td class="py-4 px-6 text-center"><span class="text-xs text-slate-500">-</span></td>
              <td class="py-4 px-6 text-center font-mono text-slate-400">≤ 80 requests</td>
            </tr>
            <tr class="hover:bg-slate-800/30">
              <td class="py-4 px-6 font-semibold text-white">Total Transferred Payload Size</td>
              <td class="py-4 px-6 text-center font-mono text-sky-400 font-bold">${(desktopData.totalBytes.avg / 1024 / 1024).toFixed(2)} MB</td>
              <td class="py-4 px-6 text-center"><span class="text-xs text-slate-500">-</span></td>
              <td class="py-4 px-6 text-center font-mono text-sky-400 font-bold">${(mobileData.totalBytes.avg / 1024 / 1024).toFixed(2)} MB</td>
              <td class="py-4 px-6 text-center"><span class="text-xs text-slate-500">-</span></td>
              <td class="py-4 px-6 text-center font-mono text-slate-400">≤ 2.50 MB</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- RESOURCE WEIGHT BREAKDOWN TABLES -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      <!-- DESKTOP RESOURCE BREAKDOWN -->
      <div class="glass-card p-6 space-y-4">
        <h4 class="text-lg font-bold text-white border-b border-slate-800 pb-3">Desktop Resource Distribution</h4>
        <div class="space-y-3">
          <div class="flex justify-between items-center text-sm">
            <span class="text-slate-400">🖼️ Images</span>
            <span class="font-mono text-white font-bold">${desktopData.resourceBreakdown.image.count} files | ${(desktopData.resourceBreakdown.image.bytes / 1024 / 1024).toFixed(2)} MB</span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-slate-400">⚡ Scripts (JS)</span>
            <span class="font-mono text-white font-bold">${desktopData.resourceBreakdown.script.count} files | ${(desktopData.resourceBreakdown.script.bytes / 1024 / 1024).toFixed(2)} MB</span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-slate-400">🎨 Styles (CSS)</span>
            <span class="font-mono text-white font-bold">${desktopData.resourceBreakdown.stylesheet.count} files | ${(desktopData.resourceBreakdown.stylesheet.bytes / 1024).toFixed(1)} KB</span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-slate-400">🔤 Fonts</span>
            <span class="font-mono text-white font-bold">${desktopData.resourceBreakdown.font.count} files | ${(desktopData.resourceBreakdown.font.bytes / 1024).toFixed(1)} KB</span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-slate-400">🌐 XHR / API Requests</span>
            <span class="font-mono text-white font-bold">${desktopData.resourceBreakdown.xhr.count} files | ${(desktopData.resourceBreakdown.xhr.bytes / 1024).toFixed(1)} KB</span>
          </div>
        </div>
      </div>

      <!-- MOBILE RESOURCE BREAKDOWN -->
      <div class="glass-card p-6 space-y-4">
        <h4 class="text-lg font-bold text-white border-b border-slate-800 pb-3">Mobile Resource Distribution</h4>
        <div class="space-y-3">
          <div class="flex justify-between items-center text-sm">
            <span class="text-slate-400">🖼️ Images</span>
            <span class="font-mono text-white font-bold">${mobileData.resourceBreakdown.image.count} files | ${(mobileData.resourceBreakdown.image.bytes / 1024 / 1024).toFixed(2)} MB</span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-slate-400">⚡ Scripts (JS)</span>
            <span class="font-mono text-white font-bold">${mobileData.resourceBreakdown.script.count} files | ${(mobileData.resourceBreakdown.script.bytes / 1024 / 1024).toFixed(2)} MB</span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-slate-400">🎨 Styles (CSS)</span>
            <span class="font-mono text-white font-bold">${mobileData.resourceBreakdown.stylesheet.count} files | ${(mobileData.resourceBreakdown.stylesheet.bytes / 1024).toFixed(1)} KB</span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-slate-400">🔤 Fonts</span>
            <span class="font-mono text-white font-bold">${mobileData.resourceBreakdown.font.count} files | ${(mobileData.resourceBreakdown.font.bytes / 1024).toFixed(1)} KB</span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-slate-400">🌐 XHR / API Requests</span>
            <span class="font-mono text-white font-bold">${mobileData.resourceBreakdown.xhr.count} files | ${(mobileData.resourceBreakdown.xhr.bytes / 1024).toFixed(1)} KB</span>
          </div>
        </div>
      </div>

    </div>

    <!-- SLOWEST ASSETS TABLE -->
    <div class="glass-card p-6">
      <h3 class="text-xl font-extrabold text-white mb-4">Top 5 Slowest Assets (Desktop vs Mobile)</h3>
      <div class="overflow-x-auto">
        <table class="min-w-full text-xs text-left text-slate-300">
          <thead class="bg-slate-900/80 text-slate-400 uppercase">
            <tr>
              <th class="py-2.5 px-4">Device</th>
              <th class="py-2.5 px-4">Type</th>
              <th class="py-2.5 px-4">Duration</th>
              <th class="py-2.5 px-4">Size</th>
              <th class="py-2.5 px-4">URL</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            ${[...desktopData.slowestRequests.slice(0, 5).map(s => ({ ...s, device: 'Desktop' })),
               ...mobileData.slowestRequests.slice(0, 5).map(s => ({ ...s, device: 'Mobile' }))]
              .map(s => `
                <tr class="hover:bg-slate-800/40">
                  <td class="py-2.5 px-4 font-bold text-white">${s.device}</td>
                  <td class="py-2.5 px-4 uppercase font-mono text-sky-400">${s.resourceType}</td>
                  <td class="py-2.5 px-4 font-mono font-bold text-amber-400">${Math.round(s.durationMs)} ms</td>
                  <td class="py-2.5 px-4 font-mono">${(s.responseBytes / 1024).toFixed(1)} KB</td>
                  <td class="py-2.5 px-4 font-mono truncate max-w-md text-slate-400" title="${s.url}">${s.url}</td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    </div>

  </div>

  <script>
    window.onload = function() {
      // 1. Metrics Chart
      const ctx1 = document.getElementById('metricsChart').getContext('2d');
      new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: ['TTFB', 'FCP', 'LCP', 'DOMContentLoaded', 'Load Event'],
          datasets: [
            {
              label: 'Desktop (ms)',
              data: [${desktopData.ttfb.avg}, ${desktopData.fcp.avg}, ${desktopData.lcp.avg}, ${desktopData.domContentLoaded.avg}, ${desktopData.loadEvent.avg}],
              backgroundColor: '#38bdf8',
              borderRadius: 6
            },
            {
              label: 'Mobile (ms)',
              data: [${mobileData.ttfb.avg}, ${mobileData.fcp.avg}, ${mobileData.lcp.avg}, ${mobileData.domContentLoaded.avg}, ${mobileData.loadEvent.avg}],
              backgroundColor: '#a855f7',
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#cbd5e1' } } },
          scales: {
            x: { grid: { color: '#1e293b' }, ticks: { color: '#cbd5e1' } },
            y: { grid: { color: '#1e293b' }, ticks: { color: '#cbd5e1' } }
          }
        }
      });

      // 2. Weight Chart
      const ctx2 = document.getElementById('weightChart').getContext('2d');
      new Chart(ctx2, {
        type: 'bar',
        data: {
          labels: ['Total Payload (MB)', 'Request Count'],
          datasets: [
            {
              label: 'Desktop',
              data: [${(desktopData.totalBytes.avg / 1024 / 1024).toFixed(2)}, ${desktopData.totalRequests.avg}],
              backgroundColor: '#10b981',
              borderRadius: 6
            },
            {
              label: 'Mobile',
              data: [${(mobileData.totalBytes.avg / 1024 / 1024).toFixed(2)}, ${mobileData.totalRequests.avg}],
              backgroundColor: '#f59e0b',
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#cbd5e1' } } },
          scales: {
            x: { grid: { color: '#1e293b' }, ticks: { color: '#cbd5e1' } },
            y: { grid: { color: '#1e293b' }, ticks: { color: '#cbd5e1' } }
          }
        }
      });
    };
  </script>
</body>
</html>`;

  await fs.writeFile(outputPath, htmlContent, 'utf-8');
  console.log(` HTML Dashboard generated at ${outputPath}`);
}

async function runAudit() {
  console.log(" Starting Beta Homepage Speed Measurement...");

  // Desktop context options
  const desktopOptions = {
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    deviceScaleFactor: 1
  };

  // Mobile context options (iPhone 12 / Modern Mobile view)
  const mobileOptions = {
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3
  };

  const desktopData = await measureSpeed(desktopOptions, 'desktop');
  const mobileData = await measureSpeed(mobileOptions, 'mobile');

  const fullReport = {
    url: TARGET_URL,
    timestamp: new Date().toISOString(),
    desktop: desktopData,
    mobile: mobileData
  };

  // Save JSON
  const jsonPath = path.join(__dirname, 'beta_homepage_speed_report.json');
  await fs.writeJson(jsonPath, fullReport, { spaces: 2 });
  console.log(` Saved raw JSON report to ${jsonPath}`);

  // Generate Excel Report
  const excelPath = path.join(__dirname, 'home page speed report.xlsx');
  await generateExcelReport(desktopData, mobileData, excelPath);

  // Also write to page_speed_and_requests_report.xlsx for fallback
  const excelPath2 = path.join(__dirname, 'beta_homepage_speed_report.xlsx');
  await generateExcelReport(desktopData, mobileData, excelPath2);

  // Generate HTML Dashboard
  const htmlPath = path.join(__dirname, 'Beta_Homepage_Speed_Dashboard.html');
  await generateHtmlDashboard(desktopData, mobileData, htmlPath);

  console.log("\n SPEED TEST COMPLETED SUCCESSFULLY!");
}

runAudit().catch(err => {
  console.error(" Error running speed test:", err);
  process.exit(1);
});
