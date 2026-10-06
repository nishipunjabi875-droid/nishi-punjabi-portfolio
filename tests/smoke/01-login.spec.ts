import { test, expect } from '../../fixtures/testFixtures';

test.describe('Customer Login & Authentication Flow', () => {
  test('[@smoke @p0 @login] Customer login with mobile and OTP verification', async ({ loginPage, page }) => {
    await loginPage.navigate('/');
    const phone = process.env.TEST_PHONE || '7976191632';

    const loginSubmitted = await loginPage.loginWithMobile(phone);
    expect(loginSubmitted, 'Mobile and OTP fields must be submitted successfully').toBe(true);

    const loggedIn = await loginPage.isLoggedIn();
    expect(loggedIn, 'User should be authenticated and logged-in state visible').toBe(true);

    // Verify session cookie created
    const cookies = await page.context().cookies();
    expect(cookies.length, 'Browser cookies must be populated after login').toBeGreaterThan(0);

    // Verify Logout
    const loggedOut = await loginPage.logout();
    expect(loggedOut, 'Customer should logout cleanly').toBe(true);
  });

  test('[@smoke @p2 @login] Invalid OTP handling displays proper error message', async ({ loginPage }) => {
    await loginPage.navigate('/');
    const phone = process.env.TEST_PHONE || '7976191632';

    const errorMsg = await loginPage.submitInvalidOTP(phone, '000000');
    expect(errorMsg.length, 'Validation message should appear for invalid OTP').toBeGreaterThan(0);
  });
});
