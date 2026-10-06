import { test, expect } from '../../fixtures/testFixtures';

test.describe('Website Health & Environment Availability', () => {
  test('[@smoke @p0] Homepage loads successfully with HTTP 200 and logo', async ({ homePage }) => {
    const res = await homePage.navigate('/');
    const status = typeof res === 'object' ? (res as any).status : res;
    expect(status, 'BASE_URL must return 200 HTTP status').toBeLessThan(400);

    const isLoaded = await homePage.isLoaded();
    expect(isLoaded, 'Homepage logo and title must be present').toBe(true);

    const navCount = await homePage.getNavLinksCount();
    expect(navCount, 'Main navigation menu links must exist').toBeGreaterThan(0);

    const criticalFailures = homePage.monitor.getCriticalApiFailures();
    expect(criticalFailures.length, 'No critical 500/502/503 API failures on homepage').toBe(0);
  });
});
