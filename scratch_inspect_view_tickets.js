const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const config = require('./ticket-automation/config/config');

(async () => {
  const authPath = path.resolve(__dirname, 'auth.json');
  const browser = await chromium.launch({ headless: true });
  
  let contextOptions = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  if (fs.existsSync(authPath)) {
    contextOptions.storageState = authPath;
  }

  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  console.log('Navigating to View Tickets page: https://www.woodenstreet.com/help-center/tickets?default=view...');
  await page.goto('https://www.woodenstreet.com/help-center/tickets?default=view', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  console.log('Page URL:', page.url());

  const pageContent = await page.evaluate(() => {
    const table = document.querySelector('table');
    const tableHTML = table ? table.outerHTML : null;

    const ticketsList = Array.from(document.querySelectorAll('[class*="ticket" i], div.border, tr, li'))
      .map(el => (el.innerText || '').trim().replace(/\s+/g, ' '))
      .filter(txt => txt.length > 10 && (txt.includes('TKT') || txt.includes('Order') || txt.includes('Ticket') || txt.includes('#')));

    return {
      tableHTML,
      ticketsList: ticketsList.slice(0, 15),
      bodyTextSnippet: (document.body.innerText || '').substring(0, 1500).replace(/\s+/g, ' ')
    };
  });

  console.log('\n--- VIEW TICKETS PAGE ANALYSIS ---');
  console.log('Table HTML:', pageContent.tableHTML ? pageContent.tableHTML.substring(0, 500) : 'No table element');
  console.log('Ticket elements list:', pageContent.ticketsList);
  console.log('Body Text Snippet:', pageContent.bodyTextSnippet);

  await browser.close();
})();
