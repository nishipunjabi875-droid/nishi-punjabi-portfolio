import { test, expect } from '../../fixtures/testFixtures';

const leadPages = [
  { label: 'Contact Us', url: '/contact' },
  { label: 'Customer Support', url: '/support' },
  { label: 'Franchise Opportunities', url: '/franchise-opportunities' },
];

test.describe('Lead Form Data-Driven Automation', () => {
  for (const item of leadPages) {
    test(`[@smoke @p1 @lead] Submit lead form on [${item.label}]`, async ({ leadPage }) => {
      const submitted = await leadPage.fillAndSubmitLead(item.url, {
        fullName: 'QA Lead Tester',
        phone: '9876543210',
        email: 'lead_smoke_test@woodenstreet.com',
        pincode: '302015',
        city: 'Jaipur',
        message: 'Automated smoke test inquiry.',
      });

      expect(submitted, `Lead form on [${item.label}] must be submitted`).toBe(true);
    });
  }
});
