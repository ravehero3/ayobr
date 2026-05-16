import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import typebeatLogo from '../assets/typebeatz logo 2 white version_1754509091303.png';
import userIcon from '../assets/user_1754478889614.png';
import useDocumentTitle from '../hooks/useDocumentTitle';

const NM = "'Neue Montreal', 'Inter', sans-serif";

function GlassCard({ children, className = "", highlight = false }) {
  return (
    <div 
      className={`relative overflow-hidden rounded-2xl border border-[#333] p-6 sm:p-8 transition-all duration-300 ${className}`}
      style={{ 
        background: '#0a0a0a',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)',
      }}
    >
      {children}
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, disabled }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] px-1" style={{ fontFamily: NM }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30 transition-all"
        style={{ fontFamily: NM }}
      />
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
  const { user, logout, refreshUser } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  useDocumentTitle(t('account.title'));
  
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [producerName, setProducerName] = useState('');

  const isUnlimited = user?.role === 'unlimited' || user?.role === 'admin';
  const isPro       = user?.role === 'pro';
  const isPaid      = isPro || isUnlimited;

  useEffect(() => {
    if (!user) return;
    
    // Sync form state
    setFirstName(user.first_name || '');
    setLastName(user.last_name || '');
    setProducerName(user.producer_name || '');

    if (isPaid) {
      fetch('/api/paddle/subscription', { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(data => setSub(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user, isPaid]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          producer_name: producerName
        })
      });
      if (res.ok) {
        await refreshUser();
        setSaveMessage(t('account.profileUpdated'));
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (err) {
      console.error('Save profile error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 rounded-full border-2 border-white/5 border-t-white"
        />
        <p className="mt-8 text-white/40 text-[10px] font-bold tracking-[0.2em] uppercase" style={{ fontFamily: NM }}>
          {t('account.securingSession')}
        </p>
      </div>
    );
  }

  const creditsRemaining = user?.credits?.credits_remaining ?? 5;
  const creditsUsed = user?.credits?.credits_used_this_month ?? 0;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-12 h-16 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <button onClick={() => navigate('/')} className="hover:opacity-80 transition-opacity">
          <img src={typebeatLogo} alt="TypeBeatz" style={{ height: 18 }} />
        </button>
        <button onClick={() => navigate('/app')}
          className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all flex items-center gap-2"
          style={{ fontFamily: NM }}>
          <span className="text-sm">←</span> {t('account.backToApp')}
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pt-32 pb-24 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Profile & Settings */}
          <div className="lg:col-span-7 space-y-8">
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <GlassCard>
                <div className="flex items-center gap-6 mb-10">
                  <div className="w-20 h-20 rounded-full overflow-hidden border border-white/10 bg-white/5">
                    {user.profile_image_url ? (
                      <img src={user.profile_image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <img src={userIcon} alt="" className="w-full h-full object-cover opacity-50 p-4" />
                    )}
                  </div>
                  <div>
                    <h1 className="text-3xl font-black text-white tracking-tighter" style={{ fontFamily: NM }}>
                      {user.first_name || 'User'}{user.last_name ? ` ${user.last_name}` : ''}
                    </h1>
                    <p className="text-gray-500 text-sm font-medium mt-1" style={{ fontFamily: NM }}>{user.email}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase border border-white/10 text-gray-400 bg-white/5" style={{ fontFamily: NM }}>
                        {user.role}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label={t('account.firstName')} value={firstName} onChange={setFirstName} placeholder="Enter first name" />
                    <InputField label={t('account.lastName')} value={lastName} onChange={setLastName} placeholder="Enter last name" />
                  </div>
                  <InputField label={t('account.producerName')} value={producerName} onChange={setProducerName} placeholder="Enter stage name" />
                  
                  <div className="pt-4 flex items-center justify-between">
                    <button 
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-8 py-3 rounded-xl bg-white text-black text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                      style={{ fontFamily: NM }}
                    >
                      {saving ? t('account.saving') : t('account.saveChanges')}
                    </button>
                    <AnimatePresence>
                      {saveMessage && (
                        <motion.span 
                          initial={{ opacity: 0, x: 10 }} 
                          animate={{ opacity: 1, x: 0 }} 
                          exit={{ opacity: 0 }}
                          className="text-xs font-bold text-gray-500"
                        >
                          {saveMessage}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Quick Actions */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="grid grid-cols-2 gap-4">
              <button onClick={() => navigate('/app')}
                className="flex items-center justify-between p-6 rounded-2xl border border-white/5 bg-white/5 hover:border-white/20 transition-all group">
                <span className="text-xs font-black uppercase tracking-widest text-gray-400 group-hover:text-white" style={{ fontFamily: NM }}>{t('account.openApp')}</span>
                <span className="text-gray-700 group-hover:text-white transition-all">→</span>
              </button>
              <button onClick={logout}
                className="flex items-center justify-between p-6 rounded-2xl border border-white/5 bg-white/5 hover:border-white/20 transition-all group">
                <span className="text-xs font-black uppercase tracking-widest text-red-900 group-hover:text-red-500" style={{ fontFamily: NM }}>{t('account.signOut')}</span>
                <span className="text-red-900/50 group-hover:text-red-500 transition-all">→</span>
              </button>
            </motion.section>
          </div>

          {/* Right Column: Usage & Plan */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Subscription Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <GlassCard className="h-full">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]" style={{ fontFamily: NM }}>{t('account.subscription')}</h2>
                  {sub && (
                    <div className="px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase border border-white/10 text-gray-500" style={{ fontFamily: NM }}>
                      {sub.status === 'active' ? t('account.active') : t('account.cancelling')}
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <div className="text-4xl font-black text-white tracking-tighter mb-2" style={{ fontFamily: NM }}>
                    {isUnlimited ? t('account.unlimitedPlan') : isPro ? t('account.proPlan') : t('account.freePlan')}
                  </div>
                  <p className="text-sm text-gray-500 font-medium" style={{ fontFamily: NM }}>
                    {isUnlimited ? t('account.unlimitedPlanDesc') : isPro ? t('account.proPlanDesc') : t('account.freePlanDesc')}
                  </p>
                </div>

                {sub?.current_period_end && (
                  <div className="mb-10 py-4 border-y border-white/5">
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1" style={{ fontFamily: NM }}>
                      {sub.status === 'cancelling' ? t('account.accessUntil') : t('account.nextBilling')}
                    </p>
                    <p className="text-sm font-black text-white" style={{ fontFamily: NM }}>
                      {formatDate(sub.current_period_end, language)}
                    </p>
                  </div>
                )}

                <div className="mt-auto pt-6">
                  {isPaid ? (
                    <button onClick={() => navigate('/app?manage=true')}
                      className="w-full py-4 rounded-xl border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                      style={{ fontFamily: NM }}>
                      {t('account.manageSub')}
                    </button>
                  ) : (
                    <button onClick={() => navigate('/app?upgrade=true')}
                      className="w-full py-4 rounded-xl bg-white text-black text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all"
                      style={{ fontFamily: NM }}>
                      {t('account.upgradeToPro')}
                    </button>
                  )}
                </div>
              </GlassCard>
            </motion.div>

            {/* Usage Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <GlassCard>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]" style={{ fontFamily: NM }}>{t('account.thisMonth')}</h2>
                  <span className="text-[10px] text-gray-600 font-medium uppercase tracking-widest" style={{ fontFamily: NM }}>{t('account.resetsOn')}</span>
                </div>

                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-6xl font-black text-white tracking-tighter" style={{ fontFamily: NM }}>
                    {isUnlimited ? '∞' : creditsRemaining}
                  </span>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest" style={{ fontFamily: NM }}>
                    {t('account.videosRemaining')}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-gray-600">{t('account.monthlyUsage')}</span>
                    <span className="text-gray-400">{creditsUsed} / {isPro ? 31 : 5}</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (creditsUsed / (isPro ? 31 : 5)) * 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-white rounded-full"
                    />
                  </div>
                </div>
              </GlassCard>
            </motion.div>

          </div>

        </div>
      </div>
    </div>
  );
}
