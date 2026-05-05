import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import UpgradeBanner from '../components/UpgradeBanner';
import VideoApp from '../VideoApp';

export default function AppPage() {
  const { user, loading, refreshUser, deductCredit } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
    if (!loading && user && !user.rights_agreed) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      setShowUpgradeSuccess(true);
      refreshUser();
      setTimeout(() => setShowUpgradeSuccess(false), 5000);
    }
  }, [searchParams]);

  const handleUpgrade = async () => {
    try {
      const res = await fetch('/api/paddle/create-checkout', {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        const { url } = await res.json();
        if (url) {
          window.location.href = url;
        } else {
          alert('Checkout is not fully configured yet. Please check back soon!');
        }
      } else {
        alert('Paddle is not configured yet. Please check back soon!');
      }
    } catch {
      alert('Could not start checkout. Please try again.');
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#050a13] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const isPro = user.role === 'pro' || user.role === 'admin';
  const creditsLeft = user?.credits?.credits_remaining;

  const handleBeforeGenerate = async () => {
    if (isPro) return true;
    const result = await deductCredit();
    if (!result.success) {
      if (result.message) {
        alert(result.message);
      }
      return false;
    }
    return true;
  };

  return (
    <div className="relative">
      <Navbar />
      <UpgradeBanner creditsLeft={isPro ? null : creditsLeft} onUpgrade={handleUpgrade} />

      {/* PRO upgrade success banner */}
      {showUpgradeSuccess && (
        <div className="fixed top-14 left-0 right-0 z-[9999] flex items-center justify-center py-2 px-6"
          style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))', borderBottom: '1px solid rgba(59,130,246,0.4)' }}>
          <span className="text-blue-300 text-sm font-medium">
            Welcome to PRO! You now have unlimited video generation.
          </span>
        </div>
      )}

      {/* The existing video app — offset for navbar */}
      <div style={{ paddingTop: isPro || (creditsLeft !== undefined && creditsLeft > 2) ? 56 : 88 }}>
        <VideoApp onBeforeGenerate={handleBeforeGenerate} />
      </div>
    </div>
  );
}
