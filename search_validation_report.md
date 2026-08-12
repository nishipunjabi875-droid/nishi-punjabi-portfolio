# Beta WoodenStreet Search Bar Audit: Security & QA Report

This report outlines critical findings from an in-depth QA, security pentest, and logical relevance audit of the search box on `https://beta.teamwoodenstreet.com/`. 

---

## 1. Logical Relevance & Search Ranking Bugs

### 🚨 Logical Bug: Poor Search Relevance & Keyword Weight Ranking
- **Test**: Searched for the product/brand query `"veda"`.
- **Result**: **FAIL (Poor Ranking Relevance)**.
- **Detail**: The search engine ranks products with **zero keyword matches** in their title or URL at the absolute top of the results page. Actual "Veda" branded items are pushed down.
  - **Top 3 Results returned for "veda" (No keyword match)**:
    1. *Rini Mango Wood Upholstered Bench* (URL: `.../product/rini-mango-wood-upholstered-bench...`)
    2. *Shloka White Ash Wood Bench* (URL: `.../product/shloka-white-ash-wood-bench...`)
    3. *Amodh Sheesham Wood Bar Cabinet* (URL: `.../product/amodh-sheesham-wood-bar-cabinet...`)
  - **Actual Veda Branded Products (Pushed to positions 4-9)**:
    4. *Yellow Luxurious Veda Gift Set*
    5. *Luxurious Veda Scented Candle (Sage Mint)*
    6. *Luxurious Veda Scented Candle (Tuberose Jasmine)*
- **Severity**: **Medium-High** (severely degrades purchase intent conversion; users searching for a specific brand/collection are shown unrelated benches first).

---

## 2. Security & Penetration Testing Audit

### 🛡️ DOM-based XSS (Cross-Site Scripting)
- **Test**: Injected standard HTML/JS payloads (e.g. `sofa"<img src=invalid onerror="window.xss_triggered=true">`) into the search parameter.
- **Result**: **PASS**. 
- **Detail**: The payload was properly escaped as a plain-text string inside the page DOM rather than executing, indicating solid sanitization on frontend output bindings.

### ⚠️ SQL Injection & Uncaught Exception Leakage
- **Test**: Submitted SQL queries (e.g., `' OR '1'='1` and `UNION SELECT null, null, null--`).
- **Result**: **WARNING / UX FLICKER**.
- **Detail**: While the server successfully blocked the request (and did not expose SQL structural errors), the client-side JavaScript bundle (`search-ff16d52e961b948a.js`) did not catch the network failure gracefully. It threw uncaught `TypeError: Failed to fetch` exceptions directly to the browser console. This leaves the search page stuck in a blank "Loading more products..." state indefinitely.
- **Console Log trace**:
  ```javascript
  Search fetch error: TypeError: Failed to fetch
      at A (https://beta.teamwoodenstreet.com/_next/static/chunks/pages/search-ff16d52e961b948a.js:7:4853)
  ```

---

## 3. Functional & Environmental Environment Leaks

### 🚨 Critical Bug: Enter Key Redirects to Live Production (Desktop)
- **Description**: Pressing the `Enter` key inside the search bar on the desktop header redirects the user from the beta environment to the production domain: `https://www.woodenstreet.com/sofa` instead of `https://beta.teamwoodenstreet.com/sofa`.
- **Severity**: **Critical** (breaks testing scopes and leaks environment boundaries).

---

## 4. Responsive Layout & Accessibility Audits

### 🚨 Critical Bug: Responsive Header Collapse Failure (Mobile Sizing)
- **Description**: Dynamically resizing the desktop browser window to a mobile viewport (<768px) hides the entire header (Logo, Search input, cart, and menus) completely. The mobile header fails to render unless the page is reloaded.
- **Severity**: **High** (breaks dynamic device testing).

### ♿ Accessibility Bug: Keyboard Navigation Gaps on Search Icon
- **Description**: The search magnifying glass icon inside the desktop header is wrapped in a generic `<span>` tag rather than a `<button>` or descriptive anchor tag.
- **Severity**: **Medium** (Accessibility/WCAG violation).
- **Detail**: It has no `tabindex`, no `aria-label`, and cannot be focused or activated via keyboard navigation. Screen readers cannot identify it as a search submission control.

---

## Tested Queries Baseline & Verifications

- **Singular vs Plural Stemming**: Normalizes correctly. Both `"sofa"` and `"sofas"` yield identical product counts and layout responses.
- **Sorting Logic Integrity**: Verified sort options like "Low to High" mathematically order product prices in strict ascending sequence.
- **Zero Results Fallback Affinity**: Verified that searching for `"laptop desk xyz"` returns relevant recommendation categories (like study tables and modular office desks).
