const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const config = require('./src/automation/config');
const Reporter = require('./src/automation/reporter');
const { extractComponentAttributes } = require('./src/automation/auditHelper');

const BASELINE_PATH = path.join(__dirname, 'src/automation/baseline.json');
const REPORTS_DIR = path.join(__dirname, 'reports');
const SCREENSHOTS_DIR = path.join(REPORTS_DIR, 'screenshots');

test.describe('Home Page Visual & Component Audit', () => {

  test('Audit Home Page components in Desktop and Mobile views', async ({ browser }) => {
    test.setTimeout(300000); // 300 seconds timeout for full multi-viewport audits
    const mode = process.env.MODE || 'compare';
    console.log(`Running Home Page Component Audit in ${mode.toUpperCase()} mode...`);

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

    const pageConfig = config.pages.home;
    if (!pageConfig) {
      throw new Error("Home Page configuration not found in config.js");
    }

    // 1. Audit Desktop View
    console.log('\n--- Auditing Home Page Desktop View ---');
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const desktopPage = await desktopContext.newPage();
    desktopPage.setDefaultNavigationTimeout(45000);
    desktopPage.setDefaultTimeout(15000);
    
    await runAuditForView(desktopPage, pageConfig, 'home_desktop', 'Home Page (Desktop)', baseline, mode, runData);
    await desktopPage.close().catch(() => {});
    await desktopContext.close().catch(() => {});

    // 2. Audit Mobile View
    console.log('\n--- Auditing Home Page Mobile View ---');
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1',
      isMobile: true,
      hasTouch: true
    });
    const mobilePage = await mobileContext.newPage();
    mobilePage.setDefaultNavigationTimeout(45000);
    mobilePage.setDefaultTimeout(15000);
    
    await runAuditForView(mobilePage, pageConfig, 'home_mobile', 'Home Page (Mobile)', baseline, mode, runData);
    await mobilePage.close().catch(() => {});
    await mobileContext.close().catch(() => {});

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
        // Merge with existing baseline to preserve other page baselines (like PDP)
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
        console.log(`\n✅ Home Page Baseline details merged into: ${BASELINE_PATH}`);
      }
    } else {
      const reportPath = path.join(REPORTS_DIR, 'dashboard.html');

      // Consolidated results to prevent discarding other pages' run data in the report
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

      // Perform assertions for missing components (excluding optional ones)
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
  console.log(`\n🧹 Clearing browser cache, cookies, and local storage for fresh banner capture...`);
  try {
    const client = await page.context().newCDPSession(page);
    await client.send('Network.clearBrowserCache').catch(() => {});
    await client.send('Network.setCacheDisabled', { cacheDisabled: true }).catch(() => {});
    await page.context().clearCookies().catch(() => {});
  } catch (err) {
    console.log('Note: CDP cache clear notification:', err.message);
  }

  console.log(`Navigating to URL: ${pageConfig.url}`);
  await page.goto(pageConfig.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  
  // Clear local/session storage right after load
  await page.evaluate(() => {
    try { localStorage.clear(); sessionStorage.clear(); } catch(e) {}
  }).catch(() => {});

  console.log('Waiting for main elements to start loading...');
  await page.locator('header, form').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {
    console.log('Header/Form not visible after 15s. Proceeding...');
  });
  
  // Dismiss initial popups
  await dismissPopups(page);
  
  // Force all lazy-loaded banner images to set src from data-src/data-lazy
  await page.evaluate(() => {
    document.querySelectorAll('img[data-src], img[data-lazy], img[data-original]').forEach(img => {
      const src = img.getAttribute('data-src') || img.getAttribute('data-lazy') || img.getAttribute('data-original');
      if (src && !img.src.includes(src)) {
        img.src = src;
      }
    });
  }).catch(() => {});

  console.log('Triggering complete page auto-scroll to load ALL lazy content...');
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let currentPosition = 0;
      const step = 500;
      let lastScrollHeight = document.body.scrollHeight;
      let sameHeightCount = 0;
      const startTime = Date.now();
      const maxScrollTime = 25000; // 25 seconds for full homepage scroll

      const timer = setInterval(() => {
        window.scrollBy(0, step);
        currentPosition += step;
        const currentScrollHeight = document.body.scrollHeight;

        if (window.innerHeight + window.scrollY >= currentScrollHeight - 30) {
          if (currentScrollHeight === lastScrollHeight) {
            sameHeightCount++;
            if (sameHeightCount >= 4) {
              clearInterval(timer);
              resolve();
              return;
            }
          } else {
            sameHeightCount = 0;
            lastScrollHeight = currentScrollHeight;
          }
        } else {
          sameHeightCount = 0;
        }

        if (Date.now() - startTime > maxScrollTime) {
          clearInterval(timer);
          resolve();
        }
      }, 40);
    });
  });

  console.log('Reached bottom of homepage. Waiting for lazy components to settle...');
  await page.waitForTimeout(3000);

  // Force all lazy-loaded banner images to set src from data-src/data-lazy/data-original
  await page.evaluate(() => {
    document.querySelectorAll('img').forEach(img => {
      const lazySrc = img.getAttribute('data-src') || 
                      img.getAttribute('data-lazy') || 
                      img.getAttribute('data-original') ||
                      img.getAttribute('data-srcset');
      if (lazySrc && (!img.src || img.src.includes('data:image') || !img.src.includes(lazySrc.split(' ')[0]))) {
        img.src = lazySrc.split(' ')[0];
      }
    });
  }).catch(() => {});

  console.log('Scrolling back to top...');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1500);

  // Dismiss any popups triggered by scrolling
  await dismissPopups(page);

  // Wait for all images on the page to load completely (resolves even on errors or timeouts)
  console.log('Waiting for all image assets across the page to load completely...');
  await page.evaluate(async () => {
    const images = Array.from(document.querySelectorAll('img'));
    await Promise.all(images.map(img => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise(resolve => {
        const timer = setTimeout(resolve, 5000);
        img.addEventListener('load', () => { clearTimeout(timer); resolve(); });
        img.addEventListener('error', () => { clearTimeout(timer); resolve(); });
      });
    })).catch(() => {});
  });

  // Freeze CSS animations and banner slide transitions so screenshots don't capture mid-animation frames
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.id = 'freeze-animations-style';
    style.innerHTML = `
      *, *::before, *::after {
        animation-play-state: paused !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `;
    document.head.appendChild(style);
  }).catch(() => {});

  console.log('Allowing page components and DOM to settle before screenshot...');
  await page.waitForTimeout(3000);

  // Dismiss any timed popups right before auditing/screenshotting
  await dismissPopups(page);

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
