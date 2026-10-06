// sale_validation.spec.js
// Automation script to validate banners and coupons across various pages during a sale.
// Configured to be reusable for future sales by changing the CONFIG block below.

const { test, expect, chromium, devices } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

// ─── CONFIGURATION ───────────────────────────────────────────────────────────
// Update these values for each new sale or if the input file changes.
const CONFIG = {
  // Input and Output
  inputFile: process.env.INPUT_FILE || "./sale_urls.csv", // Excel or CSV file containing URLs
  urlColumnName: "Information Pages Links", // Column header containing the URLs
  baseUrl: process.env.BASE_URL || "https://www.woodenstreet.com/", // Base domain
  outputDir: "./results/prod",
  screenshotsDir: "./results/prod/screenshots",
  reportFile: "./results/sale_validation_report_prod.xlsx",

  // Sale Details
  couponCode: process.env.COUPON_CODE || "REFRESH",        // The coupon code to validate
  saleName: process.env.SALE_NAME || "the festive refresh", // The sale text expected in banners
  previousCouponCode: process.env.PREVIOUS_COUPON_CODE || "BHARAT79", // Previous coupon code
  previousSaleName: process.env.PREVIOUS_SALE_NAME || "independence day sale", // Previous sale text

  // Selectors (Update these if the website's DOM changes)
  selectors: {
    // PDP (Product Details Page)
    productPrice: [
      '.product-price', '.price-details', '#final-price', '[data-testid="product-price"]'
    ],
    infoButton: [
      '.info-icon', '.fa-info-circle', '[aria-label="info"]', '.tooltip-trigger', '.price-info-btn'
    ],
    tooltipBox: [
      '.tooltip-content', '.info-details', '.popover-content', '.coupon-tooltip'
    ],

    // General Coupons and Banners
    couponDisplay: [
      '.coupon-code', '.applied-coupon', '.discount-code', '[data-testid="coupon"]', 'img[src*="coupon"]'
    ],
    topStripBanner: [
      '.top-strip', '.header-banner', '.promo-bar', '#top-banner', 'img[src*="top"]'
    ],
    midStripBanner: [
      '.mid-banner', '.category-promo', '.middle-strip', '.section-banner', 'img[src*="offer_strip"]'
    ],
    bigBanner: [
      '.hero-banner', '.main-slider', '.home-banner', '.large-banner', 
      '[alt*="banner" i]', '[alt*="sale" i]', '[alt*="offer" i]',
      'img[src*="hero"]', 'img[src*="home_page"]', 'img[src*="homenew"]', 'img[src*="banner"]', 'img[src*="slider"]',
      '[class*="banner"]', '[class*="slider"]', '[class*="hero"]', '[class*="carousel"]'
    ],
    mobileBanner: [
      '.mobile-banner', '.mob-banner', '[class*="mobile-banner"]', '[class*="mobBanner"]', '[class*="menu-mobile"]', 'img[src*="mobile"]', 'img[src*="mob_"]', 'img[src*="mob-"]', 'img[src*="mob/"]', 'img[alt*="mobile" i]'
    ]
  },

  waitUntil: "load", // Wait until the load event fires
  settleMs: 2500,    // Time to wait for lazy-loaded elements to appear
};
// ─────────────────────────────────────────────────────────────────────────────

// ─── COLOURS ─────────────────────────────────────────────────────────────────
const C = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  green: "\x1b[32m", red: "\x1b[31m", yellow: "\x1b[33m",
  cyan: "\x1b[36m", blue: "\x1b[34m", magenta: "\x1b[35m", white: "\x1b[37m",
};
const clr = (col, s) => `${col}${s}${C.reset}`;
const trunc = (s, n) => String(s).length > n ? String(s).slice(0, n - 1) + "…" : String(s);
// ─────────────────────────────────────────────────────────────────────────────

// ─── INPUT READER ────────────────────────────────────────────────────────────
function loadTestCasesSync() {
  const f = CONFIG.inputFile;
  if (!fs.existsSync(f)) {
    console.error(`\n❌ Input file not found: ${path.resolve(f)}\n   Please ensure the file exists or update CONFIG.inputFile.\n`);
    return [];
  }

  const ext = path.extname(f).toLowerCase();
  let rows = [];

  if (ext === ".xlsx" || ext === ".xls") {
    const wb = xlsx.readFile(f);
    rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  } else if (ext === ".csv") {
    const content = fs.readFileSync(f, "utf8").replace(/\r/g, "");
    const lines = content.split("\n").filter(Boolean);
    if (lines.length > 1) {
      const parseRow = (line) => {
        const cols = []; let cur = "", inQ = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') inQ = !inQ;
          else if (ch === "," && !inQ) { cols.push(cur.trim()); cur = ""; }
          else cur += ch;
        }
        cols.push(cur.trim());
        return cols;
      };
      const headers = parseRow(lines[0]);
      rows = lines.slice(1).map(line => {
        const vals = parseRow(line), row = {};
        headers.forEach((h, i) => { row[h] = vals[i] || ""; });
        return row;
      });
    }
  }

  // Find the URL robustly
  return rows.map(r => {
    let url = "";
    // Priority: the explicit column
    const urlKey = Object.keys(r).find(k => k.trim().toLowerCase() === CONFIG.urlColumnName.toLowerCase());
    if (urlKey && r[urlKey]) {
      url = r[urlKey];
    } else {
      // Fallback: any column that starts with http
      for (const val of Object.values(r)) {
        if (typeof val === 'string' && val.startsWith('http')) {
          url = val;
          break;
        }
      }
    }
    return { url };
  }).filter(r => r.url && r.url.trim() !== "");
}

// ─── PAGE DETECTOR ───────────────────────────────────────────────────────────
function detectPageType(urlStr) {
  let u;
  try { u = new URL(urlStr); } catch { return "unknown"; }
  const path = u.pathname.toLowerCase();

  if (path === "/" || path === "") return "home";
  if (path.includes("/cart")) return "cart";
  if (path.endsWith(".html") || path.includes("/product/")) return "pdp";
  if (path.includes("/info") || path.includes("/about") || path.includes("/contact")) return "information";

  return "category";
}

// ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchesTerm(sourceStr, term) {
  if (!sourceStr || !term) return false;
  const s = sourceStr.toLowerCase();
  const t = term.toLowerCase().trim();

  // If the term is a single alphanumeric coupon code (e.g., REFRESH, REFRESH50, BHARAT79)
  if (/^[a-z0-9]+$/i.test(t)) {
    // Word boundary regex ensures REFRESH will NEVER match REFRESH50!
    const regex = new RegExp(`\\b${escapeRegExp(t)}\\b`, 'i');
    return regex.test(s);
  }

  // Multi-word phrase or hyphenated phrase (e.g. "festive refresh" or "the festive refresh")
  const altHyphen = t.replace(/\s+/g, '-');
  if (s.includes(t) || s.includes(altHyphen)) return true;

  // If term starts with "the ", check without "the " prefix (e.g., "festive refresh" vs "the festive refresh")
  if (t.startsWith("the ")) {
    const coreTerm = t.slice(4).trim();
    const coreHyphen = coreTerm.replace(/\s+/g, '-');
    if (s.includes(coreTerm) || s.includes(coreHyphen)) return true;
  }

  return false;
}

async function checkElementContainsText(page, selectorList, expectedText, elementName) {
  const termsToCheck = [expectedText, CONFIG.couponCode].filter(Boolean);
  let extractedCoupon = "";

  const extractCoupon = (str) => {
    if (!str) return "";
    const match = str.match(/(?:code|coupon|use|apply)[\s:-]*([A-Z0-9]{4,15})/i);
    if (match) return match[1].toUpperCase();
    const capsMatch = str.match(/\b[A-Z0-9]{4,15}\b/);
    if (capsMatch) return capsMatch[0];
    return "";
  };

  for (const sel of selectorList) {
    try {
      const els = await page.$$(sel);
      for (const el of els) {
        if (await el.isVisible()) {
          const text = (await el.textContent()) || "";
          const isImg = await el.evaluate(n => n.tagName.toLowerCase() === 'img');
          const alt = isImg ? (await el.getAttribute('alt')) || "" : "";
          const src = isImg ? (await el.getAttribute('src')) || "" : "";

          const rawText = text + " " + alt + " " + src;
          if (!extractedCoupon) extractedCoupon = extractCoupon(rawText);

          for (const term of termsToCheck) {
            if (term && matchesTerm(rawText, term)) {
              return { 
                found: true, 
                message: `✅ Found banner/coupon matching '${term}' in ${elementName} (${sel})`, 
                actualCoupon: extractedCoupon || CONFIG.couponCode 
              };
            }
          }
        }
      }
    } catch {}
  }

  try {
    const bodyText = await page.evaluate(() => document.body.innerText);
    const imgs = await page.$$eval('img', imgs =>
      imgs.filter(img => {
        const rect = img.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }).map(i => (i.alt || "") + " " + (i.src || ""))
    );

    if (!extractedCoupon) extractedCoupon = extractCoupon(bodyText);
    if (!extractedCoupon) {
      for (const imgStr of imgs) {
        extractedCoupon = extractCoupon(imgStr);
        if (extractedCoupon) break;
      }
    }

    for (const term of termsToCheck) {
      if (term && matchesTerm(bodyText, term)) {
        return { 
          found: true, 
          message: `✅ Found '${term}' in visible page text (generic fallback)`, 
          actualCoupon: extractedCoupon || CONFIG.couponCode 
        };
      }
      if (term && imgs.some(imgStr => matchesTerm(imgStr, term))) {
        return { 
          found: true, 
          message: `✅ Found visible image banner containing '${term}'`, 
          actualCoupon: extractedCoupon || CONFIG.couponCode 
        };
      }
    }
  } catch (err) {}

  const failureMsg = (extractedCoupon && extractedCoupon !== "None Found" && extractedCoupon !== CONFIG.couponCode)
    ? `❌ Incorrect/outdated sale banner or coupon ('${extractedCoupon}') found for ${elementName} (Expected: '${expectedText}' / '${CONFIG.couponCode}')`
    : `❌ Missing expected sale text or coupon for ${elementName}`;

  return { 
    found: false, 
    message: failureMsg, 
    actualCoupon: extractedCoupon || "None Found" 
  };
}

async function hoverAndCheckTooltip(page, infoBtnSelectors, tooltipSelectors, expectedText) {
  for (const btnSel of infoBtnSelectors) {
    try {
      const btn = await page.$(btnSel);
      if (btn && await btn.isVisible()) {
        await btn.hover({ timeout: 3000 });
        await page.waitForTimeout(1000);

        const result = await checkElementContainsText(page, tooltipSelectors, expectedText, "Tooltip/Hover Info");
        if (result.found) return result;

        const bodyText = await page.locator('body').textContent();
        if (bodyText && matchesTerm(bodyText, expectedText)) {
          return { found: true, message: `✅ Found '${expectedText}' after hovering ${btnSel} (caught in body)`, actualCoupon: CONFIG.couponCode };
        }
      }
    } catch {}
  }
  return { found: false, message: `❌ Failed to find or hover info button to check for '${expectedText}'`, actualCoupon: "None Found" };
}

async function checkPreviousSaleNotVisible(page) {
  const oldTerms = [
    CONFIG.previousCouponCode,
    CONFIG.previousSaleName,
    "BHARAT79",
    "REFRESH50",
    "independence day sale",
    "fresh finds july",
    "monsoon sale",
    "freedom sale",
    "rakhi sale",
    "clearance sale"
  ].filter(Boolean);

  try {
    const bodyText = await page.evaluate(() => document.body.innerText);
    const imgs = await page.$$eval('img', imgs =>
      imgs.map(i => (i.alt || '') + ' ' + (i.src || ''))
    );
    const links = await page.$$eval('a', anchors =>
      anchors.map(a => a.href || '')
    );

    for (const term of oldTerms) {
      if (!term || term.toLowerCase() === CONFIG.couponCode.toLowerCase() || term.toLowerCase() === CONFIG.saleName.toLowerCase()) {
        continue;
      }
      if (matchesTerm(bodyText, term)) {
        return { foundOld: true, message: `❌ Old/Incorrect sale term '${term}' found in visible page text!` };
      }
      if (imgs.some(src => matchesTerm(src, term))) {
        return { foundOld: true, message: `❌ Old/Incorrect sale image/alt containing '${term}' found on page!` };
      }
      if (links.some(href => matchesTerm(href, term))) {
        return { foundOld: true, message: `❌ Old/Incorrect sale link containing '${term}' found on page!` };
      }
    }
  } catch (err) {}

  return { foundOld: false, message: `✅ Verified: No previous or incorrect sale banners found on page.` };
}

async function checkBannerRedirections(page, pageType, vpName) {
  const banners = [];
  const selectors = [...CONFIG.selectors.bigBanner, ...CONFIG.selectors.midStripBanner, ...CONFIG.selectors.topStripBanner];

  // Find all links wrapping elements that match banner selectors
  for (const sel of selectors) {
    try {
      const els = await page.$$(sel);
      for (const el of els) {
        if (await el.isVisible()) {
          // Try to get the closest anchor tag
          const href = await el.evaluate(n => {
            const a = n.closest('a');
            return a ? a.href : null;
          });
          if (href && !href.startsWith('javascript:')) {
            banners.push({ selector: sel, href });
          }
        }
      }
    } catch { }
  }

  // De-duplicate
  const uniqueBanners = [];
  const seen = new Set();
  for (const b of banners) {
    if (!seen.has(b.href)) {
      seen.add(b.href);
      uniqueBanners.push(b);
    }
  }

  const results = [];
  for (const b of uniqueBanners) {
    let status = "ERROR";
    let httpCode = "N/A";
    try {
      const response = await page.request.get(b.href, { maxRedirects: 5, timeout: 10000 });
      httpCode = response.status();
      status = (httpCode >= 200 && httpCode < 400) ? "PASS" : "FAIL";
    } catch (err) {
      status = "ERROR";
      httpCode = err.message.split('\\n')[0];
    }
    results.push({
      url: page.url(),
      view: vpName,
      page_type: pageType,
      banner_selector: b.selector,
      redirection_link: b.href,
      http_status: httpCode,
      status: status
    });
  }
  return results;
}

// ─── REPORT WRITER ───────────────────────────────────────────────────────────
function writeReport(results, redirectionResults = [], heroBannerResults = []) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  const wb = xlsx.utils.book_new();

  // 1. Validation Results Sheet
  const headers = ["#", "View", "URL", "Page Type", "Status", "Expected Coupon", "Expected Sale", "Actual Coupon Displayed", "Notes", "Screenshot File"];
  const rows = results.map(r => [
    r.index, r.view, r.url, r.page_type, r.status, CONFIG.couponCode, CONFIG.saleName, r.actual_coupon, r.notes, r.screenshot
  ]);

  const ds = xlsx.utils.aoa_to_sheet([headers, ...rows]);
  ds["!cols"] = [
    { wch: 5 }, { wch: 10 }, { wch: 60 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 80 }, { wch: 35 }
  ];
  xlsx.utils.book_append_sheet(wb, ds, "Validation Results");

  // 2. Banner Redirections Sheet
  const redirHeaders = ["Page URL", "View", "Page Type", "Banner Selector", "Redirection Link", "HTTP Status", "Status"];
  const redirRows = redirectionResults.map(r => [
    r.url, r.view, r.page_type, r.banner_selector, r.redirection_link, r.http_status, r.status
  ]);
  const rs = xlsx.utils.aoa_to_sheet([redirHeaders, ...redirRows]);
  rs["!cols"] = [
    { wch: 60 }, { wch: 10 }, { wch: 15 }, { wch: 20 }, { wch: 60 }, { wch: 15 }, { wch: 10 }
  ];
  xlsx.utils.book_append_sheet(wb, rs, "Banner Redirections");

  // 3. Hero Banner Validation Sheet
  if (heroBannerResults && heroBannerResults.length > 0) {
    const heroHeaders = [
      "Slide #",
      "Banner Image URL",
      "Expected Category",
      "Target URL",
      "Actual URL Page Loaded",
      "Page H1 Header",
      "Page Title",
      "HTTP Status",
      "Navigation Status",
      "Category Match",
      "Screenshot Reference"
    ];
    const heroRows = heroBannerResults.map(r => [
      r.index,
      r.imgSrc,
      r.expectedCategory,
      r.targetUrl,
      r.actualUrl,
      r.h1,
      r.title,
      r.httpStatus,
      r.status,
      r.matchStatus,
      r.screenshot
    ]);
    const hs = xlsx.utils.aoa_to_sheet([heroHeaders, ...heroRows]);
    hs["!cols"] = [
      { wch: 8 }, { wch: 60 }, { wch: 20 }, { wch: 45 }, { wch: 45 }, { wch: 25 }, { wch: 35 }, { wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 25 }
    ];
    xlsx.utils.book_append_sheet(wb, hs, "Hero Banner Validation");
  }

  // 4. Summary Sheet
  const summaryRows = [
    ["Sale Validation Report", ""],
    ["Run Date", new Date().toLocaleString()],
    ["Coupon Code", CONFIG.couponCode],
    ["Sale Text", CONFIG.saleName],
    ["", ""],
    ["-- Validation Checks --", ""],
    ["Total Pages Checked (URLs x Views)", results.length],
    ["✅ PASS", results.filter(r => r.status === "PASS").length],
    ["❌ FAIL", results.filter(r => r.status === "FAIL").length],
    ["⚠️ ERROR/WARN", results.filter(r => r.status === "ERROR" || r.status === "WARN").length],
    ["", ""],
    ["-- Banner Redirections --", ""],
    ["Total Links Checked", redirectionResults.length],
    ["✅ PASS (200-399)", redirectionResults.filter(r => r.status === "PASS").length],
    ["❌ FAIL (400+ or Error)", redirectionResults.filter(r => r.status !== "PASS").length],
  ];

  if (heroBannerResults && heroBannerResults.length > 0) {
    summaryRows.push(
      ["", ""],
      ["-- Hero Banner Validation --", ""],
      ["Total Hero Banners Checked", heroBannerResults.length],
      ["✅ Navigation PASS", heroBannerResults.filter(r => r.status === "PASS").length],
      ["❌ Navigation FAIL/ERROR", heroBannerResults.filter(r => r.status !== "PASS").length],
      ["✅ Category Match PASS", heroBannerResults.filter(r => r.matchStatus === "PASS").length],
      ["❌ Category Match FAIL", heroBannerResults.filter(r => r.matchStatus !== "PASS").length]
    );
  }

  const ss = xlsx.utils.aoa_to_sheet(summaryRows);
  ss["!cols"] = [{ wch: 35 }, { wch: 30 }];
  xlsx.utils.book_append_sheet(wb, ss, "Summary");

  xlsx.writeFile(wb, CONFIG.reportFile);
}

// ─── HERO BANNER VALIDATION HELPERS ──────────────────────────────────────────
const HERO_CATEGORIES_MAP = {
  "sofa": "Sofa Sets",
  "all-modular-furniture": "Modular Furniture",
  "6-seater-dining-table-sets": "6 Seater Dining Sets",
  "all-beds": "Beds",
  "sofa-cum-beds": "Sofa Cum Beds",
  "coffee-tables": "Coffee Tables",
  "lounge-chairs": "Lounge Chairs",
  "all-study-tables": "Study Tables",
  "outdoor-furniture": "Outdoor Furniture",
  "mattress": "Mattress"
};

function getExpectedCategory(urlStr) {
  try {
    const u = new URL(urlStr);
    const parts = u.pathname.split('/').filter(Boolean);
    const slug = parts[parts.length - 1] || "";
    return HERO_CATEGORIES_MAP[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  } catch {
    return "Unknown";
  }
}

async function validateHeroBanners(homepagePage, browser) {
  const banners = await homepagePage.evaluate(() => {
    const list = [];
    const elements = document.querySelectorAll('a:has(img[src*="home_page/"])');
    elements.forEach((a) => {
      const img = a.querySelector('img');
      if (img) {
        list.push({
          href: a.href,
          imgSrc: img.getAttribute('src') || img.src,
          imgAlt: img.getAttribute('alt') || ""
        });
      }
    });
    // Deduplicate
    const seen = new Set();
    const unique = [];
    for (const item of list) {
      if (!seen.has(item.href)) {
        seen.add(item.href);
        unique.push(item);
      }
    }
    return unique;
  });

  console.log(`\n   Found ${banners.length} unique hero banners to validate.`);
  const results = [];
  let index = 1;

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(20000);
  page.setDefaultTimeout(10000);

  for (const b of banners) {
    let targetUrl = b.href || "";
    if (!CONFIG.baseUrl.includes("beta.") && targetUrl.includes("beta.teamwoodenstreet.com")) {
      targetUrl = targetUrl.replace(/https?:\/\/beta\.teamwoodenstreet\.com/g, CONFIG.baseUrl.replace(/\/$/, ""));
    }
    const expectedCategory = getExpectedCategory(targetUrl);
    console.log(`   [Hero Banner ${index}/${banners.length}] Checking navigation to: ${targetUrl} (Expected Category: ${expectedCategory})`);

    let status = "FAIL";
    let httpStatus = "N/A";
    let actualUrl = "N/A";
    let pageTitle = "";
    let pageH1 = "";
    let matchStatus = "FAIL";
    let screenshotName = "";

    try {
      const response = await page.goto(targetUrl, { waitUntil: "load" });
      await page.waitForTimeout(2000);
      actualUrl = page.url();
      httpStatus = response ? response.status() : 200;

      if (httpStatus >= 200 && httpStatus < 400) {
        status = "PASS";
      }

      pageTitle = await page.title();

      // Get the page H1
      pageH1 = await page.locator('h1').first().textContent().catch(() => "");
      pageH1 = pageH1 ? pageH1.trim() : "";

      // Validate match
      const checkText = (pageH1 + " " + pageTitle).toLowerCase();
      const keywords = expectedCategory.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      let matches = false;
      if (keywords.length > 0) {
        matches = keywords.some(kw => checkText.includes(kw));
      } else {
        matches = checkText.includes(expectedCategory.toLowerCase());
      }

      if (matches) {
        matchStatus = "PASS";
      }

      // Take screenshot
      screenshotName = `hero_banner_cat_${index}.png`;
      await page.screenshot({ path: path.join(CONFIG.screenshotsDir, screenshotName) });

    } catch (err) {
      status = "ERROR";
      httpStatus = "ERR: " + err.message.split("\n")[0];
      try {
        screenshotName = `hero_banner_err_${index}.png`;
        await page.screenshot({ path: path.join(CONFIG.screenshotsDir, screenshotName) });
      } catch { }
    }

    results.push({
      index: index++,
      imgSrc: b.imgSrc,
      expectedCategory,
      targetUrl: b.href,
      actualUrl,
      h1: pageH1,
      title: pageTitle,
      httpStatus,
      status,
      matchStatus,
      screenshot: screenshotName
    });
  }

  await context.close();
  return results;
}

test("Sale Validation - Desktop and Mobile", async ({ }, testInfo) => {
  test.setTimeout(0); // Disable the Playwright test timeout since we process many URLs in one block

  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  fs.mkdirSync(CONFIG.screenshotsDir, { recursive: true });

  const testCases = loadTestCasesSync();
  if (!testCases.length) {
    console.log(clr(C.yellow, "⚠️  Skipping test execution because no valid URLs were found."));
    return;
  }

  console.log(`\n${clr(C.cyan + C.bold, `🚀 Starting Sale Validation for ${testCases.length} URLs (Desktop & Mobile)`)}`);

  const headless = !process.argv.includes('--headed') && testInfo?.project?.use?.headless !== false;
  const browser = await chromium.launch({
    headless,
    args: headless ? [] : ["--window-position=960,0", "--window-size=960,1000"]
  });
  const results = [];
  const heroBannerResults = [];

  // Run homepage hero banner validation first on Desktop context
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    console.log(`\n${clr(C.cyan + C.bold, "🔍 Launching Homepage Hero Banners Navigation Validation...")}`);
    await page.goto(CONFIG.baseUrl, { waitUntil: CONFIG.waitUntil });
    await page.waitForTimeout(CONFIG.settleMs);
    const hResults = await validateHeroBanners(page, browser);
    heroBannerResults.push(...hResults);
    await context.close();
  } catch (err) {
    console.error("Error during hero banners validation:", err);
  }

  const viewports = [
    { name: "Desktop", config: { viewport: { width: 1440, height: 900 } } },
    { name: "Mobile", config: { ...devices['iPhone 13'] } }
  ];

  let testIndex = 1;

  // Run viewports in parallel
  await Promise.all(viewports.map(async (vp) => {
    const context = await browser.newContext(vp.config);
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(20000); // 20 seconds timeout for pages
    page.setDefaultTimeout(10000);

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const currentTestIndex = testIndex++;

      const result = {
        index: currentTestIndex, view: vp.name, url: tc.url, page_type: "", status: "PASS", notes: [], screenshot: ""
      };

      try {
        let fullUrl = tc.url;
        if (!fullUrl.startsWith("http")) {
          fullUrl = CONFIG.baseUrl + (fullUrl.startsWith("/") ? fullUrl : "/" + fullUrl);
        }
        if (!CONFIG.baseUrl.includes("beta.") && fullUrl.includes("beta.teamwoodenstreet.com")) {
          fullUrl = fullUrl.replace(/https?:\/\/beta\.teamwoodenstreet\.com/g, CONFIG.baseUrl.replace(/\/$/, ""));
        }

        await page.goto(fullUrl, { waitUntil: CONFIG.waitUntil });
        await page.waitForTimeout(CONFIG.settleMs);

        result.page_type = detectPageType(page.url());
        const checks = [];

        // ─── PAGE SPECIFIC VALIDATIONS ───────────────────────────────────────
        if (result.page_type === "pdp") {
          const hoverRes = await hoverAndCheckTooltip(page, CONFIG.selectors.infoButton, CONFIG.selectors.tooltipBox, CONFIG.couponCode);
          if (hoverRes.found) {
            checks.push(hoverRes);
          } else {
            const pdpOfferCheck = await checkElementContainsText(
              page, 
              [...CONFIG.selectors.couponDisplay, ...CONFIG.selectors.productPrice, '.price-info', '.offer-details', 'body'], 
              CONFIG.couponCode, 
              "PDP Price / Offer Area"
            );
            checks.push(pdpOfferCheck);
          }
        }
        else if (result.page_type === "cart") {
          checks.push(await checkElementContainsText(page, [...CONFIG.selectors.couponDisplay, '.cart-coupon', 'body'], CONFIG.couponCode, "Cart Coupon Area"));
        }
        else if (result.page_type === "category" || result.page_type === "information") {
          const categoryBannerSelectors = [
            ...CONFIG.selectors.bigBanner, 
            ...CONFIG.selectors.midStripBanner, 
            ...CONFIG.selectors.topStripBanner,
            '.category-header', '.offer-banner', '.discount-strip', 'img[src*="banner"]', 'img[src*="offer"]', 'img[src*="strip"]'
          ];
          checks.push(await checkElementContainsText(page, categoryBannerSelectors, CONFIG.saleName, "Category / Page Banners"));
        }
        else if (result.page_type === "home") {
          checks.push(await checkElementContainsText(page, CONFIG.selectors.bigBanner, CONFIG.saleName, "Homepage Banners"));
        }

        // Validate that previous sale text/links are NOT present
        const oldSaleCheck = await checkPreviousSaleNotVisible(page);

        // ─── EVALUATE CHECKS ─────────────────────────────────────────────────
        let hasFailure = false;
        let actualCoupon = "None Found";
        for (const chk of checks) {
          result.notes.push(chk.message);
          if (!chk.found) hasFailure = true;
          if (chk.actualCoupon && chk.actualCoupon !== "None Found") {
            actualCoupon = chk.actualCoupon;
          }
        }

        if (oldSaleCheck.foundOld) {
          hasFailure = true;
          result.notes.push(oldSaleCheck.message);
        } else {
          result.notes.push(oldSaleCheck.message);
        }

        result.actual_coupon = actualCoupon;

        if (checks.length === 0) {
          result.status = "WARN";
          result.notes.push("No specific validation rules matched for this page type.");
        } else if (hasFailure) {
          result.status = "FAIL";
          const sName = `fail_${vp.name}_${result.page_type}_${currentTestIndex}.png`;
          await page.screenshot({ path: path.join(CONFIG.screenshotsDir, sName) });
          result.screenshot = sName;
        } else {
          result.status = "PASS";
        }

      } catch (err) {
        result.status = "ERROR";
        result.notes.push("Error: " + err.message.split("\n")[0]);
        try {
          const sName = `err_${vp.name}_${currentTestIndex}.png`;
          await page.screenshot({ path: path.join(CONFIG.screenshotsDir, sName) });
          result.screenshot = sName;
        } catch { }
      }

      results.push(result);

      const statusColor = result.status === "PASS" ? C.green : result.status === "FAIL" ? C.red : C.yellow;
      console.log(`[${vp.name}] ${trunc(tc.url, 50)} ↳ ${clr(statusColor + C.bold, result.status)} [${result.page_type}]`);
      if (result.status !== "PASS") {
        result.notes.forEach(n => console.log(`   [${vp.name}]    ${n}`));
      }
    }

    await context.close();
  }));

  await browser.close();

  // Sort results by index so they are in consistent order in report
  results.sort((a, b) => a.index - b.index);

  writeReport(results, [], heroBannerResults);

  console.log(`\n${clr(C.cyan + C.bold, "✅ Validation complete!")}`);
  console.log(`Report generated at: ${CONFIG.reportFile}`);
});
