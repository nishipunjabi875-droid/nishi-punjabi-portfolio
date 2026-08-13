'use client';
import { useState } from 'react';

export default function ContactSection({ onOpenResume }) {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [toastVisible, setToastVisible] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    let errs = {};

    if (!formData.name.trim()) errs.name = 'Please enter your name.';
    if (!formData.email.trim() || !formData.email.includes('@')) errs.email = 'Please enter a valid email address.';
    if (!formData.message.trim()) errs.message = 'Please enter your message.';

    setErrors(errs);

    if (Object.keys(errs).length === 0) {
      setFormData({ name: '', email: '', message: '' });
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 4000);
    }
  };

  return (
    <>
      <section className="resume-section section-padding">
        <div className="container">
          <div className="resume-banner-box">
            <div className="resume-banner-content">
              <h2>Want the complete picture?</h2>
              <p>
                Explore my detailed QA experience, Playwright automation frameworks, test suite architecture, and technical skill breakdowns.
              </p>
            </div>
            <div className="resume-banner-actions">
              <button className="btn btn-primary btn-lg" onClick={onOpenResume}>
                <i className="fa-solid fa-file-pdf"></i> Download Resume
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="contact-section section-padding bg-alt" id="contact">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-subtitle">GET IN TOUCH</span>
            <h2 className="section-title">Let's Build Better Software</h2>
            <p className="contact-lead">Looking for a QA Engineer who thinks beyond test cases? Let's connect.</p>
          </div>

          <div className="contact-grid">
            <div className="contact-info-cards">
              <a href="mailto:nishipunjabi65@gmail.com" className="c-info-card">
                <div className="c-icon"><i className="fa-solid fa-envelope"></i></div>
                <div>
                  <span className="c-lbl">Email Me</span>
                  <span className="c-val">nishipunjabi65@gmail.com</span>
                </div>
              </a>

              <a href="tel:+917976191632" className="c-info-card">
                <div className="c-icon"><i className="fa-solid fa-phone"></i></div>
                <div>
                  <span className="c-lbl">Phone / WhatsApp</span>
                  <span className="c-val">+91 7976191632</span>
                </div>
              </a>

              <a href="https://linkedin.com/in/nishi-punjabi-b610b8259" target="_blank" rel="noopener" className="c-info-card">
                <div className="c-icon"><i className="fa-brands fa-linkedin"></i></div>
                <div>
                  <span className="c-lbl">Connect on LinkedIn</span>
                  <span className="c-val">linkedin.com/in/nishi-punjabi-b610b8259</span>
                </div>
              </a>

              <div className="c-info-card">
                <div className="c-icon"><i className="fa-solid fa-location-dot"></i></div>
                <div>
                  <span className="c-lbl">Location</span>
                  <span className="c-val">Udaipur, Rajasthan, India</span>
                </div>
              </div>
            </div>

            <div className="contact-form-card">
              <form onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                  <label htmlFor="contactName">Your Name</label>
                  <input
                    type="text"
                    id="contactName"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                  {errors.name && <span className="form-error" style={{ display: 'block' }}>{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="contactEmail">Your Email</label>
                  <input
                    type="email"
                    id="contactEmail"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@company.com"
                  />
                  {errors.email && <span className="form-error" style={{ display: 'block' }}>{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="contactMessage">Message</label>
                  <textarea
                    id="contactMessage"
                    rows="4"
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Hi Nishi, I'd like to discuss a QA opportunity..."
                  ></textarea>
                  {errors.message && <span className="form-error" style={{ display: 'block' }}>{errors.message}</span>}
                </div>

                <button type="submit" className="btn btn-primary btn-full">
                  <i className="fa-solid fa-paper-plane"></i> Send Message
                </button>
              </form>

              {toastVisible && (
                <div className="form-toast">
                  <i className="fa-solid fa-circle-check"></i> Thank you! Your message has been sent successfully.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
