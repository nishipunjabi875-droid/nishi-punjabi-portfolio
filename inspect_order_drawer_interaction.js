const { chromium } = require('playwright');
const config = require('./ticket-automation/config/config');

(async () => {
    console.log('🚀 Debugging Order Selection Drawer & Form State...');

    const browser = await chromium.launch({ headless: false, slowMo: 500 });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log(`1. Navigating to ${config.baseUrl}...`);
    await page.goto(config.baseUrl, { waitUntil: 'domcontentloaded' });

    // Perform Login
    console.log('2. Logging in...');
    const profileBtn = page.locator('span:has-text("Profile"), p:has-text("Profile")').first();
    if (await profileBtn.isVisible().catch(() => false)) await profileBtn.hover().catch(() => {});

    const signinBtn = page.locator('span.style_signinbtn__RI5rE, span:has-text("Sign in"), button:has-text("Sign in"), a:has-text("Sign in")').first();
    if (await signinBtn.isVisible().catch(() => false)) await signinBtn.click({ force: true }).catch(() => {});

    const phoneInput = page.locator('input[placeholder*="Enter Mobile No." i], #login-mobile, input[name="mobile"]').first();
    if (await phoneInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await phoneInput.fill(config.testPhone);
        const continueBtn = page.locator('button:has-text("CONTINUE"), button#login-submit').first();
        await continueBtn.click({ force: true });
        console.log(`📱 OTP SENT TO ${config.testPhone}. Waiting 30s for manual OTP entry in browser...`);
        await page.waitForTimeout(30000);
    }

    console.log('3. Navigating to Ticket Creation Page...');
    await page.goto(config.ticketUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Function to inspect all input values and state
    const inspectFormState = async (stepName) => {
        const state = await page.evaluate(() => {
            const inputs = Array.from(document.querySelectorAll('input, select, textarea')).map(el => ({
                tag: el.tagName,
                name: el.name,
                id: el.id,
                type: el.type,
                value: el.value,
                checked: el.checked
            }));
            const triggerText = document.querySelector('div[class*="font-pangramregular"]')?.textContent || 'Not found';
            return { triggerText, inputs };
        });
        console.log(`\n--- FORM STATE AT: ${stepName} ---`);
        console.log(`Trigger Div Text: "${state.triggerText}"`);
        console.log(`Form Inputs:`, state.inputs);
    };

    await inspectFormState('Initial Load');

    // Step A: Open Drawer
    console.log('\n--- Step A: Clicking Order ID Trigger Div ---');
    const orderTrigger = page.locator('div.font-pangramregular:has-text("Click to select Order ID"), div:has-text("Click to select Order ID")').first();
    if (await orderTrigger.isVisible()) {
        await orderTrigger.click({ force: true });
        await page.waitForTimeout(1500);
    }

    await inspectFormState('After Opening Drawer');

    // Step B: Inspect Drawer DOM
    const drawerInfo = await page.evaluate(() => {
        const drawer = document.querySelector('div.border.rounded-lg.p-3') || document.body;
        const checkboxes = Array.from(drawer.querySelectorAll('input[type="checkbox"], input[type="radio"]')).map(cb => ({
            name: cb.name,
            id: cb.id,
            checked: cb.checked,
            value: cb.value
        }));
        const buttons = Array.from(drawer.querySelectorAll('button')).map(b => b.textContent.trim());
        return { checkboxes, buttons };
    });
    console.log('Drawer Contents:', drawerInfo);

    // Step C: Click Order Card Container vs Checkbox
    console.log('\n--- Step C: Clicking Checkbox directly ---');
    const cb = page.locator('input[type="checkbox"]').first();
    if (await cb.isVisible()) {
        console.log('Checkbox is visible. Checking it...');
        await cb.check({ force: true });
        await page.waitForTimeout(1000);
    }

    await inspectFormState('After Checking Checkbox');

    // Step D: Look for Done / Submit / Close Button in Drawer
    const doneBtn = page.locator('button:has-text("Done"), button:has-text("Apply"), button:has-text("Confirm"), button:has-text("Submit"), button:has-text("Select")').first();
    if (await doneBtn.isVisible().catch(() => false)) {
        console.log(`Clicking Drawer Action Button: "${await doneBtn.textContent()}"...`);
        await doneBtn.click({ force: true });
        await page.waitForTimeout(1000);
    }

    await inspectFormState('After Closing Drawer');

    await browser.close();
})();
