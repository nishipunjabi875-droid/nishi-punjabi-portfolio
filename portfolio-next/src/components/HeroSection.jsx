'use client';
import { useState, useEffect } from 'react';

const roles = [
  "Playwright Automation Specialist",
  "Mobile App Testing Specialist",
  "API & Payload QA Engineer",
  "E-Commerce Payment Audit QA"
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
            <i className="fa-solid fa-shield-halved"></i> QA AUTOMATION ENGINEER
          </div>
          <div className="hero-greeting">
            Hello, I'm 👋 <span className="hero-role-cycle text-cyan" style={{ fontSize: '0.95rem', fontWeight: 500 }}>• {roles[roleIndex]}</span>
          </div>
          <h1 className="hero-name">
            {typedName}<span className="typewriter-cursor">|</span>
          </h1>
          <h2 className="hero-tagline">
            Breaking Bugs Before They Reach <span className="gradient-text">Production.</span>
          </h2>
          <p className="hero-description">
            A dedicated QA Automation Engineer specializing in high-traffic e-commerce applications across web and mobile. I focus on functional testing, regression automation, Playwright test suites, API validation, payment workflows, and end-to-end quality assurance.
          </p>

          <div className="hero-actions">
            <a href="#projects" className="btn btn-primary">
              <i className="fa-solid fa-layer-group"></i> View My Work
            </a>
            <button onClick={onOpenResume} className="btn btn-secondary">
              <i className="fa-solid fa-download"></i> Download Resume
            </button>
          </div>

          <div className="hero-contact-links">
            <a href="https://linkedin.com/in/nishi-punjabi-b610b8259" target="_blank" rel="noopener" className="hero-social-link">
              <i className="fa-brands fa-linkedin"></i> LinkedIn <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
            </a>
            <a href="mailto:nishipunjabi65@gmail.com" className="hero-social-link">
              <i className="fa-solid fa-envelope"></i> Email <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
            </a>
            <span className="location-tag"><i className="fa-solid fa-location-dot"></i> Udaipur, Rajasthan, India</span>
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
              <div className="console-title"><i className="fa-solid fa-terminal"></i> Playwright Test Runner — E-Commerce Suite</div>
              <div className="console-status"><span className="badge-status-running"><i className="fa-solid fa-spinner fa-spin"></i> EXECUTING</span></div>
            </div>
            
            <div className="console-body">
              <div className="console-line text-muted">Running 8 test suites across Chromium, Firefox, WebKit...</div>
              <div className="console-line"><span className="text-green">[PASS]</span> checkout.spec.js › Add Product to Cart & Verify Price breakdown</div>
              <div className="console-line"><span className="text-green">[PASS]</span> payment.spec.js › Verify Razorpay UPI & Card Payment Gateway flow</div>
              <div className="console-line"><span className="text-green">[PASS]</span> api.spec.js › POST /api/v1/checkout/apply-coupon [HTTP 200 OK]</div>
              <div className="console-line"><span className="text-yellow">[RETRY]</span> leadforms.spec.js › Verify OTP verification form validation</div>
              <div className="console-line"><span className="text-green">[PASS]</span> leadforms.spec.js › Verify OTP verification form validation (Resolved)</div>
              <div className="console-line"><span className="text-cyan">[INFO]</span> Executed 74/74 assertions in 4.2s — 0 Regressions</div>
            </div>

            <div className="console-footer-stats">
              <div className="stat-mini-card">
                <span className="stat-mini-val text-green">100%</span>
                <span className="stat-mini-lbl">Pass Rate</span>
              </div>
              <div className="stat-mini-card">
                <span className="stat-mini-val text-cyan">74+</span>
                <span className="stat-mini-lbl">Assertions</span>
              </div>
              <div className="stat-mini-card">
                <span className="stat-mini-val text-purple">200 OK</span>
                <span className="stat-mini-lbl">API Status</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
