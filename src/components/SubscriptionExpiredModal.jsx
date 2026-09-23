import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const NM = "'Neue Montreal', 'Inter', sans-serif";

// Animated orbital ring decoration
function OrbitalRing({ size, opacity, duration, delay }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none'
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration, repeat: Infinity, ease: 'linear', delay }}
        style={{
          width: size, height: size, borderRadius: '50%',
          border: `1px solid rgba(59,130,246,${opacity})`,
          flexShrink: 0
        }}
      />
    </div>
  );
}

/**
 * SubscriptionExpiredModal
 *
 * Shows when a paid user's subscription period has expired.
 * Fully in Czech, matches the TypeBeatz design aesthetic.
 *
 * Props:
 *  - user: the current auth user object (must have .role, .first_name, .subscription)
 *  - onDismiss: optional callback to temporarily dismiss (snooze)
 */
export default function SubscriptionExpiredModal({ user, onDismiss }) {
  const navigate = useNavigate();
  const overlayRef = useRef(null);

  const firstName = user?.first_name || '';
  const planLabel = user?.subscription?.plan === 'unlimited' ? 'Neomezený' : 'Pro';
  const expiredDate = user?.subscription?.current_period_end
    ? new Date(user.subscription.current_period_end)
    : null;
  const expiredLabel = expiredDate
    ? expiredDate.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  // Block scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        key="sub-expired-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        ref={overlayRef}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        }}
      >
        {/* Background ambient glow */}
        <div style={{
          position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none'
        }}>
          <div style={{
            position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
            width: 600, height: 600, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
            filter: 'blur(40px)'
          }} />
          <div style={{
            position: 'absolute', bottom: '10%', left: '30%',
            width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
            filter: 'blur(60px)'
          }} />
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'relative', width: '100%', maxWidth: 500,
            background: 'linear-gradient(135deg, rgba(8,10,20,0.98) 0%, rgba(4,14,50,0.96) 100%)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 24,
            padding: '44px 40px 36px',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 40px 80px -20px rgba(0,0,20,0.9), 0 0 80px -20px rgba(59,130,246,0.12)',
            overflow: 'hidden',
          }}
        >
          {/* Subtle orbital rings decoration behind card content */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 24, pointerEvents: 'none' }}>
            <OrbitalRing size={280} opacity={0.06} duration={22} delay={0} />
            <OrbitalRing size={380} opacity={0.04} duration={35} delay={3} />
          </div>

          {/* Top icon */}
          <div style={{
            position: 'relative', zIndex: 1,
            display: 'flex', justifyContent: 'center', marginBottom: 28
          }}>
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))',
                border: '1px solid rgba(59,130,246,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 30px rgba(59,130,246,0.15)',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(147,197,253,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </motion.div>
          </div>

          {/* Headline */}
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginBottom: 20 }}>
            <h2 style={{
              fontFamily: NM, fontSize: '1.55rem', fontWeight: 800,
              color: '#fff', letterSpacing: '-0.04em', marginBottom: 10, lineHeight: 1.2
            }}>
              {firstName ? `${firstName}, tvoje předplatné` : 'Tvoje předplatné'}{' '}
              <span style={{
                background: 'linear-gradient(90deg, #60a5fa, #a78bfa)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>
                vypršelo
              </span>
            </h2>
            <p style={{
              fontFamily: NM, fontSize: '0.9rem', color: 'rgba(255,255,255,0.45)',
              lineHeight: 1.65, maxWidth: 380, margin: '0 auto'
            }}>
              Tvůj plán <strong style={{ color: 'rgba(255,255,255,0.7)' }}>TypeBeatz {planLabel}</strong>
              {expiredLabel ? (
                <> skončil dne <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{expiredLabel}</strong>.</>
              ) : ' již není aktivní.'}
              {' '}Pro pokračování ve tvorbě videí obnov své předplatné.
            </p>
          </div>

          {/* Info box */}
          <div style={{
            position: 'relative', zIndex: 1,
            background: 'rgba(59,130,246,0.06)',
            border: '1px solid rgba(59,130,246,0.15)',
            borderRadius: 12, padding: '14px 18px',
            marginBottom: 28,
          }}>
            <ul style={{
              listStyle: 'none', margin: 0, padding: 0,
              display: 'flex', flexDirection: 'column', gap: 8
            }}>
              {[
                'Tvá existující videa a nastavení jsou v bezpečí',
                'Po obnovení okamžitě znovu získáš plný přístup',
                'Nové předplatné bude automaticky obnovováno každý měsíc',
                'Kdykoli lze zrušit bez poplatků',
              ].map((item, i) => (
                <li key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  fontFamily: NM, fontSize: '0.83rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA buttons */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/upgrade')}
              style={{
                width: '100%', padding: '14px 24px', borderRadius: 12,
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                border: 'none', cursor: 'pointer',
                fontFamily: NM, fontSize: '0.9rem', fontWeight: 800,
                letterSpacing: '0.02em', color: '#fff',
                boxShadow: '0 4px 24px rgba(59,130,246,0.35)',
                transition: 'box-shadow 0.2s',
              }}
            >
              Obnovit předplatné
            </motion.button>

            {onDismiss && (
              <button
                onClick={onDismiss}
                style={{
                  width: '100%', padding: '12px 24px', borderRadius: 12,
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                  fontFamily: NM, fontSize: '0.83rem', fontWeight: 500,
                  color: 'rgba(255,255,255,0.3)',
                  transition: 'color 0.2s, border-color 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              >
                Připomenout mi za hodinu
              </button>
            )}
          </div>

          {/* Fine print */}
          <p style={{
            position: 'relative', zIndex: 1,
            textAlign: 'center', marginTop: 20,
            fontFamily: NM, fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)',
            lineHeight: 1.6
          }}>
            Předplatné TypeBeatz • 229 Kč / měsíc (Pro) nebo 429 Kč / měsíc (Neomezený)
            <br />Bezpečná platba přes GoPay
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
