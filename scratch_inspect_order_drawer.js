const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const config = require('./ticket-automation/config/config');

(async () => {
  const authPath = path.resolve(__dirname, 'auth.json');
  const browser = await chromium.launch({ headless: true });
  
  let contextOptions = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  if (fs.existsSync(authPath)) {
    contextOptions.storageState = authPath;
  }

  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  console.log('Navigating to Ticket Page...');
  await page.goto(config.ticketUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Check initial state of form
  console.log('1. Page loaded. Checking inputs:');
  const initialInputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input, select, textarea, button')).map(el => ({
      tag: el.tagName,
      name: el.name,
      id: el.id,
      placeholder: el.placeholder,
      text: (el.innerText || '').trim(),
      visible: el.offsetParent !== null
    }));
  });
  console.log(JSON.stringify(initialInputs, null, 2));

  // Find trigger to select Order ID
  console.log('\n2. Looking for Order ID selector trigger...');
  const trigger = page.locator('input[placeholder*="Order ID" i], input[placeholder*="Click to select" i], div:has-text("Click to select Order ID"), div:has-text("Select Your Order ID")').first();
  console.log('Trigger visible?:', await trigger.isVisible().catch(() => false));

  if (await trigger.isVisible().catch(() => false)) {
    console.log('Clicking Order ID trigger...');
    await trigger.click({ force: true });
    await page.waitForTimeout(2000);
  } else {
    console.log('Trigger not visible directly. Trying text click...');
    const textTrigger = page.getByText('Click to select Order ID', { exact: false }).first();
    if (await textTrigger.isVisible().catch(() => false)) {
      await textTrigger.click({ force: true });
      await page.waitForTimeout(2000);
    }
  }

  // Check state of drawer / page after trigger click
  console.log('\n3. Checking DOM after trigger click (Drawer opened?):');
  const drawerElements = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('div, li, label'))
      .filter(el => {
        const text = (el.innerText || '');
        return text.includes('Order ID:') || text.includes('1204175');
      })
      .map(el => ({
        tag: el.tagName,
        className: el.className,
        text: el.innerText.substring(0, 100).replace(/\s+/g, ' ')
      }));
    return cards;
  });
  console.log('Cards matching Order ID in drawer:', JSON.stringify(drawerElements.slice(0, 10), null, 2));

  // Try selecting Order ID 1204175 card
  console.log('\n4. Clicking Order ID 1204175 card in drawer...');
  const card = page.locator('div, li, label').filter({ hasText: '1204175' }).first();
  if (await card.isVisible().catch(() => false)) {
    await card.click({ force: true });
    await page.waitForTimeout(1500);
    console.log('Clicked Order 1204175 card!');
  } else {
    console.log('Card with 1204175 not found directly.');
  }

  // Check selects on form after order selection
  console.log('\n5. Select dropdowns after order selection:');
  const selectsAfter = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('select')).map(s => ({
      name: s.name,
      visible: s.offsetParent !== null,
      options: Array.from(s.options).map(o => o.text.trim())
    }));
  });
  console.log(JSON.stringify(selectsAfter, null, 2));

  await browser.close();
})();
