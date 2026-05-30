import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import UpgradeBanner from '../components/UpgradeBanner';
import ReferralPanel from '../components/ReferralPanel';
import VideoApp from '../VideoApp';
import { initializeFFmpeg } from '../utils/ffmpegProcessor';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useLanguage } from '../context/LanguageContext';

export default function AppPage() {
  const { user, loading, refreshUser, deductCredit } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  useDocumentTitle(t('nav.app'));
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCancelledNotice, setShowCancelledNotice] = useState(false);
  const [checkoutLoading, setCheckoutLoading]   = useState(false);
  const [showReferral, setShowReferral]         = useState(false);

  const wasmPreloaded = useRef(false);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
    if (!loading && user && !user.rights_agreed) navigate('/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && user?.rights_agreed && !wasmPreloaded.current) {
      wasmPreloaded.current = true;
      initializeFFmpeg().catch((err) => {
        console.warn('FFmpeg WASM preload:', err?.message || err);
        wasmPreloaded.current = false;
      });
    }
  }, [loading, user]);

  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      setSearchParams({}, { replace: true });
      let cancelled = false;
      (async () => {
        let detectedPlan = null;
        for (let i = 0; i < 15 && !cancelled; i++) {
          await refreshUser();
          try {
            const res = await fetch('/api/user/me', { credentials: 'include' });
            if (res.ok) {
              const data = await res.json();
              if (data.role === 'unlimited' || data.role === 'admin') { detectedPlan = 'unlimited'; break; }
              if (data.role === 'pro') { detectedPlan = 'pro'; break; }
            }
          } catch { /* retry */ }
          if (i < 14) await new Promise(r => setTimeout(r, 2000));
        }
        if (!cancelled) navigate(`/success?plan=${detectedPlan || 'pro'}`);
      })();
      return () => { cancelled = true; };
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
      let msg = result.message || '';
      if (result.errorCode === 'insufficient_credits_free') {
        msg = t('error.insufficientCreditsFree')
          .replace('{needed}', result.needed)
          .replace('{remaining}', result.remaining);
      } else if (result.errorCode === 'insufficient_credits_pro') {
        msg = t('error.insufficientCreditsPro')
          .replace('{needed}', result.needed)
          .replace('{remaining}', result.remaining);
      }
      if (msg) alert(msg);
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
