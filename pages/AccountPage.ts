import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage.ts';

export class AccountPage extends BasePage {
  public profileHeader: Locator;
  public ordersTab: Locator;
  public addressesTab: Locator;
  public orderItems: Locator;
  public logoutBtn: Locator;

  constructor(page: Page) {
    super(page);
    this.profileHeader = page.locator('h1:has-text("Profile" i), .profile-title, .user-name, :text("My Account" i)').first();
    this.ordersTab = page.locator('a[href*="order"], button:has-text("My Orders" i)').first();
    this.addressesTab = page.locator('a[href*="address"], button:has-text("Addresses" i)').first();
    this.orderItems = page.locator('.order-card, .order-item, tr.order-row');
    this.logoutBtn = page.locator('a[href*="logout"], button:has-text("Logout" i)').first();
  }

  public async openAccountPage(): Promise<void> {
    await this.navigate('/profile');
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  public async isAccountPageLoaded(): Promise<boolean> {
    return await this.profileHeader.isVisible({ timeout: 5000 }).catch(() => false);
  }

  public async openMyOrders(): Promise<number> {
    if (await this.ordersTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.ordersTab.click();
      await this.page.waitForTimeout(1000);
    }
    return await this.orderItems.count();
  }
}
