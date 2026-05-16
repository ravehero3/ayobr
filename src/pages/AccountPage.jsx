import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import typebeatLogo from '../assets/typebeatz logo 2 white version_1754509091303.png';
import useDocumentTitle from '../hooks/useDocumentTitle';

const NM = "'Neue Montreal', 'Inter', sans-serif";

function StatCard({ label, value, sub }) {
  return (
    <div className="relative group overflow-hidden rounded-2xl border border-white/10 p-5 transition-all hover:border-white/20"
      style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)' }}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-bold" style={{ fontFamily: NM }}>{label}</p>
      <p className="text-3xl font-black text-white tracking-tighter" style={{ fontFamily: NM }}>{value}</p>
      {sub && <p className="text-[11px] text-gray-500 mt-2 font-medium" style={{ fontFamily: NM }}>{sub}</p>}
    </div>
  );
}

function formatDate(dateStr, language) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString(language === 'cs' ? 'cs-CZ' : 'en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  } catch { return '—'; }
}

export default function AccountPage() {
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  useDocumentTitle(t('account.title'));
  const [sub, setSub] = useState(null);
  const [referral, setReferral] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const isUnlimited = user?.role === 'unlimited' || user?.role === 'admin';
  const isPro       = user?.role === 'pro';
  const isPaid      = isPro || isUnlimited;

  useEffect(() => {
    if (!user) return;

    const fetches = [
      fetch('/api/user/referral', { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(data => setReferral(data))
        .catch(() => {})
    ];

    if (isPaid) {
      fetches.push(
        fetch('/api/paddle/subscription', { credentials: 'include' })
          .then(r => r.ok ? r.json() : null)
          .then(data => setSub(data))
          .catch(() => {})
      );
    }

    Promise.all(fetches).finally(() => setLoading(false));
  }, [user, isPaid]);

  const referralLink = referral?.code ? `${window.location.origin}/?ref=${referral.code}` : null;

  const handleCopy = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-[#050a13] flex flex-col items-center justify-center p-6">
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 rounded-full border-4 border-white/5 border-t-sky-500 shadow-[0_0_30px_rgba(14,165,233,0.2)]"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
          </div>
        </div>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-sky-400/60 text-sm font-medium tracking-widest uppercase"
          style={{ fontFamily: NM }}
        >
          {t('account.securingSession')}
        </motion.p>
      </div>
    );
  }

  const creditsRemaining = user?.credits?.credits_remaining ?? 5;
  const creditsUsed = user?.credits?.credits_used_this_month ?? 0;
  const lastReset = user?.credits?.last_reset_at;

  return (
    <div className="min-h-screen bg-[#050a13] text-white selection:bg-sky-500/30">
      {/* Dynamic Glows */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-sky-600/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none translate-y-1/2" />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-12 h-16"
        style={{ background: 'rgba(5,10,19,0.38)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => navigate('/')} className="hover:opacity-80 transition-opacity">
          <img src={typebeatLogo} alt="TypeBeatz" style={{ height: 20 }} />
        </button>
        <button onClick={() => navigate('/app')}
          className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-all flex items-center gap-2"
          style={{ fontFamily: NM }}>
          <span className="text-lg">←</span> {t('account.backToApp')}
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pt-32 pb-24 relative z-10">
        
        {/* Profile Section */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-16">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-br from-sky-500 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000" />
            <div className="relative w-24 h-24 rounded-full overflow-hidden border border-white/10 bg-[#0a0a0a]">
              {user.profile_image_url ? (
                <img src={user.profile_image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-black text-white/20"
                  style={{ background: 'rgba(255,255,255,0.02)', fontFamily: NM }}>
                  {(user.first_name?.[0] || user.email?.[0] || '?').toUpperCase()}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1">
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2" style={{ fontFamily: NM }}>
              {user.first_name}{user.last_name ? ` ${user.last_name}` : ''}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-gray-400 text-sm font-medium" style={{ fontFamily: NM }}>{user.email}</span>
              <div className="w-1 h-1 rounded-full bg-white/10" />
              <span className="text-gray-500 text-xs font-medium uppercase tracking-wider" style={{ fontFamily: NM }}>
                {t('account.memberSince')} {new Date(user.created_at).toLocaleDateString(language === 'cs' ? 'cs-CZ' : 'en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>
            
            <div className="flex items-center gap-2 mt-4">
              {isUnlimited ? (
                <div className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-yellow-500/40 text-yellow-500 bg-yellow-500/5" style={{ fontFamily: NM }}>
                  🌟 UNLIMITED
                </div>
              ) : isPro ? (
                <div className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-sky-500/40 text-sky-500 bg-sky-500/5" style={{ fontFamily: NM }}>
                  ⭐ PRO
                </div>
              ) : (
                <div className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-white/10 text-gray-500 bg-white/5" style={{ fontFamily: NM }}>
                  FREE
                </div>
              )}
              {user.role === 'admin' && (
                <div className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-orange-500/40 text-orange-500 bg-orange-500/5" style={{ fontFamily: NM }}>
                  ADMIN
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Grid Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Usage Stats */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="space-y-4">
            <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1" style={{ fontFamily: NM }}>{t('account.thisMonth')}</h2>
            <div className="grid grid-cols-1 gap-4">
              {isUnlimited ? (
                <StatCard label={t('account.videosRemaining')} value="∞" sub={t('landing.hero.unlimited')} />
              ) : (
                <StatCard 
                  label={t('account.videosRemaining')} 
                  value={creditsRemaining} 
                  sub={`${t('account.of')} ${isPro ? `31 ${t('account.proCredits')}` : `5 ${t('account.freeCredits')}`}`} 
                />
              )}
              
              <div className="rounded-2xl border border-white/5 p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest" style={{ fontFamily: NM }}>{t('account.monthlyUsage')}</span>
                  <span className="text-xs font-bold text-white" style={{ fontFamily: NM }}>{creditsUsed} / {isPro ? 31 : 5} {t('account.used')}</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (creditsUsed / (isPro ? 31 : 5)) * 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{
                      background: creditsRemaining === 0 ? '#ef4444' : 'linear-gradient(90deg, #0ea5e9, #3b82f6)',
                      boxShadow: '0 0 10px rgba(14,165,233,0.3)'
                    }}
                  />
                </div>
                <p className="text-[10px] text-gray-600 mt-4 font-medium" style={{ fontFamily: NM }}>{t('account.resetsOn')}</p>
              </div>
            </div>
          </motion.section>

          {/* Subscription Section */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="space-y-4">
            <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1" style={{ fontFamily: NM }}>{t('account.subscription')}</h2>
            <div className="rounded-2xl border border-white/10 p-6 flex flex-col justify-between h-full min-h-[220px]" 
              style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)' }}>
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-2xl font-black text-white tracking-tighter" style={{ fontFamily: NM }}>
                    {isUnlimited ? t('account.unlimitedPlan') : isPro ? t('account.proPlan') : t('account.freePlan')}
                  </div>
                  {sub && (
                    <div className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase border ${
                      sub.status === 'active' ? 'border-green-500/30 text-green-500 bg-green-500/5' : 'border-yellow-500/30 text-yellow-500 bg-yellow-500/5'
                    }`} style={{ fontFamily: NM }}>
                      {sub.status === 'active' ? t('account.active') : sub.status === 'cancelling' ? t('account.cancelling') : sub.status}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 leading-relaxed" style={{ fontFamily: NM }}>
                  {isUnlimited ? t('account.unlimitedPlanDesc') : isPro ? t('account.proPlanDesc') : t('account.freePlanDesc')}
                </p>
                {sub?.current_period_end && (
                  <p className="text-xs text-gray-400 mt-4 font-medium" style={{ fontFamily: NM }}>
                    {sub.status === 'cancelling' ? t('account.accessUntil') : t('account.nextBilling')}:{' '}
                    <span className="text-white">{formatDate(sub.current_period_end, language)}</span>
                  </p>
                )}
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                {isPaid ? (
                  <button onClick={() => navigate('/app?manage=true')}
                    className="text-xs font-black text-sky-400 hover:text-white transition-all uppercase tracking-widest border-b border-sky-400/20 hover:border-white/50 pb-1"
                    style={{ fontFamily: NM }}>
                    {t('account.manageSub')}
                  </button>
                ) : (
                  <button onClick={() => navigate('/app?upgrade=true')}
                    className="w-full py-3 rounded-xl bg-white text-black text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all active:scale-[0.98]"
                    style={{ fontFamily: NM }}>
                    {t('account.upgradeToPro')}
                  </button>
                )}
                {isPro && (
                  <button onClick={() => navigate('/app?upgrade=unlimited')}
                    className="text-xs font-black text-yellow-500 hover:text-white transition-all uppercase tracking-widest border-b border-yellow-500/20 hover:border-white/50 pb-1"
                    style={{ fontFamily: NM }}>
                    {t('account.upgradeToUnlimited')}
                  </button>
                )}
              </div>
            </div>
          </motion.section>

          {/* Referral Section */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="md:col-span-2 space-y-4">
            <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1" style={{ fontFamily: NM }}>{t('account.referrals')}</h2>
            <div className="rounded-2xl border border-white/5 p-8" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-8">
                <div className="max-w-md">
                  <h3 className="text-xl font-black text-white mb-2 tracking-tight" style={{ fontFamily: NM }}>{t('account.referralGift')}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed" style={{ fontFamily: NM }}>{t('account.referralDesc')}</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white tracking-tighter" style={{ fontFamily: NM }}>{referral?.uses || 0}</span>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest" style={{ fontFamily: NM }}>{t('account.referred')}</span>
                </div>
              </div>

              {referralLink && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-1" style={{ fontFamily: NM }}>{t('account.yourReferralLink')}</p>
                  <div className="flex flex-col sm:flex-row items-stretch gap-2">
                    <div className="flex-1 rounded-xl px-4 py-3 border border-white/10 bg-black/40 text-xs text-sky-400 font-mono flex items-center overflow-hidden">
                      <span className="truncate">{referralLink}</span>
                    </div>
                    <button onClick={handleCopy}
                      className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        copied ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-white text-black hover:scale-[1.02]'
                      }`}
                      style={{ fontFamily: NM }}>
                      {copied ? t('account.copied') : t('account.copy')}
                    </button>
                  </div>
                </div>
              )}

              {referral?.uses > 0 && (
                <p className="text-xs text-green-400/80 mt-6 font-bold" style={{ fontFamily: NM }}>
                  {referral.uses === 1 
                    ? t('account.earnedBonus').replace('{count}', referral.uses) 
                    : t('account.earnedBonusPlural').replace('{count}', referral.uses)}
                </p>
              )}
            </div>
          </motion.section>

          {/* Quick Actions */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="md:col-span-2 space-y-4">
            <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1" style={{ fontFamily: NM }}>{t('account.actions')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button onClick={() => navigate('/app')}
                className="flex items-center justify-between p-5 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all group">
                <span className="text-sm font-black tracking-tight" style={{ fontFamily: NM }}>{t('account.openApp')}</span>
                <span className="text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all">→</span>
              </button>
              {user.role === 'admin' && (
                <button onClick={() => navigate('/admin')}
                  className="flex items-center justify-between p-5 rounded-2xl border border-white/5 bg-orange-500/5 hover:bg-orange-500/10 hover:border-orange-500/20 transition-all group">
                  <span className="text-sm font-black tracking-tight text-orange-500" style={{ fontFamily: NM }}>{t('account.adminPanel')}</span>
                  <span className="text-orange-500/40 group-hover:text-orange-500 group-hover:translate-x-1 transition-all">→</span>
                </button>
              )}
              <button onClick={logout}
                className="flex items-center justify-between p-5 rounded-2xl border border-white/5 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/20 transition-all group">
                <span className="text-sm font-black tracking-tight text-red-500" style={{ fontFamily: NM }}>{t('account.signOut')}</span>
                <span className="text-red-500/40 group-hover:text-red-500 group-hover:translate-x-1 transition-all">→</span>
              </button>
            </div>
          </motion.section>

        </div>
      </div>
    </div>
  );
}
