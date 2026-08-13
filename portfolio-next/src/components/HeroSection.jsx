'use client';
import { useState, useEffect } from 'react';

const roles = [
  "Website & Mobile App QA Specialist",
  "Android & iOS Testing Engineer",
  "Playwright Automation Specialist",
  "API & Payment Gateway Audit QA"
];

const fullName = "Nishi Punjabi";

export default function HeroSection({ onOpenResume }) {
  const [roleIndex, setRoleIndex] = useState(0);
  const [typedName, setTypedName] = useState('');

  // Character-by-character typewriter effect for the name
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < fullName.length) {
        setTypedName(fullName.substring(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 110);

    return () => clearInterval(interval);
  }, []);

  // Role cycle
  useEffect(() => {
    const timer = setInterval(() => {
      setRoleIndex(prev => (prev + 1) % roles.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="hero-section" id="hero">
      <div className="container hero-grid">
        <div className="hero-content">
          <div className="hero-badge">
            <i className="fa-solid fa-shield-halved"></i> QA AUTOMATION ENGINEER | WEB & MOBILE (ANDROID & IOS)
          </div>
          <div className="hero-greeting">
            Hello, I'm 👋 <span className="hero-role-cycle text-cyan" style={{ fontSize: '0.95rem', fontWeight: 500 }}>• {roles[roleIndex]}</span>
          </div>
          <h1 className="hero-name">
            {typedName}<span className="typewriter-cursor">|</span>
          </h1>
          <h2 className="hero-tagline">
            Ensuring Flawless Quality Across <span className="gradient-text">Web & Mobile Apps.</span>
          </h2>
          <p className="hero-description">
            QA Automation Engineer with hands-on expertise in end-to-end testing across <strong>Web, Android & iOS Apps</strong> for a high-traffic e-commerce platform (10,000+ SKUs). Specializing in Playwright automation, payment gateway rollout validation (UPI, Cards, Net Banking, EMI), CMS bulk updates, API testing, and JIRA bug triage.
          </p>

          <div className="hero-actions">
            <a href="#projects" className="btn btn-primary">
              <i className="fa-solid fa-layer-group"></i> View My Work
            </a>
            <button onClick={onOpenResume} className="btn btn-secondary">
              <i className="fa-solid fa-file-pdf"></i> View & Download Resume
            </button>
          </div>

          <div className="hero-contact-links">
            <a href="https://linkedin.com/in/nishi-punjabi-b610b8259" target="_blank" rel="noopener" className="hero-social-link">
              <i className="fa-brands fa-linkedin"></i> LinkedIn <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
            </a>
            <a href="mailto:nishipunjabi65@gmail.com" className="hero-social-link">
              <i className="fa-solid fa-envelope"></i> Email <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
            </a>
            <span className="location-tag"><i className="fa-solid fa-location-dot"></i> Udaipur, Rajasthan | +91 7976191632</span>
          </div>
        </div>

        {/* QA Terminal Dashboard Mockup */}
        <div className="hero-visual">
          <div className="qa-console-card">
            <div className="console-header">
              <div className="console-controls">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
              </div>
              <div className="console-title"><i className="fa-solid fa-terminal"></i> Playwright & App QA Runner — Web & Mobile Suite</div>
              <div className="console-status"><span className="badge-status-running"><i className="fa-solid fa-spinner fa-spin"></i> EXECUTING</span></div>
            </div>
            
            <div className="console-body">
              <div className="console-line text-muted">Running test suites across Web (Chromium/Firefox/Safari) & Mobile (Android/iOS)...</div>
              <div className="console-line"><span className="text-green">[PASS]</span> mobile_app.spec.js › Mobile OTP Auth & Customer Creation</div>
              <div className="console-line"><span className="text-green">[PASS]</span> checkout.spec.js › Add Product to Cart & Verify Price breakdown</div>
              <div className="console-line"><span className="text-green">[PASS]</span> payment.spec.js › Verify UPI, Cards, Net Banking & EMI Gateway rollout</div>
              <div className="console-line"><span className="text-green">[PASS]</span> cms_integrity.spec.js › Bulk Price Update & PDP sync across Web/App</div>
              <div className="console-line"><span className="text-green">[PASS]</span> api.spec.js › POST /api/v1/checkout/apply-coupon [HTTP 200 OK]</div>
              <div className="console-line"><span className="text-cyan">[INFO]</span> Executed 74/74 assertions in 3.8s — 0 Defects escaping to Prod</div>
            </div>

            <div className="console-footer-stats">
              <div className="stat-mini-card">
                <span className="stat-mini-val text-green">100%</span>
                <span className="stat-mini-lbl">Pass Rate</span>
              </div>
              <div className="stat-mini-card">
                <span className="stat-mini-val text-cyan">Web & Mobile</span>
                <span className="stat-mini-lbl">Cross-Platform</span>
              </div>
              <div className="stat-mini-card">
                <span className="stat-mini-val text-purple">Zero Defect</span>
                <span className="stat-mini-lbl">Escaped to Prod</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
