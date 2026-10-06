# Website Ticket Creation QA Automation Framework

A production-quality **Playwright + JavaScript** automation framework designed for daily QA regression testing of website ticket creation functionality.

---

## Key Features

- **Dynamic L1/L2 Discovery**: Automatically extracts all available L1 Issue Types and corresponding L2 Sub-Issue Types dynamically from the live DOM.
- **Manual OTP Login Pause**: Pauses terminal execution after triggering OTP to allow manual entry in the browser, continuing upon pressing `ENTER`.
- **Dry-Run & Full-Run Modes**:
  - `DRY_RUN=true`: Discovers matrix, fills form fields, validates inputs, and skips submission.
  - `DRY_RUN=false`: Executes actual ticket creation, verifying Ticket ID generation.
- **Resume Execution Support**: Maintains state in `reports/execution-state.json`. Prevents duplicate ticket creation across crashed or interrupted runs.
- **Multi-Sheet Excel Report**: Generates `reports/ticket-report.xlsx` with Execution Summary, Detailed Results, Failed Tests, and L1/L2 Matrix sheets using `exceljs`.
- **Modern HTML Dashboard**: Creates `reports/dashboard.html` with interactive metrics, summary cards, L1 coverage, L1/L2 grid matrix, and failed test screenshot links.
- **Resilient Failure Handling**: Captures screenshots, URLs, errors, and traces on failure without interrupting remaining test combinations.

---

## Project Structure

```text
ticket-automation/
│
├── tests/
│   └── ticket-creation.spec.js   # Master Playwright test suite
│
├── test-data/
│   └── test-attachment.pdf       # Test attachment file
│
├── reports/
│   ├── ticket-report.xlsx        # Excel Report (4 sheets)
│   ├── dashboard.html            # Visual HTML Dashboard
│   └── execution-state.json      # Persistent execution state
│
├── screenshots/                  # Failure screenshots
├── videos/                       # Execution recordings
├── traces/                       # Playwright traces
│
├── utils/
│   ├── excel-report.js           # ExcelJS report generator
│   ├── dashboard.js              # HTML Dashboard generator
│   ├── logger.js                 # Structured terminal progress logger
│   ├── state-manager.js          # Execution state persistence manager
│   └── ticket-helper.js          # Dynamic dropdown & form helper
│
├── config/
│   └── config.js                 # Central environment configuration
│
├── playwright.config.js          # Playwright test configuration
├── package.json                  # NPM package manifest
├── .env.example                  # Sample environment file
└── README.md                     # Documentation
```

---

## Setup & Installation

### 1. Install Dependencies
Navigate into the `ticket-automation` directory and run:

```bash
npm install
npx playwright install chromium
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Update `.env` with your test phone number and test order ID:

```env
TEST_PHONE=9999999999
BASE_URL=https://www.woodenstreet.com
TICKET_URL=https://www.woodenstreet.com/help-center/tickets?default=create
TEST_ORDER_ID=WS-TEST-100234
DRY_RUN=false
ALLOW_DUPLICATE_TICKETS=false
MAX_RETRIES=2
HEADLESS=false
```

---

## Execution Commands

### 1. Full Execution Run (Actual Ticket Creation)
Runs the test suite in headed mode, prompts for manual OTP, and submits tickets:

```bash
npm run test:full
```

### 2. Dry-Run Mode (Validation Only, No Ticket Submission)
Discovers all L1/L2 combinations, populates form fields, validates inputs, but skips ticket submission:

```bash
npm run test:dry-run
```

### 3. Resume Interrupted Run
If a previous execution was interrupted, set `ALLOW_DUPLICATE_TICKETS=false` in `.env` and run `npm run test:full`. Combinations already marked `PASS` in `reports/execution-state.json` will be automatically skipped.

---

## Reports & Artifacts

After execution, all test reports and artifacts are saved in `./reports/`:

- 📊 **Excel Report**: `reports/ticket-report.xlsx`
- 🖥️ **HTML Dashboard**: `reports/dashboard.html`
- 💾 **Execution State**: `reports/execution-state.json`
- 🖼️ **Screenshots**: `reports/screenshots/`
