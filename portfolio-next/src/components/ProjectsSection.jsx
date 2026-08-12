'use client';
import { useState } from 'react';
import CaseStudyModal from './CaseStudyModal';

const projectsList = [
  {
    id: 1,
    title: "Duplicate Customer Prevention Suite",
    type: "Security & Authentication",
    badgeCount: "74 Test Cases",
    desc: "Designed a comprehensive 74-test-case Excel test suite covering duplicate customer detection across account creation channels using mobile OTP authentication.",
    problemSummary: "Duplicate accounts created via mixed mobile OTP & email channels.",
    outcomeSummary: "Eliminated duplicate profile generation across account workflows.",
    tags: ["Test Design", "Regression", "Excel", "OTP", "Edge Cases"],
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

  {
    id: 2,
    title: "Lead Form Regression Automation",
    type: "Test Automation",
    badgeCount: "8 Suites • 33 Forms",
    desc: "Built 8 Playwright regression suites with reusable helpers covering all 33 lead form types from a master specification.",
    problemSummary: "Manual regression of 33 lead form variants was time-consuming.",
    outcomeSummary: "100% lead form validation covered in automated CI pipeline.",
    tags: ["Playwright", "JavaScript", "Automation", "Regression", "POM"],
    category: "Test Automation Engineering",
    objective: "Automate end-to-end regression validation for all 33 lead form types across web and mobile viewports.",
    problem: "Manual testing of 33 lead forms (Consultation, Franchise, Bulk Order, Studio Visit, etc.) before every deployment required over 12 hours of manual execution.",
    strategy: "Architected 8 Playwright test suites using the Page Object Model (POM). Created reusable helper libraries (leadforms-helper.js) to handle dynamic modal triggers, phone verification, pincode lookups, and submit assertions.",
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

  {
    id: 3,
    title: "Payment Audit & Verification Automation",
    type: "Financial & API QA",
    badgeCount: "Multi-Layer Audit",
    desc: "Built multi-layer financial audit workflows to reconcile internal order calculations, payment amounts, and payment gateway records, including database-to-gateway verification.",
    problemSummary: "Discrepancies in cart calculations, EMI fees, and gateway payloads.",
    outcomeSummary: "Automated financial audit ensuring 100% payment reconciliation.",
    tags: ["Payment Testing", "SQL", "API", "Automation", "Database"],
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

  {
    id: 4,
    title: "Mattress Combo Offer Validation",
    type: "Pricing & E-Commerce",
    badgeCount: "12 SKU Codes Tested",
    desc: "Designed test scenarios for mattress combination offers, including size detection, sofa-cum-bed exclusions, multiple-mattress false positives, and SKU-level price validation.",
    problemSummary: "False-positive discount triggers on invalid mattress combinations.",
    outcomeSummary: "Validated exact SKU combo logic and pricing rules.",
    tags: ["E-commerce", "Functional Testing", "Edge Cases", "Pricing"],
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
    title: "Sitewide Sale & Promotions Automation",
    type: "Sales & Promotions",
    badgeCount: "Sitewide Coverage",
    desc: "Automated validation of monthly banner updates and sitewide coupon and sale accuracy across desktop and mobile views.",
    problemSummary: "Manual check of promotional banners and coupon codes was error-prone.",
    outcomeSummary: "Automated banner redirection & discount verification.",
    tags: ["Playwright", "Automation", "Coupons", "Regression"],
    category: "Automation & E-Commerce",
    objective: "Automate sitewide banner redirection verification and promotional coupon code validation during monthly sale launches.",
    problem: "Monthly sales required verifying over 150 banner links and coupon codes across desktop and mobile views before sale go-live.",
    strategy: "Built automated Playwright scripts (sale_validation_prod.spec.js) that scan hero banners, mid-page deals, category banners, and test coupon applications (BHARAT79, WELCOME10).",
    scenarios: [
      "HTTP 200 OK verification for all banner target URLs.",
      "Coupon code discount application on cart page.",
      "Banner image aspect ratio and responsive rendering check."
    ],
    tools: ["Playwright", "JavaScript", "Excel Reporter", "Node.js"],
    findings: "Caught 14 broken banner redirection links prior to public sale launch.",
    result: "Reduced sale launch verification time by 85% with zero broken links on production release."
  },

  {
    id: 6,
    title: "Support Ticket & My Account UX Analysis",
    type: "UX & Support Analysis",
    badgeCount: "300+ Tickets Analyzed",
    desc: "Analyzed 300+ support tickets to identify self-service opportunities and benchmarked the experience against major e-commerce platforms.",
    problemSummary: "High ticket volume regarding order updates & address changes.",
    outcomeSummary: "Provided UX recommendation report to product team for self-service portal.",
    tags: ["UX Testing", "Analytics", "E-commerce", "Product QA"],
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
