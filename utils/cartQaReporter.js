const fs = require('fs-extra');
const path = require('path');

class CartQaReporter {
  /**
   * Generate a comprehensive Cart QA HTML Report
   * @param {Object} reportData - { bugs: [], testResults: [], performance: {}, consoleErrors: [], networkErrors: [], apiLogs: [], summary: {} }
   * @param {string} outputPath - Path to write the HTML report
   */
  static async generate(reportData, outputPath) {
    await fs.ensureDir(path.dirname(outputPath));

    const {
      bugs = [],
      testResults = [],
      performance = {},
      consoleErrors = [],
      networkErrors = [],
      apiLogs = [],
      summary = {}
    } = reportData;

    // Compute severity counts
    const severityCounts = {
      critical: bugs.filter(b => b.severity === 'Critical').length,
      high: bugs.filter(b => b.severity === 'High').length,
      medium: bugs.filter(b => b.severity === 'Medium').length,
      low: bugs.filter(b => b.severity === 'Low').length
    };

    // Compute category counts
    const categoryCounts = {};
    bugs.forEach(b => {
      const cat = b.module || 'Uncategorized';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    // Compute test pass/fail
    const testsPassed = testResults.filter(t => t.status === 'passed').length;
    const testsFailed = testResults.filter(t => t.status === 'failed').length;
    const testsSkipped = testResults.filter(t => t.status === 'skipped').length;
    const totalTests = testResults.length;

    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cart Page Deep QA Report – WoodenStreet Beta</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Outfit', sans-serif; background-color: #0f172a; color: #f1f5f9; }
    .glass-card { background: rgba(30, 41, 59, 0.45); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; }
    .score-glow { text-shadow: 0 0 20px rgba(56,189,248,0.4); }
    .severity-critical { background: rgba(239,68,68,0.15); border-left: 4px solid #ef4444; }
    .severity-high { background: rgba(249,115,22,0.15); border-left: 4px solid #f97316; }
    .severity-medium { background: rgba(234,179,8,0.15); border-left: 4px solid #eab308; }
    .severity-low { background: rgba(56,189,248,0.15); border-left: 4px solid #38bdf8; }
    .pill-critical { background: rgba(239,68,68,0.2); color: #fca5a5; border: 1px solid rgba(239,68,68,0.3); }
    .pill-high { background: rgba(249,115,22,0.2); color: #fdba74; border: 1px solid rgba(249,115,22,0.3); }
    .pill-medium { background: rgba(234,179,8,0.2); color: #fde047; border: 1px solid rgba(234,179,8,0.3); }
    .pill-low { background: rgba(56,189,248,0.2); color: #7dd3fc; border: 1px solid rgba(56,189,248,0.3); }
  </style>
</head>
<body class="p-6 md:p-10 min-h-screen">
  <div class="max-w-7xl mx-auto space-y-8">

    <!-- HEADER -->
    <header class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-800">
      <div>
        <h1 class="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
          <span>🛒</span> Cart Page Deep QA Report
        </h1>
        <p class="text-slate-400 mt-1">WoodenStreet Beta – Comprehensive Exploratory Testing</p>
      </div>
      <div class="flex items-center gap-3 flex-wrap">
        <span class="text-sm bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 text-slate-300">
          🕐 <strong class="text-white">${timestamp}</strong>
        </span>
        <span class="text-sm bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 text-slate-300">
          Env: <strong class="text-white">Beta</strong>
        </span>
        <span class="text-sm bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 text-slate-300">
          Browser: <strong class="text-white">Chromium</strong>
        </span>
      </div>
    </header>

    <!-- KPI DASHBOARD -->
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
      <div class="glass-card p-4 text-center">
        <div class="text-slate-400 text-xs font-semibold uppercase">Total Bugs</div>
        <div class="text-3xl font-black mt-1 ${bugs.length > 0 ? 'text-rose-400' : 'text-emerald-400'}">${bugs.length}</div>
      </div>
      <div class="glass-card p-4 text-center">
        <div class="text-slate-400 text-xs font-semibold uppercase">Critical</div>
        <div class="text-3xl font-black mt-1 text-red-400">${severityCounts.critical}</div>
      </div>
      <div class="glass-card p-4 text-center">
        <div class="text-slate-400 text-xs font-semibold uppercase">High</div>
        <div class="text-3xl font-black mt-1 text-orange-400">${severityCounts.high}</div>
      </div>
      <div class="glass-card p-4 text-center">
        <div class="text-slate-400 text-xs font-semibold uppercase">Medium</div>
        <div class="text-3xl font-black mt-1 text-yellow-400">${severityCounts.medium}</div>
      </div>
      <div class="glass-card p-4 text-center">
        <div class="text-slate-400 text-xs font-semibold uppercase">Low</div>
        <div class="text-3xl font-black mt-1 text-sky-400">${severityCounts.low}</div>
      </div>
      <div class="glass-card p-4 text-center">
        <div class="text-slate-400 text-xs font-semibold uppercase">Tests Run</div>
        <div class="text-3xl font-black mt-1 text-white">${totalTests}</div>
      </div>
      <div class="glass-card p-4 text-center">
        <div class="text-slate-400 text-xs font-semibold uppercase">Passed</div>
        <div class="text-3xl font-black mt-1 text-emerald-400">${testsPassed}</div>
      </div>
      <div class="glass-card p-4 text-center">
        <div class="text-slate-400 text-xs font-semibold uppercase">Failed</div>
        <div class="text-3xl font-black mt-1 text-rose-400">${testsFailed}</div>
      </div>
    </div>

    <!-- CHARTS -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="glass-card p-6">
        <h3 class="text-lg font-bold mb-4 text-white">Bug Severity Distribution</h3>
        <div class="h-64 relative flex items-center justify-center">
          <canvas id="severityChart"></canvas>
        </div>
      </div>
      <div class="glass-card p-6">
        <h3 class="text-lg font-bold mb-4 text-white">Bug Category Breakdown</h3>
        <div class="h-64 relative flex items-center justify-center">
          <canvas id="categoryChart"></canvas>
        </div>
      </div>
    </div>

    <!-- TABS -->
    <div class="glass-card overflow-hidden">
      <nav class="flex flex-wrap border-b border-slate-800 bg-slate-900/50">
        <button onclick="switchTab(event,'tab-bugs')" class="tab-btn px-6 py-4 border-b-2 border-sky-500 text-sky-400 font-semibold text-sm focus:outline-none">🐛 All Bugs (${bugs.length})</button>
        <button onclick="switchTab(event,'tab-console')" class="tab-btn px-6 py-4 border-b-2 border-transparent text-slate-400 hover:text-white font-semibold text-sm focus:outline-none">💻 Console (${consoleErrors.length})</button>
        <button onclick="switchTab(event,'tab-network')" class="tab-btn px-6 py-4 border-b-2 border-transparent text-slate-400 hover:text-white font-semibold text-sm focus:outline-none">🌐 Network (${networkErrors.length})</button>
        <button onclick="switchTab(event,'tab-api')" class="tab-btn px-6 py-4 border-b-2 border-transparent text-slate-400 hover:text-white font-semibold text-sm focus:outline-none">⚡ APIs (${apiLogs.length})</button>
        <button onclick="switchTab(event,'tab-perf')" class="tab-btn px-6 py-4 border-b-2 border-transparent text-slate-400 hover:text-white font-semibold text-sm focus:outline-none">⏱️ Performance</button>
        <button onclick="switchTab(event,'tab-tests')" class="tab-btn px-6 py-4 border-b-2 border-transparent text-slate-400 hover:text-white font-semibold text-sm focus:outline-none">✅ Test Results (${totalTests})</button>
        <button onclick="switchTab(event,'tab-risk')" class="tab-btn px-6 py-4 border-b-2 border-transparent text-slate-400 hover:text-white font-semibold text-sm focus:outline-none">⚠️ Risk Assessment</button>
      </nav>

      <div class="p-6">

        <!-- ALL BUGS TAB -->
        <div id="tab-bugs" class="tab-content block space-y-4">
          <h4 class="text-lg font-bold text-white mb-4">Discovered Bugs</h4>
          ${bugs.length > 0 ? bugs.map((bug, i) => `
          <div class="severity-${bug.severity.toLowerCase()} rounded-lg p-5 space-y-3">
            <div class="flex items-start justify-between gap-4 flex-wrap">
              <div class="flex items-center gap-3">
                <span class="pill-${bug.severity.toLowerCase()} px-2 py-0.5 rounded text-xs font-bold uppercase">${bug.severity}</span>
                <span class="text-white font-bold">${bug.bugId}</span>
                <span class="text-slate-300">–</span>
                <span class="text-white font-semibold">${bug.title}</span>
              </div>
              <div class="flex gap-2 flex-wrap">
                <span class="bg-slate-800 px-2 py-0.5 rounded text-xs text-slate-300 border border-slate-700">${bug.module}</span>
                <span class="bg-slate-800 px-2 py-0.5 rounded text-xs text-slate-300 border border-slate-700">Priority: ${bug.priority}</span>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p class="text-slate-400 font-semibold mb-1">Environment</p>
                <p class="text-slate-200">${bug.environment || 'Desktop Chrome'}</p>
              </div>
              <div>
                <p class="text-slate-400 font-semibold mb-1">Preconditions</p>
                <p class="text-slate-200">${bug.preconditions || 'Cart page loaded with products'}</p>
              </div>
            </div>
            <div class="text-sm">
              <p class="text-slate-400 font-semibold mb-1">Steps to Reproduce</p>
              <p class="text-slate-200 whitespace-pre-line">${bug.steps || '-'}</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p class="text-rose-400 font-semibold mb-1">Actual Result</p>
                <p class="text-slate-200">${bug.actualResult || '-'}</p>
              </div>
              <div>
                <p class="text-emerald-400 font-semibold mb-1">Expected Result</p>
                <p class="text-slate-200">${bug.expectedResult || '-'}</p>
              </div>
            </div>
            ${bug.evidence ? `
            <div class="text-sm">
              <p class="text-slate-400 font-semibold mb-1">Evidence</p>
              <p class="text-slate-200 font-mono text-xs whitespace-pre-wrap bg-slate-900/50 p-3 rounded">${bug.evidence}</p>
            </div>` : ''}
            ${bug.possibleRootCause ? `
            <div class="text-sm">
              <p class="text-slate-400 font-semibold mb-1">Possible Root Cause</p>
              <p class="text-slate-200">${bug.possibleRootCause}</p>
            </div>` : ''}
          </div>
          `).join('') : '<p class="text-center text-slate-500 py-8">No bugs discovered! 🎉</p>'}
        </div>

        <!-- CONSOLE TAB -->
        <div id="tab-console" class="tab-content hidden">
          <h4 class="text-lg font-bold mb-3 text-white">Browser Console Errors & Warnings</h4>
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm text-left text-slate-300">
              <thead class="text-slate-400 uppercase text-xs bg-slate-900/50">
                <tr>
                  <th class="py-3 px-4">Type</th>
                  <th class="py-3 px-4">Message</th>
                  <th class="py-3 px-4">Page</th>
                  <th class="py-3 px-4">Location</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800">
                ${consoleErrors.length > 0 ? consoleErrors.map(err => `
                <tr class="hover:bg-slate-800/40">
                  <td class="py-3 px-4"><span class="px-2 py-0.5 rounded text-xs uppercase font-mono ${err.type === 'exception' ? 'pill-critical' : (err.type === 'error' ? 'pill-high' : 'pill-medium')}">${err.type}</span></td>
                  <td class="py-3 px-4 text-xs font-mono break-all max-w-lg">${escapeHtml(err.text || '')}</td>
                  <td class="py-3 px-4 truncate max-w-xs text-slate-400">${err.url || ''}</td>
                  <td class="py-3 px-4 text-xs font-mono text-slate-500">${err.location || err.stack || '-'}</td>
                </tr>
                `).join('') : '<tr><td colspan="4" class="py-6 text-center text-slate-500">No console errors! 💻</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>

        <!-- NETWORK TAB -->
        <div id="tab-network" class="tab-content hidden">
          <h4 class="text-lg font-bold mb-3 text-white">Network Failures</h4>
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm text-left text-slate-300">
              <thead class="text-slate-400 uppercase text-xs bg-slate-900/50">
                <tr>
                  <th class="py-3 px-4">URL</th>
                  <th class="py-3 px-4">Status</th>
                  <th class="py-3 px-4">Type</th>
                  <th class="py-3 px-4">Error</th>
                  <th class="py-3 px-4">Page</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800">
                ${networkErrors.length > 0 ? networkErrors.map(err => `
                <tr class="hover:bg-slate-800/40">
                  <td class="py-3 px-4 text-sky-400 break-all max-w-xs">${err.url || ''}</td>
                  <td class="py-3 px-4 font-mono font-bold text-rose-400">${err.status || '-'}</td>
                  <td class="py-3 px-4">${err.resourceType || '-'}</td>
                  <td class="py-3 px-4 text-xs">${err.errorText || err.statusText || '-'}</td>
                  <td class="py-3 px-4 truncate max-w-xs text-slate-400">${err.pageUrl || ''}</td>
                </tr>
                `).join('') : '<tr><td colspan="5" class="py-6 text-center text-slate-500">No network failures! 🌐</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>

        <!-- API TAB -->
        <div id="tab-api" class="tab-content hidden">
          <h4 class="text-lg font-bold mb-3 text-white">API Interceptions</h4>
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm text-left text-slate-300">
              <thead class="text-slate-400 uppercase text-xs bg-slate-900/50">
                <tr>
                  <th class="py-3 px-4">Method</th>
                  <th class="py-3 px-4">Endpoint</th>
                  <th class="py-3 px-4">Status</th>
                  <th class="py-3 px-4">Latency (ms)</th>
                  <th class="py-3 px-4">Page</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800">
                ${apiLogs.length > 0 ? apiLogs.map(api => `
                <tr class="hover:bg-slate-800/40">
                  <td class="py-3 px-4 font-mono font-bold text-white uppercase">${api.method || '-'}</td>
                  <td class="py-3 px-4 text-sky-400 truncate max-w-sm">${api.url || ''}</td>
                  <td class="py-3 px-4 font-mono font-bold ${(api.status || 0) >= 400 ? 'text-rose-400' : 'text-emerald-400'}">${api.status || '-'}</td>
                  <td class="py-3 px-4 font-mono">${api.responseTime || 0} ms</td>
                  <td class="py-3 px-4 truncate max-w-xs text-slate-400">${api.pageUrl || ''}</td>
                </tr>
                `).join('') : '<tr><td colspan="5" class="py-6 text-center text-slate-500">No API calls recorded!</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>

        <!-- PERFORMANCE TAB -->
        <div id="tab-perf" class="tab-content hidden">
          <h4 class="text-lg font-bold mb-3 text-white">Performance Metrics</h4>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div class="glass-card p-4 text-center">
              <div class="text-slate-400 text-xs">Page Load</div>
              <div class="text-2xl font-bold mt-1 text-white">${performance.pageLoadTime ? (performance.pageLoadTime / 1000).toFixed(2) + 's' : 'N/A'}</div>
            </div>
            <div class="glass-card p-4 text-center">
              <div class="text-slate-400 text-xs">DOM Content</div>
              <div class="text-2xl font-bold mt-1 text-white">${performance.domContentLoaded ? (performance.domContentLoaded / 1000).toFixed(2) + 's' : 'N/A'}</div>
            </div>
            <div class="glass-card p-4 text-center">
              <div class="text-slate-400 text-xs">FCP</div>
              <div class="text-2xl font-bold mt-1 text-white">${performance.fcp ? (performance.fcp / 1000).toFixed(2) + 's' : 'N/A'}</div>
            </div>
            <div class="glass-card p-4 text-center">
              <div class="text-slate-400 text-xs">LCP</div>
              <div class="text-2xl font-bold mt-1 text-white">${performance.lcp ? (performance.lcp / 1000).toFixed(2) + 's' : 'N/A'}</div>
            </div>
            <div class="glass-card p-4 text-center">
              <div class="text-slate-400 text-xs">TTI (est.)</div>
              <div class="text-2xl font-bold mt-1 text-white">${performance.tti ? (performance.tti / 1000).toFixed(2) + 's' : 'N/A'}</div>
            </div>
            <div class="glass-card p-4 text-center">
              <div class="text-slate-400 text-xs">TBT (est.)</div>
              <div class="text-2xl font-bold mt-1 text-white">${performance.tbt ? (performance.tbt / 1000).toFixed(2) + 's' : 'N/A'}</div>
            </div>
          </div>
        </div>

        <!-- TEST RESULTS TAB -->
        <div id="tab-tests" class="tab-content hidden">
          <h4 class="text-lg font-bold mb-3 text-white">Individual Test Results</h4>
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm text-left text-slate-300">
              <thead class="text-slate-400 uppercase text-xs bg-slate-900/50">
                <tr>
                  <th class="py-3 px-4">Status</th>
                  <th class="py-3 px-4">Test Name</th>
                  <th class="py-3 px-4">Category</th>
                  <th class="py-3 px-4">Duration</th>
                  <th class="py-3 px-4">Error</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800">
                ${testResults.length > 0 ? testResults.map(t => `
                <tr class="hover:bg-slate-800/40">
                  <td class="py-3 px-4">
                    <span class="px-2 py-0.5 rounded text-xs font-bold uppercase ${t.status === 'passed' ? 'bg-emerald-500/10 text-emerald-400' : (t.status === 'failed' ? 'pill-critical' : 'pill-medium')}">${t.status === 'passed' ? '✅ Pass' : (t.status === 'failed' ? '❌ Fail' : '⏭️ Skip')}</span>
                  </td>
                  <td class="py-3 px-4 text-white font-medium">${escapeHtml(t.name || '')}</td>
                  <td class="py-3 px-4 text-slate-400">${t.category || '-'}</td>
                  <td class="py-3 px-4 font-mono">${t.duration || '-'}</td>
                  <td class="py-3 px-4 text-xs font-mono text-rose-300 max-w-md break-all">${escapeHtml(t.error || '')}</td>
                </tr>
                `).join('') : '<tr><td colspan="5" class="py-6 text-center text-slate-500">No test results recorded!</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>

        <!-- RISK ASSESSMENT TAB -->
        <div id="tab-risk" class="tab-content hidden">
          <h4 class="text-lg font-bold mb-3 text-white">Risk Assessment & Recommendations</h4>
          <div class="space-y-6">
            <div class="glass-card p-6">
              <h5 class="font-bold text-white mb-3">🔴 Areas Requiring Immediate Attention</h5>
              <ul class="list-disc list-inside text-slate-300 space-y-1">
                ${severityCounts.critical > 0 ? `<li>${severityCounts.critical} Critical bug(s) found – must be fixed before production release</li>` : ''}
                ${severityCounts.high > 0 ? `<li>${severityCounts.high} High severity bug(s) – should be addressed in current sprint</li>` : ''}
                ${consoleErrors.filter(e => e.type === 'exception').length > 0 ? `<li>${consoleErrors.filter(e => e.type === 'exception').length} unhandled JavaScript exception(s)</li>` : ''}
                ${networkErrors.filter(e => e.status >= 500).length > 0 ? `<li>${networkErrors.filter(e => e.status >= 500).length} server error(s) (5xx) detected</li>` : ''}
                ${(severityCounts.critical + severityCounts.high) === 0 && consoleErrors.filter(e => e.type === 'exception').length === 0 ? '<li class="text-emerald-400">No critical issues found ✅</li>' : ''}
              </ul>
            </div>
            <div class="glass-card p-6">
              <h5 class="font-bold text-white mb-3">📋 Areas Requiring Regression Testing</h5>
              <ul class="list-disc list-inside text-slate-300 space-y-1">
                <li>Cart add/remove/update quantity flows</li>
                <li>Price calculation accuracy (subtotal, discounts, tax, grand total)</li>
                <li>Coupon application and removal</li>
                <li>Cross-page cart state persistence</li>
                <li>Checkout flow from cart</li>
                <li>Responsive layout across all breakpoints</li>
              </ul>
            </div>
            <div class="glass-card p-6">
              <h5 class="font-bold text-white mb-3">🤖 Areas Requiring Automation Coverage</h5>
              <ul class="list-disc list-inside text-slate-300 space-y-1">
                <li>Cart API response validation (status codes, payloads)</li>
                <li>Price calculation regression tests</li>
                <li>Quantity boundary tests (min/max/invalid)</li>
                <li>Cart persistence across sessions</li>
                <li>Accessibility compliance monitoring</li>
                <li>Performance metric tracking (LCP, FCP, CLS)</li>
              </ul>
            </div>
            <div class="glass-card p-6">
              <h5 class="font-bold text-white mb-3">🔍 Additional Scenarios (Environment Limitations)</h5>
              <ul class="list-disc list-inside text-slate-300 space-y-1">
                <li>Logged-in user cart sync across devices</li>
                <li>EMI calculation validation with real bank offers</li>
                <li>Real payment gateway integration testing</li>
                <li>Production-level load testing (concurrent users)</li>
                <li>Real mobile device testing (iOS Safari, Android Chrome)</li>
                <li>Session expiry and timeout handling</li>
                <li>Product out-of-stock while in cart (requires backend simulation)</li>
                <li>Price change while cart is open (requires backend simulation)</li>
                <li>Multi-tab cart synchronization</li>
                <li>Slow 3G / offline mode testing</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>

  <script>
    function switchTab(evt, tabId) {
      document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
      document.getElementById(tabId).classList.remove('hidden');
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('border-sky-500','text-sky-400');
        b.classList.add('border-transparent','text-slate-400');
      });
      evt.currentTarget.classList.remove('border-transparent','text-slate-400');
      evt.currentTarget.classList.add('border-sky-500','text-sky-400');
    }

    window.onload = function() {
      // Severity Chart
      const sevCtx = document.getElementById('severityChart').getContext('2d');
      new Chart(sevCtx, {
        type: 'doughnut',
        data: {
          labels: ['Critical','High','Medium','Low'],
          datasets: [{
            data: [${severityCounts.critical},${severityCounts.high},${severityCounts.medium},${severityCounts.low}],
            backgroundColor: ['#ef4444','#f97316','#eab308','#38bdf8'],
            borderWidth: 2,
            borderColor: '#1e293b'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#f1f5f9' }, position: 'bottom' } }
        }
      });

      // Category Chart
      const catCtx = document.getElementById('categoryChart').getContext('2d');
      const catLabels = ${JSON.stringify(Object.keys(categoryCounts))};
      const catData = ${JSON.stringify(Object.values(categoryCounts))};
      const colors = ['#ec4899','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#6366f1','#14b8a6','#f43f5e','#a855f7'];
      new Chart(catCtx, {
        type: 'bar',
        data: {
          labels: catLabels,
          datasets: [{
            label: 'Bugs',
            data: catData,
            backgroundColor: catLabels.map((_, i) => colors[i % colors.length]),
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: '#334155' }, ticks: { color: '#cbd5e1', stepSize: 1 } },
            y: { grid: { color: '#334155' }, ticks: { color: '#cbd5e1' } }
          }
        }
      });
    };

    function escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }
  </script>
</body>
</html>`;

    // Helper to escape HTML for server-side template strings
    function escapeHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    await fs.writeFile(outputPath, html, 'utf-8');
    console.log(`Cart QA Report generated: ${outputPath}`);
  }
}

module.exports = CartQaReporter;
