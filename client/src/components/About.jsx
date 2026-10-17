import React from 'react';
import { motion } from 'framer-motion';
import './About.css';

const About = () => {
  const skillCategories = [
    {
      title: 'Frontend Development',
      skills: ['React JS', 'HTML5 & CSS3', 'JavaScript (ES6+)', 'Responsive Web Design', 'Framer Motion'],
    },
    {
      title: 'Backend & Database',
      skills: ['Node.js', 'Express.js', 'REST APIs', 'MongoDB', 'SQL Basics'],
    },
    {
      title: 'Tools & Workflows',
      skills: ['Git & GitHub', 'Vite & Webpack', 'Postman', 'VS Code', 'Vercel / Netlify'],
    },
  ];

  return (
    <motion.section
      className="about-section"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="section-header text-center">
        <h2 className="section-title">About <span className="gradient-text">Me</span></h2>
      </div>

      <div className="about-content-wrapper">
        {/* Biography Card */}
        <div className="bio-card glass-card">
          <h3>Who I Am</h3>
          <p>
            I’m a passionate Full Stack Developer from Gujarat, India who enjoys building real-world solutions using modern technologies. I love writing clean and organized code, and I’m always excited to solve new and interesting problems.
          </p>
          <p style={{ marginTop: '16px' }}>
            I focus on creating fast, interactive, and responsive web applications that work smoothly on all devices. I’m also a continuous learner — always exploring new tools, frameworks, and ideas to improve my skills and stay updated with the latest trends in technology.
          </p>
        </div>

        {/* Technical Expertise Card */}
        <div className="skills-card glass-card">
          <h3>Technical Expertise</h3>
          <div className="skill-categories-container">
            {skillCategories.map((category, idx) => (
              <div key={idx} className="skill-category">
                <h4>{category.title}</h4>
                <div className="skills-list">
                  {category.skills.map((skill, sIdx) => (
                    <span key={sIdx} className="skill-badge">{skill}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default About;
