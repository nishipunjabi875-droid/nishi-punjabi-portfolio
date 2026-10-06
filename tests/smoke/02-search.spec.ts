import { test, expect } from '../../fixtures/testFixtures';

test.describe('Search Functionality Suite', () => {
  test('[@smoke @p0 @search] Perform valid search and verify product card details', async ({ searchPage }) => {
    await searchPage.navigate('/');
    const searchTerm = process.env.TEST_SEARCH_TERM || 'sofa';

    await searchPage.performSearch(searchTerm);

    const count = await searchPage.getProductCardsCount();
    expect(count, `Search results for [${searchTerm}] should contain product cards`).toBeGreaterThan(0);

    const cardData = await searchPage.getFirstProductCardData();
    expect(cardData.title.length, 'Product card must have title').toBeGreaterThan(0);
    expect(cardData.price.length, 'Product card must have price').toBeGreaterThan(0);
    expect(cardData.hasImage, 'Product card must render image').toBe(true);
  });

  test('[@smoke @p2 @search] Search autosuggestions popup appears while typing', async ({ searchPage }) => {
    await searchPage.navigate('/');
    const hasSuggestions = await searchPage.hasAutosuggestions('bed');
    expect(hasSuggestions, 'Autosuggestions popup should appear when typing keyword').toBe(true);
  });

  test('[@smoke @p2 @search] Non-existent product search displays no-results message', async ({ searchPage }) => {
    await searchPage.navigate('/');
    await searchPage.performSearch('xyz123nonexistentproduct99');

    const isNoResults = await searchPage.isNoResultsDisplayed();
    expect(isNoResults, 'No results message or empty product list must be displayed').toBe(true);
  });
});
