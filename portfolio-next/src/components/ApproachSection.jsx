'use client';

const steps = [
  { num: '01', icon: 'fa-file-contract', title: 'Requirement Analysis', desc: 'Understand business rules, acceptance criteria, dependencies, and edge cases before development begins.' },
  { num: '02', icon: 'fa-sitemap', title: 'Test Planning', desc: 'Define scope, environments, test strategy, risk analysis, and resource allocation across web & mobile.' },
  { num: '03', icon: 'fa-pen-to-square', title: 'Test Case Design', desc: 'Craft detailed positive, negative, boundary, and non-functional test scenarios with expected outcomes.' },
  { num: '04', icon: 'fa-vial-circle-check', title: 'Test Execution', desc: 'Perform structured manual exploratory testing and execute Playwright automated regression suites.' },
  { num: '05', icon: 'fa-bug-slash', title: 'Bug Reporting', desc: 'Reproduce issues consistently, capture evidence, identify severity, and provide clear reproduction steps in JIRA.' },
  { num: '06', icon: 'fa-wrench', title: 'Fix Validation', desc: 'Re-verify resolved defects in staging environments, checking DB records and API payloads.' },
  { num: '07', icon: 'fa-shield-cat', title: 'Regression Testing', desc: 'Run automated regression suites to ensure new feature deployments do not impact existing features.' },
  { num: '08', icon: 'fa-circle-check', title: 'Release Sign-off', desc: 'Perform final production smoke testing and confirm readiness before authorizing release deployment.' }
];

const coverageAreas = [
  { name: 'Product Listing', icon: 'fa-box-open' },
  { name: 'Product Detail Page', icon: 'fa-bag-shopping' },
  { name: 'Search', icon: 'fa-magnifying-glass' },
  { name: 'Filters', icon: 'fa-filter' },
  { name: 'Login', icon: 'fa-user-lock' },
  { name: 'Wishlist', icon: 'fa-heart' },
  { name: 'Cart', icon: 'fa-cart-shopping' },
  { name: 'Checkout', icon: 'fa-credit-card' },
  { name: 'Coupons', icon: 'fa-ticket' },
  { name: 'EMI Plans', icon: 'fa-building-columns' },
  { name: 'Payments', icon: 'fa-money-bill-transfer' },
  { name: 'Refunds', icon: 'fa-hand-holding-dollar' },
  { name: 'Order Tracking', icon: 'fa-truck-fast' },
  { name: 'CMS', icon: 'fa-pen-nib' },
  { name: 'CRM', icon: 'fa-users-gear' },
  { name: 'Vendor Module', icon: 'fa-store' },
  { name: 'Franchise Module', icon: 'fa-shop' },
  { name: 'Mobile App', icon: 'fa-mobile-screen' },
  { name: 'APIs', icon: 'fa-network-wired' },
  { name: 'Database Validation', icon: 'fa-database' }
];

export default function ApproachSection() {
  return (
    <>
      <section className="approach-section section-padding" id="approach">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">STRUCTURED TESTING PROCESS</span>
            <h2 className="section-title">How I Approach Quality</h2>
          </div>

          <div className="workflow-steps">
            {steps.map((s, idx) => (
              <div key={idx} className="workflow-step">
                <div className="step-number">{s.num}</div>
                <div className="step-icon"><i className={`fa-solid ${s.icon}`}></i></div>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="coverage-section section-padding bg-alt">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">END-TO-END SYSTEM KNOWLEDGE</span>
            <h2 className="section-title">E-Commerce Quality Coverage</h2>
          </div>

          <div className="coverage-grid">
            {coverageAreas.map((area, idx) => (
              <div key={idx} className="coverage-item">
                <i className={`fa-solid ${area.icon}`}></i> {area.name}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
