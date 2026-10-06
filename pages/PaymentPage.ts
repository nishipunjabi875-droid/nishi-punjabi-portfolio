import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage.ts';

export class PaymentPage extends BasePage {
  public paymentHeader: Locator;
  public cardOption: Locator;
  public netbankingOption: Locator;
  public upiOption: Locator;
  public walletOption: Locator;
  public codOption: Locator;
  public razorpayIframe: Locator;

  constructor(page: Page) {
    super(page);
    this.paymentHeader = page.locator('h1, h2, .payment-title, :text("Payment" i)').first();
    this.cardOption = page.locator('.payment-card, input[value*="card" i], :text("Credit / Debit Card" i)').first();
    this.netbankingOption = page.locator('.payment-netbanking, input[value*="netbanking" i], :text("Net Banking" i)').first();
    this.upiOption = page.locator('.payment-upi, input[value*="upi" i], :text("UPI" i)').first();
    this.walletOption = page.locator('.payment-wallet, input[value*="wallet" i], :text("Wallet" i)').first();
    this.codOption = page.locator('.payment-cod, input[value*="cod" i], :text("Cash on Delivery" i)').first();
    this.razorpayIframe = page.locator('iframe[src*="razorpay.com"], iframe.razorpay-checkout-frame').first();
  }

  public async isPaymentPageOrGatewayVisible(): Promise<boolean> {
    const pageText = await this.page.innerText('body').catch(() => '');
    const hasHeader = await this.paymentHeader.isVisible({ timeout: 3000 }).catch(() => false);
    const hasGatewayFrame = await this.razorpayIframe.isVisible({ timeout: 3000 }).catch(() => false);
    const containsPaymentKeywords = pageText.includes('Payment') || pageText.includes('Razorpay') || pageText.includes('Select Payment');

    return hasHeader || hasGatewayFrame || containsPaymentKeywords;
  }
}
