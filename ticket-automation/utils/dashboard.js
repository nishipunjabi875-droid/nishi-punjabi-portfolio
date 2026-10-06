const fs = require('fs');
const path = require('path');
const config = require('../config/config');

class DashboardGenerator {
  static generate(stats, testResults, l1CoverageMap, outputPath = config.dashboardPath) {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const failedTests = testResults.filter(r => r.status === 'FAIL');

    // Group combinations by L1 for matrix grid
    const l1Grouped = {};
    testResults.forEach(r => {
      if (!l1Grouped[r.l1]) l1Grouped[r.l1] = [];
      l1Grouped[r.l1].push(r);
    });

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket Creation QA Automation Dashboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #0f172a;
      --bg-card: rgba(30, 41, 59, 0.7);
      --border-color: rgba(255, 255, 255, 0.1);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      
      --pass-green: #10b981;
      --fail-red: #ef4444;
      --skip-yellow: #f59e0b;
      --accent-blue: #3b82f6;

      --pass-bg: rgba(16, 185, 129, 0.15);
      --fail-bg: rgba(239, 68, 68, 0.15);
      --skip-bg: rgba(245, 158, 11, 0.15);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    body {
      background-color: var(--bg-dark);
      background-image: 
        radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.08) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.08) 0px, transparent 50%);
      color: var(--text-main);
      min-height: 100vh;
      padding: 2rem;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .title-area h1 {
      font-size: 1.8rem;
      font-weight: 800;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .title-area p {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin-top: 0.25rem;
    }

    .timestamp-badge {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    /* Summary Grid */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2.5rem;
    }

    .card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      backdrop-filter: blur(12px);
      border-radius: 12px;
      padding: 1.25rem;
      text-align: center;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }

    .card:hover {
      transform: translateY(-2px);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .card-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .card-value {
      font-size: 2.2rem;
      font-weight: 800;
      margin-top: 0.5rem;
    }

    .card.pass .card-value { color: var(--pass-green); }
    .card.fail .card-value { color: var(--fail-red); }
    .card.skip .card-value { color: var(--skip-yellow); }
    .card.rate .card-value { color: var(--accent-blue); }

    /* Section Styles */
    .section-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .table-container {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 2.5rem;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.9rem;
    }

    th {
      background: rgba(15, 23, 42, 0.6);
      color: var(--text-muted);
      font-weight: 700;
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.05em;
      padding: 1rem;
      border-bottom: 1px solid var(--border-color);
    }

    td {
      padding: 1rem;
      border-bottom: 1px solid var(--border-color);
    }

    tr:last-child td {
      border-bottom: none;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .badge-pass { background: var(--pass-bg); color: var(--pass-green); border: 1px solid var(--pass-green); }
    .badge-fail { background: var(--fail-bg); color: var(--fail-red); border: 1px solid var(--fail-red); }
    .badge-skip { background: var(--skip-bg); color: var(--skip-yellow); border: 1px solid var(--skip-yellow); }

    /* Matrix Grid */
    .matrix-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2.5rem;
    }

    .l1-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.25rem;
    }

    .l1-title {
      font-size: 1rem;
      font-weight: 700;
      margin-bottom: 0.8rem;
      color: var(--accent-blue);
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.5rem;
    }

    .l2-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.4rem 0;
      font-size: 0.85rem;
    }

    .l2-name {
      color: var(--text-main);
    }

    /* Screenshots gallery */
    .screenshot-link {
      color: var(--accent-blue);
      text-decoration: none;
      font-weight: 600;
    }

    .screenshot-link:hover {
      text-decoration: underline;
    }

    footer {
      text-align: center;
      color: var(--text-muted);
      font-size: 0.85rem;
      margin-top: 3rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
    }
  </style>
</head>
<body>

  <header>
    <div class="title-area">
      <h1>Website Ticket Creation QA Dashboard</h1>
      <p>Automated Verification of L1 Issue Types & L2 Sub-Issue Types</p>
    </div>
    <div class="timestamp-badge">
      Generated: ${new Date().toLocaleString()}
    </div>
  </header>

  <!-- Summary Cards -->
  <div class="summary-grid">
    <div class="card">
      <div class="card-label">Total Tests</div>
      <div class="card-value">${stats.totalTests || 0}</div>
    </div>
    <div class="card pass">
      <div class="card-label">Passed</div>
      <div class="card-value">${stats.passed || 0}</div>
    </div>
    <div class="card fail">
      <div class="card-label">Failed</div>
      <div class="card-value">${stats.failed || 0}</div>
    </div>
    <div class="card skip">
      <div class="card-label">Skipped</div>
      <div class="card-value">${stats.skipped || 0}</div>
    </div>
    <div class="card rate">
      <div class="card-label">Pass Rate</div>
      <div class="card-value">${stats.passRate || '0.00'}%</div>
    </div>
    <div class="card rate">
      <div class="card-label">Execution Time</div>
      <div class="card-value" style="font-size: 1.5rem; margin-top: 0.8rem;">${stats.duration || '0s'}</div>
    </div>
  </div>

  <!-- L1 Coverage Table -->
  <div class="section-title">📊 L1 Issue Type Coverage</div>
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>L1 Issue Type</th>
          <th>Total L2 Sub-Types</th>
          <th>Tested</th>
          <th>Passed</th>
          <th>Failed</th>
          <th>Pass Rate</th>
        </tr>
      </thead>
      <tbody>
        ${Object.keys(l1CoverageMap).map(l1 => {
          const cov = l1CoverageMap[l1];
          const rate = cov.total > 0 ? ((cov.passed / cov.total) * 100).toFixed(1) : '100.0';
          return `
            <tr>
              <td><strong>${l1}</strong></td>
              <td>${cov.total}</td>
              <td>${cov.tested}</td>
              <td style="color: var(--pass-green); font-weight: 700;">${cov.passed}</td>
              <td style="color: var(--fail-red); font-weight: 700;">${cov.failed}</td>
              <td><strong>${rate}%</strong></td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  </div>

  <!-- L1/L2 Matrix Grid -->
  <div class="section-title">🧩 L1 / L2 Test Matrix</div>
  <div class="matrix-grid">
    ${Object.keys(l1Grouped).map(l1 => `
      <div class="l1-card">
        <div class="l1-title">${l1}</div>
        ${l1Grouped[l1].map(res => `
          <div class="l2-item">
            <span class="l2-name">${res.l2}</span>
            <span style="font-family: monospace; font-size: 0.8rem; color: #60a5fa; margin-left: auto; margin-right: 0.5rem;">${res.ticketId ? res.ticketId : 'N/A'}</span>
            <span class="badge badge-${(res.status || 'SKIPPED').toLowerCase()}">${res.status}</span>
          </div>
        `).join('')}
      </div>
    `).join('')}
  </div>

  <!-- Executed Tickets Table -->
  <div class="section-title">🎫 Created Ticket Details</div>
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>Sr No</th>
          <th>L1 Issue Type</th>
          <th>L2 Sub-Issue Type</th>
          <th>Order ID</th>
          <th>Subject</th>
          <th>Ticket ID</th>
          <th>Status</th>
          <th>Duration</th>
        </tr>
      </thead>
      <tbody>
        ${testResults.map((r, index) => `
          <tr>
            <td>${index + 1}</td>
            <td><strong>${r.l1}</strong></td>
            <td>${r.l2}</td>
            <td><code>${r.orderId || 'WS-TEST-100234'}</code></td>
            <td style="font-size: 0.85rem; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${r.subject}</td>
            <td><span style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 700; font-family: monospace;">${r.ticketId || 'N/A'}</span></td>
            <td><span class="badge badge-${(r.status || 'SKIPPED').toLowerCase()}">${r.status}</span></td>
            <td>${r.duration || '0s'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <!-- Failed Tests Section -->
  ${failedTests.length > 0 ? `
    <div class="section-title" style="color: var(--fail-red);">❌ Failed Test Details (${failedTests.length})</div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>L1 Issue Type</th>
            <th>L2 Sub-Issue Type</th>
            <th>Error Message</th>
            <th>Ticket ID</th>
            <th>Screenshot</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          ${failedTests.map(f => `
            <tr>
              <td><strong>${f.l1}</strong></td>
              <td>${f.l2}</td>
              <td style="color: var(--fail-red);">${f.errorMessage || f.errorType || 'Validation Failure'}</td>
              <td>${f.ticketId || 'N/A'}</td>
              <td>
                ${f.screenshot ? `<a href="${f.screenshot}" target="_blank" class="screenshot-link">🖼️ View Screenshot</a>` : 'N/A'}
              </td>
              <td>${f.endTime || new Date().toLocaleTimeString()}</td>
            </tr>
          `).map(row => row).join('')}
        </tbody>
      </table>
    </div>
  ` : ''}

  <footer>
    Playwright + JavaScript Ticket Creation QA Automation Framework • Reports Directory: ${config.reportsDir}
  </footer>

</body>
</html>`;

    fs.writeFileSync(outputPath, htmlContent, 'utf8');
    return outputPath;
  }
}

module.exports = DashboardGenerator;
