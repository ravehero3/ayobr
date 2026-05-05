import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePaddle } from '../hooks/usePaddle';
import Navbar from '../components/Navbar';
import UpgradeBanner from '../components/UpgradeBanner';
import ReferralPanel from '../components/ReferralPanel';
import VideoApp from '../VideoApp';

export default function AppPage() {
  const { user, loading, refreshUser, deductCredit } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false);
  const [showCancelledNotice, setShowCancelledNotice] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showManageSubscription, setShowManageSubscription] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const { openCheckout } = usePaddle({
    onCheckoutCompleted: () => {
      setShowUpgradeSuccess(true);
      refreshUser();
      setTimeout(() => setShowUpgradeSuccess(false), 6000);
    }
  });

  useEffect(() => {
    if (!loading && !user) navigate('/login');
    if (!loading && user && !user.rights_agreed) navigate('/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      setShowUpgradeSuccess(true);
      refreshUser();
      setTimeout(() => setShowUpgradeSuccess(false), 6000);
      // Clean URL
      setSearchParams({}, { replace: true });
    }
    if (searchParams.get('cancelled') === 'true') {
      setShowCancelledNotice(true);
      setTimeout(() => setShowCancelledNotice(false), 5000);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    try {
      const opened = await openCheckout(user?.email);
      if (!opened) {
        alert('Checkout is not yet configured. Please add your Paddle secrets to activate payments.');
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure? You\'ll keep PRO access until the end of your billing period.')) return;
    setCancelLoading(true);
    try {
      const res = await fetch('/api/paddle/cancel', {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        alert('Your subscription has been scheduled for cancellation at the end of your billing period.');
        refreshUser();
        setShowManageSubscription(false);
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to cancel subscription. Please try again.');
      }
    } catch {
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      setCancelLoading(false);
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
  const paddingTop = isPro || (creditsLeft !== undefined && creditsLeft > 2) ? 56 : 88;

  const handleBeforeGenerate = async () => {
    if (isPro) return true;
    const result = await deductCredit();
    if (!result.success) {
      if (result.message) alert(result.message);
      return false;
    }
    return true;
  };

  return (
    <div className="relative">
      <Navbar
        onUpgrade={handleUpgrade}
        checkoutLoading={checkoutLoading}
        onManageSubscription={() => setShowManageSubscription(true)}
        onInvite={() => setShowReferral(true)}
      />
      <UpgradeBanner
        creditsLeft={isPro ? null : creditsLeft}
        onUpgrade={handleUpgrade}
        checkoutLoading={checkoutLoading}
      />

      {/* PRO upgrade success banner */}
      {showUpgradeSuccess && (
        <div className="fixed top-14 left-0 right-0 z-[9999] flex items-center justify-center py-2 px-6"
          style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))', borderBottom: '1px solid rgba(59,130,246,0.4)' }}>
          <span className="text-blue-300 text-sm font-medium">
            Welcome to PRO! You now have unlimited video generation.
          </span>
        </div>
      )}

      {/* Checkout cancelled notice */}
      {showCancelledNotice && (
        <div className="fixed top-14 left-0 right-0 z-[9999] flex items-center justify-center py-2 px-6"
          style={{ background: 'rgba(100,100,100,0.15)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="text-gray-400 text-sm">Checkout cancelled. You can upgrade any time.</span>
        </div>
      )}

      {/* Subscription management modal */}
      {showManageSubscription && isPro && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowManageSubscription(false)}>
          <div className="w-full max-w-sm mx-4 rounded-2xl border border-white/10 p-6 shadow-2xl"
            style={{ background: 'rgba(10,15,30,0.98)' }}
            onClick={e => e.stopPropagation()}>
            <h2 className="text-white font-bold text-lg mb-1">Your PRO Subscription</h2>
            <p className="text-gray-400 text-sm mb-6">
              You're on the PRO plan — unlimited video generation.
            </p>

            <div className="flex items-center justify-between p-3 rounded-xl mb-6"
              style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <div className="flex items-center gap-2">
                <span className="text-blue-400">⭐</span>
                <span className="text-blue-300 text-sm font-medium">PRO Plan — $9.99/month</span>
              </div>
              <span className="text-xs text-green-400 font-medium px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                Active
              </span>
            </div>

            <button
              onClick={handleCancelSubscription}
              disabled={cancelLoading}
              className="w-full py-2.5 rounded-xl text-sm text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3">
              {cancelLoading ? 'Cancelling...' : 'Cancel subscription'}
            </button>
            <button
              onClick={() => setShowManageSubscription(false)}
              className="w-full py-2.5 rounded-xl text-sm text-gray-400 hover:text-white transition-colors">
              Close
            </button>
          </div>
        </div>
      )}

      {showReferral && <ReferralPanel onClose={() => setShowReferral(false)} />}

      <div style={{ paddingTop }}>
        <VideoApp onBeforeGenerate={handleBeforeGenerate} />
      </div>
    </div>
  );
}
