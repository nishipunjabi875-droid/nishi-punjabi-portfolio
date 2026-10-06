const { chromium } = require('playwright');
const config = require('./ticket-automation/config/config');

(async () => {
    console.log('🔍 Detailed Ticket Creation Page & Order Selection Inspection...');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    const targetUrl = 'https://www.woodenstreet.com/help-center/tickets?default=create';
    console.log(`Navigating to ${targetUrl}...`);

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(4000);

    console.log(`Current Page URL: ${page.url()}`);
    console.log(`Page Title: ${await page.title()}`);

    // Check if login overlay or login screen is active
    const isLoginPrompt = await page.evaluate(() => {
        const bodyText = document.body.innerText || '';
        return bodyText.includes('Sign in') || bodyText.includes('Enter Mobile No.') || bodyText.includes('Login');
    });
    console.log(`Login prompt detected on page: ${isLoginPrompt}`);

    // Extract all interactive elements on ticket creation form
    const formElements = await page.evaluate(() => {
        const selects = Array.from(document.querySelectorAll('select')).map(s => ({
            name: s.name,
            id: s.id,
            class: s.className,
            optionsCount: s.options.length,
            options: Array.from(s.options).map(o => o.text.trim())
        }));

        const inputs = Array.from(document.querySelectorAll('input, textarea')).map(i => ({
            tag: i.tagName.toLowerCase(),
            type: i.type || 'textarea',
            name: i.name,
            id: i.id,
            placeholder: i.placeholder,
            class: i.className
        }));

        const orderCards = Array.from(document.querySelectorAll('[class*="order" i], [class*="ticket" i], div.border, li'))
            .map(el => ({ text: (el.textContent || '').trim().replace(/\s+/g, ' '), class: el.className }))
            .filter(o => o.text.length > 5 && o.text.length < 150 && (o.text.toLowerCase().includes('order') || o.text.includes('120') || o.text.includes('#')));

        return { selects, inputs, orderCards: orderCards.slice(0, 15) };
    });

    console.log('\n--- SELECT DROPDOWNS ON TICKET PAGE ---');
    console.log(JSON.stringify(formElements.selects, null, 2));

    console.log('\n--- INPUT & TEXTAREA FIELDS ON TICKET PAGE ---');
    console.log(JSON.stringify(formElements.inputs, null, 2));

    console.log('\n--- ORDER CARDS / SELECTORS DETECTED ---');
    console.log(JSON.stringify(formElements.orderCards, null, 2));

    await browser.close();
    console.log('\nInspection Complete.');
})();
