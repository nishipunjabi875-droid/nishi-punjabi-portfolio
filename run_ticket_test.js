const { execSync } = require('child_process');

console.log('🚀 Launching Website Ticket Creation QA Automation Suite...\n');

try {
  execSync('npx playwright test ticket_creation.spec.js --config=playwright.config.js', {
    cwd: __dirname,
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: '1' }
  });
  console.log('\n✅ Ticket Creation Test Suite Executed Successfully!');
} catch (err) {
  console.error('\n❌ Test execution finished with status code:', err.status);
}
