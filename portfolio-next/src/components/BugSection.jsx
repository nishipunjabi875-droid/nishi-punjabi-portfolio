'use client';

const stages = ['Discover', 'Reproduce', 'Document', 'Assign', 'Fix', 'Retest', 'Regression', 'Close'];

export default function BugSection() {
  return (
    <section className="bug-section section-padding bg-alt">
      <div className="container">
        <div className="section-header">
          <span className="section-subtitle">DEFECT LIFECYCLE MANAGEMENT</span>
          <h2 className="section-title">From Bug Discovery to Resolution</h2>
        </div>

        <div className="bug-lifecycle-bar">
          {stages.map((stg, i) => (
            <div key={i} className={`bug-stage ${i === 0 ? 'active' : ''}`}>
              <span className="stage-num">{i + 1}</span> {stg}
            </div>
          ))}
        </div>

        <div className="sample-bug-card">
          <div className="bug-card-top">
            <div className="bug-card-id"><i className="fa-solid fa-bug text-red"></i> SAMPLE DEFECT REPORT — WS-BUG-4092</div>
            <div className="bug-card-severity badge-high"><i className="fa-solid fa-triangle-exclamation"></i> Severity: High</div>
          </div>

          <h3 className="bug-card-summary">Cart Subtotal Calculation Mismatch on Multiple Quantity Coupon Trigger</h3>

          <div className="bug-details-grid">
            <div className="bug-detail-box">
              <span className="bd-lbl">Environment:</span>
              <span className="bd-val">Mobile Safari & Web Chrome (Staging & Prod)</span>
            </div>
            <div className="bug-detail-box">
              <span className="bd-lbl">Status:</span>
              <span className="bd-val text-yellow"><i className="fa-solid fa-arrows-rotate"></i> Retest / Verified</span>
            </div>
            <div className="bug-detail-box">
              <span className="bd-lbl">Evidence Attached:</span>
              <span className="bd-val"><i className="fa-solid fa-paperclip"></i> Network Har, Console Log, MP4 Recording</span>
            </div>
            <div className="bug-detail-box">
              <span className="bd-lbl">Reported By:</span>
              <span className="bd-val">Nishi Punjabi (QA Automation Engineer)</span>
            </div>
          </div>

          <div className="bug-steps-box">
            <div className="steps-title"><i className="fa-solid fa-list-ol"></i> Steps to Reproduce (Sample Representation):</div>
            <ol className="steps-list">
              <li>Add 2 units of SKU <code>WS-SOFA-001</code> to cart.</li>
              <li>Apply coupon code <code>WELCOME10</code> in the checkout summary.</li>
              <li>Observe subtotal calculation: Discount applies only to 1 unit price while item quantity shows 2.</li>
              <li>Expected: Coupon discount applies across total line item price or validates line item limit.</li>
            </ol>
          </div>

          <div className="sample-badge-note"><i className="fa-solid fa-info-circle"></i> Note: Sample representation of JIRA defect documentation format.</div>
        </div>
      </div>
    </section>
  );
}
