import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin } from 'lucide-react';
import './Contact.css';

const Contact = () => {
  return (
    <motion.section
      className="contact-section"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="section-header text-center">
        <h2 className="section-title">Contact <span className="gradient-text">Me</span></h2>
      </div>

      <div className="contact-content-wrapper">
        <div className="info-card glass-card">
          <h3>Contact Information</h3>
          <p className="info-intro">Feel free to reach out directly through any of these channels.</p>
          
          <div className="info-list">
            <a href="tel:+919510704284" className="info-item-link">
              <div className="info-icon-wrapper">
                <Phone size={20} />
              </div>
              <div>
                <span className="info-label">Call / WhatsApp</span>
                <span className="info-val">(+91) 95107 04284</span>
              </div>
            </a>

            <a href="mailto:ravaldarshan079@gmail.com" className="info-item-link">
              <div className="info-icon-wrapper">
                <Mail size={20} />
              </div>
              <div>
                <span className="info-label">Email</span>
                <span className="info-val">ravaldarshan079@gmail.com</span>
              </div>
            </a>

            <div className="info-item-static">
              <div className="info-icon-wrapper">
                <MapPin size={20} />
              </div>
              <div>
                <span className="info-label">Location</span>
                <span className="info-val">Gujarat, India</span>
              </div>
            </div>
          </div>

          <div className="mock-map-visual">
            <div className="pulse-dot" />
            <span className="map-text">Gujarat, India</span>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default Contact;
