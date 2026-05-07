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

/* Line height tokens */
const LH_BODY  = 1.6;   /* body text, descriptions */
const LH_LABEL = 1.5;   /* small labels, nav, badges */
const LH_HEAD  = 1.05;  /* section h2 headings */
const LH_HERO  = 0.9;   /* large display hero h1 */

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

/*
  Stat block — prefix row is ALWAYS rendered (visibility: hidden when absent)
  so all big numbers sit on the exact same baseline regardless of prefix.
*/
function Stat({ prefix, val, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      {/* Fixed-height prefix row — hidden when no prefix so numbers stay aligned */}
      <div style={{
        fontFamily: NM,
        fontSize: '0.72rem',
        fontWeight: 500,
        color: 'rgba(255,255,255,0.38)',
        lineHeight: LH_LABEL,
        letterSpacing: '0.04em',
        marginBottom: 4,
        visibility: prefix ? 'visible' : 'hidden',
        userSelect: 'none',
      }}>
        {prefix ?? 'up to'}
      </div>
      <WordReveal text={val} style={{
        fontFamily: NM,
        fontWeight: 900,
        fontSize: 'clamp(1.9rem, 3vw, 2.6rem)',
        lineHeight: 1,
        letterSpacing: '-0.04em',
        color: '#fff',
        display: 'block',
      }} />
      <WordReveal text={label} style={{
        fontFamily: NM,
        fontSize: '0.78rem',
        color: 'rgba(255,255,255,0.35)',
        marginTop: 5,
        letterSpacing: '0.02em',
        lineHeight: LH_LABEL,
        display: 'block',
      }} />
    </div>
  );
}

/* ── Word-by-word reveal via Intersection Observer ── */
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

/* ── Blur-to-focus reveal (Intersection Observer) ── */
function BlurReveal({ children, delay = 0, style = {} }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.3, rootMargin: '0px 0px -6% 0px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} style={{
      filter:     visible ? 'blur(0px)'   : 'blur(12px)',
      opacity:    visible ? 1             : 0.2,
      transition: `filter 0.8s ease-out ${delay}ms, opacity 0.8s ease-out ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ── Scroll-Stacked Pricing Cards ── */
function PricingSection({ handleCTA, handleUpgradeCTA, user }) {
  const isPro = user?.role === 'pro' || user?.role === 'admin';
  return (
    <section data-bg-color="#030308" id="pricing" style={{ padding: '112px 0' }}>
      <div style={{ paddingLeft: 424, paddingRight: 40 }}>

        {/* Section header */}
        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.55 }}
          style={{ marginBottom: 64 }}>
          <div style={{ fontFamily: NM, fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: 14 }}>Pricing</div>
          <h2 style={{ fontFamily: NM, fontWeight: 900, fontSize: 'clamp(2rem, 4.5vw, 3rem)', lineHeight: LH_HEAD, letterSpacing: '-0.03em', marginBottom: 14, color: '#fff' }}>
            Simple pricing.
          </h2>
          <p style={{ fontFamily: NM, fontSize: '1rem', lineHeight: LH_BODY, color: 'rgba(255,255,255,0.4)', maxWidth: 400 }}>
            Start free, upgrade when you're ready to go unlimited. No hidden fees, no surprises.
          </p>
        </motion.div>

        {/* Card grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, maxWidth: 740 }}>

          {/* Free card */}
          <motion.div initial={{ opacity: 0, y: 44 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.05 }}
            style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, padding: '36px 32px', display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ fontFamily: NM, fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: 20 }}>Free</div>
            <div style={{ fontFamily: NM, fontWeight: 900, fontSize: '3rem', lineHeight: 1, letterSpacing: '-0.05em', marginBottom: 6, color: '#fff' }}>
              $0<span style={{ fontSize: '1rem', fontWeight: 400, color: 'rgba(255,255,255,0.28)', letterSpacing: 0 }}>/mo</span>
            </div>
            <p style={{ fontFamily: NM, fontSize: '0.82rem', color: 'rgba(255,255,255,0.35)', lineHeight: LH_BODY, marginBottom: 28 }}>
              Perfect for getting started
            </p>
            <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 24 }} />
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px', display: 'flex', flexDirection: 'column', gap: 11, flex: 1 }}>
              {[
                ['5 videos per month', true],
                ['Credits reset on the 1st', true],
                ['All core features', true],
                ['Black & white backgrounds', true],
                ['HD 1080p output', true],
              ].map(([item]) => (
                <li key={item} style={{ fontFamily: NM, fontSize: '0.875rem', lineHeight: LH_BODY, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#4ade80', flexShrink: 0 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <button onClick={handleCTA} style={{ fontFamily: NM, fontWeight: 600, fontSize: '0.875rem', lineHeight: LH_LABEL, color: 'rgba(255,255,255,0.8)', background: 'transparent', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 12, padding: '14px 0', cursor: 'pointer', width: '100%', transition: 'border-color 0.2s, color 0.2s' }}>
              {user ? "You're on Free" : 'Get Started — Free'}
            </button>
          </motion.div>

          {/* PRO card */}
          <motion.div initial={{ opacity: 0, y: 44 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.18 }}
            style={{ background: 'linear-gradient(160deg, rgba(59,130,246,0.14) 0%, rgba(14,165,233,0.07) 100%)', border: '1px solid rgba(59,130,246,0.38)', borderRadius: 20, padding: '36px 32px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            {/* Glow accent */}
            <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontFamily: NM, fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)' }}>PRO</div>
              <div style={{ background: BTN_BG, borderRadius: 999, padding: '4px 10px', fontFamily: NM, fontSize: '0.58rem', fontWeight: 700, color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Most Popular</div>
            </div>
            <div style={{ fontFamily: NM, fontWeight: 900, fontSize: '3rem', lineHeight: 1, letterSpacing: '-0.05em', marginBottom: 6, color: '#fff' }}>
              $9.99<span style={{ fontSize: '1rem', fontWeight: 400, color: 'rgba(255,255,255,0.28)', letterSpacing: 0 }}>/mo</span>
            </div>
            <p style={{ fontFamily: NM, fontSize: '0.82rem', color: 'rgba(255,255,255,0.35)', lineHeight: LH_BODY, marginBottom: 28 }}>
              For producers who want to scale
            </p>
            <div style={{ width: '100%', height: 1, background: 'rgba(59,130,246,0.2)', marginBottom: 24 }} />
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px', display: 'flex', flexDirection: 'column', gap: 11, flex: 1 }}>
              {[
                'Unlimited video generation',
                'No monthly limits ever',
                'Up to 4K video quality',
                'Custom photo backgrounds',
                'Cancel anytime',
              ].map(item => (
                <li key={item} style={{ fontFamily: NM, fontSize: '0.875rem', lineHeight: LH_BODY, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#38bdf8', flexShrink: 0 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <button onClick={handleUpgradeCTA} style={{ fontFamily: NM, fontWeight: 700, fontSize: '0.875rem', lineHeight: LH_LABEL, background: BTN_BG, border: 'none', color: '#fff', borderRadius: 12, padding: '14px 0', cursor: 'pointer', width: '100%', boxShadow: '0 0 28px rgba(59,130,246,0.28)' }}>
              {isPro ? "You're on PRO ⭐" : 'Upgrade to PRO'}
            </button>
            <p style={{ fontFamily: NM, fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 14 }}>
              Cancel anytime · No commitment
            </p>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

/* ── How It Works — per-step scroll-driven rows ── */
const GT_FONT = '"GT Walsheim Framer Medium", "GT Walsheim Framer Medium Placeholder", sans-serif';

function HowItWorksSection() {
  const rowRefs   = useRef([]);
  const cardRefs  = useRef([]);
  const [revealed, setRevealed] = useState(new Set());

  /* Single rAF scroll loop — updates all cards' scale + slide */
  useEffect(() => {
    let raf = null;
    const tick = () => {
      const wh = window.innerHeight;
      rowRefs.current.forEach((row, i) => {
        const card = cardRefs.current[i];
        if (!row || !card) return;
        const rect = row.getBoundingClientRect();
        const p = Math.min(Math.max((wh - rect.top) / 300, 0), 1);
        card.style.transform = `scale(${0.85 + p * 0.15}) translateX(${(1 - p) * 64}px)`;
        card.style.opacity   = String(0.5 + p * 0.5);
      });
      raf = null;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };
    window.addEventListener('scroll', onScroll, { passive: true });
    tick();
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  /* IntersectionObserver — reveals left-side text one by one */
  useEffect(() => {
    const observers = rowRefs.current.map((el, i) => {
      if (!el) return null;
      const obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) setRevealed(prev => new Set([...prev, i]));
      }, { threshold: 0.25 });
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach(o => o?.disconnect());
  }, []);

  return (
    <section data-bg-color="#02020a" id="how-it-works" style={{ paddingTop: 96, paddingBottom: 0 }}>

      {/* Section heading — left edge at 424 px */}
      <div style={{ paddingLeft: 424, paddingRight: 40, marginBottom: 72 }}>
        <h2 style={{
          fontFamily: GT_FONT, fontWeight: 500,
          fontSize: '62px', lineHeight: '62px', letterSpacing: '-3.1px',
          color: '#fff', margin: 0, width: 304,
        }}>
          How it<br />works
        </h2>
      </div>

      {/* One full-viewport row per step */}
      {steps.map((s, i) => (
        <div
          key={i}
          ref={el => { rowRefs.current[i] = el; }}
          style={{
            minHeight: '80vh',
            paddingLeft: 424,
            paddingRight: 40,
            paddingTop: 48,
            paddingBottom: 48,
            display: 'flex',
            alignItems: 'center',
            gap: 64,
            borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)',
          }}>

          {/* ── Left: step info (304 px, matches heading width) ── */}
          <div style={{
            width: 304, flexShrink: 0,
            opacity:    revealed.has(i) ? 1 : 0,
            transform:  revealed.has(i) ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.65s ease, transform 0.65s ease',
          }}>
            <span style={{
              fontFamily: NM, fontWeight: 900,
              fontSize: '0.78rem', letterSpacing: '0.1em',
              color: '#fff', display: 'block', marginBottom: 16,
            }}>{s.num}</span>
            <h3 style={{
              fontFamily: NM, fontWeight: 700,
              fontSize: '1.3rem', lineHeight: 1.2, letterSpacing: '-0.025em',
              color: '#fff', marginBottom: 14,
            }}>{s.title}</h3>
            <p style={{
              fontFamily: NM, fontSize: '0.9rem',
              lineHeight: 1.7, color: 'rgba(255,255,255,0.42)',
            }}>{s.desc}</p>
          </div>

          {/* ── Right: detail card (scroll-linked scale + slide from right) ── */}
          <div
            ref={el => { cardRefs.current[i] = el; }}
            style={{
              flex: 1, minWidth: 0,
              opacity: 0.5,
              transform: 'scale(0.85) translateX(64px)',
              willChange: 'transform, opacity',
            }}>
            <div style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 24,
              padding: '52px 48px',
              minHeight: 300,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
            }}>

              {/* Decorative corner glow */}
              <div style={{
                position: 'absolute', top: -60, right: -60,
                width: 200, height: 200, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />

              {/* Ghost step number watermark */}
              <div style={{
                position: 'absolute', bottom: 24, right: 36,
                fontFamily: NM, fontWeight: 900,
                fontSize: 'clamp(5rem, 9vw, 8rem)',
                lineHeight: 1, letterSpacing: '-0.06em',
                color: 'rgba(255,255,255,0.04)',
                userSelect: 'none', pointerEvents: 'none',
              }}>{s.num}</div>

              {/* Card content */}
              <div>
                <span style={{
                  fontFamily: NM, fontWeight: 900,
                  fontSize: '0.72rem', letterSpacing: '0.12em',
                  color: 'rgba(255,255,255,0.25)',
                  textTransform: 'uppercase', display: 'block', marginBottom: 28,
                }}>Step {i + 1} of {steps.length}</span>

                <h3 style={{
                  fontFamily: NM, fontWeight: 800,
                  fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
                  lineHeight: 1.1, letterSpacing: '-0.035em',
                  color: '#fff', marginBottom: 16,
                }}>{s.title}</h3>

                <p style={{
                  fontFamily: NM, fontSize: '1rem',
                  lineHeight: 1.7, color: 'rgba(255,255,255,0.42)',
                  maxWidth: 420,
                }}>{s.desc}</p>
              </div>

              {/* Progress bar footer */}
              <div style={{
                marginTop: 48, paddingTop: 24,
                borderTop: '1px solid rgba(255,255,255,0.07)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {steps.map((_, j) => (
                  <div key={j} style={{
                    height: 3, borderRadius: 2,
                    flex: j === i ? 3 : 1,
                    background: j === i ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.1)',
                    transition: 'flex 0.3s ease',
                  }} />
                ))}
              </div>
            </div>
          </div>

        </div>
      ))}
    </section>
  );
}

/* ── Multi-layer parallax (rAF-throttled) ── */
function useParallax(layers) {
  useEffect(() => {
    let rafId = null;
    const update = () => {
      const sy = window.scrollY;
      layers.forEach(({ ref, speed, mode }) => {
        const el = ref.current;
        if (!el) return;
        if (mode === 'bgY') {
          el.style.backgroundPositionY = `calc(82% + ${sy * speed}px)`;
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

/* ── Word-by-word heading reveal (Intersection Observer) ── */
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

/* ── Scroll-driven background transitions ── */
function useScrollBg(wrapperRef) {
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    el.style.transition = 'background-color 0.6s ease';

    const onScroll = () => {
      const sections = Array.from(el.querySelectorAll('[data-bg-color]'));
      let best = null, bestVis = 0;
      sections.forEach(sec => {
        const r = sec.getBoundingClientRect();
        const vis = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
        if (vis > bestVis) { bestVis = vis; best = sec; }
      });
      if (best) el.style.backgroundColor = best.dataset.bgColor;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
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
  { num: '01', title: 'Upload your files', desc: 'Drag and drop your beat MP3s and artwork PNGs — up to 100 files at a time.' },
  { num: '02', title: 'Review your pairs', desc: 'TypeBeatz auto-pairs audio with images. Swap anything around if needed.' },
  { num: '03', title: 'Hit Generate', desc: 'Sit back. The app processes every video in the background while you do other things.' },
  { num: '04', title: 'Download & upload', desc: 'Your videos are ready. Download them all and upload directly to YouTube.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const wrapperRef = useRef(null);
  const starsRef   = useRef(null);
  const glowRef    = useRef(null);
  useScrollBg(wrapperRef);
  useParallax([
    { ref: starsRef, speed: 0.3, mode: 'bgY' },
    { ref: glowRef,  speed: 0.6, mode: 'translateY' },
  ]);

  const handleCTA = () => { user ? navigate('/app') : login(); };
  const handleUpgradeCTA = () => {
    if (!user) login();
    else if (user.role === 'pro' || user.role === 'admin') navigate('/app');
    else navigate('/app?upgrade=true');
  };

  return (
    <div ref={wrapperRef} className="min-h-screen text-white overflow-x-hidden" style={{ background: '#000', fontFamily: NM }}>

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
      <section data-bg-color="#000000" className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center pt-20" style={{ overflow: 'hidden' }}>

        {/* Stars background image — always visible, centered on the stats row */}
        <div ref={starsRef} className="absolute inset-0 pointer-events-none" style={{
          zIndex: 0,
          opacity: 1,
          backgroundImage: `url(${starsBg})`,
          backgroundSize: '120%',
          backgroundPosition: 'center 82%',
          backgroundRepeat: 'no-repeat',
        }} />

        {/* Subtle blue glow over stars — mid-layer parallax 0.6x */}
        <div ref={glowRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 0, willChange: 'transform' }}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 65%)' }} />
        </div>

        {/* Vignette — strong fade to black on all edges */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1, background: 'radial-gradient(ellipse 70% 65% at 50% 50%, transparent 20%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.88) 72%, #000 90%)' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1, background: 'linear-gradient(to right, #000 0%, rgba(0,0,0,0.7) 8%, transparent 22%, transparent 78%, rgba(0,0,0,0.7) 92%, #000 100%)' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1, background: 'linear-gradient(to bottom, #000 0%, rgba(0,0,0,0.6) 8%, transparent 20%, transparent 72%, rgba(0,0,0,0.8) 88%, #000 100%)' }} />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          className="relative" style={{ zIndex: 2 }}>

          {/* Badge — Neue Montreal small */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 mb-8"
            style={{ fontFamily: NM, fontSize: '0.8rem', fontWeight: 500, lineHeight: LH_LABEL, letterSpacing: '0.01em' }}>
            <span>🎬</span>
            <span>The fastest way to fill your YouTube channel.</span>
          </div>

          {/* Hero headline — GT Walsheim Framer Medium */}
          <h1 style={{
            fontFamily: '"GT Walsheim Framer Medium", "GT Walsheim Framer Medium Placeholder", sans-serif',
            fontWeight: 500,
            fontSize: '110px',
            lineHeight: '93.5px',
            letterSpacing: '-2px',
            fontStyle: 'normal',
            textTransform: 'none',
            marginBottom: '2rem',
          }}>
            Make 100<br />
            <span style={{ color: '#ffffff' }}>
              type beat videos
            </span><br />
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

        {/* Stats — blur-to-focus reveal with stagger */}
        <div className="relative flex flex-wrap justify-center gap-x-14 gap-y-8 mt-20" style={{ zIndex: 2 }}>
          <BlurReveal delay={0}>
            <Stat prefix="up to" val="100" label="videos per batch" />
          </BlurReveal>
          <BlurReveal delay={150}>
            <Stat prefix="create" val="∞" label="videos" />
          </BlurReveal>
          <BlurReveal delay={300}>
            <Stat prefix="up to" val="4K" label="video quality" />
          </BlurReveal>
          <BlurReveal delay={450}>
            <Stat prefix={null} val="Custom" label="backgrounds" />
          </BlurReveal>
        </div>
      </section>

      {/* ── Features ── */}
      <section data-bg-color="#05050a" className="py-24 px-6 max-w-6xl mx-auto">
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

      {/* ── Drop zone preview ── */}
      <section data-bg-color="#05050a" className="py-24 px-6 max-w-5xl mx-auto text-center">
        <h2 style={{ fontFamily: NM, fontWeight: 900, marginBottom: '1rem', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', lineHeight: LH_HEAD, letterSpacing: '-0.03em' }}>
          Clean, focused, powerful
        </h2>
        <p style={{ fontFamily: NM, lineHeight: LH_BODY, color: 'rgba(255,255,255,0.45)', marginBottom: '2.5rem' }}>
          The whole workflow in one screen. Drop files, review pairs, generate.
        </p>
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
      </section>

      {/* ── Pricing ── */}
      <PricingSection
        handleCTA={handleCTA}
        handleUpgradeCTA={handleUpgradeCTA}
        user={user}
      />

      {/* ── CTA banner ── */}
      <section data-bg-color="#02020a" className="py-24 px-6">
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
      <footer className="py-8 px-6 border-t border-white/[0.06]">
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
