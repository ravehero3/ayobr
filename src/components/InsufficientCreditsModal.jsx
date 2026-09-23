import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const NM = "'Neue Montreal', 'Inter', sans-serif";
const BLUE = '#3b82f6';
const BLUE2 = '#0ea5e9';

export default function InsufficientCreditsModal({
  needed = 1,
  remaining = 0,
  isPro = false,
  onClose,
  onUpgradePro,
  onUpgradeUnlimited,
}) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isCzech = language === 'cs';

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
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        />

        {/* Modal card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 24 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'relative', zIndex: 1,
            width: '100%', maxWidth: 460,
            background: 'linear-gradient(180deg, rgba(14,14,20,0.98) 0%, rgba(6,10,24,0.98) 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 24,
            padding: '36px 32px 32px',
            boxShadow: '0 40px 100px -20px rgba(0,0,0,0.9), 0 0 50px -10px rgba(59,130,246,0.15)',
            textAlign: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Subtle top ambient glow */}
          <div style={{
            position: 'absolute', top: -50, left: '50%', transform: 'translateX(-50%)',
            width: 260, height: 120, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)',
            pointerEvents: 'none', filter: 'blur(24px)'
          }} />

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 18, right: 18,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '50%', width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
              fontSize: 16, transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          >
            ×
          </button>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 9999, padding: '4px 12px', marginBottom: 18
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
            <span style={{
              fontFamily: NM, fontSize: 10, fontWeight: 900,
              letterSpacing: '0.12em', textTransform: 'uppercase', color: '#f87171'
            }}>
              {isCzech ? 'Nedostatek kreditů' : 'Out of credits'}
            </span>
          </div>

          {/* Heading */}
          <h2 style={{
            fontFamily: NM, fontSize: 24, fontWeight: 900,
            letterSpacing: '-0.03em', color: '#fff', margin: '0 0 10px', lineHeight: 1.2
          }}>
            {isCzech ? 'Vyčerpali jste všechny kredity' : 'You’ve reached your limit'}
          </h2>

          {/* Subtitle / Explanation */}
          <p style={{
            fontFamily: NM, fontSize: 13, color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.6, margin: '0 0 22px'
          }}>
            {isPro
              ? (isCzech
                  ? `Pro tuto akci potřebujete ${needed} ${needed === 1 ? 'kredit' : needed < 5 ? 'kredity' : 'kreditů'}, ale máte k dispozici ${remaining}. Upgradujte na Unlimited pro neomezenou tvorbu.`
                  : `You need ${needed} credit${needed > 1 ? 's' : ''} but only have ${remaining} left. Upgrade to Unlimited for unlimited renders.`
                )
              : (isCzech
                  ? `Pro toto video potřebujete ${needed} ${needed === 1 ? 'kredit' : needed < 5 ? 'kredity' : 'kreditů'}, ale máte k dispozici ${remaining}. Přejděte na vyšší plán a tvořte dál.`
                  : `You need ${needed} credit${needed > 1 ? 's' : ''} but only have ${remaining} left. Upgrade to PRO or Unlimited to keep creating.`
                )
            }
          </p>

          {/* Credit status chip */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '12px 18px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 24
          }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: NM, fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                {isCzech ? 'Stav účtu' : 'Account status'}
              </div>
              <div style={{ fontFamily: NM, fontSize: 12, color: '#fff', fontWeight: 700, marginTop: 2 }}>
                {isPro ? 'Plán PRO (31 kreditů/měs)' : 'Plán FREE (5 kreditů/měs)'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: NM, fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                {isCzech ? 'Zbývá' : 'Remaining'}
              </div>
              <div style={{ fontFamily: NM, fontSize: 14, color: '#ef4444', fontWeight: 900, marginTop: 1 }}>
                {remaining} / {needed} {isCzech ? 'potřebných' : 'needed'}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Primary Upgrade to Unlimited */}
            <button
              onClick={handleUnlimited}
              style={{
                width: '100%', height: 48, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #3b82f6 0%, #0ea5e9 100%)',
                color: '#fff', fontFamily: NM, fontWeight: 900, fontSize: 12, letterSpacing: '0.08em',
                textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 20px rgba(59,130,246,0.35)', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(59,130,246,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(59,130,246,0.35)'; }}
            >
              <span>⚡</span>
              <span>{isCzech ? 'Získat Unlimited — 399 Kč / měs' : 'Get Unlimited — 399 CZK / mo'}</span>
            </button>

            {/* Pro Option (only shown if not already pro) */}
            {!isPro && (
              <button
                onClick={handlePro}
                style={{
                  width: '100%', height: 44, borderRadius: 12,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff', fontFamily: NM, fontWeight: 800, fontSize: 11, letterSpacing: '0.08em',
                  textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
              >
                {isCzech ? 'Plán PRO (31 videí) — 199 Kč / měs' : 'Plan PRO (31 videos) — 199 CZK / mo'}
              </button>
            )}

            {/* Later / dismiss */}
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: NM, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)',
                padding: '8px 0', transition: 'color 0.2s', marginTop: 4
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
            >
              {isCzech ? 'Zavřít a pokračovat později' : 'Close and continue later'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
