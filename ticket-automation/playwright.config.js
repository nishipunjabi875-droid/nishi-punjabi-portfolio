const { defineConfig, devices } = require('@playwright/test');
const path = require('path');
const config = require('./config/config');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 0, // Infinite test execution timeout
  expect: {
    timeout: 0 // Infinite expect timeout
  },
  fullyParallel: false,
  workers: 1,
  reporter: [
    ['list']
  ],
  use: {
    baseURL: config.baseUrl,
    headless: config.headless,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 0, // Infinite action timeout
    navigationTimeout: 0, // Infinite navigation timeout
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure'
  },
  outputDir: './reports/artifacts',
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
