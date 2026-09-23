import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import starsBg from '../assets/stars_background_voodoo808_1778087733997.jpg';

const NM = "'Neue Montreal', 'Inter', sans-serif";

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function SubscriptionExpiredModal({ user, onDismiss, lang }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const currentLang = lang || language || 'cs';
  const isCzech = currentLang === 'cs';

  const firstName = user?.first_name || '';
  const plan = user?.subscription?.plan || user?.role || 'pro';
  const isAnnual = user?.subscription?.is_annual;
  const isUnlimited = plan === 'unlimited';
  const planLabel = isUnlimited
    ? (isCzech ? 'Neomezený' : 'Unlimited')
    : 'Pro';

  const expiredDate = user?.subscription?.current_period_end
    ? new Date(user.subscription.current_period_end)
    : null;
  const expiredLabel = expiredDate
    ? expiredDate.toLocaleDateString(isCzech ? 'cs-CZ' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  // Derive prices
  const priceDisplay = (() => {
    if (isCzech) {
      if (isAnnual) {
        return isUnlimited ? '3 588 Kč' : '1 788 Kč';
      }
      return isUnlimited ? '399 Kč' : '199 Kč';
    } else {
      if (isAnnual) {
        return isUnlimited ? '$179.99' : '$89.99';
      }
      return isUnlimited ? '$19.99' : '$9.99';
    }
  })();

  const periodLabel = isAnnual
    ? (isCzech ? '/ rok' : '/ year')
    : (isCzech ? '/ měsíc' : '/ month');

  const subPriceNote = isAnnual
    ? (isCzech ? '(úspora až 3 měsíce zdarma)' : '(save up to 3 months free)')
    : (isCzech ? 'obnova každý měsíc' : 'billed monthly');

  // Block scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const features = isCzech
    ? [
        'Všechna existující videa a nastavení zůstávají zachována',
        'Okamžitý plný přístup k hromadnému generátoru ihned po obnově',
        isAnnual
          ? 'Roční plán — žádné měsíční upomínky, automatická obnova za rok'
          : 'Předplatné lze kdykoli zrušit jedním kliknutím bez poplatků',
      ]
    : [
        'All your existing videos and presets are completely safe',
        'Immediate full access to the batch generator upon renewal',
        isAnnual
          ? 'Annual plan — no monthly prompts, automatic renewal next year'
          : 'Cancel anytime with one click, no hidden fees',
      ];

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16
      }}>
        {/* Backdrop blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDismiss}
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'relative', zIndex: 1, width: '100%', maxWidth: 460,
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
            width: '120%', height: 260,
            background: 'rgba(59,130,246,0.22)',
            filter: 'blur(70px)',
            zIndex: 0, pointerEvents: 'none', borderRadius: '50%'
          }} />
          <div style={{
            position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)',
            width: '110%', height: 220,
            backgroundImage: `url(${starsBg})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: 0.45, zIndex: 0, pointerEvents: 'none', borderRadius: '50%',
            maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 20%, transparent 65%)',
            WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,1) 20%, transparent 65%)'
          }} />

          {/* Close button */}
          {onDismiss && (
            <button
              onClick={onDismiss}
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
          )}

          {/* Header */}
          <div style={{ position: 'relative', zIndex: 1, marginBottom: 20 }}>
            <h2 style={{
              fontFamily: NM, fontSize: '1.4rem', fontWeight: 700,
              color: '#fff', marginBottom: 6, letterSpacing: '-0.03em', lineHeight: 1.2
            }}>
              {isCzech
                ? (firstName ? `${firstName}, vaše předplatné vypršelo` : 'Vaše předplatné vypršelo')
                : (firstName ? `${firstName}, your subscription has expired` : 'Your subscription has expired')}
            </h2>
            <p style={{
              fontFamily: NM, fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)',
              lineHeight: 1.6, margin: 0
            }}>
              {isCzech
                ? `Plán TypeBeatz ${planLabel}${expiredLabel ? ` skončil dne ${expiredLabel}` : ' není aktivní'}. Pro pokračování ve tvorbě videí obnovte své předplatné.`
                : `Your TypeBeatz ${planLabel} plan${expiredLabel ? ` ended on ${expiredLabel}` : ' is inactive'}. Renew to continue rendering high-resolution videos.`}
            </p>
          </div>

          {/* Inner divider */}
          <div style={{ position: 'relative', zIndex: 1, width: '100%', height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 20 }} />

          {/* Price display matching UpgradePage */}
          <div style={{ position: 'relative', zIndex: 1, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: NM, fontWeight: 600, fontSize: '2rem', letterSpacing: '-0.03em', color: '#fff' }}>
                {priceDisplay}
              </span>
              <span style={{ fontFamily: NM, fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
                {periodLabel}
              </span>
              <span style={{ fontFamily: NM, fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>
                {subPriceNote}
              </span>
            </div>
          </div>

          {/* Features list matching UpgradePage */}
          <ul style={{
            position: 'relative', zIndex: 1,
            listStyle: 'none', padding: 0, margin: '0 0 28px',
            display: 'flex', flexDirection: 'column', gap: 12
          }}>
            {features.map((text, i) => (
              <li key={i} style={{
                fontFamily: NM, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)',
                lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: 10
              }}>
                <span style={{ color: '#fff', display: 'flex', alignItems: 'center', flexShrink: 0, marginTop: 2 }}>
                  <CheckIcon />
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ul>

          {/* Action buttons matching UpgradePage pill styling */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Primary button: solid white pill */}
            <button
              onClick={() => navigate('/upgrade')}
              style={{
                width: '100%', height: 46, borderRadius: 9999, border: 'none', cursor: 'pointer',
                background: '#fff', color: '#000', fontFamily: NM, fontWeight: 700, fontSize: '0.9rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'transform 0.15s, opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {isCzech ? 'Obnovit předplatné →' : 'Renew subscription →'}
            </button>

            {/* Secondary button: subtle ghost pill */}
            {onDismiss && (
              <button
                onClick={onDismiss}
                style={{
                  width: '100%', height: 40, borderRadius: 9999, cursor: 'pointer',
                  background: 'transparent', color: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  fontFamily: NM, fontWeight: 600, fontSize: '0.82rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
              >
                {isCzech ? 'Připomenout za 1 hodinu' : 'Remind me in 1 hour'}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
