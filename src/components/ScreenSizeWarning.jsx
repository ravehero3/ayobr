import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import starsBg from '../assets/stars_background_voodoo808_1778087733997.jpg';

const NM = "'Neue Montreal', 'Inter', sans-serif";

export default function ScreenSizeWarning({ lang, forceShow, onDismiss }) {
  const { language } = useLanguage();
  const currentLang = lang || language || 'cs';
  const isCzech = currentLang === 'cs';

  const [showWarning, setShowWarning] = useState(forceShow || false);

  useEffect(() => {
    if (forceShow !== undefined) {
      setShowWarning(forceShow);
      return;
    }

    const checkScreenSize = () => {
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      if (screenWidth < 1280 || screenHeight < 800) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [forceShow]);

  if (!showWarning && forceShow === undefined) return null;
  if (!forceShow && localStorage.getItem('hide-size-warning') === 'true') return null;

  const handleContinue = () => {
    if (onDismiss) onDismiss();
    localStorage.setItem('hide-size-warning', 'true');
    setShowWarning(false);
  };

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16
      }}>
        {/* Backdrop blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        />

        {/* Modal card matching UpgradePage */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'relative', zIndex: 1, width: '100%', maxWidth: 440,
            background: 'linear-gradient(to bottom, rgba(8,8,12,0.98), rgba(4,14,50,0.98))',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 20,
            padding: '36px 32px 30px',
            boxShadow: '0 40px 80px -20px rgba(0,0,0,0.85)',
            overflow: 'hidden',
          }}
        >
          {/* Subtle ambient glow */}
          <div style={{
            position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)',
            width: '120%', height: 200,
            background: 'rgba(59,130,246,0.18)', filter: 'blur(60px)',
            zIndex: 0, pointerEvents: 'none', borderRadius: '50%'
          }} />

          {/* Close button */}
          <button
            onClick={handleContinue}
            style={{
              position: 'absolute', top: 16, right: 16, zIndex: 10,
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)',
              cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4, transition: 'color 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
          >
            ×
          </button>

          {/* Header */}
          <div style={{ position: 'relative', zIndex: 1, marginBottom: 20 }}>
            <h2 style={{
              fontFamily: NM, fontSize: '1.4rem', fontWeight: 700,
              color: '#fff', marginBottom: 6, letterSpacing: '-0.03em', lineHeight: 1.2
            }}>
              {isCzech ? 'Optimalizováno pro desktop' : 'Best on Desktop'}
            </h2>
            <p style={{
              fontFamily: NM, fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)',
              lineHeight: 1.6, margin: 0
            }}>
              {isCzech
                ? 'TypeBeatz je pokročilý hromadný generátor videí a nejlépe se používá na větší obrazovce počítače. Můžete pokračovat i na mobilu, ale některé funkce jako drag-and-drop mohou být omezené.'
                : 'TypeBeatz is a powerful batch video generator best experienced on a larger screen. You can continue on mobile, but some features like drag-and-drop may be limited.'}
            </p>
          </div>

          {/* Inner divider */}
          <div style={{ position: 'relative', zIndex: 1, width: '100%', height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 24 }} />

          {/* Button matching UpgradePage */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <button
              onClick={handleContinue}
              style={{
                width: '100%', height: 46, borderRadius: 9999, border: 'none', cursor: 'pointer',
                background: '#fff', color: '#000', fontFamily: NM, fontWeight: 700, fontSize: '0.9rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'transform 0.15s, opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {isCzech ? 'Pokračovat i tak →' : 'Continue anyway →'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
