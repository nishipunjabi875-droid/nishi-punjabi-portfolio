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
                  <h4 className="timeline-company">WoodenStreet Furniture</h4>
                </div>
                <div className="timeline-date"><i className="fa-regular fa-calendar"></i> September 2025 – Present</div>
              </div>
              
              <ul className="timeline-duties">
                <li><i className="fa-solid fa-circle-check"></i> Own end-to-end QA across web and mobile platforms for high-traffic e-commerce operations.</li>
                <li><i className="fa-solid fa-circle-check"></i> Test product listing, cart, checkout, and order management modules to ensure seamless transaction flows.</li>
                <li><i className="fa-solid fa-circle-check"></i> Validate applications across diverse browsers (Chrome, Firefox, Edge, Safari) and mobile viewports.</li>
                <li><i className="fa-solid fa-circle-check"></i> Audit complex payment gateway flows including UPI, Credit/Debit Cards, Net Banking, and No-Cost EMI integrations.</li>
                <li><i className="fa-solid fa-circle-check"></i> Rigorously validate transaction success, failure retry handling, fallback modes, and refund workflows.</li>
                <li><i className="fa-solid fa-circle-check"></i> Validate CMS bulk price updates, verifying live SKU-to-price mapping and PDP promotional consistency.</li>
                <li><i className="fa-solid fa-circle-check"></i> Test customer refund workflows and ensure backend CRM data integrity across customer accounts.</li>
                <li><i className="fa-solid fa-circle-check"></i> Build maintainable Playwright automation test suites using the Page Object Model (POM) architecture.</li>
                <li><i className="fa-solid fa-circle-check"></i> Perform production smoke testing, manage defect lifecycles in JIRA, and collaborate daily with PMs and UI/UX teams.</li>
              </ul>

              <div className="timeline-tags">
                <span className="skill-tag">Playwright</span>
                <span className="skill-tag">Page Object Model</span>
                <span className="skill-tag">Payment Gateways</span>
                <span className="skill-tag">E-commerce QA</span>
                <span className="skill-tag">REST API</span>
                <span className="skill-tag">JIRA</span>
                <span className="skill-tag">CMS & CRM</span>
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
                  <h4 className="timeline-company">WoodenStreet Furniture</h4>
                </div>
                <div className="timeline-date"><i className="fa-regular fa-calendar"></i> July 2025 – August 2025</div>
              </div>
              
              <ul className="timeline-duties">
                <li><i className="fa-solid fa-circle-check"></i> Executed functional test cases for product listing, cart, checkout, and order management modules.</li>
                <li><i className="fa-solid fa-circle-check"></i> Created comprehensive UI consistency test cases across responsive screen resolutions.</li>
                <li><i className="fa-solid fa-circle-check"></i> Logged, categorized, and tracked software bugs throughout the JIRA defect lifecycle in an Agile Scrum environment.</li>
              </ul>

              <div className="timeline-tags">
                <span className="skill-tag">Functional Testing</span>
                <span className="skill-tag">UI Testing</span>
                <span className="skill-tag">JIRA</span>
                <span className="skill-tag">Agile Scrum</span>
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
                  <h4 className="timeline-company">Marwick Academy for Technical Education</h4>
                </div>
                <div className="timeline-date"><i className="fa-regular fa-calendar"></i> December 2024 – January 2025</div>
              </div>
              
              <ul className="timeline-duties">
                <li><i className="fa-solid fa-circle-check"></i> Worked directly with React Native framework to build mobile application components and state logic.</li>
                <li><i className="fa-solid fa-circle-check"></i> Developed a deep developer-side code understanding that directly informs targeted QA, unit boundary checks, and effective test design.</li>
              </ul>

              <div className="timeline-tags">
                <span className="skill-tag">React Native</span>
                <span className="skill-tag">Mobile Engineering</span>
                <span className="skill-tag">JavaScript</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
