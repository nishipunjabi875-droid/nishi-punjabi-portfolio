import { test, expect } from '../../fixtures/testFixtures';
import { HomePage } from '../../pages/HomePage';
import { SearchPage } from '../../pages/SearchPage';
import { ProductPage } from '../../pages/ProductPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';

test.describe('Guest Checkout Journey (Isolated Session)', () => {
  test('[@smoke @p0 @checkout @guest] Isolated guest context checkout flow', async ({ browser }) => {
    // Fresh browser context creation ensuring NO customer auth cookies leak into guest test
    const context = await browser.newContext();
    const page = await context.newPage();

    const homePage = new HomePage(page);
    const searchPage = new SearchPage(page);
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await homePage.navigate('/');
    await searchPage.performSearch('table');
    await searchPage.clickFirstProductCard();

    await productPage.addToCart();
    await cartPage.openCart();
    await cartPage.proceedToCheckout();

    const filled = await checkoutPage.fillShippingForm({
      firstName: 'Guest',
      lastName: 'User',
      phone: '9876543211',
      email: 'guest_smoke_test@woodenstreet.com',
      pincode: '302015',
    });
    expect(filled, 'Guest shipping details must fill and submit cleanly').toBe(true);

    const hasPayment = await checkoutPage.hasPaymentOptionsLoaded();
    expect(hasPayment, 'Payment section must load for guest checkout').toBe(true);

    await context.close();
  });
});
