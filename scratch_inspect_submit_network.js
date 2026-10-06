const { chromium } = require('playwright');
const path = require('path');
const TicketHelper = require('./ticket-automation/utils/ticket-helper');

(async () => {
    console.log('Inspecting all network requests triggered upon form submit...');
    const authPath = path.resolve(__dirname, 'auth.json');
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ storageState: authPath });
    const page = await context.newPage();

    page.on('request', req => {
        if (req.method() === 'POST' || req.url().includes('ticket') || req.url().includes('freshdesk') || req.url().includes('api')) {
            console.log(`🚀 [${req.method()}] ${req.url()}`);
            try {
                console.log(`   Post Data: ${req.postData()}`);
            } catch (e) {}
        }
    });

    page.on('response', async res => {
        if (res.url().includes('ticket') || res.url().includes('freshdesk') || res.url().includes('api')) {
            console.log(`📥 [${res.status()}] ${res.url()}`);
            try {
                const text = await res.text();
                console.log(`   Response Body: ${text.substring(0, 300)}`);
            } catch (e) {}
        }
    });

    await page.goto('https://www.woodenstreet.com/help-center/tickets?default=create', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    await TicketHelper.selectOrderId(page, '1204175');
    const l1Options = await TicketHelper.discoverL1Options(page);
    const l1 = l1Options[0];
    const l2Options = await TicketHelper.discoverL2Options(page, l1);
    const l2 = l2Options[0];

    await TicketHelper.selectL1Option(page, l1);
    await TicketHelper.selectL2Option(page, l2);

    const subjectInput = page.getByRole('textbox', { name: 'Enter subject' }).or(page.locator('input[placeholder="Enter subject"]')).first();
    if (await subjectInput.isVisible().catch(() => false)) await subjectInput.fill('QA Automation Test Ticket Submission');

    const descInput = page.getByRole('textbox', { name: 'Describe your issue...' }).or(page.locator('textarea[placeholder="Describe your issue..."]')).first();
    if (await descInput.isVisible().catch(() => false)) await descInput.fill('This is an automated QA ticket test submission to verify API creation response 200.');

    console.log('\n--- CLICKING SUBMIT BUTTON NOW ---');
    const submitBtn = page.locator('button.style_btn-primary__lUk_R:has-text("Create Ticket")')
        .or(page.locator('button[type="submit"]:has-text("Create Ticket")'))
        .first();

    if (await submitBtn.isVisible().catch(() => false)) {
        await submitBtn.click({ force: true });
        await page.waitForTimeout(6000);
    } else {
        console.log('❌ Submit button not visible');
    }

    await browser.close();
})();
