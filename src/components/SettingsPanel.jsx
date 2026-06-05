import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const NM = "'Neue Montreal', 'Inter', sans-serif";
const IV = '"Figtree", sans-serif';

const SECTION_LABEL = {
  fontFamily: NM,
  color: 'rgba(255,255,255,0.40)',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  marginBottom: 8,
};

const AlienHead = ({ active }) => (
  <svg width="13" height="13" viewBox="0 0 24 28" fill="currentColor">
    <ellipse cx="12" cy="15" rx="10" ry="13" />
    <ellipse cx="8" cy="13" rx="3.2" ry="4" fill={active ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.35)'} />
    <ellipse cx="16" cy="13" rx="3.2" ry="4" fill={active ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.35)'} />
    <ellipse cx="8" cy="13.5" rx="1.8" ry="2.2" fill={active ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.65)'} />
    <ellipse cx="16" cy="13.5" rx="1.8" ry="2.2" fill={active ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.65)'} />
    <rect x="9" y="20.5" width="6" height="1.1" rx="0.55" fill={active ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'} />
  </svg>
);

const IMAGE_LAYOUTS = [
  {
    key: 'full',
    label: 'Celá plocha',
    sub: 'Vyplní rámeček',
    icon: (active) => (
      <svg width="44" height="27" viewBox="0 0 52 32" fill="none">
        <rect x="0.75" y="0.75" width="50.5" height="30.5" rx="3.25"
          stroke={active ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.2)'} strokeWidth="1.5" />
        <rect x="4" y="3.5" width="44" height="25" rx="1.5"
          fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'} />
      </svg>
    ),
  },
  {
    key: 'padded',
    label: 'S okraji',
    sub: '100px nahoře/dole',
    icon: (active) => (
      <svg width="44" height="27" viewBox="0 0 52 32" fill="none">
        <rect x="0.75" y="0.75" width="50.5" height="30.5" rx="3.25"
          stroke={active ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.2)'} strokeWidth="1.5" />
        <rect x="4" y="7" width="44" height="18" rx="1.5"
          fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'} />
      </svg>
    ),
  },
  {
    key: 'thumbnail',
    label: 'Miniatura',
    sub: '250px výška',
    icon: (active) => (
      <svg width="44" height="27" viewBox="0 0 52 32" fill="none">
        <rect x="0.75" y="0.75" width="50.5" height="30.5" rx="3.25"
          stroke={active ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.2)'} strokeWidth="1.5" />
        <rect x="15" y="11.5" width="22" height="9" rx="1.5"
          fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'} />
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
  padding: '28px',
  display: 'flex',
  flexDirection: 'column',
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
    if ((q === 'fullhd' || q === 'ultrawide' || q === 'square') && !canUseFullHD) return 'hd';
    return q;
  };

  const [selectedBackground, setSelectedBackground] = useState(videoSettings.background || 'black');
  const [selectedResolution, setSelectedResolution] = useState(() => clampQuality(videoSettings.quality || 'fullhd'));
  const [selectedImageLayout, setSelectedImageLayout] = useState(videoSettings.imageLayout || 'full');
  const [hdAlt, setHdAlt] = useState(() => (videoSettings.quality === 'square'));
  const [fullhdAlt, setFullhdAlt] = useState(() => (videoSettings.quality === 'ultrawide'));

  useEffect(() => {
    if (isOpen) {
      const q = clampQuality(videoSettings.quality || 'fullhd');
      setSelectedBackground(videoSettings.background || 'black');
      setSelectedResolution(q);
      setSelectedImageLayout(videoSettings.imageLayout || 'full');
      setHdAlt(q === 'square');
      setFullhdAlt(q === 'ultrawide');
    }
  }, [isOpen]);

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
    if ((resolution === 'fullhd' || resolution === 'ultrawide' || resolution === 'square') && !canUseFullHD) return;
    setSelectedResolution(resolution);
  };

  const toggleHdAlt = (e) => {
    e.stopPropagation();
    const newAlt = !hdAlt;
    setHdAlt(newAlt);
    if (newAlt && selectedResolution === 'hd' && canUseFullHD) setSelectedResolution('square');
    if (!newAlt && selectedResolution === 'square') setSelectedResolution('hd');
  };

  const toggleFullhdAlt = (e) => {
    e.stopPropagation();
    const newAlt = !fullhdAlt;
    setFullhdAlt(newAlt);
    if (newAlt && selectedResolution === 'fullhd' && canUseFullHD) setSelectedResolution('ultrawide');
    if (!newAlt && selectedResolution === 'ultrawide') setSelectedResolution('fullhd');
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

  const getPreviewAspectRatio = () => {
    if (selectedResolution === 'square') return '1 / 1';
    if (selectedResolution === 'ultrawide') return '2560 / 1080';
    return '16 / 9';
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
    return { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' };
  };

  const hdOption = hdAlt
    ? { key: 'square', label: 'Square', sub: '1080×1080', badge: '1:1', locked: !canUseFullHD }
    : { key: 'hd', label: 'HD', sub: '1280×720', badge: '720p', locked: false };

  const fullhdOption = fullhdAlt
    ? { key: 'ultrawide', label: 'Ultra-Wide', sub: '2560×1080', badge: '21:9', locked: !canUseFullHD }
    : { key: 'fullhd', label: 'Full HD', sub: '1920×1080', badge: '1080p', locked: !canUseFullHD };

  const resolutionOptions = [
    hdOption,
    fullhdOption,
    { key: '4k', label: '4K Ultra', sub: '3840×2160', badge: '4K', locked: !canUse4K },
  ];

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
          <div
            className="absolute inset-0"
            onClick={handleCancel}
            style={{ background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }}
          />

          <div
            style={{ position: 'relative', zIndex: 10, display: 'flex', gap: 20, alignItems: 'stretch', justifyContent: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            {/* ── Left: narrow card — title + action buttons ───────── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              style={{ width: 300, ...cardStyle, justifyContent: 'space-between' }}
            >
              <h2 style={{ fontFamily: NM, color: 'rgba(255,255,255,0.90)', fontSize: 18, fontWeight: 700, textAlign: 'center', margin: 0, letterSpacing: '-0.01em' }}>
                {t('settings.title')}
              </h2>

              <div style={{ flex: 1 }} />

              <div style={{ display: 'flex', gap: 10 }}>
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

            {/* ── Right: preview card — 2× wide ────────────────────── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.22, ease: 'easeOut', delay: 0.06 }}
              style={{ width: 720, ...cardStyle, gap: 0 }}
            >
              <h2 style={{ fontFamily: NM, color: 'rgba(255,255,255,0.90)', fontSize: 18, fontWeight: 700, margin: '0 0 16px', letterSpacing: '-0.01em' }}>
                Náhled
              </h2>

              {/* ── Preview area — no rounded corners ── */}
              <div style={{ height: 262, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', borderRadius: 0, overflow: 'hidden', flexShrink: 0 }}>
                <div
                  style={{
                    aspectRatio: getPreviewAspectRatio(),
                    maxWidth: '100%',
                    maxHeight: '262px',
                    position: 'relative',
                    overflow: 'hidden',
                    ...getPreviewBgStyle(),
                  }}
                >
                  {lastImageUrl ? (
                    <img
                      key={`${selectedImageLayout}-${lastImageUrl}-${selectedResolution}`}
                      src={lastImageUrl}
                      alt="náhled"
                      style={getPreviewImageStyle()}
                    />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span style={{ fontFamily: NM, color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>
                        Nahrajte obrázek na str. 2
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '20px 0' }} />

              {/* ── Bottom: 3 equal setting columns ───────────────── */}
              <div style={{ display: 'flex', gap: 20 }}>

                {/* Column 1 — Pozadí */}
                <div style={{ flex: 1 }}>
                  <p style={SECTION_LABEL}>{t('settings.background')}</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {/* White */}
                    <motion.div
                      onClick={() => handleBackgroundChange('white')}
                      style={{
                        flex: 1, height: 54, borderRadius: 10, cursor: 'pointer',
                        background: 'linear-gradient(135deg, #ffffff, #f0f0f0)',
                        border: selectedBackground === 'white' ? '2px solid rgba(255,255,255,0.9)' : '2px solid rgba(255,255,255,0.10)',
                        boxShadow: selectedBackground === 'white' ? '0 0 0 2px rgba(255,255,255,0.15)' : 'none',
                        transition: 'all 0.2s ease', position: 'relative',
                      }}
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    >
                      {selectedBackground === 'white' && <div style={{ position: 'absolute', bottom: 5, right: 6, width: 6, height: 6, borderRadius: '50%', background: '#000', opacity: 0.6 }} />}
                    </motion.div>

                    {/* Black */}
                    <motion.div
                      onClick={() => handleBackgroundChange('black')}
                      style={{
                        flex: 1, height: 54, borderRadius: 10, cursor: 'pointer',
                        background: 'linear-gradient(135deg, #1a1a1a, #000)',
                        border: selectedBackground === 'black' ? '2px solid rgba(255,255,255,0.9)' : '2px solid rgba(255,255,255,0.10)',
                        boxShadow: selectedBackground === 'black' ? '0 0 0 2px rgba(255,255,255,0.08)' : 'none',
                        transition: 'all 0.2s ease', position: 'relative',
                      }}
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    >
                      {selectedBackground === 'black' && <div style={{ position: 'absolute', bottom: 5, right: 6, width: 6, height: 6, borderRadius: '50%', background: '#fff', opacity: 0.7 }} />}
                    </motion.div>

                    {/* Custom */}
                    <motion.div
                      onClick={() => canUseCustomBackground && document.getElementById('customBackgroundUpload').click()}
                      style={{
                        flex: 1, height: 54, borderRadius: 10,
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
                      whileHover={canUseCustomBackground ? { scale: 1.04 } : {}}
                      whileTap={canUseCustomBackground ? { scale: 0.97 } : {}}
                    >
                      {canUseCustomBackground ? (
                        <span style={{ fontFamily: NM, fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.55)', textShadow: '0 2px 6px rgba(0,0,0,0.9)', background: videoSettings.customBackground ? 'rgba(0,0,0,0.55)' : 'transparent', padding: videoSettings.customBackground ? '3px 5px' : 0, borderRadius: 4 }}>
                          {t('settings.background.custom')}
                        </span>
                      ) : (
                        <span style={{ fontFamily: NM, fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>PRO</span>
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

                {/* Column 2 — Rozlišení */}
                <div style={{ flex: 1 }}>
                  <p style={SECTION_LABEL}>{t('settings.resolution')}</p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {resolutionOptions.map(({ key, label, sub, badge, locked }, idx) => {
                      const isHdCard = idx === 0;
                      const isFullhdCard = idx === 1;
                      const hasAlien = isHdCard || isFullhdCard;
                      const alienActive = isHdCard ? hdAlt : fullhdAlt;
                      const isSelected = selectedResolution === key;
                      return (
                        <motion.div
                          key={key}
                          onClick={() => handleResolutionChange(key)}
                          style={{
                            flex: 1, padding: '8px 4px 10px', borderRadius: 10,
                            cursor: locked ? 'not-allowed' : 'pointer',
                            opacity: locked ? 0.45 : 1,
                            background: isSelected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                            border: isSelected ? '1.5px solid rgba(255,255,255,0.38)' : '1.5px solid rgba(255,255,255,0.08)',
                            textAlign: 'center', transition: 'all 0.2s ease', position: 'relative',
                          }}
                          whileHover={!locked ? { scale: 1.03 } : {}}
                          whileTap={!locked ? { scale: 0.97 } : {}}
                        >
                          {locked && (
                            <span style={{ position: 'absolute', top: -7, right: -3, fontFamily: NM, fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.07)', borderRadius: 3, padding: '1px 4px', border: '1px solid rgba(255,255,255,0.1)', letterSpacing: '0.04em' }}>PRO</span>
                          )}

                          {/* Alien toggle */}
                          {hasAlien && (
                            <button
                              onClick={isHdCard ? toggleHdAlt : toggleFullhdAlt}
                              title={isHdCard
                                ? (hdAlt ? 'Přepnout na HD 720p' : 'Přepnout na Square 1:1 (Instagram)')
                                : (fullhdAlt ? 'Přepnout na Full HD' : 'Přepnout na Ultra-Widescreen 21:9')}
                              style={{
                                position: 'absolute', top: 4, left: 4,
                                width: 16, height: 16,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: alienActive ? 'rgba(255,255,255,0.60)' : 'rgba(255,255,255,0.20)',
                                padding: 0, borderRadius: 3,
                                transition: 'color 0.2s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.80)'; }}
                              onMouseLeave={e => { e.currentTarget.style.color = alienActive ? 'rgba(255,255,255,0.60)' : 'rgba(255,255,255,0.20)'; }}
                            >
                              <AlienHead active={alienActive} />
                            </button>
                          )}

                          <div style={{ width: 36, height: 18, margin: '0 auto 5px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: NM, fontWeight: 700, fontSize: 8, borderRadius: 4, background: isSelected ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)' }}>
                            {badge}
                          </div>
                          <div style={{ fontFamily: NM, color: isSelected ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
                          <div style={{ fontFamily: NM, color: 'rgba(255,255,255,0.28)', fontSize: 8, marginTop: 2 }}>{sub}</div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Column 3 — Pozice obrázku */}
                <div style={{ flex: 1 }}>
                  <p style={SECTION_LABEL}>Pozice obrázku</p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {IMAGE_LAYOUTS.map(({ key, label, sub, icon }) => {
                      const active = selectedImageLayout === key;
                      return (
                        <motion.div
                          key={key}
                          onClick={() => setSelectedImageLayout(key)}
                          style={{
                            flex: 1, padding: '10px 4px 8px', borderRadius: 10,
                            cursor: 'pointer',
                            background: active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                            border: active ? '1.5px solid rgba(255,255,255,0.38)' : '1.5px solid rgba(255,255,255,0.08)',
                            textAlign: 'center', transition: 'all 0.2s ease',
                          }}
                          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
                            {icon(active)}
                          </div>
                          <div style={{ fontFamily: NM, color: active ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
                          <div style={{ fontFamily: NM, color: 'rgba(255,255,255,0.28)', fontSize: 8, marginTop: 2, lineHeight: 1.3 }}>{sub}</div>
                        </motion.div>
                      );
                    })}
                  </div>
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
