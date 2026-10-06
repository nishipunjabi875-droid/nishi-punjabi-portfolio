const { chromium } = require('playwright');
const path = require('path');
const TicketHelper = require('./ticket-automation/utils/ticket-helper');

(async () => {
    console.log('Testing REAL Ticket Submission Flow...');
    const authPath = path.resolve(__dirname, 'auth.json');
    
    const browser = await chromium.launch({ headless: false, slowMo: 300 });
    const context = await browser.newContext({ storageState: authPath });
    const page = await context.newPage();

    await page.goto('https://www.woodenstreet.com/help-center/tickets?default=create', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Listen to network requests & responses
    page.on('response', async res => {
        if (res.url().includes('freshdesk') || res.url().includes('ticket') || res.url().includes('api')) {
            console.log(`📡 Network Response [${res.status()}] ${res.url()}`);
            try {
                const text = await res.text();
                console.log(`   Response Body: ${text.substring(0, 500)}`);
            } catch (e) {}
        }
    });

    // 1. Select Order ID
    console.log('Step 1: Selecting Order ID...');
    const selectedOrderId = await TicketHelper.selectOrderId(page, '1098413');
    console.log(`Selected Order ID: ${selectedOrderId}`);

    // 2. Discover L1 options
    const l1Options = await TicketHelper.discoverL1Options(page);
    const l1 = l1Options[0]; // 'Order Status and tracking'
    const l2Options = await TicketHelper.discoverL2Options(page, l1);
    const l2 = l2Options[0];

    // 3. Fill form fields
    console.log('Filling form fields...');
    await TicketHelper.selectL1Option(page, l1);
    await TicketHelper.selectL2Option(page, l2);

    const subject = TicketHelper.generateSubject(l1.label, l2.label);
    const description = TicketHelper.generateDescription(l1.label, l2.label);

    const subjectInput = page.getByRole('textbox', { name: 'Enter subject' }).or(page.locator('input[placeholder="Enter subject"]')).first();
    if (await subjectInput.isVisible().catch(() => false)) await subjectInput.fill(subject);

    const descInput = page.getByRole('textbox', { name: 'Describe your issue...' }).or(page.locator('textarea[placeholder="Describe your issue..."]')).first();
    if (await descInput.isVisible().catch(() => false)) await descInput.fill(description);

    // Check input state before clicking submit button
    const preSubmitState = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input, select, textarea')).map(el => ({
            tag: el.tagName,
            name: el.name,
            id: el.id,
            type: el.type,
            value: el.value,
            disabled: el.disabled
        }));
        return { inputs };
    });

    console.log('\n--- PRE-SUBMIT FORM INPUTS ---');
    console.log(JSON.stringify(preSubmitState.inputs, null, 2));

    // 4. Click Submit CTA
    console.log('\nClicking Create Ticket CTA button...');
    let submitBtn = page.locator('button.style_btn-primary__lUk_R, button[class*="btn-primary"], button[type="submit"]').first();
    if (await submitBtn.isVisible().catch(() => false)) {
        console.log('Clicking primary submit button...');
        await submitBtn.click({ force: true });
        await page.waitForTimeout(6000);
    } else {
        console.log('❌ Submit button not found!');
    }

    // Inspect validation messages or error alerts on page
    const postSubmitState = await page.evaluate(() => {
        const bodyText = document.body.innerText || '';
        const visibleText = (document.body.innerText || '').substring(0, 1500).replace(/\s+/g, ' ');
        return { visibleText };
    });

    console.log('\n--- POST-SUBMIT PAGE TEXT ---');
    console.log(postSubmitState.visibleText);

    await page.waitForTimeout(3000);
    await browser.close();
})();
