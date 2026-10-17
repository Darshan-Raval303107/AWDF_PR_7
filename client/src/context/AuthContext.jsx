import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_ME_URL = '/api/me';
const FALLBACK_ME_URL = 'http://localhost:5001/api/me';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState('');

  // Verify stored token against GET /me on startup
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        let res;
        try {
          res = await fetch(API_ME_URL, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
        } catch {
          res = await fetch(FALLBACK_ME_URL, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
        }

        if (res && res.ok) {
          const data = await res.json();
          setCurrentUser(data.user || data);
          setToken(storedToken);
        } else {
          // Token is invalid, malformed, or expired (401)
          localStorage.removeItem('token');
          setToken('');
          setCurrentUser(null);
          setAuthMessage('Your previous session expired. Please log in again.');
        }
      } catch (err) {
        console.error('Session verification error:', err);
        localStorage.removeItem('token');
        setToken('');
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = (newToken, user) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setCurrentUser(user);
    setAuthMessage('');
  };

  const logout = (message = '') => {
    localStorage.removeItem('token');
    setToken('');
    setCurrentUser(null);
    if (message) {
      setAuthMessage(message);
    }
  };

  const value = {
    token,
    currentUser,
    isAuthenticated: Boolean(token && currentUser),
    loading,
    authMessage,
    setAuthMessage,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
