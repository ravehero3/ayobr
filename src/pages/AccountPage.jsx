import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import typebeatLogo from '../assets/typebeatz logo 2 white version_1754509091303.png';
import alienLogo from '../assets/alien_logo_1780252226447.png';
import alienZzzIcon from '../assets/alien_zzz_icon_1780296423141.png';
import userIcon from '../assets/user_1754478889614.png';
import starsBg from '../assets/stars_background_voodoo808_1778087733997.jpg';
import useDocumentTitle from '../hooks/useDocumentTitle';
import SettingsPanel from '../components/SettingsPanel';

const NM = "'Neue Montreal', 'Inter', sans-serif";

/* ── Pure-black glass card ─────────────────────────────────────────────────── */
function GlassCard({ children, className = '' }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        background: 'rgba(10,10,12,0.88)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 20px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset',
        padding: '28px 28px',
      }}
    >
      {children}
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <p className="text-xs font-medium text-gray-500 mb-1.5 px-0.5" style={{ fontFamily: NM, letterSpacing: '0.01em' }}>
      {children}
    </p>
  );
}

function InputField({ label, value, onChange, placeholder, disabled }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-700 focus:outline-none transition-all"
        style={{ fontFamily: NM, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)')}
      />
    </div>
  );
}

function PillButton({ children, onClick, disabled, variant = 'primary', style: extraStyle = {} }) {
  const base = {
    fontFamily: NM, fontWeight: 600, fontSize: '0.82rem', borderRadius: 9999,
    cursor: disabled ? 'not-allowed' : 'pointer', outline: 'none', border: 'none',
    transition: 'filter 0.2s ease, opacity 0.2s ease', opacity: disabled ? 0.4 : 1,
    padding: '9px 22px', ...extraStyle,
  };
  const variants = {
    primary:   { background: '#fff', color: '#000' },
    secondary: { background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' },
    danger:    { background: 'rgba(30,30,30,0.9)', color: 'rgba(255,100,100,0.85)', border: '1px solid rgba(255,80,80,0.18)' },
    ghost:     { background: 'transparent', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' },
  };
  const vs = variants[variant] || variants.primary;
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...vs }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.filter = 'brightness(1.18)'; }}
      onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; }}>
      {children}
    </button>
  );
}

function formatDate(dateStr, language) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString(language === 'cs' ? 'cs-CZ' : 'en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
  } catch { return '—'; }
}

/* ── Cancel confirmation modal ─────────────────────────────────────────────── */
function CancelConfirmModal({ isOpen, onClose, onConfirm, loading, endsAt, isCzech, language }) {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 flex items-center justify-center p-6"
          style={{ zIndex: 9999, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              width: '100%', maxWidth: 380,
              background: 'rgba(8,8,10,0.96)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: '1px solid rgba(255,255,255,0.09)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.85)',
              borderRadius: 20,
              padding: '32px 28px 24px',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="flex items-center justify-center w-11 h-11 rounded-full mb-5"
              style={{ background: 'rgba(255,70,70,0.1)', border: '1px solid rgba(255,70,70,0.2)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,100,100,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>

            <h3 className="text-white font-bold text-lg mb-2" style={{ fontFamily: NM }}>
              {isCzech ? 'Zrušit předplatné?' : 'Cancel subscription?'}
            </h3>

            <p className="text-sm text-gray-400 mb-1 leading-relaxed" style={{ fontFamily: NM }}>
              {isCzech
                ? 'Vaše předplatné bude zrušeno na konci aktuálního fakturačního období.'
                : 'Your subscription will be cancelled at the end of the current billing period.'}
            </p>

            {endsAt && (
              <p className="text-sm font-semibold mb-6" style={{ fontFamily: NM, color: 'rgba(255,255,255,0.65)' }}>
                {isCzech ? 'Přístup zachováte do ' : 'You keep access until '}
                <span style={{ color: '#fff' }}>{formatDate(endsAt, language)}</span>
              </p>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={onClose}
                style={{
                  flex: 1, fontFamily: NM, fontWeight: 600, fontSize: '0.82rem',
                  background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9999,
                  padding: '10px 0', cursor: 'pointer', transition: 'filter 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; }}
              >
                {isCzech ? 'Zachovat' : 'Keep it'}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                style={{
                  flex: 1, fontFamily: NM, fontWeight: 600, fontSize: '0.82rem',
                  background: 'rgba(180,30,30,0.85)', color: '#fff',
                  border: '1px solid rgba(255,80,80,0.25)', borderRadius: 9999,
                  padding: '10px 0', cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1, transition: 'filter 0.2s',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.filter = 'brightness(1.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; }}
              >
                {loading
                  ? (isCzech ? 'Ruším…' : 'Cancelling…')
                  : (isCzech ? 'Zrušit předplatné' : 'Confirm cancel')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Status pill ────────────────────────────────────────────────────────────── */
function SubStatusPill({ status, isCzech }) {
  const cfg = {
    active:    { label: isCzech ? 'Aktivní' : 'Active',       bg: 'rgba(30,200,100,0.1)', color: 'rgba(80,220,130,0.9)', border: 'rgba(60,200,100,0.2)' },
    cancelled: { label: isCzech ? 'Zrušeno' : 'Cancelled',    bg: 'rgba(255,80,80,0.08)', color: 'rgba(255,110,110,0.8)', border: 'rgba(255,80,80,0.15)' },
    expired:   { label: isCzech ? 'Vypršelo' : 'Expired',     bg: 'rgba(255,255,255,0.04)', color: 'rgba(180,180,180,0.7)', border: 'rgba(255,255,255,0.08)' },
    inactive:  { label: isCzech ? 'Neaktivní' : 'Inactive',   bg: 'rgba(255,255,255,0.04)', color: 'rgba(150,150,150,0.6)', border: 'rgba(255,255,255,0.07)' },
  };
  const c = cfg[status] || cfg.inactive;
  return (
    <span style={{
      padding: '3px 9px', borderRadius: 6, fontSize: '0.68rem', fontWeight: 700,
      letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: NM,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
    }}>
      {c.label}
    </span>
  );
}

export default function AccountPage() {
  const { user, logout, refreshUser } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  useDocumentTitle(t('account.title'));

  const [sub, setSub]                         = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [saving, setSaving]                   = useState(false);
  const [saveMessage, setSaveMessage]         = useState('');
  const [cancelLoading, setCancelLoading]     = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelDone, setCancelDone]           = useState(false);
  const [isSettingsOpen, setIsSettingsOpen]   = useState(false);
  const [testSubLoading, setTestSubLoading]   = useState(false);

  const [firstName, setFirstName]       = useState('');
  const [lastName, setLastName]         = useState('');
  const [producerName, setProducerName] = useState('');
  const [showCropModal, setShowCropModal]   = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const isAdmin     = user?.role === 'admin';
  const isUnlimited = user?.role === 'unlimited' || isAdmin;
  const isPro       = user?.role === 'pro';
  const isPaid      = isPro || isUnlimited;
  const isCzech     = language === 'cs';

  const displayName =
    producerName.trim() ||
    [firstName, lastName].filter(Boolean).join(' ') ||
    user?.producer_name ||
    user?.first_name ||
    user?.email?.split('@')[0] ||
    'Your Name';

  const fetchSubscription = () => {
    fetch('/api/ls/subscription', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => setSub(data || { status: 'inactive' }))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) return;
    setFirstName(user.first_name || '');
    setLastName(user.last_name || '');
    setProducerName(user.producer_name || '');
    fetchSubscription();
  }, [user]);

  const handleSaveProfilePicture = async (base64Image) => {
    setUploadingImage(true);
    setShowCropModal(false);
    try {
      const res = await fetch('/api/user/profile-picture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ image: base64Image }),
      });
      if (res.ok) await refreshUser();
    } catch (err) {
      console.error('Save profile picture error:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ first_name: firstName, last_name: lastName, producer_name: producerName }),
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

  const handleCancelConfirm = async () => {
    setCancelLoading(true);
    try {
      const res = await fetch('/api/ls/cancel', { method: 'POST', credentials: 'include' });
      if (res.ok) {
        await refreshUser();
        fetchSubscription();
        setCancelModalOpen(false);
        setCancelDone(true);
        setTimeout(() => setCancelDone(false), 8000);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || (isCzech ? 'Chyba při rušení předplatného.' : 'Failed to cancel subscription.'));
      }
    } catch (err) {
      console.error('Cancel sub error:', err);
    } finally {
      setCancelLoading(false);
    }
  };

  const handleCreateTestSub = async () => {
    setTestSubLoading(true);
    try {
      const res = await fetch('/api/ls/admin/test-subscription', { method: 'POST', credentials: 'include' });
      if (res.ok) {
        await refreshUser();
        fetchSubscription();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Failed to create test subscription.');
      }
    } catch (err) {
      console.error('Test sub error:', err);
    } finally {
      setTestSubLoading(false);
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#000' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 rounded-full border-2 border-white/5 border-t-white/60"
        />
      </div>
    );
  }

  const creditsRemaining = user?.credits?.credits_remaining ?? (isPro ? 31 : 5);
  const creditsUsed      = user?.credits?.credits_used_this_month ?? 0;
  const creditsTotal     = isPro ? 31 : 5;
  const usagePct         = Math.min(100, (creditsUsed / creditsTotal) * 100);

  const subIsActive    = sub?.status === 'active';
  const subIsCancelled = sub?.status === 'cancelled';
  const subIsExpired   = sub?.status === 'expired';
  const subHasEnd      = !!sub?.current_period_end;

  return (
    <div className="min-h-screen text-white selection:bg-white/20" style={{ position: 'relative' }}>

      {/* Stars background */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, backgroundImage: `url(${starsBg})`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0 }} />
      <div aria-hidden style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 1 }} />
      <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 2, pointerEvents: 'none', background: 'radial-gradient(ellipse 120% 60% at 50% 50%, transparent 30%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.95) 100%)' }} />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-14 grid items-center"
        style={{ zIndex: 50, gridTemplateColumns: '1fr auto 1fr', padding: '0 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>
        <button onClick={() => navigate('/')} className="hover:opacity-70 transition-opacity justify-self-start">
          <img src={typebeatLogo} alt="TypeBeatz" style={{ height: 16 }} />
        </button>
        <motion.span key={displayName} initial={{ opacity: 0.6 }} animate={{ opacity: 1 }}
          className="text-sm font-bold text-white/85 tracking-tight text-center truncate max-w-[220px]" style={{ fontFamily: NM }}>
          {displayName}
        </motion.span>
        <span />
      </nav>

      {/* Page content */}
      <div className="relative pt-24 pb-36 px-5" style={{ zIndex: 3 }}>
        <div className="max-w-[480px] mx-auto space-y-4">

          {/* ── Profile Card ──────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <GlassCard>
              <div className="flex items-center gap-5 mb-7">
                <div
                  onClick={() => setShowCropModal(true)}
                  className="relative group flex-shrink-0 cursor-pointer"
                  style={{ width: 112, height: 112, borderRadius: '50%', overflow: 'hidden', border: '1.5px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.04)', transition: 'border-color 0.3s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.30)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)')}
                >
                  <img src={user.profile_image_url || userIcon} alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', ...(!user.profile_image_url ? { opacity: 0.45, padding: '18px' } : {}) }}
                    onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = userIcon; e.currentTarget.style.padding = '18px'; e.currentTarget.style.opacity = '0.45'; }}
                  />
                  <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                    <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                </div>

                <div className="min-w-0">
                  <h1 className="text-xl font-black text-white tracking-tight truncate" style={{ fontFamily: NM }}>
                    {user.producer_name || [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Producer'}
                  </h1>
                  <p className="text-gray-500 text-xs font-medium mt-0.5 truncate" style={{ fontFamily: NM }}>{user.email}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {isAdmin && (
                      <span className="inline-block px-2 py-0.5 rounded-md text-[9px] font-bold tracking-widest uppercase"
                        style={{ fontFamily: NM, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        admin
                      </span>
                    )}
                    <span onClick={() => navigate('/upgrade')}
                      style={{ display: 'inline-flex', alignItems: 'center', lineHeight: 1, whiteSpace: 'nowrap', cursor: 'pointer', padding: '3px 9px', borderRadius: 9999, background: '#fff', color: '#000', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', fontFamily: NM, transition: 'filter 0.18s ease', textTransform: 'uppercase' }}
                      onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.80)'; }}
                      onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; }}>
                      {isUnlimited ? 'UNLIMITED' : isPro ? 'PRO' : (isCzech ? 'ZDARMA' : 'FREE')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <InputField label={t('account.firstName')} value={firstName} onChange={setFirstName} placeholder="First name" />
                  <InputField label={t('account.lastName')} value={lastName} onChange={setLastName} placeholder="Last name" />
                </div>
                <InputField label={t('account.producerName')} value={producerName} onChange={setProducerName} placeholder="Stage name" />

                <div className="pt-1 flex items-center gap-3">
                  <PillButton onClick={handleSaveProfile} disabled={saving} style={{ paddingLeft: 24, paddingRight: 24 }}>
                    {saving ? (isCzech ? 'Ukládám…' : 'Saving…') : t('account.saveChanges')}
                  </PillButton>
                  <AnimatePresence>
                    {saveMessage && (
                      <motion.span initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                        className="text-xs font-medium text-gray-400" style={{ fontFamily: NM }}>
                        {saveMessage}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* ── Subscription Card ─────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07, duration: 0.45 }}>
            <GlassCard>
              {/* Header row */}
              <div className="flex items-center justify-between mb-5">
                <p className="text-xs font-semibold text-gray-500" style={{ fontFamily: NM }}>
                  {t('account.subscription')}
                </p>
                <div className="flex items-center gap-2">
                  {sub?.status && sub.status !== 'inactive' && (
                    <SubStatusPill status={sub.status} isCzech={isCzech} />
                  )}
                </div>
              </div>

              {/* Plan info */}
              <div className="mb-5 flex items-center gap-4">
                <img src={alienZzzIcon} alt="" style={{ width: 56, height: 56, flexShrink: 0, borderRadius: 12, objectFit: 'cover' }} />
                <div>
                  <div className="text-3xl font-black text-white tracking-tighter mb-1" style={{ fontFamily: NM }}>
                    {isUnlimited ? t('account.unlimitedPlan') : isPro ? t('account.proPlan') : t('account.freePlan')}
                  </div>
                  <p className="text-sm text-gray-500 font-medium leading-snug" style={{ fontFamily: NM }}>
                    {isUnlimited ? t('account.unlimitedPlanDesc') : isPro ? t('account.proPlanDesc') : t('account.freePlanDesc')}
                  </p>
                </div>
              </div>

              {/* Period end date — shown for active, cancelled, and expired */}
              {subHasEnd && (
                <div className="mb-5 py-4 border-y border-white/5">
                  <p className="text-[10px] font-semibold text-gray-600 mb-1" style={{ fontFamily: NM }}>
                    {subIsCancelled
                      ? (isCzech ? 'Přístup do' : 'Access until')
                      : subIsActive
                        ? t('account.nextBilling')
                        : (isCzech ? 'Platnost skončila' : 'Ended')}
                  </p>
                  <p className="text-sm font-bold text-white" style={{ fontFamily: NM }}>
                    {formatDate(sub.current_period_end, language)}
                  </p>
                </div>
              )}

              {/* Cancellation done banner */}
              <AnimatePresence>
                {cancelDone && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="mb-4 px-3 py-3 rounded-xl text-xs font-semibold"
                    style={{ fontFamily: NM, background: 'rgba(255,80,80,0.07)', color: 'rgba(255,140,140,0.9)', border: '1px solid rgba(255,80,80,0.15)' }}>
                    {isCzech
                      ? 'Předplatné zrušeno. Přístup zachován do konce zaplaceného období.'
                      : 'Subscription cancelled. You keep access until the end of the paid period.'}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action buttons */}
              <div className="space-y-2 pt-1">
                {isPaid ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {isPro && (
                      <PillButton onClick={() => navigate('/upgrade')} style={{ flex: 1, textAlign: 'center', padding: '11px 18px' }}>
                        {isCzech ? 'Upgradovat na Neomezený' : 'Upgrade to Unlimited'}
                      </PillButton>
                    )}
                    {subIsActive && (
                      <PillButton onClick={() => setCancelModalOpen(true)} disabled={cancelLoading} variant="danger"
                        style={{ fontSize: '0.75rem', padding: '7px 16px' }}>
                        {isCzech ? 'Zrušit předplatné' : 'Cancel subscription'}
                      </PillButton>
                    )}
                  </div>
                ) : (
                  <PillButton onClick={() => navigate('/upgrade')} style={{ width: '100%', textAlign: 'center', padding: '14px 22px' }}>
                    {t('account.upgradeToPro')}
                  </PillButton>
                )}

                {/* Admin: test subscription seeding */}
                {isAdmin && !subIsActive && (
                  <div className="pt-3 border-t border-white/5 mt-3">
                    <p className="text-[10px] font-semibold text-gray-600 mb-2" style={{ fontFamily: NM }}>
                      {isCzech ? '— Testovací prostředí —' : '— Admin testing —'}
                    </p>
                    <PillButton onClick={handleCreateTestSub} disabled={testSubLoading} variant="ghost"
                      style={{ fontSize: '0.75rem', padding: '6px 14px' }}>
                      {testSubLoading
                        ? (isCzech ? 'Vytvářím…' : 'Creating…')
                        : (isCzech ? 'Vytvořit testovací předplatné' : 'Create test subscription')}
                    </PillButton>
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>

          {/* ── Usage Card ───────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14, duration: 0.45 }}>
            <GlassCard>
              <div className="flex items-center justify-between mb-5">
                <p className="text-xs font-semibold text-gray-500" style={{ fontFamily: NM }}>
                  {t('account.thisMonth')}
                </p>
                <p className="text-[10px] text-gray-600 font-medium" style={{ fontFamily: NM }}>
                  {t('account.resetsOn')}
                </p>
              </div>

              {isUnlimited ? (
                <div className="flex items-center gap-4">
                  <span className="font-black text-white leading-none flex-shrink-0" style={{ fontFamily: NM, fontSize: '7.5rem', lineHeight: 1 }}>∞</span>
                  <div>
                    <p className="text-sm font-bold text-white" style={{ fontFamily: NM }}>
                      {isCzech ? 'Neomezené generování' : 'Unlimited'}
                    </p>
                    <p className="text-xs text-gray-500 font-medium" style={{ fontFamily: NM }}>
                      {isCzech ? 'videí za měsíc' : 'videos per month'}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-baseline gap-2 mb-5">
                    <span className="text-5xl font-black text-white tracking-tighter" style={{ fontFamily: NM }}>{creditsRemaining}</span>
                    <span className="text-xs font-semibold text-gray-500" style={{ fontFamily: NM }}>{isCzech ? 'zbývá' : 'remaining'}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-semibold" style={{ fontFamily: NM }}>
                      <span className="text-gray-600">{t('account.monthlyUsage')}</span>
                      <span className="text-gray-400">{creditsUsed} / {creditsTotal}</span>
                    </div>
                    <div className="h-[3px] w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${usagePct}%` }} transition={{ duration: 0.9, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: usagePct >= 100 ? 'rgba(255,90,90,0.8)' : 'rgba(255,255,255,0.65)' }} />
                    </div>
                  </div>
                  {!isPaid && (
                    <div className="mt-5">
                      <PillButton onClick={() => navigate('/upgrade')} style={{ width: '100%', textAlign: 'center', padding: '11px 22px' }}>
                        {isCzech ? 'Získat více kreditů' : 'Get more credits'}
                      </PillButton>
                    </div>
                  )}
                </>
              )}
            </GlassCard>
          </motion.div>

        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 h-14 flex items-center justify-between px-5"
        style={{ zIndex: 50, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={() => navigate('/app')}
          className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-white transition-colors" style={{ fontFamily: NM }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="hidden sm:inline">{t('account.backToApp')}</span>
        </button>

        <div className="flex items-center gap-3">
          <button onClick={logout}
            style={{ fontFamily: NM, fontWeight: 600, fontSize: '0.72rem', borderRadius: 9999, cursor: 'pointer', outline: 'none', border: '1px solid rgba(255,255,255,0.12)', transition: 'filter 0.2s ease', padding: '5px 14px', background: 'rgba(20,20,20,0.9)', color: 'rgba(255,255,255,0.65)' }}
            onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; }}>
            {isCzech ? 'Odhlásit se' : 'Sign out'}
          </button>
          <motion.button onClick={() => setIsSettingsOpen(true)} whileHover={{ rotate: 90 }} transition={{ duration: 0.25 }}
            className="p-2 rounded-lg text-gray-500 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </motion.button>
        </div>
      </div>

      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Cancel confirmation modal */}
      <CancelConfirmModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancelConfirm}
        loading={cancelLoading}
        endsAt={sub?.current_period_end}
        isCzech={isCzech}
        language={language}
      />
    </div>
  );
}
