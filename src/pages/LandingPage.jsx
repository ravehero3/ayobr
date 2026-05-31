import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import LanguageToggle from '../components/LanguageToggle';
import { useLanguage } from '../context/LanguageContext';
import typebeatLogo from '../assets/typebeatz logo 2 white version_1754509091303.png';
import alienLogo from '../assets/alien_logo_1780252226447.png';
import starsBg from '../assets/stars_background_voodoo808_1778087733997.jpg';
import screenshotUpload from '../assets/screenshot_upload_new.jpg';
import screenshotReview from '../assets/screenshot_review_new.jpg';
import screenshotGenerate from '../assets/screenshot_generate_new.jpg';
import screenshotDownload from '../assets/screenshot_download.png';

const NM     = "'Neue Montreal', 'Inter', sans-serif"; // legacy — prefer IV or GT_W
const IV     = '"Inter Variable", "Inter Variable Placeholder", sans-serif';
const GT_W   = '"GT Walsheim Framer Medium", "GT Walsheim Framer Medium Placeholder", sans-serif';
const SCRIPT = "'Satisfy', cursive";
const BTN_BG  = '#ffffff';
const BTN_GLOW = '0 0 40px rgba(255,255,255,0.15)';

const LH_BODY  = 1.6;
const LH_LABEL = 'normal';
const LH_HEAD  = 1.05;

const PARTICLE_CSS = `
@keyframes particleFloat {
  0%   { opacity: 0; transform: translate(0, 0) scale(0); }
  15%  { opacity: 1; transform: translate(var(--dx), -6px) scale(1); }
  100% { opacity: 0; transform: translate(var(--dx), -32px) scale(0.4); }
}
`;

function ParticleButton({ onClick, children, style, className }) {
  const [particles, setParticles] = useState([]);
  const [hovered, setHovered] = useState(false);
  const idRef = useRef(0);
  const intervalRef = useRef(null);

  const spawn = () => {
    const id = idRef.current++;
    const dur = 700 + Math.random() * 700;
    const dx = (Math.random() - 0.5) * 50;
    setParticles(p => [...p, { id, left: 5 + Math.random() * 90, top: 5 + Math.random() * 90, size: 1.5 + Math.random() * 2.5, dur, dx }]);
    setTimeout(() => setParticles(p => p.filter(x => x.id !== id)), dur);
  };

  useEffect(() => {
    if (hovered) { spawn(); intervalRef.current = setInterval(spawn, 130); }
    else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [hovered]);

  return (
    <>
      <style>{PARTICLE_CSS}</style>
      <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        className={className} style={{ ...style, position: 'relative', overflow: 'visible' }}>
        {particles.map(p => (
          <span key={p.id} style={{
            position: 'absolute', left: `${p.left}%`, top: `${p.top}%`,
            width: p.size, height: p.size, borderRadius: '50%',
            background: 'rgba(255,255,255,0.95)', pointerEvents: 'none',
            boxShadow: '0 0 5px rgba(255,255,255,0.7)',
            animation: `particleFloat ${p.dur}ms ease-out forwards`,
            '--dx': `${p.dx}px`, zIndex: 20,
          }} />
        ))}
        <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
      </button>
    </>
  );
}

function Stat({ prefix, val, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <div style={{
        fontFamily: IV, fontSize: '0.72rem', fontWeight: 500,
        color: 'rgba(255,255,255,0.38)', lineHeight: LH_LABEL, letterSpacing: '0.04em',
        marginBottom: 4, visibility: prefix ? 'visible' : 'hidden', userSelect: 'none',
      }}>
        {prefix ?? 'up to'}
      </div>
      <WordReveal text={val} style={{
        fontFamily: GT_W, fontWeight: 500, fontSize: 'clamp(1.9rem, 3vw, 2.6rem)',
        lineHeight: 1, letterSpacing: '-0.04em', color: '#fff', display: 'block',
      }} />
      <WordReveal text={label} style={{
        fontFamily: IV, fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)',
        marginTop: 5, letterSpacing: '0.02em', lineHeight: LH_LABEL, display: 'block',
      }} />
    </div>
  );
}

function WordReveal({ text, style, className }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const words = String(text).split(' ');
  return (
    <span ref={ref} className={className} style={style}>
      {words.map((word, i) => (
        <span key={i} style={{
          display: 'inline-block',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(10px)',
          transition: `opacity 0.5s ease ${i * 60}ms, transform 0.5s ease ${i * 60}ms`,
          marginRight: i < words.length - 1 ? '0.2em' : 0,
        }}>
          {word}
        </span>
      ))}
    </span>
  );
}

/* Blur-to-focus reveal triggered by IntersectionObserver.
   minScroll: if set, the reveal will only fire once window.scrollY >= minScroll */
function BlurReveal({ children, delay = 0, style = {}, minScroll = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const intersecting = useRef(false);
  const revealed = useRef(false);

  useEffect(() => {
    const tryReveal = () => {
      if (revealed.current) return;
      if (intersecting.current && window.scrollY >= minScroll) {
        revealed.current = true;
        setVisible(true);
      }
    };

    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      intersecting.current = entry.isIntersecting;
      if (entry.isIntersecting) tryReveal();
    }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
    obs.observe(el);

    let rafId = null;
    const onScroll = () => {
      if (revealed.current) { window.removeEventListener('scroll', onScroll); return; }
      if (!rafId) rafId = requestAnimationFrame(() => { rafId = null; tryReveal(); });
    };
    if (minScroll > 0) window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      obs.disconnect();
      window.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [minScroll]);

  return (
    <div ref={ref} style={{
      filter:     visible ? 'blur(0px)'   : 'blur(12px)',
      opacity:    visible ? 1             : 0,
      transition: `filter 0.9s ease-out ${delay}ms, opacity 0.9s ease-out ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  );
}

/* Pricing Section — Framer-style minimal dark cards */
const PricingIcons = {
  Video: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>,
  Infinity: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z"/></svg>,
  Calendar: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
  Star: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>,
  Image: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>,
  Monitor: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>,
  Cancel: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>,
  Present: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>
};

function PricingSection({ handleCTA, handleUpgradeCTA, handleUnlimitedCTA, user, isMobile }) {
  const [isAnnual, setIsAnnual] = useState(true);
  const { t } = useLanguage();
  const isPro = user?.role === 'pro' || user?.role === 'admin';

  const plans = [
    {
      name: t('landing.pricing.free.name'),
      price: t('landing.pricing.free.price'),
      period: t('landing.pricing.period'),
      desc: t('landing.pricing.free.desc'),
      features: [
        { text: t('landing.pricing.free.f1'), icon: PricingIcons.Video },
        { text: t('landing.pricing.free.f2'), icon: PricingIcons.Present },
        { text: t('landing.pricing.free.f3'), icon: PricingIcons.Star },
        { text: t('landing.pricing.free.f4'), icon: PricingIcons.Image },
        { text: t('landing.pricing.free.f5'), icon: PricingIcons.Monitor },
      ],
      cta: user ? t('landing.pricing.free.cta.current') : t('landing.pricing.free.cta'),
      onCta: handleCTA,
      highlight: false,
      ctaStyle: 'ghost',
      hasToggle: false,
    },
    {
      name: t('landing.pricing.pro.name'),
      price: isAnnual ? t('landing.pricing.pro.price.annual') : t('landing.pricing.pro.price.monthly'),
      period: t('landing.pricing.period'),
      desc: t('landing.pricing.pro.desc'),
      features: [
        { text: t('landing.pricing.pro.f1'), icon: PricingIcons.Video },
        { text: t('landing.pricing.pro.f2'), icon: PricingIcons.Monitor },
        { text: t('landing.pricing.pro.f3'), icon: PricingIcons.Image },
        { text: t('landing.pricing.pro.f4'), icon: PricingIcons.Star },
        { text: t('landing.pricing.pro.f5'), icon: PricingIcons.Cancel },
        ...(isAnnual ? [{ text: t('landing.pricing.pro.f6.annual'), icon: PricingIcons.Present }] : []),
      ],
      annualSavings: t('landing.pricing.pro.savings.annual'),
      cta: isPro ? t('landing.pricing.pro.cta.current') : t('landing.pricing.pro.cta'),
      onCta: () => handleUpgradeCTA(isAnnual ? 'yearly' : 'monthly'),
      highlight: true,
      ctaStyle: 'solid',
      hasToggle: true,
    },
    {
      name: t('landing.pricing.unlimited.name'),
      price: isAnnual ? t('landing.pricing.unlimited.price.annual') : t('landing.pricing.unlimited.price.monthly'),
      period: t('landing.pricing.period'),
      desc: t('landing.pricing.unlimited.desc'),
      features: [
        { text: t('landing.pricing.unlimited.f1'), icon: PricingIcons.Infinity },
        { text: t('landing.pricing.unlimited.f2'), icon: PricingIcons.Monitor },
        { text: t('landing.pricing.unlimited.f3'), icon: PricingIcons.Image },
        { text: t('landing.pricing.unlimited.f4'), icon: PricingIcons.Star },
        { text: t('landing.pricing.unlimited.f5'), icon: PricingIcons.Cancel },
        ...(isAnnual ? [{ text: t('landing.pricing.unlimited.f6.annual'), icon: PricingIcons.Present }] : []),
      ],
      annualSavings: t('landing.pricing.unlimited.savings.annual'),
      cta: t('landing.pricing.unlimited.cta'),
      onCta: () => handleUnlimitedCTA(isAnnual ? 'yearly' : 'monthly'),
      highlight: false,
      topTier: true,
      ctaStyle: 'ghost',
      hasToggle: true,
    },
  ];

  return (
    <section id="pricing" style={{ padding: isMobile ? '80px 0 100px' : '120px 0 140px', background: '#000' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', paddingLeft: isMobile ? '1.5rem' : 64, paddingRight: isMobile ? '1.5rem' : 64 }}>

        {/* Heading */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 80 }}>
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <h2 style={{
              fontFamily: '"GT Walsheim Framer Medium", "GT Walsheim Framer Medium Placeholder", sans-serif', fontWeight: 500,
              fontSize: 'clamp(3rem, 6vw, 4.5rem)',
              lineHeight: LH_HEAD, letterSpacing: '-0.04em',
              color: '#fff', marginBottom: 16,
            }}>
              {t('landing.pricing.title')}
            </h2>
            <p style={{ fontFamily: IV, fontSize: '1.2rem', lineHeight: LH_BODY, color: 'rgba(255,255,255,0.4)', maxWidth: 460, margin: '0 auto' }}>
              {t('landing.pricing.subtitle').split('\n').map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}
            </p>
          </motion.div>
        </div>

        {/* Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 394px)',
          gap: 32,
          alignItems: 'stretch',
          justifyContent: 'center',
        }}>
          {plans.map((plan, idx) => (
            <div key={plan.name} style={{ position: 'relative' }}>
              {/* Background blue glow for the highlighted card */}
              {plan.highlight && (
                <>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '120%',
                    height: '120%',
                    background: 'rgba(59,130,246,0.3)',
                    filter: 'blur(90px)',
                    zIndex: 0,
                    pointerEvents: 'none',
                    borderRadius: '50%'
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '120%',
                    height: '120%',
                    backgroundImage: `url(${starsBg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center calc(50% - 200px)',
                    opacity: 0.8,
                    zIndex: 0,
                    pointerEvents: 'none',
                    borderRadius: '50%',
                    maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 20%, transparent 65%)',
                    WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,1) 20%, transparent 65%)',
                  }} />
                </>
              )}
              {plan.topTier && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '130%',
                  height: '130%',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
                  filter: 'blur(60px)',
                  zIndex: 0,
                  pointerEvents: 'none',
                }} />
              )}
              <motion.div
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: idx * 0.1 }}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  borderRadius: 16,
                  padding: '32px 28px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  background: plan.highlight 
                    ? 'linear-gradient(to bottom, rgba(1,5,10,0.8), rgba(7,30,87,0.8))' 
                    : plan.topTier 
                      ? 'rgba(0,0,0,0.85)' 
                      : '#0a0a0a',
                  backdropFilter: 'blur(32px)',
                  WebkitBackdropFilter: 'blur(32px)',
                  border: plan.topTier ? '1px solid rgba(255,255,255,0.25)' : '1px solid #333',
                  boxShadow: plan.highlight
                    ? '0 30px 60px -12px rgba(0,0,0,0.6)'
                    : plan.topTier
                      ? '0 20px 50px -10px rgba(255,255,255,0.08)'
                      : '0 10px 30px -10px rgba(0,0,0,0.3)',
                  height: isMobile ? 'auto' : 536,
                  overflow: 'hidden'
                }}
              >
                {/* Plan name + Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, minHeight: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '24px',
                    fontWeight: 400,
                    lineHeight: '28.8px',
                    letterSpacing: '-0.01px',
                    color: '#ffffff',
                    fontStyle: 'normal',
                    textTransform: 'none',
                  }}>
                    {plan.name}
                  </span>
                </div>

                {/* Small Toggle for PRO and Unlimited */}
                {plan.hasToggle && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: IV, fontSize: '0.55rem', color: 'rgba(255,255,255,0.35)', fontWeight: 500, letterSpacing: '0.04em', cursor: 'pointer' }} onClick={() => setIsAnnual(!isAnnual)}>{t('landing.pricing.toggle.annual')}</span>
                    <button 
                      onClick={() => setIsAnnual(!isAnnual)}
                      style={{
                        width: 26, height: 14, borderRadius: 99, background: isAnnual ? '#3B82F6' : 'rgba(255,255,255,0.1)',
                        position: 'relative', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', padding: 0,
                        transition: 'background 0.3s ease'
                      }}
                    >
                      <motion.div 
                        animate={{ x: isAnnual ? 12 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        style={{
                          width: 10, height: 10, borderRadius: '50%', background: '#fff',
                          position: 'absolute', top: 1, left: 1,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                        }}
                      />
                    </button>
                  </div>
                )}
              </div>

              {/* Description */}
              <p style={{
                fontFamily: IV, fontSize: '0.82rem',
                color: 'rgba(255,255,255,0.32)',
                lineHeight: LH_BODY, marginBottom: 24,
              }}>
                {plan.desc}
              </p>

              {/* Top Divider */}
              <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 16 }} />

              {/* Price */}
              <div style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline' }}>
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={plan.price}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        fontFamily: IV, fontWeight: 600,
                        fontSize: '2rem', lineHeight: 1,
                        letterSpacing: '-0.03em', color: '#fff',
                        display: 'inline-block'
                      }}
                    >
                      {plan.price}
                    </motion.span>
                  </AnimatePresence>
                  <span style={{
                    fontFamily: IV, fontWeight: 400, fontSize: '0.85rem',
                    color: 'rgba(255,255,255,0.3)', marginLeft: 4,
                  }}>
                    {plan.period}
                  </span>
                </div>
              </div>

              {/* Bottom Divider */}
              <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 24, marginTop: 16 }} />

              {/* Feature list */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                {plan.features.map((f, i) => (
                  <li key={i} style={{
                    fontFamily: IV, fontSize: '0.85rem',
                    color: 'rgba(255,255,255,0.55)',
                    lineHeight: LH_BODY,
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <span style={{ color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {f.icon}
                    </span>
                    {f.text}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {plan.ctaStyle === 'solid' ? (
                <ParticleButton
                  onClick={plan.onCta}
                  className="transition-all duration-200 hover:scale-105 flex items-center justify-center"
                  style={{
                    fontFamily: IV, fontWeight: 600, fontSize: '0.85rem',
                    lineHeight: LH_LABEL, padding: '0 16px', height: 34, width: '100%',
                    borderRadius: 9999, cursor: 'pointer', outline: 'none',
                    background: plan.highlight ? '#ffffff' : '#1a1a1a', color: plan.highlight ? '#000000' : '#ffffff', border: 'none'
                  }}
                >
                  {plan.cta}
                </ParticleButton>
              ) : (
                <button
                  onClick={plan.onCta}
                  style={{
                    fontFamily: IV, fontWeight: 600, fontSize: '0.85rem',
                    lineHeight: LH_LABEL, padding: '0 16px', height: 34, width: '100%',
                    borderRadius: 9999, cursor: 'pointer', outline: 'none',
                    transition: 'opacity 0.2s ease',
                    background: 'transparent', color: 'rgba(255,255,255,0.65)',
                    border: '1px solid rgba(255,255,255,0.14)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  {plan.cta}
                </button>
              )}
            </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* How It Works — title scrolls away, two-column panel pins while stepping through chapters */
const NAV_H           = 60;
const HOW_SCROLL_STEP = 1600;
const CHAPTER_NAV_LEFT = 242;
const CHAPTER_NAV_W   = 320;
const CARD_GAP        = 100;
const CARD_LEFT       = CHAPTER_NAV_LEFT + CHAPTER_NAV_W + CARD_GAP;
const CARD_W_CSS      = `calc(100vw - ${CARD_LEFT}px)`;

/* ── Safari-style browser chrome ── */
/* dark=true → card 4 (Download) uses #0d0d0d bar + #1a1a1a pill */
function SafariChrome({ dark = false, onShare }) {
  const sys   = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  const barBg  = dark ? '#0d0d0d' : '#0c0c0c';
  const pillBg = dark ? '#1a1a1a' : '#151515';
  const border = dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.65)';
  return (
    <div style={{ width: '100%', flexShrink: 0 }}>
      <div style={{
        height: 52,
        background: barBg,
        borderBottom: border,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 0,
      }}>
        {/* Traffic lights */}
        <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexShrink: 0 }}>
          {[['#ff5f57','#e0443e'],['#ffbd2e','#dea123'],['#28c840','#1aab29']].map(([bg, shadow], ci) => (
            <div key={ci} style={{
              width: 12, height: 12, borderRadius: '50%', background: bg, flexShrink: 0,
              boxShadow: `inset 0 -0.5px 0 ${shadow}`,
            }} />
          ))}
        </div>

        {/* URL pill */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', margin: '0 16px' }}>
          <div style={{
            height: 30, width: '100%', maxWidth: 400,
            background: pillBg, borderRadius: 9999,
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 14px',
          }}>
            <span style={{ color: 'rgba(255,255,255,0.68)', fontSize: 12.5, fontFamily: sys, letterSpacing: '-0.01em', userSelect: 'none' }}>
              typebeatz.voodoo808.com
            </span>
          </div>
        </div>

        {/* Share button only */}
        <div style={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          <button onClick={onShare} style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.32)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.32)'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Share Modal ── */
function ShareModal({ onClose }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [generating, setGenerating] = useState(true);

  useEffect(() => {
    generateStoryImage();
  }, []);

  async function generateStoryImage() {
    setGenerating(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');

      // Draw stars background (cover-fill)
      const bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';
      await new Promise((res) => { bgImg.onload = res; bgImg.onerror = res; bgImg.src = starsBg; });
      const scale = Math.max(1080 / bgImg.width, 1920 / bgImg.height);
      const sw = bgImg.width * scale, sh = bgImg.height * scale;
      ctx.drawImage(bgImg, (1080 - sw) / 2, (1920 - sh) / 2, sw, sh);

      // Vignette — fade to black on all edges
      const radGrad = ctx.createRadialGradient(540, 960, 280, 540, 960, 1050);
      radGrad.addColorStop(0, 'rgba(0,0,0,0)');
      radGrad.addColorStop(1, 'rgba(0,0,0,0.92)');
      ctx.fillStyle = radGrad; ctx.fillRect(0, 0, 1080, 1920);

      const tg = ctx.createLinearGradient(0, 0, 0, 480);
      tg.addColorStop(0, 'rgba(0,0,0,0.9)'); tg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = tg; ctx.fillRect(0, 0, 1080, 480);

      const bg2 = ctx.createLinearGradient(0, 1440, 0, 1920);
      bg2.addColorStop(0, 'rgba(0,0,0,0)'); bg2.addColorStop(1, 'rgba(0,0,0,0.9)');
      ctx.fillStyle = bg2; ctx.fillRect(0, 1440, 1080, 480);

      const lg = ctx.createLinearGradient(0, 0, 320, 0);
      lg.addColorStop(0, 'rgba(0,0,0,0.75)'); lg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = lg; ctx.fillRect(0, 0, 320, 1920);

      const rg = ctx.createLinearGradient(760, 0, 1080, 0);
      rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(0,0,0,0.75)');
      ctx.fillStyle = rg; ctx.fillRect(760, 0, 320, 1920);

      // Logo — alien app icon
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      await new Promise((res) => { logoImg.onload = res; logoImg.onerror = res; logoImg.src = alienLogo; });

      const logoSize = 320;
      const logoX = (1080 - logoSize) / 2;
      const logoY = (1920 - logoSize) / 2 + 20;

      // "I ❤" text — same width as logo, above it
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#ffffff';
      // Scale font so text spans logoSize width
      ctx.font = `bold 140px 'GT Walsheim Framer Medium', 'Arial Black', sans-serif`;
      const measured = ctx.measureText('I \u2764');
      const targetFontSize = Math.floor(140 * (logoSize / measured.width));
      ctx.font = `bold ${Math.min(targetFontSize, 160)}px 'GT Walsheim Framer Medium', 'Arial Black', sans-serif`;
      ctx.fillText('I \u2764', 540, logoY - 36);

      ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);

      setPreviewUrl(canvas.toDataURL('image/png'));
    } catch (e) {
      console.error('Story generation failed:', e);
    }
    setGenerating(false);
  }

  async function handleInstagramShare() {
    if (!previewUrl) return;
    try {
      const res = await fetch(previewUrl);
      const blob = await res.blob();
      const file = new File([blob], 'typebeatz-story.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'TypeBeatz' });
      } else {
        const a = document.createElement('a');
        a.href = previewUrl; a.download = 'typebeatz-story.png'; a.click();
      }
    } catch (e) {
      if (e.name !== 'AbortError') console.error(e);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      onClick={onClose}>
      <div style={{
        background: 'linear-gradient(to bottom, rgba(8,8,12,0.98), rgba(4,14,50,0.98))',
        border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20,
        padding: '32px 28px', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.8)',
        backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
        width: '90%', maxWidth: 340, position: 'relative',
      }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}>x</button>
        <h3 style={{ fontFamily: IV, fontWeight: 700, fontSize: '1.05rem', color: '#fff', margin: '0 0 6px' }}>Share TypeBeatz</h3>
        <p style={{ fontFamily: IV, fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', margin: '0 0 20px' }}>Post a story to your Instagram</p>

        {/* Story preview */}
        <div style={{ width: '100%', aspectRatio: '9/16', borderRadius: 10, background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', maxHeight: 220 }}>
          {generating ? (
            <span style={{ color: 'rgba(255,255,255,0.25)', fontFamily: IV, fontSize: '0.75rem' }}>Generating preview…</span>
          ) : previewUrl ? (
            <img src={previewUrl} alt="Story preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ color: 'rgba(255,255,255,0.25)', fontFamily: IV, fontSize: '0.75rem' }}>Preview unavailable</span>
          )}
        </div>

        {/* Instagram Stories button */}
        <button onClick={handleInstagramShare} disabled={!previewUrl || generating}
          style={{
            width: '100%', padding: '11px 0', borderRadius: 10, border: 'none',
            cursor: (previewUrl && !generating) ? 'pointer' : 'not-allowed',
            background: (previewUrl && !generating) ? 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)' : 'rgba(255,255,255,0.06)',
            color: '#fff', fontFamily: IV, fontWeight: 600, fontSize: '0.82rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: (previewUrl && !generating) ? 1 : 0.45, transition: 'opacity 0.2s',
          }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
          Instagram Stories
        </button>

        <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.07)', margin: '14px 0' }} />
        <button onClick={() => { if (previewUrl) { const a = document.createElement('a'); a.href = previewUrl; a.download = 'typebeatz-story.png'; a.click(); } }}
          disabled={!previewUrl || generating}
          style={{ width: '100%', padding: '9px 0', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontFamily: IV, fontWeight: 500, fontSize: '0.78rem', cursor: 'pointer' }}>
          Download image
        </button>
      </div>
    </div>
  );
}

function MobileStepNumber({ num }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [80, -80]);
  
  return (
    <motion.div 
      ref={ref} 
      style={{ 
        y, 
        position: 'absolute', 
        top: -60, 
        right: -10, 
        fontSize: '200px', 
        fontWeight: 900, 
        color: '#111', 
        zIndex: 0, 
        lineHeight: 1, 
        userSelect: 'none', 
        pointerEvents: 'none',
        letterSpacing: '-0.05em'
      }}
    >
      {num}
    </motion.div>
  );
}

function HowItWorksSection({ isMobile, customImages = {}, customContent = {} }) {
  const STEP_CONTENTS = [
    () => <img src={customImages.slot1 || screenshotUpload} alt="Upload" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />,
    () => <img src={customImages.slot2 || screenshotReview} alt="Review" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />,
    () => <img src={customImages.slot3 || screenshotGenerate} alt="Generate" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />,
    () => <img src={customImages.slot4 || screenshotDownload} alt="Download" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />,
  ];
  const { t } = useLanguage();
  const [activeStep, setActiveStep] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const activeRef    = useRef(0);
  const clickLockRef = useRef(false);
  const cardRefs     = useRef([]);

  const customSteps = customContent?.steps || [];
  const steps = [
    { num: '01', title: customSteps[0]?.title || t('landing.how.s1.title'), desc: customSteps[0]?.desc || t('landing.how.s1.desc') },
    { num: '02', title: customSteps[1]?.title || t('landing.how.s2.title'), desc: customSteps[1]?.desc || t('landing.how.s2.desc') },
    { num: '03', title: customSteps[2]?.title || t('landing.how.s3.title'), desc: customSteps[2]?.desc || t('landing.how.s3.desc') },
    { num: '04', title: customSteps[3]?.title || t('landing.how.s4.title'), desc: customSteps[3]?.desc || t('landing.how.s4.desc') },
  ];

  const goToStep = useCallback((i) => {
    const el = cardRefs.current[i];
    if (el) {
      const rect = el.getBoundingClientRect();
      window.scrollTo({
        top: window.scrollY + rect.top - (window.innerHeight / 2) + (rect.height / 2),
        behavior: 'smooth',
      });
    }
    activeRef.current = i;
    setActiveStep(i);
    clickLockRef.current = true;
    setTimeout(() => { clickLockRef.current = false; }, 900);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (clickLockRef.current) return;
      const mid = window.innerHeight / 2;
      let best = 0, bestDist = Infinity;
      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const d = Math.abs((r.top + r.height / 2) - mid);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      if (best !== activeRef.current) {
        activeRef.current = best;
        setActiveStep(best);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div id="how-it-works" style={{ background: '#000' }}>
      {isMobile ? (
        <div style={{ padding: '0 1.5rem 80px', display: 'flex', flexDirection: 'column', gap: 60, overflow: 'hidden' }}>
          {steps.map((step, i) => {
            const Content = STEP_CONTENTS[i];
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'relative' }}>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20, position: 'relative', zIndex: 1 }}>
                  <h3 style={{ fontFamily: GT_W, fontWeight: 500, fontSize: 24, color: '#fff', marginTop: 8 }}>{step.title}</h3>
                  <p style={{ fontFamily: IV, fontSize: 16, color: 'rgba(255,255,255,0.6)', marginTop: 12, lineHeight: 1.6 }}>{step.desc}</p>
                </div>
                <div style={{ aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.09)', position: 'relative' }}>
                  <Content />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(to bottom, transparent, #000)', pointerEvents: 'none', zIndex: 1 }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-start', paddingBottom: 200 }}>
          <div style={{ flexShrink: 0, width: CHAPTER_NAV_LEFT }} />
          <div style={{
            flexShrink: 0,
            width: CHAPTER_NAV_W,
            position: 'sticky',
            top: 140,
            alignSelf: 'flex-start',
            zIndex: 10,
          }}>
            <div style={{ paddingTop: 120, paddingBottom: 48 }}>
              <h2 style={{ fontFamily: GT_W, fontWeight: 300, fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', lineHeight: LH_HEAD, letterSpacing: '-0.03em', color: '#fff', margin: 0 }}>
                {t('landing.how.title').split('\n').map((line, i, arr) => (
                  <React.Fragment key={i}>{line}{i < arr.length - 1 && <br />}</React.Fragment>
                ))}
              </h2>
            </div>
            {steps.map((step, i) => {
              const active = i === activeStep;
              return (
                <button key={i} onClick={() => goToStep(i)} style={{
                  width: '100%', textAlign: 'left', background: 'none', border: 'none',
                  borderTop: '1px solid rgba(255,255,255,0.09)',
                  padding: '22px 0', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', outline: 'none',
                }}>
                  <span style={{
                    fontFamily: IV, fontWeight: 700, fontSize: 13,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    color: active ? '#fff' : 'rgba(255,255,255,0.25)',
                    lineHeight: 1.3, transition: 'color 0.3s ease',
                  }}>
                    {step.title}
                  </span>
                  <span style={{
                    fontFamily: IV, fontSize: 14, lineHeight: 1.65,
                    color: 'rgba(255,255,255,0.6)',
                    maxHeight: active ? '160px' : '0px',
                    opacity: active ? 1 : 0, overflow: 'hidden',
                    transition: 'max-height 0.45s ease, opacity 0.35s ease, margin-top 0.35s ease',
                    marginTop: active ? 10 : 0,
                  }}>
                    {step.desc}
                  </span>
                </button>
              );
            })}
          </div>
          <div style={{ flexShrink: 0, width: CARD_GAP }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 120, paddingTop: 120, paddingBottom: 200 }}>
            {steps.map((_, i) => {
              const Content = STEP_CONTENTS[i];
              return (
                <div
                  key={i}
                  ref={el => { cardRefs.current[i] = el; }}
                  style={{
                    width: '100%', aspectRatio: '16 / 9',
                    background: '#1e1e1e',
                    borderRadius: '14px 0 0 14px',
                    overflow: 'hidden', flexShrink: 0,
                    border: '1px solid rgba(255,255,255,0.09)',
                    boxShadow: '0 40px 100px rgba(0,0,0,0.85)',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <SafariChrome dark={i === 3} onShare={() => setShowShareModal(true)} />
                    <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                      <Content />
                    </div>
                  </div>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(to bottom, transparent, #000)', pointerEvents: 'none', zIndex: 1 }} />
                </div>
              );
            })}
          </div>
        </div>
      )}
      {showShareModal && <ShareModal onClose={() => setShowShareModal(false)} />}
    </div>
  );
}

/* Multi-layer parallax — each layer may have an optional yOffset (px) applied to bgY base */
function useParallax(layers) {
  useEffect(() => {
    let rafId = null;
    const update = () => {
      const sy = window.scrollY;
      layers.forEach(({ ref, speed, mode, yOffset = 0 }) => {
        const el = ref.current;
        if (!el) return;
        if (mode === 'bgY') {
          el.style.backgroundPositionY = `calc(50% + ${yOffset}px + ${sy * speed}px)`;
        } else {
          el.style.transform = `translateY(${sy * speed}px)`;
        }
      });
      rafId = null;
    };
    const onScroll = () => { if (!rafId) rafId = requestAnimationFrame(update); };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => { window.removeEventListener('scroll', onScroll); if (rafId) cancelAnimationFrame(rafId); };
  }, []);
}

/* Stars fade-in on mount — visible from start, fades in as the page loads */
function useStarsScrollReveal(starsRef) {
  useEffect(() => {
    const el = starsRef.current;
    if (!el) return;
    /* Small rAF delay so the browser has painted the initial black bg first */
    const raf = requestAnimationFrame(() => {
      el.style.opacity = '1';
    });
    return () => cancelAnimationFrame(raf);
  }, []);
}


/* Drop zone preview — scroll-linked scale + opacity on the card */


// static steps array removed — now built dynamically inside HowItWorksSection using t()


/* ── Sub-components that use useLanguage (must be inside the tree) ── */
function LandingNavButtons({ user, navigate, login }) {
  const { t } = useLanguage();
  return (
    <>
      <button onClick={() => navigate('/login')}
        style={{ fontFamily: IV, fontSize: '0.875rem', lineHeight: LH_LABEL, color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        className="hover:text-white transition-colors">
        {t('login')}
      </button>
      {user ? (
        <button onClick={() => navigate('/app')}
          style={{ fontFamily: IV, fontWeight: 600, fontSize: '0.8rem', lineHeight: LH_LABEL, background: '#fff', border: 'none', color: '#000', padding: '6px 14px', borderRadius: 9999, cursor: 'pointer' }}>
          Open App
        </button>
      ) : (
        <button onClick={login}
          style={{ fontFamily: IV, fontWeight: 600, fontSize: '0.8rem', lineHeight: LH_LABEL, background: '#fff', border: 'none', color: '#000', padding: '6px 14px', borderRadius: 9999, cursor: 'pointer' }}>
          {t('landing.hero.cta')}
        </button>
      )}
    </>
  );
}

function LandingHeroContent({ user, handleCTA, isMobile }) {
  const { t } = useLanguage();
  const producerName = user?.producer_name;
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8"
        style={{ fontFamily: IV, fontSize: '14px', fontWeight: 400, lineHeight: 'normal', letterSpacing: '0.01em', background: 'rgba(0,0,0,0.72)', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(8px)' }}>
        <span>{t('landing.hero.badge')}</span>
      </motion.div>

      {producerName && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
        <div style={{
          fontFamily: '"GT Walsheim Framer Medium", "GT Walsheim Framer Medium Placeholder", sans-serif',
          fontWeight: 500,
          fontSize: isMobile ? '46px' : '105px',
          lineHeight: isMobile ? '50px' : '89px',
          letterSpacing: isMobile ? '-1px' : '-2px',
          marginBottom: isMobile ? '0px' : '2px',
          background: 'linear-gradient(90deg, #60a5fa 0%, #93c5fd 50%, #bfdbfe 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          {producerName},
        </div>
        </motion.div>
      )}

      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        style={{
          fontFamily: '"GT Walsheim Framer Medium", "GT Walsheim Framer Medium Placeholder", sans-serif',
          fontWeight: 500,
          fontSize: isMobile ? '48px' : '110px',
          lineHeight: isMobile ? '52px' : '93.5px',
          letterSpacing: isMobile ? '-1px' : '-5.5px',
          fontStyle: 'normal',
          textTransform: 'none',
          marginBottom: '2rem',
          color: '#ffffff',
        }}>
        {t('landing.hero.title').split('\n').map((line, i, arr) => {
          const text = (producerName && i === 0) ? line.charAt(0).toLowerCase() + line.slice(1) : line;
          return <React.Fragment key={i}>{text}{i < arr.length - 1 && <br />}</React.Fragment>;
        })}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
        style={isMobile ? {
          fontFamily: IV,
          fontSize: '18px',
          fontWeight: 400,
          lineHeight: '1.5',
          letterSpacing: '-0.01px',
          color: 'rgba(255,255,255,0.6)',
          textAlign: 'center',
          width: '320px',
          maxWidth: '100%',
          padding: '0',
          margin: '0 auto 2.5rem',
          display: 'block',
        } : { fontFamily: IV, fontSize: '24px', fontWeight: 400, lineHeight: '1.5', color: 'rgba(255,255,255,0.45)', maxWidth: '36rem', margin: '0 auto 2.5rem' }}>
        {(() => {
          const subtitle = t('landing.hero.subtitle');
          const parts = subtitle.split('TypeBeatz');
          if (parts.length === 2) {
            return (
              <>
                {parts[0]}
                <img
                  src={typebeatLogo}
                  alt="TypeBeatz"
                  style={{
                    display: 'inline-block',
                    height: '0.95em',
                    verticalAlign: 'middle',
                    marginBottom: '0.15em',
                    marginLeft: '0.15em',
                    marginRight: '0.1em',
                    opacity: 0.45,
                  }}
                />
                {parts[1]}
              </>
            );
          }
          return subtitle;
        })()}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-row items-center justify-center gap-3"
      >
        <ParticleButton onClick={handleCTA}
          className="transition-all duration-200 hover:scale-105 flex items-center justify-center"
          style={{ fontFamily: IV, fontWeight: 400, fontSize: '15px', lineHeight: 'normal', background: '#fff', border: 'none', color: '#000', padding: '9px 0', width: 128, borderRadius: 9999, cursor: 'pointer' }}>
          {user ? t('landing.hero.openApp') : t('landing.hero.cta')}
        </ParticleButton>
        <a href="#pricing"
          style={{ fontFamily: IV, fontWeight: 400, fontSize: '15px', lineHeight: 'normal', textDecoration: 'none', padding: '9px 0', width: 128, borderRadius: 9999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          className="bg-[#2a2a2a] text-white hover:bg-[#111] hover:text-[#999] transition-colors border-none">
          {t('landing.hero.goUnlimited')}
        </a>
      </motion.div>

    </>
  );
}

function LandingFooter({ isMobile }) {
  const { t } = useLanguage();
  return (
    <footer className="py-8 border-t border-white/[0.06]" style={{ background: '#000', paddingLeft: isMobile ? '1rem' : '4rem', paddingRight: isMobile ? '1rem' : '4rem' }}>
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <img src={typebeatLogo} alt="TypeBeatz" style={{ height: 16, opacity: 0.5 }} />
          <p style={{ fontFamily: IV, fontSize: '12px', fontWeight: 400, lineHeight: 'normal', color: 'rgba(255,255,255,0.2)' }}>
            {t('landing.pricing.footer')}
          </p>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <p style={{ fontFamily: IV, fontSize: '12px', fontWeight: 400, lineHeight: 'normal', color: 'rgba(255,255,255,0.3)' }}>
            © {new Date().getFullYear()} TypeBeatz. {t('landing.footer.rights')}
          </p>
          <a href="mailto:typebeatz@voodoo808.com" className="text-blue-500/50 hover:text-blue-400 transition-colors text-xs" style={{ fontFamily: IV, fontSize: '12px', fontWeight: 400, lineHeight: 'normal' }}>
            typebeatz@voodoo808.com
          </a>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex gap-6">
            {['Terms', 'Privacy', 'Refund'].map(l => (
              <a key={l} href={`/${l.toLowerCase()}`}
                style={{ fontFamily: IV, fontSize: '12px', fontWeight: 400, lineHeight: 'normal', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}
                className="hover:text-white transition-colors">{l}</a>
            ))}
          </div>
          <LanguageToggle />
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [customImages, setCustomImages] = useState({});
  const [customContent, setCustomContent] = useState({ steps: [{}, {}, {}, {}] });
  const starsRef = useRef(null);
  const glowRef  = useRef(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetch('/api/landing-images')
      .then(r => r.json())
      .then(data => { if (data && typeof data === 'object') setCustomImages(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/landing-content')
      .then(r => r.json())
      .then(data => { if (data?.steps) setCustomContent(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      import('./AppPage');
      import('../VideoApp');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useParallax([
    { ref: starsRef, speed: 0.25, mode: 'bgY', yOffset: 600 },
    { ref: glowRef,  speed: 0.5,  mode: 'translateY' },
  ]);
  useStarsScrollReveal(starsRef);

  const handleCTA = () => { user ? navigate('/app') : login(); };
  const handleUpgradeCTA = (interval = 'yearly') => {
    if (!user) { login(); return; }
    if (user.role === 'pro' || user.role === 'unlimited' || user.role === 'admin') navigate('/app');
    else navigate(`/app?upgrade=true&interval=${interval}`);
  };
  const handleUnlimitedCTA = (interval = 'yearly') => {
    if (!user) { login(); return; }
    if (user.role === 'unlimited' || user.role === 'admin') navigate('/app');
    else navigate(`/app?upgrade=unlimited&interval=${interval}`);
  };

  return (
    <div className="min-h-screen text-white" style={{ background: '#000', fontFamily: IV, overflowX: 'clip' }}>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between py-4"
        style={{ 
          background: 'rgba(0,0,0,0.38)', 
          backdropFilter: 'blur(16px)', 
          borderBottom: '1px solid rgba(255,255,255,0.06)', 
          paddingLeft: isMobile ? '1rem' : '4rem', 
          paddingRight: isMobile ? '1rem' : '4rem' 
        }}>
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
          <img src={typebeatLogo} alt="TypeBeatz" style={{ height: 20 }} />
        </button>
        <div className="flex items-center gap-6">
          <LandingNavButtons user={user} navigate={navigate} login={login} />
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center px-6 text-center" style={{ overflow: 'hidden', minHeight: '100vh', background: '#000', justifyContent: isMobile ? 'flex-start' : 'center', paddingTop: isMobile ? '72px' : '80px' }}>

        {/* Stars background — starts invisible, fades in on mount as text loads */}
        <div ref={starsRef} className="absolute inset-0 pointer-events-none" style={{
          zIndex: 0,
          opacity: 0,
          backgroundImage: `url(${starsBg})`,
          backgroundSize: '130%',
          backgroundPosition: 'center calc(50% + 600px)',
          backgroundRepeat: 'no-repeat',
          transition: 'opacity 1.8s ease',
        }} />

        {/* Subtle blue glow — mid-layer */}
        <div ref={glowRef} className="absolute pointer-events-none" style={{ zIndex: 0, willChange: 'transform', bottom: '20%', left: '50%', transform: 'translateX(-50%)' }}>
          <div style={{ width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 65%)' }} />
        </div>

        {/* Vignette — fades stars toward edges */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1, background: 'radial-gradient(ellipse 80% 60% at 50% 70%, transparent 20%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0.9) 75%, #000 92%)' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1, background: 'linear-gradient(to right, #000 0%, rgba(0,0,0,0.65) 10%, transparent 25%, transparent 75%, rgba(0,0,0,0.65) 90%, #000 100%)' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1, background: 'linear-gradient(to bottom, #000 0%, rgba(0,0,0,0.5) 6%, transparent 18%, transparent 65%, rgba(0,0,0,0.7) 82%, #000 100%)' }} />

        {/* Hero content */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          className="relative" style={{ zIndex: 2 }}>
          <LandingHeroContent user={user} handleCTA={handleCTA} isMobile={isMobile} />
        </motion.div>

        {/* Stats row — hidden until user scrolls 10px, then blur-to-focus reveal */}
        <div className={`relative flex flex-wrap justify-center gap-x-14 gap-y-8 mt-20 ${isMobile ? 'grid grid-cols-2 gap-8 px-4' : 'flex'}`} style={{ zIndex: 2 }}>
          <BlurReveal delay={0} minScroll={10}>
            <Stat prefix={t('landing.stats.s1.prefix')} val={t('landing.stats.s1.val')} label={t('landing.stats.s1.label')} />
          </BlurReveal>
          <BlurReveal delay={200} minScroll={10}>
            <Stat prefix={t('landing.stats.s2.prefix')} val={t('landing.stats.s2.val')} label={t('landing.stats.s2.label')} />
          </BlurReveal>
          <BlurReveal delay={400} minScroll={10}>
            <Stat prefix={t('landing.stats.s3.prefix')} val={t('landing.stats.s3.val')} label={t('landing.stats.s3.label')} />
          </BlurReveal>
          <BlurReveal delay={600} minScroll={10}>
            <Stat prefix={null} val={t('landing.stats.s4.val')} label={t('landing.stats.s4.label')} />
          </BlurReveal>
        </div>
      </section>


      {/* ── How it works ── */}
      <div id="how-it-works">
        <HowItWorksSection isMobile={isMobile} customImages={customImages} customContent={customContent} />
      </div>


      {/* ── Pricing ── */}
      <PricingSection handleCTA={handleCTA} handleUpgradeCTA={handleUpgradeCTA} handleUnlimitedCTA={handleUnlimitedCTA} user={user} isMobile={isMobile} />



      {/* ── Footer ── */}
      <LandingFooter isMobile={isMobile} />
    </div>
  );
}
