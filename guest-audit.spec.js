const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const config = require('./src/automation/config');
const Reporter = require('./src/automation/reporter');
const { extractComponentAttributes, prepareAndLoadPageCompletely } = require('./src/automation/auditHelper');

const BASELINE_PATH = path.join(__dirname, 'src/automation/baseline.json');
const REPORTS_DIR = path.join(__dirname, 'reports');
const SCREENSHOTS_DIR = path.join(REPORTS_DIR, 'screenshots');

test.describe('Guest Checkout Page Visual & Component Audit', () => {

  test('Audit Guest Page components in Desktop and Mobile views', async ({ browser }) => {
    test.setTimeout(180000); // 180 seconds timeout for sequential multi-viewport audits
    const mode = process.env.MODE || 'compare';
    console.log(`Running Guest Checkout Page Component Audit in ${mode.toUpperCase()} mode...`);

    // Ensure output directories exist
    if (!fs.existsSync(REPORTS_DIR)) {
      fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
      fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }

    let baseline = {};
    if (mode === 'compare') {
      if (!fs.existsSync(BASELINE_PATH)) {
        throw new Error(`Baseline file not found at ${BASELINE_PATH}. Run capture mode first.`);
      }
      baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
    }

    const runData = {
      timestamp: new Date().toLocaleString(),
      pages: {}
    };

    const pageConfig = config.pages.guest;
    if (!pageConfig) {
      throw new Error("Guest Page configuration not found in config.js");
    }

    // 1. Audit Desktop View
    console.log('\n--- Auditing Guest Checkout Page Desktop View ---');
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const desktopPage = await desktopContext.newPage();
    desktopPage.setDefaultNavigationTimeout(45000);
    desktopPage.setDefaultTimeout(15000);
    
    await ensureProductsInCart(desktopPage);
    await runAuditForView(desktopPage, pageConfig, 'guest_desktop', 'Guest Checkout Page (Desktop)', baseline, mode, runData);

    // 2. Audit Mobile View
    console.log('\n--- Auditing Guest Checkout Page Mobile View ---');
    const mobilePage = await desktopContext.newPage();
    await mobilePage.setViewportSize({ width: 375, height: 812 });
    mobilePage.setDefaultNavigationTimeout(45000);
    mobilePage.setDefaultTimeout(15000);
    
    await runAuditForView(mobilePage, pageConfig, 'guest_mobile', 'Guest Checkout Page (Mobile)', baseline, mode, runData);
    await mobilePage.close();
    await desktopPage.close();
    await desktopContext.close();

    // 3. Save Baseline or Write Report
    if (mode === 'capture') {
      let isComplete = true;
      const missingCritical = [];
      Object.keys(runData.pages).forEach(pId => {
        const pageResults = runData.pages[pId];
        pageResults.components.forEach(c => {
          if (!c.present && !c.optional) {
            missingCritical.push(`${pageResults.name} -> ${c.name}`);
            isComplete = false;
          }
        });
      });

      if (!isComplete) {
        console.log(`\n⚠️ Warning: Baseline capture was INCOMPLETE. The following critical components were missing: ${missingCritical.join(', ')}`);
        console.log(`Skipping saving baseline to protect the previous complete baseline file.`);
        throw new Error(`Baseline capture failed due to missing critical components: ${missingCritical.join(', ')}`);
      } else {
        // Merge with existing baseline
        let existingBaseline = {};
        if (fs.existsSync(BASELINE_PATH)) {
          try {
            existingBaseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
          } catch (e) {}
        }
        
        const mergedPages = {
          ...(existingBaseline.pages || {}),
          ...runData.pages
        };
        
        const finalBaseline = {
          timestamp: new Date().toLocaleString(),
          pages: mergedPages
        };

        fs.writeFileSync(BASELINE_PATH, JSON.stringify(finalBaseline, null, 2), 'utf8');
        console.log(`\n✅ Guest Page Baseline details merged into: ${BASELINE_PATH}`);
      }
    } else {
      const reportPath = path.join(REPORTS_DIR, 'dashboard.html');

      // Consolidated results
      let consolidatedResults = { ...runData.pages };
      const tempRunDataPath = path.join(REPORTS_DIR, 'last_run_state.json');
      if (fs.existsSync(tempRunDataPath)) {
        try {
          const cachedRunState = JSON.parse(fs.readFileSync(tempRunDataPath, 'utf8'));
          consolidatedResults = { ...cachedRunState, ...runData.pages };
        } catch (e) {}
      }
      fs.writeFileSync(tempRunDataPath, JSON.stringify(consolidatedResults, null, 2), 'utf8');

      Reporter.generateReport(
        consolidatedResults,
        baseline.timestamp,
        runData.timestamp,
        reportPath
      );
      console.log(`\n✅ HTML dashboard updated at: ${reportPath}`);

      // Perform assertions for missing components
      const missingCritical = [];
      Object.keys(runData.pages).forEach(pId => {
        const pageResults = runData.pages[pId];
        const pageBaseline = baseline.pages ? baseline.pages[pId] : null;

        pageResults.components.forEach(c => {
          const baselineComp = pageBaseline ? pageBaseline.components.find(bc => bc.id === c.id) : null;
          const wasPresentInBaseline = baselineComp ? baselineComp.present : false;

          if (c.status === 'Missing' && !c.optional && wasPresentInBaseline) {
            missingCritical.push(`${pageResults.name} -> ${c.name}`);
          }
        });
      });
      expect(missingCritical.length, `Regression! Critical components disappeared: ${missingCritical.join(', ')}`).toBe(0);
    }
  });

});

/**
 * Audit engine helper for a specific page viewport/context
 */
async function runAuditForView(page, pageConfig, viewId, viewName, baseline, mode, runData) {
  await prepareAndLoadPageCompletely(page, pageConfig.url);

  if (page.url().includes('/cart')) {
    console.log('   Redirected to Cart Page. Clicking Place Order button to enter Guest Checkout...');
    const placeOrderBtn = page.locator('button#placeOrder, button:has-text("PLACE ORDER"), button:has-text("CONFIRM ORDER"), .checkout-btn').first();
    if (await placeOrderBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await placeOrderBtn.click({ force: true });
      await page.waitForTimeout(4000);
    }
  }

  const pageBaseline = baseline.pages ? baseline.pages[viewId] : null;
  const pageComponentsData = [];
  const highlightsToInject = [];

  for (const comp of pageConfig.components) {
    if (comp.multi) {
      const locator = page.locator(comp.selector);
      const allNodes = await locator.all();
      const visibleNodes = [];
      for (const node of allNodes) {
        if (await node.isVisible().catch(() => false)) {
          visibleNodes.push(node);
        }
      }
      const count = Math.min(visibleNodes.length, 12);
      
      if (count === 0) {
        const subCompId = `${comp.id}_0`;
        const subCompName = `${comp.name} #1`;
        const baselineComp = pageBaseline ? pageBaseline.components.find(c => c.id === subCompId) : null;
        
        console.log(`   ❌ Component is MISSING: [${subCompId}]`);
        pageComponentsData.push({
          id: subCompId,
          name: subCompName,
          selector: comp.selector,
          optional: !!comp.optional,
          present: false,
          attributes: {},
          rect: null,
          status: 'Missing',
          changes: null
        });

        if (baselineComp && baselineComp.rect) {
          highlightsToInject.push({
            name: subCompName,
            status: 'Missing (was here)',
            color: '#ef4444',
            rect: baselineComp.rect,
            isDotted: true
          });
        }
      } else {
        for (let i = 0; i < count; i++) {
          const element = visibleNodes[i];
          const isPresent = true;
          const subCompId = `${comp.id}_${i}`;
          const subCompName = `${comp.name} #${i + 1}`;
          
          const baselineComp = pageBaseline ? pageBaseline.components.find(c => c.id === subCompId) : null;
          let status = 'Present';
          let changes = null;
          let rect = null;
          let attributes = {};

          if (isPresent) {
            rect = await element.boundingBox();
            attributes = await extractComponentAttributes(element, rect);

            if (mode === 'compare') {
              if (baselineComp && baselineComp.present) {
                const currentChanges = {};
                let isChanged = false;

                const skipAttrs = comp.skipCompareAttrs || [];
                const keysToCompare = Object.keys(attributes).filter(k => !skipAttrs.includes(k));
                for (const key of keysToCompare) {
                  const oldVal = baselineComp.attributes[key] || '';
                  const newVal = attributes[key] || '';
                  
                  if (oldVal !== newVal) {
                    isChanged = true;
                    currentChanges[key] = { old: oldVal, new: newVal };
                  }
                }

                if (isChanged) {
                  status = 'Changed';
                  changes = currentChanges;
                  console.log(`   ⚠️ Changes detected in [${subCompId}]:`, currentChanges);
                }
              }
            }
          } else {
            status = 'Missing';
            console.log(`   ❌ Component is MISSING: [${subCompId}]`);
          }

          pageComponentsData.push({
            id: subCompId,
            name: subCompName,
            selector: comp.selector,
            optional: !!comp.optional,
            present: isPresent,
            attributes,
            rect,
            status,
            changes
          });

          let overlayColor = '#10b981';
          if (status === 'Changed') overlayColor = '#f59e0b';
          if (status === 'Missing') overlayColor = '#ef4444';

          if (isPresent && rect) {
            highlightsToInject.push({ name: subCompName, status, color: overlayColor, rect });
          } else if (status === 'Missing' && baselineComp && baselineComp.rect) {
            highlightsToInject.push({
              name: subCompName,
              status: 'Missing (was here)',
              color: '#ef4444',
              rect: baselineComp.rect,
              isDotted: true
            });
          }
        }
      }
    } else {
      const locator = page.locator(comp.selector);
      const allNodes = await locator.all();
      let element = null;
      let isPresent = false;
      
      for (const el of allNodes) {
        if (await el.isVisible().catch(() => false)) {
          element = el;
          isPresent = true;
          break;
        }
      }
      
      if (!isPresent && allNodes.length > 0) {
        element = allNodes[0];
      }

      const baselineComp = pageBaseline ? pageBaseline.components.find(c => c.id === comp.id) : null;
      let status = 'Present';
      let changes = null;
      let rect = null;
      let attributes = {};

      if (isPresent) {
        rect = await element.boundingBox();
        attributes = await extractComponentAttributes(element, rect);

        if (mode === 'compare') {
          if (baselineComp && baselineComp.present) {
            const currentChanges = {};
            let isChanged = false;

            const skipAttrs = comp.skipCompareAttrs || [];
            const keysToCompare = Object.keys(attributes).filter(k => !skipAttrs.includes(k));
            for (const key of keysToCompare) {
              const oldVal = baselineComp.attributes[key] || '';
              const newVal = attributes[key] || '';
              
              if (oldVal !== newVal) {
                isChanged = true;
                currentChanges[key] = { old: oldVal, new: newVal };
              }
            }

            if (isChanged) {
              status = 'Changed';
              changes = currentChanges;
              console.log(`   ⚠️ Changes detected in [${comp.id}]:`, currentChanges);
            }
          }
        }
      } else {
        status = 'Missing';
        console.log(`   ❌ Component is MISSING: [${comp.id}]`);
      }

      pageComponentsData.push({
        id: comp.id,
        name: comp.name,
        selector: comp.selector,
        optional: !!comp.optional,
        present: isPresent,
        attributes,
        rect,
        status,
        changes
      });

      let overlayColor = '#10b981';
      if (status === 'Changed') overlayColor = '#f59e0b';
      if (status === 'Missing') overlayColor = '#ef4444';

      if (isPresent && rect) {
        highlightsToInject.push({ name: comp.name, status, color: overlayColor, rect });
      } else if (status === 'Missing' && baselineComp && baselineComp.rect) {
        highlightsToInject.push({
          name: comp.name,
          status: 'Missing (was here)',
          color: '#ef4444',
          rect: baselineComp.rect,
          isDotted: true
        });
      }
    }
  }

  // Inject visual highlight overlays
  if (highlightsToInject.length > 0) {
    await page.evaluate((highlights) => {
      highlights.forEach(h => {
        if (!h.rect) return;
        const overlay = document.createElement('div');
        overlay.className = 'automation-highlight-overlay';
        overlay.style.position = 'absolute';
        overlay.style.top = (h.rect.y + window.scrollY) + 'px';
        overlay.style.left = (h.rect.x + window.scrollX) + 'px';
        overlay.style.width = h.rect.width + 'px';
        overlay.style.height = h.rect.height + 'px';
        if (h.isDotted) {
          overlay.style.border = `3px dotted ${h.color}`;
          overlay.style.background = 'rgba(239, 68, 68, 0.08)';
        } else {
          overlay.style.border = `3px solid ${h.color}`;
        }
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '100000';
        overlay.style.boxSizing = 'border-box';
        
        const label = document.createElement('span');
        label.innerText = `${h.name} [${h.status}]`;
        label.style.position = 'absolute';
        label.style.top = '-20px';
        label.style.left = '0';
        label.style.background = h.color;
        label.style.color = '#ffffff';
        label.style.fontSize = '11px';
        label.style.fontWeight = 'bold';
        label.style.padding = '2px 6px';
        label.style.whiteSpace = 'nowrap';
        label.style.borderRadius = '3px';
        
        overlay.appendChild(label);
        document.body.appendChild(overlay);
      });
    }, highlightsToInject);
  }

  const screenshotName = mode === 'capture' ? `${viewId}_baseline.png` : `${viewId}_current.png`;
  const screenshotPath = path.join(SCREENSHOTS_DIR, screenshotName);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  // Clean up overlays
  await page.evaluate(() => {
    document.querySelectorAll('.automation-highlight-overlay').forEach(el => el.remove());
  });

  runData.pages[viewId] = {
    name: viewName,
    url: pageConfig.url,
    screenshot: screenshotName,
    components: pageComponentsData
  };
}

/**
 * Helper to close subscription, login, city modals, or other blocking overlays
 */
async function dismissPopups(page) {
  console.log('Checking for any popups to dismiss...');
  try {
    await page.mouse.move(0, 0).catch(() => {});
    const closeSelectors = [
      'button[class*="absolute right-0 -top-8"]',
      'img[src*="modal-close-img.svg"]',
      'span.style_closemenu__LjqMy',
      'button:has-text("Accept")',
      'button:has-text("Got it")',
      'button:has-text("OK")',
      'button:has-text("Close")',
      'button:has-text("CLOSE")',
      '.modal-close',
      '.popup-close',
      '[class*="closeBtn"]',
      '[class*="close-btn"]',
      '[aria-label="Close"]',
      '#close-login',
      '.close-login',
      '.newsletter-close'
    ];
    for (const sel of closeSelectors) {
      try {
        const loc = page.locator(sel);
        const count = await loc.count();
        for (let i = 0; i < count; i++) {
          const el = loc.nth(i);
          if (await el.isVisible().catch(() => false)) {
            console.log(`   Dismissing popup matching selector: "${sel}"`);
            await el.click({ timeout: 1000 }).catch(() => {});
            await page.waitForTimeout(200);
          }
        }
      } catch {}
    }
  } catch (err) {
    console.error('Error during dismissPopups:', err);
  }
}

const CATEGORY_PRODUCTS = [
  { name: 'Sofa & Living', url: 'https://www.woodenstreet.com/product/lorenz-3-seater-sofa-cotton-jade-ivory' },
  { name: 'Home Furnishing & Bedding', url: 'https://www.woodenstreet.com/product/connecting-flat-cotton-bedsheet-king-size-with-2-pillow-covers-beige' },
  { name: 'Study & Office Furniture', url: 'https://www.woodenstreet.com/product/jerold-study-table' }
];

async function addProductToCart(page, product) {
  try {
    console.log(`Adding [${product.name}] to cart from PDP: ${product.url}`);
    await page.goto(product.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(2500);

    const atc = page.locator('button:has-text("ADD TO CART")').first();
    if (await atc.isVisible({ timeout: 5000 }).catch(() => false)) {
      await atc.click({ force: true });
      console.log(`   Successfully clicked Add to Cart for [${product.name}]`);
      await page.waitForTimeout(3000);
      return true;
    }
    return false;
  } catch (err) {
    console.log(`   Failed to add [${product.name}] to cart: ${err.message}`);
    return false;
  }
}

async function ensureProductsInCart(page) {
  console.log('Checking cart contents before running guest checkout audit...');
  await page.goto('https://www.woodenstreet.com/cart', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(2000);
  
  const itemLocators = '.cart-item, .cart-list-item, .cart-product-row, tr.product, div[class*="cartItem" i], div[class*="cart-product" i], [class*="cart-item" i]';
  let count = await page.locator(itemLocators).count().catch(() => 0);
  if (count >= 1) {
    console.log(`Cart already contains ${count} item(s).`);
    return;
  }

  console.log(`Cart currently has ${count} item(s). Adding product to enable guest checkout...`);
  for (const product of CATEGORY_PRODUCTS) {
    if (await addProductToCart(page, product)) break;
  }

  console.log('Navigating to Cart Page to verify items...');
  await page.goto('https://www.woodenstreet.com/cart', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3000);
}
