import { test, expect } from '../../fixtures/testFixtures';

test.describe('My Account & Order History Suite', () => {
  test('[@smoke @p1] Access customer account profile and orders history tab', async ({ loginPage, accountPage }) => {
    await loginPage.navigate('/');
    const phone = process.env.TEST_PHONE || '9876543210';
    await loginPage.loginWithMobile(phone);

    await accountPage.openAccountPage();
    const loaded = await accountPage.isAccountPageLoaded();
    expect(loaded, 'My Account profile page must load').toBe(true);

    const ordersCount = await accountPage.openMyOrders();
    expect(ordersCount, 'My Orders tab should be accessible').toBeGreaterThanOrEqual(0);
  });
});
