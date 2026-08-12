'use client';
import { useState } from 'react';

const skillsData = [
  // Testing
  { name: 'Functional Testing', icon: 'fa-solid fa-list-check', color: 'text-green', category: 'testing' },
  { name: 'Regression Testing', icon: 'fa-solid fa-rotate', color: 'text-cyan', category: 'testing' },
  { name: 'Smoke Testing', icon: 'fa-solid fa-fire-flame-curved', color: 'text-purple', category: 'testing' },
  { name: 'Sanity Testing', icon: 'fa-solid fa-heart-pulse', color: 'text-green', category: 'testing' },
  { name: 'UI/UX Testing', icon: 'fa-solid fa-pen-ruler', color: 'text-cyan', category: 'testing' },
  { name: 'Exploratory Testing', icon: 'fa-solid fa-compass', color: 'text-purple', category: 'testing' },
  { name: 'Cross-Browser Testing', icon: 'fa-solid fa-globe', color: 'text-green', category: 'testing' },
  { name: 'Cross-Device Testing', icon: 'fa-solid fa-mobile-screen-button', color: 'text-cyan', category: 'testing' },
  { name: 'Responsive Testing', icon: 'fa-solid fa-display', color: 'text-purple', category: 'testing' },
  { name: 'Performance Testing', icon: 'fa-solid fa-gauge-high', color: 'text-green', category: 'testing' },
  { name: 'Mobile App Testing', icon: 'fa-solid fa-mobile-screen-button', color: 'text-emerald', category: 'testing' },
  { name: 'SQL Injection Testing', icon: 'fa-solid fa-shield-virus', color: 'text-cyan', category: 'testing' },

  // Automation
  { name: 'Playwright', icon: 'fa-solid fa-play', color: 'text-emerald', category: 'automation' },
  { name: 'JavaScript', icon: 'fa-brands fa-js', color: 'text-yellow', category: 'automation' },
  { name: 'Mocha', icon: 'fa-solid fa-mug-hot', color: 'text-brown', category: 'automation' },
  { name: 'Page Object Model', icon: 'fa-solid fa-cubes', color: 'text-cyan', category: 'automation' },
  { name: 'Cross-Browser Automation', icon: 'fa-solid fa-window-restore', color: 'text-purple', category: 'automation' },
  { name: 'Regression Automation', icon: 'fa-solid fa-sliders', color: 'text-green', category: 'automation' },

  // API & Database
  { name: 'Postman', icon: 'fa-solid fa-bolt', color: 'text-orange', category: 'api-db' },
  { name: 'REST API Testing', icon: 'fa-solid fa-network-wired', color: 'text-cyan', category: 'api-db' },
  { name: 'SQL', icon: 'fa-solid fa-database', color: 'text-blue', category: 'api-db' },
  { name: 'PostgreSQL', icon: 'fa-solid fa-server', color: 'text-blue', category: 'api-db' },
  { name: 'MySQL', icon: 'fa-solid fa-database', color: 'text-cyan', category: 'api-db' },

  // Tools
  { name: 'JIRA', icon: 'fa-brands fa-jira', color: 'text-blue', category: 'tools' },
  { name: 'Git', icon: 'fa-brands fa-git-alt', color: 'text-red', category: 'tools' },
  { name: 'GitHub', icon: 'fa-brands fa-github', color: 'text-purple', category: 'tools' },
  { name: 'VS Code', icon: 'fa-solid fa-code', color: 'text-blue', category: 'tools' },
  { name: 'Browser DevTools', icon: 'fa-solid fa-gears', color: 'text-cyan', category: 'tools' },
  { name: 'Lighthouse & PageSpeed', icon: 'fa-solid fa-chart-line', color: 'text-green', category: 'tools' },

  // Agile & AI
  { name: 'Agile & Scrum', icon: 'fa-solid fa-arrows-spin', color: 'text-cyan', category: 'methodology' },
  { name: 'SDLC & STLC', icon: 'fa-solid fa-diagram-project', color: 'text-purple', category: 'methodology' },
  { name: 'AI-Assisted Development', icon: 'fa-solid fa-robot', color: 'text-green', category: 'methodology' },
  { name: 'ChatGPT & Claude', icon: 'fa-solid fa-brain', color: 'text-emerald', category: 'methodology' },
  { name: 'Antigravity IDE & CLI', icon: 'fa-solid fa-terminal', color: 'text-cyan', category: 'methodology' }
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
          <span className="section-subtitle">CORE COMPETENCIES</span>
          <h2 className="section-title">Technical Skills & Tooling</h2>
        </div>

        {/* Skill Filter Tabs */}
        <div className="skills-tabs">
          <button className={`skill-tab-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All Skills</button>
          <button className={`skill-tab-btn ${filter === 'testing' ? 'active' : ''}`} onClick={() => setFilter('testing')}>Testing Methodologies</button>
          <button className={`skill-tab-btn ${filter === 'automation' ? 'active' : ''}`} onClick={() => setFilter('automation')}>Automation</button>
          <button className={`skill-tab-btn ${filter === 'api-db' ? 'active' : ''}`} onClick={() => setFilter('api-db')}>API & Database</button>
          <button className={`skill-tab-btn ${filter === 'tools' ? 'active' : ''}`} onClick={() => setFilter('tools')}>Tools & Environment</button>
          <button className={`skill-tab-btn ${filter === 'methodology' ? 'active' : ''}`} onClick={() => setFilter('methodology')}>Agile & AI Tools</button>
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
