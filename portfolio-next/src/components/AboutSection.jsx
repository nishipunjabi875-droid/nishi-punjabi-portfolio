'use client';

export default function AboutSection() {
  return (
    <section className="about-section section-padding" id="about">
      <div className="container">
        <div className="section-header">
          <span className="section-subtitle">ABOUT MY QA PHILOSOPHY</span>
          <h2 className="section-title">Quality is not just finding bugs. <span className="gradient-text">It's preventing them.</span></h2>
        </div>

        <div className="about-grid">
          <div className="about-card main-about-card">
            <p className="about-lead">
              Quality Assurance Engineer with 1 year of experience testing a high-traffic, product-based e-commerce platform (10,000+ SKUs) at WoodenStreet. Skilled in end-to-end functional, regression, and UI/UX testing across <strong>web and mobile platforms (Android & iOS)</strong>, with hands-on ownership of payment gateway validation, CMS data integrity, and refund workflows.
            </p>
            <p className="about-sub">
              I build Playwright automation suites using the Page Object Model, validate REST APIs in Postman, and drive full defect lifecycle management in JIRA. With a background as a Mobile App Development Intern (React Native), I bring a strong developer perspective to partner closely with PM and UI/UX teams to catch issues before development begins.
            </p>

            <div className="current-role-banner">
              <div className="role-badge-icon"><i className="fa-solid fa-building-user"></i></div>
              <div className="role-details">
                <h4>Quality Assurance Engineer (Website & Mobile App Testing)</h4>
                <p>WoodenStreet Furniture — Product-Based E-Commerce Company | Sept 2025 – Present</p>
              </div>
            </div>
          </div>

          <div className="product-mindset-container">
            <h3 className="mindset-title"><i className="fa-solid fa-brain"></i> The QA Product & Engineering Mindset</h3>
            
            <div className="mindset-grid">
              <div className="mindset-card">
                <div className="mindset-icon"><i className="fa-solid fa-mobile-screen-button"></i></div>
                <h4>Web & Mobile App Coverage</h4>
                <p>Ensuring seamless functionality, performance, and UI/UX consistency across Browsers, Android & iOS Apps.</p>
              </div>

              <div className="mindset-card">
                <div className="mindset-icon"><i className="fa-solid fa-credit-card"></i></div>
                <h4>Payment & Financial Integrity</h4>
                <p>End-to-end validation of payment gateways (UPI, Cards, Net Banking, EMI) and refund workflows with zero escape defects.</p>
              </div>

              <div className="mindset-card">
                <div className="mindset-icon"><i className="fa-solid fa-bug"></i></div>
                <h4>Full Defect Lifecycle in JIRA</h4>
                <p>Isolating root causes, capturing payloads, tagging severity, authoring reusable templates, and driving fast resolution.</p>
              </div>

              <div className="mindset-card">
                <div className="mindset-icon"><i className="fa-solid fa-rotate-left"></i></div>
                <h4>Zero Defect Escapes</h4>
                <p>Automating Playwright smoke/regression suites using POM to sign off release readiness with 100% confidence.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
