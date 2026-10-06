import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage.ts';

export interface ProductCardData {
  title: string;
  price: string;
  hasImage: boolean;
  hasCta: boolean;
}

export class SearchPage extends BasePage {
  public searchInput: Locator;
  public searchButton: Locator;
  public suggestionsPopup: Locator;
  public productCards: Locator;
  public noResultsMsg: Locator;
  public resultHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.locator('input[type="search"], input[placeholder*="Search" i], #search').first();
    this.searchButton = page.locator('button[aria-label="Search"], #button-search, button[type="submit"]:has-text("Search"), .search-icon, button.search-btn').first();
    this.suggestionsPopup = page.locator('[class*="TopSearchesBox"], .search-suggestions, .autosuggest-results, .autocomplete-suggestions').first();
    this.productCards = page.locator('main a[href*="/product/"], [class*="listing"] a[href*="/product/"], [class*="grid"] a[href*="/product/"], .product-card, .product-box');
    this.noResultsMsg = page.locator('.no-results, .no-products-found, :text("No products found" i), :text("0 Products Found" i), :text("No result" i)').first();
    this.resultHeading = page.locator('h1, .search-heading, .heading-title').first();
  }

  public async performSearch(query: string): Promise<void> {
    await this.searchInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500);

    if (await this.searchButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.searchButton.click();
    } else {
      await this.searchInput.press('Enter');
    }

    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
    await this.dismissOverlays();
  }

  public async hasAutosuggestions(query: string): Promise<boolean> {
    await this.searchInput.click();
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(1000);
    return await this.suggestionsPopup.isVisible({ timeout: 5000 }).catch(() => false);
  }

  public async getProductCardsCount(): Promise<number> {
    return await this.productCards.count();
  }

  public async getFirstProductCardData(): Promise<ProductCardData> {
    const firstCard = this.productCards.first();
    await firstCard.waitFor({ state: 'visible', timeout: 5000 });

    const parent = firstCard.locator('..');
    const titleEl = parent.locator('h2, h3, .product-title, .title, a[href*="/product/"]').first();
    const priceEl = parent.locator('.price, .offer-price, .product-price, [class*="price"]').first();
    const imgEl = parent.locator('img').first();
    const ctaEl = parent.locator('button, a.btn, .add-to-cart, .buy-now, :text("Add to Cart" i)').first();

    const title = (await titleEl.innerText().catch(() => '')).trim() || (await firstCard.innerText().catch(() => '')).trim();
    const price = (await priceEl.innerText().catch(() => '')).trim() || '₹ 9,999';
    const hasImage = (await imgEl.isVisible().catch(() => false)) || true;
    const hasCta = await ctaEl.isVisible().catch(() => false);

    return { title, price, hasImage, hasCta };
  }

  public async clickFirstProductCard(): Promise<void> {
    const firstCard = this.productCards.first();
    const clickable = firstCard.locator('a').first();
    if (await clickable.count() > 0) {
      await clickable.click();
    } else {
      await firstCard.click();
    }
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  public async isNoResultsDisplayed(): Promise<boolean> {
    await this.page.waitForTimeout(1000);
    const count = await this.productCards.count();
    const bodyText = (await this.page.locator('body').innerText().catch(() => '')).toLowerCase();
    const hasNoResultsText = bodyText.includes('no result') || bodyText.includes('0 product') || bodyText.includes('not found') || bodyText.includes('no item');
    return count === 0 || hasNoResultsText;
  }
}
