# WoodenStreet Daily Smoke Testing Automation Framework

A production-ready **Daily Smoke Testing Automation Framework** built with **Playwright**, **TypeScript**, **Page Object Model (POM)**, **Custom Fixtures**, **Data-Driven Testing**, **Network Error Monitoring**, **Excel Report Generation**, and an **Interactive HTML Dashboard**.

---

## 🏗️ 1. Architecture Overview & Folder Structure

```
c:\Users\lenovo\Desktop\learning\woodenstreet_test\
├── config/
│   └── environments.ts          # Multi-environment loader (beta, staging, production)
├── .env                         # Default environment configuration
├── .env.beta                    # Beta environment configuration
├── .env.staging                 # Staging environment configuration
├── .env.production              # Production environment configuration
├── test-data/                   # Data-driven JSON test datasets
│   ├── login.json
│   ├── products.json
│   ├── checkout.json
│   ├── leads.json
│   ├── tickets.json
│   ├── coupons.json
│   └── pincodes.json
├── pages/                       # Page Object Model (TypeScript)
│   ├── BasePage.ts              # Core page foundation & network listeners
│   ├── HomePage.ts              # Homepage navigation & health checks
│   ├── LoginPage.ts             # Mobile & OTP customer login flow
│   ├── SearchPage.ts            # Search box, suggestions & product cards
│   ├── ProductPage.ts           # PDP details, price math, pincode & CTAs
│   ├── CartPage.ts              # Cart items, qty, removal & order math
│   ├── CheckoutPage.ts          # Customer & Guest shipping forms & payment checkpoint
│   ├── WishlistPage.ts          # Wishlist management
│   ├── TicketPage.ts            # Support ticket L1/L2 categories & creation
│   ├── LeadPage.ts              # Data-driven lead form submissions
│   ├── AccountPage.ts           # Profile & My Orders tab
│   └── PaymentPage.ts           # Payment gateway initiation verification
├── fixtures/
│   └── testFixtures.ts          # Playwright test fixtures & error interceptors
├── utils/
│   ├── otpHelper.ts             # 3-Mode universal OTP strategy
│   ├── logger.ts                # Masked structured logging
│   ├── testData.ts              # Data reader helper
│   ├── screenshotHelper.ts      # Automated failure screenshot handler
│   ├── networkHelper.ts         # Critical API status (500/502/503/504) & classifier
│   ├── validationHelper.ts      # Normalized price & order total calculation math
│   └── reportGenerator.ts       # Excel report & HTML Dashboard generator
├── tests/
│   └── smoke/                   # Tagged smoke test suite (@smoke, @p0, @p1, @p2)
│       ├── 00-health.spec.ts
│       ├── 01-login.spec.ts
│       ├── 02-search.spec.ts
│       ├── 03-product.spec.ts
│       ├── 04-cart.spec.ts
│       ├── 05-customer-checkout.spec.ts
│       ├── 06-guest-checkout.spec.ts
│       ├── 07-pincode.spec.ts
│       ├── 08-coupon.spec.ts
│       ├── 09-wishlist.spec.ts
│       ├── 10-account.spec.ts
│       ├── 11-payment.spec.ts
│       ├── 12-ticket.spec.ts
│       ├── 13-leads.spec.ts
│       └── 14-negative-checkout.spec.ts
├── scripts/
│   └── generate_report_runner.ts# Custom report generation runner
├── .github/
│   └── workflows/
│       └── daily-smoke.yml      # CI/CD daily scheduled workflow
├── playwright.config.ts         # Playwright test configuration
├── tsconfig.json                # TypeScript compiler config
└── package.json                 # Project scripts & dependencies
```

---

## 🔑 2. How OTP Strategy Works (`otpHelper.ts`)

The framework abstracts OTP retrieval so tests remain decoupled from where the OTP originates.

Supported Modes (`OTP_MODE` in `.env`):

1. **MODE 1 (Environment Variable)**: Reads OTP directly from `process.env.TEST_OTP`. Ideal for static test credentials or sandbox environments.
2. **MODE 2 (API Test Service)**: Sends an HTTP GET request to a QA OTP service endpoint (`OTP_API_URL`) passing the phone number to fetch the live generated OTP.
3. **MODE 3 (Manual / Console Fallback)**: Prompts for manual entry or falls back gracefully during local debugging.

Usage:
```typescript
const otp = await OTPHelper.getOTP(phone);
```

---

## 🛡️ 3. Customer & Guest Session Isolation

- **Customer Checkout (`05-customer-checkout.spec.ts`)**: Uses the main browser context, performing login and maintaining session state.
- **Guest Checkout (`06-guest-checkout.spec.ts`)**: Instantiates a fresh `browser.newContext()` explicitly to guarantee zero cookie/storage contamination from customer logins.

```typescript
const context = await browser.newContext(); // Fresh clean state
const page = await context.newPage();
```

---

## 📊 4. Reporting & Diagnostics

### Excel Report & HTML Dashboard
Running `npm run smoke:report` or running tests creates:
1. `reports/Daily_Smoke_Test_Report.xlsx`: Formatted Excel spreadsheet with summary metrics and detailed per-test status.
2. `reports/Daily_Smoke_Dashboard.html`: Interactive web dashboard featuring pass rate metrics, execution duration, failure categories, and filterable test execution logs.

### Failure Classification
Failures are categorized automatically into:
- `ENVIRONMENT_FAILURE` (Network/DNS/Connection failures)
- `API_FAILURE` (HTTP 500, 502, 503, 504 server errors)
- `AUTH_FAILURE` (OTP / Login verification failures)
- `UI_FAILURE` (Missing locator or element state issue)
- `ASSERTION_FAILURE` (Value mismatch in expect assertions)
- `TIMEOUT` (Page or action timeout)

---

## ⚡ 5. Execution Commands

### Run Full Daily Smoke Suite
```bash
npm run smoke
```

### Environment-Specific Runs
```bash
npm run smoke:beta
npm run smoke:staging
npm run smoke:prod
```

### Tag-Filtered Execution
```bash
npm run smoke:p0          # Run P0 Critical Path Tests
npm run smoke:p1          # Run P1 Functional Tests
npm run smoke:login       # Run Login Tests
npm run smoke:checkout    # Run Checkout Tests
npm run smoke:guest       # Run Guest Checkout
npm run smoke:customer    # Run Customer Checkout
```

### Headed, Debug & UI Modes
```bash
npm run test:headed
npm run test:debug
npm run test:ui
```

### Generate Dashboard & Reports
```bash
npm run smoke:report
```

---

## 🎯 6. Recommended Selectors & Test IDs for QA Engineering

To further enhance test stability, the following `data-testid` attributes are recommended for addition to the application frontend:

| Element | Recommended Selector / Test ID |
| :--- | :--- |
| Mobile Phone Input | `data-testid="login-mobile-input"` |
| Request OTP Button | `data-testid="request-otp-button"` |
| OTP Entry Box | `data-testid="otp-input"` |
| Product Title on PDP | `data-testid="pdp-product-title"` |
| Product Price on PDP | `data-testid="pdp-product-price"` |
| Add to Cart Button | `data-testid="add-to-cart-button"` |
| Buy Now Button | `data-testid="buy-now-button"` |
| Cart Proceed Button | `data-testid="proceed-to-checkout"` |
| Shipping Name Input | `data-testid="shipping-name-input"` |
| Place Order Button | `data-testid="place-order-button"` |
