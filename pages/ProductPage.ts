import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage.ts';
import { ValidationHelper } from '../utils/validationHelper';
import { Logger } from '../utils/logger';

export interface PdpDetails {
  title: string;
  price: number;
  mrp: number;
  discountPercent: number;
  isPriceValid: boolean;
  hasMainImage: boolean;
  hasAddToCart: boolean;
  hasBuyNow: boolean;
  hasPincodeChecker: boolean;
  hasWishlistIcon: boolean;
}

export class ProductPage extends BasePage {
  public titleLocator: Locator;
  public priceLocator: Locator;
  public mrpLocator: Locator;
  public discountLocator: Locator;
  public mainImageLocator: Locator;
  public pincodeInput: Locator;
  public pincodeCheckBtn: Locator;
  public pincodeStatusText: Locator;
  public addToCartBtn: Locator;
  public buyNowBtn: Locator;
  public wishlistBtn: Locator;
  public reviewsLocator: Locator;

  constructor(page: Page) {
    super(page);
    this.titleLocator = page.locator('h1, .product-title, .pdp-title, .product-name').first();
    this.priceLocator = page.locator('.offer-price, .price, .product-price, .pdp-price').first();
    this.mrpLocator = page.locator('.mrp-price, .original-price, del, .strike-price').first();
    this.discountLocator = page.locator('.discount, .discount-percent, .pdp-discount').first();
    this.mainImageLocator = page.locator('.product-main-image img, .pdp-image img, #main-image').first();
    this.pincodeInput = page.getByPlaceholder(/enter pincode|pincode|pin/i).or(page.locator('#pincode, input[name="pincode"]')).first();
    this.pincodeCheckBtn = page.getByRole('button', { name: /check|apply/i }).or(page.locator('#pincode-check, .check-btn')).first();
    this.pincodeStatusText = page.locator('.pincode-status, .pincode-response, .delivery-info, .delivery-status').first();
    this.addToCartBtn = page.getByRole('button', { name: /add to cart/i }).or(page.locator('.add-to-cart, #button-cart, .add-cart-btn')).first();
    this.buyNowBtn = page.getByRole('button', { name: /buy now/i }).or(page.locator('.buy-now, #buy-now-btn')).first();
    this.wishlistBtn = page.locator('.wishlist-icon, .add-to-wishlist, button[title*="Wishlist" i], .wishlist').first();
    this.reviewsLocator = page.locator('.ratings, .pdp-rating, .rating-stars, .review-count').first();
  }

  public async getPdpDetails(): Promise<PdpDetails> {
    await this.titleLocator.waitFor({ state: 'visible', timeout: 8000 });

    const title = (await this.titleLocator.innerText().catch(() => '')).trim();
    const rawPrice = await this.priceLocator.innerText().catch(() => '0');
    const rawMrp = await this.mrpLocator.innerText().catch(() => rawPrice);
    const rawDiscount = await this.discountLocator.innerText().catch(() => '0');

    const price = ValidationHelper.parsePrice(rawPrice);
    const mrp = ValidationHelper.parsePrice(rawMrp) || price;
    const discountPercent = ValidationHelper.parsePrice(rawDiscount);

    const isPriceValid = ValidationHelper.isPriceStructureValid(mrp, price, discountPercent);
    const hasMainImage = await this.mainImageLocator.isVisible().catch(() => false);
    const hasAddToCart = await this.addToCartBtn.isVisible().catch(() => false);
    const hasBuyNow = await this.buyNowBtn.isVisible().catch(() => false);
    const hasPincodeChecker = await this.pincodeInput.isVisible().catch(() => false);
    const hasWishlistIcon = await this.wishlistBtn.isVisible().catch(() => false);

    return {
      title,
      price,
      mrp,
      discountPercent,
      isPriceValid,
      hasMainImage,
      hasAddToCart,
      hasBuyNow,
      hasPincodeChecker,
      hasWishlistIcon,
    };
  }

  public async checkPincode(pincode: string): Promise<string> {
    if (await this.pincodeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.pincodeInput.fill(pincode);
      if (await this.pincodeCheckBtn.isVisible().catch(() => false)) {
        await this.pincodeCheckBtn.click();
      } else {
        await this.pincodeInput.press('Enter');
      }
      await this.page.waitForTimeout(1500);
      return (await this.pincodeStatusText.innerText().catch(() => '')).trim();
    }
    return '';
  }

  public async addToCart(): Promise<boolean> {
    if (await this.addToCartBtn.isVisible({ timeout: 3000 })) {
      await this.addToCartBtn.click();
      await this.page.waitForTimeout(2000);
      return true;
    }
    return false;
  }

  public async toggleWishlist(): Promise<boolean> {
    if (await this.wishlistBtn.isVisible({ timeout: 3000 })) {
      await this.wishlistBtn.click();
      await this.page.waitForTimeout(1000);
      return true;
    }
    return false;
  }
}
