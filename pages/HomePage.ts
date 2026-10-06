import { Locator, expect, Page } from '@playwright/test';
import { BasePage } from './BasePage.ts';

export class HomePage extends BasePage {
  public logo: Locator;
  public searchInput: Locator;
  public searchButton: Locator;
  public mainNavLinks: Locator;
  public menuToggle: Locator;
  public cartIcon: Locator;
  public profileIcon: Locator;

  constructor(page: Page) {
    super(page);
    this.logo = page.locator('header img[alt*="Wooden Street" i], .header-logo img, a.logo img, img[alt*="Woodenstreet" i]').first();
    this.searchInput = page.locator('#search, input[name="search"], input[placeholder*="Search" i]').first();
    this.searchButton = page.locator('#button-search, button[type="submit"]:has-text("Search"), .search-icon, button.search-btn').first();
    this.mainNavLinks = page.locator('header a, nav a, .main-menu a, .header-navigation a, .header-links a, a[href*="sofa" i]');
    this.menuToggle = page.locator('.mobile-menu-toggle, .hamburger-menu, button[aria-label="Menu"]').first();
    this.cartIcon = page.locator('a[href*="cart"], .cart-btn, .header-cart').first();
    this.profileIcon = page.locator('a[href*="profile"], a[href*="login"], .profile-icon, a:has-text("Hi ")').first();
  }

  public async isLoaded(): Promise<boolean> {
    const title = await this.getPageTitle();
    const logoVisible = await this.logo.isVisible({ timeout: 5000 }).catch(() => false);
    return title.length > 0 && logoVisible;
  }

  public async openMenu(): Promise<boolean> {
    if (await this.menuToggle.isVisible({ timeout: 2000 })) {
      await this.menuToggle.click();
      await this.page.waitForTimeout(500);
      return true;
    }
    return false;
  }

  public async getNavLinksCount(): Promise<number> {
    return await this.mainNavLinks.count();
  }
}
