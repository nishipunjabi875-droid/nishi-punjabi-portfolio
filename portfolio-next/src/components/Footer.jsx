'use client';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-left">
          <a href="#hero" className="brand-name">Nishi Punjabi</a>
          <p>© 2026 Nishi Punjabi. QA Automation Engineer. Engineered for Quality.</p>
        </div>

        <div className="footer-right">
          <a href="https://linkedin.com/in/nishi-punjabi-b610b8259" target="_blank" rel="noopener"><i className="fa-brands fa-linkedin"></i></a>
          <a href="mailto:nishipunjabi65@gmail.com"><i className="fa-solid fa-envelope"></i></a>
          <button className="back-to-top-btn" aria-label="Scroll back to top" onClick={scrollToTop}>
            <i className="fa-solid fa-arrow-up"></i>
          </button>
        </div>
      </div>
    </footer>
  );
}
