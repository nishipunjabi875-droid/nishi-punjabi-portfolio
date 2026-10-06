const { chromium } = require('playwright');
const path = require('path');

(async () => {
    console.log('Inspecting exact Order Selector container HTML on Help Center page...');
    const authPath = path.resolve(__dirname, 'auth.json');
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ storageState: authPath });
    const page = await context.newPage();

    const targetUrl = 'https://www.woodenstreet.com/help-center/tickets?default=create';
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const formHtml = await page.evaluate(() => {
        const form = document.querySelector('form') || document.querySelector('#tabs-content') || document.body;
        return {
            formOuterHTML: form.outerHTML.substring(0, 3000),
            interactiveEls: Array.from(form.querySelectorAll('*')).filter(el => {
                const text = (el.textContent || '').trim();
                return text.includes('Order') || text.includes('Select') || text.includes('Click');
            }).slice(0, 20).map(el => ({
                tag: el.tagName,
                class: el.className,
                text: el.textContent.trim().substring(0, 80),
                html: el.outerHTML.substring(0, 150)
            }))
        };
    });

    console.log('=== FORM HTML SNIPPET ===');
    console.log(formHtml.formOuterHTML);
    console.log('\n=== INTERACTIVE ELEMENTS ===');
    console.log(JSON.stringify(formHtml.interactiveEls, null, 2));

    await browser.close();
})();
