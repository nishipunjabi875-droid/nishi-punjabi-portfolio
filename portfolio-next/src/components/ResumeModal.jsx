'use client';

export default function ResumeModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-lg" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" aria-label="Close resume modal" onClick={onClose}>
          <i className="fa-solid fa-xmark"></i>
        </button>
        
        <div className="resume-modal-header">
          <h2><i className="fa-solid fa-file-lines text-cyan"></i> Nishi Punjabi — QA Engineer Resume</h2>
          <a href="mailto:nishipunjabi65@gmail.com?subject=QA%20Opportunity%20-%20Nishi%20Punjabi" className="btn btn-primary btn-sm">
            <i className="fa-solid fa-paper-plane"></i> Contact Me
          </a>
        </div>
        
        <div className="resume-modal-body">
          <div className="resume-doc">
            <div className="r-head">
              <h1>Nishi Punjabi</h1>
              <p className="r-sub">QA Automation Engineer | Manual, API & Automation Testing</p>
              <p className="r-meta">Udaipur, Rajasthan • nishipunjabi65@gmail.com • linkedin.com/in/nishi-punjabi-b610b8259</p>
            </div>

            <div className="r-sec">
              <h3>PROFESSIONAL SUMMARY</h3>
              <p>QA Automation Engineer with 1+ year of hands-on experience testing high-traffic e-commerce applications across web and mobile platforms. Specialized in functional testing, regression testing, API validation, Playwright automation, payment workflows, and end-to-end quality assurance.</p>
            </div>

            <div className="r-sec">
              <h3>WORK EXPERIENCE</h3>
              <div className="r-job">
                <h4>Quality Assurance Engineer — WoodenStreet Furniture</h4>
                <span className="r-date">September 2025 – Present</span>
                <ul>
                  <li>Own end-to-end QA across web and mobile e-commerce platforms.</li>
                  <li>Test product listing, cart, checkout, order management, and refund workflows.</li>
                  <li>Audit payment gateway flows: UPI, Cards, Net Banking, and No-Cost EMI integrations.</li>
                  <li>Validate CMS bulk price updates and live SKU-to-price mapping on PDPs.</li>
                  <li>Build maintainable Playwright automation suites using Page Object Model (POM).</li>
                  <li>Manage defect lifecycle in JIRA and collaborate daily with Product Managers and UI/UX designers.</li>
                </ul>
              </div>

              <div className="r-job">
                <h4>QA Intern — WoodenStreet Furniture</h4>
                <span className="r-date">July 2025 – August 2025</span>
                <ul>
                  <li>Executed test cases for product listing, cart, checkout, and order management.</li>
                  <li>Created UI consistency test cases and managed bugs in JIRA during Agile Scrum sprints.</li>
                </ul>
              </div>

              <div className="r-job">
                <h4>Mobile App Development Intern — Marwick Academy</h4>
                <span className="r-date">December 2024 – January 2025</span>
                <ul>
                  <li>Built mobile app features using React Native, developing a developer-side understanding for targeted QA.</li>
                </ul>
              </div>
            </div>

            <div className="r-sec">
              <h3>TECHNICAL SKILLS</h3>
              <p><strong>Testing:</strong> Functional, Regression, Mobile App Testing, Smoke, Sanity, UI/UX, Exploratory, Cross-Browser, Cross-Device, Responsive, Performance, SQL Injection</p>
              <p><strong>Automation:</strong> Playwright, JavaScript, Mocha, Page Object Model (POM)</p>
              <p><strong>API & DB:</strong> Postman, REST API Testing, SQL, PostgreSQL, MySQL</p>
              <p><strong>Tools & Methodologies:</strong> JIRA, Git, GitHub, VS Code, Browser DevTools, Agile Scrum, SDLC, STLC</p>
            </div>

            <div className="r-sec">
              <h3>EDUCATION & CERTIFICATIONS</h3>
              <p><strong>B.Tech in Computer Science & Engineering</strong> — IET, MLSU, Udaipur (2022–2026) | CGPA: 8.74</p>
              <p><strong>Certifications:</strong> Android App Development (Internshala, June 2025) • Google Ads Search Certification (Google, June 2025)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
