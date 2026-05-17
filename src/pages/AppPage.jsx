import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePaddle } from '../hooks/usePaddle';
import Navbar from '../components/Navbar';
import UpgradeBanner from '../components/UpgradeBanner';
import ReferralPanel from '../components/ReferralPanel';
import SubscriptionPanel from '../components/SubscriptionPanel';
import VideoApp from '../VideoApp';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useLanguage } from '../context/LanguageContext';

export default function AppPage() {
  const { user, loading, refreshUser, deductCredit } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  useDocumentTitle(t('nav.app'));
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
    const interval = searchParams.get('interval') || 'yearly';
    if (searchParams.get('upgrade') === 'true' || searchParams.get('upgrade') === 'pro') {
      setSearchParams({}, { replace: true });
      setTimeout(() => handleUpgradePro(interval), 800);
    }
    if (searchParams.get('upgrade') === 'unlimited') {
      setSearchParams({}, { replace: true });
      setTimeout(() => handleUpgradeUnlimited(interval), 800);
    }
  }, [searchParams]);

  const handleUpgradePro = async (interval = 'yearly') => {
    setCheckoutLoading(true);
    try {
      const opened = await openCheckout(user?.email, 'pro', interval);
      if (!opened) alert(t('app.checkoutNotConfigured'));
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleUpgradeUnlimited = async (interval = 'yearly') => {
    setCheckoutLoading(true);
    try {
      const opened = await openCheckout(user?.email, 'unlimited', interval);
      if (!opened) alert(t('app.checkoutNotConfigured'));
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black p-6">
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 rounded-full border-4 border-white/5 border-t-white shadow-[0_0_30px_rgba(255,255,255,0.1)]"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white animate-ping" />
          </div>
        </div>
      </div>
    );
  }

  const isUnlimited = user.role === 'unlimited' || user.role === 'admin';
  const isPaidPlan  = user.role === 'pro' || isUnlimited;
  const creditsLeft = user?.credits?.credits_remaining;
  const paddingTop  = isPaidPlan || (creditsLeft !== undefined && creditsLeft > 2) ? 56 : 88;

  const handleBeforeGenerate = async (count = 1) => {
    const result = await deductCredit(count);
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
              ? 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))'
              : 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
            borderBottom: upgradeSuccess === 'unlimited'
              ? '1px solid rgba(251,191,36,0.4)'
              : '1px solid rgba(255,255,255,0.4)'
          }}>
          <span className="text-sm font-medium" style={{ color: upgradeSuccess === 'unlimited' ? '#fbbf24' : '#ffffff' }}>
            {upgradeSuccess === 'unlimited'
              ? t('app.upgradedToUnlimited')
              : t('app.upgradedToPro')}
          </span>
        </div>
      )}

      {/* Checkout cancelled notice */}
      {showCancelledNotice && (
        <div className="fixed top-14 left-0 right-0 z-[9999] flex items-center justify-center py-2 px-6"
          style={{ background: 'rgba(100,100,100,0.15)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="text-gray-400 text-sm">{t('app.checkoutCancelled')}</span>
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
