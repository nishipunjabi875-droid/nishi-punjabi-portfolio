/**
 * Helper utilities for Visual & Component Audit Automation
 */

/**
 * Thoroughly clear browser cache, cookies, service workers, HTML5 CacheStorage,
 * and web storage (localStorage, sessionStorage) to ensure a completely fresh load.
 */
async function clearPageCache(page) {
  console.log(`🧹 Clearing browser cache, cookies, service workers, and local storage...`);
  try {
    const client = await page.context().newCDPSession(page);
    await client.send('Network.clearBrowserCache').catch(() => {});
    await client.send('Network.setCacheDisabled', { cacheDisabled: true }).catch(() => {});
    await page.context().clearCookies().catch(() => {});
  } catch (err) {
    console.log('Note: CDP cache clear notification:', err.message);
  }

  // Clear storage, service worker registrations, and HTML5 CacheStorage on blank page
  try {
    await page.goto('about:blank');
    await page.evaluate(async () => {
      try {
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
        }
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map(r => r.unregister()));
        }
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {}
    });
  } catch (err) {}
}

/**
 * Helper to close subscription, login, city modals, or other blocking overlays
 */
async function dismissPopups(page) {
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
  } catch (err) {}
}

/**
 * Navigates to target page URL, performs complete cache clear, auto-scrolls down
 * to trigger all lazy-loaded components, forces image lazy attributes into src,
 * waits for all page image assets to load completely, freezes CSS animations,
 * and dismisses popups before visual audit capture.
 */
async function prepareAndLoadPageCompletely(page, pageUrl) {
  // 1. Clear cache and storage
  await clearPageCache(page);

  // 2. Navigate to target URL
  console.log(`Navigating to URL: ${pageUrl}`);
  await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });

  // Clear local/session storage right after load
  await page.evaluate(() => {
    try { localStorage.clear(); sessionStorage.clear(); } catch(e) {}
  }).catch(() => {});

  console.log('Waiting for main page elements to start loading...');
  await page.locator('header, form, h1, .logo-box, footer').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {
    console.log('Main element not visible after 15s. Proceeding...');
  });

  await dismissPopups(page);

  // 3. Force lazy load images initial check
  await page.evaluate(() => {
    document.querySelectorAll('img[data-src], img[data-lazy], img[data-original], img[data-srcset]').forEach(img => {
      const src = img.getAttribute('data-src') || img.getAttribute('data-lazy') || img.getAttribute('data-original') || img.getAttribute('data-srcset');
      if (src && (!img.src || img.src.includes('data:image') || !img.src.includes(src.split(' ')[0]))) {
        img.src = src.split(' ')[0];
      }
    });
  }).catch(() => {});

  // 4. Smooth scroll down to bottom of page to trigger ALL lazy content
  console.log('Triggering complete page auto-scroll to load ALL lazy content...');
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let currentPosition = 0;
      const step = 500;
      let lastScrollHeight = document.body.scrollHeight;
      let sameHeightCount = 0;
      const startTime = Date.now();
      const maxScrollTime = 25000; // 25 seconds max scroll

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

  console.log('Reached bottom of page. Waiting for lazy components to settle...');
  await page.waitForTimeout(3000);

  // 5. Force lazy-loaded images again after scroll
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

  // 6. Scroll back to top
  console.log('Scrolling back to top...');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1500);

  await dismissPopups(page);

  // 7. Wait for all image assets across the page to load completely
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

  // 8. Freeze CSS animations and transitions so screenshots don't capture mid-animation frames
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

  await dismissPopups(page);
}

/**
 * Extract comprehensive component attributes for baseline capture & comparison.
 * Includes innerText, attributes, CSS computed styles, and element width/height.
 */
async function extractComponentAttributes(element, rect) {
  const attributes = {};

  if (!element) return attributes;

  try {
    attributes.innerText = (await element.innerText().catch(() => '')).trim();
    attributes.classList = await element.evaluate(el => Array.from(el.classList).join(' ')).catch(() => '');

    const src = await element.getAttribute('src').catch(() => null);
    if (src !== null) attributes.src = src;

    const href = await element.getAttribute('href').catch(() => null);
    if (href !== null) attributes.href = href;

    const alt = await element.getAttribute('alt').catch(() => null);
    if (alt !== null) attributes.alt = alt;

    const placeholder = await element.getAttribute('placeholder').catch(() => null);
    if (placeholder !== null) attributes.placeholder = placeholder;

    const computedStyles = await element.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        color: style.color,
        backgroundColor: style.backgroundColor,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight,
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        borderColor: style.borderColor,
        borderRadius: style.borderRadius,
        padding: style.padding,
        margin: style.margin
      };
    }).catch(() => ({}));

    attributes['style.color'] = computedStyles.color || '';
    attributes['style.backgroundColor'] = computedStyles.backgroundColor || '';
    attributes['style.fontSize'] = computedStyles.fontSize || '';
    attributes['style.fontWeight'] = computedStyles.fontWeight || '';
    attributes['style.lineHeight'] = computedStyles.lineHeight || '';
    attributes['style.display'] = computedStyles.display || '';
    attributes['style.visibility'] = computedStyles.visibility || '';
    attributes['style.opacity'] = computedStyles.opacity || '';
    attributes['style.borderColor'] = computedStyles.borderColor || '';
    attributes['style.borderRadius'] = computedStyles.borderRadius || '';
    attributes['style.padding'] = computedStyles.padding || '';
    attributes['style.margin'] = computedStyles.margin || '';

    if (rect) {
      attributes['rect.width'] = `${Math.round(rect.width)}px`;
      attributes['rect.height'] = `${Math.round(rect.height)}px`;
    }
  } catch (err) {
    console.error('Error extracting component attributes:', err);
  }

  return attributes;
}

module.exports = {
  clearPageCache,
  dismissPopups,
  prepareAndLoadPageCompletely,
  extractComponentAttributes
};
