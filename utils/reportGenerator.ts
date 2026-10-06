import * as fs from 'fs';
import * as path from 'path';
import ExcelJS from 'exceljs';
import { Logger } from './logger';

export interface TestCaseResult {
  testId: string;
  title: string;
  category: string;
  tags: string[];
  status: 'PASSED' | 'FAILED' | 'SKIPPED' | 'FLAKY';
  durationMs: number;
  failureCategory?: string;
  failureMessage?: string;
  screenshotPath?: string;
  apiUrlLogs?: string[];
  consoleErrors?: string[];
}

export interface SmokeReportSummary {
  environment: string;
  baseUrl: string;
  browser: string;
  executionDate: string;
  totalDurationMs: number;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  results: TestCaseResult[];
}

export class ReportGenerator {
  public static async generateReports(summary: SmokeReportSummary): Promise<{ excelPath: string; htmlPath: string }> {
    const reportsDir = path.resolve(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const excelPath = path.join(reportsDir, `Daily_Smoke_Test_Report_${timestamp}.xlsx`);
    const defaultExcelPath = path.join(reportsDir, `Daily_Smoke_Test_Report.xlsx`);
    const htmlPath = path.join(reportsDir, `Daily_Smoke_Dashboard_${timestamp}.html`);
    const defaultHtmlPath = path.join(reportsDir, `Daily_Smoke_Dashboard.html`);

    await this.createExcelReport(summary, excelPath);
    await this.createExcelReport(summary, defaultExcelPath);

    this.createHtmlDashboard(summary, htmlPath);
    this.createHtmlDashboard(summary, defaultHtmlPath);

    Logger.info(`Excel report saved to: ${excelPath}`);
    Logger.info(`HTML Dashboard saved to: ${htmlPath}`);

    return { excelPath: defaultExcelPath, htmlPath: defaultHtmlPath };
  }

  private static async createExcelReport(summary: SmokeReportSummary, filepath: string): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'WoodenStreet QA Automation';
    workbook.created = new Date();

    // Sheet 1: Summary Dashboard
    const summarySheet = workbook.addWorksheet('Smoke Summary');
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 25 },
      { header: 'Value', key: 'value', width: 35 }
    ];

    const passRate = summary.totalTests > 0 ? ((summary.passed / summary.totalTests) * 100).toFixed(1) + '%' : '0%';

    summarySheet.addRows([
      { metric: 'Environment', value: summary.environment.toUpperCase() },
      { metric: 'Target URL', value: summary.baseUrl },
      { metric: 'Browser', value: summary.browser },
      { metric: 'Execution Timestamp', value: summary.executionDate },
      { metric: 'Total Duration', value: `${(summary.totalDurationMs / 1000).toFixed(2)} seconds` },
      { metric: 'Total Tests Executed', value: summary.totalTests },
      { metric: 'Passed', value: summary.passed },
      { metric: 'Failed', value: summary.failed },
      { metric: 'Skipped', value: summary.skipped },
      { metric: 'Flaky', value: summary.flaky },
      { metric: 'Pass Rate', value: passRate }
    ]);

    // Style Summary Sheet
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2C3E50' } };

    // Sheet 2: Detailed Results
    const detailsSheet = workbook.addWorksheet('Test Details');
    detailsSheet.columns = [
      { header: 'Test ID', key: 'testId', width: 12 },
      { header: 'Test Title', key: 'title', width: 35 },
      { header: 'Category', key: 'category', width: 18 },
      { header: 'Tags', key: 'tags', width: 25 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Duration (s)', key: 'duration', width: 14 },
      { header: 'Failure Category', key: 'failureCategory', width: 22 },
      { header: 'Failure Message / Details', key: 'failureMessage', width: 50 }
    ];

    detailsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    detailsSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '16A085' } };

    summary.results.forEach((r) => {
      const row = detailsSheet.addRow({
        testId: r.testId,
        title: r.title,
        category: r.category,
        tags: r.tags.join(', '),
        status: r.status,
        duration: (r.durationMs / 1000).toFixed(2),
        failureCategory: r.failureCategory || 'N/A',
        failureMessage: r.failureMessage || 'N/A'
      });

      // Status color coding
      const statusCell = row.getCell('status');
      if (r.status === 'PASSED') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D4EDDA' } };
        statusCell.font = { color: { argb: '155724' }, bold: true };
      } else if (r.status === 'FAILED') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8D7DA' } };
        statusCell.font = { color: { argb: '721C24' }, bold: true };
      } else if (r.status === 'SKIPPED') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3CD' } };
        statusCell.font = { color: { argb: '856404' } };
      }
    });

    await workbook.xlsx.writeFile(filepath);
  }

  private static createHtmlDashboard(summary: SmokeReportSummary, filepath: string): void {
    const passRate = summary.totalTests > 0 ? Math.round((summary.passed / summary.totalTests) * 100) : 0;

    const testRowsHtml = summary.results
      .map((r, idx) => {
        const badgeClass =
          r.status === 'PASSED'
            ? 'bg-success'
            : r.status === 'FAILED'
            ? 'bg-danger'
            : r.status === 'SKIPPED'
            ? 'bg-warning text-dark'
            : 'bg-info';

        return `
        <tr>
          <td>#${idx + 1}</td>
          <td><strong>${r.title}</strong><br><small class="text-muted">${r.category}</small></td>
          <td>${r.tags.map((t) => `<span class="badge bg-secondary me-1">${t}</span>`).join('')}</td>
          <td><span class="badge ${badgeClass}">${r.status}</span></td>
          <td>${(r.durationMs / 1000).toFixed(2)}s</td>
          <td>
            ${
              r.failureCategory
                ? `<span class="badge bg-outline-danger text-danger border border-danger">${r.failureCategory}</span>`
                : '-'
            }
          </td>
          <td>
            <small class="text-wrap">${r.failureMessage ? r.failureMessage.substring(0, 150) : 'Clean Execution'}</small>
          </td>
        </tr>`;
      })
      .join('');

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WoodenStreet Daily Smoke Testing Dashboard</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; background-color: #f4f6f9; color: #333; }
    .header-panel { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 2rem 0; margin-bottom: 2rem; border-radius: 0 0 16px 16px; }
    .card-metric { border: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); transition: transform 0.2s; }
    .card-metric:hover { transform: translateY(-4px); }
    .metric-value { font-size: 2.2rem; font-weight: 700; }
    .table-container { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .badge-p0 { background-color: #dc3545; }
    .badge-p1 { background-color: #fd7e14; }
    .badge-p2 { background-color: #6c757d; }
  </style>
</head>
<body>
  <div class="header-panel shadow-sm">
    <div class="container">
      <div class="row align-items-center">
        <div class="col-md-8">
          <h2 class="fw-bold mb-1">🛒 WoodenStreet Daily Smoke Testing Dashboard</h2>
          <p class="mb-0 text-light opacity-75">Automated E-Commerce Health & Critical Path Verification</p>
        </div>
        <div class="col-md-4 text-md-end mt-3 mt-md-0">
          <span class="badge bg-light text-dark px-3 py-2 fs-6">Env: <strong>${summary.environment.toUpperCase()}</strong></span>
          <span class="badge bg-info text-dark px-3 py-2 fs-6 ms-1">${summary.browser}</span>
        </div>
      </div>
    </div>
  </div>

  <div class="container mb-5">
    <!-- Key Metrics Grid -->
    <div class="row g-3 mb-4">
      <div class="col-6 col-md-3">
        <div class="card card-metric p-3 bg-white text-center">
          <div class="text-muted small fw-semibold text-uppercase">Total Tests</div>
          <div class="metric-value text-primary">${summary.totalTests}</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card card-metric p-3 bg-white text-center">
          <div class="text-muted small fw-semibold text-uppercase">Passed</div>
          <div class="metric-value text-success">${summary.passed}</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card card-metric p-3 bg-white text-center">
          <div class="text-muted small fw-semibold text-uppercase">Failed</div>
          <div class="metric-value text-danger">${summary.failed}</div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card card-metric p-3 bg-white text-center">
          <div class="text-muted small fw-semibold text-uppercase">Pass Rate</div>
          <div class="metric-value ${passRate >= 90 ? 'text-success' : 'text-warning'}">${passRate}%</div>
        </div>
      </div>
    </div>

    <!-- Metadata Details -->
    <div class="card border-0 shadow-sm mb-4">
      <div class="card-body">
        <div class="row text-center text-md-start">
          <div class="col-md-4"><strong>Target URL:</strong> <a href="${summary.baseUrl}" target="_blank">${summary.baseUrl}</a></div>
          <div class="col-md-4"><strong>Execution Timestamp:</strong> ${summary.executionDate}</div>
          <div class="col-md-4"><strong>Total Duration:</strong> ${(summary.totalDurationMs / 1000).toFixed(2)}s</div>
        </div>
      </div>
    </div>

    <!-- Detailed Results Table -->
    <div class="table-container">
      <h5 class="fw-bold mb-3">Smoke Suite Test Execution Log</h5>
      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead class="table-light">
            <tr>
              <th>#</th>
              <th>Test Journey</th>
              <th>Tags</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Failure Category</th>
              <th>Diagnostics / Failure Summary</th>
            </tr>
          </thead>
          <tbody>
            ${testRowsHtml}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <footer class="text-center py-3 text-muted border-top mt-5">
    <small>WoodenStreet QA Daily Smoke Automation Framework &bull; Powered by Playwright & TypeScript</small>
  </footer>
</body>
</html>`;

    fs.writeFileSync(filepath, htmlContent, 'utf-8');
  }
}

export default ReportGenerator;
module.exports = { ReportGenerator };
