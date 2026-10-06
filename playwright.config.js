const { defineConfig } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const authPath = path.resolve(__dirname, 'auth.json');

module.exports = defineConfig({
  workers: 1,
  fullyParallel: false,
  use: {
    headless: process.env.HEADLESS === 'false' ? false : true,
    viewport: { width: 1280, height: 720 },
    storageState: fs.existsSync(authPath) ? authPath : undefined,
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    trace: 'off'
  },
  reporter: [
    ['line'],
    ['json', { outputFile: 'reports/test-results.json' }]
  ],
  timeout: 3600000,
});

