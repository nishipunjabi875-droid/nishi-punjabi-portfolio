import { Page, Request, Response } from '@playwright/test';
import { Logger } from './logger';

export interface ApiLogEntry {
  url: string;
  method: string;
  status: number;
  responseTimeMs: number;
  pageUrl: string;
  isCritical: boolean;
}

export interface NetworkErrorEntry {
  url: string;
  status?: number;
  resourceType: string;
  errorText?: string;
  pageUrl: string;
}

export interface ConsoleErrorEntry {
  type: string;
  text: string;
  url: string;
  location?: string;
}

export class NetworkMonitor {
  private page: Page;
  public apiLogs: ApiLogEntry[] = [];
  public networkErrors: NetworkErrorEntry[] = [];
  public consoleErrors: ConsoleErrorEntry[] = [];

  public criticalApiPatterns: string[] = [
    'login', 'search', 'product', 'cart', 'checkout',
    'pincode', 'coupon', 'wishlist', 'lead', 'ticket', 'payment'
  ];

  public ignoredConsoleErrors: RegExp[] = [
    /ResizeObserver loop/i,
    /Third-party cookie/i,
    /favicon\.ico/i,
    /facebook/i,
    /google-analytics/i,
    /googletagmanager/i
  ];

  public ignoredNetworkErrors: RegExp[] = [
    /google-analytics\.com/i,
    /facebook\.net/i,
    /doubleclick\.net/i,
    /clarity\.ms/i
  ];

  constructor(page: Page) {
    this.page = page;
    this.attachListeners();
  }

  private attachListeners(): void {
    // 1. Console Errors & Exceptions
    this.page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        const isIgnored = this.ignoredConsoleErrors.some((pattern) => pattern.test(text));
        if (!isIgnored) {
          this.consoleErrors.push({
            type,
            text,
            url: this.page.url(),
            location: `${msg.location().url || ''}:${msg.location().lineNumber || 0}`
          });
        }
      }
    });

    this.page.on('pageerror', (err) => {
      this.consoleErrors.push({
        type: 'exception',
        text: err.message,
        url: this.page.url()
      });
    });

    // 2. Request Failures
    this.page.on('requestfailed', (req: Request) => {
      const url = req.url();
      const isIgnored = this.ignoredNetworkErrors.some((pattern) => pattern.test(url));
      if (!isIgnored) {
        this.networkErrors.push({
          url,
          resourceType: req.resourceType(),
          errorText: req.failure()?.errorText || 'Failed to fetch',
          pageUrl: this.page.url()
        });
      }
    });

    // 3. Responses & Critical API Monitoring
    this.page.on('response', (res: Response) => {
      const req = res.request();
      const url = res.url();
      const status = res.status();
      const resourceType = req.resourceType();

      const isCritical = this.criticalApiPatterns.some((pattern) => url.toLowerCase().includes(pattern));
      const timing = req.timing();
      const latency = timing ? Math.max(0, timing.responseEnd - timing.requestStart) : 0;

      if (resourceType === 'xhr' || resourceType === 'fetch' || isCritical) {
        this.apiLogs.push({
          url,
          method: req.method(),
          status,
          responseTimeMs: latency,
          pageUrl: this.page.url(),
          isCritical
        });
      }

      if (status >= 500) {
        Logger.fail(`CRITICAL API SERVER ERROR: HTTP ${status} on [${url}]`);
        this.networkErrors.push({
          url,
          status,
          resourceType,
          errorText: `HTTP ${status} Server Error`,
          pageUrl: this.page.url()
        });
      }
    });
  }

  public getCriticalApiFailures(): ApiLogEntry[] {
    return this.apiLogs.filter((log) => log.isCritical && log.status >= 500);
  }

  public classifyFailure(error: Error | string): string {
    const message = typeof error === 'string' ? error : error.message;

    if (message.includes('ENVIRONMENT_FAILURE') || message.includes('net::ERR_NAME_NOT_RESOLVED') || message.includes('ECONNREFUSED')) {
      return 'ENVIRONMENT_FAILURE';
    }
    if (this.getCriticalApiFailures().length > 0 || message.includes('500') || message.includes('502') || message.includes('503')) {
      return 'API_FAILURE';
    }
    if (message.includes('OTP') || message.includes('login') || message.includes('auth')) {
      return 'AUTH_FAILURE';
    }
    if (message.includes('Timeout') || message.includes('exceeded')) {
      return 'TIMEOUT';
    }
    if (message.includes('expect(')) {
      return 'ASSERTION_FAILURE';
    }
    if (message.includes('net::ERR_') || message.includes('Failed to fetch')) {
      return 'NETWORK_FAILURE';
    }
    if (message.includes('data') || message.includes('JSON')) {
      return 'DATA_FAILURE';
    }
    if (message.includes('locator') || message.includes('not visible') || message.includes('element')) {
      return 'UI_FAILURE';
    }

    return 'UNKNOWN';
  }
}
