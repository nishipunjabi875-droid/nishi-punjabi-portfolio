const { chromium } = require('playwright');
const path = require('path');
const TicketHelper = require('./ticket-automation/utils/ticket-helper');

(async () => {
    console.log('🔍 Deep Debugging Real Ticket Submission API & UI Response...');
    const authPath = path.resolve(__dirname, 'auth.json');
    
    const browser = await chromium.launch({ headless: false, slowMo: 300 });
    const context = await browser.newContext({ storageState: authPath });
    const page = await context.newPage();

    page.on('console', msg => console.log(`[Browser Console ${msg.type()}]: ${msg.text()}`));

    page.on('request', req => {
        if (req.method() === 'POST' || req.url().includes('create-ticket') || req.url().includes('freshdesk')) {
            console.log(`\n🚀 [REQUEST ${req.method()}] ${req.url()}`);
            console.log(`   Headers: ${JSON.stringify(req.headers())}`);
            console.log(`   Post Payload: ${req.postData()}`);
        }
    });

    page.on('response', async res => {
        if (res.url().includes('create-ticket') || res.url().includes('freshdesk') || res.url().includes('ticket')) {
            console.log(`\n📥 [RESPONSE ${res.status()}] ${res.url()}`);
            try {
                const body = await res.text();
                console.log(`   Body: ${body}`);
            } catch (e) {
                console.log(`   Could not read body: ${e.message}`);
            }
        }
    });

    await page.goto('https://www.woodenstreet.com/help-center/tickets?default=create', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // 1. Select Order ID
    console.log('\n1. Selecting Order ID...');
    const selectedOrder = await TicketHelper.selectOrderId(page, '1204175');
    console.log(`Selected Order: ${selectedOrder}`);

    // 2. Discover & Select L1/L2
    console.log('\n2. Selecting L1 & L2 options...');
    const l1Options = await TicketHelper.discoverL1Options(page);
    const l1 = l1Options[0]; // 'Order Status and tracking'
    await TicketHelper.selectL1Option(page, l1);

    const l2Options = await TicketHelper.discoverL2Options(page, l1);
    const l2 = l2Options[0]; // 'Order Track'
    await TicketHelper.selectL2Option(page, l2);

    // 3. Fill Subject & Description
    console.log('\n3. Filling Subject & Description...');
    const subject = `QA Real Submission Test - ${Date.now()}`;
    const description = `This is a test ticket creation to verify real Freshdesk API creation and database entry. Created at ${new Date().toISOString()}`;

    const subjectInput = page.getByRole('textbox', { name: 'Enter subject' }).or(page.locator('input[placeholder="Enter subject"]')).first();
    await subjectInput.fill(subject);

    const descInput = page.getByRole('textbox', { name: 'Describe your issue...' }).or(page.locator('textarea[placeholder="Describe your issue..."]')).first();
    await descInput.fill(description);

    // Upload attachment if possible
    await TicketHelper.uploadAttachment(page);

    await page.waitForTimeout(1000);

    // Inspect form element state right before click
    const preClick = await page.evaluate(() => {
        const form = document.querySelector('form') || document.body;
        const inputs = Array.from(document.querySelectorAll('input, select, textarea')).map(i => ({
            name: i.name,
            id: i.id,
            type: i.type,
            value: i.value,
            disabled: i.disabled
        }));
        return { inputs };
    });

    console.log('\n--- PRE-CLICK INPUT VALUES ---');
    console.log(JSON.stringify(preClick.inputs, null, 2));

    // 4. Click Submit Button
    console.log('\n4. Clicking Create Ticket button...');
    const submitBtn = page.locator('button.style_btn-primary__lUk_R:has-text("Create Ticket")')
        .or(page.locator('button[type="submit"]:has-text("Create Ticket")'))
        .first();

    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click({ force: true });

    console.log('Waiting 10s for API and page response...');
    await page.waitForTimeout(10000);

    // Check after submit DOM state & toast messages
    const postClick = await page.evaluate(() => {
        const toasts = Array.from(document.querySelectorAll('.Toastify, [class*="toast" i], [class*="alert" i], [class*="notification" i], [class*="error" i], [class*="success" i]')).map(t => t.textContent.trim());
        const bodyText = (document.body.innerText || '').substring(0, 1500).replace(/\s+/g, ' ');
        return { toasts, bodyText };
    });

    console.log('\n--- POST-SUBMIT DOM STATE ---');
    console.log('Toasts/Notifications:', postClick.toasts);
    console.log('Page Visible Text:', postClick.bodyText);

    await page.waitForTimeout(3000);
    await browser.close();
})();
