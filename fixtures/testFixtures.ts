import { test as baseTest, expect as baseExpect } from '@playwright/test';
import { HomePage } from '../pages/HomePage.ts';
import { LoginPage } from '../pages/LoginPage.ts';
import { SearchPage } from '../pages/SearchPage.ts';
import { ProductPage } from '../pages/ProductPage.ts';
import { CartPage } from '../pages/CartPage.ts';
import { CheckoutPage } from '../pages/CheckoutPage.ts';
import { WishlistPage } from '../pages/WishlistPage.ts';
import { TicketPage } from '../pages/TicketPage.ts';
import { LeadPage } from '../pages/LeadPage.ts';
import { AccountPage } from '../pages/AccountPage.ts';
import { PaymentPage } from '../pages/PaymentPage.ts';
import { ScreenshotHelper } from '../utils/screenshotHelper';
import { Logger } from '../utils/logger';

export type CustomFixtures = {
  homePage: HomePage;
  loginPage: LoginPage;
  searchPage: SearchPage;
  productPage: ProductPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  wishlistPage: WishlistPage;
  ticketPage: TicketPage;
  leadPage: LeadPage;
  accountPage: AccountPage;
  paymentPage: PaymentPage;
};

export const test = baseTest.extend<CustomFixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  searchPage: async ({ page }, use) => {
    await use(new SearchPage(page));
  },
  productPage: async ({ page }, use) => {
    await use(new ProductPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  wishlistPage: async ({ page }, use) => {
    await use(new WishlistPage(page));
  },
  ticketPage: async ({ page }, use) => {
    await use(new TicketPage(page));
  },
  leadPage: async ({ page }, use) => {
    await use(new LeadPage(page));
  },
  accountPage: async ({ page }, use) => {
    await use(new AccountPage(page));
  },
  paymentPage: async ({ page }, use) => {
    await use(new PaymentPage(page));
  },
});

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    Logger.fail(`Test [${testInfo.title}] failed with status: ${testInfo.status}`);
    const screenshotPath = await ScreenshotHelper.captureOnFailure(page, testInfo.title);
    await testInfo.attach('failure-screenshot', { path: screenshotPath, contentType: 'image/png' });
  } else {
    Logger.pass(`Test [${testInfo.title}] passed successfully`);
  }
});

export const expect = baseExpect;
