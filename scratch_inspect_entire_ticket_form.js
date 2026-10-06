const { chromium } = require('playwright');
const path = require('path');

(async () => {
    console.log('Inspecting entire Ticket Form inputs & controls...');
    const authPath = path.resolve(__dirname, 'auth.json');
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ storageState: authPath });
    const page = await context.newPage();

    const targetUrl = 'https://www.woodenstreet.com/help-center/tickets?default=create';
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const formDetails = await page.evaluate(() => {
        // Find form under Create Ticket tab
        const createTicketBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Create Ticket');
        const card = createTicketBtn ? (createTicketBtn.closest('div.flex-col') || document.body) : document.body;
        
        const labelsAndControls = Array.from(card.querySelectorAll('label, div[class*="font-pangram"]')).map(el => ({
            tag: el.tagName,
            text: el.textContent.trim(),
            html: el.outerHTML.substring(0, 150)
        }));

        const inputs = Array.from(card.querySelectorAll('input, select, textarea, button')).map(el => ({
            tag: el.tagName,
            type: el.type || '',
            name: el.name || '',
            id: el.id || '',
            placeholder: el.placeholder || '',
            text: el.textContent.trim().substring(0, 50),
            outerHTML: el.outerHTML.substring(0, 150)
        }));

        return { labelsAndControls: labelsAndControls.slice(0, 20), inputs };
    });

    console.log('=== FORM CONTROLS & INPUTS ===');
    console.log(JSON.stringify(formDetails.inputs, null, 2));

    await browser.close();
})();
