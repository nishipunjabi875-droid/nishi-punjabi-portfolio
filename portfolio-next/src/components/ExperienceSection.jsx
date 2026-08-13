'use client';

export default function ExperienceSection() {
  return (
    <section className="experience-section section-padding bg-alt" id="experience">
      <div className="container">
        <div className="section-header">
          <span className="section-subtitle">CAREER TRACK RECORD</span>
          <h2 className="section-title">Professional Work Experience</h2>
        </div>

        <div className="timeline-container">
          {/* Role 1 */}
          <div className="timeline-item">
            <div className="timeline-marker"><i className="fa-solid fa-briefcase"></i></div>
            <div className="timeline-content">
              <div className="timeline-header">
                <div>
                  <h3 className="timeline-role">Quality Assurance Engineer</h3>
                  <h4 className="timeline-company">WoodenStreet Furniture — Product-Based E-Commerce Company, Udaipur</h4>
                </div>
                <div className="timeline-date"><i className="fa-regular fa-calendar"></i> September 2025 – Present</div>
              </div>
              
              <ul className="timeline-duties">
                <li><i className="fa-solid fa-circle-check"></i> Own end-to-end QA across web and mobile platforms, validating product listing, cart, checkout, and order-management for 10,000+ SKUs across browsers and devices.</li>
                <li><i className="fa-solid fa-circle-check"></i> Led end-to-end validation of a new payment gateway rollout covering UPI, Cards, Net Banking, and EMI, including success, failure, retry, and refund flows, ahead of production release.</li>
                <li><i className="fa-solid fa-circle-check"></i> Validated the CMS bulk price update flow end-to-end — sheet upload, SKU-to-price mapping validation, price-diff preview, approval/rollback controls, and live PDP verification across web and mobile.</li>
                <li><i className="fa-solid fa-circle-check"></i> Tested refund workflows end-to-end — approval, rejection, and bank-detail validation — ensuring accurate financial outcomes across order states.</li>
                <li><i className="fa-solid fa-circle-check"></i> Verified CRM data integrity by validating that lead and order data captured on the app and website correctly synced and reflected in CRM records.</li>
                <li><i className="fa-solid fa-circle-check"></i> Author and execute Playwright automation scripts using the Page Object Model for regression and critical user-journey flows, and run production smoke testing to sign off on release readiness.</li>
                <li><i className="fa-solid fa-circle-check"></i> Partner with Product Managers and UI/UX designers to review feature specs and validate acceptance criteria, surfacing UX gaps pre-development.</li>
                <li><i className="fa-solid fa-circle-check"></i> Manage full bug lifecycle in JIRA, cutting developer turnaround time; authored reusable test case templates and defect-reporting standards adopted team-wide.</li>
              </ul>

              <div className="timeline-tags">
                <span className="skill-tag">Web & Mobile QA</span>
                <span className="skill-tag">Android & iOS</span>
                <span className="skill-tag">Playwright (POM)</span>
                <span className="skill-tag">Payment Gateway Rollout</span>
                <span className="skill-tag">CMS Bulk Updates</span>
                <span className="skill-tag">Refund Workflows</span>
                <span className="skill-tag">CRM Data Integrity</span>
                <span className="skill-tag">JIRA Agile Triage</span>
              </div>
            </div>
          </div>

          {/* Role 2 */}
          <div className="timeline-item">
            <div className="timeline-marker"><i className="fa-solid fa-graduation-cap"></i></div>
            <div className="timeline-content">
              <div className="timeline-header">
                <div>
                  <h3 className="timeline-role">QA Intern</h3>
                  <h4 className="timeline-company">WoodenStreet Furniture — Product-Based E-Commerce Company, Udaipur</h4>
                </div>
                <div className="timeline-date"><i className="fa-regular fa-calendar"></i> July 2025 – August 2025</div>
              </div>
              
              <ul className="timeline-duties">
                <li><i className="fa-solid fa-circle-check"></i> Tested product listing, cart, checkout, and order-management flows on web and mobile; created UI-consistency test cases and tracked defects in JIRA with full Agile exposure.</li>
              </ul>

              <div className="timeline-tags">
                <span className="skill-tag">Web & Mobile Testing</span>
                <span className="skill-tag">UI Consistency</span>
                <span className="skill-tag">JIRA Bug Tracking</span>
                <span className="skill-tag">Agile Exposure</span>
              </div>
            </div>
          </div>

          {/* Role 3 */}
          <div className="timeline-item">
            <div className="timeline-marker"><i className="fa-solid fa-code"></i></div>
            <div className="timeline-content">
              <div className="timeline-header">
                <div>
                  <h3 className="timeline-role">Mobile App Development Intern</h3>
                  <h4 className="timeline-company">Marwick Academy for Technical Education (MATE), Udaipur</h4>
                </div>
                <div className="timeline-date"><i className="fa-regular fa-calendar"></i> December 2024 – January 2025</div>
              </div>
              
              <ul className="timeline-duties">
                <li><i className="fa-solid fa-circle-check"></i> Built React Native features for a mobile application, gaining hands-on developer perspective that now informs more targeted, empathetic QA and test design.</li>
              </ul>

              <div className="timeline-tags">
                <span className="skill-tag">React Native</span>
                <span className="skill-tag">Mobile App Engineering</span>
                <span className="skill-tag">Targeted QA Design</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
