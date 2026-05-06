import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePaddle } from '../hooks/usePaddle';
import Navbar from '../components/Navbar';
import UpgradeBanner from '../components/UpgradeBanner';
import ReferralPanel from '../components/ReferralPanel';
import SubscriptionPanel from '../components/SubscriptionPanel';
import VideoApp from '../VideoApp';

export default function AppPage() {
  const { user, loading, refreshUser, deductCredit } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false);
  const [showCancelledNotice, setShowCancelledNotice] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showReferral, setShowReferral] = useState(false);

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
        onManageSubscription={() => setShowSubscription(true)}
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

      {/* Subscription panel — available to all users (free + pro) */}
      {showSubscription && (
        <SubscriptionPanel
          onClose={() => setShowSubscription(false)}
          onUpgrade={() => { setShowSubscription(false); handleUpgrade(); }}
          checkoutLoading={checkoutLoading}
        />
      )}

      {showReferral && <ReferralPanel onClose={() => setShowReferral(false)} />}

      <div style={{ paddingTop }}>
        <VideoApp onBeforeGenerate={handleBeforeGenerate} />
      </div>
    </div>
  );
}
