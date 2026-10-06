/**
 * Console Logger Utility for Ticket Creation QA Automation Framework
 */

class Logger {
  static header(title) {
    console.log('\n==================================================');
    console.log(title.toUpperCase());
    console.log('==================================================\n');
  }

  static section(title) {
    console.log(`\n${title}:`);
  }

  static check(message) {
    console.log(`✓ ${message}`);
  }

  static info(message) {
    console.log(`ℹ ${message}`);
  }

  static warn(message) {
    console.log(`⚠️ ${message}`);
  }

  static error(message) {
    console.log(`❌ ${message}`);
  }

  static testProgress(current, total, l1, l2) {
    console.log(`\n[${current}/${total}] Testing:`);
    console.log(`L1: ${l1}`);
    console.log(`L2: ${l2}`);
    console.log(`Creating ticket...`);
  }

  static otpBanner() {
    console.log('\n==================================================');
    console.log('OTP REQUIRED');
    console.log('Please enter the OTP manually in the browser.');
    console.log('After successful login, press ENTER in this terminal.');
    console.log('==================================================\n');
  }

  static summary(stats) {
    console.log('\n==================================================');
    console.log('AUTOMATION COMPLETED');
    console.log('==================================================\n');
    console.log(`Total L1 Types       : ${stats.totalL1}`);
    console.log(`Total L2 Types       : ${stats.totalL2}`);
    console.log(`Total Tests          : ${stats.totalTests}`);
    console.log(`\nPASSED               : ${stats.passed}`);
    console.log(`FAILED               : ${stats.failed}`);
    console.log(`SKIPPED              : ${stats.skipped}`);
    console.log(`PASS RATE            : ${stats.passRate}%`);
    console.log(`\nExecution Time       : ${stats.duration}`);
    console.log(`\nExcel Report         : ${stats.excelPath}`);
    console.log(`Dashboard            : ${stats.dashboardPath}`);
    console.log('==================================================\n');
  }

  static finalReport(stats, failedTests = []) {
    console.log('\n========================================================');
    console.log('TICKET CREATION AUTOMATION REPORT');
    console.log('========================================================\n');
    console.log(`L1 Issue Types Discovered : ${stats.totalL1}`);
    console.log(`L2 Combinations Discovered: ${stats.totalL2}`);
    console.log(`\nTests Executed            : ${stats.totalTests}`);
    console.log(`Passed                    : ${stats.passed}`);
    console.log(`Failed                    : ${stats.failed}`);
    console.log(`Skipped                   : ${stats.skipped}`);
    console.log(`\nPass Percentage           : ${stats.passRate}%`);
    console.log(`Fail Percentage           : ${stats.failRate}%`);
    console.log(`\nTickets Successfully Created: ${stats.passed}`);

    if (failedTests.length > 0) {
      console.log('\n--------------------------------------------------------');
      console.log('FAILED COMBINATIONS');
      console.log('--------------------------------------------------------\n');
      failedTests.forEach((f, idx) => {
        console.log(`${idx + 1}. L1: ${f.l1}`);
        console.log(`   L2: ${f.l2}`);
        console.log(`   Error: ${f.errorMessage || f.errorType || 'Unknown failure'}`);
        if (f.screenshot) console.log(`   Screenshot: ${f.screenshot}`);
        console.log('');
      });
    }

    console.log('--------------------------------------------------------\n');
    console.log(`Excel Report:\n${stats.excelPath}\n`);
    console.log(`Dashboard:\n${stats.dashboardPath}`);
    console.log('\n========================================================\n');
  }
}

module.exports = Logger;
