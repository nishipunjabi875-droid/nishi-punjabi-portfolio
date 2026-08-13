'use client';
import { useState } from 'react';

const logsData = [
  { text: "🚀 Launching Playwright & Appium cross-platform worker (Android/iOS Emulation)...", colorClass: "text-muted" },
  { text: "Navigating to: https://www.woodenstreet.com/lorenz-3-seater-sofa-cotton-jade-ivory", colorClass: "text-cyan" },
  { text: "[PASS] Mobile PDP loaded in 1.2s (HTTP 200 OK)", colorClass: "text-green" },
  { text: "Executing: MobileApp.verifyOTPAuth()", colorClass: "text-primary" },
  { text: "[PASS] Verified Mobile OTP Customer Creation & duplicate phone prevention", colorClass: "text-green" },
  { text: "Executing: CartPage.addToCart() across Mobile Web & Native App", colorClass: "text-primary" },
  { text: "[PASS] Clicked #button-cart — Item synced to user session", colorClass: "text-green" },
  { text: "Auditing Price Breakdown: Subtotal ₹91,999 | Discount -₹42,000 | Payable ₹39,999", colorClass: "text-yellow" },
  { text: "[PASS] Payment Gateway Rollout Asserted: UPI, Cards, EMI, Refunds matched", colorClass: "text-green" },
  { text: "🎉 74 tests passed in 3.8s — 0 Regressions Escaped to Production", colorClass: "text-emerald font-bold" }
];

export default function AutomationSection() {
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const runSimulation = () => {
    if (isRunning) return;
    setIsRunning(true);
    setLogs([]);

    let index = 0;
    const interval = setInterval(() => {
      if (index < logsData.length) {
        const item = logsData[index];
        if (item) {
          setLogs(prev => [...prev, item]);
        }
        index++;
      } else {
        clearInterval(interval);
        setIsRunning(false);
      }
    }, 450);
  };

  return (
    <section className="automation-section section-padding bg-alt" id="automation">
      <div className="container">
        <div className="section-header">
          <span className="section-subtitle">CLEAN TEST ARCHITECTURE</span>
          <h2 className="section-title">Automation in Action (Web & Mobile Apps)</h2>
        </div>

        <div className="automation-grid">
          <div className="automation-code-container">
            <div className="code-editor-header">
              <div className="editor-tabs">
                <span className="editor-tab active"><i className="fa-solid fa-code text-cyan"></i> mobile-cart-checkout.spec.js</span>
                <span className="editor-tab"><i className="fa-solid fa-file-code text-yellow"></i> CartPage.js</span>
              </div>
              <button className="btn btn-sm btn-emerald" onClick={runSimulation} disabled={isRunning}>
                <i className="fa-solid fa-play"></i> {isRunning ? 'Running...' : 'Run Test Simulation'}
              </button>
            </div>

            <pre className="code-editor-body"><code>{`const { test, expect } = require('@playwright/test');
const CartPage = require('./pages/CartPage');

test.describe('Web & Mobile App Cross-Platform Suite', () => {
  test('verify checkout & payment rollout across Web & Mobile viewports', async ({ page }) => {
    const cartPage = new CartPage(page);

    await cartPage.openProduct();
    await cartPage.addToCart();

    await expect(cartPage.cartSuccessMessage).toBeVisible();
    
    const priceDetails = await cartPage.getPriceDetails();
    expect(priceDetails.totalPayable).toBe(priceDetails.subtotal - priceDetails.discount);
    
    // Validate Payment Gateway Rollout
    await cartPage.verifyPaymentGatewayRollout(['UPI', 'Cards', 'NetBanking', 'EMI']);
  });
});`}</code></pre>
          </div>

          <div className="automation-explanation">
            <div className="explanation-card">
              <h3><i className="fa-solid fa-cubes text-cyan"></i> Maintainable Page Object Model (POM)</h3>
              <p>
                I use reusable Page Object Model (POM) structures to isolate page selectors and UI actions from test logic across Web, Android, and iOS viewports. This keeps automation maintainable, scalable, and ideal for rapid release sign-offs.
              </p>

              <ul className="pom-features">
                <li><i className="fa-solid fa-check text-green"></i> <strong>Decoupled Selectors:</strong> Web & Mobile element locators encapsulated inside page objects.</li>
                <li><i className="fa-solid fa-check text-green"></i> <strong>Cross-Device Emulation:</strong> Simulates desktop browsers, mobile web, Android & iOS devices.</li>
                <li><i className="fa-solid fa-check text-green"></i> <strong>Parallel Execution:</strong> Supports multi-worker parallel test runs with zero flaky retries.</li>
                <li><i className="fa-solid fa-check text-green"></i> <strong>Custom Reporters:</strong> Generates Excel workbooks, HTML dashboards, and JIRA bug reports.</li>
              </ul>

              <div className="sim-output-box">
                <div className="sim-output-title"><i className="fa-solid fa-terminal"></i> Interactive Execution Output</div>
                <div className="sim-log-list">
                  {logs.length === 0 ? (
                    <div className="sim-log text-muted">Click "Run Test Simulation" above to execute Playwright test...</div>
                  ) : (
                    logs.map((log, idx) => (
                      <div key={idx} className={`sim-log ${log.colorClass || ''}`}>{log.text}</div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
