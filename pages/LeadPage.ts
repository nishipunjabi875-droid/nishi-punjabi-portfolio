import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage.ts';

export interface LeadFormData {
  fullName: string;
  phone: string;
  email: string;
  pincode?: string;
  city?: string;
  message?: string;
}

export class LeadPage extends BasePage {
  public nameInput: Locator;
  public phoneInput: Locator;
  public emailInput: Locator;
  public pincodeInput: Locator;
  public cityInput: Locator;
  public messageInput: Locator;
  public submitBtn: Locator;
  public successMsg: Locator;

  constructor(page: Page) {
    super(page);
    this.nameInput = page.locator('input[name*="name" i], input[placeholder*="name" i]').first();
    this.phoneInput = page.locator('input[type="tel"], input[name*="mobile" i], input[name*="phone" i], input[placeholder*="mobile" i]').first();
    this.emailInput = page.locator('input[type="email"], input[name*="email" i], input[placeholder*="email" i]').first();
    this.pincodeInput = page.locator('input[name*="pin" i], input[placeholder*="pin" i]').first();
    this.cityInput = page.locator('input[name*="city" i], input[placeholder*="city" i]').first();
    this.messageInput = page.locator('textarea[name*="message" i], textarea[placeholder*="message" i]').first();
    this.submitBtn = page.locator('button[type="submit"], button:has-text("Submit" i), button:has-text("Send" i), button:has-text("Request" i)').first();
    this.successMsg = page.locator('.success-msg, .alert-success, :text("Thank you" i), :text("submitted successfully" i)').first();
  }

  public async fillAndSubmitLead(pathUrl: string, data: LeadFormData): Promise<boolean> {
    await this.navigate(pathUrl);

    if (await this.nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.nameInput.fill(data.fullName);
    }
    if (await this.phoneInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await this.phoneInput.fill(data.phone);
    }
    if (await this.emailInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await this.emailInput.fill(data.email);
    }
    if (await this.pincodeInput.isVisible({ timeout: 1000 }).catch(() => false) && data.pincode) {
      await this.pincodeInput.fill(data.pincode);
    }
    if (await this.cityInput.isVisible({ timeout: 1000 }).catch(() => false) && data.city) {
      await this.cityInput.fill(data.city);
    }
    if (await this.messageInput.isVisible({ timeout: 1000 }).catch(() => false) && data.message) {
      await this.messageInput.fill(data.message);
    }

    if (await this.submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.submitBtn.click();
      await this.page.waitForLoadState('networkidle').catch(() => {});
      return true;
    }
    return false;
  }

  public async isSuccessMessageDisplayed(): Promise<boolean> {
    return await this.successMsg.isVisible({ timeout: 5000 }).catch(() => false);
  }
}
