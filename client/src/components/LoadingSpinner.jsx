import React from 'react';

// Simple and clean Loading Spinner Component
const LoadingSpinner = () => {
  return (
    <div className="spinner-container">
      <div className="spinner"></div>
      <p className="spinner-text">Loading repositories...</p>
    </div>
  );
};

export default LoadingSpinner;
