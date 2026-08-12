'use client';
import { useState } from 'react';

const defaultJson = `{
  "cartId": "CART-98214",
  "couponCode": "BHARAT79",
  "userId": "USR-3091",
  "items": [
    { "sku": "WS-SOFA-001", "qty": 1, "mrp": 91999 }
  ]
}`;

const responseJson = `{
  "status": "success",
  "code": 200,
  "data": {
    "cartId": "CART-98214",
    "couponApplied": "BHARAT79",
    "discountAmount": 10000,
    "originalTotal": 49999,
    "finalPayable": 39999,
    "currency": "INR",
    "isEligible": true
  },
  "message": "Promotional coupon BHARAT79 successfully validated and applied."
}`;

export default function ApiSection() {
  const [activeTab, setActiveTab] = useState('req');
  const [isSending, setIsSending] = useState(false);

  const handleSend = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setActiveTab('res');
    }, 600);
  };

  return (
    <section className="api-section section-padding">
      <div className="container">
        <div className="section-header">
          <span className="section-subtitle">BACKEND QUALITY VERIFICATION</span>
          <h2 className="section-title">API & Payload Validation</h2>
        </div>

        <div className="api-grid">
          <div className="api-info-card">
            <p className="api-lead">
              Front-end testing is only half the picture. I perform extensive REST API testing to validate request payloads, response schemas, status codes, authentication headers, and database persistence.
            </p>

            <div className="api-highlights">
              <div className="api-hl-item">
                <div className="hl-icon text-cyan"><i className="fa-solid fa-code-compare"></i></div>
                <div>
                  <h4>Request / Response Validation</h4>
                  <p>Verify JSON response structure, field data types, and error payloads.</p>
                </div>
              </div>

              <div className="api-hl-item">
                <div className="hl-icon text-green"><i className="fa-solid fa-shield-halved"></i></div>
                <div>
                  <h4>Status Code & Negative Testing</h4>
                  <p>Validate HTTP 200, 201, 400 Bad Request, 401 Unauthorized, and 404 handling.</p>
                </div>
              </div>

              <div className="api-hl-item">
                <div className="hl-icon text-purple"><i className="fa-solid fa-database"></i></div>
                <div>
                  <h4>Postman & DB Verification</h4>
                  <p>Automate collection runs in Postman and verify database record updates via SQL queries.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Console Card */}
          <div className="api-console-card">
            <div className="api-console-top">
              <span className="http-method-badge get">POST</span>
              <span className="api-endpoint-url">https://api.example-domain.com/v1/cart/apply-coupon</span>
              <button className="btn btn-sm btn-cyan" onClick={handleSend} disabled={isSending}>
                <i className="fa-solid fa-paper-plane"></i> {isSending ? 'Sending...' : 'Send Request'}
              </button>
            </div>

            <div className="api-console-tabs">
              <span className={`api-tab ${activeTab === 'req' ? 'active' : ''}`} onClick={() => setActiveTab('req')}>Request Payload</span>
              <span className={`api-tab ${activeTab === 'res' ? 'active' : ''}`} onClick={() => setActiveTab('res')}>Response (200 OK)</span>
            </div>

            <div className="api-console-body">
              <pre><code>{activeTab === 'req' ? defaultJson : responseJson}</code></pre>
            </div>

            <div className="api-console-bottom">
              <span className="api-meta-tag"><i className="fa-solid fa-circle-check text-green"></i> Status: 200 OK</span>
              <span className="api-meta-tag"><i className="fa-solid fa-clock"></i> Time: 142ms</span>
              <span className="api-meta-tag"><i className="fa-solid fa-server"></i> Size: 1.2 KB</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
