import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('financeflow-token') || '');
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('financeflow-user') || 'null'); }
    catch { return null; }
  });

  useEffect(() => {
    const clearSession = () => {
      localStorage.removeItem('financeflow-token');
      localStorage.removeItem('financeflow-user');
      setToken('');
      setUser(null);
    };
    window.addEventListener('financeflow:unauthorized', clearSession);
    return () => window.removeEventListener('financeflow:unauthorized', clearSession);
  }, []);

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('financeflow-token', data.token);
    localStorage.setItem('financeflow-user', JSON.stringify(data));
    setToken(data.token);
    setUser(data);
    return data;
  }

  async function register(name, email, password) {
    return api.post('/auth/register', { name, email, password });
  }

  function logout() {
    localStorage.removeItem('financeflow-token');
    localStorage.removeItem('financeflow-user');
    setToken('');
    setUser(null);
  }

  const value = useMemo(() => ({ token, user, login, register, logout }), [token, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
