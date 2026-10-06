import { test, expect } from '../../fixtures/testFixtures';

test.describe('Payment Gateway Integration Suite', () => {
  test('[@smoke @p0 @payment] Validate payment gateway options load correctly without transaction', async ({
    searchPage,
    productPage,
    cartPage,
    checkoutPage,
    paymentPage,
  }) => {
    await searchPage.navigate('/');
    await searchPage.performSearch('chair');
    await searchPage.clickFirstProductCard();

    await productPage.addToCart();
    await cartPage.openCart();
    await cartPage.proceedToCheckout();

    await checkoutPage.fillShippingForm({
      firstName: 'Payment',
      lastName: 'Check',
      phone: '9876543210',
      email: 'payment_smoke_test@woodenstreet.com',
      pincode: '302015',
    });

    const isPaymentVisible = await paymentPage.isPaymentPageOrGatewayVisible();
    expect(isPaymentVisible, 'Payment options or Razorpay iframe must load').toBe(true);
  });
});
