import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import typebeatLogo from '../assets/typebeatz logo 2 white version_1754509091303.png';
import userIcon from '../assets/user_1754478889614.png';
import starsBg from '../assets/stars_background_voodoo808_1778087733997.jpg';
import useDocumentTitle from '../hooks/useDocumentTitle';
import ScreenSizeWarning from '../components/ScreenSizeWarning';

const NM = "'Neue Montreal', 'Inter', sans-serif";
const PRICING_GLASS = {
  background: 'linear-gradient(to bottom, rgba(1,5,10,0.88), rgba(7,30,87,0.82))',
  backdropFilter: 'blur(32px)',
  WebkitBackdropFilter: 'blur(32px)',
  border: '1px solid rgba(255,255,255,0.18)',
  boxShadow: '0 30px 60px -12px rgba(0,0,0,0.6)',
};

function GlassCard({ children, className = '' }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        ...PRICING_GLASS,
        padding: '28px',
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
      month: 'long', day: 'numeric', year: 'numeric',
    });
  } catch { return '—'; }
}

export default function AccountPage() {
  const { user, logout, refreshUser, setLiveProducerName, liveProducerName } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  useDocumentTitle(t('account.title'));

  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [producerName, setProducerName] = useState('');
  const [showCropModal, setShowCropModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

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

  const isUnlimited = user?.role === 'unlimited' || user?.role === 'admin';
  const isPro = user?.role === 'pro';
  const isPaid = isPro || isUnlimited;
  const isCzech = language === 'cs';

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

  useEffect(() => {
    setAvatarFailed(false);
  }, [user?.profile_image_url]);

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
    <>
      <ScreenSizeWarning />
      <div className="min-h-screen bg-black text-white selection:bg-white/20 relative">
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none"
          style={{
            zIndex: 0,
            backgroundImage: `url(${starsBg})`,
            backgroundSize: '130%',
            backgroundPosition: 'center calc(50% - 200px)',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 1, background: 'rgba(0,0,0,0.62)' }}
        />
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none"
          style={{
            zIndex: 1,
            background:
              'radial-gradient(ellipse 80% 60% at 50% 70%, transparent 20%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0.9) 75%, #000 92%)',
          }}
        />
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none"
          style={{
            zIndex: 1,
            background:
              'linear-gradient(to right, #000 0%, rgba(0,0,0,0.65) 10%, transparent 25%, transparent 75%, rgba(0,0,0,0.65) 90%, #000 100%)',
          }}
        />

        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-12 h-16 border-b border-white/5 bg-black/50 backdrop-blur-xl">
          <button onClick={() => navigate('/')} className="hover:opacity-80 transition-opacity z-10">
            <img src={typebeatLogo} alt="TypeBeatz" style={{ height: 18 }} />
          </button>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <span className="text-white text-sm opacity-90 font-semibold tracking-wide" style={{ fontFamily: NM }}>
              {liveProducerName || user?.producer_name || user?.first_name || 'User'}
            </span>
          </div>

          <button onClick={() => navigate('/app')}
            className="z-10 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all flex items-center gap-2"
            style={{ fontFamily: NM }}>
            <span className="text-sm">←</span> {t('account.backToApp')}
          </button>
        </nav>

      {/* Page content */}
      <div className="relative pt-28 pb-24 px-6" style={{ zIndex: 2 }}>
        <div className="max-w-xl mx-auto space-y-6">

          {/* Profile Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <GlassCard>
              {/* Avatar + name */}
              <div className="flex items-center gap-5 mb-8">
                <div
                  onClick={() => setShowCropModal(true)}
                  className="w-16 h-16 rounded-full overflow-hidden border border-white/15 bg-white/5 cursor-pointer relative group hover:border-white/35 transition-all duration-300 flex-shrink-0"
                >
                  <img
                    src={!avatarFailed && user.profile_image_url ? user.profile_image_url : userIcon}
                    alt=""
                    className="w-full h-full object-cover"
                    style={!user.profile_image_url || avatarFailed ? { opacity: 0.5, padding: '10px' } : {}}
                    onError={() => setAvatarFailed(true)}
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                    <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tighter" style={{ fontFamily: NM }}>
                    {user.producer_name || `${user.first_name || 'User'}${user.last_name ? ` ${user.last_name}` : ''}`}
                  </h1>
                  <p className="text-gray-400 text-sm font-medium mt-0.5" style={{ fontFamily: NM }}>{user.email}</p>
                  <div className="mt-2">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase border border-white/10 text-gray-400 bg-white/5"
                      style={{ fontFamily: NM }}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form fields */}
              <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <InputField label={t('account.firstName')} value={firstName} onChange={setFirstName} placeholder="Enter first name" />
                      <InputField label={t('account.lastName')} value={lastName} onChange={setLastName} placeholder="Enter last name" />
                    </div>
                    <InputField label={t('account.producerName')} value={producerName} onChange={(v) => { setProducerName(v); setLiveProducerName(v); }} placeholder="Enter stage name" />
                    
                    <div className="pt-4 flex items-center justify-between">
                      <button 
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="px-8 py-3 rounded-full bg-white text-black text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                        style={{ fontFamily: NM }}
                      >                  {saving ? t('account.saving') : t('account.saveChanges')}
                  </button>
                  <AnimatePresence>
                    {saveMessage && (
                      <motion.span
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-xs font-bold text-gray-400"
                      >
                        {saveMessage}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="grid grid-cols-2 gap-4"
          >
            <button
              onClick={() => navigate('/app')}
              className="flex items-center justify-between p-5 rounded-2xl group transition-all duration-200"
              style={{ ...PRICING_GLASS }}
            >
              <span className="text-xs font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors" style={{ fontFamily: NM }}>
                {t('account.openApp')}
              </span>
              <span className="text-gray-600 group-hover:text-white transition-colors">→</span>
            </button>

            <button
              onClick={logout}
              className="flex items-center justify-between p-5 rounded-2xl group transition-all duration-200"
              style={{ ...PRICING_GLASS }}
            >
              <span className="text-xs font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors" style={{ fontFamily: NM }}>
                {t('account.signOut')}
              </span>
              <span className="text-gray-600 group-hover:text-white transition-colors">→</span>
            </button>
          </motion.div>

          {/* Subscription Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="relative h-full">
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '120%',
                  height: '120%',
                  background: 'rgba(59,130,246,0.25)',
                  filter: 'blur(90px)',
                  zIndex: 0,
                  pointerEvents: 'none',
                  borderRadius: '50%'
                }} />
                <GlassCard className="h-full relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]" style={{ fontFamily: NM }}>{t('account.subscription')}</h2>
                    {sub && sub.status !== 'inactive' && (
                      <div className="px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase border border-white/10 text-gray-500" style={{ fontFamily: NM }}>
                        {sub.status === 'cancelling' ? t('account.cancelling') : t('account.active')}
                      </div>
                    )}
                  </div>

              <div className="mb-5">
                <div className="text-4xl font-black text-white tracking-tighter mb-1" style={{ fontFamily: NM }}>
                  {isUnlimited ? t('account.unlimitedPlan') : isPro ? t('account.proPlan') : t('account.freePlan')}
                </div>
                <p className="text-sm text-gray-500 font-medium" style={{ fontFamily: NM }}>
                  {isUnlimited ? t('account.unlimitedPlanDesc') : isPro ? t('account.proPlanDesc') : t('account.freePlanDesc')}
                </p>
              </div>

              {sub?.current_period_end && (
                <div className="mb-6 py-4 border-y border-white/8">
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1" style={{ fontFamily: NM }}>
                    {sub.status === 'cancelling' ? t('account.accessUntil') : t('account.nextBilling')}
                  </p>
                  <p className="text-sm font-black text-white" style={{ fontFamily: NM }}>
                    {formatDate(sub.current_period_end, language)}
                  </p>
                </div>
              )}
                             <div className="mt-auto pt-6 space-y-3">
                    {isPaid ? (
                      <>
                        {isPro && (
                          <button onClick={() => navigate('/upgrade')}
                            className="w-full py-3.5 rounded-full bg-white text-black text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all"
                            style={{ fontFamily: NM }}>
                            {language === 'cs' ? 'Upgradovat na Neomezený' : 'Upgrade to Unlimited'}
                          </button>
                        )}
                        {sub?.status === 'active' && (
                          <button
                            onClick={handleCancelSub}
                            disabled={cancelLoading}
                            className="w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                            style={{
                              fontFamily: NM,
                              border: '1px solid rgba(255,255,255,0.12)',
                              color: 'rgba(255,255,255,0.35)',
                              background: 'transparent',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.color = 'rgba(255,255,255,0.35)';
                              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                            }}
                          >
                            {cancelLoading 
                              ? (language === 'cs' ? 'Ruším...' : 'Cancelling...') 
                              : (language === 'cs' ? 'Zrušit předplatné' : 'Cancel Subscription')}
                          </button>
                        )}
                      </>
                    ) : (
                      <button onClick={() => navigate('/upgrade')}
                        className="w-full py-4 rounded-full bg-white text-black text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all"
                        style={{ fontFamily: NM }}>
                        {t('account.upgradeToPro')}
                      </button>
                    )}
                  </div>
            </GlassCard>
          </motion.div>

          {/* Usage Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
            <GlassCard>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]" style={{ fontFamily: NM }}>
                  {t('account.thisMonth')}
                </h2>
                <span className="text-[10px] text-gray-600 font-medium uppercase tracking-widest" style={{ fontFamily: NM }}>
                  {t('account.resetsOn')}
                </span>
              </div>

                     <div className="flex items-baseline gap-2 mb-8">
                    <span className="text-6xl font-black text-white tracking-tighter" style={{ fontFamily: NM }}>
                      {isUnlimited ? '∞' : creditsRemaining}
                    </span>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest" style={{ fontFamily: NM }}>
                      {isUnlimited ? '' : t('account.videosRemaining')}
                    </span>
                  </div>

                  {!isUnlimited && (
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
                  )}
            </GlassCard>
          </motion.div>

        </div>
      </div>

      {showCropModal && (
        <ProfilePictureModal
          userIcon={userIcon}
          onClose={() => setShowCropModal(false)}
          onSave={handleSaveProfilePicture}
        />
      )}
      </div>
    </>
  );
}

function ProfilePictureModal({ onClose, onSave, userIcon }) {
  const [imgSrc, setImgSrc] = React.useState(null);
  const [zoom, setZoom] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const canvasRef = React.useRef(null);
  const imgRef = React.useRef(null);

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
    const size = Math.min(img.width, img.height);
    const scale = (canvas.width / size) * zoom;
    const dx = (canvas.width - img.width * scale) / 2 + offset.x;
    const dy = (canvas.height - img.height * scale) / 2 + offset.y;
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
  const handleMouseUp = () => setIsDragging(false);

  const handleSave = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 250; canvas.height = 250;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;
    if (!img || !ctx) return;
    const size = Math.min(img.width, img.height);
    const scale = (250 / size) * zoom;
    const dx = (250 - img.width * scale) / 2 + offset.x;
    const dy = (250 - img.height * scale) / 2 + offset.y;
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, 250, 250);
    ctx.drawImage(img, dx, dy, img.width * scale, img.height * scale);
    onSave(canvas.toDataURL('image/jpeg', 0.85));
  };

  return (
    <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div
        className="w-full max-w-md rounded-2xl p-6 relative"
        style={{
          background: 'linear-gradient(to bottom, rgba(1,5,10,0.95), rgba(7,30,87,0.92))',
          border: '1px solid rgba(255,255,255,0.18)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
        }}
      >
        <h3 className="text-xl font-bold text-white mb-4" style={{ fontFamily: NM }}>
          Upravit profilový obrázek
        </h3>

        {!imgSrc ? (
          <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center flex flex-col items-center gap-4 bg-white/5">
            <img src={userIcon} className="w-16 h-16 opacity-30 object-cover rounded-full" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <p className="text-sm text-gray-400">Vyberte soubor JPG nebo PNG</p>
            <label className="px-4 py-2 bg-white text-black font-semibold rounded-lg cursor-pointer hover:bg-gray-200 transition-colors text-sm">
              Vybrat soubor
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="relative overflow-hidden rounded-xl bg-black border border-white/10">
              <canvas
                ref={canvasRef}
                width={300}
                height={300}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="cursor-move"
              />
            </div>
            <div className="w-full flex items-center gap-3">
              <span className="text-xs text-gray-500 font-bold">ZOOM</span>
              <input type="range" min="1" max="3" step="0.05" value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} className="flex-1 accent-white" />
            </div>
            <div className="w-full">
              <label className="text-xs text-gray-400 font-bold hover:text-white cursor-pointer transition-colors">
                Změnit obrázek
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6 border-t border-white/8 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.10)' }}
          >
            Zrušit
          </button>
          <button
            onClick={handleSave}
            disabled={!imgSrc}
            className="px-4 py-2 rounded-lg text-sm text-white font-semibold transition-all disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
          >
            Uložit
          </button>
        </div>
      </div>
    </div>
  );
}
