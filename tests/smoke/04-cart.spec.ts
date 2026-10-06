import { test, expect } from '../../fixtures/testFixtures';

test.describe('Cart Operations Suite', () => {
  test('[@smoke @p0 @cart] Add product to cart, check count, remove product, and empty cart', async ({ searchPage, productPage, cartPage }) => {
    await searchPage.navigate('/');
    await searchPage.performSearch('sofa');
    await searchPage.clickFirstProductCard();

    const added = await productPage.addToCart();
    expect(added, 'Product must be added to cart successfully').toBe(true);

    await cartPage.openCart();
    const cartCount = await cartPage.getCartCount();
    expect(cartCount, 'Cart should contain at least 1 item').toBeGreaterThan(0);

    const removed = await cartPage.removeItem();
    expect(removed, 'Product removal from cart should succeed').toBe(true);
  });
});
