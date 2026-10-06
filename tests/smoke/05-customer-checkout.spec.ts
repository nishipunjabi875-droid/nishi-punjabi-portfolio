import { test, expect } from '../../fixtures/testFixtures';

test.describe('Customer Checkout Journey', () => {
  test('[@smoke @p0 @checkout @customer] Logged-in customer checkout flow up to safe payment checkpoint', async ({
    loginPage,
    searchPage,
    productPage,
    cartPage,
    checkoutPage,
  }) => {
    await loginPage.navigate('/');
    const phone = process.env.TEST_PHONE || '9876543210';
    await loginPage.loginWithMobile(phone);

    await searchPage.performSearch('sofa');
    await searchPage.clickFirstProductCard();

    await productPage.addToCart();
    await cartPage.openCart();
    await cartPage.proceedToCheckout();

    const filled = await checkoutPage.fillShippingForm({
      firstName: 'QA Customer',
      lastName: 'SmokeTest',
      phone,
      email: 'qa_customer_smoke@woodenstreet.com',
      pincode: '302015',
    });
    expect(filled, 'Shipping details form should fill and submit').toBe(true);

    const hasPayment = await checkoutPage.hasPaymentOptionsLoaded();
    expect(hasPayment, 'Payment options / gateway checkpoint must load').toBe(true);

    const safeHalt = await checkoutPage.safeProceedToPaymentGateway();
    expect(safeHalt, 'Test should safely reach payment checkpoint without real transaction').toBe(true);
  });
});
