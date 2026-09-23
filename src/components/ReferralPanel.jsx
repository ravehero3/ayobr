import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import starsBg from '../assets/stars_background_voodoo808_1778087733997.jpg';

const NM = "'Neue Montreal', 'Inter', sans-serif";

export default function ReferralPanel({ onClose, lang, mockStats }) {
  const { language } = useLanguage();
  const currentLang = lang || language || 'cs';
  const isCzech = currentLang === 'cs';

  const [stats, setStats] = useState(mockStats || null);
  const [loading, setLoading] = useState(!mockStats);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (mockStats) {
      setStats(mockStats);
      setLoading(false);
      return;
    }
    fetch('/api/user/referral', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [mockStats]);

  const referralLink = stats?.code
    ? `${window.location.origin}/?ref=${stats.code}`
    : `${window.location.origin}/?ref=DEMO808`;

  const handleCopy = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
          onClick={onClose}
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
          {/* Ambient glow matching UpgradePage */}
          <div style={{
            position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)',
            width: '120%', height: 220,
            background: 'rgba(59,130,246,0.2)', filter: 'blur(65px)',
            zIndex: 0, pointerEvents: 'none', borderRadius: '50%'
          }} />
          <div style={{
            position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)',
            width: '110%', height: 180,
            backgroundImage: `url(${starsBg})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: 0.4, zIndex: 0, pointerEvents: 'none', borderRadius: '50%',
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

          {/* Header */}
          <div style={{ position: 'relative', zIndex: 1, marginBottom: 20 }}>
            <h2 style={{
              fontFamily: NM, fontSize: '1.4rem', fontWeight: 700,
              color: '#fff', marginBottom: 6, letterSpacing: '-0.03em', lineHeight: 1.2
            }}>
              {isCzech ? 'Pozvěte přátele, získejte kredity' : 'Invite friends, earn credits'}
            </h2>
            <p style={{
              fontFamily: NM, fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)',
              lineHeight: 1.6, margin: 0
            }}>
              {isCzech
                ? 'Sdílejte svůj unikátní odkaz. Za každého kamaráda producenta, který se zaregistruje, získáte oba +1 bonusový kredit zdarma.'
                : 'Share your link. When a fellow producer signs up, you both get +1 free video credit.'}
            </p>
          </div>

          {/* Inner divider */}
          <div style={{ position: 'relative', zIndex: 1, width: '100%', height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 20 }} />

          {/* Body */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : (
              <>
                {/* Referral Link Card */}
                <div style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: 12, padding: '12px 14px', marginBottom: 16
                }}>
                  <div style={{ fontFamily: NM, fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                    {isCzech ? 'Váš doporučovací odkaz' : 'Your referral link'}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#93c5fd', wordBreak: 'break-all' }}>
                    {referralLink}
                  </div>
                </div>

                {/* Primary Button: Solid White Pill */}
                <button
                  onClick={handleCopy}
                  style={{
                    width: '100%', height: 46, borderRadius: 9999, border: 'none', cursor: 'pointer',
                    background: copied ? 'rgba(52,211,153,0.2)' : '#fff',
                    color: copied ? '#34d399' : '#000',
                    border: copied ? '1px solid rgba(52,211,153,0.4)' : 'none',
                    fontFamily: NM, fontWeight: 700, fontSize: '0.9rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    marginBottom: 16, transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!copied) e.currentTarget.style.transform = 'scale(1.02)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  {copied
                    ? (isCzech ? '✓ Odkaz zkopírován do schránky' : '✓ Link copied to clipboard')
                    : (isCzech ? 'Kopírovat odkaz' : 'Copy link')}
                </button>

                {/* Stats box */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <span style={{ fontFamily: NM, fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)' }}>
                    {isCzech ? 'Pozvaných producentů' : 'Friends referred'}
                  </span>
                  <span style={{ fontFamily: NM, fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                    {stats?.uses ?? 0}
                  </span>
                </div>

                {stats?.uses > 0 && (
                  <p style={{
                    textAlign: 'center', fontFamily: NM, fontSize: '0.75rem',
                    color: '#34d399', marginTop: 12, marginBottom: 0
                  }}>
                    {isCzech
                      ? `Získali jste již +${stats.uses} bonusových kreditů!`
                      : `You’ve earned +${stats.uses} bonus credits so far!`}
                  </p>
                )}
              </>
            )}

            {/* Close text button */}
            <button
              onClick={onClose}
              style={{
                width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: NM, fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)',
                padding: '10px 0 0', marginTop: 8, transition: 'color 0.2s', textAlign: 'center'
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
            >
              {isCzech ? 'Zavřít' : 'Close'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
