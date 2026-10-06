const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');
const EmailReporter = require('./utils/email-reporter');

console.log('====================================================');
console.log('TICKET AUTOMATION RECURRING SCHEDULER STARTED');
console.log('Schedule : 4 times a day (09:00, 13:00, 17:00, 21:00)');
console.log('Recipient: nishi.punjabi@woodenstreet.com');
console.log('====================================================\n');

function runAutomationAndEmail() {
  console.log(`\n[${new Date().toLocaleString()}] 🚀 Triggering scheduled Ticket Automation run...`);
  
  const testCommand = `npx playwright test ticket_creation.spec.js --headed`;
  const rootDir = path.resolve(__dirname, '..');

  exec(testCommand, { cwd: rootDir }, async (error, stdout, stderr) => {
    console.log(stdout);
    if (stderr) console.error(stderr);

    console.log('\n📧 Automation complete. Sending Dashboard report email to nishi.punjabi@woodenstreet.com...');
    await EmailReporter.sendDashboardEmail({
      passed: 'Completed',
      failed: error ? 'Errors Detected' : '0',
      passRate: error ? 'Attention Required' : '100.00'
    }, 'nishi.punjabi@woodenstreet.com');
  });
}

// Schedule: 4 times a day at 9:00 AM, 1:00 PM, 5:00 PM, 9:00 PM
cron.schedule('0 9,13,17,21 * * *', () => {
  runAutomationAndEmail();
});

// Run immediately on start if --run-now is passed
if (process.argv.includes('--run-now')) {
  runAutomationAndEmail();
}
