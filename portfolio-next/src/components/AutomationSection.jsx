'use client';
import { useState } from 'react';

const logsData = [
  { text: "🚀 Launching Playwright browser worker (Chromium Headless)...", colorClass: "text-muted" },
  { text: "Navigating to: https://www.woodenstreet.com/lorenz-3-seater-sofa-cotton-jade-ivory", colorClass: "text-cyan" },
  { text: "[PASS] Page loaded in 1.4s (HTTP 200 OK)", colorClass: "text-green" },
  { text: "Executing: CartPage.addToCart()", colorClass: "text-primary" },
  { text: "[PASS] Clicked #button-cart — Item added to session", colorClass: "text-green" },
  { text: "Navigating to: https://www.woodenstreet.com/cart", colorClass: "text-cyan" },
  { text: "[PASS] Asserted: My Cart (1) line item present", colorClass: "text-green" },
  { text: "Auditing Price Breakdown: Subtotal ₹91,999 | Discount -₹42,000 | Payable ₹39,999", colorClass: "text-yellow" },
  { text: "[PASS] Calculation Verified: Total Payable === Subtotal - Discount", colorClass: "text-green" },
  { text: "🎉 1 test passed in 3.2s — 0 Regressions Detected", colorClass: "text-emerald font-bold" }
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
          <h2 className="section-title">Automation in Action</h2>
        </div>

        <div className="automation-grid">
          <div className="automation-code-container">
            <div className="code-editor-header">
              <div className="editor-tabs">
                <span className="editor-tab active"><i className="fa-solid fa-code text-cyan"></i> cart-checkout.spec.js</span>
                <span className="editor-tab"><i className="fa-solid fa-file-code text-yellow"></i> CartPage.js</span>
              </div>
              <button className="btn btn-sm btn-emerald" onClick={runSimulation} disabled={isRunning}>
                <i className="fa-solid fa-play"></i> {isRunning ? 'Running...' : 'Run Test Simulation'}
              </button>
            </div>

            <pre className="code-editor-body"><code>{`const { test, expect } = require('@playwright/test');
const CartPage = require('./pages/CartPage');

test.describe('E-Commerce Cart Automation', () => {
  test('verify product can be added to cart & price calculated', async ({ page }) => {
    const cartPage = new CartPage(page);

    await cartPage.openProduct();
    await cartPage.addToCart();

    await expect(cartPage.cartSuccessMessage).toBeVisible();
    
    const priceDetails = await cartPage.getPriceDetails();
    expect(priceDetails.totalPayable).toBe(priceDetails.subtotal - priceDetails.discount);
  });
});`}</code></pre>
          </div>

          <div className="automation-explanation">
            <div className="explanation-card">
              <h3><i className="fa-solid fa-cubes text-cyan"></i> Maintainable Page Object Model</h3>
              <p>
                I use reusable Page Object Model (POM) structures to isolate page selectors and UI actions from test logic. This keeps automation maintainable, scalable, and suitable for rapid regression testing.
              </p>

              <ul className="pom-features">
                <li><i className="fa-solid fa-check text-green"></i> <strong>Decoupled Selectors:</strong> Page elements encapsulated inside page classes.</li>
                <li><i className="fa-solid fa-check text-green"></i> <strong>Robust Locators:</strong> Uses Playwright's role, text, and data-testid locators.</li>
                <li><i className="fa-solid fa-check text-green"></i> <strong>Parallel Execution:</strong> Supports multi-worker parallel runs across viewports.</li>
                <li><i className="fa-solid fa-check text-green"></i> <strong>Custom Reporters:</strong> Generates HTML and JSON execution dashboards.</li>
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
