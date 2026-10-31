import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('brightloop_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('brightloop_token') || null);
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

  // Quick switcher for paired role evaluation
  const switchRoleDemo = async (roleType) => {
    const credentials = {
      admin: { email: 'admin@brightloop.io', pass: 'BrightAdmin2026!' },
      staff: { email: 'staff@brightloop.io', pass: 'BrightStaff2026!' },
      customer: { email: 'sarah@techcorp.com', pass: 'CustomerPass2026!' }
    };
    const target = credentials[roleType] || credentials.admin;
    return login(target.email, target.pass);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    switchRoleDemo,
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
