import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, User, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const API_BASE = '/api';
const FALLBACK_BASE = 'http://localhost:5001/api';

const authFetch = async (path, options = {}) => {
  try {
    const res = await fetch(`${API_BASE}${path}`, options);
    return res;
  } catch {
    return await fetch(`${FALLBACK_BASE}${path}`, options);
  }
};

export default function Auth() {
  const { login, authMessage, setAuthMessage } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // UI status states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const toggleMode = () => {
    setIsLoginMode((prev) => !prev);
    setErrorMessage('');
    setSuccessMessage('');
    if (authMessage) setAuthMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (authMessage) setAuthMessage('');

    if (isLoginMode) {
      // Login validation
      const identifier = email.trim();
      if (!identifier || !password) {
        setErrorMessage('Please enter both your email/username and password.');
        return;
      }

      setLoading(true);
      try {
        const res = await authFetch('/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier,
            password
          })
        });

        const data = await res.json();

        if (res.ok && data.token) {
          login(data.token, data.user);
        } else {
          setErrorMessage(data.error || 'Invalid credentials. Please check your details.');
        }
      } catch (err) {
        console.error('Login error:', err);
        setErrorMessage('Unable to connect to the backend server. Please verify port 5001 is running.');
      } finally {
        setLoading(false);
      }
    } else {
      // Register validation
      if (!username.trim() || !email.trim() || !password) {
        setErrorMessage('Please fill in all registration fields.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }

      setLoading(true);
      try {
        const res = await authFetch('/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password
          })
        });

        const data = await res.json();

        if (res.status === 201) {
          setSuccessMessage('Registration successful! Signing you in...');
          // Auto login after successful registration
          const loginRes = await authFetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              identifier: email.trim(),
              password
            })
          });

          const loginData = await loginRes.json();
          if (loginRes.ok && loginData.token) {
            login(loginData.token, loginData.user);
          } else {
            setIsLoginMode(true);
            setSuccessMessage('Account created! Please log in with your credentials.');
          }
        } else {
          setErrorMessage(data.error || 'Failed to register account.');
        }
      } catch (err) {
        console.error('Registration error:', err);
        setErrorMessage('Unable to connect to server. Please ensure backend is running.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="auth-wrapper">
      <motion.div 
        className="auth-card"
        initial={{ opacity: 0, y: 25, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header Icon & Title */}
        <div className="auth-header">
          <div className="auth-icon-badge">
            <ShieldCheck size={28} className="auth-badge-icon" />
          </div>
          <h2 className="auth-title">
            {isLoginMode ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p className="auth-subtitle">
            {isLoginMode
              ? 'Sign in to access your JWT-protected task manager'
              : 'Register to manage tasks securely with MongoDB & JWT'}
          </p>
        </div>

        {/* Global / Session Alert (e.g. 401 token expiry) */}
        {authMessage && (
          <div className="auth-alert auth-alert-warning">
            <AlertCircle size={18} className="alert-icon" />
            <span>{authMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="auth-alert auth-alert-error">
            <AlertCircle size={18} className="alert-icon" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="auth-alert auth-alert-success">
            <CheckCircle2 size={18} className="alert-icon" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <AnimatePresence mode="wait">
            {!isLoginMode && (
              <motion.div
                key="username-field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="auth-field"
              >
                <label className="auth-label">Username</label>
                <div className="auth-input-container">
                  <User size={18} className="auth-input-icon" />
                  <input
                    type="text"
                    placeholder="e.g. darshan_raval"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="auth-input"
                    required={!isLoginMode}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="auth-field">
            <label className="auth-label">
              {isLoginMode ? 'Email or Username' : 'Email Address'}
            </label>
            <div className="auth-input-container">
              <Mail size={18} className="auth-input-icon" />
              <input
                type={isLoginMode ? 'text' : 'email'}
                placeholder={isLoginMode ? 'Enter email or username' : 'name@example.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <div className="auth-input-container">
              <Lock size={18} className="auth-input-icon" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-submit-btn"
          >
            {loading ? (
              <span className="btn-loading">
                <Loader2 size={18} className="spinner" />
                <span>Processing...</span>
              </span>
            ) : (
              <span className="btn-content">
                <span>{isLoginMode ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight size={18} />
              </span>
            )}
          </button>
        </form>

        {/* Toggle Mode Footer */}
        <div className="auth-footer">
          <p className="auth-switch-text">
            {isLoginMode ? "Don't have an account yet?" : 'Already have an account?'}
            <button
              type="button"
              onClick={toggleMode}
              className="auth-switch-btn"
            >
              {isLoginMode ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>

        {/* Security badge footer */}
        <div className="auth-security-badge">
          <Sparkles size={14} className="security-icon" />
          <span>Secured with Bcrypt (10 Salt Rounds) &amp; Signed JWT Tokens</span>
        </div>
      </motion.div>
    </div>
  );
}
