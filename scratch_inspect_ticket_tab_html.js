const { chromium } = require('playwright');
const path = require('path');

(async () => {
    console.log('Inspecting exact Ticket Tab content HTML on Help Center page...');
    const authPath = path.resolve(__dirname, 'auth.json');
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ storageState: authPath });
    const page = await context.newPage();

    const targetUrl = 'https://www.woodenstreet.com/help-center/tickets?default=create';
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const ticketSectionHtml = await page.evaluate(() => {
        // Find element containing "Create Ticket" or "Order ID"
        const createTicketBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Create Ticket');
        const container = createTicketBtn ? (createTicketBtn.closest('div.container') || createTicketBtn.parentElement?.parentElement?.parentElement) : document.body;

        return {
            containerHTML: container ? container.outerHTML.substring(0, 4000) : 'Not found',
            allClickableDivs: Array.from(document.querySelectorAll('div, button, span')).filter(el => {
                const txt = (el.textContent || '').trim();
                return (txt.includes('Order ID') || txt.includes('Click to select')) && txt.length < 120;
            }).map(el => ({
                tag: el.tagName,
                class: el.className,
                text: el.textContent.trim(),
                outerHTML: el.outerHTML.substring(0, 200)
            }))
        };
    });

    console.log('=== CLICKABLE ORDER DIVS & BUTTONS ===');
    console.log(JSON.stringify(ticketSectionHtml.allClickableDivs, null, 2));

    console.log('\n=== CONTAINER HTML SNIPPET ===');
    console.log(ticketSectionHtml.containerHTML.substring(0, 1500));

    await browser.close();
})();
