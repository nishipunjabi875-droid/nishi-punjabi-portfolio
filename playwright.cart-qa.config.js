const { defineConfig } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  // Serial execution to maintain cart state across tests
  workers: 1,
  fullyParallel: false,

  // Only run the cart QA spec
  testMatch: 'cart-deep-qa.spec.js',

  use: {
    // Base URL for the beta site
    baseURL: 'https://beta.teamwoodenstreet.com',

    // Desktop Chrome configuration
    browserName: 'chromium',
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',

    // Capture evidence on failure
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',

    // Network settings
    ignoreHTTPSErrors: true,
    actionTimeout: 15000,
    navigationTimeout: 45000,
  },

  // Extended timeout for comprehensive QA tests
  timeout: 120000,

  // Report to console
  reporter: 'line',

  // Retry failed tests once for flaky network tolerance
  retries: 0,

  // Output directories
  outputDir: path.join(__dirname, 'test-results', 'cart-qa'),
});
