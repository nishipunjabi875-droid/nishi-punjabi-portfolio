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
              I own end-to-end Quality Assurance across high-traffic web and mobile e-commerce platforms. My scope spans critical business workflows including Product Listing, Cart, Checkout, Order Management, Payment Gateways, Refunds, CMS, CRM, and customer-facing interactions.
            </p>
            <p className="about-sub">
              Rather than testing only after development completes, I work closely with Product Managers and UI/UX Designers during requirement breakdown to validate acceptance criteria, uncover edge cases, and eliminate flaws before a single line of code is written.
            </p>

            <div className="current-role-banner">
              <div className="role-badge-icon"><i className="fa-solid fa-building-user"></i></div>
              <div className="role-details">
                <h4>Quality Assurance Engineer</h4>
                <p>WoodenStreet Furniture • Sept 2025 – Present (1+ year total QA experience)</p>
              </div>
            </div>
          </div>

          <div className="product-mindset-container">
            <h3 className="mindset-title"><i className="fa-solid fa-brain"></i> The QA Product Mindset</h3>
            
            <div className="mindset-grid">
              <div className="mindset-card">
                <div className="mindset-icon"><i className="fa-solid fa-user-check"></i></div>
                <h4>User Perspective First</h4>
                <p>Evaluating workflows from real customer journeys across devices, viewports, and network conditions.</p>
              </div>

              <div className="mindset-card">
                <div className="mindset-icon"><i className="fa-solid fa-magnifying-glass-chart"></i></div>
                <h4>Edge Case Detection</h4>
                <p>Uncovering subtle logic gaps, invalid inputs, false positives, and boundary conditions before release.</p>
              </div>

              <div className="mindset-card">
                <div className="mindset-icon"><i className="fa-solid fa-bug"></i></div>
                <h4>Consistent Reproduction</h4>
                <p>Isolating root causes, capturing logs & network payloads, and creating crisp reproduction steps in JIRA.</p>
              </div>

              <div className="mindset-card">
                <div className="mindset-icon"><i className="fa-solid fa-rotate-left"></i></div>
                <h4>Zero Regression</h4>
                <p>Automating smoke and regression suites to ensure past fixes remain intact across fast-paced deployments.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
