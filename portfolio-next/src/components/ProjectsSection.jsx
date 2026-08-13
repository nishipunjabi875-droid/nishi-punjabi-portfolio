'use client';
import { useState } from 'react';
import CaseStudyModal from './CaseStudyModal';

const projectsList = [
  {
    id: 1,
    title: "Duplicate Customer Prevention Suite",
    type: "Security & Mobile OTP Authentication",
    badgeCount: "74 Test Cases",
    desc: "Authored a 74-test-case Excel workbook covering duplicate customer detection across all account creation channels on web and mobile apps, with mobile OTP as the sole authentication mechanism.",
    problemSummary: "Duplicate profile creation across web, mobile web, and mobile app OTP entry points.",
    outcomeSummary: "100% test coverage resulting in zero duplicate profile registrations.",
    tags: ["Web & Mobile OTP", "Android & iOS", "Excel Matrix", "74 Test Cases", "Edge Cases"],
    category: "Security & Account QA",
    objective: "Design a comprehensive test suite to validate duplicate customer account prevention across mobile OTP and email registration channels.",
    problem: "When users created accounts through mobile OTP, app login, or traditional web checkout, edge cases allowed duplicate profile generation, causing fragmented order histories and CRM discrepancies.",
    strategy: "Mapped all user onboarding entry points into a matrix. Authored 74 structured test cases covering single-input, cross-channel, simultaneous registration, and boundary OTP input scenarios.",
    scenarios: [
      "Mobile OTP registration on Android/iOS app with existing registered email.",
      "Email registration with mobile number already bound to app account.",
      "Concurrent registration requests using identical phone number.",
      "OTP expiration and invalid session retry bounds."
    ],
    tools: ["Excel Test Matrix", "JIRA", "Postman", "Android & iOS Testing"],
    findings: "Uncovered 3 critical edge cases where SMS gateway delays allowed bypass of duplicate phone checks during high-concurrency sale events.",
    result: "Achieved 100% test coverage for customer onboarding, resulting in zero duplicate profile registrations in subsequent release builds."
  },

  {
    id: 2,
    title: "Lead Form Regression Automation Suite",
    type: "Test Automation (Web & Mobile)",
    badgeCount: "8 Suites • 33 Forms",
    desc: "Built 8 Playwright test suites (A–H) with reusable helpers covering all 33 lead form types sourced from a master spec across web and mobile viewports.",
    problemSummary: "Manual regression of 33 lead form variants on web and mobile was time-consuming.",
    outcomeSummary: "Standardized regression coverage, reducing execution from 12 hours to minutes.",
    tags: ["Playwright", "Page Object Model", "Web & Mobile Viewports", "33 Form Types"],
    category: "Test Automation Engineering",
    objective: "Automate end-to-end regression validation for all 33 lead form types across web and mobile viewports.",
    problem: "Manual testing of 33 lead forms (Consultation, Franchise, Bulk Order, Studio Visit, etc.) before every deployment required over 12 hours of manual execution.",
    strategy: "Architected 8 Playwright test suites using the Page Object Model (POM). Created reusable helper libraries (leadforms-helper.js) to handle dynamic modal triggers, phone verification, pincode lookups, and submit assertions.",
    scenarios: [
      "Validation of required input field boundaries across all 33 forms.",
      "Modal overlay dismissal and responsive drawer rendering on mobile app viewports.",
      "Form submission API payload structure and response validation.",
      "Post-submit thank-you modal state & CRM lead ingestion."
    ],
    tools: ["Playwright", "JavaScript", "Page Object Model", "Node.js", "Git"],
    findings: "Identified 4 forms where submit button handlers froze on slow 3G mobile networks due to unhandled promise rejections.",
    result: "Reduced lead form regression execution time from 12 hours to 3.5 minutes in automated CI runs."
  },

  {
    id: 3,
    title: "Order Data & Payment Rollout Audit",
    type: "Financial & Gateway QA",
    badgeCount: "UPI, Cards, NetBanking, EMI",
    desc: "Led end-to-end validation of a new payment gateway rollout covering UPI, Cards, Net Banking, and EMI (including success, failure, retry, and refund flows) ahead of production release.",
    problemSummary: "Complex multi-payment gateway rollout requiring zero escaped defects.",
    outcomeSummary: "Validated gateway rollout with zero critical defects escaping to production.",
    tags: ["Payment Gateway Rollout", "UPI & Cards", "EMI & Refunds", "SQL Audit", "API QA"],
    category: "Financial & Gateway QA",
    objective: "Automate financial audit reconciliation between shopping cart calculations, backend order payloads, and payment gateway responses across web and mobile.",
    problem: "Occasional discrepancies between cart subtotal discounts, EMI interest rates, and final payment gateway transaction totals caused user checkout drop-offs.",
    strategy: "Built multi-layer automated audit workflows that scrape cart price breakdown elements, compare line-item totals against database records, and verify payment gateway iframe payloads.",
    scenarios: [
      "Subtotal = Line Items Sum - Coupon Discount + Shipping Fee.",
      "Payment gateway payload amount matching checkout total in paisa.",
      "No-Cost EMI bank interest discount calculation verification.",
      "Refund workflow end-to-end validation — approval, rejection, and bank-detail verification."
    ],
    tools: ["Playwright", "Postman", "SQL", "MySQL", "Browser DevTools"],
    findings: "Discovered rounding discrepancy in 3-bank No-Cost EMI calculations where fractional rupee values caused payment gateway payload mismatch.",
    result: "Validated end-to-end payment gateway rollout with zero critical defects escaping to production."
  },

  {
    id: 4,
    title: "Mattress Combo Offer Validation",
    type: "Pricing & E-Commerce",
    badgeCount: "12 SKU Codes Tested",
    desc: "Designed test cases for cm/inch size detection, sofa-cum-bed exclusion, and two-mattress false-positive regression, with price validation against 12 SKU codes.",
    problemSummary: "False-positive discount triggers on invalid mattress combinations.",
    outcomeSummary: "Validated exact SKU combo logic and pricing rules.",
    tags: ["E-commerce", "Functional QA", "Size Detection", "12 SKU Codes"],
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

  {
    id: 5,
    title: "CMS Bulk Price Update & PDP Integrity",
    type: "CMS & Live Platform QA",
    badgeCount: "Web & Mobile PDP Sync",
    desc: "Validated the CMS bulk price update flow end-to-end — sheet upload, SKU-to-price mapping validation, price-diff preview, approval/rollback controls, and live PDP verification across web and mobile.",
    problemSummary: "Bulk price update errors propagating to live product detail pages.",
    outcomeSummary: "100% price accuracy verified across web and mobile apps.",
    tags: ["CMS Bulk Update", "PDP Verification", "Web & Mobile Apps", "Data Integrity"],
    category: "CMS & Live Data QA",
    objective: "Validate CMS bulk sheet upload, SKU price diff preview, rollback controls, and live PDP price sync across web and mobile.",
    problem: "Mass promotional price updates via CMS bulk Excel uploads occasionally caused incorrect SKU-to-price mapping or failed to reflect on mobile apps.",
    strategy: "Executed end-to-end validation covering upload file parsing, price differential preview warnings, approval workflow, instant rollback safety, and automated live PDP verification.",
    scenarios: [
      "CMS Excel sheet upload parsing and header validation.",
      "SKU-to-price mapping and price difference preview accuracy.",
      "Approval/Rollback control triggers.",
      "Live PDP price verification across desktop, mobile web, Android & iOS."
    ],
    tools: ["Playwright", "Postman", "Excel", "CMS Admin", "DevTools"],
    findings: "Caught 14 mismapped SKU price overrides during high-volume sitewide sale prep.",
    result: "Ensured 100% data integrity and seamless price updates across 10,000+ SKUs on web and mobile."
  },

  {
    id: 6,
    title: "Support Ticket & My Account UX Analysis",
    type: "UX & Support Deflection",
    badgeCount: "300+ Tickets Benchmark",
    desc: "Analyzed 300+ support tickets to identify self-service gaps, benchmarked against Amazon/Flipkart/Myntra, and built a redesigned order-detail page mockup to drive ticket deflection.",
    problemSummary: "High ticket volume regarding order updates & address modifications.",
    outcomeSummary: "Redesigned order-detail page mockup driving self-service deflection.",
    tags: ["300+ Support Tickets", "UX Analysis", "Amazon/Flipkart Benchmark", "Order Detail"],
    category: "Product & UX QA",
    objective: "Analyze customer support tickets to identify recurring UX friction points and benchmark self-service portal capabilities against industry leaders.",
    problem: "High volume of customer support tickets requesting address modifications, delivery updates, and order tracking.",
    strategy: "Analyzed 300+ support tickets to categorize root causes. Benchmarked 'My Account' self-service features against Amazon, Flipkart, and Myntra.",
    scenarios: [
      "Self-service order tracking workflow analysis.",
      "Post-order shipping address edit validation.",
      "Invoice download accessibility check."
    ],
    tools: ["JIRA Service Desk", "UX Analytics", "Benchmarking", "Figma Mockup"],
    findings: "Found that 42% of tickets resulted from difficulty editing shipping address post-order placement.",
    result: "Built redesigned order-detail page mockup adopted by Product team to drive self-service ticket deflection."
  }
];

export default function ProjectsSection() {
  const [selectedProject, setSelectedProject] = useState(null);

  return (
    <section className="projects-section section-padding bg-alt" id="projects">
      <div className="container">
        <div className="section-header">
          <span className="section-subtitle">PORTFOLIO OF REAL QA WORK</span>
          <h2 className="section-title">Featured QA Projects</h2>
        </div>

        <div className="projects-grid">
          {projectsList.map(p => (
            <div key={p.id} className="project-card">
              <div>
                <div className="project-card-header">
                  <span className="project-type"><i className="fa-solid fa-cube"></i> {p.type}</span>
                  <span className="project-badge-count">{p.badgeCount}</span>
                </div>
                <h3 className="project-title">{p.title}</h3>
                <p className="project-desc">{p.desc}</p>

                <div className="project-meta-grid">
                  <div className="meta-item">
                    <span className="meta-lbl">Problem</span>
                    <span className="meta-val">{p.problemSummary}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-lbl">Outcome</span>
                    <span className="meta-val">{p.outcomeSummary}</span>
                  </div>
                </div>

                <div className="project-tags">
                  {p.tags.map((t, idx) => (
                    <span key={idx} className="tag">{t}</span>
                  ))}
                </div>
              </div>

              <button className="btn btn-outline btn-full" onClick={() => setSelectedProject(p)}>
                View Case Study <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          ))}
        </div>
      </div>

      {selectedProject && (
        <CaseStudyModal project={selectedProject} onClose={() => setSelectedProject(null)} />
      )}
    </section>
  );
}
