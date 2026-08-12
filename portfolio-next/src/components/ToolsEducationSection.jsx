'use client';

export default function ToolsEducationSection() {
  return (
    <>
      <section className="tools-section section-padding">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">DAILY QA TOOLING</span>
            <h2 className="section-title">Tools & Workflow Ecosystem</h2>
          </div>

          <div className="tools-categories-grid">
            <div className="tool-cat-card">
              <h4><i className="fa-solid fa-terminal text-cyan"></i> Automation & Coding</h4>
              <div className="tool-chips">
                <span className="chip"><i className="fa-solid fa-play text-green"></i> Playwright</span>
                <span className="chip"><i className="fa-brands fa-js text-yellow"></i> JavaScript</span>
                <span className="chip"><i className="fa-solid fa-mug-hot text-orange"></i> Mocha</span>
                <span className="chip"><i className="fa-solid fa-code text-blue"></i> VS Code</span>
              </div>
            </div>

            <div className="tool-cat-card">
              <h4><i className="fa-solid fa-bolt text-orange"></i> API & Performance</h4>
              <div className="tool-chips">
                <span className="chip"><i className="fa-solid fa-bolt text-orange"></i> Postman</span>
                <span className="chip"><i className="fa-solid fa-gauge-high text-cyan"></i> JMeter</span>
                <span className="chip"><i className="fa-solid fa-chart-line text-green"></i> Lighthouse</span>
                <span className="chip"><i className="fa-solid fa-bolt-lightning text-yellow"></i> PageSpeed Insights</span>
              </div>
            </div>

            <div className="tool-cat-card">
              <h4><i className="fa-solid fa-database text-blue"></i> Data & Repositories</h4>
              <div className="tool-chips">
                <span className="chip"><i className="fa-solid fa-database text-blue"></i> SQL</span>
                <span className="chip"><i className="fa-solid fa-server text-cyan"></i> PostgreSQL</span>
                <span className="chip"><i className="fa-solid fa-database text-orange"></i> MySQL</span>
                <span className="chip"><i className="fa-brands fa-git-alt text-red"></i> Git</span>
                <span className="chip"><i className="fa-brands fa-github text-purple"></i> GitHub</span>
              </div>
            </div>

            <div className="tool-cat-card">
              <h4><i className="fa-solid fa-list-check text-green"></i> Management & Ecosystem</h4>
              <div className="tool-chips">
                <span className="chip"><i className="fa-brands fa-jira text-blue"></i> JIRA</span>
                <span className="chip"><i className="fa-solid fa-mobile-screen-button text-emerald"></i> Mobile App Testing</span>
                <span className="chip"><i className="fa-solid fa-sliders text-cyan"></i> DevTools</span>
                <span className="chip"><i className="fa-solid fa-robot text-purple"></i> Antigravity CLI</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="education-section section-padding bg-alt">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">ACADEMIC & PROFESSIONAL CREDENTIALS</span>
            <h2 className="section-title">Education & Certifications</h2>
          </div>

          <div className="edu-grid">
            <div className="edu-card">
              <div className="edu-icon"><i className="fa-solid fa-graduation-cap"></i></div>
              <div className="edu-content">
                <span className="edu-badge">DEGREE</span>
                <h3>B.Tech — Computer Science & Engineering</h3>
                <h4>IET, Mohanlal Sukhadia University (MLSU), Udaipur</h4>
                <div className="edu-meta">
                  <span><i className="fa-regular fa-calendar"></i> 2022 – 2026</span>
                  <span className="cgpa-badge"><i className="fa-solid fa-star"></i> CGPA: 8.74</span>
                </div>
              </div>
            </div>

            <div className="cert-column">
              <div className="cert-card">
                <div className="cert-icon"><i className="fa-solid fa-mobile-screen"></i></div>
                <div>
                  <h3>Android App Development</h3>
                  <p>Internshala (8-Week Program) • June 2025</p>
                </div>
              </div>

              <div className="cert-card">
                <div className="cert-icon"><i className="fa-brands fa-google"></i></div>
                <div>
                  <h3>Google Ads Search Certification</h3>
                  <p>Google • June 2025</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
