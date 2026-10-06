const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const config = {
  // Authentication
  testPhone: '7976191632',

  // Application Production URLs
  baseUrl: 'https://www.woodenstreet.com',
  ticketUrl: 'https://www.woodenstreet.com/help-center/tickets?default=create',

  // Test Data Default Values
  orderId: process.env.TEST_ORDER_ID || '1204175',
  subjectPrefix: process.env.SUBJECT_PREFIX || 'test',
  descriptionPrefix: 'This ticket was created automatically as part of website ticket creation QA automation.',
  attachmentPath: path.resolve(__dirname, '..', process.env.ATTACHMENT_PATH || './test-data/test-attachment.pdf'),

  // Execution Behavior
  dryRun: process.env.DRY_RUN === 'true',
  allowDuplicateTickets: process.env.ALLOW_DUPLICATE_TICKETS !== 'false',
  resetState: true,
  sendEmail: process.env.SEND_EMAIL !== 'false',
  maxRetries: parseInt(process.env.MAX_RETRIES || '2', 10),
  headless: process.env.HEADLESS === 'true',

  // Reporting Paths
  reportsDir: path.resolve(__dirname, '../reports'),
  excelReportPath: path.resolve(__dirname, '../reports/ticket-report.xlsx'),
  dashboardPath: path.resolve(__dirname, '../reports/dashboard.html'),
  stateFilePath: path.resolve(__dirname, '../reports/execution-state.json'),
  screenshotsDir: path.resolve(__dirname, '../reports/screenshots'),
  videosDir: path.resolve(__dirname, '../reports/videos'),
  tracesDir: path.resolve(__dirname, '../reports/traces'),

  // Placeholders to ignore in L1 & L2 dropdowns
  ignoredDropdownPlaceholders: [
    'select issue type',
    'select sub-issue type',
    'select',
    'choose',
    'please select',
    'select category',
    'select option',
    '-- select --',
    'none'
  ]
};

module.exports = config;
