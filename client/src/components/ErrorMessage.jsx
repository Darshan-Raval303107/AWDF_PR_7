import React from 'react';

// Simple and clean Error Message Component
const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="error-container">
      <p className="error-icon">⚠️</p>
      <h3 className="error-title">Failed to Load Repositories</h3>
      <p className="error-text">{message}</p>
      {onRetry && (
        <button className="retry-btn" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
