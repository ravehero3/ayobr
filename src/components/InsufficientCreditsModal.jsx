import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import starsBg from '../assets/stars_background_voodoo808_1778087733997.jpg';

const NM = "'Neue Montreal', 'Inter', sans-serif";

export default function InsufficientCreditsModal({
  needed = 1,
  remaining = 0,
  isPro = false,
  onClose,
  onUpgradePro,
  onUpgradeUnlimited,
  lang,
}) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const currentLang = lang || language || 'cs';
  const isCzech = currentLang === 'cs';

  // Prevent background scrolling while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handlePro = () => {
    if (onUpgradePro) onUpgradePro();
    else navigate('/upgrade?plan=pro');
  };

  const handleUnlimited = () => {
    if (onUpgradeUnlimited) onUpgradeUnlimited();
    else navigate('/upgrade?plan=unlimited');
  };

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}>
        {/* Backdrop blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        />

        {/* Modal card styled identically to UpgradePage */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'relative', zIndex: 1,
            width: '100%', maxWidth: 440,
            background: 'linear-gradient(to bottom, rgba(8,8,12,0.98), rgba(4,14,50,0.98))',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 20,
            padding: '36px 32px 30px',
            boxShadow: '0 40px 80px -20px rgba(0,0,0,0.85)',
            overflow: 'hidden',
          }}
        >
          {/* Ambient background glow & stars like Pro card in UpgradePage */}
          <div style={{
            position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)',
            width: '120%', height: 240,
            background: 'rgba(59,130,246,0.22)',
            filter: 'blur(70px)',
            zIndex: 0, pointerEvents: 'none', borderRadius: '50%'
          }} />
          <div style={{
            position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)',
            width: '110%', height: 200,
            backgroundImage: `url(${starsBg})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: 0.45, zIndex: 0, pointerEvents: 'none', borderRadius: '50%',
            maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 20%, transparent 65%)',
            WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,1) 20%, transparent 65%)'
          }} />

          {/* Close button */}
          <button
            onClick={onClose}
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

          {/* Heading & Subtitle */}
          <div style={{ position: 'relative', zIndex: 1, marginBottom: 20 }}>
            <h2 style={{
              fontFamily: NM, fontSize: '1.4rem', fontWeight: 700,
              letterSpacing: '-0.03em', color: '#fff', margin: '0 0 6px', lineHeight: 1.2
            }}>
              {isCzech ? 'Nedostatek kreditů' : 'Limit reached'}
            </h2>
            <p style={{
              fontFamily: NM, fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)',
              lineHeight: 1.6, margin: 0
            }}>
              {isPro
                ? (isCzech
                    ? `Pro toto generování potřebujete ${needed} ${needed === 1 ? 'kredit' : needed < 5 ? 'kredity' : 'kreditů'}, ale zbývá vám ${remaining}. Přejděte na Neomezený plán a tvořte bez limitů.`
                    : `You need ${needed} credit${needed > 1 ? 's' : ''} but only have ${remaining} left. Upgrade to Unlimited for unlimited video creation.`
                  )
                : (isCzech
                    ? `Pro toto video potřebujete ${needed} ${needed === 1 ? 'kredit' : needed < 5 ? 'kredity' : 'kreditů'}, ale zbývá vám ${remaining}. Přejděte na vyšší plán a tvořte dál.`
                    : `You need ${needed} credit${needed > 1 ? 's' : ''} but only have ${remaining} left. Upgrade your plan to continue rendering.`
                  )
              }
            </p>
          </div>

          {/* Inner divider */}
          <div style={{ position: 'relative', zIndex: 1, width: '100%', height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 20 }} />

          {/* Status info box */}
          <div style={{
            position: 'relative', zIndex: 1,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, padding: '14px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 24
          }}>
            <div>
              <div style={{ fontFamily: NM, fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {isCzech ? 'Aktuální plán' : 'Current plan'}
              </div>
              <div style={{ fontFamily: NM, fontSize: '0.9rem', color: '#fff', fontWeight: 600, marginTop: 2 }}>
                {isPro ? (isCzech ? 'Plán PRO (31 videí/měs)' : 'Plan PRO (31 videos/mo)') : (isCzech ? 'Plán FREE (5 videí/měs)' : 'Plan FREE (5 videos/mo)')}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: NM, fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {isCzech ? 'Zbývá' : 'Remaining'}
              </div>
              <div style={{ fontFamily: NM, fontSize: '1rem', color: '#fff', fontWeight: 700, marginTop: 2 }}>
                {remaining} <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', fontWeight: 400 }}>/ {needed}</span>
              </div>
            </div>
          </div>

          {/* Action buttons with UpgradePage pill styling */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Primary button: solid white pill */}
            <button
              onClick={handleUnlimited}
              style={{
                width: '100%', height: 46, borderRadius: 9999, border: 'none', cursor: 'pointer',
                background: '#fff', color: '#000', fontFamily: NM, fontWeight: 700, fontSize: '0.9rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'transform 0.15s, opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {isCzech ? 'Získat Neomezený — 399 Kč / měs →' : 'Go Unlimited — $19.99 / mo →'}
            </button>

            {/* Pro Option (only shown if free) */}
            {!isPro && (
              <button
                onClick={handlePro}
                style={{
                  width: '100%', height: 40, borderRadius: 9999, cursor: 'pointer',
                  background: 'transparent', color: 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  fontFamily: NM, fontWeight: 600, fontSize: '0.85rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; }}
              >
                {isCzech ? 'Přejít na PRO (31 videí) — 199 Kč / měs' : 'Upgrade to PRO (31 videos) — $9.99 / mo'}
              </button>
            )}

            {/* Dismiss text */}
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: NM, fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)',
                padding: '6px 0', marginTop: 2, transition: 'color 0.2s', textAlign: 'center'
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
            >
              {isCzech ? 'Zavřít a pokračovat později' : 'Close and continue later'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
