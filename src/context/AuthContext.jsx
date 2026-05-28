import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_BASE = '/api';

function captureReferralCode() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('ref');
  if (code) {
    localStorage.setItem('tb_referral_code', code.trim().toUpperCase());
  }
}

async function applyStoredReferralCode() {
  const code = localStorage.getItem('tb_referral_code');
  if (!code) return;
  try {
    await fetch(`${API_BASE}/user/referral/apply`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
  } catch {}
  localStorage.removeItem('tb_referral_code');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [featureFlags, setFeatureFlags] = useState({});
  const [loading, setLoading] = useState(true);
  const [liveProducerName, setLiveProducerName] = useState('');

  useEffect(() => {
    captureReferralCode();
  }, []);

  async function fetchUser() {
    try {
      const res = await fetch(`${API_BASE}/user/me`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setLiveProducerName(data.producer_name || '');
        
        // Fetch feature flags once user is identified
        const flagsRes = await fetch(`${API_BASE}/user/features`, { credentials: 'include' });
        if (flagsRes.ok) {
          const flagsData = await flagsRes.json();
          setFeatureFlags(flagsData);
        }
      } else {
        setUser(null);
        setFeatureFlags({});
        setLiveProducerName('');
      }
    } catch {
      setUser(null);
      setFeatureFlags({});
      setLiveProducerName('');
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
      await applyStoredReferralCode();
      await fetchUser();
      return true;
    }
    return false;
  };

  const deductCredit = async (count = 1) => {
    const res = await fetch(`${API_BASE}/user/deduct-credit`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count })
    });
    if (res.status === 402) {
      const data = await res.json();
      return { success: false, message: data.message };
    }
    if (res.ok) {
      const data = await res.json();
      if (!data.isUnlimited && data.creditsRemaining !== null) {
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
    <AuthContext.Provider value={{ user, featureFlags, loading, login, logout, agreeToRights, deductCredit, refreshUser, liveProducerName, setLiveProducerName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

