import { test, expect } from '../../fixtures/testFixtures';

test.describe('Support Ticket Creation Suite', () => {
  test('[@smoke @p1 @ticket] Create a support ticket and verify form entry', async ({ loginPage, ticketPage }) => {
    await loginPage.navigate('/');
    const phone = process.env.TEST_PHONE || '9876543210';
    await loginPage.loginWithMobile(phone);

    const ticketCreated = await ticketPage.createSupportTicket({
      subject: `QA Auto-Test Ticket - ${Date.now()}`,
      description: 'Automated smoke test ticket description created by Playwright QA framework.',
    });

    expect(ticketCreated, 'Support ticket creation form should be populated and submitted').toBe(true);
  });
});
