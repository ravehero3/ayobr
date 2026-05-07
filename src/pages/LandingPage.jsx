import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import typebeatLogo from '../assets/typebeatz logo 2 white version_1754509091303.png';
import starsBg from '../assets/stars_background_voodoo808_1778087733997.jpg';

const NM     = "'Neue Montreal', 'Inter', sans-serif";
const SCRIPT = "'Satisfy', cursive";
const BTN_BG  = 'linear-gradient(135deg, #3b82f6, #0ea5e9)';
const BTN_GLOW = '0 0 40px rgba(59,130,246,0.35)';

const LH_BODY  = 1.6;
const LH_LABEL = 1.5;
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
        fontFamily: NM, fontSize: '0.72rem', fontWeight: 500,
        color: 'rgba(255,255,255,0.38)', lineHeight: LH_LABEL, letterSpacing: '0.04em',
        marginBottom: 4, visibility: prefix ? 'visible' : 'hidden', userSelect: 'none',
      }}>
        {prefix ?? 'up to'}
      </div>
      <WordReveal text={val} style={{
        fontFamily: NM, fontWeight: 900, fontSize: 'clamp(1.9rem, 3vw, 2.6rem)',
        lineHeight: 1, letterSpacing: '-0.04em', color: '#fff', display: 'block',
      }} />
      <WordReveal text={label} style={{
        fontFamily: NM, fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)',
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

/* Blur-to-focus reveal triggered by IntersectionObserver */
function BlurReveal({ children, delay = 0, style = {} }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} style={{
      filter:     visible ? 'blur(0px)'   : 'blur(12px)',
      opacity:    visible ? 1             : 0.15,
      transition: `filter 0.9s ease-out ${delay}ms, opacity 0.9s ease-out ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  );
}

/* Pricing Section */
function PricingSection({ handleCTA, handleUpgradeCTA, user }) {
  const isPro      = user?.role === 'pro' || user?.role === 'admin';
  const checkFree  = { bg: 'rgba(74,222,128,0.12)',  border: 'rgba(74,222,128,0.35)',  color: '#4ade80' };
  const checkBlue  = { bg: 'rgba(56,189,248,0.12)',  border: 'rgba(56,189,248,0.35)',  color: '#38bdf8' };
  const checkGold  = { bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.35)',  color: '#fbbf24' };

  const Check = ({ c }) => (
    <span style={{ width: 16, height: 16, borderRadius: '50%', background: c.bg, border: `1px solid ${c.border}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: c.color, flexShrink: 0 }}>✓</span>
  );

  return (
    <section id="pricing" style={{ padding: '112px 0', background: '#000' }}>
      <div style={{ paddingLeft: 424, paddingRight: 40 }}>
        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.55 }}
          style={{ marginBottom: 64 }}>
          <h2 style={{ fontFamily: NM, fontWeight: 900, fontSize: 'clamp(2rem, 4.5vw, 3rem)', lineHeight: LH_HEAD, letterSpacing: '-0.03em', marginBottom: 14, color: '#fff' }}>
            Pricing
          </h2>
          <p style={{ fontFamily: NM, fontSize: '1rem', lineHeight: LH_BODY, color: 'rgba(255,255,255,0.4)', maxWidth: 400 }}>
            Start free, upgrade when you're ready. No hidden fees, no surprises.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 300px))', gap: 20 }}>

          {/* FREE card */}
          <motion.div initial={{ opacity: 0, y: 44 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.05 }}
            style={{ background: '#000', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '36px 32px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: NM, fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: 20 }}>Free</div>
            <div style={{ fontFamily: NM, fontWeight: 900, fontSize: '3rem', lineHeight: 1, letterSpacing: '-0.05em', marginBottom: 6, color: '#fff' }}>
              $0<span style={{ fontSize: '1rem', fontWeight: 400, color: 'rgba(255,255,255,0.28)', letterSpacing: 0 }}>/mo</span>
            </div>
            <p style={{ fontFamily: NM, fontSize: '0.82rem', color: 'rgba(255,255,255,0.35)', lineHeight: LH_BODY, marginBottom: 28 }}>Perfect for getting started</p>
            <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 24 }} />
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px', display: 'flex', flexDirection: 'column', gap: 11, flex: 1 }}>
              {['5 videos per month', 'Credits reset on the 1st', 'All core features', 'Black & white backgrounds', 'HD 1080p output'].map(item => (
                <li key={item} style={{ fontFamily: NM, fontSize: '0.875rem', lineHeight: LH_BODY, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Check c={checkFree} />{item}
                </li>
              ))}
            </ul>
            <button onClick={handleCTA} style={{ fontFamily: NM, fontWeight: 600, fontSize: '0.875rem', lineHeight: LH_LABEL, color: 'rgba(255,255,255,0.8)', background: 'transparent', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 12, padding: '14px 0', cursor: 'pointer', width: '100%', outline: 'none' }}>
              {user ? "You're on Free" : 'Get Started — Free'}
            </button>
          </motion.div>

          {/* PRO card — $9.99, 1080p, 31 videos */}
          <motion.div initial={{ opacity: 0, y: 44 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15 }}
            style={{ background: 'linear-gradient(160deg, rgba(59,130,246,0.14) 0%, rgba(14,165,233,0.07) 100%)', border: '1px solid rgba(59,130,246,0.38)', borderRadius: 20, padding: '36px 32px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontFamily: NM, fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)' }}>PRO</div>
              <div style={{ background: BTN_BG, borderRadius: 999, padding: '4px 10px', fontFamily: NM, fontSize: '0.58rem', fontWeight: 700, color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Most Popular</div>
            </div>
            <div style={{ fontFamily: NM, fontWeight: 900, fontSize: '3rem', lineHeight: 1, letterSpacing: '-0.05em', marginBottom: 6, color: '#fff' }}>
              $9.99<span style={{ fontSize: '1rem', fontWeight: 400, color: 'rgba(255,255,255,0.28)', letterSpacing: 0 }}>/mo</span>
            </div>
            <p style={{ fontFamily: NM, fontSize: '0.82rem', color: 'rgba(255,255,255,0.35)', lineHeight: LH_BODY, marginBottom: 28 }}>For producers scaling their channel</p>
            <div style={{ width: '100%', height: 1, background: 'rgba(59,130,246,0.2)', marginBottom: 24 }} />
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px', display: 'flex', flexDirection: 'column', gap: 11, flex: 1 }}>
              {['31 videos per month', 'HD 1080p output', 'Custom photo backgrounds', 'All core features', 'Cancel anytime'].map(item => (
                <li key={item} style={{ fontFamily: NM, fontSize: '0.875rem', lineHeight: LH_BODY, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Check c={checkBlue} />{item}
                </li>
              ))}
            </ul>
            <button onClick={handleUpgradeCTA} style={{ fontFamily: NM, fontWeight: 700, fontSize: '0.875rem', lineHeight: LH_LABEL, background: BTN_BG, border: 'none', color: '#fff', borderRadius: 12, padding: '14px 0', cursor: 'pointer', width: '100%', boxShadow: '0 0 28px rgba(59,130,246,0.28)', outline: 'none' }}>
              {isPro ? "You're on PRO ⭐" : 'Upgrade to PRO'}
            </button>
            <p style={{ fontFamily: NM, fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 14 }}>Cancel anytime · No commitment</p>
          </motion.div>

          {/* UNLIMITED card — $18.99, 4K, unlimited */}
          <motion.div initial={{ opacity: 0, y: 44 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.27 }}
            style={{ background: 'linear-gradient(160deg, rgba(251,191,36,0.1) 0%, rgba(245,158,11,0.04) 100%)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 20, padding: '36px 32px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,191,36,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ fontFamily: NM, fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: 20 }}>Unlimited</div>
            <div style={{ fontFamily: NM, fontWeight: 900, fontSize: '3rem', lineHeight: 1, letterSpacing: '-0.05em', marginBottom: 6, color: '#fff' }}>
              $18.99<span style={{ fontSize: '1rem', fontWeight: 400, color: 'rgba(255,255,255,0.28)', letterSpacing: 0 }}>/mo</span>
            </div>
            <p style={{ fontFamily: NM, fontSize: '0.82rem', color: 'rgba(255,255,255,0.35)', lineHeight: LH_BODY, marginBottom: 28 }}>For serious producers going all in</p>
            <div style={{ width: '100%', height: 1, background: 'rgba(251,191,36,0.18)', marginBottom: 24 }} />
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px', display: 'flex', flexDirection: 'column', gap: 11, flex: 1 }}>
              {['Unlimited video generation', '4K video output', 'Custom photo backgrounds', 'All core features', 'Cancel anytime'].map(item => (
                <li key={item} style={{ fontFamily: NM, fontSize: '0.875rem', lineHeight: LH_BODY, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Check c={checkGold} />{item}
                </li>
              ))}
            </ul>
            <button onClick={handleUpgradeCTA} style={{ fontFamily: NM, fontWeight: 700, fontSize: '0.875rem', lineHeight: LH_LABEL, background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', border: 'none', color: '#000', borderRadius: 12, padding: '14px 0', cursor: 'pointer', width: '100%', boxShadow: '0 0 28px rgba(251,191,36,0.22)', outline: 'none' }}>
              Go Unlimited
            </button>
            <p style={{ fontFamily: NM, fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 14 }}>Cancel anytime · No commitment</p>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

/* How It Works — title scrolls away, two-column panel pins while stepping through chapters */
const NAV_H           = 60;  /* navbar height in px          */
const HOW_SCROLL_STEP = 500; /* px of scroll per chapter — generous so content is readable */

function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [animKey, setAnimKey]       = useState(0);
  const stickyWrapRef = useRef(null); /* the scroll-zone that drives pinning */
  const activeRef     = useRef(0);
  const clickLockRef  = useRef(false);

  const goToStep = useCallback((i) => {
    if (i === activeRef.current) return;
    activeRef.current = i;
    setActiveStep(i);
    setAnimKey(k => k + 1);
    clickLockRef.current = true;
    setTimeout(() => { clickLockRef.current = false; }, 600);
  }, []);

  /* rAF scroll tracker — progress measured inside the sticky wrapper */
  useEffect(() => {
    let rafId = null;
    const update = () => {
      if (!clickLockRef.current) {
        const el = stickyWrapRef.current;
        if (el) {
          const rect       = el.getBoundingClientRect();
          const stickyH    = window.innerHeight - NAV_H;
          const totalScroll = el.offsetHeight - stickyH;
          const scrolled   = Math.max(0, NAV_H - rect.top);
          const progress   = totalScroll > 0 ? Math.min(scrolled / totalScroll, 1) : 0;
          const newStep    = Math.min(Math.floor(progress * steps.length), steps.length - 1);
          if (newStep !== activeRef.current) {
            activeRef.current = newStep;
            setActiveStep(newStep);
            setAnimKey(k => k + 1);
          }
        }
      }
      rafId = null;
    };
    const onScroll = () => { if (!rafId) rafId = requestAnimationFrame(update); };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => { window.removeEventListener('scroll', onScroll); if (rafId) cancelAnimationFrame(rafId); };
  }, []);

  const s         = steps[activeStep];
  const stickyH   = `calc(100vh - ${NAV_H}px)`;
  /* wrapper height: the sticky height + scroll space for all steps */
  const wrapperH  = `calc(100vh - ${NAV_H}px + ${steps.length * HOW_SCROLL_STEP}px)`;
  const stepIcons = ['🎵', '🔀', '⚙️', '📥'];

  return (
    <div id="how-it-works" style={{ background: '#000' }}>

      {/* ── Title — normal flow, scrolls away before the pin starts ── */}
      <div style={{ paddingLeft: 424, paddingRight: 40, paddingTop: 80, paddingBottom: 28 }}>
        <h2 style={{ fontFamily: NM, fontWeight: 900, fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', lineHeight: LH_HEAD, letterSpacing: '-0.03em', color: '#fff', margin: 0 }}>
          How it works
        </h2>
      </div>

      {/* ── Scroll zone: sticky panel lives inside here ── */}
      <div ref={stickyWrapRef} style={{ height: wrapperH }}>
        <div style={{
          position: 'sticky',
          top: NAV_H,
          height: stickyH,
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          background: '#000',
        }}>
          {/* Inner layout — left-aligned at 424 px, matching logo */}
          <div style={{ width: '100%', paddingLeft: 424, paddingRight: 60 }}>
            <div style={{ display: 'flex', gap: 64, alignItems: 'stretch' }}>

              {/* Left: chapter menu */}
              <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                {steps.map((step, i) => (
                  <button
                    key={i}
                    onClick={() => goToStep(i)}
                    style={{
                      width: '100%', textAlign: 'left', background: 'none', border: 'none',
                      borderTop: '1px solid rgba(255,255,255,0.11)',
                      padding: '14px 0', cursor: 'pointer', display: 'block',
                      outline: 'none',
                    }}>
                    <div style={{
                      fontFamily: NM, fontWeight: 600, fontSize: '0.88rem', lineHeight: 1.35,
                      color: i === activeStep ? '#fff' : 'rgba(255,255,255,0.28)',
                      transition: 'color 0.3s ease',
                    }}>
                      {step.title}
                    </div>
                    <div style={{
                      fontFamily: NM, fontSize: '0.78rem', lineHeight: 1.6,
                      color: 'rgba(255,255,255,0.38)',
                      maxHeight: i === activeStep ? '80px' : '0px',
                      overflow: 'hidden',
                      opacity: i === activeStep ? 1 : 0,
                      marginTop: i === activeStep ? 6 : 0,
                      transition: 'max-height 0.4s ease, opacity 0.3s ease, margin-top 0.3s ease',
                    }}>
                      {step.desc}
                    </div>
                  </button>
                ))}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.11)' }} />

                {/* Progress dots */}
                <div style={{ display: 'flex', gap: 5, marginTop: 18 }}>
                  {steps.map((_, j) => (
                    <button
                      key={j}
                      onClick={() => goToStep(j)}
                      style={{
                        height: 3, borderRadius: 2, border: 'none', padding: 0, cursor: 'pointer',
                        flex: j === activeStep ? 3 : 1,
                        background: j === activeStep ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.1)',
                        transition: 'flex 0.4s ease, background 0.35s ease',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Right: screenshot panel — animates in on step change */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  key={animKey}
                  style={{
                    width: '100%',
                    height: 'clamp(280px, 44vh, 460px)',
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.015) 100%)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 16,
                    overflow: 'hidden',
                    position: 'relative',
                    animation: 'howCardIn 0.36s ease forwards',
                  }}>
                  <style>{`@keyframes howCardIn { from { opacity:0; transform:translateX(12px); } to { opacity:1; transform:translateX(0); } }`}</style>

                  {/* Faux browser chrome */}
                  <div style={{ height: 34, borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', background: 'rgba(255,255,255,0.025)' }}>
                    {['#ff5f56','#ffbd2e','#27c93f'].map((c, ci) => (
                      <div key={ci} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: 0.55 }} />
                    ))}
                    <div style={{ flex: 1, height: 16, borderRadius: 4, background: 'rgba(255,255,255,0.05)', marginLeft: 8 }} />
                  </div>

                  {/* Content area */}
                  <div style={{ height: 'calc(100% - 34px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 28 }}>
                    <div style={{ fontSize: 'clamp(2.2rem, 4vw, 3rem)', lineHeight: 1 }}>{stepIcons[activeStep]}</div>
                    <div style={{ fontFamily: NM, fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)' }}>
                      Step {activeStep + 1} — {s.title}
                    </div>
                    <div style={{ position: 'absolute', bottom: 10, right: 18, fontFamily: NM, fontWeight: 900, fontSize: 'clamp(4rem, 9vw, 8rem)', lineHeight: 1, letterSpacing: '-0.06em', color: 'rgba(255,255,255,0.03)', userSelect: 'none', pointerEvents: 'none' }}>{s.num}</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Multi-layer parallax */
function useParallax(layers) {
  useEffect(() => {
    let rafId = null;
    const update = () => {
      const sy = window.scrollY;
      layers.forEach(({ ref, speed, mode }) => {
        const el = ref.current;
        if (!el) return;
        if (mode === 'bgY') {
          el.style.backgroundPositionY = `calc(50% + ${sy * speed}px)`;
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

/* Stars fade-in on scroll */
function useStarsScrollReveal(starsRef) {
  useEffect(() => {
    const el = starsRef.current;
    if (!el) return;
    let rafId = null;
    const update = () => {
      const sy = window.scrollY;
      /* Start fading in after 40px of scroll, fully visible by 320px */
      const opacity = Math.min(1, Math.max(0, (sy - 40) / 280));
      el.style.opacity = String(opacity);
      rafId = null;
    };
    const onScroll = () => { if (!rafId) rafId = requestAnimationFrame(update); };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => { window.removeEventListener('scroll', onScroll); if (rafId) cancelAnimationFrame(rafId); };
  }, []);
}

function HeadingReveal({ lines, style, className }) {
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

  let globalIdx = 0;
  return (
    <span ref={ref} className={className} style={style}>
      {lines.map((line, li) => (
        <span key={li} style={{ display: 'block' }}>
          {line.split(' ').map((word, wi) => {
            const idx = globalIdx++;
            return (
              <span key={wi} style={{
                display: 'inline-block',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(12px)',
                transition: `opacity 0.55s ease ${idx * 65}ms, transform 0.55s ease ${idx * 65}ms`,
                marginRight: wi < line.split(' ').length - 1 ? '0.28em' : 0,
              }}>{word}</span>
            );
          })}
        </span>
      ))}
    </span>
  );
}

/* Drop zone preview — scroll-linked scale + opacity on the card */
function DropZonePreview() {
  const cardRef = useRef(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    let rafId = null;
    const update = () => {
      const rect = el.getBoundingClientRect();
      /* progress: 0 when element top reaches viewport bottom, 1 after 300px of scroll */
      const progress = Math.min(Math.max((window.innerHeight - rect.top) / 300, 0), 1);
      el.style.transform = `scale(${0.85 + progress * 0.15})`;
      el.style.opacity   = String(0.5 + progress * 0.5);
      rafId = null;
    };
    const onScroll = () => { if (!rafId) rafId = requestAnimationFrame(update); };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => { window.removeEventListener('scroll', onScroll); if (rafId) cancelAnimationFrame(rafId); };
  }, []);

  return (
    <section className="py-24 px-6 max-w-5xl mx-auto text-center" style={{ background: '#000' }}>
      <h2 style={{ fontFamily: NM, fontWeight: 900, marginBottom: '1rem', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', lineHeight: LH_HEAD, letterSpacing: '-0.03em' }}>
        Clean, focused, powerful
      </h2>
      <p style={{ fontFamily: NM, lineHeight: LH_BODY, color: 'rgba(255,255,255,0.45)', marginBottom: '2.5rem' }}>
        The whole workflow in one screen. Drop files, review pairs, generate.
      </p>
      <div
        ref={cardRef}
        style={{
          opacity: 0.5,
          transform: 'scale(0.85)',
          willChange: 'transform, opacity',
          transformOrigin: 'center top',
        }}>
        <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', padding: 2 }}>
          <div className="rounded-xl overflow-hidden" style={{ background: '#000', minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="text-center p-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-2 border-dashed border-white/20 mb-6">
                <svg className="w-10 h-10 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p style={{ fontFamily: NM, fontWeight: 700, fontSize: '1.4rem', lineHeight: LH_HEAD, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Drop Your Files</p>
              <p style={{ fontFamily: NM, lineHeight: LH_BODY, color: 'rgba(255,255,255,0.35)' }}>Drag and drop your audio and image files here</p>
              <div className="flex items-center justify-center gap-3 mt-6">
                <span className="px-3 py-1 rounded-full border border-white/10 text-xs" style={{ fontFamily: NM, lineHeight: LH_LABEL, color: 'rgba(255,255,255,0.4)' }}>🎵 MP3, WAV</span>
                <span className="px-3 py-1 rounded-full border border-white/10 text-xs" style={{ fontFamily: NM, lineHeight: LH_LABEL, color: 'rgba(255,255,255,0.4)' }}>🖼️ PNG, JPG</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const features = [
  { icon: '🎵', title: 'Drop 100 files at once', desc: 'Drag in up to 50 audio files and 50 images in one go. TypeBeatz pairs them up automatically — no manual work needed.' },
  { icon: '🎬', title: 'Get 50 YouTube-ready videos', desc: 'Every audio + image pair becomes a full 1080p or 4K video with 320kbps audio. Perfect for YouTube type beat uploads.' },
  { icon: '🖼️', title: 'Custom video backgrounds', desc: 'PRO users can upload any photo as a custom background. Free plan includes clean black & white backgrounds only.' },
  { icon: '😴', title: 'Sleep while it works', desc: 'Hit generate, close your eyes. TypeBeatz runs everything in the background. Wake up to a folder full of finished videos.' },
  { icon: '🖥️', title: 'Runs entirely in your browser', desc: 'No upload limits, no server wait times. All video processing happens locally on your machine.' },
  { icon: '📦', title: 'Download everything at once', desc: 'When all videos are done, grab them all in one click. Ready to upload straight to YouTube.' },
];

const steps = [
  {
    num: '01',
    title: 'Upload your files',
    desc: 'Drag and drop your beat MP3s and artwork PNGs — up to 100 files at a time.',
    longDesc: 'Drag and drop your beat MP3s and artwork PNGs — up to 100 files at a time. TypeBeatz accepts all common audio and image formats and processes them instantly in your browser.',
  },
  {
    num: '02',
    title: 'Review your pairs',
    desc: 'TypeBeatz auto-pairs audio with images. Swap anything around if needed.',
    longDesc: 'TypeBeatz automatically pairs each audio file with an image. Review all pairs in a clean grid — drag to reorder or swap any combination before you generate.',
  },
  {
    num: '03',
    title: 'Hit Generate',
    desc: 'Sit back. The app processes every video in the background while you do other things.',
    longDesc: 'Sit back and relax. TypeBeatz processes every video pair in the background using FFmpeg directly in your browser — no uploads, no servers, no waiting in queues.',
  },
  {
    num: '04',
    title: 'Download & upload',
    desc: 'Your videos are ready. Download them all and upload directly to YouTube.',
    longDesc: 'Your videos are ready when you are. Download all of them in a single click, then upload straight to YouTube. Your channel fills itself.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const starsRef = useRef(null);
  const glowRef  = useRef(null);

  useParallax([
    { ref: starsRef, speed: 0.25, mode: 'bgY' },
    { ref: glowRef,  speed: 0.5,  mode: 'translateY' },
  ]);
  useStarsScrollReveal(starsRef);

  const handleCTA = () => { user ? navigate('/app') : login(); };
  const handleUpgradeCTA = () => {
    if (!user) login();
    else if (user.role === 'pro' || user.role === 'admin') navigate('/app');
    else navigate('/app?upgrade=true');
  };

  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: '#000', fontFamily: NM }}>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between py-4"
        style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingLeft: 424, paddingRight: 424 }}>
        <img src={typebeatLogo} alt="TypeBeatz" style={{ height: 20 }} />
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/login')}
            style={{ fontFamily: NM, fontSize: '0.875rem', lineHeight: LH_LABEL, color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            className="hover:text-white transition-colors">
            Log in
          </button>
          {user ? (
            <button onClick={() => navigate('/app')}
              style={{ fontFamily: NM, fontWeight: 600, fontSize: '0.8rem', lineHeight: LH_LABEL, background: '#fff', border: 'none', color: '#000', padding: '6px 14px', borderRadius: 9999, cursor: 'pointer' }}>
              Open App
            </button>
          ) : (
            <button onClick={login}
              style={{ fontFamily: NM, fontWeight: 600, fontSize: '0.8rem', lineHeight: LH_LABEL, background: '#fff', border: 'none', color: '#000', padding: '6px 14px', borderRadius: 9999, cursor: 'pointer' }}>
              Sign Up
            </button>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center px-6 text-center pt-20" style={{ overflow: 'hidden', minHeight: '100vh', background: '#000' }}>

        {/* Stars background — starts invisible, reveals on scroll, sits behind stats */}
        <div ref={starsRef} className="absolute inset-0 pointer-events-none" style={{
          zIndex: 0,
          opacity: 0,
          backgroundImage: `url(${starsBg})`,
          backgroundSize: '130%',
          backgroundPosition: 'center 50%',
          backgroundRepeat: 'no-repeat',
          transition: 'opacity 0.3s ease',
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

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 mb-8"
            style={{ fontFamily: NM, fontSize: '0.8rem', fontWeight: 500, lineHeight: LH_LABEL, letterSpacing: '0.01em' }}>
            <span>🎬</span>
            <span>The fastest way to fill your YouTube channel.</span>
          </div>

          <h1 style={{
            fontFamily: '"GT Walsheim Framer Medium", "GT Walsheim Framer Medium Placeholder", sans-serif',
            fontWeight: 500,
            fontSize: '110px',
            lineHeight: '93.5px',
            letterSpacing: '-2px',
            fontStyle: 'normal',
            textTransform: 'none',
            marginBottom: '2rem',
            color: '#ffffff',
          }}>
            Make 100<br />
            type beat videos<br />
            in one click
          </h1>

          <p style={{ fontFamily: NM, fontSize: 'clamp(1rem, 2vw, 1.15rem)', lineHeight: LH_BODY, color: 'rgba(255,255,255,0.45)', maxWidth: '36rem', margin: '0 auto 2.5rem' }}>
            Drop your audio files and artwork — TypeBeatz automatically generates professional
            type beat videos ready to upload to YouTube. No editing. No manual work.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <ParticleButton onClick={handleCTA}
              className="transition-all duration-200 hover:scale-105"
              style={{ fontFamily: NM, fontWeight: 600, fontSize: '0.8rem', lineHeight: LH_LABEL, background: '#fff', border: 'none', color: '#000', padding: '6px 14px', borderRadius: 9999, cursor: 'pointer' }}>
              {user ? 'Open the App' : 'Start for free'}
            </ParticleButton>
            <a href="#how-it-works"
              style={{ fontFamily: NM, fontWeight: 600, fontSize: '0.8rem', lineHeight: LH_LABEL, color: '#fff', textDecoration: 'none', padding: '6px 14px', borderRadius: 9999, background: '#2a2a2a', border: 'none', display: 'inline-block' }}
              className="hover:bg-[#333] transition-colors">
              Go unlimited
            </a>
          </div>

          <p style={{ fontFamily: NM, fontSize: '0.8rem', lineHeight: LH_LABEL, color: 'rgba(255,255,255,0.25)', marginTop: '1rem' }}>
            Free — 5 videos/month · PRO — unlimited for $9.99/month
          </p>
        </motion.div>

        {/* Stats row — blur-to-focus reveal, positioned over the stars */}
        <div className="relative flex flex-wrap justify-center gap-x-14 gap-y-8 mt-20" style={{ zIndex: 2 }}>
          <BlurReveal delay={0}>
            <Stat prefix="up to" val="100" label="videos per batch" />
          </BlurReveal>
          <BlurReveal delay={200}>
            <Stat prefix="create" val="∞" label="videos" />
          </BlurReveal>
          <BlurReveal delay={400}>
            <Stat prefix="up to" val="4K" label="video quality" />
          </BlurReveal>
          <BlurReveal delay={600}>
            <Stat prefix={null} val="Custom" label="backgrounds" />
          </BlurReveal>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6 max-w-6xl mx-auto" style={{ background: '#000' }}>
        <h2 style={{ fontFamily: NM, fontWeight: 900, textAlign: 'center', marginBottom: '1rem', fontSize: 'clamp(1.8rem, 4vw, 3rem)', lineHeight: LH_HEAD, letterSpacing: '-0.03em' }}>
          <HeadingReveal lines={['Everything you need to scale', 'your YouTube channel']} />
        </h2>
        <p style={{ fontFamily: NM, lineHeight: LH_BODY, color: 'rgba(255,255,255,0.45)', textAlign: 'center', maxWidth: '36rem', margin: '0 auto 4rem' }}>
          Built for type beat producers who want to upload more without spending hours editing.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="rounded-2xl p-6 border border-white/[0.06]"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 style={{ fontFamily: NM, fontWeight: 700, fontSize: '1rem', lineHeight: LH_HEAD, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>{f.title}</h3>
              <p style={{ fontFamily: NM, lineHeight: LH_BODY, color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem' }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <HowItWorksSection />

      {/* ── Drop zone preview — scroll-scale reveal ── */}
      <DropZonePreview />

      {/* ── Pricing ── */}
      <PricingSection handleCTA={handleCTA} handleUpgradeCTA={handleUpgradeCTA} user={user} />

      {/* ── CTA banner ── */}
      <section className="py-24 px-6" style={{ background: '#000' }}>
        <div className="max-w-3xl mx-auto text-center rounded-2xl p-12 border border-white/10"
          style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(14,165,233,0.08))' }}>
          <h2 style={{ fontFamily: NM, fontWeight: 900, marginBottom: '0.5rem', fontSize: 'clamp(1.6rem, 4vw, 2.5rem)', lineHeight: LH_HEAD, letterSpacing: '-0.03em' }}>
            Ready to make type beats<br />in batches and save hours
          </h2>
          <p style={{ fontFamily: SCRIPT, fontSize: '1.7rem', lineHeight: 1.4, color: 'rgba(255,255,255,0.5)', marginBottom: '0.75rem' }}>
            of your life?
          </p>
          <p style={{ fontFamily: NM, lineHeight: LH_BODY, color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem', marginBottom: '2rem' }}>
            Join producers who are uploading more beats while doing less work.
          </p>
          <ParticleButton onClick={handleCTA}
            className="transition-all hover:scale-105"
            style={{ fontFamily: NM, fontWeight: 700, fontSize: '1.05rem', lineHeight: LH_LABEL, background: BTN_BG, boxShadow: BTN_GLOW, border: 'none', color: '#fff', padding: '16px 40px', borderRadius: 12, cursor: 'pointer' }}>
            {user ? 'Open the App' : 'Start Free — No Credit Card'}
          </ParticleButton>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 border-t border-white/[0.06]" style={{ background: '#000' }}>
        <div className="flex flex-col md:flex-row items-center justify-between max-w-5xl mx-auto gap-4">
          <img src={typebeatLogo} alt="TypeBeatz" style={{ height: 16, opacity: 0.5 }} />
          <p style={{ fontFamily: NM, fontSize: '0.8rem', lineHeight: LH_LABEL, color: 'rgba(255,255,255,0.3)' }}>
            © {new Date().getFullYear()} TypeBeatz. All rights reserved.
          </p>
          <div className="flex gap-4">
            {['Terms', 'Privacy'].map(l => (
              <a key={l} href={`/${l.toLowerCase()}`}
                style={{ fontFamily: NM, fontSize: '0.8rem', lineHeight: LH_LABEL, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}
                className="hover:text-white transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
