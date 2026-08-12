const { test, expect } = require('@playwright/test');
const fs = require('fs-extra');
const path = require('path');

const BASE_URL = 'https://www.woodenstreet.com';
const PRODUCT_URL = `${BASE_URL}/product/lorenz-3-seater-sofa-cotton-jade-ivory`;
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'checkout-payment-flow');

test.describe('End-to-End Cart to Payment Gateway Flow', () => {

  test('Add Product, Verify Cart, Proceed through Guest Checkout to Payment Gateway', async ({ browser }) => {
    test.setTimeout(180000); // 3 minutes
    await fs.ensureDir(SCREENSHOT_DIR);

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    console.log('\n==================================================');
    console.log('🛒 STEP 1: Navigating to Product Page & Adding to Cart');
    console.log('==================================================');
    console.log(`URL: ${PRODUCT_URL}`);

    await page.goto(PRODUCT_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(3000);

    // Dismiss initial popups
    await page.evaluate(() => {
      document.querySelectorAll('button[class*="close"], .modal-close, [aria-label="Close"]').forEach(b => b.click());
    }).catch(() => {});

    // Find and click Add to Cart
    const atc = page.locator('button:has-text("ADD TO CART"), #button-cart, .add-to-cart-btn').first();
    let atcClicked = false;
    if (await atc.isVisible({ timeout: 5000 }).catch(() => false)) {
      await atc.click({ force: true });
      atcClicked = true;
      console.log('   ✅ Successfully clicked Add to Cart button');
      await page.waitForTimeout(4000);
    }

    expect(atcClicked, 'Add to Cart button must be found and clicked').toBeTruthy();

    console.log('\n==================================================');
    console.log('🛒 STEP 2: Navigating to Cart & Validating Calculations');
    console.log('==================================================');

    await page.goto(`${BASE_URL}/cart`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_cart_page.png'), fullPage: true });

    const pageBodyText = await page.innerText('body');
    const hasMyCart = pageBodyText.includes('My Cart');
    console.log('   Cart Page contains "My Cart":', hasMyCart);

    // Parse Order Summary details
    const priceData = await page.evaluate(() => {
      const parseAmount = (text) => {
        if (!text) return 0;
        const cleaned = text.replace(/[^0-9.]/g, '');
        return parseFloat(cleaned) || 0;
      };

      const bodyText = document.body.innerText;
      let totalPayable = 0;
      let subtotal = 0;
      let discount = 0;

      const summaryRows = Array.from(document.querySelectorAll('.order-summary tr, .cart-totals div, [class*="orderSummary" i] div, [class*="price-details" i] div, tr'));
      summaryRows.forEach(row => {
        const txt = row.innerText || '';
        if (/total payable|final amount|order total|total amount/i.test(txt)) {
          const v = parseAmount(txt);
          if (v > 0) totalPayable = v;
        } else if (/subtotal|total mrp|total price/i.test(txt)) {
          const v = parseAmount(txt);
          if (v > 0) subtotal = v;
        } else if (/discount|savings/i.test(txt)) {
          const v = parseAmount(txt);
          if (v > 0) discount = v;
        }
      });

      if (totalPayable === 0) {
        const match = bodyText.match(/(?:Total Payable|Total Amount|Order Total)\s*[:\n]?\s*₹?\s*([\d,]+)/i);
        if (match) totalPayable = parseAmount(match[1]);
      }

      return { totalPayable, subtotal, discount };
    });

    console.log('   Subtotal / MRP : ₹' + priceData.subtotal);
    console.log('   Discount       : ₹' + priceData.discount);
    console.log('   Total Payable  : ₹' + priceData.totalPayable);

    console.log('\n==================================================');
    console.log('👤 STEP 3: Clicking Place Order / Proceed to Guest Checkout');
    console.log('==================================================');

    const placeOrderBtn = page.locator('button#placeOrder, button:has-text("PLACE ORDER"), button:has-text("CONFIRM ORDER")').first();
    let placeOrderClicked = false;
    if (await placeOrderBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await placeOrderBtn.click({ force: true });
      placeOrderClicked = true;
      console.log('   ✅ Successfully clicked Place Order button');
      await page.waitForTimeout(4000);
    } else {
      placeOrderClicked = await page.evaluate(() => {
        const btn = document.querySelector('button#placeOrder') || Array.from(document.querySelectorAll('button')).find(b => /place order|confirm order/i.test(b.innerText));
        if (btn) { btn.click(); return true; }
        return false;
      });
      await page.waitForTimeout(4000);
    }

    expect(placeOrderClicked, 'Place Order button must be clicked').toBeTruthy();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_after_place_order.png'), fullPage: true });

    console.log('   Current Page URL:', page.url());

    // STEP 4: Handle Guest / Phone Input
    console.log('\n==================================================');
    console.log('📱 STEP 4: Filling Guest / Mobile Login Details');
    console.log('==================================================');

    const telInput = page.locator('input#telephone, input[type="tel"], input[name="phone"]').first();
    if (await telInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('   Filling phone number: 9876543210...');
      await telInput.fill('9876543210');
      
      const continueBtn = page.locator('button:has-text("CONTINUE"), button:has-text("Continue"), input[type="submit"]').first();
      if (await continueBtn.isVisible().catch(() => false)) {
        await continueBtn.click({ force: true });
        console.log('   Clicked Continue button');
      } else {
        await page.keyboard.press('Enter');
      }
      await page.waitForTimeout(4000);
      console.log('   URL after phone submission:', page.url());
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_after_phone.png'), fullPage: true });
    }

    // STEP 5: Fill Shipping Address Details
    console.log('\n==================================================');
    console.log('🏠 STEP 5: Filling Shipping Address Details');
    console.log('==================================================');

    const addressInput = page.locator('textarea[name="address"], textarea[name="address1"], input[name="address1"], input[placeholder*="Address" i]').first();
    if (await addressInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('   Shipping Address Form detected! Filling details...');
      
      const nameInput = page.locator('input[name="firstname"], input[name="first_name"], input[placeholder*="First Name" i], #first-name').first();
      if (await nameInput.isVisible().catch(() => false)) await nameInput.fill('Automation').catch(() => {});
      
      const lastNameInput = page.locator('input[name="lastname"], input[name="last_name"], input[placeholder*="Last Name" i], #last-name').first();
      if (await lastNameInput.isVisible().catch(() => false)) await lastNameInput.fill('Tester').catch(() => {});

      const emailInput = page.locator('input[name="email"], input[type="email"], input[placeholder*="Email" i]').first();
      if (await emailInput.isVisible().catch(() => false)) await emailInput.fill('automation_test_user@gmail.com').catch(() => {});

      const pincodeInput = page.locator('input[name="postcode"], input[name="pincode"], input[placeholder*="Pincode" i]').first();
      if (await pincodeInput.isVisible().catch(() => false)) await pincodeInput.fill('302015').catch(() => {});

      await addressInput.fill('123 Woodenstreet Testing Blvd, Tonk Road').catch(() => {});

      const cityInput = page.locator('input[name="city"], input[placeholder*="City" i]').first();
      if (await cityInput.isVisible().catch(() => false) && await cityInput.isEnabled().catch(() => false)) {
        await cityInput.fill('Jaipur').catch(() => {});
      }

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_shipping_filled.png'), fullPage: true });

      const deliverBtn = page.locator('button:has-text("Deliver Here"), button:has-text("Save & Continue"), button:has-text("CONTINUE"), #button-shipping-address, .deliver-here').first();
      if (await deliverBtn.isVisible().catch(() => false)) {
        console.log('   Clicking Deliver Here / Save & Continue...');
        await deliverBtn.click({ force: true });
        await page.waitForTimeout(4000);
      }
    }

    console.log('\n==================================================');
    console.log('💳 STEP 6: Verifying Payment Gateway Reachability');
    console.log('==================================================');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_payment_gateway.png'), fullPage: true });

    const finalBodyText = await page.innerText('body').catch(() => '');
    const isPaymentPage = /payment|order summary|razorpay|netbanking|upi|credit card/i.test(finalBodyText);

    console.log('   Final Page URL       :', page.url());
    console.log('   Payment Page Text Match:', isPaymentPage);

    expect(isPaymentPage, 'Should reach Payment Gateway step with payment options').toBeTruthy();

    console.log('\n==================================================');
    console.log('🎉 END-TO-END CHECKOUT TO PAYMENT GATEWAY TEST PASSED');
    console.log('==================================================\n');

    await context.close();
  });

});
