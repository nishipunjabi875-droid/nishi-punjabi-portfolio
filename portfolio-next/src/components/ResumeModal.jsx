'use client';

export default function ResumeModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const handlePrintResume = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="modal-close-btn" aria-label="Close resume modal" onClick={onClose}>
          <i className="fa-solid fa-xmark"></i>
        </button>
        
        <div className="resume-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2><i className="fa-solid fa-file-pdf text-cyan"></i> Nishi Punjabi — QA Engineer Resume</h2>
            <p className="text-muted text-sm">Official Resume • WoodenStreet QA Automation Engineer</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={handlePrintResume} className="btn btn-outline btn-sm">
              <i className="fa-solid fa-print"></i> Print / Save PDF
            </button>
            <a href="mailto:nishipunjabi65@gmail.com?subject=QA%20Opportunity%20-%20Nishi%20Punjabi" className="btn btn-primary btn-sm">
              <i className="fa-solid fa-envelope"></i> Contact Nishi
            </a>
          </div>
        </div>
        
        <div className="resume-modal-body" style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div className="resume-doc" style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-color)', lineHeight: 1.6 }}>
            
            {/* Header */}
            <div className="r-head" style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>NISHI PUNJABI</h1>
              <p style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--primary-cyan)', marginBottom: '0.5rem' }}>
                QA Automation Engineer | Website & Mobile App Testing | Playwright | API & DB Testing
              </p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Udaipur, Rajasthan | +91 7976191632 | <a href="mailto:nishipunjabi65@gmail.com" className="text-cyan">nishipunjabi65@gmail.com</a> | <a href="https://linkedin.com/in/nishi-punjabi-b610b8259" target="_blank" rel="noopener" className="text-cyan">linkedin.com/in/nishi-punjabi-b610b8259</a>
              </p>
            </div>

            {/* Summary */}
            <div className="r-sec" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', marginBottom: '0.75rem', color: 'var(--primary-cyan)' }}>
                PROFESSIONAL SUMMARY
              </h3>
              <p style={{ fontSize: '0.95rem' }}>
                Quality Assurance Engineer with 1 year of experience testing a high-traffic, product-based e-commerce platform (10,000+ SKUs) at WoodenStreet. Skilled in end-to-end functional, regression, and UI/UX testing across web and mobile (Android & iOS), with hands-on ownership of payment gateway validation, CMS data integrity, and refund workflows. Builds Playwright automation suites using the Page Object Model, validates APIs in Postman, and drives defect lifecycle management in JIRA. Known for a strong product mindset, partnering closely with PM and UX teams to catch issues before development begins.
              </p>
            </div>

            {/* Technical Skills */}
            <div className="r-sec" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', marginBottom: '0.75rem', color: 'var(--primary-cyan)' }}>
                TECHNICAL SKILLS
              </h3>
              <div style={{ fontSize: '0.92rem', display: 'grid', gap: '0.4rem' }}>
                <p><strong>Testing Types:</strong> Functional, Regression, Smoke, Sanity, UI/UX, Cross-Browser/Device, Responsive, Exploratory, SQL Injection, Performance Testing</p>
                <p><strong>Application Areas:</strong> Cart, Checkout, Login, Wishlist, Search, Filters, Coupons, EMI, Refunds, Order Tracking, CMS, CRM, Vendor & Franchise</p>
                <p><strong>Automation:</strong> Playwright (JavaScript), Mocha, JMeter, Page Object Model (POM), Cross-Browser Automation, Regression & Smoke Suite Automation</p>
                <p><strong>API & Database:</strong> Postman, REST API Testing, SQL, PostgreSQL, MySQL</p>
                <p><strong>Tools & Methodologies:</strong> JIRA, Git, GitHub, VS Code, Browser DevTools, Lighthouse, PageSpeed Insights | Agile, Scrum, SDLC, STLC</p>
                <p><strong>AI Tools & Other:</strong> Antigravity IDE, Antigravity CLI, Claude, ChatGPT, React Native</p>
              </div>
            </div>

            {/* Agile & JIRA */}
            <div className="r-sec" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', marginBottom: '0.75rem', color: 'var(--primary-cyan)' }}>
                AGILE & JIRA MANAGEMENT
              </h3>
              <ul style={{ fontSize: '0.92rem', paddingLeft: '1.25rem', display: 'grid', gap: '0.35rem' }}>
                <li>Create and maintain JIRA dashboards for sprint tracking, backlog grooming, and release readiness visibility</li>
                <li>Own bug triage and full defect lifecycle management — discovery, severity tagging, reproduction, and closure verification</li>
                <li>Track QA metrics and report release readiness to stakeholders; active participant in daily stand-ups, sprint reviews, and retrospectives</li>
              </ul>
            </div>

            {/* Experience */}
            <div className="r-sec" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', marginBottom: '1rem', color: 'var(--primary-cyan)' }}>
                PROFESSIONAL EXPERIENCE
              </h3>
              
              <div className="r-job" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', fontWeight: 700 }}>
                  <span>Quality Assurance Engineer</span>
                  <span className="text-cyan">September 2025 – Present</span>
                </div>
                <div style={{ fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  WoodenStreet Furniture — Product-Based E-Commerce Company, Udaipur
                </div>
                <ul style={{ fontSize: '0.92rem', paddingLeft: '1.25rem', display: 'grid', gap: '0.4rem' }}>
                  <li>Own end-to-end QA across web and mobile platforms, validating product listing, cart, checkout, and order-management for 10,000+ SKUs across browsers and devices</li>
                  <li>Led end-to-end validation of a new payment gateway rollout covering UPI, Cards, Net Banking, and EMI, including success, failure, retry, and refund flows, ahead of production release</li>
                  <li>Validated the CMS bulk price update flow end-to-end — sheet upload, SKU-to-price mapping validation, price-diff preview, approval/rollback controls, and live PDP verification across web and mobile</li>
                  <li>Tested refund workflows end-to-end — approval, rejection, and bank-detail validation — ensuring accurate financial outcomes across order states</li>
                  <li>Verified CRM data integrity by validating that lead and order data captured on the app and website correctly synced and reflected in CRM records</li>
                  <li>Author and execute Playwright automation scripts using the Page Object Model for regression and critical user-journey flows, and run production smoke testing to sign off on release readiness</li>
                  <li>Partner with Product Managers and UI/UX designers to review feature specs and validate acceptance criteria, surfacing UX gaps pre-development</li>
                  <li>Manage full bug lifecycle in JIRA, cutting developer turnaround time; authored reusable test case templates and defect-reporting standards adopted team-wide</li>
                </ul>
              </div>

              <div className="r-job" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', fontWeight: 700 }}>
                  <span>QA Intern</span>
                  <span className="text-cyan">July 2025 – August 2025</span>
                </div>
                <div style={{ fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  WoodenStreet Furniture — Product-Based E-Commerce Company, Udaipur
                </div>
                <ul style={{ fontSize: '0.92rem', paddingLeft: '1.25rem' }}>
                  <li>Tested product listing, cart, checkout, and order-management flows on web and mobile; created UI-consistency test cases and tracked defects in JIRA with full Agile exposure</li>
                </ul>
              </div>

              <div className="r-job">
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', fontWeight: 700 }}>
                  <span>Mobile App Development Intern</span>
                  <span className="text-cyan">December 2024 – January 2025</span>
                </div>
                <div style={{ fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Marwick Academy for Technical Education (MATE), Udaipur
                </div>
                <ul style={{ fontSize: '0.92rem', paddingLeft: '1.25rem' }}>
                  <li>Built React Native features for a mobile application, gaining hands-on developer perspective that now informs more targeted, empathetic QA and test design</li>
                </ul>
              </div>
            </div>

            {/* Key Projects */}
            <div className="r-sec" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', marginBottom: '0.75rem', color: 'var(--primary-cyan)' }}>
                KEY PROJECTS
              </h3>
              <ul style={{ fontSize: '0.92rem', paddingLeft: '1.25rem', display: 'grid', gap: '0.5rem' }}>
                <li><strong>Duplicate Customer Prevention Suite:</strong> Authored a 74-test-case Excel workbook covering duplicate customer detection across all account creation channels, with mobile OTP as the sole authentication mechanism</li>
                <li><strong>Lead Form Regression Suite:</strong> Built 8 Playwright test suites (A–H) with reusable helpers covering all 33 lead form types sourced from a master spec, standardizing regression coverage</li>
                <li><strong>Mattress Combo Offer Validation:</strong> Designed test cases for cm/inch size detection, sofa-cum-bed exclusion, and two-mattress false-positive regression, with price validation against 12 SKU codes</li>
                <li><strong>Order Data & Payment Audit:</strong> Built multi-layer financial audit workbooks reconciling internal order math, payment amounts, and payment gateway records</li>
                <li><strong>Support Ticket & My Account UX Analysis:</strong> Analyzed 300+ support tickets to identify self-service gaps, benchmarked against Amazon/Flipkart/Myntra, and built a redesigned order-detail page mockup to drive ticket deflection</li>
              </ul>
            </div>

            {/* Key Achievements */}
            <div className="r-sec" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', marginBottom: '0.75rem', color: 'var(--primary-cyan)' }}>
                KEY ACHIEVEMENTS
              </h3>
              <ul style={{ fontSize: '0.92rem', paddingLeft: '1.25rem', display: 'grid', gap: '0.35rem' }}>
                <li>Authored 74+ test cases and 8 regression suites spanning 33 form types, standardizing QA coverage across account and lead-capture flows</li>
                <li>Validated end-to-end payment gateway rollout (UPI, Cards, Net Banking, EMI) with zero critical defects escaping to production</li>
              </ul>
            </div>

            {/* Education & Certifications */}
            <div className="r-sec">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', marginBottom: '0.75rem', color: 'var(--primary-cyan)' }}>
                EDUCATION & CERTIFICATIONS
              </h3>
              <div style={{ fontSize: '0.92rem', display: 'grid', gap: '0.4rem' }}>
                <p><strong>B.Tech, Computer Science & Engineering (2022 – 2026)</strong> — IET, Mohanlal Sukhadia University (MLSU), Udaipur | CGPA: 8.74</p>
                <p><strong>Certifications:</strong> Android App Development (8-Week Program) — Internshala, Jun 2025 | Google Ads Search Certification — Google, Jun 2025</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
