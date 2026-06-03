import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useAnimation } from '../context/AnimationContext';
import page1Background from '../assets/page-1-background.png';

const NM = "'Neue Montreal', 'Inter', sans-serif";

const SettingsPanel = ({ isOpen, onClose }) => {
  const { user, featureFlags } = useAuth();
  const { t } = useLanguage();
  const { perfMode, setUserPerfMode } = useAnimation();
  const {
    videoSettings,
    setVideoBackground,
    setCustomBackground,
    setVideoQuality
  } = useAppStore();

  const [selectedBackground, setSelectedBackground] = useState(videoSettings.background || 'black');
  const [selectedResolution, setSelectedResolution] = useState(() => {
    const q = videoSettings.quality || 'fullhd';
    const canHD = featureFlags?.high_quality || user?.role === 'pro' || user?.role === 'unlimited' || user?.role === 'admin';
    const can4K = featureFlags?.ultra_quality || user?.role === 'unlimited' || user?.role === 'admin';
    if (q === '4k' && !can4K) return canHD ? 'fullhd' : 'hd';
    if (q === 'fullhd' && !canHD) return 'hd';
    return q;
  });

  const canUseFullHD = featureFlags?.high_quality || user?.role === 'pro' || user?.role === 'unlimited' || user?.role === 'admin';
  const canUse4K = featureFlags?.ultra_quality || user?.role === 'unlimited' || user?.role === 'admin';
  const canUseCustomBackground = user?.role === 'pro' || user?.role === 'unlimited' || user?.role === 'admin';

  const clampQuality = (q) => {
    if (q === '4k' && !canUse4K) return canUseFullHD ? 'fullhd' : 'hd';
    if (q === 'fullhd' && !canUseFullHD) return 'hd';
    return q;
  };

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
        const base64Data = e.target.result;
        setCustomBackground(base64Data);
        setSelectedBackground('custom');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setVideoBackground(selectedBackground);
    setVideoQuality(selectedResolution);
    onClose();
  };

  const handleCancel = () => {
    setSelectedBackground(videoSettings.background || 'black');
    setSelectedResolution(clampQuality(videoSettings.quality || 'fullhd'));
    onClose();
  };

  /* ── shared pill-button style ── */
  const pillBtn = {
    fontFamily: NM,
    fontWeight: 600,
    fontSize: '0.82rem',
    borderRadius: 9999,
    cursor: 'pointer',
    outline: 'none',
    transition: 'filter 0.2s ease',
    padding: '10px 28px',
    border: 'none',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 999999, pointerEvents: 'auto' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            onClick={handleCancel}
            style={{
              backdropFilter: 'blur(24px) saturate(110%) brightness(75%)',
              WebkitBackdropFilter: 'blur(24px) saturate(110%) brightness(75%)',
              overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${page1Background})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              filter: 'blur(40px)',
              transform: 'scale(1.1)',
              opacity: 0.45,
              zIndex: 0,
            }} />
            {/* Strong fade to black on all edges */}
            <div style={{
              position: 'absolute', inset: 0, zIndex: 1,
              background: 'radial-gradient(ellipse 50% 52% at 50% 50%, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.96) 100%)',
            }} />
          </div>

          {/* Settings card — pure-black glassmorphism */}
          <motion.div
            className="relative"
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{
              width: 480,
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
            }}
          >
            {/* Title */}
            <h2
              style={{
                fontFamily: NM,
                color: 'rgba(255,255,255,0.90)',
                fontSize: 18,
                fontWeight: 700,
                textAlign: 'center',
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              {t('settings.title')}
            </h2>

            {/* Background Selection */}
            <div>
              <p style={{ fontFamily: NM, color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 12 }}>
                {t('settings.background')}
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                {/* White */}
                <motion.div
                  onClick={() => handleBackgroundChange('white')}
                  style={{
                    flex: 1, height: 72, borderRadius: 12, cursor: 'pointer',
                    background: 'linear-gradient(135deg, #ffffff, #f0f0f0)',
                    border: selectedBackground === 'white'
                      ? '2px solid rgba(255,255,255,0.9)'
                      : '2px solid rgba(255,255,255,0.10)',
                    boxShadow: selectedBackground === 'white' ? '0 0 0 2px rgba(255,255,255,0.15)' : 'none',
                    transition: 'all 0.2s ease',
                    position: 'relative', overflow: 'hidden',
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
                    border: selectedBackground === 'black'
                      ? '2px solid rgba(255,255,255,0.9)'
                      : '2px solid rgba(255,255,255,0.10)',
                    boxShadow: selectedBackground === 'black' ? '0 0 0 2px rgba(255,255,255,0.08)' : 'none',
                    transition: 'all 0.2s ease',
                    position: 'relative', overflow: 'hidden',
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
                    border: selectedBackground === 'custom'
                      ? '2px solid rgba(255,255,255,0.9)'
                      : '2px solid rgba(255,255,255,0.10)',
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
              <p style={{ fontFamily: NM, color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 12 }}>
                {t('settings.resolution')}
              </p>
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
                      flex: 1, padding: '14px 8px',
                      borderRadius: 12,
                      cursor: locked ? 'not-allowed' : 'pointer',
                      opacity: locked ? 0.5 : 1,
                      background: selectedResolution === key
                        ? 'rgba(255,255,255,0.07)'
                        : 'rgba(255,255,255,0.02)',
                      border: selectedResolution === key
                        ? '1.5px solid rgba(255,255,255,0.35)'
                        : '1.5px solid rgba(255,255,255,0.08)',
                      textAlign: 'center',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                    }}
                    whileHover={!locked ? { scale: 1.02 } : {}}
                    whileTap={!locked ? { scale: 0.98 } : {}}
                  >
                    {locked && (
                      <span style={{ position: 'absolute', top: -8, right: -4, fontFamily: NM, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.07)', borderRadius: 4, padding: '1px 5px', border: '1px solid rgba(255,255,255,0.1)', letterSpacing: '0.04em' }}>PRO</span>
                    )}
                    <div style={{
                      width: 44, height: 24, margin: '0 auto 8px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: NM, fontWeight: 700, fontSize: 9,
                      borderRadius: 5,
                      background: selectedResolution === key ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                      color: 'rgba(255,255,255,0.7)',
                    }}>
                      {badge}
                    </div>
                    <div style={{ fontFamily: NM, color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600 }}>{label}</div>
                    <div style={{ fontFamily: NM, color: 'rgba(255,255,255,0.30)', fontSize: 10, marginTop: 2 }}>{sub}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* APP SETTINGS — Performance Mode */}
            <div>
              <p style={{ fontFamily: NM, color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 12 }}>
                APP SETTINGS
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                {/* MAX mode */}
                <motion.div
                  onClick={() => setUserPerfMode('max')}
                  style={{
                    flex: 1, borderRadius: 12, cursor: 'pointer',
                    padding: '14px 12px',
                    background: perfMode === 'max' ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)',
                    border: perfMode === 'max' ? '2px solid rgba(59,130,246,0.7)' : '2px solid rgba(255,255,255,0.08)',
                    boxShadow: perfMode === 'max' ? '0 0 0 2px rgba(59,130,246,0.12)' : 'none',
                    transition: 'all 0.2s ease',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    position: 'relative', overflow: 'hidden',
                  }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                >
                  {/* iMac icon with sparks */}
                  <div style={{ position: 'relative', lineHeight: 1 }}>
                    <span style={{ fontSize: 28 }}>🖥️</span>
                    {perfMode === 'max' && <>
                      <span style={{ position: 'absolute', top: -4, right: -6, fontSize: 10 }}>✨</span>
                      <span style={{ position: 'absolute', bottom: -2, left: -6, fontSize: 8 }}>✦</span>
                    </>}
                  </div>
                  <div style={{ fontFamily: NM, fontSize: 11, fontWeight: 700, color: perfMode === 'max' ? '#60a5fa' : 'rgba(255,255,255,0.7)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    MAX
                  </div>
                  <div style={{ fontFamily: NM, fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'center', lineHeight: 1.4 }}>
                    Všechny animace
                  </div>
                </motion.div>

                {/* LOW mode */}
                <motion.div
                  onClick={() => setUserPerfMode('low')}
                  style={{
                    flex: 1, borderRadius: 12, cursor: 'pointer',
                    padding: '14px 12px',
                    background: perfMode === 'low' ? 'rgba(16,185,129,0.10)' : 'rgba(255,255,255,0.03)',
                    border: perfMode === 'low' ? '2px solid rgba(16,185,129,0.6)' : '2px solid rgba(255,255,255,0.08)',
                    boxShadow: perfMode === 'low' ? '0 0 0 2px rgba(16,185,129,0.10)' : 'none',
                    transition: 'all 0.2s ease',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                >
                  <span style={{ fontSize: 28, lineHeight: 1 }}>⚡</span>
                  <div style={{ fontFamily: NM, fontSize: 11, fontWeight: 700, color: perfMode === 'low' ? '#34d399' : 'rgba(255,255,255,0.7)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    LOW
                  </div>
                  <div style={{ fontFamily: NM, fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'center', lineHeight: 1.4 }}>
                    Bez animací — starší PC
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Action Buttons — pill style matching "Open app" */}
            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <button
                onClick={handleCancel}
                style={{
                  ...pillBtn,
                  flex: 1,
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.70)',
                  border: '1px solid rgba(255,255,255,0.10)',
                }}
                onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; }}
              >
                {t('settings.cancel')}
              </button>
              <button
                onClick={handleSave}
                style={{
                  ...pillBtn,
                  flex: 1,
                  background: '#fff',
                  color: '#000',
                }}
                onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.85)'; }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; }}
              >
                {t('settings.save')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SettingsPanel;
