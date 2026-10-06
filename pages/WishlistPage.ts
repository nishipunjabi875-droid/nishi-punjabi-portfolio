import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage.ts';

export class WishlistPage extends BasePage {
  public wishlistIconHeader: Locator;
  public wishlistItems: Locator;
  public removeButtons: Locator;
  public emptyWishlistMsg: Locator;

  constructor(page: Page) {
    super(page);
    this.wishlistIconHeader = page.locator('a[href*="wishlist"], .header-wishlist, .wishlist-count').first();
    this.wishlistItems = page.locator('.wishlist-item, .wishlist-product-card, .wishlist-grid-item');
    this.removeButtons = page.locator('.remove-wishlist, .delete-wishlist, .remove-btn');
    this.emptyWishlistMsg = page.locator('.empty-wishlist, :text("Your wishlist is empty" i)').first();
  }

  public async openWishlist(): Promise<void> {
    if (await this.wishlistIconHeader.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.wishlistIconHeader.click();
    } else {
      await this.navigate('/wishlist');
    }
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  public async getWishlistCount(): Promise<number> {
    await this.page.waitForTimeout(1000);
    return await this.wishlistItems.count();
  }

  public async removeFirstItem(): Promise<boolean> {
    if (await this.removeButtons.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.removeButtons.first().click();
      await this.page.waitForTimeout(1000);
      return true;
    }
    return false;
  }
}
