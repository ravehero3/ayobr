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
  const [upgradeSuccess, setUpgradeSuccess]     = useState(null); // null | 'pro' | 'unlimited'
  const [showCancelledNotice, setShowCancelledNotice] = useState(false);
  const [checkoutLoading, setCheckoutLoading]   = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showReferral, setShowReferral]         = useState(false);

  const { openCheckout } = usePaddle({
    onCheckoutCompleted: () => {
      refreshUser().then(() => {
        // After refresh, user.role will reflect the new plan
        setUpgradeSuccess('pro'); // will be corrected below after refresh
      });
      setTimeout(() => setUpgradeSuccess(null), 7000);
    }
  });

  useEffect(() => {
    if (!loading && !user) navigate('/login');
    if (!loading && user && !user.rights_agreed) navigate('/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      refreshUser();
      setUpgradeSuccess('pro');
      setTimeout(() => setUpgradeSuccess(null), 7000);
      setSearchParams({}, { replace: true });
    }
    if (searchParams.get('cancelled') === 'true') {
      setShowCancelledNotice(true);
      setTimeout(() => setShowCancelledNotice(false), 5000);
      setSearchParams({}, { replace: true });
    }
    if (searchParams.get('upgrade') === 'true') {
      setSearchParams({}, { replace: true });
      setTimeout(() => handleUpgradePro(), 800);
    }
    if (searchParams.get('upgrade') === 'unlimited') {
      setSearchParams({}, { replace: true });
      setTimeout(() => handleUpgradeUnlimited(), 800);
    }
  }, [searchParams]);

  const handleUpgradePro = async () => {
    setCheckoutLoading(true);
    try {
      const opened = await openCheckout(user?.email, 'pro');
      if (!opened) alert('Checkout is not yet configured. Please add your Paddle secrets to activate payments.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleUpgradeUnlimited = async () => {
    setCheckoutLoading(true);
    try {
      const opened = await openCheckout(user?.email, 'unlimited');
      if (!opened) alert('Checkout is not yet configured. Please add your Paddle secrets to activate payments.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#000' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const isUnlimited = user.role === 'unlimited' || user.role === 'admin';
  const isPaidPlan  = user.role === 'pro' || isUnlimited;
  const creditsLeft = user?.credits?.credits_remaining;
  const paddingTop  = isPaidPlan || (creditsLeft !== undefined && creditsLeft > 2) ? 56 : 88;

  const handleBeforeGenerate = async () => {
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
        onUpgradePro={handleUpgradePro}
        onUpgradeUnlimited={handleUpgradeUnlimited}
        checkoutLoading={checkoutLoading}
        onManageSubscription={() => setShowSubscription(true)}
        onInvite={() => setShowReferral(true)}
      />
      <UpgradeBanner
        user={user}
        onUpgradePro={handleUpgradePro}
        onUpgradeUnlimited={handleUpgradeUnlimited}
        checkoutLoading={checkoutLoading}
      />

      {/* Upgrade success banner */}
      {upgradeSuccess && (
        <div className="fixed top-14 left-0 right-0 z-[9999] flex items-center justify-center py-2 px-6"
          style={{
            background: upgradeSuccess === 'unlimited'
              ? 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.2))'
              : 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))',
            borderBottom: upgradeSuccess === 'unlimited'
              ? '1px solid rgba(251,191,36,0.4)'
              : '1px solid rgba(59,130,246,0.4)'
          }}>
          <span className="text-sm font-medium" style={{ color: upgradeSuccess === 'unlimited' ? '#fbbf24' : '#93c5fd' }}>
            {upgradeSuccess === 'unlimited'
              ? '🌟 Welcome to Unlimited! You now have 4K output and unlimited video generation.'
              : '⭐ Welcome to PRO! You now have 31 videos/month and 1080p output.'}
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

      {showSubscription && (
        <SubscriptionPanel
          onClose={() => setShowSubscription(false)}
          onUpgradePro={() => { setShowSubscription(false); handleUpgradePro(); }}
          onUpgradeUnlimited={() => { setShowSubscription(false); handleUpgradeUnlimited(); }}
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
