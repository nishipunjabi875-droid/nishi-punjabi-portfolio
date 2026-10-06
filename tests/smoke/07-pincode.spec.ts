import { test, expect } from '../../fixtures/testFixtures';

test.describe('Pincode Serviceability Suite', () => {
  test('[@smoke @p1] Serviceable and non-serviceable pincode check on PDP', async ({ searchPage, productPage }) => {
    await searchPage.navigate('/');
    await searchPage.performSearch('chair');
    await searchPage.clickFirstProductCard();

    const validStatus = await productPage.checkPincode('302015');
    expect(validStatus.length, 'Valid pincode must yield delivery information').toBeGreaterThan(0);

    const invalidStatus = await productPage.checkPincode('000000');
    expect(invalidStatus.length, 'Non-serviceable/invalid pincode must yield feedback message').toBeGreaterThan(0);
  });
});
