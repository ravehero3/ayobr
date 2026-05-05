import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_BASE = '/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchUser() {
    try {
      const res = await fetch(`${API_BASE}/user/me`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUser();
  }, []);

  const login = () => {
    window.location.href = `${API_BASE}/login`;
  };

  const logout = () => {
    window.location.href = `${API_BASE}/logout`;
  };

  const agreeToRights = async () => {
    const res = await fetch(`${API_BASE}/user/agree-rights`, {
      method: 'POST',
      credentials: 'include'
    });
    if (res.ok) {
      const updated = await res.json();
      setUser(prev => ({ ...prev, ...updated }));
      return true;
    }
    return false;
  };

  const deductCredit = async () => {
    const res = await fetch(`${API_BASE}/user/deduct-credit`, {
      method: 'POST',
      credentials: 'include'
    });
    if (res.status === 402) {
      const data = await res.json();
      return { success: false, message: data.message };
    }
    if (res.ok) {
      const data = await res.json();
      if (!data.isPro && data.creditsRemaining !== null) {
        setUser(prev => ({
          ...prev,
          credits: { ...prev?.credits, credits_remaining: data.creditsRemaining }
        }));
      }
      return { success: true, ...data };
    }
    return { success: false, message: 'Server error' };
  };

  const refreshUser = fetchUser;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, agreeToRights, deductCredit, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
