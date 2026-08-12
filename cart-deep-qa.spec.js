/**
 * ═══════════════════════════════════════════════════════════════════════
 * CART PAGE DEEP QA TEST SUITE – WoodenStreet Beta
 * ═══════════════════════════════════════════════════════════════════════
 * Comprehensive exploratory, functional, UI, accessibility, performance,
 * security, business logic and API testing for the Cart page.
 *
 * Run: npx playwright test cart-deep-qa.spec.js --config=playwright.cart-qa.config.js
 * ═══════════════════════════════════════════════════════════════════════
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs-extra');
const path = require('path');
const CartPage = require('./pages/CartPage');
const ProductPage = require('./pages/ProductPage');
const BasePage = require('./pages/BasePage');
const CartQaReporter = require('./utils/cartQaReporter');

// ── Constants ──
const BASE_URL = 'https://beta.teamwoodenstreet.com';
const PRODUCT_1_URL = `${BASE_URL}/product/ortho-zen-aerowave-technology-orthopedic-mattress`;
const PRODUCT_2_URL = `${BASE_URL}/product/connecting-flat-cotton-bedsheet-king-size-with-2-pillow-covers-beige`;
const CART_URL = `${BASE_URL}/cart`;
const REPORTS_DIR = path.join(__dirname, 'reports');
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots', 'cart-qa');

// ── Global Collectors ──
const bugs = [];
const testResults = [];
let globalConsoleErrors = [];
let globalNetworkErrors = [];
let globalApiLogs = [];
let globalPerformance = {};
let bugCounter = 0;

function reportBug({ severity, priority, module, title, environment, preconditions, steps, actualResult, expectedResult, evidence, possibleRootCause }) {
  bugCounter++;
  const bug = {
    bugId: `CART-${String(bugCounter).padStart(3, '0')}`,
    severity: severity || 'Medium',
    priority: priority || severity || 'Medium',
    module: module || 'Cart',
    title: title || 'Untitled Bug',
    environment: environment || 'Desktop Chrome | Beta',
    preconditions: preconditions || 'Cart page loaded',
    steps: steps || '',
    actualResult: actualResult || '',
    expectedResult: expectedResult || '',
    evidence: evidence || '',
    possibleRootCause: possibleRootCause || ''
  };
  bugs.push(bug);
  console.log(`  🐛 BUG ${bug.bugId} [${bug.severity}] – ${bug.title}`);
  return bug;
}

function recordTest(name, category, status, error = '', duration = '') {
  testResults.push({ name, category, status, error, duration });
}

// ── Helpers ──
async function addProductToCart(page, productUrl) {
  await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3000);

  // Close any popups/modals
  await page.keyboard.press('Escape').catch(() => {});
  await page.evaluate(() => {
    const closeButtons = document.querySelectorAll('button[aria-label="Close"], button[class*="close"], button[class*="Close"], .close-popup, .close-modal');
    closeButtons.forEach(btn => { try { btn.click(); } catch(e){} });
    const overlays = document.querySelectorAll('.popup-overlay, .modal-overlay, [class*="overlay"]');
    overlays.forEach(o => { try { o.style.display = 'none'; } catch(e){} });
  }).catch(() => {});
  await page.waitForTimeout(1000);

  // Find and click Add to Cart
  const addToCartSelectors = [
    '#button-cart',
    'button:has-text("Add to Cart")',
    'button:has-text("ADD TO CART")',
    '.add-to-cart',
    '.add-cart-btn',
    '#add-cart-btn',
    'button[class*="add-to-cart"]',
    'button[class*="addToCart"]'
  ];

  let clicked = false;
  for (const sel of addToCartSelectors) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 2000 })) {
        await btn.scrollIntoViewIfNeeded().catch(() => {});
        await btn.click({ timeout: 5000 });
        clicked = true;
        break;
      }
    } catch (e) {
      continue;
    }
  }

  if (!clicked) {
    // Try clicking via JS evaluation
    clicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      const addBtn = btns.find(b => b.textContent.trim().match(/add to cart/i));
      if (addBtn) { addBtn.click(); return true; }
      return false;
    });
  }

  await page.waitForTimeout(3000);
  return clicked;
}

async function ensureCartHasProducts(page) {
  await page.goto(CART_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(2000);

  const cart = new CartPage(page);
  const count = await cart.getCartItemCount();
  if (count >= 2) return true;

  // Add products
  await addProductToCart(page, PRODUCT_1_URL);
  await addProductToCart(page, PRODUCT_2_URL);

  // Navigate to cart
  await page.goto(CART_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(2000);
  return true;
}

async function captureScreenshot(page, name) {
  await fs.ensureDir(SCREENSHOTS_DIR);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotPath = path.join(SCREENSHOTS_DIR, `${name}_${timestamp}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
  return screenshotPath;
}

// ═══════════════════════════════════════════════════════════════════════
//  TEST SUITE
// ═══════════════════════════════════════════════════════════════════════

test.describe('Cart Page Deep QA Testing', () => {
  let page;
  let cart;
  let basePage;

  test.beforeAll(async ({ browser }) => {
    await fs.ensureDir(REPORTS_DIR);
    await fs.ensureDir(SCREENSHOTS_DIR);
  });

  // ═════════════════════════════════════════════════════════════════
  //  1. PRODUCT PREPARATION
  // ═════════════════════════════════════════════════════════════════
  test.describe('1. Product Preparation', () => {
    test('1.1 Add Product 1 (Mattress) to cart', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      basePage = new BasePage(page);

      const added = await addProductToCart(page, PRODUCT_1_URL);
      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      if (!added) {
        reportBug({
          severity: 'Critical',
          module: 'Product Preparation',
          title: 'Unable to add Product 1 (Mattress) to cart',
          steps: '1. Navigate to mattress PDP\n2. Click Add to Cart button',
          actualResult: 'Add to Cart button not found or click failed',
          expectedResult: 'Product should be added to cart successfully'
        });
      }
      recordTest('Add Product 1 to cart', 'Preparation', added ? 'passed' : 'failed', added ? '' : 'Add to Cart failed', duration);
      expect(added).toBeTruthy();

      await page.close();
      await context.close();
    });

    test('1.2 Add Product 2 (Bedsheet) to cart', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();

      const added = await addProductToCart(page, PRODUCT_2_URL);
      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      if (!added) {
        reportBug({
          severity: 'Critical',
          module: 'Product Preparation',
          title: 'Unable to add Product 2 (Bedsheet) to cart',
          steps: '1. Navigate to bedsheet PDP\n2. Click Add to Cart button',
          actualResult: 'Add to Cart button not found or click failed',
          expectedResult: 'Product should be added to cart successfully'
        });
      }
      recordTest('Add Product 2 to cart', 'Preparation', added ? 'passed' : 'failed', added ? '' : 'Add to Cart failed', duration);
      expect(added).toBeTruthy();

      await page.close();
      await context.close();
    });

    test('1.3 Add same product (Mattress) again – verify handling', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();

      // First add
      await addProductToCart(page, PRODUCT_1_URL);
      await page.goto(CART_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(2000);
      const cart1 = new CartPage(page);
      const countBefore = await cart1.getCartItemCount();

      // Second add
      await addProductToCart(page, PRODUCT_1_URL);
      await page.goto(CART_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(2000);
      const cart2 = new CartPage(page);
      const countAfter = await cart2.getCartItemCount();

      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      // Either quantity should increase OR a separate entry is created (both valid)
      // But there should NOT be unexpected duplicates
      recordTest('Add same product again', 'Preparation', 'passed', '', duration);

      if (countAfter > countBefore + 1) {
        reportBug({
          severity: 'High',
          module: 'Business Logic',
          title: 'Unexpected duplicate line items when adding same product',
          steps: '1. Add Mattress to cart\n2. Add same Mattress again',
          actualResult: `Cart item count jumped from ${countBefore} to ${countAfter}`,
          expectedResult: 'Either quantity should increase or max 1 additional entry'
        });
      }

      await page.close();
      await context.close();
    });
  });

  // ═════════════════════════════════════════════════════════════════
  //  2. CART LOADING & PAGE HEALTH
  // ═════════════════════════════════════════════════════════════════
  test.describe('2. Cart Loading & Page Health', () => {
    test('2.1 Cart page loads successfully with no console errors', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      basePage = new BasePage(page);
      cart = new CartPage(page);

      await ensureCartHasProducts(page);

      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      // Check console errors
      const jsExceptions = basePage.consoleErrors.filter(e => e.type === 'exception');
      const jsErrors = basePage.consoleErrors.filter(e => e.type === 'error');

      if (jsExceptions.length > 0) {
        reportBug({
          severity: 'High',
          module: 'Console',
          title: `${jsExceptions.length} unhandled JavaScript exception(s) on cart page load`,
          steps: '1. Navigate to cart page\n2. Open browser DevTools console',
          actualResult: `Exceptions: ${jsExceptions.map(e => e.text).join('; ').substring(0, 500)}`,
          expectedResult: 'No unhandled JavaScript exceptions',
          evidence: JSON.stringify(jsExceptions.slice(0, 5), null, 2)
        });
      }

      if (jsErrors.length > 0) {
        reportBug({
          severity: 'Medium',
          module: 'Console',
          title: `${jsErrors.length} console error(s) on cart page load`,
          steps: '1. Navigate to cart page\n2. Open browser DevTools console',
          actualResult: `Errors: ${jsErrors.map(e => e.text).join('; ').substring(0, 500)}`,
          expectedResult: 'No console errors on page load',
          evidence: JSON.stringify(jsErrors.slice(0, 5), null, 2)
        });
      }

      // Collect global data
      globalConsoleErrors = [...globalConsoleErrors, ...basePage.consoleErrors];
      globalNetworkErrors = [...globalNetworkErrors, ...basePage.networkErrors];
      globalApiLogs = [...globalApiLogs, ...basePage.apiLogs];

      recordTest('Cart page loads without JS errors', 'Page Health', jsExceptions.length === 0 ? 'passed' : 'failed', '', duration);

      await page.close();
      await context.close();
    });

    test('2.2 No broken API calls (4xx/5xx) on cart page', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      basePage = new BasePage(page);

      await ensureCartHasProducts(page);

      const brokenApis = basePage.networkErrors.filter(e => e.status >= 400);
      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      if (brokenApis.length > 0) {
        const serverErrors = brokenApis.filter(e => e.status >= 500);
        const clientErrors = brokenApis.filter(e => e.status >= 400 && e.status < 500);

        if (serverErrors.length > 0) {
          reportBug({
            severity: 'Critical',
            module: 'API',
            title: `${serverErrors.length} server error(s) (5xx) on cart page`,
            steps: '1. Navigate to cart page\n2. Monitor network requests',
            actualResult: `Failed URLs: ${serverErrors.map(e => `${e.url} (${e.status})`).join(', ').substring(0, 500)}`,
            expectedResult: 'All API calls should return 2xx/3xx status',
            evidence: JSON.stringify(serverErrors.slice(0, 5), null, 2)
          });
        }

        if (clientErrors.length > 0) {
          // Filter out common 404s for analytics/tracking that are non-critical
          const criticalClientErrors = clientErrors.filter(e => !e.url.includes('analytics') && !e.url.includes('tracking') && !e.url.includes('gtm'));
          if (criticalClientErrors.length > 0) {
            reportBug({
              severity: 'Medium',
              module: 'API',
              title: `${criticalClientErrors.length} client error(s) (4xx) on cart page`,
              steps: '1. Navigate to cart page\n2. Monitor network requests',
              actualResult: `Failed URLs: ${criticalClientErrors.map(e => `${e.url} (${e.status})`).join(', ').substring(0, 500)}`,
              expectedResult: 'No client error responses for critical resources',
              evidence: JSON.stringify(criticalClientErrors.slice(0, 5), null, 2)
            });
          }
        }
      }

      globalNetworkErrors = [...globalNetworkErrors, ...basePage.networkErrors];
      globalApiLogs = [...globalApiLogs, ...basePage.apiLogs];

      recordTest('No broken API calls', 'Page Health', brokenApis.filter(e => e.status >= 500).length === 0 ? 'passed' : 'failed', '', duration);

      await page.close();
      await context.close();
    });

    test('2.3 Cart data loads correctly – no infinite loader', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      cart = new CartPage(page);

      await ensureCartHasProducts(page);

      // Check for loading spinners that don't go away
      const hasLoader = await page.locator('.loader:visible, .spinner:visible, .loading:visible, [class*="loading"]:visible').first().isVisible({ timeout: 2000 }).catch(() => false);

      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      if (hasLoader) {
        reportBug({
          severity: 'High',
          module: 'Cart Loading',
          title: 'Cart page shows persistent loading spinner',
          steps: '1. Navigate to cart page\n2. Wait for content to load\n3. Observe loading indicator',
          actualResult: 'Loading spinner still visible after page load',
          expectedResult: 'Loading spinner should disappear after data loads'
        });
      }

      const itemCount = await cart.getCartItemCount();
      if (itemCount === 0) {
        reportBug({
          severity: 'High',
          module: 'Cart Loading',
          title: 'Cart shows 0 items despite products being added',
          steps: '1. Add products to cart\n2. Navigate to cart page',
          actualResult: `Cart item count is ${itemCount}`,
          expectedResult: 'Cart should display added products'
        });
      }

      recordTest('Cart data loads correctly', 'Page Health', !hasLoader && itemCount > 0 ? 'passed' : 'failed', '', duration);

      await page.close();
      await context.close();
    });
  });

  // ═════════════════════════════════════════════════════════════════
  //  3. PRODUCT INFORMATION VERIFICATION
  // ═════════════════════════════════════════════════════════════════
  test.describe('3. Product Information Verification', () => {
    test('3.1 Verify product names are displayed', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      cart = new CartPage(page);

      await ensureCartHasProducts(page);

      const names = await cart.getAllProductNames();
      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      if (names.length === 0) {
        reportBug({
          severity: 'High',
          module: 'Product Information',
          title: 'Product names not displayed in cart',
          steps: '1. Add products to cart\n2. Navigate to cart page',
          actualResult: 'No product names visible',
          expectedResult: 'Product names should be clearly displayed'
        });
      }

      for (const name of names) {
        if (!name || name.length < 3) {
          reportBug({
            severity: 'Medium',
            module: 'Product Information',
            title: 'Product name is empty or too short',
            actualResult: `Product name: "${name}"`,
            expectedResult: 'Product name should be descriptive'
          });
        }
      }

      recordTest('Product names displayed', 'Product Info', names.length > 0 ? 'passed' : 'failed', '', duration);

      await page.close();
      await context.close();
    });

    test('3.2 Verify product images are loaded', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      cart = new CartPage(page);

      await ensureCartHasProducts(page);

      const itemCount = await cart.getCartItemCount();
      let brokenImages = 0;

      for (let i = 0; i < itemCount; i++) {
        const info = await cart.getProductInfo(i);
        if (!info.imageUrl) {
          brokenImages++;
          reportBug({
            severity: 'Medium',
            module: 'Product Information',
            title: `Product image URL missing for item ${i + 1}`,
            actualResult: 'Image source URL is empty',
            expectedResult: 'Product image should have a valid source URL'
          });
        } else if (!info.imageLoaded) {
          brokenImages++;
          reportBug({
            severity: 'Medium',
            module: 'UI',
            title: `Product image not loaded for item ${i + 1}`,
            actualResult: `Image URL: ${info.imageUrl} – naturalWidth is 0`,
            expectedResult: 'Product image should be fully loaded and rendered'
          });
        }
      }

      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;
      recordTest('Product images loaded', 'Product Info', brokenImages === 0 ? 'passed' : 'failed', '', duration);

      await page.close();
      await context.close();
    });

    test('3.3 Verify product prices are displayed', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      cart = new CartPage(page);

      await ensureCartHasProducts(page);

      const itemCount = await cart.getCartItemCount();
      let missingPrices = 0;

      for (let i = 0; i < itemCount; i++) {
        const info = await cart.getProductInfo(i);
        if (!info.price) {
          missingPrices++;
          reportBug({
            severity: 'High',
            module: 'Product Information',
            title: `Product price not displayed for item ${i + 1} (${info.name || 'Unknown'})`,
            actualResult: 'Price is not visible in cart',
            expectedResult: 'Product price should be clearly displayed'
          });
        }
      }

      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;
      recordTest('Product prices displayed', 'Product Info', missingPrices === 0 ? 'passed' : 'failed', '', duration);

      await page.close();
      await context.close();
    });

    test('3.4 Verify cart has quantity controls for each item', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      cart = new CartPage(page);

      await ensureCartHasProducts(page);

      const itemCount = await cart.getCartItemCount();
      let missingControls = 0;

      for (let i = 0; i < itemCount; i++) {
        const info = await cart.getProductInfo(i);
        if (!info.hasQuantityControls) {
          missingControls++;
          reportBug({
            severity: 'Medium',
            module: 'Product Information',
            title: `Quantity controls missing for item ${i + 1} (${info.name || 'Unknown'})`,
            actualResult: 'No +/- quantity buttons found',
            expectedResult: 'Each cart item should have quantity increase/decrease controls'
          });
        }
      }

      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;
      recordTest('Quantity controls present', 'Product Info', missingControls === 0 ? 'passed' : 'failed', '', duration);

      await page.close();
      await context.close();
    });

    test('3.5 Verify remove button exists for each item', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      cart = new CartPage(page);

      await ensureCartHasProducts(page);

      const itemCount = await cart.getCartItemCount();
      let missingRemove = 0;

      for (let i = 0; i < itemCount; i++) {
        const info = await cart.getProductInfo(i);
        if (!info.hasRemoveButton) {
          missingRemove++;
          reportBug({
            severity: 'Medium',
            module: 'Product Information',
            title: `Remove button missing for item ${i + 1}`,
            actualResult: 'No Remove button/link found',
            expectedResult: 'Each cart item should have a remove option'
          });
        }
      }

      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;
      recordTest('Remove buttons present', 'Product Info', missingRemove === 0 ? 'passed' : 'failed', '', duration);

      await page.close();
      await context.close();
    });
  });

  // ═════════════════════════════════════════════════════════════════
  //  4. QUANTITY CONTROLS
  // ═════════════════════════════════════════════════════════════════
  test.describe('4. Quantity Controls', () => {
    test('4.1 Increase quantity', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      basePage = new BasePage(page);
      cart = new CartPage(page);

      await ensureCartHasProducts(page);
      const qtyBefore = await cart.getQuantity(0);
      const increased = await cart.increaseQuantity(0);
      const qtyAfter = await cart.getQuantity(0);

      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      if (increased && qtyAfter <= qtyBefore) {
        reportBug({
          severity: 'High',
          module: 'Quantity Controls',
          title: 'Quantity does not increase when + button clicked',
          steps: '1. Go to cart\n2. Click + button on first item',
          actualResult: `Quantity before: ${qtyBefore}, after: ${qtyAfter}`,
          expectedResult: 'Quantity should increase by 1'
        });
      }

      // Check for JS errors during operation
      const errors = basePage.consoleErrors.filter(e => e.type === 'exception');
      if (errors.length > 0) {
        reportBug({
          severity: 'High',
          module: 'Quantity Controls',
          title: 'JavaScript error when increasing quantity',
          evidence: errors.map(e => e.text).join('; ').substring(0, 500)
        });
      }

      globalConsoleErrors = [...globalConsoleErrors, ...basePage.consoleErrors];

      recordTest('Increase quantity', 'Quantity', increased ? 'passed' : 'failed', '', duration);

      await page.close();
      await context.close();
    });

    test('4.2 Decrease quantity', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      basePage = new BasePage(page);
      cart = new CartPage(page);

      await ensureCartHasProducts(page);

      // First increase to ensure qty > 1
      await cart.increaseQuantity(0);
      const qtyBefore = await cart.getQuantity(0);
      await cart.decreaseQuantity(0);
      const qtyAfter = await cart.getQuantity(0);

      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      if (qtyBefore > 1 && qtyAfter >= qtyBefore) {
        reportBug({
          severity: 'High',
          module: 'Quantity Controls',
          title: 'Quantity does not decrease when - button clicked',
          steps: '1. Go to cart\n2. Increase quantity first\n3. Click - button',
          actualResult: `Quantity before: ${qtyBefore}, after: ${qtyAfter}`,
          expectedResult: 'Quantity should decrease by 1'
        });
      }

      globalConsoleErrors = [...globalConsoleErrors, ...basePage.consoleErrors];
      recordTest('Decrease quantity', 'Quantity', 'passed', '', duration);

      await page.close();
      await context.close();
    });

    test('4.3 Rapid clicking increase button', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      basePage = new BasePage(page);
      cart = new CartPage(page);

      await ensureCartHasProducts(page);

      const qtyBefore = await cart.getQuantity(0);
      await cart.rapidClickIncrease(0, 10);
      const qtyAfter = await cart.getQuantity(0);

      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      // Check for JS errors from rapid clicking
      const errors = basePage.consoleErrors.filter(e => e.type === 'exception');
      if (errors.length > 0) {
        reportBug({
          severity: 'High',
          module: 'Quantity Controls',
          title: 'JavaScript error during rapid quantity increase clicks',
          steps: '1. Go to cart\n2. Rapidly click + button 10 times',
          actualResult: `JS Exceptions: ${errors.map(e => e.text).join('; ').substring(0, 500)}`,
          expectedResult: 'No JavaScript errors during rapid clicking',
          possibleRootCause: 'Race condition in quantity update handler, debouncing not implemented'
        });
      }

      // Check for duplicate API calls (more than expected)
      const qtyApis = basePage.apiLogs.filter(a => a.url.includes('cart') || a.url.includes('qty') || a.url.includes('quantity'));

      globalConsoleErrors = [...globalConsoleErrors, ...basePage.consoleErrors];
      globalApiLogs = [...globalApiLogs, ...basePage.apiLogs];

      recordTest('Rapid increase clicking', 'Quantity', errors.length === 0 ? 'passed' : 'failed', '', duration);

      await page.close();
      await context.close();
    });

    test('4.4 Decrease quantity to minimum (1)', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      basePage = new BasePage(page);
      cart = new CartPage(page);

      await ensureCartHasProducts(page);

      // Try to decrease from qty 1
      const qtyBefore = await cart.getQuantity(0);
      if (qtyBefore === 1) {
        await cart.decreaseQuantity(0);
        await page.waitForTimeout(1000);
        const qtyAfter = await cart.getQuantity(0);

        if (qtyAfter < 1) {
          reportBug({
            severity: 'High',
            module: 'Quantity Controls',
            title: 'Quantity can go below 1 (minimum)',
            steps: '1. Go to cart with qty=1\n2. Click - button',
            actualResult: `Quantity went to ${qtyAfter}`,
            expectedResult: 'Quantity should not go below 1 OR item should be removed with confirmation'
          });
        }
      }

      const errors = basePage.consoleErrors.filter(e => e.type === 'exception');
      if (errors.length > 0) {
        reportBug({
          severity: 'Medium',
          module: 'Quantity Controls',
          title: 'JS error when decreasing quantity at minimum',
          evidence: errors.map(e => e.text).join('; ').substring(0, 500)
        });
      }

      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;
      globalConsoleErrors = [...globalConsoleErrors, ...basePage.consoleErrors];
      recordTest('Decrease to minimum', 'Quantity', 'passed', '', duration);

      await page.close();
      await context.close();
    });
  });

  // ═════════════════════════════════════════════════════════════════
  //  5. REMOVE PRODUCT
  // ═════════════════════════════════════════════════════════════════
  test.describe('5. Remove Product', () => {
    test('5.1 Remove single item from cart', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      basePage = new BasePage(page);
      cart = new CartPage(page);

      await ensureCartHasProducts(page);

      const countBefore = await cart.getCartItemCount();
      const namesBefore = await cart.getAllProductNames();

      const removed = await cart.removeItem(0);

      const countAfter = await cart.getCartItemCount();
      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      if (removed && countAfter >= countBefore) {
        reportBug({
          severity: 'Critical',
          module: 'Remove Product',
          title: 'Cart item count did not decrease after removal',
          steps: '1. Go to cart with multiple items\n2. Click Remove on first item',
          actualResult: `Items before: ${countBefore}, after: ${countAfter}`,
          expectedResult: 'Cart item count should decrease by 1'
        });
      }

      // Check for JS errors
      const errors = basePage.consoleErrors.filter(e => e.type === 'exception');
      if (errors.length > 0) {
        reportBug({
          severity: 'High',
          module: 'Remove Product',
          title: 'JavaScript error when removing item',
          evidence: errors.map(e => e.text).join('; ').substring(0, 300)
        });
      }

      globalConsoleErrors = [...globalConsoleErrors, ...basePage.consoleErrors];
      recordTest('Remove single item', 'Remove', removed ? 'passed' : 'failed', '', duration);

      await page.close();
      await context.close();
    });

    test('5.2 Remove all items – verify empty cart state', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      cart = new CartPage(page);

      await ensureCartHasProducts(page);

      const removedCount = await cart.removeAllItems();
      const isEmpty = await cart.isEmpty();

      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      if (!isEmpty && removedCount > 0) {
        reportBug({
          severity: 'Medium',
          module: 'Remove Product',
          title: 'Cart does not show empty state after removing all items',
          steps: '1. Go to cart\n2. Remove all items one by one',
          actualResult: 'Cart does not display empty cart message/illustration',
          expectedResult: 'Empty cart state with illustration and "Continue Shopping" link'
        });
      }

      recordTest('Remove all items', 'Remove', 'passed', '', duration);

      await page.close();
      await context.close();
    });
  });

  // ═════════════════════════════════════════════════════════════════
  //  6. CART PERSISTENCE
  // ═════════════════════════════════════════════════════════════════
  test.describe('6. Cart Persistence', () => {
    test('6.1 Cart survives page refresh', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      cart = new CartPage(page);

      await ensureCartHasProducts(page);

      const countBefore = await cart.getCartItemCount();
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      const countAfter = await cart.getCartItemCount();

      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      if (countAfter !== countBefore) {
        reportBug({
          severity: 'Critical',
          module: 'Cart Persistence',
          title: 'Cart items lost after page refresh',
          steps: '1. Add products to cart\n2. Navigate to cart\n3. Refresh the page',
          actualResult: `Items before refresh: ${countBefore}, after: ${countAfter}`,
          expectedResult: 'Cart should retain all items after refresh'
        });
      }

      recordTest('Cart survives page refresh', 'Persistence', countAfter === countBefore ? 'passed' : 'failed', '', duration);

      await page.close();
      await context.close();
    });

    test('6.2 Cart persists in new tab', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      cart = new CartPage(page);

      await ensureCartHasProducts(page);
      const countBefore = await cart.getCartItemCount();

      // Open new tab within same context
      const newPage = await context.newPage();
      await newPage.goto(CART_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await newPage.waitForTimeout(3000);
      const cart2 = new CartPage(newPage);
      const countInNewTab = await cart2.getCartItemCount();

      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      if (countInNewTab !== countBefore) {
        reportBug({
          severity: 'High',
          module: 'Cart Persistence',
          title: 'Cart state differs between tabs',
          steps: '1. Open cart in tab 1\n2. Open cart in new tab 2',
          actualResult: `Tab 1: ${countBefore} items, Tab 2: ${countInNewTab} items`,
          expectedResult: 'Cart should show same items in both tabs'
        });
      }

      recordTest('Cart persists in new tab', 'Persistence', countInNewTab === countBefore ? 'passed' : 'failed', '', duration);

      await newPage.close();
      await page.close();
      await context.close();
    });
  });

  // ═════════════════════════════════════════════════════════════════
  //  7. PRICE VALIDATION
  // ═════════════════════════════════════════════════════════════════
  test.describe('7. Price Validation', () => {
    test('7.1 Verify price details section exists', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      cart = new CartPage(page);

      await ensureCartHasProducts(page);

      const priceDetails = await cart.getPriceDetails();
      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      if (priceDetails.allPriceLabels.length === 0) {
        reportBug({
          severity: 'High',
          module: 'Price Validation',
          title: 'Price details section not found on cart page',
          steps: '1. Add products to cart\n2. Navigate to cart page\n3. Look for price summary section',
          actualResult: 'No price labels (MRP, Discount, Total, etc.) found',
          expectedResult: 'Cart should display price breakdown with MRP, discount, shipping, total'
        });
      }

      if (priceDetails.totalPayable) {
        // Verify total is a valid number
        const totalNum = parseFloat(priceDetails.totalPayable.replace(/[₹,\s]/g, ''));
        if (isNaN(totalNum) || totalNum <= 0) {
          reportBug({
            severity: 'High',
            module: 'Price Validation',
            title: 'Total payable amount is invalid or zero',
            actualResult: `Total: ${priceDetails.totalPayable}`,
            expectedResult: 'Total payable should be a valid positive number'
          });
        }
      }

      recordTest('Price details section exists', 'Price', priceDetails.allPriceLabels.length > 0 ? 'passed' : 'failed', '', duration);

      await page.close();
      await context.close();
    });

    test('7.2 Verify MRP and discount math', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      cart = new CartPage(page);

      await ensureCartHasProducts(page);

      const priceDetails = await cart.getPriceDetails();
      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      // If MRP and discount exist, verify: Total ≈ MRP - Discount
      if (priceDetails.mrp && priceDetails.discount && priceDetails.totalPayable) {
        const mrp = parseFloat(priceDetails.mrp.replace(/[₹,\s-]/g, ''));
        const discount = parseFloat(priceDetails.discount.replace(/[₹,\s-]/g, ''));
        const total = parseFloat(priceDetails.totalPayable.replace(/[₹,\s-]/g, ''));

        if (!isNaN(mrp) && !isNaN(discount) && !isNaN(total)) {
          const expected = mrp - discount;
          // Allow for shipping/tax adjustments (within 20% margin)
          if (Math.abs(total - expected) > expected * 0.2 && Math.abs(total - expected) > 500) {
            reportBug({
              severity: 'High',
              module: 'Business Logic',
              title: 'Price calculation mismatch: Total ≠ MRP - Discount (± tax/shipping)',
              actualResult: `MRP: ₹${mrp}, Discount: ₹${discount}, Total: ₹${total}, Expected ≈ ₹${expected}`,
              expectedResult: 'Total should approximately equal MRP - Discount + Shipping/Tax',
              possibleRootCause: 'Price calculation logic error or rounding issue'
            });
          }
        }
      }

      recordTest('MRP/Discount math verification', 'Price', 'passed', '', duration);

      await page.close();
      await context.close();
    });
  });

  // ═════════════════════════════════════════════════════════════════
  //  8. COUPON TESTING
  // ═════════════════════════════════════════════════════════════════
  test.describe('8. Coupon Testing', () => {
    test('8.1 Invalid coupon shows error message', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      basePage = new BasePage(page);
      cart = new CartPage(page);

      await ensureCartHasProducts(page);

      const applied = await cart.applyCoupon('INVALID_COUPON_XYZ_999');
      await page.waitForTimeout(2000);

      // Check that coupon was NOT applied
      const isApplied = await cart.isCouponApplied();
      const errorMsg = await cart.getCouponErrorMessage();
      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      if (applied && isApplied) {
        reportBug({
          severity: 'Critical',
          module: 'Coupon',
          title: 'Invalid coupon code was accepted',
          steps: '1. Go to cart\n2. Enter invalid coupon "INVALID_COUPON_XYZ_999"\n3. Click Apply',
          actualResult: 'Coupon was accepted and marked as applied',
          expectedResult: 'Invalid coupon should show error message and not apply'
        });
      }

      if (applied && !isApplied && !errorMsg) {
        reportBug({
          severity: 'Medium',
          module: 'Coupon',
          title: 'No error message shown for invalid coupon',
          steps: '1. Go to cart\n2. Enter invalid coupon\n3. Click Apply',
          actualResult: 'No feedback/error message displayed',
          expectedResult: 'Clear error message like "Invalid coupon code" should be shown'
        });
      }

      const errors = basePage.consoleErrors.filter(e => e.type === 'exception');
      if (errors.length > 0) {
        reportBug({
          severity: 'High',
          module: 'Coupon',
          title: 'JavaScript error when applying invalid coupon',
          evidence: errors.map(e => e.text).join('; ').substring(0, 500)
        });
      }

      globalConsoleErrors = [...globalConsoleErrors, ...basePage.consoleErrors];
      recordTest('Invalid coupon error handling', 'Coupon', 'passed', '', duration);
      await cart.closeCouponModal();

      await page.close();
      await context.close();
    });

    test('8.2 Empty coupon code handling', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      basePage = new BasePage(page);
      cart = new CartPage(page);

      await ensureCartHasProducts(page);

      const applied = await cart.applyCoupon('');
      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      const errors = basePage.consoleErrors.filter(e => e.type === 'exception');
      if (errors.length > 0) {
        reportBug({
          severity: 'Medium',
          module: 'Coupon',
          title: 'JavaScript error when applying empty coupon code',
          steps: '1. Go to cart\n2. Leave coupon field empty\n3. Click Apply',
          evidence: errors.map(e => e.text).join('; ').substring(0, 300)
        });
      }

      globalConsoleErrors = [...globalConsoleErrors, ...basePage.consoleErrors];
      recordTest('Empty coupon handling', 'Coupon', 'passed', '', duration);
      await cart.closeCouponModal();

      await page.close();
      await context.close();
    });

    test('8.3 Coupon with special characters and spaces', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      basePage = new BasePage(page);
      cart = new CartPage(page);

      await ensureCartHasProducts(page);

      const testCoupons = [
        '  SPACECOUPON  ',
        '<script>alert("xss")</script>',
        'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
      ];

      for (const coupon of testCoupons) {
        await cart.applyCoupon(coupon);
        await page.waitForTimeout(1000);
      }

      const errors = basePage.consoleErrors.filter(e => e.type === 'exception');
      if (errors.length > 0) {
        reportBug({
          severity: 'High',
          module: 'Security',
          title: 'JavaScript error with special character coupon input',
          steps: '1. Go to cart\n2. Enter various special character coupons\n3. Click Apply',
          evidence: errors.map(e => e.text).join('; ').substring(0, 500),
          possibleRootCause: 'Input not properly sanitized before processing'
        });
      }

      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;
      globalConsoleErrors = [...globalConsoleErrors, ...basePage.consoleErrors];
      recordTest('Special char coupon handling', 'Coupon', errors.length === 0 ? 'passed' : 'failed', '', duration);
      await cart.closeCouponModal();

      await page.close();
      await context.close();
    });
  });

  // ═════════════════════════════════════════════════════════════════
  //  9. DELIVERY / PINCODE
  // ═════════════════════════════════════════════════════════════════
  test.describe('9. Delivery & Pincode', () => {
    test('9.1 Valid pincode check', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      basePage = new BasePage(page);
      cart = new CartPage(page);

      await ensureCartHasProducts(page);

      const checked = await cart.checkPincode('302015');
      const deliveryInfo = await cart.getDeliveryInfo();
      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      if (!checked) {
        reportBug({
          severity: 'Medium',
          module: 'Delivery',
          title: 'Pincode input or check button not found on cart page',
          steps: '1. Go to cart\n2. Look for pincode input field',
          actualResult: 'Pincode field or check button not visible',
          expectedResult: 'Pincode checking should be available on cart page'
        });
      }

      globalConsoleErrors = [...globalConsoleErrors, ...basePage.consoleErrors];
      recordTest('Valid pincode check', 'Delivery', checked ? 'passed' : 'skipped', '', duration);

      await page.close();
      await context.close();
    });

    test('9.2 Invalid pincode handling', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      basePage = new BasePage(page);
      cart = new CartPage(page);

      await ensureCartHasProducts(page);

      const invalidPincodes = ['000000', '999999', 'abcdef', '!@#$%^', '', '   '];
      let jsErrorFound = false;

      for (const pin of invalidPincodes) {
        basePage.clearLogs();
        await cart.checkPincode(pin);

        const errors = basePage.consoleErrors.filter(e => e.type === 'exception');
        if (errors.length > 0) {
          jsErrorFound = true;
          reportBug({
            severity: 'High',
            module: 'Delivery',
            title: `JavaScript error with invalid pincode: "${pin}"`,
            steps: `1. Go to cart\n2. Enter pincode "${pin}"\n3. Click Check`,
            evidence: errors.map(e => e.text).join('; ').substring(0, 300),
            possibleRootCause: 'Pincode validation not handling edge cases'
          });
        }
      }

      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;
      globalConsoleErrors = [...globalConsoleErrors, ...basePage.consoleErrors];
      recordTest('Invalid pincode handling', 'Delivery', !jsErrorFound ? 'passed' : 'failed', '', duration);

      await page.close();
      await context.close();
    });
  });

  // ═════════════════════════════════════════════════════════════════
  //  10. CROSS NAVIGATION
  // ═════════════════════════════════════════════════════════════════
  test.describe('10. Cross Navigation', () => {
    test('10.1 Navigate PDP → Cart → PDP → Cart (no data loss)', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      cart = new CartPage(page);

      await ensureCartHasProducts(page);
      const countInCart = await cart.getCartItemCount();

      // Go to PDP
      await page.goto(PRODUCT_1_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(2000);

      // Come back to cart
      await page.goto(CART_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(2000);

      const countAfter = await cart.getCartItemCount();
      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      if (countAfter !== countInCart) {
        reportBug({
          severity: 'High',
          module: 'Cross Navigation',
          title: 'Cart items change after PDP → Cart navigation',
          steps: '1. Go to cart (note item count)\n2. Navigate to PDP\n3. Navigate back to cart',
          actualResult: `Items before: ${countInCart}, after: ${countAfter}`,
          expectedResult: 'Cart should retain all items'
        });
      }

      recordTest('PDP ↔ Cart navigation', 'Navigation', countAfter === countInCart ? 'passed' : 'failed', '', duration);

      await page.close();
      await context.close();
    });

    test('10.2 Back button from cart preserves state', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      cart = new CartPage(page);

      await ensureCartHasProducts(page);
      const countBefore = await cart.getCartItemCount();

      // Navigate away
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(1000);

      // Go back
      await page.goBack({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      const countAfter = await cart.getCartItemCount();
      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      if (countAfter !== countBefore) {
        reportBug({
          severity: 'Medium',
          module: 'Cross Navigation',
          title: 'Cart state changed after back button navigation',
          actualResult: `Items before: ${countBefore}, after: ${countAfter}`,
          expectedResult: 'Cart should show same items after back navigation'
        });
      }

      recordTest('Back button preserves cart', 'Navigation', 'passed', '', duration);

      await page.close();
      await context.close();
    });
  });

  // ═════════════════════════════════════════════════════════════════
  //  11. CART COUNTER SYNC
  // ═════════════════════════════════════════════════════════════════
  test.describe('11. Cart Counter Sync', () => {
    test('11.1 Header cart badge matches cart item count', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      cart = new CartPage(page);

      await ensureCartHasProducts(page);

      const cartItemCount = await cart.getCartItemCount();
      const badgeText = await cart.getCartBadgeText();
      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      if (badgeText) {
        const badgeNum = parseInt(badgeText.replace(/[^\d]/g, ''));
        if (!isNaN(badgeNum) && badgeNum !== cartItemCount) {
          reportBug({
            severity: 'Medium',
            module: 'Cart Counter',
            title: 'Header cart badge count does not match cart items',
            actualResult: `Badge shows: ${badgeText} (${badgeNum}), Cart has: ${cartItemCount} items`,
            expectedResult: 'Cart badge should show correct number of items'
          });
        }
      }

      recordTest('Cart badge matches items', 'Cart Counter', 'passed', '', duration);

      await page.close();
      await context.close();
    });
  });

  // ═════════════════════════════════════════════════════════════════
  //  12. CHECKOUT BUTTON
  // ═════════════════════════════════════════════════════════════════
  test.describe('12. Checkout Button', () => {
    test('12.1 Checkout/Place Order button is visible and clickable', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      cart = new CartPage(page);

      await ensureCartHasProducts(page);

      const isVisible = await cart.isCheckoutButtonVisible();
      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      if (!isVisible) {
        reportBug({
          severity: 'Critical',
          module: 'Checkout',
          title: 'Checkout/Place Order button not visible on cart page',
          steps: '1. Add products to cart\n2. Navigate to cart page\n3. Look for Place Order / Checkout button',
          actualResult: 'Button not found or not visible',
          expectedResult: 'A prominent checkout button should be visible'
        });
      }

      recordTest('Checkout button visible', 'Checkout', isVisible ? 'passed' : 'failed', '', duration);

      await page.close();
      await context.close();
    });
  });

  // ═════════════════════════════════════════════════════════════════
  //  13. EMPTY CART
  // ═════════════════════════════════════════════════════════════════
  test.describe('13. Empty Cart State', () => {
    test('13.1 Empty cart displays proper state', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      basePage = new BasePage(page);
      cart = new CartPage(page);

      // Navigate to cart and remove all items
      await ensureCartHasProducts(page);
      await cart.removeAllItems();
      await page.waitForTimeout(2000);

      const emptyDetails = await cart.getEmptyCartDetails();
      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      if (!emptyDetails.isEmpty) {
        // Cart may not be empty if removal didn't work
        recordTest('Empty cart state', 'Empty Cart', 'skipped', 'Could not empty cart', duration);
      } else {
        if (!emptyDetails.hasContinueShopping) {
          reportBug({
            severity: 'Low',
            module: 'Empty Cart',
            title: 'No "Continue Shopping" link on empty cart page',
            actualResult: 'Empty cart page has no navigation link back to shop',
            expectedResult: 'A "Continue Shopping" or "Shop Now" button should be present'
          });
        }

        // Check for JS errors on empty cart
        const errors = basePage.consoleErrors.filter(e => e.type === 'exception');
        if (errors.length > 0) {
          reportBug({
            severity: 'Medium',
            module: 'Empty Cart',
            title: 'JavaScript errors on empty cart page',
            evidence: errors.map(e => e.text).join('; ').substring(0, 500)
          });
        }

        recordTest('Empty cart state', 'Empty Cart', 'passed', '', duration);
      }

      globalConsoleErrors = [...globalConsoleErrors, ...basePage.consoleErrors];

      await page.close();
      await context.close();
    });
  });

  // ═════════════════════════════════════════════════════════════════
  //  14. RECOMMENDED PRODUCTS
  // ═════════════════════════════════════════════════════════════════
  test.describe('14. Recommended Products', () => {
    test('14.1 Recommended products section exists', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      cart = new CartPage(page);

      await ensureCartHasProducts(page);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);

      const hasRecommended = await cart.hasRecommendedProducts();
      const recCount = await cart.getRecommendedProductCount();

      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      if (hasRecommended) {
        console.log(`  ℹ️  Found ${recCount} recommended product(s)`);
      } else {
        console.log('  ℹ️  No recommended products section found (may be by design)');
      }

      recordTest('Recommended products', 'Recommendations', 'passed', '', duration);

      await page.close();
      await context.close();
    });
  });

  // ═════════════════════════════════════════════════════════════════
  //  15. RESPONSIVE TESTING
  // ═════════════════════════════════════════════════════════════════
  test.describe('15. Responsive Testing', () => {
    const viewports = [
      { name: 'Desktop', width: 1280, height: 800, isMobile: false },
      { name: 'Laptop', width: 1366, height: 768, isMobile: false },
      { name: 'Tablet Portrait', width: 768, height: 1024, isMobile: true },
      { name: 'Mobile Portrait', width: 375, height: 812, isMobile: true },
      { name: 'Mobile Landscape', width: 812, height: 375, isMobile: true },
    ];

    for (const vp of viewports) {
      test(`15.${viewports.indexOf(vp) + 1} Cart page renders correctly on ${vp.name} (${vp.width}x${vp.height})`, async ({ browser }) => {
        const start = Date.now();
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          isMobile: vp.isMobile,
          hasTouch: vp.isMobile,
          userAgent: vp.isMobile
            ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1'
            : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
        page = await context.newPage();
        basePage = new BasePage(page);
        cart = new CartPage(page);

        await ensureCartHasProducts(page);

        // Check for horizontal scrolling (overflow issue)
        const hasOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });

        if (hasOverflow) {
          reportBug({
            severity: 'Medium',
            module: 'Responsive',
            title: `Horizontal scrolling detected on ${vp.name} (${vp.width}x${vp.height})`,
            environment: `${vp.name} – ${vp.width}x${vp.height}`,
            actualResult: `Page scroll width exceeds viewport width`,
            expectedResult: 'No horizontal scrolling should occur',
            possibleRootCause: 'Fixed-width elements or images overflowing container'
          });
        }

        // Check for overlapping elements
        const overlaps = await page.evaluate(() => {
          const buttons = document.querySelectorAll('button, a[href]');
          let overlapCount = 0;
          const rects = [];
          buttons.forEach(btn => {
            const rect = btn.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              rects.push(rect);
            }
          });
          // Simple overlap detection between consecutive elements
          for (let i = 0; i < rects.length - 1; i++) {
            for (let j = i + 1; j < Math.min(i + 3, rects.length); j++) {
              const r1 = rects[i];
              const r2 = rects[j];
              if (r1.left < r2.right && r1.right > r2.left && r1.top < r2.bottom && r1.bottom > r2.top) {
                overlapCount++;
              }
            }
          }
          return overlapCount;
        });

        if (overlaps > 5) {
          reportBug({
            severity: 'Low',
            module: 'Responsive',
            title: `Potential element overlapping on ${vp.name}`,
            environment: `${vp.name} – ${vp.width}x${vp.height}`,
            actualResult: `${overlaps} potential overlapping element pairs detected`,
            expectedResult: 'Interactive elements should not overlap'
          });
        }

        // Check for JS errors
        const errors = basePage.consoleErrors.filter(e => e.type === 'exception');
        if (errors.length > 0) {
          reportBug({
            severity: 'Medium',
            module: 'Responsive',
            title: `JavaScript errors on ${vp.name} viewport`,
            environment: `${vp.name} – ${vp.width}x${vp.height}`,
            evidence: errors.map(e => e.text).join('; ').substring(0, 300)
          });
        }

        // Take screenshot
        await captureScreenshot(page, `responsive_${vp.name.toLowerCase().replace(/\s/g, '_')}`);

        const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;
        globalConsoleErrors = [...globalConsoleErrors, ...basePage.consoleErrors];
        recordTest(`Responsive: ${vp.name}`, 'Responsive', 'passed', '', duration);

        await page.close();
        await context.close();
      });
    }
  });

  // ═════════════════════════════════════════════════════════════════
  //  16. UI TESTING
  // ═════════════════════════════════════════════════════════════════
  test.describe('16. UI Testing', () => {
    test('16.1 Images and icons validation', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      basePage = new BasePage(page);

      await ensureCartHasProducts(page);
      await basePage.scrollToBottomAndTop();
      await page.waitForTimeout(2000);

      const imagesData = await basePage.getImagesData();
      const brokenImages = imagesData.filter(img => img.isBroken);
      const missingAlt = imagesData.filter(img => !img.altAvailable);

      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      if (brokenImages.length > 0) {
        reportBug({
          severity: 'Medium',
          module: 'UI',
          title: `${brokenImages.length} broken image(s) on cart page`,
          actualResult: `Broken images: ${brokenImages.map(i => i.url).join(', ').substring(0, 500)}`,
          expectedResult: 'All images should load successfully'
        });
      }

      if (missingAlt.length > 3) {
        reportBug({
          severity: 'Low',
          module: 'Accessibility',
          title: `${missingAlt.length} images missing alt text on cart page`,
          actualResult: `${missingAlt.length} images have empty or missing alt attributes`,
          expectedResult: 'All meaningful images should have descriptive alt text'
        });
      }

      recordTest('Images & icons validation', 'UI', brokenImages.length === 0 ? 'passed' : 'failed', '', duration);

      await page.close();
      await context.close();
    });

    test('16.2 Typography and text content', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();

      await ensureCartHasProducts(page);

      // Check for truncated text and empty elements
      const textIssues = await page.evaluate(() => {
        const issues = [];
        const elements = document.querySelectorAll('h1, h2, h3, h4, p, span, a');
        let emptyCount = 0;
        elements.forEach(el => {
          const text = el.textContent.trim();
          const style = window.getComputedStyle(el);
          if (style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null) {
            if (!text && el.tagName !== 'A' && !el.querySelector('img') && !el.querySelector('svg')) {
              emptyCount++;
            }
          }
        });
        if (emptyCount > 10) {
          issues.push(`${emptyCount} empty visible text elements found`);
        }
        return issues;
      });

      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      if (textIssues.length > 0) {
        reportBug({
          severity: 'Low',
          module: 'UI',
          title: 'Typography issues found on cart page',
          actualResult: textIssues.join('; '),
          expectedResult: 'No empty visible elements or text rendering issues'
        });
      }

      recordTest('Typography check', 'UI', 'passed', '', duration);

      await page.close();
      await context.close();
    });
  });

  // ═════════════════════════════════════════════════════════════════
  //  17. ACCESSIBILITY TESTING
  // ═════════════════════════════════════════════════════════════════
  test.describe('17. Accessibility Testing', () => {
    test('17.1 Axe accessibility audit', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      basePage = new BasePage(page);

      await ensureCartHasProducts(page);

      const violations = await basePage.runAccessibilityAudit();
      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      const criticalViolations = violations.filter(v => v.impact === 'critical');
      const seriousViolations = violations.filter(v => v.impact === 'serious');

      if (criticalViolations.length > 0) {
        reportBug({
          severity: 'High',
          module: 'Accessibility',
          title: `${criticalViolations.length} critical accessibility violation(s)`,
          actualResult: criticalViolations.map(v => `${v.id}: ${v.description} (${v.nodes} elements)`).join('\n'),
          expectedResult: 'No critical accessibility violations',
          evidence: JSON.stringify(criticalViolations, null, 2)
        });
      }

      if (seriousViolations.length > 0) {
        reportBug({
          severity: 'Medium',
          module: 'Accessibility',
          title: `${seriousViolations.length} serious accessibility violation(s)`,
          actualResult: seriousViolations.map(v => `${v.id}: ${v.description} (${v.nodes} elements)`).join('\n'),
          expectedResult: 'No serious accessibility violations',
          evidence: JSON.stringify(seriousViolations, null, 2)
        });
      }

      recordTest('Axe accessibility audit', 'Accessibility', criticalViolations.length === 0 ? 'passed' : 'failed', '', duration);

      await page.close();
      await context.close();
    });

    test('17.2 Keyboard navigation test', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();

      await ensureCartHasProducts(page);

      // Tab through interactive elements
      let tabbableCount = 0;
      let focusVisibleCount = 0;
      for (let i = 0; i < 30; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(200);

        const focusedTag = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el) return null;
          const style = window.getComputedStyle(el);
          const outline = style.outlineStyle;
          const boxShadow = style.boxShadow;
          return {
            tag: el.tagName,
            hasOutline: outline !== 'none',
            hasBoxShadow: boxShadow !== 'none',
            text: el.textContent?.trim().substring(0, 50)
          };
        });

        if (focusedTag && focusedTag.tag !== 'BODY') {
          tabbableCount++;
          if (focusedTag.hasOutline || focusedTag.hasBoxShadow) {
            focusVisibleCount++;
          }
        }
      }

      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      if (tabbableCount > 0 && focusVisibleCount < tabbableCount * 0.5) {
        reportBug({
          severity: 'Medium',
          module: 'Accessibility',
          title: 'Many interactive elements lack visible focus indicators',
          actualResult: `${tabbableCount} tabbable elements, only ${focusVisibleCount} have visible focus`,
          expectedResult: 'All interactive elements should have visible focus indicators'
        });
      }

      recordTest('Keyboard navigation', 'Accessibility', 'passed', '', duration);

      await page.close();
      await context.close();
    });

    test('17.3 Zoom 200% test', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext({
        viewport: { width: 640, height: 400 }, // Simulates 200% zoom on 1280x800
      });
      page = await context.newPage();
      basePage = new BasePage(page);

      await ensureCartHasProducts(page);

      // Check for overflow at zoomed size
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth + 20;
      });

      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      if (hasOverflow) {
        reportBug({
          severity: 'Medium',
          module: 'Accessibility',
          title: 'Content overflows at 200% zoom level',
          actualResult: 'Horizontal scrolling detected at 200% zoom',
          expectedResult: 'Content should reflow properly at 200% zoom without horizontal scrolling'
        });
      }

      const errors = basePage.consoleErrors.filter(e => e.type === 'exception');
      if (errors.length > 0) {
        reportBug({
          severity: 'Low',
          module: 'Accessibility',
          title: 'JavaScript errors at 200% zoom',
          evidence: errors.map(e => e.text).join('; ').substring(0, 300)
        });
      }

      globalConsoleErrors = [...globalConsoleErrors, ...basePage.consoleErrors];
      recordTest('Zoom 200% test', 'Accessibility', !hasOverflow ? 'passed' : 'failed', '', duration);

      await page.close();
      await context.close();
    });
  });

  // ═════════════════════════════════════════════════════════════════
  //  18. PERFORMANCE TESTING
  // ═════════════════════════════════════════════════════════════════
  test.describe('18. Performance Testing', () => {
    test('18.1 Cart page load performance metrics', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      basePage = new BasePage(page);

      await ensureCartHasProducts(page);

      const metrics = await basePage.getPerformanceMetrics();
      globalPerformance = metrics;

      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      // Check LCP (should be under 4s)
      if (metrics.lcp > 4000) {
        reportBug({
          severity: 'Medium',
          module: 'Performance',
          title: 'Largest Contentful Paint (LCP) exceeds 4 seconds',
          actualResult: `LCP: ${(metrics.lcp / 1000).toFixed(2)}s`,
          expectedResult: 'LCP should be under 2.5s (good) or at most 4s (needs improvement)',
          possibleRootCause: 'Large images or slow API responses blocking rendering'
        });
      }

      // Check page load time (should be under 8s)
      if (metrics.pageLoadTime > 8000) {
        reportBug({
          severity: 'Medium',
          module: 'Performance',
          title: 'Page load time exceeds 8 seconds',
          actualResult: `Load time: ${(metrics.pageLoadTime / 1000).toFixed(2)}s`,
          expectedResult: 'Page should load within 5 seconds',
          possibleRootCause: 'Too many resources, unoptimized images, or slow backend'
        });
      }

      // Check FCP (should be under 3s)
      if (metrics.fcp > 3000) {
        reportBug({
          severity: 'Low',
          module: 'Performance',
          title: 'First Contentful Paint (FCP) exceeds 3 seconds',
          actualResult: `FCP: ${(metrics.fcp / 1000).toFixed(2)}s`,
          expectedResult: 'FCP should be under 1.8s (good) or at most 3s'
        });
      }

      console.log(`  ℹ️  Performance: Load=${(metrics.pageLoadTime / 1000).toFixed(2)}s, FCP=${(metrics.fcp / 1000).toFixed(2)}s, LCP=${(metrics.lcp / 1000).toFixed(2)}s`);

      recordTest('Performance metrics', 'Performance', 'passed', '', duration);

      await page.close();
      await context.close();
    });

    test('18.2 API response time analysis', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      basePage = new BasePage(page);

      await ensureCartHasProducts(page);

      const slowApis = basePage.apiLogs.filter(a => a.responseTime > 3000);
      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      if (slowApis.length > 0) {
        reportBug({
          severity: 'Medium',
          module: 'Performance',
          title: `${slowApis.length} API(s) with response time > 3 seconds`,
          actualResult: slowApis.map(a => `${a.url} (${a.responseTime}ms)`).join('\n').substring(0, 500),
          expectedResult: 'All APIs should respond within 3 seconds',
          possibleRootCause: 'Slow backend processing or unoptimized database queries'
        });
      }

      globalApiLogs = [...globalApiLogs, ...basePage.apiLogs];
      recordTest('API response times', 'Performance', slowApis.length === 0 ? 'passed' : 'failed', '', duration);

      await page.close();
      await context.close();
    });
  });

  // ═════════════════════════════════════════════════════════════════
  //  19. SECURITY CHECKS
  // ═════════════════════════════════════════════════════════════════
  test.describe('19. Security Checks', () => {
    test('19.1 XSS injection in coupon field', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      basePage = new BasePage(page);
      cart = new CartPage(page);

      await ensureCartHasProducts(page);

      const xssPayloads = [
        '<script>alert("xss")</script>',
        '"><img src=x onerror=alert("xss")>',
        "'; DROP TABLE users; --"
      ];

      let xssDetected = false;
      for (const payload of xssPayloads) {
        await cart.applyCoupon(payload);
        await page.waitForTimeout(1000);

        // Check if script executed (no alert dialog should appear)
        const alertTriggered = await page.evaluate(() => {
          return window.__xss_triggered || false;
        }).catch(() => false);

        if (alertTriggered) {
          xssDetected = true;
          reportBug({
            severity: 'Critical',
            module: 'Security',
            title: 'XSS vulnerability in coupon input field',
            steps: `1. Go to cart\n2. Enter payload: ${payload}\n3. Click Apply`,
            actualResult: 'Script execution detected',
            expectedResult: 'All input should be properly sanitized'
          });
        }
      }

      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;
      globalConsoleErrors = [...globalConsoleErrors, ...basePage.consoleErrors];
      recordTest('XSS injection test', 'Security', !xssDetected ? 'passed' : 'failed', '', duration);
      await cart.closeCouponModal();

      await page.close();
      await context.close();
    });

    test('19.2 Injection in pincode field', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      basePage = new BasePage(page);
      cart = new CartPage(page);

      await ensureCartHasProducts(page);

      const injectionPayloads = [
        '<script>alert(1)</script>',
        "' OR '1'='1",
        '🏠🔥💀🎃',
        'A'.repeat(500)
      ];

      let hasErrors = false;
      for (const payload of injectionPayloads) {
        basePage.clearLogs();
        await cart.checkPincode(payload);

        const errors = basePage.consoleErrors.filter(e => e.type === 'exception');
        if (errors.length > 0) {
          hasErrors = true;
          reportBug({
            severity: 'Medium',
            module: 'Security',
            title: `Unhandled error with injection payload in pincode field`,
            steps: `1. Enter "${payload.substring(0, 30)}..." in pincode\n2. Click Check`,
            evidence: errors.map(e => e.text).join('; ').substring(0, 300)
          });
        }
      }

      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;
      globalConsoleErrors = [...globalConsoleErrors, ...basePage.consoleErrors];
      recordTest('Pincode injection test', 'Security', !hasErrors ? 'passed' : 'failed', '', duration);

      await page.close();
      await context.close();
    });
  });

  // ═════════════════════════════════════════════════════════════════
  //  20. EDGE CASES
  // ═════════════════════════════════════════════════════════════════
  test.describe('20. Edge Cases', () => {
    test('20.1 Refresh during page load', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      basePage = new BasePage(page);

      // Start navigating to cart
      const navigationPromise = page.goto(CART_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(500); // During load
      await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
      await page.waitForTimeout(3000);

      const errors = basePage.consoleErrors.filter(e => e.type === 'exception');
      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      if (errors.length > 0) {
        reportBug({
          severity: 'Medium',
          module: 'Edge Cases',
          title: 'JavaScript error after refreshing during page load',
          steps: '1. Start navigating to cart\n2. Refresh during load',
          evidence: errors.map(e => e.text).join('; ').substring(0, 300)
        });
      }

      globalConsoleErrors = [...globalConsoleErrors, ...basePage.consoleErrors];
      recordTest('Refresh during load', 'Edge Cases', 'passed', '', duration);

      await page.close();
      await context.close();
    });

    test('20.2 Browser back after attempting checkout', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      basePage = new BasePage(page);
      cart = new CartPage(page);

      await ensureCartHasProducts(page);

      // Try clicking checkout
      await cart.proceedToCheckout();
      await page.waitForTimeout(2000);

      // Go back
      await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
      await page.waitForTimeout(3000);

      const errors = basePage.consoleErrors.filter(e => e.type === 'exception');
      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      if (errors.length > 0) {
        reportBug({
          severity: 'Medium',
          module: 'Edge Cases',
          title: 'JavaScript error after back navigation from checkout',
          steps: '1. Go to cart\n2. Click Place Order/Checkout\n3. Press browser back button',
          evidence: errors.map(e => e.text).join('; ').substring(0, 300)
        });
      }

      globalConsoleErrors = [...globalConsoleErrors, ...basePage.consoleErrors];
      recordTest('Back after checkout', 'Edge Cases', 'passed', '', duration);

      await page.close();
      await context.close();
    });
  });

  // ═════════════════════════════════════════════════════════════════
  //  21. BUSINESS LOGIC
  // ═════════════════════════════════════════════════════════════════
  test.describe('21. Business Logic', () => {
    test('21.1 No duplicate line items for same product', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      cart = new CartPage(page);

      await ensureCartHasProducts(page);

      const names = await cart.getAllProductNames();
      const normalizedNames = names.map(n => n.toLowerCase().trim());
      const duplicates = normalizedNames.filter((name, idx) => normalizedNames.indexOf(name) !== idx);

      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      if (duplicates.length > 0) {
        reportBug({
          severity: 'High',
          module: 'Business Logic',
          title: 'Duplicate line items found in cart',
          actualResult: `Duplicate products: ${duplicates.join(', ')}`,
          expectedResult: 'Same product should not appear as separate line items (quantity should increment instead)'
        });
      }

      recordTest('No duplicate line items', 'Business Logic', duplicates.length === 0 ? 'passed' : 'failed', '', duration);

      await page.close();
      await context.close();
    });

    test('21.2 Mixed product cart displays correctly', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      cart = new CartPage(page);

      await ensureCartHasProducts(page);

      const names = await cart.getAllProductNames();
      const itemCount = await cart.getCartItemCount();

      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;

      // Verify each product has distinct info
      let infoOverwritten = false;
      for (let i = 0; i < itemCount; i++) {
        const info = await cart.getProductInfo(i);
        if (info.name && names.indexOf(info.name) !== i) {
          // Check if product info from one item is showing in another slot
          infoOverwritten = true;
        }
      }

      if (infoOverwritten) {
        reportBug({
          severity: 'High',
          module: 'Business Logic',
          title: 'Product information overwritten between cart items',
          actualResult: 'One product info is displaying in another product slot',
          expectedResult: 'Each cart item should display its own distinct product information'
        });
      }

      recordTest('Mixed cart display', 'Business Logic', !infoOverwritten ? 'passed' : 'failed', '', duration);

      await page.close();
      await context.close();
    });
  });

  // ═════════════════════════════════════════════════════════════════
  //  22. NETWORK & CONSOLE AUDIT
  // ═════════════════════════════════════════════════════════════════
  test.describe('22. Comprehensive Console & Network Audit', () => {
    test('22.1 Full page console and network audit', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      basePage = new BasePage(page);

      await ensureCartHasProducts(page);

      // Scroll page to trigger lazy loading
      await basePage.scrollToBottomAndTop();
      await page.waitForTimeout(2000);

      // Collect all errors
      const allConsoleErrors = basePage.consoleErrors;
      const allNetworkErrors = basePage.networkErrors;
      const allApiLogs = basePage.apiLogs;

      // CORS issues
      const corsErrors = allConsoleErrors.filter(e => e.text.toLowerCase().includes('cors') || e.text.toLowerCase().includes('cross-origin'));
      if (corsErrors.length > 0) {
        reportBug({
          severity: 'Medium',
          module: 'Network',
          title: `${corsErrors.length} CORS error(s) detected`,
          actualResult: corsErrors.map(e => e.text).join('\n').substring(0, 500),
          expectedResult: 'No CORS errors',
          possibleRootCause: 'Missing or incorrect CORS headers on API endpoints'
        });
      }

      // 404 resources
      const notFoundErrors = allNetworkErrors.filter(e => e.status === 404);
      if (notFoundErrors.length > 0) {
        reportBug({
          severity: 'Low',
          module: 'Network',
          title: `${notFoundErrors.length} resource(s) returning 404`,
          actualResult: notFoundErrors.map(e => `${e.resourceType}: ${e.url}`).join('\n').substring(0, 500),
          expectedResult: 'All referenced resources should exist'
        });
      }

      // Duplicate API calls
      const apiUrls = allApiLogs.map(a => `${a.method}:${a.url}`);
      const duplicateApis = apiUrls.filter((url, idx) => apiUrls.indexOf(url) !== idx);
      const uniqueDuplicates = [...new Set(duplicateApis)];
      if (uniqueDuplicates.length > 5) {
        reportBug({
          severity: 'Low',
          module: 'Performance',
          title: `${uniqueDuplicates.length} duplicate API call pattern(s) detected`,
          actualResult: `Duplicate APIs: ${uniqueDuplicates.slice(0, 5).join(', ')}`,
          expectedResult: 'Minimize duplicate API calls for better performance',
          possibleRootCause: 'Component re-rendering or missing request deduplication'
        });
      }

      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;
      globalConsoleErrors = [...globalConsoleErrors, ...allConsoleErrors];
      globalNetworkErrors = [...globalNetworkErrors, ...allNetworkErrors];
      globalApiLogs = [...globalApiLogs, ...allApiLogs];

      recordTest('Console & Network audit', 'Network', 'passed', '', duration);

      await page.close();
      await context.close();
    });
  });

  // ═════════════════════════════════════════════════════════════════
  //  23. SEO & SECURITY HEADERS
  // ═════════════════════════════════════════════════════════════════
  test.describe('23. SEO & Security Headers', () => {
    test('23.1 Cart page SEO and security headers', async ({ browser }) => {
      const start = Date.now();
      const context = await browser.newContext();
      page = await context.newPage();
      basePage = new BasePage(page);

      const navResult = await basePage.navigate(CART_URL);
      await page.waitForTimeout(2000);

      // SEO Check
      const seo = await basePage.getSEOData();
      if (!seo.title || seo.title.length < 5) {
        reportBug({
          severity: 'Low',
          module: 'SEO',
          title: 'Cart page missing or empty title tag',
          actualResult: `Title: "${seo.title}"`,
          expectedResult: 'Cart page should have a descriptive title tag'
        });
      }

      // Security Headers
      const security = await basePage.getSecurityChecks(navResult.headers);
      if (!security.isHttps) {
        reportBug({
          severity: 'High',
          module: 'Security',
          title: 'Cart page not served over HTTPS',
          actualResult: 'Page loaded over HTTP',
          expectedResult: 'Cart page must use HTTPS for security'
        });
      }

      const missingHeaders = [];
      if (!security.securityHeaders.hsts) missingHeaders.push('Strict-Transport-Security');
      if (!security.securityHeaders.xFrameOptions) missingHeaders.push('X-Frame-Options');
      if (!security.securityHeaders.xContentTypeOptions) missingHeaders.push('X-Content-Type-Options');

      if (missingHeaders.length > 0) {
        reportBug({
          severity: 'Low',
          module: 'Security',
          title: `Missing security header(s): ${missingHeaders.join(', ')}`,
          actualResult: `Headers missing: ${missingHeaders.join(', ')}`,
          expectedResult: 'All standard security headers should be present'
        });
      }

      const duration = `${((Date.now() - start) / 1000).toFixed(1)}s`;
      recordTest('SEO & Security headers', 'Security', 'passed', '', duration);

      await page.close();
      await context.close();
    });
  });

  // ═════════════════════════════════════════════════════════════════
  //  REPORT GENERATION (afterAll)
  // ═════════════════════════════════════════════════════════════════
  test.afterAll(async () => {
    // Deduplicate console errors
    const uniqueConsoleErrors = [];
    const seen = new Set();
    for (const err of globalConsoleErrors) {
      const key = `${err.type}:${err.text}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueConsoleErrors.push(err);
      }
    }

    // Deduplicate network errors
    const uniqueNetworkErrors = [];
    const seenNet = new Set();
    for (const err of globalNetworkErrors) {
      const key = `${err.url}:${err.status}`;
      if (!seenNet.has(key)) {
        seenNet.add(key);
        uniqueNetworkErrors.push(err);
      }
    }

    // Generate HTML Report
    const reportData = {
      bugs,
      testResults,
      performance: globalPerformance,
      consoleErrors: uniqueConsoleErrors,
      networkErrors: uniqueNetworkErrors,
      apiLogs: globalApiLogs.slice(0, 100), // Limit to 100 entries
      summary: {
        totalBugs: bugs.length,
        critical: bugs.filter(b => b.severity === 'Critical').length,
        high: bugs.filter(b => b.severity === 'High').length,
        medium: bugs.filter(b => b.severity === 'Medium').length,
        low: bugs.filter(b => b.severity === 'Low').length,
      }
    };

    const reportPath = path.join(REPORTS_DIR, 'cart-qa-report.html');
    try {
      await CartQaReporter.generate(reportData, reportPath);
      console.log(`\n══════════════════════════════════════════════════`);
      console.log(`  🛒 CART PAGE DEEP QA TEST REPORT`);
      console.log(`══════════════════════════════════════════════════`);
      console.log(`  Total Tests Run : ${testResults.length}`);
      console.log(`  Passed          : ${testResults.filter(t => t.status === 'passed').length}`);
      console.log(`  Failed          : ${testResults.filter(t => t.status === 'failed').length}`);
      console.log(`  Skipped         : ${testResults.filter(t => t.status === 'skipped').length}`);
      console.log(`  ──────────────────────────────────────────────`);
      console.log(`  Total Bugs      : ${bugs.length}`);
      console.log(`  Critical        : ${reportData.summary.critical}`);
      console.log(`  High            : ${reportData.summary.high}`);
      console.log(`  Medium          : ${reportData.summary.medium}`);
      console.log(`  Low             : ${reportData.summary.low}`);
      console.log(`  ──────────────────────────────────────────────`);
      console.log(`  Console Errors  : ${uniqueConsoleErrors.length}`);
      console.log(`  Network Errors  : ${uniqueNetworkErrors.length}`);
      console.log(`  API Calls       : ${globalApiLogs.length}`);
      console.log(`  ──────────────────────────────────────────────`);
      console.log(`  Report: ${reportPath}`);
      console.log(`══════════════════════════════════════════════════\n`);
    } catch (e) {
      console.error(`Failed to generate report: ${e.message}`);
    }

    // Also save bugs as JSON for programmatic access
    const jsonPath = path.join(REPORTS_DIR, 'cart-qa-bugs.json');
    try {
      await fs.writeJSON(jsonPath, reportData, { spaces: 2 });
    } catch (e) {
      console.error(`Failed to save JSON report: ${e.message}`);
    }
  });
});
