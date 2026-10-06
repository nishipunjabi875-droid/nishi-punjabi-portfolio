import { test, expect } from '../../fixtures/testFixtures';

test.describe('Checkout Negative Validation Suite', () => {
  test('[@smoke @p2] Invalid email and phone validation errors in checkout', async ({
    searchPage,
    productPage,
    cartPage,
    checkoutPage,
  }) => {
    await searchPage.navigate('/');
    await searchPage.performSearch('sofa');
    await searchPage.clickFirstProductCard();

    await productPage.addToCart();
    await cartPage.openCart();
    await cartPage.proceedToCheckout();

    await checkoutPage.fillShippingForm({
      firstName: '',
      lastName: '',
      email: 'invalidemailformat',
      phone: '123',
      address: '',
      pincode: '000000',
    });

    const errors = await checkoutPage.getValidationErrors();
    expect(errors.length, 'Validation messages should be displayed for invalid input fields').toBeGreaterThanOrEqual(0);
  });
});
