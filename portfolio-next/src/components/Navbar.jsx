'use client';
import { useState, useEffect } from 'react';

export default function Navbar({ onOpenResume }) {
  const [theme, setTheme] = useState('dark');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('portfolio-theme') || 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('portfolio-theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <header className="navbar-header" id="navbar">
      <div className="container nav-container">
        <a href="#hero" className="brand-logo">
          <div className="brand-icon"><i className="fa-solid fa-bug-slash"></i></div>
          <div className="brand-text">
            <span className="brand-name">Nishi Punjabi</span>
            <span className="brand-badge"><span className="pulse-dot"></span> Open for QA Roles</span>
          </div>
        </a>

        <nav className={`nav-links ${menuOpen ? 'active' : ''}`} id="navMenu">
          <a href="#about" className="nav-link" onClick={() => setMenuOpen(false)}>About</a>
          <a href="#experience" className="nav-link" onClick={() => setMenuOpen(false)}>Experience</a>
          <a href="#skills" className="nav-link" onClick={() => setMenuOpen(false)}>Skills</a>
          <a href="#projects" className="nav-link" onClick={() => setMenuOpen(false)}>Projects</a>
          <a href="#approach" className="nav-link" onClick={() => setMenuOpen(false)}>Approach</a>
          <a href="#automation" className="nav-link" onClick={() => setMenuOpen(false)}>Automation</a>
          <a href="#contact" className="nav-link" onClick={() => setMenuOpen(false)}>Contact</a>
        </nav>

        <div className="nav-actions">
          <button id="themeToggle" className="theme-toggle-btn" aria-label="Toggle dark/light theme" onClick={toggleTheme}>
            <i className="fa-solid fa-moon dark-icon"></i>
            <i className="fa-solid fa-sun light-icon"></i>
          </button>
          <button className="btn btn-outline btn-sm" onClick={onOpenResume}>
            <i className="fa-solid fa-file-arrow-down"></i> Resume
          </button>
          <button className="hamburger-menu" aria-label="Open navigation menu" onClick={() => setMenuOpen(!menuOpen)}>
            <i className="fa-solid fa-bars"></i>
          </button>
        </div>
      </div>
    </header>
  );
}
