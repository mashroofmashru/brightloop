import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('brightloop_user');
      if (saved && saved !== 'undefined') {
        return JSON.parse(saved);
      }
    } catch (e) {
      localStorage.removeItem('brightloop_user');
    }
    return null;
  });

  const [token, setToken] = useState(() => {
    const saved = localStorage.getItem('brightloop_token');
    return (saved && saved !== 'undefined') ? saved : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      authApi.getMe()
        .then(res => {
          setUser(res.user);
          localStorage.setItem('brightloop_user', JSON.stringify(res.user));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('brightloop_token', res.token);
    localStorage.setItem('brightloop_user', JSON.stringify(res.user));
    return res.user;
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('brightloop_token', res.token);
    localStorage.setItem('brightloop_user', JSON.stringify(res.user));
    return res.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('brightloop_token');
    localStorage.removeItem('brightloop_user');
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAdmin: user?.role === 'admin',
    isStaff: user?.role === 'staff',
    isInternal: user?.role === 'admin' || user?.role === 'staff',
    isCustomer: user?.role === 'customer'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
