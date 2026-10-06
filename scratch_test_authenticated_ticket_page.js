const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
    console.log('Testing Authenticated Ticket Page & Order ID Selection...');

    const authPath = path.resolve(__dirname, 'auth.json');
    let contextOptions = {};
    if (fs.existsSync(authPath)) {
        console.log(`Loading session state from ${authPath}...`);
        contextOptions.storageState = authPath;
    }

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();

    const targetUrl = 'https://www.woodenstreet.com/help-center/tickets?default=create';
    console.log(`Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(4000);

    console.log(`URL: ${page.url()}`);

    const info = await page.evaluate(() => {
        const bodyText = document.body.innerText || '';
        const orderTriggers = Array.from(document.querySelectorAll('*')).filter(el => {
            const txt = (el.textContent || '').trim();
            return (txt.includes('Click to select Order ID') || txt.includes('Select Your Order ID') || txt.includes('Order ID')) && txt.length < 100;
        }).map(el => ({
            tag: el.tagName,
            class: el.className,
            text: el.textContent.trim(),
            outerHTML: el.outerHTML.substring(0, 200)
        }));

        const selects = Array.from(document.querySelectorAll('select')).map(s => ({
            name: s.name,
            optionsCount: s.options.length,
            options: Array.from(s.options).map(o => o.text.trim())
        }));

        const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()).filter(t => t.length > 0);

        return {
            hasNoOrderMsg: bodyText.includes("Can't Create Ticket"),
            bodySnippet: bodyText.substring(0, 800),
            orderTriggers,
            selects,
            buttons
        };
    });

    console.log('\n--- AUTHENTICATED TICKET PAGE INFO ---');
    console.log(`Can't Create Ticket Message present: ${info.hasNoOrderMsg}`);
    console.log(`Body Snippet:\n${info.bodySnippet}\n`);
    console.log(`Select Dropdowns Count: ${info.selects.length}`);
    console.log(`Select Dropdowns:`, JSON.stringify(info.selects, null, 2));
    console.log(`Order Triggers:`, JSON.stringify(info.orderTriggers, null, 2));
    console.log(`Buttons:`, JSON.stringify(info.buttons, null, 2));

    await browser.close();
})();
