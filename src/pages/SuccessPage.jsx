import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import LanguageToggle from '../components/LanguageToggle';
import starsBg from '../assets/stars_background_voodoo808_1778087733997.jpg';

const NM = "'Neue Montreal', 'Inter', sans-serif";

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const StarIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const InfinityIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z" />
  </svg>
);

export default function SuccessPage() {
  const { t } = useLanguage();
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan') || 'pro';
  const isUnlimited = plan === 'unlimited';

  useEffect(() => {
    refreshUser();
  }, []);

  const proFeatures = [
    t('success.pro.f1'),
    t('success.pro.f2'),
    t('success.pro.f3'),
    t('success.pro.f4'),
  ];

  const unlimitedFeatures = [
    t('success.unlimited.f1'),
    t('success.unlimited.f2'),
    t('success.unlimited.f3'),
    t('success.unlimited.f4'),
  ];

  const features = isUnlimited ? unlimitedFeatures : proFeatures;

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', fontFamily: NM, display: 'flex', flexDirection: 'column' }}>

      <div style={{ position: 'fixed', inset: 0, backgroundImage: `url(${starsBg})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.18, pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: '100%', maxWidth: 480,
            background: isUnlimited
              ? 'linear-gradient(to bottom, rgba(10,10,14,0.97), rgba(14,14,18,0.97))'
              : 'linear-gradient(to bottom, rgba(1,5,10,0.97), rgba(7,30,87,0.97))',
            border: isUnlimited ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(59,130,246,0.28)',
            borderRadius: 24,
            padding: '48px 40px',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            boxShadow: isUnlimited
              ? '0 40px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)'
              : '0 40px 80px -20px rgba(59,130,246,0.2), 0 0 0 1px rgba(59,130,246,0.06)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>

          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '180%', height: '180%',
            background: isUnlimited
              ? 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 60%)'
              : 'radial-gradient(circle, rgba(59,130,246,0.14) 0%, transparent 60%)',
            pointerEvents: 'none', zIndex: 0,
          }} />

          {isUnlimited && (
            <motion.div
              animate={{ x: ['-110%', '210%'] }}
              transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 5, ease: 'linear' }}
              style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)', transform: 'skewX(-20deg)', zIndex: 2, pointerEvents: 'none' }}
            />
          )}

          <div style={{ position: 'relative', zIndex: 3 }}>

            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, duration: 0.55, type: 'spring', stiffness: 240, damping: 20 }}
              style={{
                width: 76, height: 76, borderRadius: '50%',
                background: isUnlimited ? 'rgba(255,255,255,0.07)' : 'rgba(59,130,246,0.12)',
                border: isUnlimited ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(59,130,246,0.28)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 32px',
                color: isUnlimited ? 'rgba(255,255,255,0.85)' : '#60a5fa',
              }}>
              {isUnlimited ? <InfinityIcon /> : <StarIcon />}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 14 }}>
              {t(isUnlimited ? 'success.title.unlimited' : 'success.title.pro')}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.92rem', lineHeight: 1.7, marginBottom: 36 }}>
              {t(isUnlimited ? 'success.subtitle.unlimited' : 'success.subtitle.pro')}
            </motion.p>

            <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 28 }} />

            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.48, duration: 0.4 }}
              style={{ listStyle: 'none', padding: 0, margin: '0 0 36px', display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
              {features.map((f, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.52 + i * 0.07, duration: 0.35 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: NM, fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                  <span style={{ color: isUnlimited ? 'rgba(255,255,255,0.55)' : '#60a5fa', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <CheckIcon />
                  </span>
                  {f}
                </motion.li>
              ))}
            </motion.ul>

            <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 28 }} />

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              onClick={() => navigate('/app')}
              style={{
                width: '100%', height: 48, borderRadius: 9999,
                background: '#fff', color: '#000', border: 'none',
                fontFamily: NM, fontWeight: 700, fontSize: '0.9rem',
                cursor: 'pointer', letterSpacing: '-0.01em',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,255,255,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}>
              {t('success.cta')}
            </motion.button>

          </div>
        </motion.div>
      </div>

      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '20px 32px',
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgba(0,0,0,0.6)',
        position: 'relative', zIndex: 1,
      }}>
        <LanguageToggle />
      </div>
    </div>
  );
}
