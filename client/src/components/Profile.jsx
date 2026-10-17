import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Briefcase, ArrowRight } from 'lucide-react';
import './Profile.css';

const Profile = ({ setActiveTab }) => {
  return (
    <motion.section 
      className="profile-section"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="profile-grid">
        {/* Left column: Bio & Intro */}
        <div className="profile-info-card glass-card">
          <span className="badge">Available for Projects</span>
          <h1 className="profile-name">
            Hi, I'm <span className="gradient-text">Raval Darshan</span>
          </h1>
          <h2 className="profile-role">Full Stack Developer</h2>
          <p className="profile-description">
            I build modern, high-performance, and visually stunning web applications. Focusing on clean code, responsive design, and intuitive user experiences to solve complex problems.
          </p>

          <div className="profile-details-grid">
            <div className="detail-item">
              <Mail className="detail-icon" size={18} />
              <div>
                <span className="detail-label">Email</span>
                <a href="mailto:ravaldarshan079@gmail.com" className="detail-value">ravaldarshan079@gmail.com</a>
              </div>
            </div>
            <div className="detail-item">
              <Phone className="detail-icon" size={18} />
              <div>
                <span className="detail-label">Phone</span>
                <a href="tel:+919510704284" className="detail-value">(+91) 95107 04284</a>
              </div>
            </div>
            <div className="detail-item">
              <MapPin className="detail-icon" size={18} />
              <div>
                <span className="detail-label">Location</span>
                <span className="detail-value">Gujarat, India</span>
              </div>
            </div>
            <div className="detail-item">
              <Briefcase className="detail-icon" size={18} />
              <div>
                <span className="detail-label">Experience</span>
                <span className="detail-value">Full-Stack Development</span>
              </div>
            </div>
          </div>

          <div className="profile-actions">
            <button className="btn" onClick={() => setActiveTab('Projects')}>
              View My Work <ArrowRight size={16} />
            </button>
            <button className="btn btn-outline" onClick={() => setActiveTab('Contact Me')}>
              Contact Me
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default Profile;
