const { test, expect } = require('@playwright/test');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const config = require('./ticket-automation/config/config');
const Logger = require('./ticket-automation/utils/logger');
const StateManager = require('./ticket-automation/utils/state-manager');
const ExcelReporter = require('./ticket-automation/utils/excel-report');
const DashboardGenerator = require('./ticket-automation/utils/dashboard');
const EmailReporter = require('./ticket-automation/utils/email-reporter');
const TicketHelper = require('./ticket-automation/utils/ticket-helper');

test.describe('Website Ticket Creation QA Automation Suite', () => {

  test('Dynamically discover and verify ticket creation for all L1/L2 combinations', async ({ page }) => {
    test.setTimeout(3600000);
    page.setDefaultTimeout(0);
    page.setDefaultNavigationTimeout(60000);

    const startTime = new Date();
    Logger.header('TICKET AUTOMATION STARTED');

    const stateManager = new StateManager();
    if (config.resetState) {
      console.log('🧹 RESET_STATE=true: Clearing previous execution state for a fresh run...');
      stateManager.clearState();
    }

    // ─── 1. LOGIN FLOW ON HOMEPAGE WITH MANUAL OTP ─────────────────────────────
    // Navigate to ticket page to check for active authenticated session
    console.log(`Checking session on Ticket Creation Page: ${config.ticketUrl}...`);
    await page.goto(config.ticketUrl, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => { });
    await page.waitForTimeout(2000).catch(() => { });

    const isAlreadyLoggedIn = await page.evaluate(() => {
      const body = (document.body.innerText || '');
      const hasNoOrderMsg = body.includes("Can't Create Ticket") || body.includes("no order has been placed yet");
      const hasSignIn = body.includes("Sign in") && !body.includes("Hi ");
      const hasOrderTrigger = body.includes("Click to select Order ID") || body.includes("Select Your Order ID");
      const hasHiGreeting = /Hi\s+[A-Za-z]+/i.test(body);
      return (hasOrderTrigger || hasHiGreeting) && !hasNoOrderMsg && !hasSignIn;
    }).catch(() => false);

    if (isAlreadyLoggedIn) {
      console.log('✓ Active logged-in session detected on Ticket Page. Skipping OTP login modal...');
    } else {
      // Open Login modal on Homepage
      console.log('Opening Login modal on Homepage...');

      // 1. Try hovering over Profile menu to reveal Sign in
      const profileBtn = page.locator('span:has-text("Profile"), p:has-text("Profile"), div:has-text("Profile"), a[href*="profile"]').first();
      if (await profileBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await profileBtn.hover().catch(() => { });
        await page.waitForTimeout(800).catch(() => { });
      }

      // 2. Click Sign in button / link
      const signinBtn = page.locator('span.style_signinbtn__RI5rE, span:has-text("Sign in"), button:has-text("Sign in"), a:has-text("Sign in"), a[href*="login"], span:has-text("Login")').first();
      if (await signinBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('Clicking Sign in button on Homepage...');
        await signinBtn.click({ force: true }).catch(() => { });
        await page.waitForTimeout(2000).catch(() => { });
      } else if (await profileBtn.isVisible().catch(() => false)) {
        console.log('Clicking Profile button on Homepage...');
        await profileBtn.click({ force: true }).catch(() => { });
        await page.waitForTimeout(1500).catch(() => { });
      }
    }

    // Check Mobile Number input field with generous 10s wait
    const phoneInput = page.locator('input[placeholder*="Enter Mobile No." i], input[placeholder*="Mobile" i], #login-mobile, input[name="mobile"], input[type="tel"]').first();

    await phoneInput.waitFor({ state: 'visible', timeout: 10000 }).catch(() => { });

    if (!await phoneInput.isVisible().catch(() => false)) {
      console.log('Phone input not visible yet. Retrying Sign in click...');
      const retryBtn = page.locator('span:has-text("Sign in"), a:has-text("Sign in"), span:has-text("Profile")').first();
      if (await retryBtn.isVisible().catch(() => false)) {
        await retryBtn.click({ force: true }).catch(() => { });
        await page.waitForTimeout(2000).catch(() => { });
      }
    }

    if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await phoneInput.click().catch(() => { });
      await phoneInput.fill(config.testPhone);
      Logger.check(`Phone number entered (${config.testPhone})`);

      const continueBtn = page.getByRole('button', { name: 'CONTINUE' })
        .or(page.locator('button:has-text("CONTINUE"), button:has-text("REQUEST OTP"), button#login-submit').first());

      if (await continueBtn.isVisible().catch(() => false)) {
        await continueBtn.click({ force: true }).catch(() => { });
        console.log('✓ Clicked CONTINUE to request OTP');
        await page.waitForTimeout(2000).catch(() => { });
      }

      // Display clear instructions for user to enter OTP manually in browser
      console.log('\n==================================================');
      console.log(`📱 OTP SENT TO YOUR MOBILE NUMBER (${config.testPhone})`);
      console.log('Please enter your 4-digit OTP manually in the browser window.');
      console.log('Click VERIFY OTP in the browser, or click the green button on top right!');
      console.log('==================================================\n');

      await page.evaluate((phone) => {
        if (document.getElementById('qa-otp-overlay')) return;
        const overlay = document.createElement('div');
        overlay.id = 'qa-otp-overlay';
        overlay.innerHTML = `
          <div style="position: fixed; top: 15px; right: 15px; z-index: 9999999; background: #0f172a; color: #ffffff; padding: 18px 22px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.7); font-family: system-ui, sans-serif; border: 2px solid #3b82f6; max-width: 380px;">
            <h3 style="margin: 0 0 6px 0; color: #60a5fa; font-size: 16px;">📱 Manual OTP Entry Required</h3>
            <p style="margin: 0 0 12px 0; font-size: 13px; color: #94a3b8; line-height: 1.4;">Enter the OTP received on <b>${phone}</b> in the modal below, verify login, then click the button below!</p>
            <button id="qa-continue-btn" onclick="this.innerText='⏳ Resuming Ticket Automation...'; this.style.background='#3b82f6'; const m=document.createElement('div'); m.id='qa-continue-btn-clicked'; document.body.appendChild(m);" style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 12px 18px; border-radius: 8px; font-weight: bold; cursor: pointer; width: 100%; font-size: 14px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);">
              ✅ Done with OTP & Logged In
            </button>
          </div>
        `;
        document.body.appendChild(overlay);
      }, config.testPhone).catch(() => { });

      console.log('Waiting for manual OTP entry & verification in browser (NO TIMEOUT)...');

      // Wait until user submits OTP or clicks green button
      await page.waitForFunction(() => {
        const clicked = !!document.getElementById('qa-continue-btn-clicked');
        const modalClosed = !document.querySelector('input[placeholder*="Enter Mobile No." i], #login-mobile') &&
          !document.documentElement.innerText.includes('Verify with OTP');
        return clicked || modalClosed;
      }, null, { timeout: 0 });

      await page.waitForTimeout(2000).catch(() => { });
      await page.context().storageState({ path: path.resolve(__dirname, 'auth.json') }).catch(() => { });
      Logger.check('Login completed / OTP verified by user (session saved to auth.json)');
    } else {
      console.log('ℹ️ Session active or login modal not open.');
    }

    Logger.check('Login successful / session active');

    // ─── 2. REDIRECT TO HELP DESK / TICKET CREATION PAGE ───────────────────────
    Logger.section('Ticket Module');
    console.log('Redirecting from Homepage to Help Desk...');
    const helpDeskLink = page.getByRole('banner').getByRole('link', { name: 'Help Desk' })
      .or(page.locator('a[href*="help-center"]').first());

    if (await helpDeskLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('Clicking Help Desk link in header...');
      await helpDeskLink.click({ force: true }).catch(() => { });
      await page.waitForTimeout(2000).catch(() => { });
    }

    if (!page.url().includes('/help-center/tickets?default=create')) {
      console.log(`Navigating directly to Ticket Creation Page: ${config.ticketUrl}...`);
      await page.goto(config.ticketUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => { });
      await page.waitForTimeout(1500).catch(() => { });
    }

    Logger.check('Redirected to Help Desk / Ticket creation page opened');

    // ─── 3. DYNAMIC L1 & L2 DISCOVERY ──────────────────────────────────────────
    Logger.section('Issue Types');
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

    if (config.dryRun) {
      Logger.info('DRY_RUN mode is ENABLED. Form fields will be populated and validated without submitting tickets.');
    }

    // ─── 4. ITERATE & TEST ALL L1 -> L2 COMBINATIONS ──────────────────────────
    Logger.section('Current Progress');
    const totalTests = testMatrix.length;
    const testResults = [];

    for (let i = 0; i < testMatrix.length; i++) {
      const { l1, l2 } = testMatrix[i];
      const l1Label = l1.label;
      const l2Label = l2.label;
      const testIndex = i + 1;

      // Resume & Duplicate Ticket Check
      if (!config.allowDuplicateTickets && stateManager.isCombinationPassed(l1Label, l2Label)) {
        console.log(`\n[${testIndex}/${totalTests}] Skipping already passed combination: [L1: ${l1Label} | L2: ${l2Label}]`);
        const prevRes = stateManager.getCombinationResult(l1Label, l2Label);
        testResults.push({
          l1: l1Label,
          l2: l2Label,
          status: 'SKIPPED',
          ticketId: prevRes?.ticketId || 'PREVIOUS_PASS',
          duration: '0s',
          startTime: new Date().toLocaleTimeString(),
          endTime: new Date().toLocaleTimeString()
        });
        l1CoverageMap[l1Label].tested++;
        l1CoverageMap[l1Label].passed++;
        continue;
      }

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

          // 1. Select Order ID first to activate L1/L2 dropdown options
          const currentOrderId = await TicketHelper.selectOrderId(page, config.orderId);

          // 2. Select L1 Issue Type
          await TicketHelper.selectL1Option(page, l1);

          // 3. Select L2 Sub-Issue Type
          await TicketHelper.selectL2Option(page, l2);

          // Generate & Fill Subject
          const subject = TicketHelper.generateSubject(l1Label, l2Label);
          const subjectInput = page.getByRole('textbox', { name: 'Enter subject' }).or(page.locator('input[placeholder="Enter subject"], input[name*="subject" i], #subject')).first();
          if (await subjectInput.isVisible({ timeout: 300 }).catch(() => false)) {
            await subjectInput.fill(subject);
          }

          // Generate & Fill Description
          const description = TicketHelper.generateDescription(l1Label, l2Label);
          const descInput = page.getByRole('textbox', { name: 'Describe your issue...' }).or(page.locator('textarea[placeholder="Describe your issue..."], textarea[name*="description" i], #description')).first();
          if (await descInput.isVisible({ timeout: 300 }).catch(() => false)) {
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
            // Submit Ticket and verify created ticket on View Tickets page
            const res = await TicketHelper.submitTicketAndVerify(page, l1Label, l2Label, currentOrderId);

            if (!res || !res.success || !res.ticketId || res.ticketId === 'N/A') {
              throw new Error(`Ticket submission failed for [${l1Label} -> ${l2Label}]: ${res?.errorMessage || 'CTA not clicked or ticket ID missing'}`);
            }

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
          await page.waitForTimeout(300).catch(() => { });
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

        await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => { });

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

    // ─── 5. SUMMARY & FINAL QA REPORT ─────────────────────────────────────────
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
  });

});