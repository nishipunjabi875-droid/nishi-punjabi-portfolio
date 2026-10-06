const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

class ExcelReporter {
  static async generateReport(stats, testResults, outputPath = config.excelReportPath) {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'QA Automation Framework';
    workbook.lastModifiedBy = 'Playwright Test Runner';
    workbook.created = new Date();

    // ─── SHEET 1: Execution Summary ──────────────────────────────────────────
    const summarySheet = workbook.addWorksheet('Execution Summary', {
      views: [{ showGridLines: true }]
    });

    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 40 }
    ];

    // Title Row
    summarySheet.mergeCells('A1:B1');
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = 'Website Ticket Creation QA Automation — Summary Report';
    titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    summarySheet.getRow(1).height = 35;

    const summaryData = [
      { metric: 'Execution Date', value: new Date().toLocaleDateString() },
      { metric: 'Start Time', value: stats.startTime || 'N/A' },
      { metric: 'End Time', value: stats.endTime || 'N/A' },
      { metric: 'Total Duration', value: stats.duration || 'N/A' },
      { metric: 'Total L1 Types Discovered', value: stats.totalL1 || 0 },
      { metric: 'Total L2 Types Discovered', value: stats.totalL2 || 0 },
      { metric: 'Total Tests Executed', value: stats.totalTests || 0 },
      { metric: 'Passed Tests', value: stats.passed || 0 },
      { metric: 'Failed Tests', value: stats.failed || 0 },
      { metric: 'Skipped Tests', value: stats.skipped || 0 },
      { metric: 'Pass Percentage', value: `${stats.passRate}%` },
      { metric: 'Fail Percentage', value: `${stats.failRate}%` },
      { metric: 'Report Generated At', value: new Date().toLocaleString() }
    ];

    summarySheet.addRow(['', '']); // spacer
    summarySheet.getRow(2).height = 10;

    // Header Row at row 3
    const headerRow = summarySheet.getRow(3);
    headerRow.values = ['Metric', 'Value'];
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3B82F6' } };
    headerRow.height = 25;

    summaryData.forEach(item => {
      const row = summarySheet.addRow([item.metric, item.value]);
      row.height = 22;
      row.getCell(1).font = { bold: true };
      row.getCell(2).alignment = { horizontal: 'left' };
    });

    // Style Pass/Fail rows
    summarySheet.eachRow((row, rowNumber) => {
      if (rowNumber > 3) {
        row.border = {
          top: { style: 'thin', color: { argb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'E2E8F0' } }
        };
      }
    });


    // ─── SHEET 2: Detailed Results ───────────────────────────────────────────
    const detailSheet = workbook.addWorksheet('Detailed Results', {
      views: [{ showGridLines: true }]
    });

    const columns = [
      { header: 'Sr No', key: 'srNo', width: 8 },
      { header: 'L1 Issue Type', key: 'l1', width: 22 },
      { header: 'L2 Sub-Issue Type', key: 'l2', width: 26 },
      { header: 'Order ID', key: 'orderId', width: 18 },
      { header: 'Subject', key: 'subject', width: 35 },
      { header: 'Description', key: 'description', width: 45 },
      { header: 'Attachment', key: 'attachment', width: 22 },
      { header: 'Start Time', key: 'startTime', width: 20 },
      { header: 'End Time', key: 'endTime', width: 20 },
      { header: 'Duration', key: 'duration', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Ticket ID', key: 'ticketId', width: 16 },
      { header: 'Success Message', key: 'successMessage', width: 30 },
      { header: 'Error Message', key: 'errorMessage', width: 35 },
      { header: 'Error Type', key: 'errorType', width: 20 },
      { header: 'Screenshot', key: 'screenshot', width: 30 },
      { header: 'Retry Count', key: 'retryCount', width: 12 },
      { header: 'URL', key: 'url', width: 40 }
    ];

    detailSheet.columns = columns;

    // Header styling
    const detailHeaderRow = detailSheet.getRow(1);
    detailHeaderRow.height = 28;
    detailHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    detailHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };
    detailHeaderRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };
    });

    testResults.forEach((res, index) => {
      const row = detailSheet.addRow({
        srNo: index + 1,
        l1: res.l1 || '',
        l2: res.l2 || '',
        orderId: res.orderId || config.orderId,
        subject: res.subject || '',
        description: res.description || '',
        attachment: res.attachment || 'Optional / Skipped',
        startTime: res.startTime || '',
        endTime: res.endTime || '',
        duration: res.duration || '0s',
        status: res.status || 'SKIPPED',
        ticketId: res.ticketId || 'N/A',
        successMessage: res.successMessage || '',
        errorMessage: res.errorMessage || '',
        errorType: res.errorType || '',
        screenshot: res.screenshot || '',
        retryCount: res.retryCount || 0,
        url: res.url || config.ticketUrl
      });

      row.height = 22;
      const statusCell = row.getCell('status');
      statusCell.alignment = { horizontal: 'center' };
      statusCell.font = { bold: true };

      if (res.status === 'PASS') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } }; // Light Green
        statusCell.font = { color: { argb: '15803D' }, bold: true };
      } else if (res.status === 'FAIL') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } }; // Light Red
        statusCell.font = { color: { argb: 'B91C1C' }, bold: true };
      } else {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF3C7' } }; // Light Yellow
        statusCell.font = { color: { argb: 'B45309' }, bold: true };
      }
    });


    // ─── SHEET 3: Failed Tests ───────────────────────────────────────────────
    const failedSheet = workbook.addWorksheet('Failed Tests', {
      views: [{ showGridLines: true }]
    });

    failedSheet.columns = columns;
    const failedHeaderRow = failedSheet.getRow(1);
    failedHeaderRow.height = 28;
    failedHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    failedHeaderRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '991B1B' } }; // Dark Red Header
    });

    const failedResults = testResults.filter(r => r.status === 'FAIL');
    failedResults.forEach((res, index) => {
      const row = failedSheet.addRow({
        srNo: index + 1,
        l1: res.l1 || '',
        l2: res.l2 || '',
        orderId: res.orderId || config.orderId,
        subject: res.subject || '',
        description: res.description || '',
        attachment: res.attachment || 'Optional / Skipped',
        startTime: res.startTime || '',
        endTime: res.endTime || '',
        duration: res.duration || '0s',
        status: res.status || 'FAIL',
        ticketId: res.ticketId || 'N/A',
        successMessage: res.successMessage || '',
        errorMessage: res.errorMessage || '',
        errorType: res.errorType || '',
        screenshot: res.screenshot || '',
        retryCount: res.retryCount || 0,
        url: res.url || config.ticketUrl
      });
      row.height = 22;
      const statusCell = row.getCell('status');
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
      statusCell.font = { color: { argb: 'B91C1C' }, bold: true };
    });


    // ─── SHEET 4: L1/L2 Matrix ───────────────────────────────────────────────
    const matrixSheet = workbook.addWorksheet('L1-L2 Matrix', {
      views: [{ showGridLines: true }]
    });

    matrixSheet.columns = [
      { header: 'L1 Issue Type', key: 'l1', width: 25 },
      { header: 'L2 Sub-Issue Type', key: 'l2', width: 30 },
      { header: 'Tested', key: 'tested', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Ticket ID', key: 'ticketId', width: 20 }
    ];

    const matrixHeaderRow = matrixSheet.getRow(1);
    matrixHeaderRow.height = 28;
    matrixHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    matrixHeaderRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '475569' } };
    });

    testResults.forEach(res => {
      const row = matrixSheet.addRow({
        l1: res.l1,
        l2: res.l2,
        tested: res.status !== 'SKIPPED' ? 'Yes' : 'No',
        status: res.status,
        ticketId: res.ticketId || 'N/A'
      });
      row.height = 20;
    });

    await workbook.xlsx.writeFile(outputPath);
    return outputPath;
  }
}

module.exports = ExcelReporter;
