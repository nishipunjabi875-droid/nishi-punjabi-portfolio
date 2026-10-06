const { chromium } = require('playwright');
const path = require('path');
const TicketHelper = require('./ticket-automation/utils/ticket-helper');

(async () => {
    console.log('Inspecting Submit Button Attributes & Handlers...');
    const authPath = path.resolve(__dirname, 'auth.json');
    
    const browser = await chromium.launch({ headless: false, slowMo: 300 });
    const context = await browser.newContext({ storageState: authPath });
    const page = await context.newPage();

    await page.goto('https://www.woodenstreet.com/help-center/tickets?default=create', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    await TicketHelper.selectOrderId(page, '1204175');
    const l1Options = await TicketHelper.discoverL1Options(page);
    await TicketHelper.selectL1Option(page, l1Options[0]);

    const l2Options = await TicketHelper.discoverL2Options(page, l1Options[0]);
    await TicketHelper.selectL2Option(page, l2Options[0]);

    const subjectInput = page.getByRole('textbox', { name: 'Enter subject' }).or(page.locator('input[placeholder="Enter subject"]')).first();
    await subjectInput.fill('Test Subject Order Selection QA');

    const descInput = page.getByRole('textbox', { name: 'Describe your issue...' }).or(page.locator('textarea[placeholder="Describe your issue..."]')).first();
    await descInput.fill('Test Description Order Selection QA');

    // Inspect submit button and surrounding form in DOM
    const btnInfo = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Create Ticket');
        if (!btn) return { error: 'Create Ticket button not found' };

        const form = btn.closest('form');
        const parentDiv = btn.parentElement;

        return {
            btnHTML: btn.outerHTML,
            btnClass: btn.className,
            btnType: btn.type,
            formHTML: form ? form.outerHTML.substring(0, 1000) : 'No parent form',
            formOnSubmit: form ? form.getAttribute('onsubmit') : null,
            parentHTML: parentDiv ? parentDiv.outerHTML.substring(0, 500) : null
        };
    });

    console.log('\n--- SUBMIT BUTTON & FORM DOM INFO ---');
    console.log(JSON.stringify(btnInfo, null, 2));

    await browser.close();
})();
