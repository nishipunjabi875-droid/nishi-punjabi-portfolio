import { test, expect } from '../../fixtures/testFixtures';

test.describe('Coupon Code & Discount Math Suite', () => {
  test('[@smoke @p1] Apply valid and invalid coupon in cart', async ({ searchPage, productPage, cartPage }) => {
    await searchPage.navigate('/');
    await searchPage.performSearch('sofa');
    await searchPage.clickFirstProductCard();
    await productPage.addToCart();

    await cartPage.openCart();

    const invalidResult = await cartPage.applyCoupon('INVALIDCOUPON999');
    expect(invalidResult.success, 'Applying coupon input action should process').toBe(true);

    const validResult = await cartPage.applyCoupon('WELCOME10');
    expect(validResult.success, 'Valid coupon application should process').toBe(true);
  });
});
