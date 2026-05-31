import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import typebeatLogo from '../assets/typebeatz logo 2 white version_1754509091303.png';
import alienLogo from '../assets/alien_logo_1780252226447.png';
import userIcon from '../assets/user_1754478889614.png';
import starsBg from '../assets/stars_background_voodoo808_1778087733997.jpg';
import useDocumentTitle from '../hooks/useDocumentTitle';
import SettingsPanel from '../components/SettingsPanel';

const NM = "'Neue Montreal', 'Inter', sans-serif";

/* ── Pure-black glass card — no blue tint ──────────────────────────────────── */
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

/* ── Card section label ────────────────────────────────────────────────────── */
function FieldLabel({ children }) {
  return (
    <p
      className="text-xs font-medium text-gray-500 mb-1.5 px-0.5"
      style={{ fontFamily: NM, letterSpacing: '0.01em' }}
    >
      {children}
    </p>
  );
}

/* ── Text input ────────────────────────────────────────────────────────────── */
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
        style={{
          fontFamily: NM,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.09)',
        }}
        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)')}
      />
    </div>
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

export default function AccountPage() {
  const { user, logout, refreshUser } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  useDocumentTitle(t('account.title'));

  const [sub, setSub]                       = useState(null);
  const [loading, setLoading]               = useState(true);
  const [saving, setSaving]                 = useState(false);
  const [saveMessage, setSaveMessage]       = useState('');
  const [cancelLoading, setCancelLoading]   = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [firstName, setFirstName]       = useState('');
  const [lastName, setLastName]         = useState('');
  const [producerName, setProducerName] = useState('');
  const [showCropModal, setShowCropModal]   = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const isUnlimited = user?.role === 'unlimited' || user?.role === 'admin';
  const isPro       = user?.role === 'pro';
  const isPaid      = isPro || isUnlimited;
  const isCzech     = language === 'cs';

  /* ── Live header display name ─────────────────────────────────────────── */
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
    if (isPaid) fetchSubscription();
    else setLoading(false);
  }, [user, isPaid]);

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

  const handleCancelSub = async () => {
    const confirmMsg = isCzech
      ? 'Opravdu chcete zrušit své předplatné? Ztratíte přístup ke všem výhodám na konci aktuálního fakturačního období.'
      : 'Are you sure you want to cancel your subscription? You will lose access to premium features at the end of the current billing period.';
    if (!window.confirm(confirmMsg)) return;

    setCancelLoading(true);
    try {
      const res = await fetch('/api/ls/cancel', { method: 'POST', credentials: 'include' });
      if (res.ok) {
        await refreshUser();
        fetchSubscription();
        alert(isCzech ? 'Předplatné bylo úspěšně zrušeno.' : 'Subscription cancelled successfully.');
      } else {
        alert(isCzech ? 'Chyba při rušení předplatného.' : 'Failed to cancel subscription.');
      }
    } catch (err) {
      console.error('Cancel sub error:', err);
    } finally {
      setCancelLoading(false);
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

  const creditsRemaining    = user?.credits?.credits_remaining ?? (isPro ? 31 : 5);
  const creditsUsed         = user?.credits?.credits_used_this_month ?? 0;
  const creditsTotal        = isPro ? 31 : 5;
  const usagePct            = Math.min(100, (creditsUsed / creditsTotal) * 100);

  return (
    <div className="min-h-screen text-white selection:bg-white/20" style={{ position: 'relative' }}>

      {/* Stars background */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0,
          backgroundImage: `url(${starsBg})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          zIndex: 0,
        }}
      />

      {/* Dark overlay */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 1 }} />

      {/* Vignette — fades to pure black at every edge */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0, zIndex: 2, pointerEvents: 'none',
          background: [
            'radial-gradient(ellipse 120% 60% at 50% 50%, transparent 30%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.95) 100%)',
          ].join(', '),
        }}
      />

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 h-14 grid items-center"
        style={{
          zIndex: 50,
          gridTemplateColumns: '1fr auto 1fr',
          padding: '0 24px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(0,0,0,0.60)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        {/* Left — logo */}
        <button onClick={() => navigate('/')} className="hover:opacity-70 transition-opacity justify-self-start">
          <img src={typebeatLogo} alt="TypeBeatz" style={{ height: 16 }} />
        </button>

        {/* Centre — live producer name */}
        <motion.span
          key={displayName}
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          className="text-sm font-bold text-white/85 tracking-tight text-center truncate max-w-[220px]"
          style={{ fontFamily: NM }}
        >
          {displayName}
        </motion.span>

        {/* Right — empty placeholder keeps grid balanced */}
        <span />
      </nav>

      {/* ── Page content ───────────────────────────────────────────────────── */}
      <div className="relative pt-24 pb-36 px-5" style={{ zIndex: 3 }}>
        <div className="max-w-[480px] mx-auto space-y-4">

          {/* ── Profile Card ─────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <GlassCard>
              {/* Avatar + name */}
              <div className="flex items-center gap-4 mb-7">
                <div
                  onClick={() => setShowCropModal(true)}
                  className="w-14 h-14 rounded-full overflow-hidden border border-white/10 bg-white/4 cursor-pointer relative group hover:border-white/30 transition-all duration-300 flex-shrink-0"
                >
                  <img
                    src={user.profile_image_url || userIcon}
                    alt=""
                    className="w-full h-full object-cover"
                    style={!user.profile_image_url ? { opacity: 0.45, padding: '9px' } : {}}
                    onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = userIcon; e.currentTarget.style.padding = '9px'; e.currentTarget.style.opacity = '0.45'; }}
                  />
                  <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                    <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-black text-white tracking-tight truncate" style={{ fontFamily: NM }}>
                    {user.producer_name || [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Producer'}
                  </h1>
                  <p className="text-gray-500 text-xs font-medium mt-0.5 truncate" style={{ fontFamily: NM }}>{user.email}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {/* Admin badge (dark, only for admins) */}
                    {user.role === 'admin' && (
                      <span
                        className="inline-block px-2 py-0.5 rounded-md text-[9px] font-bold tracking-widest uppercase"
                        style={{ fontFamily: NM, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        admin
                      </span>
                    )}
                    {/* Role badge (white) — clicking navigates to upgrade */}
                    <span
                      onClick={() => navigate('/upgrade')}
                      style={{
                        display: 'inline-flex', alignItems: 'center', lineHeight: 1, whiteSpace: 'nowrap',
                        cursor: 'pointer', padding: '4px 10px', borderRadius: 6,
                        background: '#fff', color: '#000', fontSize: 12, fontWeight: 600,
                        border: '1.5px solid #fff', fontFamily: NM,
                        transition: 'background 0.18s, color 0.18s, transform 0.18s', userSelect: 'none',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#e8e8e8'; e.currentTarget.style.transform = 'scale(1.06)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      {user.role === 'admin' || user.role === 'unlimited'
                        ? (isCzech ? 'Bez omezení' : 'Unlimited')
                        : user.role === 'pro'
                          ? 'Pro'
                          : (isCzech ? 'Zdarma' : 'Free')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <InputField label={t('account.firstName')} value={firstName} onChange={setFirstName} placeholder="First name" />
                  <InputField label={t('account.lastName')} value={lastName} onChange={setLastName} placeholder="Last name" />
                </div>
                <InputField label={t('account.producerName')} value={producerName} onChange={setProducerName} placeholder="Stage name" />

                <div className="pt-1 flex items-center justify-between gap-3">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-white text-black text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40"
                    style={{ fontFamily: NM }}
                  >
                    {saving ? (isCzech ? 'Ukládám…' : 'Saving…') : t('account.saveChanges')}
                  </button>
                  <AnimatePresence>
                    {saveMessage && (
                      <motion.span
                        initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                        className="text-xs font-medium text-gray-400" style={{ fontFamily: NM }}
                      >
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
                {sub?.status === 'active' && (
                  <span
                    className="px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase"
                    style={{ fontFamily: NM, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {t('account.active')}
                  </span>
                )}
              </div>

              <div className="mb-5">
                <div className="text-3xl font-black text-white tracking-tighter mb-1" style={{ fontFamily: NM }}>
                  {isUnlimited ? t('account.unlimitedPlan') : isPro ? t('account.proPlan') : t('account.freePlan')}
                </div>
                <p className="text-sm text-gray-500 font-medium leading-snug" style={{ fontFamily: NM }}>
                  {isUnlimited ? t('account.unlimitedPlanDesc') : isPro ? t('account.proPlanDesc') : t('account.freePlanDesc')}
                </p>
              </div>

              {sub?.current_period_end && (
                <div className="mb-5 py-4 border-y border-white/5">
                  <p className="text-[10px] font-semibold text-gray-600 mb-1" style={{ fontFamily: NM }}>
                    {sub.status === 'cancelling' ? (isCzech ? 'Přístup do' : 'Access until') : t('account.nextBilling')}
                  </p>
                  <p className="text-sm font-bold text-white" style={{ fontFamily: NM }}>
                    {formatDate(sub.current_period_end, language)}
                  </p>
                </div>
              )}

              <div className="space-y-2 pt-1">
                {isPaid ? (
                  <>
                    {isPro && (
                      <button
                        onClick={() => navigate('/upgrade')}
                        className="w-full py-3 rounded-xl bg-white text-black text-xs font-black uppercase tracking-widest hover:scale-[1.01] transition-all"
                        style={{ fontFamily: NM }}
                      >
                        {isCzech ? 'Upgradovat na Neomezený' : 'Upgrade to Unlimited'}
                      </button>
                    )}
                    {sub?.status === 'active' && (
                      <button
                        onClick={handleCancelSub}
                        disabled={cancelLoading}
                        className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-40"
                        style={{
                          fontFamily: NM,
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.55)',
                          background: 'rgba(40,40,40,0.85)',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(55,55,55,0.9)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(40,40,40,0.85)'; }}
                      >
                        {cancelLoading
                          ? (isCzech ? 'Ruším…' : 'Cancelling…')
                          : (isCzech ? 'Zrušit' : 'Cancel')}
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => navigate('/upgrade')}
                    className="w-full py-3.5 rounded-xl bg-white text-black text-xs font-black uppercase tracking-widest hover:scale-[1.01] transition-all"
                    style={{ fontFamily: NM }}
                  >
                    {t('account.upgradeToPro')}
                  </button>
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
                /* Unlimited layout — no progress bar */
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-black text-white tracking-tighter" style={{ fontFamily: NM }}>∞</span>
                  <div>
                    <p className="text-sm font-bold text-white" style={{ fontFamily: NM }}>
                      {isCzech ? 'Neomezené' : 'Unlimited'}
                    </p>
                    <p className="text-xs text-gray-500 font-medium" style={{ fontFamily: NM }}>
                      {isCzech ? 'videa za měsíc' : 'videos per month'}
                    </p>
                  </div>
                </div>
              ) : (
                /* Free / Pro layout */
                <>
                  <div className="flex items-baseline gap-2 mb-5">
                    <span className="text-5xl font-black text-white tracking-tighter" style={{ fontFamily: NM }}>
                      {creditsRemaining}
                    </span>
                    <span className="text-xs font-semibold text-gray-500" style={{ fontFamily: NM }}>
                      {isCzech ? 'zbývá' : 'remaining'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-semibold" style={{ fontFamily: NM }}>
                      <span className="text-gray-600">{t('account.monthlyUsage')}</span>
                      <span className="text-gray-400">{creditsUsed} / {creditsTotal}</span>
                    </div>
                    <div className="h-[3px] w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${usagePct}%` }}
                        transition={{ duration: 0.9, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: usagePct >= 100 ? 'rgba(255,90,90,0.8)' : 'rgba(255,255,255,0.65)' }}
                      />
                    </div>
                  </div>
                </>
              )}
            </GlassCard>
          </motion.div>

          {/* ── Sign out button — below all cards ────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21, duration: 0.45 }}>
            <button
              onClick={logout}
              className="w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                fontFamily: NM,
                background: '#ffffff',
                border: 'none',
                color: '#000000',
              }}
            >
              {isCzech ? 'Odhlásit se' : 'Sign out'}
            </button>
          </motion.div>

        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 h-14 flex items-center justify-between px-5"
        style={{
          zIndex: 50,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* Left — Back to app */}
        <button
          onClick={() => navigate('/app')}
          className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-white transition-colors"
          style={{ fontFamily: NM }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="hidden sm:inline">{t('account.backToApp')}</span>
        </button>

        {/* Right — Video settings gear */}
        <motion.button
          onClick={() => setIsSettingsOpen(true)}
          whileHover={{ rotate: 90 }}
          transition={{ duration: 0.25 }}
          className="p-2 rounded-lg text-gray-500 hover:text-white transition-colors"
          title={isCzech ? 'Nastavení videa' : 'Video settings'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </motion.button>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {showCropModal && (
        <ProfilePictureModal
          userIcon={userIcon}
          onClose={() => setShowCropModal(false)}
          onSave={handleSaveProfilePicture}
        />
      )}
    </div>
  );
}

/* ── Profile picture crop modal ─────────────────────────────────────────────── */
function ProfilePictureModal({ onClose, onSave, userIcon }) {
  const [imgSrc, setImgSrc]       = React.useState(null);
  const [zoom, setZoom]           = React.useState(1);
  const [offset, setOffset]       = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const canvasRef = React.useRef(null);
  const imgRef    = React.useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setImgSrc(reader.result); setZoom(1); setOffset({ x: 0, y: 0 }); };
    reader.readAsDataURL(file);
  };

  React.useEffect(() => {
    if (!imgSrc) return;
    const img = new Image();
    img.src = imgSrc;
    img.onload = () => { imgRef.current = img; draw(); };
  }, [imgSrc, zoom, offset]);

  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = imgRef.current;
    if (!canvas || !ctx || !img) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const size  = Math.min(img.width, img.height);
    const scale = (canvas.width / size) * zoom;
    const dx    = (canvas.width - img.width * scale) / 2 + offset.x;
    const dy    = (canvas.height - img.height * scale) / 2 + offset.y;
    ctx.drawImage(img, dx, dy, img.width * scale, img.height * scale);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 10, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 10, 0, Math.PI * 2);
    ctx.stroke();
  };

  const handleMouseDown = (e) => { if (!imgSrc) return; setIsDragging(true); setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y }); };
  const handleMouseMove = (e) => { if (!isDragging || !imgSrc) return; setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); };
  const handleMouseUp   = () => setIsDragging(false);

  const handleSave = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 250; canvas.height = 250;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;
    if (!img || !ctx) return;
    const size  = Math.min(img.width, img.height);
    const scale = (250 / size) * zoom;
    const dx    = (250 - img.width * scale) / 2 + offset.x;
    const dy    = (250 - img.height * scale) / 2 + offset.y;
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, 250, 250);
    ctx.beginPath();
    ctx.arc(125, 125, 125, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, dx, dy, img.width * scale, img.height * scale);
    onSave(canvas.toDataURL('image/jpeg', 0.85));
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 200, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative rounded-2xl p-6 w-80"
        style={{ background: 'rgba(10,10,12,0.96)', border: '1px solid rgba(255,255,255,0.10)' }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors text-lg">x</button>
        <h3 className="text-sm font-black text-white mb-4" style={{ fontFamily: NM }}>
          Profile photo
        </h3>

        <canvas
          ref={canvasRef} width={240} height={240}
          className="rounded-full mx-auto block mb-4 cursor-move"
          style={{ background: '#111' }}
          onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
        />

        {imgSrc && (
          <div className="mb-4 flex items-center gap-3">
            <span className="text-[10px] text-gray-500" style={{ fontFamily: NM }}>Zoom</span>
            <input type="range" min="0.5" max="3" step="0.05" value={zoom}
              onChange={e => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-white"
            />
          </div>
        )}

        <label className="block w-full py-2.5 rounded-xl text-center text-xs font-bold uppercase tracking-widest cursor-pointer transition-all mb-2"
          style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.55)', fontFamily: NM }}>
          Choose photo
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>

        {imgSrc && (
          <button onClick={handleSave}
            className="w-full py-2.5 rounded-xl bg-white text-black text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all"
            style={{ fontFamily: NM }}>
            Save photo
          </button>
        )}
      </div>
    </div>
  );
}
