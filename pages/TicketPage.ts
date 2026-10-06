import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage.ts';
import { Logger } from '../utils/logger';

export interface TicketPayload {
  subject: string;
  description: string;
  category?: string;
  subcategory?: string;
}

export class TicketPage extends BasePage {
  public selectOrderTrigger: Locator;
  public firstOrderRadio: Locator;
  public l1CategorySelect: Locator;
  public l2CategorySelect: Locator;
  public subjectInput: Locator;
  public descriptionInput: Locator;
  public createTicketBtn: Locator;
  public viewTicketsTab: Locator;
  public ticketRows: Locator;

  constructor(page: Page) {
    super(page);
    this.selectOrderTrigger = page.locator('input[placeholder*="Click to select Order ID" i], input[placeholder*="Order ID" i], div:has-text("Click to select Order ID" i), div:has-text("Select Your Order ID" i), [class*="order-id-selector"]').first();
    this.firstOrderRadio = page.locator('input[type="checkbox"], input[type="radio"]').first();
    this.l1CategorySelect = page.locator('select').first();
    this.l2CategorySelect = page.locator('select').nth(1);
    this.subjectInput = page.locator('input[placeholder*="subject" i]').first();
    this.descriptionInput = page.locator('textarea[placeholder*="issue" i], textarea[name*="description" i]').first();
    this.createTicketBtn = page.locator('button:has-text("Create Ticket" i), button.style_btn__j7PEz').first();
    this.viewTicketsTab = page.locator('a[href*="default=view"], button:has-text("View Tickets" i)').first();
    this.ticketRows = page.locator('table tr, .style_ticket-row__container');
  }

  public async openCreateTicketPage(): Promise<void> {
    await this.navigate('/help-center/tickets?default=create');
    await this.page.waitForTimeout(1500);
  }

  public async createSupportTicket(data: TicketPayload): Promise<boolean> {
    await this.openCreateTicketPage();

    // Select Order ID if available
    if (await this.selectOrderTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.selectOrderTrigger.click({ force: true }).catch(() => {});
      await this.page.waitForTimeout(800);
      if (await this.firstOrderRadio.isVisible({ timeout: 2500 }).catch(() => false)) {
        await this.firstOrderRadio.check({ force: true }).catch(async () => {
          await this.firstOrderRadio.click({ force: true }).catch(() => {});
        });
        await this.page.waitForTimeout(500);
      }
      const doneBtn = this.page.locator('button:has-text("Done"), button:has-text("Apply"), [aria-label="Close"]').first();
      if (await doneBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await doneBtn.click({ force: true }).catch(() => {});
      }
    }

    // Select L1 category
    if (await this.l1CategorySelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.l1CategorySelect.selectOption({ index: 1 }).catch(() => {});
      await this.page.waitForTimeout(800);
      if (await this.l2CategorySelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        await this.l2CategorySelect.selectOption({ index: 1 }).catch(() => {});
      }
    }

    if (await this.subjectInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.subjectInput.fill(data.subject);
    }
    if (await this.descriptionInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.descriptionInput.fill(data.description);
    }

    if (await this.createTicketBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.createTicketBtn.click();
      await this.page.waitForLoadState('networkidle').catch(() => {});
      return true;
    }

    return false;
  }
}
