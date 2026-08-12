'use client';

const metrics = [
  { value: '1+', label: 'Years of QA Experience' },
  { value: '10,000+', label: 'SKUs Tested' },
  { value: '74+', label: 'Test Cases Authored' },
  { value: '8', label: 'Playwright Regression Suites' },
  { value: '33', label: 'Lead Form Types Covered' },
  { value: '300+', label: 'Support Tickets Analyzed' },
  { value: '12', label: 'SKUs Validated in Mattress Offer Testing' },
];

export default function MetricsSection() {
  return (
    <section className="metrics-section section-padding">
      <div className="container">
        <div className="section-header text-center">
          <span className="section-subtitle">VERIFIED RECORD</span>
          <h2 className="section-title">By the Numbers</h2>
        </div>

        <div className="metrics-grid">
          {metrics.map((m, idx) => (
            <div key={idx} className="metric-card">
              <div className="metric-value">{m.value}</div>
              <div className="metric-label">{m.label}</div>
            </div>
          ))}

          <div className="metric-card highlight-metric">
            <div className="metric-value text-emerald">UPI • Cards • Net Banking • EMI</div>
            <div className="metric-label">Payment Methods Validated</div>
          </div>
        </div>
      </div>
    </section>
  );
}
