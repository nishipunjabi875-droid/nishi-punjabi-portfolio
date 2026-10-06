const { chromium } = require('playwright');
const path = require('path');
const TicketHelper = require('./ticket-automation/utils/ticket-helper');

(async () => {
    console.log('Testing targeting exact bottom submit CTA button...');
    const authPath = path.resolve(__dirname, 'auth.json');
    
    const browser = await chromium.launch({ headless: false, slowMo: 500 });
    const context = await browser.newContext({ storageState: authPath });
    const page = await context.newPage();

    // Listen to network requests for create-ticket API
    page.on('response', async res => {
        if (res.url().includes('create-ticket') || res.url().includes('freshdesk')) {
            console.log(`\n📥 [API RESPONSE ${res.status()}] ${res.url()}`);
            try {
                const text = await res.text();
                console.log(`   API Response Body: ${text}`);
            } catch (e) {}
        }
    });

    await page.goto('https://www.woodenstreet.com/help-center/tickets?default=create', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // 1. Select Order ID
    await TicketHelper.selectOrderId(page, '1204175');

    // 2. Select L1 & L2
    const l1Options = await TicketHelper.discoverL1Options(page);
    await TicketHelper.selectL1Option(page, l1Options[0]);

    const l2Options = await TicketHelper.discoverL2Options(page, l1Options[0]);
    await TicketHelper.selectL2Option(page, l2Options[0]);

    // 3. Fill Subject & Description
    const subject = `QA Real Submission Test - ${Date.now()}`;
    const description = `Testing real ticket creation via bottom submit CTA. Created at ${new Date().toISOString()}`;

    const subjectInput = page.getByRole('textbox', { name: 'Enter subject' }).or(page.locator('input[placeholder="Enter subject"]')).first();
    await subjectInput.fill(subject);

    const descInput = page.getByRole('textbox', { name: 'Describe your issue...' }).or(page.locator('textarea[placeholder="Describe your issue..."]')).first();
    await descInput.fill(description);

    // Inspect all buttons on page
    const buttonsInfo = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button')).map((b, idx) => ({
            index: idx,
            text: b.textContent.trim(),
            class: b.className,
            type: b.type,
            outerHTML: b.outerHTML
        }));
    });

    console.log('\n--- ALL BUTTONS ON PAGE ---');
    console.log(JSON.stringify(buttonsInfo, null, 2));

    // Target bottom submit button specifically
    const bottomSubmitBtn = page.locator('form button[type="submit"], button.style_btn-primary__lUk_R[type="submit"]').last();
    console.log('\nBottom Submit Button Outer HTML:', await bottomSubmitBtn.evaluate(el => el.outerHTML).catch(() => 'Not found'));

    console.log('\nClicking bottom submit button now...');
    await bottomSubmitBtn.scrollIntoViewIfNeeded();
    await bottomSubmitBtn.click({ force: true });

    console.log('Waiting 10s for API response...');
    await page.waitForTimeout(10000);

    await browser.close();
})();
