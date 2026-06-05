import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const NM = "'Neue Montreal', 'Inter', sans-serif";
const IV = '"Figtree", sans-serif';

// ── Two padding values used throughout ────────────────────────────────────────
const CARD_PADDING  = 32;          // outer card
const ITEM_PADDING  = '12px 8px';  // every option container
const CARD_H        = 90;          // height of every option container (px)
const CARD_RADIUS   = 12;          // border-radius of every option container
const COL_GAP       = 24;          // gap between the 3 columns
const ITEM_GAP      = 10;          // gap between cards within a column
const PREVIEW_H     = 300;         // outer preview height (px)

const SECTION_LABEL = {
  fontFamily: NM,
  color: 'rgba(255,255,255,0.38)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.02em',
  margin: 0,
  marginBottom: 10,
};

const AlienHead = ({ active }) => (
  <svg width="14" height="14" viewBox="0 0 24 28" fill="currentColor">
    <ellipse cx="12" cy="15" rx="10" ry="13" />
    <ellipse cx="8"  cy="13" rx="3.2" ry="4"   fill={active ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.35)'} />
    <ellipse cx="16" cy="13" rx="3.2" ry="4"   fill={active ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.35)'} />
    <ellipse cx="8"  cy="13.5" rx="1.8" ry="2.2" fill={active ? 'rgba(0,0,0,0.5)'   : 'rgba(0,0,0,0.65)'} />
    <ellipse cx="16" cy="13.5" rx="1.8" ry="2.2" fill={active ? 'rgba(0,0,0,0.5)'   : 'rgba(0,0,0,0.65)'} />
    <rect x="9" y="20.5" width="6" height="1.1" rx="0.55" fill={active ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'} />
  </svg>
);

const IMAGE_LAYOUTS = [
  {
    key: 'full',
    label: 'Celá plocha',
    sub: 'Vyplní rámeček',
    icon: (active) => (
      <svg width="52" height="32" viewBox="0 0 52 32" fill="none">
        <rect x="0.75" y="0.75" width="50.5" height="30.5" rx="3.25"
          stroke={active ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.22)'} strokeWidth="1.5" />
        <rect x="4" y="3.5" width="44" height="25" rx="1.5"
          fill={active ? 'rgba(255,255,255,0.24)' : 'rgba(255,255,255,0.09)'} />
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
          stroke={active ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.22)'} strokeWidth="1.5" />
        <rect x="4" y="7.5" width="44" height="17" rx="1.5"
          fill={active ? 'rgba(255,255,255,0.24)' : 'rgba(255,255,255,0.09)'} />
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
          stroke={active ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.22)'} strokeWidth="1.5" />
        <rect x="15" y="11.5" width="22" height="9" rx="1.5"
          fill={active ? 'rgba(255,255,255,0.24)' : 'rgba(255,255,255,0.09)'} />
      </svg>
    ),
  },
];

// ── Preview frame dimensions: explicit pixels so the bg colour always renders ──
const getFrameDims = (resolution) => {
  if (resolution === 'square')    return { w: PREVIEW_H,                             h: PREVIEW_H };
  if (resolution === 'ultrawide') return { w: Math.round(PREVIEW_H * 2560 / 1080),  h: PREVIEW_H };
  return                                 { w: Math.round(PREVIEW_H * 16   / 9),     h: PREVIEW_H };
};

const SettingsPanel = ({ isOpen, onClose }) => {
  const { user, featureFlags } = useAuth();
  const { t } = useLanguage();

  const { videoSettings, pairs, setVideoBackground, setCustomBackground, setVideoQuality, setImageLayout } = useAppStore();

  const canUseFullHD  = featureFlags?.high_quality  || ['pro','unlimited','admin'].includes(user?.role);
  const canUse4K      = featureFlags?.ultra_quality  || ['unlimited','admin'].includes(user?.role);
  const canUseCustomBg = ['pro','unlimited','admin'].includes(user?.role);

  const clamp = (q) => {
    if (q === '4k'       && !canUse4K)     return canUseFullHD ? 'fullhd' : 'hd';
    if (['fullhd','ultrawide','square'].includes(q) && !canUseFullHD) return 'hd';
    return q;
  };

  const [selBg,  setSelBg]  = useState(videoSettings.background || 'black');
  const [selRes, setSelRes] = useState(() => clamp(videoSettings.quality  || 'fullhd'));
  const [selLay, setSelLay] = useState(videoSettings.imageLayout || 'full');
  const [hdAlt,  setHdAlt]  = useState(() => videoSettings.quality === 'square');
  const [fhdAlt, setFhdAlt] = useState(() => videoSettings.quality === 'ultrawide');

  // Sync when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const q = clamp(videoSettings.quality || 'fullhd');
    setSelBg(videoSettings.background || 'black');
    setSelRes(q);
    setSelLay(videoSettings.imageLayout || 'full');
    setHdAlt(q === 'square');
    setFhdAlt(q === 'ultrawide');
  }, [isOpen]);

  // Latest image from pairs
  const lastImage = [...pairs].reverse().find(p => p.image)?.image ?? null;
  const [imgUrl, setImgUrl] = useState(null);
  useEffect(() => {
    if (!lastImage) { setImgUrl(null); return; }
    const url = URL.createObjectURL(lastImage);
    setImgUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [lastImage]);

  const changeBg  = (bg)  => { if (bg === 'custom' && !canUseCustomBg) return; setSelBg(bg); };
  const changeRes = (res) => {
    if (res === '4k' && !canUse4K) return;
    if (['fullhd','ultrawide','square'].includes(res) && !canUseFullHD) return;
    setSelRes(res);
  };

  const toggleHd  = (e) => { e.stopPropagation(); const n = !hdAlt;  setHdAlt(n);  if (n  && selRes === 'hd'     && canUseFullHD) setSelRes('square');   if (!n  && selRes === 'square')   setSelRes('hd'); };
  const toggleFhd = (e) => { e.stopPropagation(); const n = !fhdAlt; setFhdAlt(n); if (n  && selRes === 'fullhd' && canUseFullHD) setSelRes('ultrawide'); if (!n  && selRes === 'ultrawide') setSelRes('fullhd'); };

  const onCustomUpload = (e) => {
    const file = e.target.files[0];
    if (!file?.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setCustomBackground(ev.target.result); setSelBg('custom'); };
    reader.readAsDataURL(file);
  };

  const handleSave = () => { setVideoBackground(selBg); setVideoQuality(selRes); setImageLayout(selLay); onClose(); };
  const handleCancel = () => {
    setSelBg(videoSettings.background || 'black');
    setSelRes(clamp(videoSettings.quality || 'fullhd'));
    setSelLay(videoSettings.imageLayout || 'full');
    onClose();
  };

  // ── Live preview helpers ────────────────────────────────────────────────────
  const previewBg = () => {
    if (selBg === 'white') return { backgroundColor: '#ffffff' };
    if (selBg === 'custom' && videoSettings.customBackground) {
      return { backgroundImage: `url(${videoSettings.customBackground})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' };
    }
    return { backgroundColor: '#000000' };
  };

  const previewImgStyle = () => {
    if (selLay === 'padded') {
      const p = (100 / 1080) * 100;
      return { position: 'absolute', top: `${p.toFixed(2)}%`, left: 0, right: 0, height: `${(100 - p * 2).toFixed(2)}%`, width: '100%', objectFit: 'contain' };
    }
    if (selLay === 'thumbnail') {
      return { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', maxWidth: '100%', height: `${((250/1080)*100).toFixed(2)}%`, width: 'auto', objectFit: 'contain' };
    }
    return { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' };
  };

  // ── Resolution option definitions ──────────────────────────────────────────
  const resOpts = [
    hdAlt
      ? { key: 'square',    label: 'Square',    sub: '1080×1080', badge: '1:1',   locked: !canUseFullHD }
      : { key: 'hd',        label: 'HD',        sub: '1280×720',  badge: '720p',  locked: false },
    fhdAlt
      ? { key: 'ultrawide', label: 'Ultra-Wide', sub: '2560×1080', badge: '21:9', locked: !canUseFullHD }
      : { key: 'fullhd',   label: 'Full HD',    sub: '1920×1080', badge: '1080p', locked: !canUseFullHD },
    { key: '4k',    label: '4K Ultra', sub: '3840×2160', badge: '4K',    locked: !canUse4K },
  ];

  const { w: frameW, h: frameH } = getFrameDims(selRes);

  // ── Shared card style factory ──────────────────────────────────────────────
  const optCard = (selected, locked = false) => ({
    flex: 1,
    height: CARD_H,
    borderRadius: CARD_RADIUS,
    cursor: locked ? 'not-allowed' : 'pointer',
    opacity: locked ? 0.42 : 1,
    background:  selected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.025)',
    border:      selected ? '1.5px solid rgba(255,255,255,0.40)' : '1.5px solid rgba(255,255,255,0.08)',
    transition: 'all 0.18s ease',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: ITEM_PADDING,
    boxSizing: 'border-box',
    textAlign: 'center',
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0"
          style={{ zIndex: 999999, pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0" onClick={handleCancel}
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }} />

          {/* Card + buttons — vertical stack */}
          <div onClick={e => e.stopPropagation()}
            style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>

            {/* ════ CARD ════════════════════════════════════════════════════════ */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{    opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              style={{
                width: 1200,
                maxWidth: 'calc(100vw - 40px)',
                background: 'rgba(10,10,12,0.90)',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)',
                borderRadius: 20,
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 28px 64px rgba(0,0,0,0.78), 0 0 0 1px rgba(255,255,255,0.04) inset',
                padding: CARD_PADDING,
                display: 'flex',
                flexDirection: 'column',
                gap: COL_GAP,
              }}
            >
              {/* Title — centered */}
              <h2 style={{ fontFamily: NM, color: 'rgba(255,255,255,0.92)', fontSize: 20, fontWeight: 700, textAlign: 'center', margin: 0, letterSpacing: '-0.02em' }}>
                {t('settings.title')}
              </h2>

              {/* ── Preview ──────────────────────────────────────────────────── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={SECTION_LABEL}>Náhled</p>

                {/* Outer náhled — always black, full card width */}
                <div style={{ width: '100%', height: PREVIEW_H, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>

                  {/* Inner frame — explicit pixel size; thin grey outline shows the resolution shape */}
                  <div style={{
                    width:  frameW,
                    height: frameH,
                    position: 'relative',
                    overflow: 'hidden',
                    outline: '1px solid rgba(255,255,255,0.20)',
                    boxSizing: 'border-box',
                    flexShrink: 0,
                    ...previewBg(),
                  }}>
                    {imgUrl ? (
                      <img
                        key={`${selLay}-${imgUrl}-${selRes}`}
                        src={imgUrl}
                        alt="náhled"
                        style={previewImgStyle()}
                      />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <span style={{ fontFamily: NM, color: 'rgba(255,255,255,0.18)', fontSize: 11 }}>Nahrajte obrázek na str. 2</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: `-${COL_GAP / 2}px 0` }} />

              {/* ── Three equal columns ───────────────────────────────────────── */}
              <div style={{ display: 'flex', gap: COL_GAP }}>

                {/* ─ Column 1: Pozadí ────────────────────────────────────────── */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <p style={SECTION_LABEL}>{t('settings.background')}</p>
                  <div style={{ display: 'flex', gap: ITEM_GAP }}>

                    {/* White */}
                    <motion.div
                      onClick={() => changeBg('white')}
                      style={{ ...optCard(selBg === 'white'), background: 'linear-gradient(135deg,#fff,#f0f0f0)', padding: 0 }}
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    >
                      {selBg === 'white' && <div style={{ position: 'absolute', bottom: 7, right: 8, width: 7, height: 7, borderRadius: '50%', background: '#000', opacity: 0.45 }} />}
                    </motion.div>

                    {/* Black */}
                    <motion.div
                      onClick={() => changeBg('black')}
                      style={{ ...optCard(selBg === 'black'), background: 'linear-gradient(135deg,#1c1c1c,#000)', padding: 0 }}
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    >
                      {selBg === 'black' && <div style={{ position: 'absolute', bottom: 7, right: 8, width: 7, height: 7, borderRadius: '50%', background: '#fff', opacity: 0.55 }} />}
                    </motion.div>

                    {/* Custom */}
                    <motion.div
                      onClick={() => canUseCustomBg && document.getElementById('settingsBgUpload').click()}
                      style={{
                        ...optCard(selBg === 'custom', !canUseCustomBg),
                        background: canUseCustomBg && videoSettings.customBackground
                          ? `url(${videoSettings.customBackground}) center/cover no-repeat`
                          : 'linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))',
                        padding: 0,
                      }}
                      whileHover={canUseCustomBg ? { scale: 1.03 } : {}}
                      whileTap={canUseCustomBg ? { scale: 0.97 } : {}}
                    >
                      {canUseCustomBg ? (
                        <span style={{ fontFamily: NM, fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.55)', textShadow: '0 2px 6px rgba(0,0,0,0.9)', background: videoSettings.customBackground ? 'rgba(0,0,0,0.52)' : 'transparent', padding: videoSettings.customBackground ? '3px 7px' : 0, borderRadius: 5 }}>
                          {t('settings.background.custom')}
                        </span>
                      ) : (
                        <span style={{ fontFamily: NM, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.04em' }}>PRO</span>
                      )}
                      <input type="file" id="settingsBgUpload" accept="image/png,image/jpeg,image/jpg,image/heic,image/gif" onChange={onCustomUpload} style={{ display: 'none' }} />
                    </motion.div>
                  </div>
                </div>

                {/* ─ Column 2: Rozlišení ─────────────────────────────────────── */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <p style={SECTION_LABEL}>{t('settings.resolution')}</p>
                  <div style={{ display: 'flex', gap: ITEM_GAP }}>
                    {resOpts.map(({ key, label, sub, badge, locked }, idx) => {
                      const isHd  = idx === 0;
                      const isFhd = idx === 1;
                      const hasAlien = isHd || isFhd;
                      const alienOn  = isHd ? hdAlt : fhdAlt;
                      const isSel    = selRes === key;
                      return (
                        <motion.div
                          key={key}
                          onClick={() => changeRes(key)}
                          style={optCard(isSel, locked)}
                          whileHover={!locked ? { scale: 1.03 } : {}}
                          whileTap={!locked ? { scale: 0.97 } : {}}
                        >
                          {locked && (
                            <span style={{ position: 'absolute', top: -7, right: -2, fontFamily: NM, fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.07)', borderRadius: 3, padding: '1px 4px', border: '1px solid rgba(255,255,255,0.1)' }}>PRO</span>
                          )}
                          {hasAlien && (
                            <button
                              onClick={isHd ? toggleHd : toggleFhd}
                              title={isHd ? (hdAlt ? 'Přepnout na HD 720p' : 'Přepnout na Square 1:1') : (fhdAlt ? 'Přepnout na Full HD' : 'Přepnout na Ultra-Wide 21:9')}
                              style={{ position: 'absolute', top: 6, left: 6, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: alienOn ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.22)', padding: 0, borderRadius: 4, transition: 'color 0.18s' }}
                              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.88)'; }}
                              onMouseLeave={e => { e.currentTarget.style.color = alienOn ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.22)'; }}
                            >
                              <AlienHead active={alienOn} />
                            </button>
                          )}
                          {/* Badge */}
                          <div style={{ width: 44, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: NM, fontWeight: 700, fontSize: 9, borderRadius: 4, background: isSel ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.72)' }}>
                            {badge}
                          </div>
                          <div style={{ fontFamily: NM, color: isSel ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.58)', fontSize: 11, fontWeight: 600 }}>{label}</div>
                          <div style={{ fontFamily: NM, color: 'rgba(255,255,255,0.27)', fontSize: 9 }}>{sub}</div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* ─ Column 3: Pozice obrázku ────────────────────────────────── */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <p style={SECTION_LABEL}>Pozice obrázku</p>
                  <div style={{ display: 'flex', gap: ITEM_GAP }}>
                    {IMAGE_LAYOUTS.map(({ key, label, sub, icon }) => {
                      const active = selLay === key;
                      return (
                        <motion.div
                          key={key}
                          onClick={() => setSelLay(key)}
                          style={optCard(active)}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          {icon(active)}
                          <div style={{ fontFamily: NM, color: active ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 600 }}>{label}</div>
                          <div style={{ fontFamily: NM, color: 'rgba(255,255,255,0.27)', fontSize: 9, lineHeight: 1.3 }}>{sub}</div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </motion.div>

            {/* ════ BUTTONS — below the card ════════════════════════════════════ */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{    opacity: 0, y: 6 }}
              transition={{ duration: 0.22, ease: 'easeOut', delay: 0.07 }}
              style={{ display: 'flex', gap: 12 }}
            >
              <button
                onClick={handleCancel}
                style={{ fontFamily: IV, fontWeight: 400, fontSize: '15px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.13)', padding: '10px 40px', borderRadius: 9999, cursor: 'pointer', backdropFilter: 'blur(8px)', transition: 'all 0.18s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
              >
                {t('settings.cancel')}
              </button>
              <button
                onClick={handleSave}
                style={{ fontFamily: IV, fontWeight: 500, fontSize: '15px', background: '#fff', color: '#000', border: 'none', padding: '10px 40px', borderRadius: 9999, cursor: 'pointer', transition: 'filter 0.18s' }}
                onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.85)'; }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; }}
              >
                {t('settings.save')}
              </button>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SettingsPanel;
