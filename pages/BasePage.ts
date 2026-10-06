import { Page, Locator, expect } from '@playwright/test';
import { Logger } from '../utils/logger';
import { NetworkMonitor } from '../utils/networkHelper';

export class BasePage {
  public page: Page;
  public monitor: NetworkMonitor;

  constructor(page: Page) {
    this.page = page;
    this.monitor = new NetworkMonitor(page);
  }

  public async navigate(pathOrUrl: string = '/'): Promise<number> {
    const baseUrl = process.env.BASE_URL || 'https://beta.teamwoodenstreet.com';
    const targetUrl = pathOrUrl.startsWith('http') ? pathOrUrl : `${baseUrl}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;

    Logger.info(`Navigating to: ${targetUrl}`);
    const response = await this.page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const status = response ? response.status() : 0;
    Logger.info(`Page loaded with HTTP status: ${status}`);

    await this.dismissOverlays();
    return status;
  }

  public async dismissOverlays(): Promise<void> {
    try {
      await this.page.keyboard.press('Escape').catch(() => {});

      const closeSelectors = [
        '.close-clone',
        '.close',
        '#close-button',
        '.close-btn',
        'button[aria-label="Close"]',
        '#login-close',
        '[class*="close-btn" i]',
        'button:has-text("✕")',
        'button:has-text("Cancel")'
      ];

      for (const selector of closeSelectors) {
        const btn = this.page.locator(selector).first();
        if (await btn.isVisible({ timeout: 200 }).catch(() => false)) {
          await btn.click({ force: true }).catch(() => {});
          Logger.info(`Dismissed overlay popup using selector: ${selector}`);
          break;
        }
      }
    } catch (e) {
      // Ignore dismiss overlay errors
    }
  }

  public async scrollToBottomAndTop(): Promise<void> {
    try {
      await this.page.evaluate(async () => {
        window.scrollBy(0, 800);
        await new Promise((r) => setTimeout(r, 400));
        window.scrollBy(0, 800);
        await new Promise((r) => setTimeout(r, 400));
        window.scrollTo(0, 0);
      });
    } catch (e) {
      // Ignore
    }
  }

  public async getPageTitle(): Promise<string> {
    return await this.page.title();
  }

  public async captureScreenshot(name: string): Promise<string> {
    const path = `screenshots/${name}_${Date.now()}.png`;
    await this.page.screenshot({ path, fullPage: true });
    return path;
  }
}

export default BasePage;
