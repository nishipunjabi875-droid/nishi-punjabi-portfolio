const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('Launching browser to test real ticket submission...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ storageState: 'auth.json' });
  const page = await context.newPage();

  page.on('request', req => {
    if (req.url().includes('create-ticket') || req.url().includes('freshdesk')) {
      console.log('>>> SUBMIT REQUEST:', req.method(), req.url());
      console.log('>>> REQUEST POST DATA:', req.postData());
    }
  });

  page.on('response', async res => {
    if (res.url().includes('create-ticket') || res.url().includes('freshdesk')) {
      console.log('<<< SUBMIT RESPONSE STATUS:', res.status(), res.url());
      try {
        const json = await res.json();
        console.log('<<< SUBMIT RESPONSE JSON:', JSON.stringify(json, null, 2));
      } catch (e) {
        console.log('<<< COULD NOT PARSE JSON:', e.message);
      }
    }
  });

  console.log('Navigating to Help Center tickets page...');
  await page.goto('https://www.woodenstreet.com/help-center/tickets?default=create', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // 1. Open order selector drawer
  console.log('Opening order drawer...');
  const trigger = page.getByText('Click to select Order ID', { exact: true });
  if (await trigger.isVisible({ timeout: 3000 })) {
    await trigger.click({ force: true });
    await page.waitForTimeout(1000);
  }

  // 2. Select first order in drawer
  await page.evaluate(() => {
    const sidebar = document.querySelector('div.style_sidebar__e3yOK') || document.querySelector('[class*="sidebar"]');
    if (!sidebar) return;
    const cb = sidebar.querySelector('input[type="checkbox"], input[type="radio"]');
    if (cb) {
      cb.scrollIntoView({ block: 'center' });
      cb.checked = true;
      cb.dispatchEvent(new Event('change', { bubbles: true }));
      cb.dispatchEvent(new Event('input', { bubbles: true }));
      cb.click();
    }
  });
  await page.waitForTimeout(1000);

  // Close drawer
  const closeBtn = page.locator('button.style_closeButton__dLuIk').first();
  if (await closeBtn.isVisible().catch(() => false)) {
    await closeBtn.click().catch(() => {});
  } else {
    await page.keyboard.press('Escape');
  }
  await page.waitForTimeout(1000);

  // 3. Select L1 and L2
  console.log('Selecting L1 option...');
  const l1Select = page.locator('select').first();
  const l1Options = await l1Select.locator('option').allInnerTexts();
  console.log('L1 Options available:', l1Options);
  
  await l1Select.selectOption({ index: 1 });
  await l1Select.dispatchEvent('change');
  await page.waitForTimeout(1500);

  console.log('Selecting L2 option...');
  const l2Select = page.locator('select').nth(1);
  const l2Options = await l2Select.locator('option').allInnerTexts();
  console.log('L2 Options available:', l2Options);

  await l2Select.selectOption({ index: 1 });
  await l2Select.dispatchEvent('change');
  await page.waitForTimeout(1500);

  // 4. Fill Subject and Description
  const subjectInput = page.locator('input[placeholder="Enter subject"]').first();
  await subjectInput.fill('Test ticket automation verification ' + Date.now());

  const descInput = page.locator('textarea[placeholder="Describe your issue..."]').first();
  await descInput.fill('This is an automated test ticket created via automation suite verification.');

  await page.waitForTimeout(1000);

  // 5. Locate real submit CTA button inside form
  const submitBtn = page.locator('button.style_btn-primary__lUk_R[type="submit"]').first();
  console.log('Real submit button visible:', await submitBtn.isVisible());
  console.log('Real submit button text:', await submitBtn.textContent());

  console.log('Clicking submit CTA button...');
  await submitBtn.scrollIntoViewIfNeeded();
  await submitBtn.click({ force: true });

  console.log('Waiting 10 seconds for response...');
  await page.waitForTimeout(10000);

  console.log('Current URL after submit attempt:', page.url());

  // Check for any success or error messages on page
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('Page text snapshot (first 500 chars):', bodyText.substring(0, 500).replace(/\s+/g, ' '));

  await browser.close();
})();
