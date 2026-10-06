const fs = require('fs');
const path = require('path');
const { ReportGenerator } = require('../utils/reportGenerator');
const { Logger } = require('../utils/logger');

async function run() {
  const jsonPath = path.resolve(process.cwd(), 'reports', 'test-results.json');
  if (!fs.existsSync(jsonPath)) {
    Logger.warn('No test-results.json found in reports directory. Please run tests first.');
    return;
  }

  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const testData = JSON.parse(raw);

  const results = [];
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let flaky = 0;
  let totalDurationMs = 0;

  if (testData.suites) {
    testData.suites.forEach((suite) => {
      processSuite(suite, results);
    });
  }

  results.forEach((r) => {
    totalDurationMs += r.durationMs;
    if (r.status === 'PASSED') passed++;
    else if (r.status === 'FAILED') failed++;
    else if (r.status === 'SKIPPED') skipped++;
    else if (r.status === 'FLAKY') flaky++;
  });

  const summary = {
    environment: (process.env.TEST_ENV || 'production').toUpperCase(),
    baseUrl: process.env.BASE_URL || 'https://www.woodenstreet.com',
    browser: 'Chromium',
    executionDate: new Date().toLocaleString(),
    totalDurationMs,
    totalTests: results.length,
    passed,
    failed,
    skipped,
    flaky,
    results,
  };

  await ReportGenerator.generateReports(summary);
  Logger.pass('Daily Smoke Test Excel & HTML Dashboard generated successfully!');
}

function processSuite(suite, results) {
  if (suite.specs) {
    suite.specs.forEach((spec) => {
      spec.tests.forEach((testObj) => {
        const lastResult = testObj.results[testObj.results.length - 1];
        const statusStr = (testObj.status || '').toUpperCase();

        const status =
          statusStr === 'EXPECTED' || statusStr === 'PASSED'
            ? 'PASSED'
            : statusStr === 'SKIPPED'
            ? 'SKIPPED'
            : testObj.results.length > 1
            ? 'FLAKY'
            : 'FAILED';

        const tags = (spec.title.match(/@\w+/g) || []).concat(suite.title ? suite.title.match(/@\w+/g) || [] : []);

        results.push({
          testId: `SMK-${results.length + 1}`,
          title: spec.title,
          category: suite.title || 'Smoke Suite',
          tags,
          status,
          durationMs: lastResult ? lastResult.duration : 0,
          failureCategory: lastResult && lastResult.error ? 'ASSERTION_FAILURE' : undefined,
          failureMessage: lastResult && lastResult.error ? lastResult.error.message : undefined,
        });
      });
    });
  }

  if (suite.suites) {
    suite.suites.forEach((subSuite) => processSuite(subSuite, results));
  }
}

run().catch((err) => {
  console.error('Report Generation Error:', err);
});
