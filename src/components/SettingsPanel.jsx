import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const NM = "'Neue Montreal', 'Inter', sans-serif";
const IV = '"Figtree", sans-serif';

const SECTION_LABEL = {
  fontFamily: NM,
  color: 'rgba(255,255,255,0.45)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  marginBottom: 12,
};

const SettingsPanel = ({ isOpen, onClose }) => {
  const { user, featureFlags } = useAuth();
  const { t } = useLanguage();

  const {
    videoSettings,
    pairs,
    setVideoBackground,
    setCustomBackground,
    setVideoQuality,
    setImageLayout,
  } = useAppStore();

  const canUseFullHD = featureFlags?.high_quality || user?.role === 'pro' || user?.role === 'unlimited' || user?.role === 'admin';
  const canUse4K = featureFlags?.ultra_quality || user?.role === 'unlimited' || user?.role === 'admin';
  const canUseCustomBackground = user?.role === 'pro' || user?.role === 'unlimited' || user?.role === 'admin';

  const clampQuality = (q) => {
    if (q === '4k' && !canUse4K) return canUseFullHD ? 'fullhd' : 'hd';
    if (q === 'fullhd' && !canUseFullHD) return 'hd';
    return q;
  };

  const [selectedBackground, setSelectedBackground] = useState(videoSettings.background || 'black');
  const [selectedResolution, setSelectedResolution] = useState(() => clampQuality(videoSettings.quality || 'fullhd'));
  const [selectedImageLayout, setSelectedImageLayout] = useState(videoSettings.imageLayout || 'full');

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedBackground(videoSettings.background || 'black');
      setSelectedResolution(clampQuality(videoSettings.quality || 'fullhd'));
      setSelectedImageLayout(videoSettings.imageLayout || 'full');
    }
  }, [isOpen]);

  // Last image from pairs for preview
  const lastImagePair = [...pairs].reverse().find(p => p.image);
  const lastImage = lastImagePair?.image;
  const [lastImageUrl, setLastImageUrl] = useState(null);

  useEffect(() => {
    if (!lastImage) { setLastImageUrl(null); return; }
    const url = URL.createObjectURL(lastImage);
    setLastImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [lastImage]);

  const handleBackgroundChange = (background) => {
    if (background === 'custom' && !canUseCustomBackground) return;
    setSelectedBackground(background);
  };

  const handleResolutionChange = (resolution) => {
    if (resolution === '4k' && !canUse4K) return;
    if (resolution === 'fullhd' && !canUseFullHD) return;
    setSelectedResolution(resolution);
  };

  const handleCustomBackgroundUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCustomBackground(e.target.result);
        setSelectedBackground('custom');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setVideoBackground(selectedBackground);
    setVideoQuality(selectedResolution);
    setImageLayout(selectedImageLayout);
    onClose();
  };

  const handleCancel = () => {
    setSelectedBackground(videoSettings.background || 'black');
    setSelectedResolution(clampQuality(videoSettings.quality || 'fullhd'));
    setSelectedImageLayout(videoSettings.imageLayout || 'full');
    onClose();
  };

  // Preview helpers
  const getPreviewBgStyle = () => {
    if (selectedBackground === 'white') return { backgroundColor: '#fff' };
    if (selectedBackground === 'custom' && videoSettings.customBackground) {
      return {
        backgroundImage: `url(${videoSettings.customBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    return { backgroundColor: '#000' };
  };

  const getPreviewImageStyle = () => {
    if (selectedImageLayout === 'padded') {
      const padPct = (100 / 1080) * 100;
      return {
        position: 'absolute',
        top: `${padPct.toFixed(2)}%`,
        left: 0, right: 0,
        height: `${(100 - padPct * 2).toFixed(2)}%`,
        width: '100%',
        objectFit: 'contain',
      };
    }
    if (selectedImageLayout === 'thumbnail') {
      const thumbPct = (250 / 1080) * 100;
      return {
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '100%',
        height: `${thumbPct.toFixed(2)}%`,
        width: 'auto',
        objectFit: 'contain',
      };
    }
    return {
      position: 'absolute',
      inset: 0, width: '100%', height: '100%',
      objectFit: 'contain',
    };
  };

  const IMAGE_LAYOUTS = [
    {
      key: 'full',
      label: 'Celá plocha',
      sub: 'Vyplní rámeček',
      icon: (active) => (
        <svg width="52" height="32" viewBox="0 0 52 32" fill="none">
          <rect x="0.75" y="0.75" width="50.5" height="30.5" rx="3.25"
            stroke={active ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.2)'} strokeWidth="1.5"/>
          <rect x="4" y="3.5" width="44" height="25" rx="1.5"
            fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'}/>
        </svg>
      ),
    },
    {
      key: 'padded',
      label: 'S okraji',
      sub: '100px nahoře/dole',
      icon: (active) => (
        <svg width="52" height="32" viewBox="0 0 52 32" fill="none">
          <rect x="0.75" y="0.75" width="50.5" height="30.5" rx="3.25"
            stroke={active ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.2)'} strokeWidth="1.5"/>
          <rect x="4" y="7" width="44" height="18" rx="1.5"
            fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'}/>
        </svg>
      ),
    },
    {
      key: 'thumbnail',
      label: 'Miniatura',
      sub: '250px výška',
      icon: (active) => (
        <svg width="52" height="32" viewBox="0 0 52 32" fill="none">
          <rect x="0.75" y="0.75" width="50.5" height="30.5" rx="3.25"
            stroke={active ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.2)'} strokeWidth="1.5"/>
          <rect x="15" y="11.5" width="22" height="9" rx="1.5"
            fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'}/>
        </svg>
      ),
    },
  ];

  const cardStyle = {
    background: 'rgba(10,10,12,0.88)',
    backdropFilter: 'blur(28px)',
    WebkitBackdropFilter: 'blur(28px)',
    borderRadius: 20,
    border: '1px solid rgba(255,255,255,0.07)',
    boxShadow: '0 20px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  };

  const bgLabel = selectedBackground === 'white'
    ? 'Bílé pozadí'
    : selectedBackground === 'custom'
      ? 'Vlastní pozadí'
      : 'Černé pozadí';

  const resLabel = selectedResolution === '4k'
    ? '4K Ultra'
    : selectedResolution === 'hd'
      ? 'HD'
      : 'Full HD';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 999999, pointerEvents: 'auto', padding: '20px', overflowY: 'auto' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            onClick={handleCancel}
            style={{ background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }}
          />

          {/* Two-column layout */}
          <div
            style={{ position: 'relative', zIndex: 10, display: 'flex', gap: 20, alignItems: 'stretch', justifyContent: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            {/* ── Left: Settings card ───────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              style={{ width: 480, ...cardStyle }}
            >
              {/* Title */}
              <h2 style={{ fontFamily: NM, color: 'rgba(255,255,255,0.90)', fontSize: 18, fontWeight: 700, textAlign: 'center', margin: 0, letterSpacing: '-0.01em' }}>
                {t('settings.title')}
              </h2>

              {/* Background Selection */}
              <div>
                <p style={SECTION_LABEL}>{t('settings.background')}</p>
                <div style={{ display: 'flex', gap: 12 }}>
                  {/* White */}
                  <motion.div
                    onClick={() => handleBackgroundChange('white')}
                    style={{
                      flex: 1, height: 72, borderRadius: 12, cursor: 'pointer',
                      background: 'linear-gradient(135deg, #ffffff, #f0f0f0)',
                      border: selectedBackground === 'white' ? '2px solid rgba(255,255,255,0.9)' : '2px solid rgba(255,255,255,0.10)',
                      boxShadow: selectedBackground === 'white' ? '0 0 0 2px rgba(255,255,255,0.15)' : 'none',
                      transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden',
                    }}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  >
                    {selectedBackground === 'white' && (
                      <div style={{ position: 'absolute', bottom: 6, right: 8, width: 8, height: 8, borderRadius: '50%', background: '#000', opacity: 0.6 }} />
                    )}
                  </motion.div>

                  {/* Black */}
                  <motion.div
                    onClick={() => handleBackgroundChange('black')}
                    style={{
                      flex: 1, height: 72, borderRadius: 12, cursor: 'pointer',
                      background: 'linear-gradient(135deg, #1a1a1a, #000)',
                      border: selectedBackground === 'black' ? '2px solid rgba(255,255,255,0.9)' : '2px solid rgba(255,255,255,0.10)',
                      boxShadow: selectedBackground === 'black' ? '0 0 0 2px rgba(255,255,255,0.08)' : 'none',
                      transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden',
                    }}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  >
                    {selectedBackground === 'black' && (
                      <div style={{ position: 'absolute', bottom: 6, right: 8, width: 8, height: 8, borderRadius: '50%', background: '#fff', opacity: 0.7 }} />
                    )}
                  </motion.div>

                  {/* Custom */}
                  <motion.div
                    onClick={() => canUseCustomBackground && document.getElementById('customBackgroundUpload').click()}
                    style={{
                      flex: 1, height: 72, borderRadius: 12,
                      cursor: canUseCustomBackground ? 'pointer' : 'not-allowed',
                      opacity: canUseCustomBackground ? 1 : 0.5,
                      background: canUseCustomBackground && videoSettings.customBackground
                        ? `url(${videoSettings.customBackground}) center/cover no-repeat`
                        : 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                      border: selectedBackground === 'custom' ? '2px solid rgba(255,255,255,0.9)' : '2px solid rgba(255,255,255,0.10)',
                      transition: 'all 0.2s ease',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative', overflow: 'hidden',
                    }}
                    whileHover={canUseCustomBackground ? { scale: 1.03 } : {}}
                    whileTap={canUseCustomBackground ? { scale: 0.97 } : {}}
                  >
                    {canUseCustomBackground ? (
                      <span style={{ fontFamily: NM, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.55)', textShadow: '0 2px 6px rgba(0,0,0,0.9)', background: videoSettings.customBackground ? 'rgba(0,0,0,0.55)' : 'transparent', padding: videoSettings.customBackground ? '4px 8px' : 0, borderRadius: 6 }}>
                        {t('settings.background.custom')}
                      </span>
                    ) : (
                      <span style={{ fontFamily: NM, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>PRO</span>
                    )}
                    <input
                      type="file"
                      id="customBackgroundUpload"
                      accept="image/png,image/jpeg,image/jpg,image/heic,image/gif"
                      onChange={handleCustomBackgroundUpload}
                      style={{ display: 'none' }}
                    />
                  </motion.div>
                </div>
              </div>

              {/* Resolution Selection */}
              <div>
                <p style={SECTION_LABEL}>{t('settings.resolution')}</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[
                    { key: 'hd', label: 'HD', sub: '1280×720', badge: '720p' },
                    { key: 'fullhd', label: 'Full HD', sub: '1920×1080', badge: '1080p', locked: !canUseFullHD },
                    { key: '4k', label: '4K Ultra', sub: '3840×2160', badge: '4K', locked: !canUse4K },
                  ].map(({ key, label, sub, badge, locked }) => (
                    <motion.div
                      key={key}
                      onClick={() => handleResolutionChange(key)}
                      style={{
                        flex: 1, padding: '14px 8px', borderRadius: 12,
                        cursor: locked ? 'not-allowed' : 'pointer',
                        opacity: locked ? 0.5 : 1,
                        background: selectedResolution === key ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)',
                        border: selectedResolution === key ? '1.5px solid rgba(255,255,255,0.35)' : '1.5px solid rgba(255,255,255,0.08)',
                        textAlign: 'center', transition: 'all 0.2s ease', position: 'relative',
                      }}
                      whileHover={!locked ? { scale: 1.02 } : {}}
                      whileTap={!locked ? { scale: 0.98 } : {}}
                    >
                      {locked && (
                        <span style={{ position: 'absolute', top: -8, right: -4, fontFamily: NM, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.07)', borderRadius: 4, padding: '1px 5px', border: '1px solid rgba(255,255,255,0.1)', letterSpacing: '0.04em' }}>PRO</span>
                      )}
                      <div style={{ width: 44, height: 24, margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: NM, fontWeight: 700, fontSize: 9, borderRadius: 5, background: selectedResolution === key ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)' }}>
                        {badge}
                      </div>
                      <div style={{ fontFamily: NM, color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600 }}>{label}</div>
                      <div style={{ fontFamily: NM, color: 'rgba(255,255,255,0.30)', fontSize: 10, marginTop: 2 }}>{sub}</div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Image Layout Selection */}
              <div>
                <p style={SECTION_LABEL}>Pozice obrázku</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  {IMAGE_LAYOUTS.map(({ key, label, sub, icon }) => {
                    const active = selectedImageLayout === key;
                    return (
                      <motion.div
                        key={key}
                        onClick={() => setSelectedImageLayout(key)}
                        style={{
                          flex: 1, padding: '14px 8px', borderRadius: 12,
                          cursor: 'pointer',
                          background: active ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)',
                          border: active ? '1.5px solid rgba(255,255,255,0.35)' : '1.5px solid rgba(255,255,255,0.08)',
                          textAlign: 'center', transition: 'all 0.2s ease',
                        }}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                          {icon(active)}
                        </div>
                        <div style={{ fontFamily: NM, color: active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 600 }}>{label}</div>
                        <div style={{ fontFamily: NM, color: 'rgba(255,255,255,0.28)', fontSize: 10, marginTop: 2, lineHeight: 1.35 }}>{sub}</div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  onClick={handleCancel}
                  style={{ flex: 1, fontFamily: IV, fontWeight: 400, fontSize: '15px', lineHeight: 'normal', background: '#2a2a2a', color: '#fff', border: 'none', padding: '9px 0', borderRadius: 9999, cursor: 'pointer', transition: 'background 0.2s, color 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#111'; e.currentTarget.style.color = '#999'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#2a2a2a'; e.currentTarget.style.color = '#fff'; }}
                >
                  {t('settings.cancel')}
                </button>
                <button
                  onClick={handleSave}
                  style={{ flex: 1, fontFamily: IV, fontWeight: 400, fontSize: '15px', lineHeight: 'normal', background: '#fff', color: '#000', border: 'none', padding: '9px 0', borderRadius: 9999, cursor: 'pointer', transition: 'filter 0.2s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.85)'; }}
                  onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; }}
                >
                  {t('settings.save')}
                </button>
              </div>
            </motion.div>

            {/* ── Right: Preview card ───────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.22, ease: 'easeOut', delay: 0.06 }}
              style={{ width: 480, ...cardStyle }}
            >
              {/* Title */}
              <h2 style={{ fontFamily: NM, color: 'rgba(255,255,255,0.90)', fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
                Náhled
              </h2>

              {/* 16:9 Video Preview */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    paddingBottom: '56.25%',
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.10)',
                    ...getPreviewBgStyle(),
                  }}
                >
                  {lastImageUrl ? (
                    <img
                      key={`${selectedImageLayout}-${lastImageUrl}`}
                      src={lastImageUrl}
                      alt="náhled"
                      style={getPreviewImageStyle()}
                    />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                      <span style={{ fontFamily: NM, color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>
                        Nahrajte obrázek na str. 2
                      </span>
                    </div>
                  )}
                </div>

                {/* Info row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: NM, color: 'rgba(255,255,255,0.22)', fontSize: 11 }}>{bgLabel}</span>
                  <span style={{ fontFamily: NM, color: 'rgba(255,255,255,0.22)', fontSize: 11 }}>{resLabel}</span>
                </div>

              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SettingsPanel;
