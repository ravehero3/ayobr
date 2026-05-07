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
  useScrollBg(wrapperRef);

  const handleCTA = () => { user ? navigate('/app') : login(); };
  const handleUpgradeCTA = () => {
    if (!user) login();
    else if (user.role === 'pro' || user.role === 'admin') navigate('/app');
    else navigate('/app?upgrade=true');
  };

  return (
    <div ref={wrapperRef} className="min-h-screen text-white overflow-x-hidden" style={{ background: '#000', fontFamily: NM }}>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
        style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
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

        {/* Stars background image */}
        <div className="absolute inset-0 pointer-events-none" style={{
          zIndex: 0,
          backgroundImage: `url(${starsBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }} />

        {/* Subtle blue glow over stars */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
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
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #3b82f6, #0ea5e9)' }}>
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

        {/* Stats — numbers baseline-aligned via hidden prefix spacer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="relative flex flex-wrap justify-center gap-x-14 gap-y-8 mt-20" style={{ zIndex: 2 }}>
          <Stat prefix="up to" val="100" label="videos per batch" />
          <Stat prefix="create" val="∞" label="videos" />
          <Stat prefix="up to" val="4K"  label="video quality" />
          <Stat prefix={null}  val="Custom" label="backgrounds" />
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section data-bg-color="#05050a" className="py-24 px-6 max-w-6xl mx-auto">
        <h2 style={{ fontFamily: NM, fontWeight: 900, textAlign: 'center', marginBottom: '1rem', fontSize: 'clamp(1.8rem, 4vw, 3rem)', lineHeight: LH_HEAD, letterSpacing: '-0.03em' }}>
          Everything you need to scale<br />your YouTube channel
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
      <section data-bg-color="#02020a" id="how-it-works" className="py-24 px-6 max-w-4xl mx-auto">
        <h2 style={{ fontFamily: NM, fontWeight: 900, textAlign: 'center', marginBottom: '4rem', fontSize: 'clamp(1.8rem, 4vw, 3rem)', lineHeight: LH_HEAD, letterSpacing: '-0.03em' }}>
          How it works
        </h2>
        <div className="space-y-12">
          {steps.map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="flex items-start gap-8">
              <div style={{ fontFamily: NM, fontWeight: 900, fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', lineHeight: LH_HERO, letterSpacing: '-0.05em', flexShrink: 0, backgroundImage: 'linear-gradient(135deg, #3b82f6, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {s.num}
              </div>
              <div>
                <h3 style={{ fontFamily: NM, fontWeight: 700, fontSize: '1.15rem', lineHeight: LH_HEAD, letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>{s.title}</h3>
                <p style={{ fontFamily: NM, lineHeight: LH_BODY, color: 'rgba(255,255,255,0.45)' }}>{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

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
      <section data-bg-color="#000000" id="pricing" className="py-24 px-6 max-w-5xl mx-auto">
        <h2 style={{ fontFamily: NM, fontWeight: 900, textAlign: 'center', marginBottom: '1rem', fontSize: 'clamp(1.8rem, 4vw, 3rem)', lineHeight: LH_HEAD, letterSpacing: '-0.03em' }}>
          Simple pricing
        </h2>
        <p style={{ fontFamily: NM, lineHeight: LH_BODY, color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginBottom: '4rem' }}>
          Start free. Go unlimited when you're ready.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">

          {/* Free */}
          <div className="rounded-2xl p-8 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <h3 style={{ fontFamily: NM, fontWeight: 800, fontSize: '1.2rem', lineHeight: LH_HEAD, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Free</h3>
            <div style={{ fontFamily: NM, fontWeight: 900, fontSize: '2.6rem', lineHeight: 1, letterSpacing: '-0.05em', marginBottom: '1.5rem' }}>
              $0<span style={{ fontSize: '1rem', fontWeight: 400, lineHeight: LH_BODY, color: 'rgba(255,255,255,0.35)' }}>/mo</span>
            </div>
            <ul className="space-y-3 mb-8">
              {['5 videos per month', 'Credits reset on the 1st', 'All core features', 'Black & white backgrounds', 'HD 1080p output'].map(item => (
                <li key={item} className="flex items-center gap-2"
                  style={{ fontFamily: NM, fontSize: '0.875rem', lineHeight: LH_BODY, color: 'rgba(255,255,255,0.7)' }}>
                  <span style={{ color: '#4ade80' }}>✓</span>{item}
                </li>
              ))}
            </ul>
            <button onClick={handleCTA}
              className="w-full py-3 rounded-xl border border-white/20 hover:border-white/40 transition-colors"
              style={{ fontFamily: NM, fontWeight: 600, lineHeight: LH_LABEL, color: '#fff', background: 'transparent', cursor: 'pointer' }}>
              {user ? "You're on Free" : 'Get Started'}
            </button>
          </div>

          {/* PRO */}
          <div className="rounded-2xl p-8 border border-blue-500/40 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(14,165,233,0.1))' }}>
            <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-blue-500"
              style={{ fontFamily: NM, fontWeight: 700, fontSize: '0.7rem', lineHeight: LH_LABEL, color: '#fff' }}>
              POPULAR
            </div>
            <h3 style={{ fontFamily: NM, fontWeight: 800, fontSize: '1.2rem', lineHeight: LH_HEAD, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>PRO</h3>
            <div style={{ fontFamily: NM, fontWeight: 900, fontSize: '2.6rem', lineHeight: 1, letterSpacing: '-0.05em', marginBottom: '1.5rem' }}>
              $9.99<span style={{ fontSize: '1rem', fontWeight: 400, lineHeight: LH_BODY, color: 'rgba(255,255,255,0.35)' }}>/mo</span>
            </div>
            <ul className="space-y-3 mb-8">
              {['Unlimited video generation', 'No monthly limits ever', 'Up to 4K video quality', 'Custom photo backgrounds', 'Cancel anytime'].map(item => (
                <li key={item} className="flex items-center gap-2"
                  style={{ fontFamily: NM, fontSize: '0.875rem', lineHeight: LH_BODY, color: 'rgba(255,255,255,0.7)' }}>
                  <span style={{ color: '#38bdf8' }}>✓</span>{item}
                </li>
              ))}
            </ul>
            <button onClick={handleUpgradeCTA}
              className="w-full py-3 rounded-xl transition-all hover:scale-105"
              style={{ fontFamily: NM, fontWeight: 700, lineHeight: LH_LABEL, background: BTN_BG, border: 'none', color: '#fff', cursor: 'pointer' }}>
              {user?.role === 'pro' || user?.role === 'admin' ? "You're on PRO ⭐" : 'Upgrade to PRO'}
            </button>
          </div>
        </div>
      </section>

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
