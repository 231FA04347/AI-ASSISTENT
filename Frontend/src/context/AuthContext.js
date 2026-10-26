import React, { createContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const normalizeProfile = (profile) => ({
    id: profile.id || profile._id,
    name:
      profile.name ||
      `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
    email: profile.email,
    role: profile.role,
    ...profile,
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      if (!token) {
        if (!cancelled) {
          setUser(null);
          setInitializing(false);
        }
        return;
      }

      try {
        const response = await authAPI.getProfile();
        const profile = response.data;

        const normalizedUser = normalizeProfile(profile);
        if (!cancelled) {
          setUser(normalizedUser);
        }
      } catch (error) {
        // Token is invalid/expired or backend unreachable; treat as logged out
        if (!cancelled) {
          setUser(null);
          setToken(null);
          localStorage.removeItem('token');
        }
      } finally {
        if (!cancelled) {
          setInitializing(false);
        }
      }
    };

    setInitializing(true);
    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await authAPI.login({ email, password });
      setToken(response.data.token);
      setUser(response.data.user);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (firstName, lastName, email, password, role, className) => {
    setLoading(true);
    try {
      const payload = { firstName, lastName, email, password, role };
      if (role === 'student' && typeof className !== 'undefined') {
        payload.className = className;
      }
      const response = await authAPI.register(payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const refreshProfile = async () => {
    if (!token) return null;

    try {
      const response = await authAPI.getProfile();
      const profile = response.data;
      const normalizedUser = normalizeProfile(profile);
      setUser(normalizedUser);
      return normalizedUser;
    } catch (error) {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      return null;
    }
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    refreshProfile,
    loading,
    initializing,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
