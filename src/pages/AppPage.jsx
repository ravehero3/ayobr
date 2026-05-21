import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import UpgradeBanner from '../components/UpgradeBanner';
import ReferralPanel from '../components/ReferralPanel';
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
  const [showReferral, setShowReferral]         = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
    if (!loading && user && !user.rights_agreed) navigate('/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      setSearchParams({}, { replace: true });
      let cancelled = false;
      (async () => {
        let activated = false;
        for (let i = 0; i < 15 && !cancelled; i++) {
          await refreshUser();
          try {
            const res = await fetch('/api/user/me', { credentials: 'include' });
            if (res.ok) {
              const data = await res.json();
              if (data.role === 'unlimited' || data.role === 'admin') {
                setUpgradeSuccess('unlimited');
                activated = true;
                break;
              }
              if (data.role === 'pro') {
                setUpgradeSuccess('pro');
                activated = true;
                break;
              }
            }
          } catch { /* retry */ }
          if (i < 14) await new Promise(r => setTimeout(r, 2000));
        }
        if (!activated && !cancelled) setUpgradeSuccess('pro');
      })();
      const hideTimer = setTimeout(() => setUpgradeSuccess(null), 7000);
      return () => { cancelled = true; clearTimeout(hideTimer); };
    }
    if (searchParams.get('cancelled') === 'true') {
      setShowCancelledNotice(true);
      setTimeout(() => setShowCancelledNotice(false), 5000);
      setSearchParams({}, { replace: true });
    }
    const upgradeParam = searchParams.get('upgrade');
    if (upgradeParam === 'true' || upgradeParam === 'pro' || upgradeParam === 'unlimited') {
      const plan = upgradeParam === 'unlimited' ? 'unlimited' : 'pro';
      const interval = searchParams.get('interval') === 'monthly' ? 'monthly' : 'yearly';
      setSearchParams({}, { replace: true });
      navigate(`/upgrade?plan=${plan}&interval=${interval}`);
    }
  }, [searchParams, navigate, refreshUser, setSearchParams]);

  const handleUpgradePro = () => navigate('/upgrade');
  const handleUpgradeUnlimited = () => navigate('/upgrade');

  if (loading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black p-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-white/5 border-t-white animate-spin shadow-[0_0_30px_rgba(255,255,255,0.1)]" />
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
        onManageSubscription={() => navigate('/account')}
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



      {showReferral && <ReferralPanel onClose={() => setShowReferral(false)} />}

      <div style={{ paddingTop }}>
        <VideoApp onBeforeGenerate={handleBeforeGenerate} />
      </div>
    </div>
  );
}
