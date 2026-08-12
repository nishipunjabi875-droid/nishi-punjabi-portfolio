/**
 * Nishi Punjabi — Personal Portfolio Interactive Scripts
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initMobileNav();
  initSkillsFilter();
  initCaseStudyModals();
  initAutomationSimulator();
  initApiSimulator();
  initResumeModals();
  initContactForm();
});

/* -------------------------------------------------------------------------- */
/* 1. Dark / Light Theme Toggle                                                */
/* -------------------------------------------------------------------------- */
function initThemeToggle() {
  const themeToggleBtn = document.getElementById('themeToggle');
  const html = document.documentElement;

  const savedTheme = localStorage.getItem('portfolio-theme') || 'dark';
  html.setAttribute('data-theme', savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = html.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', newTheme);
      localStorage.setItem('portfolio-theme', newTheme);
    });
  }
}

/* -------------------------------------------------------------------------- */
/* 2. Mobile Navigation Toggle                                                 */
/* -------------------------------------------------------------------------- */
function initMobileNav() {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (hamburgerBtn && navMenu) {
    hamburgerBtn.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
      });
    });
  }
}

/* -------------------------------------------------------------------------- */
/* 3. Skills Interactive Filter                                                */
/* -------------------------------------------------------------------------- */
function initSkillsFilter() {
  const tabBtns = document.querySelectorAll('.skill-tab-btn');
  const skillCards = document.querySelectorAll('.skill-card');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      skillCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* -------------------------------------------------------------------------- */
/* 4. Case Study Modals Data & Logic                                           */
/* -------------------------------------------------------------------------- */
const caseStudiesData = {
  1: {
    title: "Duplicate Customer Prevention Suite",
    category: "Security & Account QA",
    objective: "Design a comprehensive test suite to validate duplicate customer account prevention across mobile OTP and email registration channels.",
    problem: "When users created accounts through mobile OTP, social login, or traditional email checkout, edge cases allowed duplicate profile generation, causing fragmented order histories and CRM discrepancies.",
    strategy: "Mapped all user onboarding entry points into a matrix. Authored 74 structured test cases covering single-input, cross-channel, simultaneous registration, and boundary OTP input scenarios.",
    scenarios: [
      "Mobile OTP registration with existing registered email.",
      "Email registration with mobile number already bound to social account.",
      "Concurrent registration requests using identical phone number.",
      "OTP expiration and invalid session retry bounds."
    ],
    tools: ["Excel Test Matrix", "JIRA", "Postman", "Mobile Device Testing"],
    findings: "Uncovered 3 critical edge cases where SMS gateway delays allowed bypass of duplicate phone checks during high-concurrency sale events.",
    result: "Achieved 100% test coverage for customer onboarding, resulting in zero duplicate profile registrations in subsequent release builds."
  },

  2: {
    title: "Lead Form Regression Automation",
    titleSub: "Playwright Automation",
    category: "Test Automation Engineering",
    objective: "Automate end-to-end regression validation for all 33 lead form types across web and mobile viewports.",
    problem: "Manual testing of 33 lead forms (Consultation, Franchise, Bulk Order, Studio Visit, etc.) before every deployment required over 12 hours of manual execution.",
    strategy: "Architected 8 Playwright test suites using the Page Object Model (POM). Created reusable helper libraries (`leadforms-helper.js`) to handle dynamic modal triggers, phone verification, pincode lookups, and submit assertions.",
    scenarios: [
      "Validation of required input field boundaries across all 33 forms.",
      "Modal overlay dismissal and responsive drawer rendering.",
      "Form submission API payload structure and response validation.",
      "Post-submit thank-you modal state & CRM lead ingestion."
    ],
    tools: ["Playwright", "JavaScript", "Page Object Model", "Node.js", "Git"],
    findings: "Identified 4 forms where submit button handlers froze on slow 3G mobile networks due to unhandled promise rejections.",
    result: "Reduced lead form regression execution time from 12 hours to 3.5 minutes in automated CI runs."
  },

  3: {
    title: "Payment Audit & Verification Automation",
    category: "Financial & Gateway QA",
    objective: "Automate financial audit reconciliation between shopping cart calculations, backend order payloads, and payment gateway responses.",
    problem: "Occasional discrepancies between cart subtotal discounts, EMI interest rates, and final payment gateway transaction totals caused user checkout drop-offs.",
    strategy: "Built multi-layer automated audit workflows that scrape cart price breakdown elements, compare line-item totals against database records, and verify Razorpay payment gateway iframe payloads.",
    scenarios: [
      "Subtotal = Line Items Sum - Coupon Discount + Shipping Fee.",
      "Razorpay gateway payload amount matching checkout total in paisa.",
      "No-Cost EMI bank interest discount calculation verification.",
      "Payment failure retry & refund log assertion in CRM database."
    ],
    tools: ["Playwright", "Postman", "SQL", "MySQL", "Browser DevTools"],
    findings: "Discovered rounding discrepancy in 3-bank No-Cost EMI calculations where fractional rupee values caused payment gateway payload mismatch.",
    result: "Ensured 100% financial accuracy across all live checkout transactions."
  },

  4: {
    title: "Mattress Combo Offer Validation",
    category: "E-Commerce Pricing QA",
    objective: "Validate pricing rules, combination discounts, and SKU exclusions for mattress promotional offers.",
    problem: "Complex promotional rules combining beds and mattresses triggered false-positive discounts on sofa-cum-beds and incorrect size variants.",
    strategy: "Authored specialized test scenarios validating 12 distinct mattress SKU codes across king, queen, and single size configurations, ensuring sofa-cum-bed exclusions.",
    scenarios: [
      "King Size Bed + King Size Mattress valid combo discount trigger.",
      "King Size Bed + Queen Size Mattress invalid size mismatch handling.",
      "Sofa-cum-bed exclusion rule verification.",
      "SKU-level price calculation across 12 combinations."
    ],
    tools: ["Functional Testing", "Chrome DevTools", "Excel Test Plan"],
    findings: "Identified logic bug where adding two single mattresses to a king bed triggered duplicate combo discount vouchers.",
    result: "Prevented promotional revenue leakage and verified accurate pricing display across PDPs."
  },

  5: {
    title: "Sitewide Sale & Promotions Automation",
    category: "Automation & E-Commerce",
    objective: "Automate sitewide banner redirection verification and promotional coupon code validation during monthly sale launches.",
    problem: "Monthly sales required verifying over 150 banner links and coupon codes across desktop and mobile views before sale go-live.",
    strategy: "Built automated Playwright scripts (`sale_validation_prod.spec.js`) that scan hero banners, mid-page deals, category banners, and test coupon applications (`BHARAT79`, `WELCOME10`).",
    scenarios: [
      "HTTP 200 OK verification for all banner target URLs.",
      "Coupon code discount application on cart page.",
      "Banner image aspect ratio and responsive rendering check."
    ],
    tools: ["Playwright", "JavaScript", "Excel Reporter", "Node.js"],
    findings: "Caught 14 broken banner redirection links prior to public sale launch.",
    result: "Reduced sale launch verification time by 85% with zero broken links on production release."
  },

  6: {
    title: "Support Ticket & My Account UX Analysis",
    category: "Product & UX QA",
    objective: "Analyze customer support tickets to identify recurring UX friction points and recommend self-service portal enhancements.",
    problem: "High volume of customer support tickets requesting address modifications, delivery updates, and invoice downloads.",
    strategy: "Analyzed 300+ support tickets to categorize root causes. Benchmarked 'My Account' self-service features against major e-commerce platforms.",
    scenarios: [
      "Self-service order tracking workflow analysis.",
      "Post-order shipping address edit validation.",
      "Invoice download accessibility check."
    ],
    tools: ["JIRA Service Desk", "UX Analytics", "Benchmarking"],
    findings: "Found that 42% of tickets resulted from difficulty editing shipping address post-order placement.",
    result: "Presented actionable product QA recommendations leading to self-service address modification feature in My Account."
  }
};

function initCaseStudyModals() {
  const modal = document.getElementById('caseStudyModal');
  const modalBody = document.getElementById('modalBody');
  const closeBtn = document.getElementById('closeCaseStudyBtn');
  const viewBtns = document.querySelectorAll('.view-case-study-btn');

  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-project');
      const data = caseStudiesData[id];

      if (data && modal && modalBody) {
        modalBody.innerHTML = `
          <div class="cs-badge">${data.category}</div>
          <h2 class="cs-title">${data.title}</h2>
          
          <div class="cs-sec">
            <h4><i class="fa-solid fa-bullseye text-emerald"></i> Objective</h4>
            <p>${data.objective}</p>
          </div>

          <div class="cs-sec">
            <h4><i class="fa-solid fa-triangle-exclamation text-yellow"></i> Problem Statement</h4>
            <p>${data.problem}</p>
          </div>

          <div class="cs-sec">
            <h4><i class="fa-solid fa-chess-board text-cyan"></i> Test Strategy & Approach</h4>
            <p>${data.strategy}</p>
          </div>

          <div class="cs-sec">
            <h4><i class="fa-solid fa-vial text-purple"></i> Key Test Scenarios Covered</h4>
            <ul class="cs-list">
              ${data.scenarios.map(s => `<li><i class="fa-solid fa-check text-green"></i> ${s}</li>`).join('')}
            </ul>
          </div>

          <div class="cs-sec">
            <h4><i class="fa-solid fa-screwdriver-wrench text-blue"></i> Tools & Technologies Used</h4>
            <div class="cs-tools">
              ${data.tools.map(t => `<span class="chip">${t}</span>`).join('')}
            </div>
          </div>

          <div class="cs-sec">
            <h4><i class="fa-solid fa-lightbulb text-yellow"></i> Key Findings</h4>
            <p>${data.findings}</p>
          </div>

          <div class="cs-sec cs-result-box">
            <h4><i class="fa-solid fa-circle-check text-green"></i> Result / Impact</h4>
            <p>${data.result}</p>
          </div>
        `;
        modal.classList.remove('hidden');
      }
    });
  });

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  }
}

/* -------------------------------------------------------------------------- */
/* 5. Automation Test Simulation Player                                        */
/* -------------------------------------------------------------------------- */
function initAutomationSimulator() {
  const runBtn = document.getElementById('runInteractiveTestBtn');
  const logList = document.getElementById('simLogList');

  if (!runBtn || !logList) return;

  const logs = [
    { text: "🚀 Launching Playwright browser worker (Chromium Headless)...", class: "text-muted" },
    { text: "Navigating to: https://www.woodenstreet.com/lorenz-3-seater-sofa-cotton-jade-ivory", class: "text-cyan" },
    { text: "[PASS] Page loaded in 1.4s (HTTP 200 OK)", class: "text-green" },
    { text: "Executing: CartPage.addToCart()", class: "text-primary" },
    { text: "[PASS] Clicked #button-cart — Item added to session", class: "text-green" },
    { text: "Navigating to: https://www.woodenstreet.com/cart", class: "text-cyan" },
    { text: "[PASS] Asserted: My Cart (1) line item present", class: "text-green" },
    { text: "Auditing Price Breakdown: Subtotal ₹91,999 | Discount -₹42,000 | Payable ₹39,999", class: "text-yellow" },
    { text: "[PASS] Calculation Verified: Total Payable === Subtotal - Discount", class: "text-green" },
    { text: "🎉 1 test passed in 3.2s — 0 Regressions Detected", class: "text-emerald font-bold" }
  ];

  let isRunning = false;

  runBtn.addEventListener('click', () => {
    if (isRunning) return;
    isRunning = true;
    runBtn.disabled = true;
    logList.innerHTML = '';

    let index = 0;
    const interval = setInterval(() => {
      if (index < logs.length) {
        const item = logs[index];
        const div = document.createElement('div');
        div.className = `sim-log ${item.class}`;
        div.innerText = item.text;
        logList.appendChild(div);
        index++;
      } else {
        clearInterval(interval);
        isRunning = false;
        runBtn.disabled = false;
      }
    }, 450);
  });
}

/* -------------------------------------------------------------------------- */
/* 6. API Simulator Console                                                    */
/* -------------------------------------------------------------------------- */
function initApiSimulator() {
  const sendBtn = document.getElementById('sendApiRequestBtn');
  const jsonDisplay = document.getElementById('apiJsonDisplay');

  if (!sendBtn || !jsonDisplay) return;

  const mockResponse = `{
  "status": "success",
  "code": 200,
  "data": {
    "cartId": "CART-98214",
    "couponApplied": "BHARAT79",
    "discountAmount": 10000,
    "originalTotal": 49999,
    "finalPayable": 39999,
    "currency": "INR",
    "isEligible": true
  },
  "message": "Promotional coupon BHARAT79 successfully validated and applied."
}`;

  sendBtn.addEventListener('click', () => {
    sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
    sendBtn.disabled = true;

    setTimeout(() => {
      jsonDisplay.innerHTML = `<code>${mockResponse}</code>`;
      sendBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Request Sent (200 OK)';
      setTimeout(() => {
        sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Request';
        sendBtn.disabled = false;
      }, 2500);
    }, 600);
  });
}

/* -------------------------------------------------------------------------- */
/* 7. Resume Preview & Download Modals                                         */
/* -------------------------------------------------------------------------- */
function initResumeModals() {
  const resumeModal = document.getElementById('resumeModal');
  const closeBtn = document.getElementById('closeResumeBtn');
  const btns = [
    document.getElementById('resumeNavBtn'),
    document.getElementById('heroResumeBtn'),
    document.getElementById('mainResumeBtn')
  ];

  btns.forEach(btn => {
    if (btn && resumeModal) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        resumeModal.classList.remove('hidden');
      });
    }
  });

  if (closeBtn && resumeModal) {
    closeBtn.addEventListener('click', () => {
      resumeModal.classList.add('hidden');
    });

    resumeModal.addEventListener('click', (e) => {
      if (e.target === resumeModal) {
        resumeModal.classList.add('hidden');
      }
    });
  }
}

/* -------------------------------------------------------------------------- */
/* 8. Contact Form Validation & Toast Feedback                                 */
/* -------------------------------------------------------------------------- */
function initContactForm() {
  const form = document.getElementById('contactForm');
  const toast = document.getElementById('formToast');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('contactName');
    const email = document.getElementById('contactEmail');
    const message = document.getElementById('contactMessage');

    const nameErr = document.getElementById('nameError');
    const emailErr = document.getElementById('emailError');
    const msgErr = document.getElementById('messageError');

    let isValid = true;

    if (!name.value.trim()) {
      nameErr.style.display = 'block';
      isValid = false;
    } else {
      nameErr.style.display = 'none';
    }

    if (!email.value.trim() || !email.value.includes('@')) {
      emailErr.style.display = 'block';
      isValid = false;
    } else {
      emailErr.style.display = 'none';
    }

    if (!message.value.trim()) {
      msgErr.style.display = 'block';
      isValid = false;
    } else {
      msgErr.style.display = 'none';
    }

    if (isValid) {
      form.reset();
      if (toast) {
        toast.classList.remove('hidden');
        setTimeout(() => {
          toast.classList.add('hidden');
        }, 4000);
      }
    }
  });
}
