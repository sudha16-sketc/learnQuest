import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadUser() {
      try {
        if (api.getToken()) {
          const res = await api.getMe();
          if (res.success) {
            setUser(res.user);
          }
        }
      } catch (err) {
        console.warn('Failed to load session:', err.message);
        api.setToken(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (loginIdentifier, password) => {
    setError(null);
    try {
      const res = await api.login(loginIdentifier, password);
      if (res.success) {
        setUser(res.user);
        return res.user;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (email, username, password) => {
    setError(null);
    try {
      const res = await api.register(email, username, password);
      if (res.success) {
        setUser(res.user);
        return res.user;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      if (res.success) {
        setUser(res.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
