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

/* Pricing Section */
function PricingSection({ handleCTA, handleUpgradeCTA, handleUnlimitedCTA, user }) {
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
            <button onClick={handleUnlimitedCTA} style={{ fontFamily: NM, fontWeight: 700, fontSize: '0.875rem', lineHeight: LH_LABEL, background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', border: 'none', color: '#000', borderRadius: 12, padding: '14px 0', cursor: 'pointer', width: '100%', boxShadow: '0 0 28px rgba(251,191,36,0.22)', outline: 'none' }}>
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
const NAV_H           = 60;
const HOW_SCROLL_STEP = 1200;
const CARD_H          = 700;
const CARD_W          = 880;
const CHAPTER_NAV_LEFT = 424;
const CHAPTER_NAV_W   = 220;
const CARD_GAP        = 48;
const CARD_LEFT       = CHAPTER_NAV_LEFT + CHAPTER_NAV_W + CARD_GAP; /* 692 */

/* ── Safari-style browser chrome ── */
function SafariChrome() {
  const sys = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  return (
    <div style={{ width: '100%', flexShrink: 0 }}>
      {/* Tab bar */}
      <div style={{
        height: 40, background: '#323232',
        borderBottom: '1px solid rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', padding: '0 14px', gap: 0,
      }}>
        {/* Traffic lights */}
        <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginRight: 20 }}>
          {[['#ff5f57','#e0443e'],['#ffbd2e','#dea123'],['#28c840','#1aab29']].map(([bg, shadow], ci) => (
            <div key={ci} style={{
              width: 12, height: 12, borderRadius: '50%', background: bg, flexShrink: 0,
              boxShadow: `inset 0 -0.5px 0 ${shadow}`,
            }} />
          ))}
        </div>
        {/* Active tab */}
        <div style={{
          height: 30, background: '#1e1e1e', borderRadius: '6px 6px 0 0',
          display: 'flex', alignItems: 'center', padding: '0 12px', gap: 7,
          minWidth: 180, maxWidth: 220,
          borderTop: '1px solid rgba(255,255,255,0.07)',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}>
          {/* Favicon */}
          <div style={{
            width: 14, height: 14, borderRadius: 3, flexShrink: 0,
            background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)',
          }} />
          <span style={{ color: 'rgba(255,255,255,0.78)', fontSize: 12, fontFamily: sys, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            TypeBeatz — Beat Video Generator
          </span>
        </div>
        {/* New tab + */}
        <div style={{ marginLeft: 6, width: 24, height: 24, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 17, lineHeight: 1 }}>+</div>
      </div>

      {/* Toolbar */}
      <div style={{
        height: 48, background: '#282828',
        borderBottom: '1px solid rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10,
      }}>
        {/* Back / Forward */}
        <div style={{ display: 'flex', gap: 2, marginRight: 4 }}>
          {['‹', '›'].map((ch, i) => (
            <div key={i} style={{
              width: 26, height: 26, borderRadius: 5, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: i === 0 ? 'rgba(255,255,255,0.26)' : 'rgba(255,255,255,0.55)',
              fontSize: 20, lineHeight: 1, cursor: 'default',
            }}>{ch}</div>
          ))}
        </div>
        {/* Reload */}
        <div style={{ width: 26, height: 26, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 14, marginRight: 6 }}>↻</div>
        {/* URL bar */}
        <div style={{
          flex: 1, height: 30,
          background: 'rgba(0,0,0,0.35)',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.09)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          {/* Lock */}
          <svg width="11" height="12" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.45, flexShrink: 0 }}>
            <rect x="3" y="11" width="18" height="11" rx="2" stroke="white" strokeWidth="2.2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
          <span style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, fontFamily: sys, letterSpacing: '-0.01em' }}>
            typebeatz.app
          </span>
        </div>
        {/* Right actions */}
        <div style={{ display: 'flex', gap: 4, marginLeft: 6 }}>
          {['⊕', '↑'].map((ic, i) => (
            <div key={i} style={{ width: 26, height: 26, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>{ic}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Step content mockups ── */
const STEP_CONTENTS = [
  /* Step 0: Upload */
  () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0f1e', padding: 40 }}>
      <div style={{ width: '100%', maxWidth: 680 }}>
        {/* Drop zone */}
        <div style={{
          border: '2px dashed rgba(59,130,246,0.4)', borderRadius: 18,
          padding: '40px 28px', textAlign: 'center', marginBottom: 28,
          background: 'rgba(59,130,246,0.04)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.9 }}>🎵</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, fontWeight: 600, marginBottom: 6, fontFamily: NM }}>
            Drop your files here
          </div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12.5, fontFamily: NM }}>
            MP3 beats + PNG artwork — up to 100 files
          </div>
        </div>
        {/* File list preview */}
        {[['🎵', 'travis_drip_type_beat.mp3', '5.2 MB'],['🖼️', 'artwork_drip_01.png', '1.8 MB'],['🎵', 'metro_vibes_type_beat.mp3', '4.7 MB']].map(([ic, name, size], i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
            borderRadius: 10, marginBottom: 6,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <span style={{ fontSize: 16 }}>{ic}</span>
            <span style={{ color: 'rgba(255,255,255,0.68)', fontSize: 12.5, fontFamily: NM, flex: 1 }}>{name}</span>
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11.5, fontFamily: NM }}>{size}</span>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(40,200,64,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#28c840', fontSize: 10 }}>✓</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
  /* Step 1: Review Pairs */
  () => (
    <div style={{ width: '100%', height: '100%', background: '#0a0f1e', padding: '32px 40px', overflowY: 'hidden' }}>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: NM, letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 18 }}>3 pairs ready</div>
      <div style={{ display: 'grid', gap: 14 }}>
        {[
          ['travis_drip_type_beat.mp3', 'artwork_drip_01.png', '#3b82f6'],
          ['metro_vibes_type_beat.mp3', 'cover_metro_dark.png', '#8b5cf6'],
          ['lil_wave_type_beat.mp3',    'wave_bg_artwork.png',  '#0ea5e9'],
        ].map(([audio, img, accent], i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px',
            borderRadius: 14, background: 'rgba(255,255,255,0.04)',
            border: `1px solid rgba(255,255,255,0.07)`,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.2)', fontFamily: NM, width: 20, textAlign: 'center' }}>{i + 1}</div>
            {/* Artwork thumbnail */}
            <div style={{ width: 48, height: 48, borderRadius: 8, background: `linear-gradient(135deg, ${accent}55, ${accent}22)`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🖼️</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: 'rgba(255,255,255,0.78)', fontSize: 13, fontFamily: NM, fontWeight: 600, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{audio}</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11.5, fontFamily: NM }}>{img}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.25)', fontSize: 12, fontFamily: NM }}>
              <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: 11 }}>swap</span>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(40,200,64,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#28c840', fontSize: 14 }}>✓</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
  /* Step 2: Generate */
  () => (
    <div style={{ width: '100%', height: '100%', background: '#0a0f1e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, padding: 48 }}>
      <div style={{ fontSize: 56, lineHeight: 1 }}>😴</div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, fontFamily: NM, marginBottom: 6 }}>Generating your videos…</div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: NM }}>You sleep, we work. 3 of 4 complete.</div>
      </div>
      {/* Progress bars */}
      <div style={{ width: '100%', maxWidth: 540, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          ['travis_drip_type_beat', 100, '#28c840'],
          ['metro_vibes_type_beat', 100, '#28c840'],
          ['lil_wave_type_beat',    100, '#28c840'],
          ['dark_vibes_type_beat',  62,  '#3b82f6'],
        ].map(([name, pct, color], i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontFamily: NM }}>{name}</span>
              <span style={{ color: pct === 100 ? '#28c840' : 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: NM }}>{pct === 100 ? '✓ Done' : `${pct}%`}</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, borderRadius: 2, background: color, transition: 'width 0.6s ease' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
  /* Step 3: Download */
  () => (
    <div style={{ width: '100%', height: '100%', background: '#0a0f1e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: 48 }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(40,200,64,0.12)', border: '2px solid rgba(40,200,64,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>✅</div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#fff', fontSize: 20, fontWeight: 800, fontFamily: NM, marginBottom: 6 }}>All 4 videos ready!</div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13.5, fontFamily: NM }}>Ready to upload straight to YouTube</div>
      </div>
      {/* Download button */}
      <div style={{
        padding: '14px 36px', borderRadius: 12, cursor: 'pointer',
        background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)',
        color: '#fff', fontFamily: NM, fontWeight: 700, fontSize: 15,
        boxShadow: '0 8px 32px rgba(59,130,246,0.35)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 18 }}>📥</span> Download All (4 MP4s)
      </div>
      {/* File list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 480 }}>
        {['travis_drip_type_beat.mp4','metro_vibes_type_beat.mp4','lil_wave_type_beat.mp4','dark_vibes_type_beat.mp4'].map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ color: '#28c840', fontSize: 13 }}>✓</span>
            <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12.5, fontFamily: NM, flex: 1 }}>{f}</span>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, fontFamily: NM }}>MP4</span>
          </div>
        ))}
      </div>
    </div>
  ),
];

function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [animKey, setAnimKey]       = useState(0);
  const stickyWrapRef = useRef(null);
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

  useEffect(() => {
    let rafId = null;
    const update = () => {
      if (!clickLockRef.current) {
        const el = stickyWrapRef.current;
        if (el) {
          const rect        = el.getBoundingClientRect();
          const totalScroll = steps.length * HOW_SCROLL_STEP;
          /* scrolled = how far the flex container top has travelled above the viewport top */
          const scrolled    = Math.max(0, -rect.top);
          const progress    = totalScroll > 0 ? Math.min(scrolled / totalScroll, 1) : 0;
          const newStep     = Math.min(Math.floor(progress * steps.length), steps.length - 1);
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

  const StepContent   = STEP_CONTENTS[activeStep];
  /* Nav approximate height: 4 items × ~145px each + 1px bottom border */
  const NAV_APPROX_H  = 580;
  /* Stick the nav when it is vertically centred in the viewport */
  const navStickyTop  = `calc(50vh - ${NAV_APPROX_H / 2}px)`;
  /* Scroll zone tall enough for all steps + lead-in + lead-out */
  const scrollZoneH   = `calc(${steps.length * HOW_SCROLL_STEP}px + 200vh)`;

  return (
    <div id="how-it-works" style={{ background: '#000' }}>

      {/* Title — normal flow, scrolls away, aligned with chapter nav left edge */}
      <div style={{ paddingLeft: CHAPTER_NAV_LEFT, paddingRight: 40, paddingTop: 80, paddingBottom: 48 }}>
        <h2 style={{ fontFamily: NM, fontWeight: 900, fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', lineHeight: LH_HEAD, letterSpacing: '-0.03em', color: '#fff', margin: 0 }}>
          How it works
        </h2>
      </div>

      {/*
        Two-column flex scroll zone.
        — No overflow:hidden here so both sticky children can stick to the viewport.
        — The card sticky div has its own overflow:hidden to clip the right-bleeding card.
      */}
      <div
        ref={stickyWrapRef}
        style={{
          position: 'relative',
          height: scrollZoneH,
          display: 'flex',
          alignItems: 'flex-start',
          background: '#000',
        }}
      >
        {/* Left margin spacer */}
        <div style={{ flexShrink: 0, width: CHAPTER_NAV_LEFT }} />

        {/* ── Chapter nav: independently sticky, sticks when vertically centred ── */}
        <div style={{
          flexShrink: 0,
          width: CHAPTER_NAV_W,
          position: 'sticky',
          top: navStickyTop,
          alignSelf: 'flex-start',
          zIndex: 3,
        }}>
          {steps.map((step, i) => {
            const active = i === activeStep;
            return (
              <button key={i} onClick={() => goToStep(i)}
                style={{
                  width: '100%', textAlign: 'left', background: 'none', border: 'none',
                  borderTop: '1px solid rgba(255,255,255,0.09)',
                  padding: '20px 0', cursor: 'pointer', display: 'flex',
                  flexDirection: 'column', gap: 9, outline: 'none',
                }}>
                <span style={{
                  fontFamily: NM, fontWeight: 700, fontSize: 11,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: active ? '#fff' : 'rgba(255,255,255,0.22)',
                  transition: 'color 0.35s ease', lineHeight: 1.3,
                }}>
                  {step.title}
                </span>
                <span style={{
                  fontFamily: NM, fontSize: 14, lineHeight: 1.6,
                  color: active ? 'rgba(255,255,255,0.58)' : 'rgba(255,255,255,0.14)',
                  transition: 'color 0.35s ease', display: 'block', maxWidth: CHAPTER_NAV_W,
                }}>
                  {step.desc}
                </span>
              </button>
            );
          })}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.09)' }} />
        </div>

        {/* Gap between nav and card */}
        <div style={{ flexShrink: 0, width: CARD_GAP }} />

        {/*
          ── Card area: independently sticky, sticks just below the navbar ──
          Height fills the viewport below the navbar so the card can be centred inside.
          overflow:hidden on this div clips the card that bleeds off the right edge.
          The div itself is exactly (100vw - CARD_LEFT) wide so it never causes
          horizontal scroll, but the 1209px-wide card inside is clipped at the right.
        */}
        <div style={{
          flexShrink: 0,
          position: 'sticky',
          top: NAV_H,
          alignSelf: 'flex-start',
          width: `calc(100vw - ${CARD_LEFT}px)`,
          height: `calc(100vh - ${NAV_H}px)`,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          zIndex: 2,
        }}>
          <style>{`
            @keyframes howCardSlideIn {
              from { opacity: 0; transform: translateX(28px); }
              to   { opacity: 1; transform: translateX(0); }
            }
          `}</style>
          <div
            key={animKey}
            style={{
              flexShrink: 0,
              width: CARD_W,
              height: CARD_H,
              borderRadius: 14,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              background: '#1e1e1e',
              boxShadow: '0 40px 100px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.07)',
              animation: 'howCardSlideIn 0.38s ease forwards',
            }}>
            <SafariChrome />
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <StepContent />
            </div>
          </div>
        </div>

      </div>
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
    { ref: starsRef, speed: 0.25, mode: 'bgY', yOffset: -200 },
    { ref: glowRef,  speed: 0.5,  mode: 'translateY' },
  ]);
  useStarsScrollReveal(starsRef);

  const handleCTA = () => { user ? navigate('/app') : login(); };
  const handleUpgradeCTA = () => {
    if (!user) { login(); return; }
    if (user.role === 'pro' || user.role === 'unlimited' || user.role === 'admin') navigate('/app');
    else navigate('/app?upgrade=true');
  };
  const handleUnlimitedCTA = () => {
    if (!user) { login(); return; }
    if (user.role === 'unlimited' || user.role === 'admin') navigate('/app');
    else navigate('/app?upgrade=unlimited');
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
          backgroundPosition: 'center calc(50% - 200px)',
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

        {/* Stats row — hidden until user scrolls 100px, then blur-to-focus reveal */}
        <div className="relative flex flex-wrap justify-center gap-x-14 gap-y-8 mt-20" style={{ zIndex: 2 }}>
          <BlurReveal delay={0} minScroll={100}>
            <Stat prefix="up to" val="100" label="videos per batch" />
          </BlurReveal>
          <BlurReveal delay={200} minScroll={100}>
            <Stat prefix="create" val="∞" label="videos" />
          </BlurReveal>
          <BlurReveal delay={400} minScroll={100}>
            <Stat prefix="up to" val="4K" label="video quality" />
          </BlurReveal>
          <BlurReveal delay={600} minScroll={100}>
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
      <PricingSection handleCTA={handleCTA} handleUpgradeCTA={handleUpgradeCTA} handleUnlimitedCTA={handleUnlimitedCTA} user={user} />

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
