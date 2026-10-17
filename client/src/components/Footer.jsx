import React from 'react';
import { motion } from 'framer-motion';
import { Github, Linkedin, ArrowUp } from 'lucide-react';
import './Footer.css';

const Footer = ({ setActiveTab }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const socialLinks = [
    { icon: Github, href: 'https://github.com/Darshan-Raval303107', label: 'GitHub' },
    { icon: Linkedin, href: 'https://www.linkedin.com/in/darshan-raval-8998bb385/', label: 'LinkedIn' },
  ];

  return (
    <footer className="footer-container">
      {/* Top background accent line */}
      <div className="footer-gradient-bar" />

      <div className="footer-content">
        <div className="footer-main-grid">
          
          {/* Brand Panel */}
          <div className="footer-brand-col">
            <div className="footer-logo">
              <span className="logo-symbol">&lt;/&gt;</span>
              <span className="logo-text">Darshan<span className="logo-text-gradient">.Dev</span></span>
            </div>
            <p className="footer-tagline">
              Crafting premium and highly interactive web applications with passion, clean code, and modern design systems.
            </p>
            <div className="footer-socials">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-btn-link"
                    aria-label={social.label}
                    whileHover={{ scale: 1.15, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon size={18} />
                  </motion.a>
                );
              })}
            </div>
          </div>

          {/* Quick Links Panel */}
          <div className="footer-links-col">
            <h4>Quick Links</h4>
            <ul className="footer-links-list">
              <li>
                <button onClick={() => { setActiveTab('Profile'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="footer-link-btn">
                  Profile
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('About Me'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="footer-link-btn">
                  About Me
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('Projects'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="footer-link-btn">
                  Projects
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('Todo App'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="footer-link-btn">
                  Todo App
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('Contact Me'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="footer-link-btn">
                  Contact Me
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Details Panel */}
          <div className="footer-contact-col">
            <h4>Contact Info</h4>
            <ul className="footer-contact-list">
              <li>
                <span className="contact-label">Email:</span>
                <a href="mailto:ravaldarshan079@gmail.com" className="contact-value">ravaldarshan079@gmail.com</a>
              </li>
              <li>
                <span className="contact-label">Phone:</span>
                <a href="tel:+919510704284" className="contact-value">(+91) 95107 04284</a>
              </li>
              <li>
                <span className="contact-label">Location:</span>
                <span className="contact-value">Gujarat, India</span>
              </li>
              <li>
                <span className="availability-indicator">
                  <span className="availability-dot" />
                  Available for freelance work
                </span>
              </li>
            </ul>
          </div>

        </div>

        {/* Footer Base Divider */}
        <div className="footer-divider" />

        {/* Footer Bottom Meta Section */}
        <div className="footer-bottom-bar">
          <p className="copyright-text">
            &copy; {new Date().getFullYear()} Darshan Raval. All rights reserved.
          </p>
          
          <div className="bottom-links-and-scroll">
            <div className="bottom-nav-links">
              <a href="#" className="bottom-link">Privacy Policy</a>
              <a href="#" className="bottom-link">Terms of Service</a>
            </div>
            
            <motion.button
              onClick={scrollToTop}
              className="scroll-top-btn"
              aria-label="Scroll to top"
              whileHover={{ y: -4, backgroundColor: 'rgba(37, 99, 235, 0.08)' }}
              whileTap={{ scale: 0.9 }}
            >
              <ArrowUp size={18} />
            </motion.button>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
