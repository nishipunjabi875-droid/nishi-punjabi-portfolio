'use client';
import { useState } from 'react';

const skillsData = [
  // Mobile & App Testing
  { name: 'Android App Testing', icon: 'fa-brands fa-android', color: 'text-green', category: 'mobile' },
  { name: 'iOS App Testing', icon: 'fa-brands fa-apple', color: 'text-cyan', category: 'mobile' },
  { name: 'Mobile Web & Responsive QA', icon: 'fa-solid fa-mobile-screen-button', color: 'text-purple', category: 'mobile' },
  { name: 'React Native (App Dev Context)', icon: 'fa-brands fa-react', color: 'text-cyan', category: 'mobile' },
  { name: 'Mobile OTP Authentication', icon: 'fa-solid fa-key', color: 'text-yellow', category: 'mobile' },
  { name: 'Cross-Device Emulators/Real Devices', icon: 'fa-solid fa-tablet-screen-button', color: 'text-green', category: 'mobile' },

  // E-Commerce Application Modules
  { name: 'Cart & Checkout Modules', icon: 'fa-solid fa-cart-shopping', color: 'text-purple', category: 'modules' },
  { name: 'Payment Gateways & EMI', icon: 'fa-solid fa-credit-card', color: 'text-green', category: 'modules' },
  { name: 'Refund Workflows', icon: 'fa-solid fa-money-bill-transfer', color: 'text-cyan', category: 'modules' },
  { name: 'Login & Account Creation', icon: 'fa-solid fa-user-lock', color: 'text-yellow', category: 'modules' },
  { name: 'Wishlist & Search Filters', icon: 'fa-solid fa-heart', color: 'text-red', category: 'modules' },
  { name: 'Coupons & Discounts', icon: 'fa-solid fa-ticket', color: 'text-purple', category: 'modules' },
  { name: 'Order Tracking & History', icon: 'fa-solid fa-truck-fast', color: 'text-green', category: 'modules' },
  { name: 'CMS Bulk Price Integrity', icon: 'fa-solid fa-file-csv', color: 'text-cyan', category: 'modules' },
  { name: 'CRM & Lead Data Sync', icon: 'fa-solid fa-users-gear', color: 'text-orange', category: 'modules' },
  { name: 'Vendor & Franchise Portals', icon: 'fa-solid fa-store', color: 'text-blue', category: 'modules' },

  // Testing Methodologies
  { name: 'Functional & Regression QA', icon: 'fa-solid fa-list-check', color: 'text-green', category: 'testing' },
  { name: 'Smoke & Sanity Testing', icon: 'fa-solid fa-fire-flame-curved', color: 'text-purple', category: 'testing' },
  { name: 'UI/UX & Design Consistency', icon: 'fa-solid fa-pen-ruler', color: 'text-cyan', category: 'testing' },
  { name: 'Exploratory & Edge Case QA', icon: 'fa-solid fa-compass', color: 'text-purple', category: 'testing' },
  { name: 'Cross-Browser Automation', icon: 'fa-solid fa-globe', color: 'text-green', category: 'testing' },
  { name: 'SQL Injection & Security QA', icon: 'fa-solid fa-shield-virus', color: 'text-cyan', category: 'testing' },

  // Automation
  { name: 'Playwright (JavaScript)', icon: 'fa-solid fa-play', color: 'text-emerald', category: 'automation' },
  { name: 'Page Object Model (POM)', icon: 'fa-solid fa-cubes', color: 'text-cyan', category: 'automation' },
  { name: 'JavaScript / Node.js', icon: 'fa-brands fa-js', color: 'text-yellow', category: 'automation' },
  { name: 'Mocha & JMeter', icon: 'fa-solid fa-mug-hot', color: 'text-brown', category: 'automation' },
  { name: 'Smoke & Regression Suites', icon: 'fa-solid fa-sliders', color: 'text-green', category: 'automation' },

  // API & Database
  { name: 'Postman & REST API Testing', icon: 'fa-solid fa-bolt', color: 'text-orange', category: 'api-db' },
  { name: 'SQL & Database Auditing', icon: 'fa-solid fa-database', color: 'text-blue', category: 'api-db' },
  { name: 'PostgreSQL & MySQL', icon: 'fa-solid fa-server', color: 'text-cyan', category: 'api-db' },

  // Tools & Agile
  { name: 'JIRA & Agile Scrum', icon: 'fa-brands fa-jira', color: 'text-blue', category: 'tools' },
  { name: 'Git & GitHub', icon: 'fa-brands fa-github', color: 'text-purple', category: 'tools' },
  { name: 'Browser DevTools & Lighthouse', icon: 'fa-solid fa-gears', color: 'text-cyan', category: 'tools' },
  { name: 'Antigravity IDE, Claude & AI Tools', icon: 'fa-solid fa-robot', color: 'text-emerald', category: 'tools' }
];

export default function SkillsSection() {
  const [filter, setFilter] = useState('all');

  const filteredSkills = filter === 'all' 
    ? skillsData 
    : skillsData.filter(s => s.category === filter);

  return (
    <section className="skills-section section-padding" id="skills">
      <div className="container">
        <div className="section-header">
          <span className="section-subtitle">CORE COMPETENCIES & MODULE COVERAGE</span>
          <h2 className="section-title">Technical Skills & E-Commerce Application Modules</h2>
        </div>

        {/* Skill Filter Tabs */}
        <div className="skills-tabs">
          <button className={`skill-tab-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All Competencies</button>
          <button className={`skill-tab-btn ${filter === 'mobile' ? 'active' : ''}`} onClick={() => setFilter('mobile')}>Android & iOS Mobile QA</button>
          <button className={`skill-tab-btn ${filter === 'modules' ? 'active' : ''}`} onClick={() => setFilter('modules')}>Application Modules</button>
          <button className={`skill-tab-btn ${filter === 'testing' ? 'active' : ''}`} onClick={() => setFilter('testing')}>Testing Types</button>
          <button className={`skill-tab-btn ${filter === 'automation' ? 'active' : ''}`} onClick={() => setFilter('automation')}>Automation Frameworks</button>
          <button className={`skill-tab-btn ${filter === 'api-db' ? 'active' : ''}`} onClick={() => setFilter('api-db')}>API & Database</button>
          <button className={`skill-tab-btn ${filter === 'tools' ? 'active' : ''}`} onClick={() => setFilter('tools')}>Tools & Agile</button>
        </div>

        <div className="skills-grid">
          {filteredSkills.map((s, idx) => (
            <div key={idx} className="skill-card">
              <div className={`skill-icon ${s.color}`}><i className={s.icon}></i></div>
              <div className="skill-name">{s.name}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
