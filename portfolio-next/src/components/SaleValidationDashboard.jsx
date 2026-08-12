'use client';
import { useState } from 'react';

const mockReportResults = [
  { id: 1, view: 'Desktop', url: 'https://www.woodenstreet.com/', pageType: 'Homepage', status: 'PASS', expectedCoupon: 'BHARAT79', actualCoupon: 'BHARAT79 (Extra 10% Off)', bannerSelector: '.hero-banner-main', redirectionLink: 'https://www.woodenstreet.com/sofa-sets', httpStatus: 200, notes: 'Hero banner active. Coupon banner verified.', screenshot: '01_home_desktop.png' },
  { id: 2, view: 'Mobile', url: 'https://www.woodenstreet.com/', pageType: 'Homepage', status: 'PASS', expectedCoupon: 'BHARAT79', actualCoupon: 'BHARAT79 (Extra 10% Off)', bannerSelector: '.mobile-banner-carousel', redirectionLink: 'https://www.woodenstreet.com/sofa-sets', httpStatus: 200, notes: 'Mobile drawer banner responsive & verified.', screenshot: '02_home_mobile.png' },
  { id: 3, view: 'Desktop', url: 'https://www.woodenstreet.com/lorenz-3-seater-sofa-cotton-jade-ivory', pageType: 'PDP', status: 'PASS', expectedCoupon: 'BHARAT79', actualCoupon: 'BHARAT79', bannerSelector: '.pdp-coupon-widget', redirectionLink: 'N/A', httpStatus: 200, notes: 'SKU price ₹39,999 mapped. Coupon code applied.', screenshot: '03_pdp_desktop.png' },
  { id: 4, view: 'Desktop', url: 'https://www.woodenstreet.com/sofa-sets', pageType: 'Category', status: 'PASS', expectedCoupon: 'BHARAT79', actualCoupon: 'BHARAT79', bannerSelector: '.cat-header-banner', redirectionLink: 'https://www.woodenstreet.com/3-seater-sofas', httpStatus: 200, notes: 'Category filter banner redirection HTTP 200 OK.', screenshot: '04_cat_desktop.png' },
  { id: 5, view: 'Mobile', url: 'https://www.woodenstreet.com/living-room-furniture', pageType: 'Category', status: 'PASS', expectedCoupon: 'BHARAT79', actualCoupon: 'BHARAT79', bannerSelector: '.cat-mob-banner', redirectionLink: 'https://www.woodenstreet.com/living-room-furniture', httpStatus: 200, notes: 'Mobile layout verified. Zero old sale terms found.', screenshot: '05_cat_mobile.png' },
  { id: 6, view: 'Desktop', url: 'https://www.woodenstreet.com/beds', pageType: 'Category', status: 'PASS', expectedCoupon: 'BHARAT79', actualCoupon: 'BHARAT79', bannerSelector: '.bed-hero-deal', redirectionLink: 'https://www.woodenstreet.com/wooden-beds', httpStatus: 200, notes: 'Mattress combo offer banner verified.', screenshot: '06_beds_desktop.png' },
  { id: 7, view: 'Desktop', url: 'https://www.woodenstreet.com/cart', pageType: 'Cart', status: 'PASS', expectedCoupon: 'BHARAT79', actualCoupon: 'BHARAT79 Applied', bannerSelector: '#apply-coupon-form', redirectionLink: 'N/A', httpStatus: 200, notes: 'Subtotal calculation verified: ₹91,999 - ₹52,000 = ₹39,999.', screenshot: '07_cart_desktop.png' },
  { id: 8, view: 'Mobile', url: 'https://www.woodenstreet.com/guest', pageType: 'Checkout', status: 'PASS', expectedCoupon: 'BHARAT79', actualCoupon: 'BHARAT79', bannerSelector: '.guest-checkout-banner', redirectionLink: 'N/A', httpStatus: 200, notes: 'Guest phone verification & Razorpay gateway reachable.', screenshot: '08_checkout_mobile.png' }
];

export default function SaleValidationDashboard() {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);

  const filteredData = mockReportResults.filter(item => {
    const matchesFilter = filter === 'ALL' || item.pageType.toUpperCase() === filter || item.status === filter;
    const matchesSearch = item.url.toLowerCase().includes(search.toLowerCase()) || 
                          item.notes.toLowerCase().includes(search.toLowerCase()) ||
                          item.expectedCoupon.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <section className="section-padding bg-alt" id="sale-dashboard">
      <div className="container">
        <div className="section-header">
          <span className="section-subtitle">LIVE QA AUTOMATION REPORT VIEWER</span>
          <h2 className="section-title">Sitewide Sale & Promotion <span className="gradient-text">Validation Dashboard</span></h2>
          <p className="text-secondary mt-2">
            Interactive dashboard visualizing results from Playwright test suite <code>sale_validation_prod.spec.js</code>. Scans banners, coupon display, and HTTP redirections across desktop and mobile.
          </p>
        </div>

        {/* Dashboard Top Stats Row */}
        <div className="metrics-grid mb-8" style={{ marginBottom: '2.5rem' }}>
          <div className="metric-card">
            <div className="metric-value text-cyan">150+</div>
            <div className="metric-label">URLs Scanned</div>
          </div>

          <div className="metric-card">
            <div className="metric-value text-green">100%</div>
            <div className="metric-label">Coupon Accuracy (BHARAT79)</div>
          </div>

          <div className="metric-card">
            <div className="metric-value text-purple">0</div>
            <div className="metric-label">Old Sale Terms Leaked</div>
          </div>

          <div className="metric-card highlight-metric">
            <div className="metric-value text-emerald">HTTP 200 OK</div>
            <div className="metric-label">All Banner Redirections Verified</div>
          </div>
        </div>

        {/* Controls: Filter Tabs & Search Bar */}
        <div className="dashboard-controls-bar" style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <div className="skills-tabs" style={{ marginBottom: 0 }}>
            <button className={`skill-tab-btn ${filter === 'ALL' ? 'active' : ''}`} onClick={() => setFilter('ALL')}>All Results ({mockReportResults.length})</button>
            <button className={`skill-tab-btn ${filter === 'HOMEPAGE' ? 'active' : ''}`} onClick={() => setFilter('HOMEPAGE')}>Homepage</button>
            <button className={`skill-tab-btn ${filter === 'PDP' ? 'active' : ''}`} onClick={() => setFilter('PDP')}>PDP</button>
            <button className={`skill-tab-btn ${filter === 'CATEGORY' ? 'active' : ''}`} onClick={() => setFilter('CATEGORY')}>Category</button>
            <button className={`skill-tab-btn ${filter === 'CART' ? 'active' : ''}`} onClick={() => setFilter('CART')}>Cart & Checkout</button>
          </div>

          <div style={{ position: 'relative', width: '280px' }}>
            <input
              type="text"
              placeholder="Search URL or notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 1rem 0.65rem 2.4rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-full)',
                color: 'var(--text-primary)',
                fontSize: '0.88rem'
              }}
            />
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}></i>
          </div>
        </div>

        {/* Audit Results Data Table */}
        <div className="automation-code-container" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#151d30', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.85rem 1rem' }}>#</th>
                <th style={{ padding: '0.85rem 1rem' }}>View</th>
                <th style={{ padding: '0.85rem 1rem' }}>Page Type</th>
                <th style={{ padding: '0.85rem 1rem' }}>Target URL</th>
                <th style={{ padding: '0.85rem 1rem' }}>Coupon Code</th>
                <th style={{ padding: '0.85rem 1rem' }}>Redirection Link</th>
                <th style={{ padding: '0.85rem 1rem' }}>HTTP</th>
                <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(row => (
                <tr key={row.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)' }}>{row.id}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className="skill-tag" style={{ background: row.view === 'Desktop' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(168, 85, 247, 0.15)', color: row.view === 'Desktop' ? '#3b82f6' : '#a855f7' }}>
                      <i className={`fa-solid ${row.view === 'Desktop' ? 'fa-desktop' : 'fa-mobile-screen'}`}></i> {row.view}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>{row.pageType}</td>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <a href={row.url} target="_blank" rel="noopener" style={{ color: 'var(--accent-cyan)' }}>
                      {row.url.replace('https://www.woodenstreet.com', '') || '/'}
                    </a>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className="badge-high" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                      {row.actualCoupon}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {row.redirectionLink}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)', color: '#10b981' }}>
                    {row.httpStatus}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span className="badge-high" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                      <i className="fa-solid fa-circle-check"></i> {row.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setSelectedScreenshot(row)}
                      style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem' }}
                    >
                      <i className="fa-solid fa-camera"></i> Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Screenshot Preview Modal */}
      {selectedScreenshot && (
        <div className="modal-overlay" onClick={() => setSelectedScreenshot(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedScreenshot(null)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
            
            <div className="cs-badge">{selectedScreenshot.pageType} • {selectedScreenshot.view} Audit</div>
            <h2 className="cs-title" style={{ fontSize: '1.4rem' }}>{selectedScreenshot.url}</h2>

            <div className="cs-sec">
              <h4><i className="fa-solid fa-clipboard-check text-green"></i> Validation Notes</h4>
              <p>{selectedScreenshot.notes}</p>
            </div>

            <div className="cs-sec">
              <h4><i className="fa-solid fa-image text-cyan"></i> Screenshot File Artifact</h4>
              <div style={{ background: '#090d16', border: '1px dashed rgba(255,255,255,0.2)', padding: '2rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <i className="fa-solid fa-file-image" style={{ fontSize: '3rem', color: 'var(--accent-emerald)', marginBottom: '1rem', display: 'block' }}></i>
                <code style={{ color: 'var(--text-secondary)' }}>reports/screenshots/{selectedScreenshot.screenshot}</code>
                <p className="text-muted mt-2" style={{ fontSize: '0.85rem' }}>Captured during automated test execution run of <code>sale_validation_prod.spec.js</code></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
