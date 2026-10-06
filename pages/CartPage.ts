import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage.ts';
import { ValidationHelper } from '../utils/validationHelper';

export interface CartSummaryData {
  itemCount: number;
  subtotal: number;
  discount: number;
  couponDiscount: number;
  deliveryCharges: number;
  grandTotal: number;
  isMathCorrect: boolean;
}

export class CartPage extends BasePage {
  public cartIcon: Locator;
  public cartItems: Locator;
  public removeButtons: Locator;
  public qtyInputs: Locator;
  public emptyCartMsg: Locator;
  public checkoutBtn: Locator;
  public couponInput: Locator;
  public couponApplyBtn: Locator;
  public couponMessage: Locator;
  public grandTotalLocator: Locator;

  constructor(page: Page) {
    super(page);
    this.cartIcon = page.locator('a[href*="cart"], .cart-btn, .header-cart').first();
    this.cartItems = page.locator('.cart-item, .cart-list-item, .cart-product-row, tr.product');
    this.removeButtons = page.locator('.remove-item, .delete-item, .cart-remove, a[href*="remove"], button:has-text("Remove")');
    this.qtyInputs = page.locator('.quantity input, .qty-input, input[name*="quantity"]');
    this.emptyCartMsg = page.locator('.empty-cart, .empty-cart-text, :text("Your cart is empty" i)').first();
    this.checkoutBtn = page.getByRole('button', { name: /checkout|proceed to checkout/i }).or(page.locator('a[href*="checkout"], .checkout-btn')).first();
    this.couponInput = page.getByPlaceholder(/coupon|promo/i).or(page.locator('#coupon, input[name="coupon"]')).first();
    this.couponApplyBtn = page.getByRole('button', { name: /apply/i }).or(page.locator('.apply-coupon-btn, #button-coupon')).first();
    this.couponMessage = page.locator('.coupon-message, .coupon-status, .alert-success, .alert-danger').first();
    this.grandTotalLocator = page.locator('.grand-total, .cart-total, .total-amount, .order-total-price').first();
  }

  public async openCart(): Promise<void> {
    if (await this.cartIcon.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.cartIcon.click();
    } else {
      await this.navigate('/cart');
    }
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  public async getCartCount(): Promise<number> {
    await this.page.waitForTimeout(1000);
    return await this.cartItems.count();
  }

  public async isEmpty(): Promise<boolean> {
    const count = await this.cartItems.count();
    const msgVisible = await this.emptyCartMsg.isVisible({ timeout: 2000 }).catch(() => false);
    return count === 0 || msgVisible;
  }

  public async removeItem(): Promise<boolean> {
    if (await this.removeButtons.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.removeButtons.first().click();
      await this.page.waitForTimeout(1500);
      return true;
    }
    return false;
  }

  public async applyCoupon(code: string): Promise<{ success: boolean; message: string }> {
    if (await this.couponInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.couponInput.fill(code);
      await this.couponApplyBtn.click();
      await this.page.waitForTimeout(1500);
      const message = (await this.couponMessage.innerText().catch(() => '')).trim();
      return { success: true, message: message || 'Coupon action completed' };
    }
    return { success: false, message: 'Coupon input not found' };
  }

  public async getGrandTotal(): Promise<number> {
    const totalText = await this.grandTotalLocator.innerText().catch(() => '0');
    return ValidationHelper.parsePrice(totalText);
  }

  public async proceedToCheckout(): Promise<boolean> {
    if (await this.checkoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.checkoutBtn.click();
      await this.page.waitForLoadState('domcontentloaded').catch(() => {});
      return true;
    }
    return false;
  }
}
