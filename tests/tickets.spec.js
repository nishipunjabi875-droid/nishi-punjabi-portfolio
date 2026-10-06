const { test, expect } = require('@playwright/test');
const TicketHelper = require('../ticket-automation/utils/ticket-helper');

test.describe('WoodenStreet Help Center Tickets Page Tests', () => {

  test('Audit L1/L2 Categories & Create/Verify Ticket', async ({ page }) => {
    test.setTimeout(60000);
    
    console.log('Navigating to WoodenStreet Help Center Ticket Page...');
    await page.goto('https://www.woodenstreet.com/help-center/tickets?default=create', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // 1. Audit L1 & L2 Dropdowns dynamically
    console.log('Auditing L1 & L2 dropdown categories...');
    const l1Options = await TicketHelper.discoverL1Options(page);
    console.log(`✓ Found ${l1Options.length} L1 categories.`);
    expect(l1Options.length).toBeGreaterThan(0);

    const firstL1 = l1Options[0];
    const l2Options = await TicketHelper.discoverL2Options(page, firstL1);
    console.log(`✓ Found ${l2Options.length} L2 sub-categories for L1 "${firstL1.label}".`);
    expect(l2Options.length).toBeGreaterThan(0);

    const firstL2 = l2Options[0];

    // 2. Submit ticket and verify on View Tickets tab
    console.log(`Creating test ticket for [${firstL1.label} -> ${firstL2.label}]...`);
    const res = await TicketHelper.submitTicketAndVerify(page, firstL1.label, firstL2.label, '1204175');

    console.log(`✓ Verification Result: Ticket ID = ${res.ticketId}, Status = ${res.status}`);
    expect(res.success, 'Ticket submission should succeed').toBe(true);
    expect(res.ticketId, 'Ticket ID should be generated and verified').toBeTruthy();
  });

});
