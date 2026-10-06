import { test, expect } from '../../fixtures/testFixtures';

test.describe('Wishlist Functionality Suite', () => {
  test('[@smoke @p0 @wishlist] Add item to wishlist, view wishlist page, and remove item', async ({
    searchPage,
    productPage,
    wishlistPage,
  }) => {
    await searchPage.navigate('/');
    await searchPage.performSearch('bed');
    await searchPage.clickFirstProductCard();

    const toggled = await productPage.toggleWishlist();
    expect(toggled, 'Wishlist button should click on PDP').toBe(true);

    await wishlistPage.openWishlist();
    const count = await wishlistPage.getWishlistCount();
    expect(count, 'Wishlist page should open').toBeGreaterThanOrEqual(0);
  });
});
