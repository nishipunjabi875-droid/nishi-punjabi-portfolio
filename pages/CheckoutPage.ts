import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage.ts';
import { Logger } from '../utils/logger';

export interface ShippingDetails {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export class CheckoutPage extends BasePage {
  public emailInput: Locator;
  public phoneInput: Locator;
  public firstNameInput: Locator;
  public lastNameInput: Locator;
  public addressInput: Locator;
  public cityInput: Locator;
  public stateSelect: Locator;
  public pincodeInput: Locator;
  public continueShippingBtn: Locator;
  public paymentOptionsContainer: Locator;
  public placeOrderBtn: Locator;
  public errorMessages: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('#checkout-email, input[name="email"], input[type="email"]').first();
    this.phoneInput = page.locator('#checkout-phone, input[name="phone"], input[type="tel"]').first();
    this.firstNameInput = page.locator('#first-name, input[name="firstname"], input[placeholder*="First Name" i]').first();
    this.lastNameInput = page.locator('#last-name, input[name="lastname"], input[placeholder*="Last Name" i]').first();
    this.addressInput = page.locator('#address, input[name="address1"], textarea[name*="address" i]').first();
    this.cityInput = page.locator('#city, input[name="city"]').first();
    this.stateSelect = page.locator('#state, select[name="state"], select[name="zone_id"]').first();
    this.pincodeInput = page.locator('#postcode, input[name="postcode"], input[name="pincode"]').first();
    this.continueShippingBtn = page.locator('#button-shipping-address, button:has-text("Continue"), button:has-text("Deliver Here"), .deliver-here').first();
    this.paymentOptionsContainer = page.locator('.payment-method, .payment-options, #payment-methods-wrapper, .payment-selector, :text("Payment Method" i)');
    this.placeOrderBtn = page.locator('button:has-text("Place Order"), button:has-text("Proceed to Pay"), #button-confirm').first();
    this.errorMessages = page.locator('.error-text, .text-danger, .invalid-feedback, .alert-danger');
  }

  public async fillShippingForm(details: ShippingDetails): Promise<boolean> {
    const data = {
      firstName: details.firstName || 'QA',
      lastName: details.lastName || 'Tester',
      email: details.email || 'qa_smoke_test@woodenstreet.com',
      phone: details.phone || '9876543210',
      address: details.address || '123 Automation Lane, Block B',
      city: details.city || 'Jaipur',
      pincode: details.pincode || '302015',
      ...details,
    };

    try {
      if (await this.emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await this.emailInput.fill(data.email);
      }
      if (await this.phoneInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await this.phoneInput.fill(data.phone);
      }
      if (await this.firstNameInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await this.firstNameInput.fill(data.firstName);
      }
      if (await this.lastNameInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await this.lastNameInput.fill(data.lastName);
      }
      if (await this.addressInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await this.addressInput.fill(data.address);
      }
      if (await this.cityInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await this.cityInput.fill(data.city);
      }
      if (await this.pincodeInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await this.pincodeInput.fill(data.pincode);
      }

      if (await this.continueShippingBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await this.continueShippingBtn.click();
        await this.page.waitForTimeout(1500);
        return true;
      }
    } catch (e: any) {
      Logger.warn(`Error filling shipping details: ${e.message}`);
    }
    return false;
  }

  public async hasPaymentOptionsLoaded(): Promise<boolean> {
    try {
      await this.page.waitForSelector('.payment-method, .payment-options, #payment-methods-wrapper, .payment-selector, :text("Payment" i)', { timeout: 8000 });
      return (await this.paymentOptionsContainer.count()) > 0 || (await this.page.innerText('body')).includes('Payment');
    } catch (e) {
      return false;
    }
  }

  public async safeProceedToPaymentGateway(): Promise<boolean> {
    const allowRealPayment = process.env.ALLOW_REAL_PAYMENT === 'true';
    if (!allowRealPayment) {
      Logger.info('ALLOW_REAL_PAYMENT is set to false. Halting test safely at payment checkpoint.');
      return true;
    }

    if (await this.placeOrderBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.placeOrderBtn.click();
      await this.page.waitForTimeout(2000);
      return true;
    }
    return false;
  }

  public async getValidationErrors(): Promise<string[]> {
    const count = await this.errorMessages.count();
    const errors: string[] = [];
    for (let i = 0; i < count; i++) {
      const txt = (await this.errorMessages.nth(i).innerText().catch(() => '')).trim();
      if (txt) errors.push(txt);
    }
    return errors;
  }
}
