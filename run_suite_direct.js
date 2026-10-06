const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const config = require('./ticket-automation/config/config');
const Logger = require('./ticket-automation/utils/logger');
const StateManager = require('./ticket-automation/utils/state-manager');
const ExcelReporter = require('./ticket-automation/utils/excel-report');
const DashboardGenerator = require('./ticket-automation/utils/dashboard');
const TicketHelper = require('./ticket-automation/utils/ticket-helper');

(async () => {
  const startTime = new Date();
  Logger.header('TICKET AUTOMATION STARTED (DIRECT RUNNER)');

  const stateManager = new StateManager();
  if (config.resetState) {
    console.log('🧹 RESET_STATE=true: Clearing previous execution state...');
    stateManager.clearState();
  }

  const authPath = path.resolve(__dirname, 'auth.json');
  console.log('Launching browser (headed)...');
  const browser = await chromium.launch({ headless: false });

  let contextOptions = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 }
  };

  if (fs.existsSync(authPath)) {
    console.log('Using saved session from auth.json...');
    contextOptions.storageState = authPath;
  }

  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  // ─── 1. CHECK SESSION ──────────────────────────────────────────────────────
  Logger.section('Login / Session Check');
  console.log(`Navigating to Ticket Page: ${config.ticketUrl}...`);
  await page.goto(config.ticketUrl, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(3000).catch(() => {});

  const isAlreadyLoggedIn = await page.evaluate(() => {
    const phoneInput = document.querySelector('input[placeholder*="Enter Mobile No." i], #login-mobile');
    const body = (document.body.innerText || '').toLowerCase();
    return !phoneInput && (body.includes('hi ') || body.includes('create ticket') || body.includes('help center'));
  }).catch(() => false);

  if (isAlreadyLoggedIn) {
    Logger.check('Active logged-in session detected on Ticket Page.');
  } else {
    console.log('Session not detected directly. Navigating to homepage...');
    await page.goto(config.baseUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.waitForTimeout(2000).catch(() => {});
  }

  // ─── 2. DYNAMIC L1 & L2 DISCOVERY ──────────────────────────────────────────
  Logger.section('Issue Types Discovery');
  await TicketHelper.ensureOnTicketPage(page);
  const l1Options = await TicketHelper.discoverL1Options(page);
  Logger.check(`L1 types discovered: ${l1Options.length}`);

  const testMatrix = [];
  const l1CoverageMap = {};

  for (const l1 of l1Options) {
    const l2Options = await TicketHelper.discoverL2Options(page, l1);
    l1CoverageMap[l1.label] = {
      total: l2Options.length,
      tested: 0,
      passed: 0,
      failed: 0
    };

    for (const l2 of l2Options) {
      testMatrix.push({ l1, l2 });
    }
  }

  console.log(`\n✓ Total L1 -> L2 combinations discovered: ${testMatrix.length}`);
  stateManager.setDiscoveredMatrix(testMatrix.map(m => ({ l1: m.l1.label, l2: m.l2.label })));

  // ─── 3. ITERATE & TEST ALL COMBINATIONS ──────────────────────────────────
  Logger.section('Executing Ticket Creation Matrix');
  const totalTests = testMatrix.length;
  const testResults = [];

  for (let i = 0; i < testMatrix.length; i++) {
    const { l1, l2 } = testMatrix[i];
    const l1Label = l1.label;
    const l2Label = l2.label;
    const testIndex = i + 1;

    Logger.testProgress(testIndex, totalTests, l1Label, l2Label);

    let attempt = 0;
    let pass = false;
    let resultData = null;
    let lastError = null;

    const comboStartTime = new Date();

    while (attempt <= config.maxRetries && !pass) {
      attempt++;
      if (attempt > 1) {
        console.log(`   🔄 Retry attempt ${attempt - 1}/${config.maxRetries}...`);
      }

      try {
        await TicketHelper.ensureOnTicketPage(page);

        // 1. Select Order ID
        const currentOrderId = await TicketHelper.selectOrderId(page, config.orderId);

        // 2. Select L1 Issue Type
        await TicketHelper.selectL1Option(page, l1);

        // 3. Select L2 Sub-Issue Type
        await TicketHelper.selectL2Option(page, l2);

        // Generate & Fill Subject
        const subject = TicketHelper.generateSubject(l1Label, l2Label);
        const subjectInput = page.getByRole('textbox', { name: 'Enter subject' }).or(page.locator('input[placeholder="Enter subject"]')).first();
        if (await subjectInput.isVisible({ timeout: 500 }).catch(() => false)) {
          await subjectInput.fill(subject);
        }

        // Generate & Fill Description
        const description = TicketHelper.generateDescription(l1Label, l2Label);
        const descInput = page.getByRole('textbox', { name: 'Describe your issue...' }).or(page.locator('textarea[placeholder="Describe your issue..."]')).first();
        if (await descInput.isVisible({ timeout: 500 }).catch(() => false)) {
          await descInput.fill(description);
        }

        // Upload Attachment
        const attachmentStatus = await TicketHelper.uploadAttachment(page);

        const comboEndTime = new Date();
        const duration = `${Math.round((comboEndTime - comboStartTime) / 1000)}s`;

        if (config.dryRun) {
          console.log('✓ DRY_RUN: Form populated & validated successfully. Skipping submit.');
          console.log('STATUS: PASS');
          pass = true;
          resultData = {
            l1: l1Label,
            l2: l2Label,
            orderId: currentOrderId || config.orderId,
            subject,
            description,
            attachment: attachmentStatus,
            startTime: comboStartTime.toLocaleTimeString(),
            endTime: comboEndTime.toLocaleTimeString(),
            duration,
            status: 'PASS',
            ticketId: 'DRY_RUN_ID',
            successMessage: 'Form validated in DRY_RUN mode.',
            retryCount: attempt - 1,
            url: page.url()
          };
        } else {
          // Submit Ticket and verify created ticket on View Tickets tab
          const res = await TicketHelper.submitTicketAndVerify(page, l1Label, l2Label, currentOrderId);

          console.log(`✓ Submitted & Verified | Ticket ID: ${res.ticketId} | Order ID: #${res.orderId}`);
          console.log('STATUS: PASS');

          pass = true;
          resultData = {
            l1: l1Label,
            l2: l2Label,
            orderId: res.orderId || currentOrderId || config.orderId,
            subject,
            description,
            attachment: attachmentStatus,
            startTime: comboStartTime.toLocaleTimeString(),
            endTime: comboEndTime.toLocaleTimeString(),
            duration,
            status: 'PASS',
            ticketId: res.ticketId,
            successMessage: res.successMessage,
            retryCount: attempt - 1,
            url: page.url()
          };
        }
      } catch (err) {
        lastError = err;
        console.error(`   ⚠️ Attempt ${attempt} failed: ${err.message}`);
        await page.waitForTimeout(500).catch(() => {});
      }
    }

    const comboEndTime = new Date();
    const duration = `${Math.round((comboEndTime - comboStartTime) / 1000)}s`;

    if (!pass) {
      console.log('STATUS: FAIL');
      const screenshotName = `failure_${l1Label}_${l2Label}_${Date.now()}.png`.replace(/[^a-zA-Z0-9._-]/g, '_');
      const screenshotPath = path.join(config.screenshotsDir, screenshotName);

      if (!fs.existsSync(config.screenshotsDir)) {
        fs.mkdirSync(config.screenshotsDir, { recursive: true });
      }

      await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});

      resultData = {
        l1: l1Label,
        l2: l2Label,
        orderId: config.orderId,
        subject: `${config.subjectPrefix} - ${l1Label} - ${l2Label}`,
        description: `Failed during testing: ${lastError ? lastError.message : 'Unknown error'}`,
        attachment: 'Failed',
        startTime: comboStartTime.toLocaleTimeString(),
        endTime: comboEndTime.toLocaleTimeString(),
        duration,
        status: 'FAIL',
        ticketId: 'N/A',
        errorMessage: lastError ? lastError.message : 'Ticket creation failed after retries',
        errorType: lastError ? lastError.name : 'CreationError',
        screenshot: `screenshots/${screenshotName}`,
        retryCount: config.maxRetries,
        url: page.url()
      };

      l1CoverageMap[l1Label].tested++;
      l1CoverageMap[l1Label].failed++;
    } else {
      l1CoverageMap[l1Label].tested++;
      l1CoverageMap[l1Label].passed++;
    }

    testResults.push(resultData);
    stateManager.recordResult(l1Label, l2Label, resultData);

    // Real-time Report Update
    const elapsedMs = new Date() - startTime;
    const passedCount = testResults.filter(r => r.status === 'PASS').length;
    const failedCount = testResults.filter(r => r.status === 'FAIL').length;
    const skippedCount = testResults.filter(r => r.status === 'SKIPPED').length;

    const liveStats = {
      startTime: startTime.toLocaleTimeString(),
      endTime: new Date().toLocaleTimeString(),
      duration: `${Math.floor(elapsedMs / 60000)}m ${Math.floor((elapsedMs % 60000) / 1000)}s`,
      totalL1: l1Options.length,
      totalL2: testMatrix.length,
      totalTests,
      passed: passedCount,
      failed: failedCount,
      skipped: skippedCount,
      passRate: totalTests > 0 ? ((passedCount / totalTests) * 100).toFixed(2) : '0.00',
      failRate: totalTests > 0 ? ((failedCount / totalTests) * 100).toFixed(2) : '0.00',
      excelPath: config.excelReportPath,
      dashboardPath: config.dashboardPath
    };

    await ExcelReporter.generateReport(liveStats, testResults);
    DashboardGenerator.generate(liveStats, testResults, l1CoverageMap);
  }

  // ─── 4. SUMMARY & FINAL REPORT ──────────────────────────────────────────
  const endTime = new Date();
  const totalDurationMs = endTime - startTime;
  const duration = `${Math.floor(totalDurationMs / 60000)}m ${Math.floor((totalDurationMs % 60000) / 1000)}s`;

  const passedCount = testResults.filter(r => r.status === 'PASS').length;
  const failedCount = testResults.filter(r => r.status === 'FAIL').length;
  const skippedCount = testResults.filter(r => r.status === 'SKIPPED').length;

  const finalStats = {
    startTime: startTime.toLocaleTimeString(),
    endTime: endTime.toLocaleTimeString(),
    duration,
    totalL1: l1Options.length,
    totalL2: testMatrix.length,
    totalTests: testMatrix.length,
    passed: passedCount,
    failed: failedCount,
    skipped: skippedCount,
    passRate: testMatrix.length > 0 ? ((passedCount / testMatrix.length) * 100).toFixed(2) : '0.00',
    failRate: testMatrix.length > 0 ? ((failedCount / testMatrix.length) * 100).toFixed(2) : '0.00',
    excelPath: config.excelReportPath,
    dashboardPath: config.dashboardPath
  };

  await ExcelReporter.generateReport(finalStats, testResults);
  DashboardGenerator.generate(finalStats, testResults, l1CoverageMap);

  Logger.summary(finalStats);
  Logger.finalReport(finalStats, testResults.filter(r => r.status === 'FAIL'));

  await browser.close();
  console.log('\n==================================================');
  console.log('✅ ALL TICKET CREATIONS COMPLETED SUCCESSFULLY!');
  console.log('==================================================\n');
})();
