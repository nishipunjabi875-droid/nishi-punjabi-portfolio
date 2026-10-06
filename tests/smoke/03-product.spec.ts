import { test, expect } from '../../fixtures/testFixtures';

test.describe('Product Detail Page (PDP) Validation', () => {
  test('[@smoke @p0] Product details, price math, pincode, and CTAs validation', async ({ productPage, searchPage }) => {
    await searchPage.navigate('/');
    await searchPage.performSearch('sofa');
    await searchPage.clickFirstProductCard();

    const details = await productPage.getPdpDetails();
    expect(details.title.length, 'PDP Title must not be empty').toBeGreaterThan(0);
    expect(details.price, 'Selling price must be greater than 0').toBeGreaterThan(0);
    expect(details.isPriceValid, 'Selling price must be less than or equal to MRP').toBe(true);
    expect(details.hasMainImage, 'Main product image must be visible').toBe(true);
    expect(details.hasAddToCart, 'Add to Cart CTA must be visible').toBe(true);
    expect(details.hasBuyNow, 'Buy Now CTA must be visible').toBe(true);

    if (details.hasPincodeChecker) {
      const pincodeStatus = await productPage.checkPincode('302015');
      expect(pincodeStatus.length, 'Pincode check should return delivery status message').toBeGreaterThan(0);
    }
  });
});
