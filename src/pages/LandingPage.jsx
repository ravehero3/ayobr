import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import typebeatLogo from '../assets/typebeatz logo 2 white version_1754509091303.png';

const DRUK      = "'Druk-Bold', 'Anton', Impact, sans-serif";
const DRUK_WIDE = "'Druk-WideMedium', 'Anton', Impact, sans-serif";
const SCRIPT    = "'Satisfy', cursive";
const BTN_BG    = 'linear-gradient(135deg, #3b82f6, #0ea5e9)';
const BTN_GLOW  = '0 0 40px rgba(59,130,246,0.35)';

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

/* Stat block: "up to" in script above number, all left-aligned */
function Stat({ prefix, val, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      {prefix && (
        <div style={{ fontFamily: SCRIPT, fontSize: '0.82rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1, marginBottom: 4 }}>
          {prefix}
        </div>
      )}
      <div style={{ fontFamily: DRUK, fontWeight: 700, textTransform: 'uppercase', fontSize: 'clamp(1.9rem, 3vw, 2.6rem)', lineHeight: 1, letterSpacing: '-0.01em', color: '#fff' }}>
        {val}
      </div>
      <div style={{ fontFamily: DRUK_WIDE, fontSize: '11px', lineHeight: '14px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginTop: 6, letterSpacing: '0.06em' }}>
        {label}
      </div>
    </div>
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
  { num: '01', title: 'Upload your files', desc: 'Drag and drop your beat MP3s and artwork PNGs — up to 100 files at a time.' },
  { num: '02', title: 'Review your pairs', desc: 'TypeBeatz auto-pairs audio with images. Swap anything around if needed.' },
  { num: '03', title: 'Hit Generate', desc: 'Sit back. The app processes every video in the background while you do other things.' },
  { num: '04', title: 'Download & upload', desc: 'Your videos are ready. Download them all and upload directly to YouTube.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const handleCTA = () => { user ? navigate('/app') : login(); };
  const handleUpgradeCTA = () => {
    if (!user) login();
    else if (user.role === 'pro' || user.role === 'admin') navigate('/app');
    else navigate('/app?upgrade=true');
  };

  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: '#000' }}>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
        style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <img src={typebeatLogo} alt="TypeBeatz" style={{ height: 20 }} />
        <div className="flex items-center gap-6">
          <a href="#pricing"
            style={{ fontFamily: DRUK_WIDE, fontSize: 14, lineHeight: '17px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.05em', textDecoration: 'none' }}
            className="hover:text-white transition-colors">
            Pricing
          </a>
          {user ? (
            <button onClick={() => navigate('/app')}
              style={{ fontFamily: DRUK_WIDE, fontSize: 14, lineHeight: '17px', textTransform: 'uppercase', letterSpacing: '0.05em', background: BTN_BG, border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>
              Open App
            </button>
          ) : (
            <button onClick={login}
              style={{ fontFamily: DRUK_WIDE, fontSize: 14, lineHeight: '17px', textTransform: 'uppercase', letterSpacing: '0.05em', background: BTN_BG, border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center pt-20" style={{ overflow: 'hidden' }}>

        {/* Central glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.13) 0%, transparent 65%)' }} />
        </div>

        {/* Vignette — edges fade to #000 */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1, background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 38%, rgba(0,0,0,0.5) 62%, rgba(0,0,0,0.9) 83%, #000 100%)' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1, background: 'linear-gradient(to right, #000 0%, transparent 12%, transparent 88%, #000 100%)' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1, background: 'linear-gradient(to bottom, #000 0%, transparent 10%, transparent 80%, #000 100%)' }} />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          className="relative" style={{ zIndex: 2 }}>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 mb-8"
            style={{ fontFamily: SCRIPT, fontSize: '1rem' }}>
            <span>🎬</span>
            <span>The fastest way to fill your YouTube channel.</span>
          </div>

          {/* Hero headline */}
          <h1 style={{ fontFamily: DRUK, fontWeight: 700, textTransform: 'uppercase', fontSize: 'clamp(3rem, 10vw, 7.5rem)', lineHeight: 1.1, letterSpacing: '0.01em', marginBottom: '2rem' }}>
            Make 100<br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #3b82f6, #0ea5e9)' }}>
              type beat videos
            </span><br />
            in one click
          </h1>

          <p style={{ fontFamily: DRUK_WIDE, fontSize: 14, lineHeight: '22px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgba(255,255,255,0.45)', maxWidth: '34rem', margin: '0 auto 2.5rem' }}>
            Drop your audio files and artwork — TypeBeatz automatically generates professional type beat videos ready to upload to YouTube. No editing. No manual work.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <ParticleButton onClick={handleCTA}
              className="transition-all duration-200 hover:scale-105"
              style={{ fontFamily: DRUK_WIDE, fontSize: 14, lineHeight: '17px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500, background: BTN_BG, boxShadow: BTN_GLOW, border: 'none', color: '#fff', padding: '14px 32px', borderRadius: 12, cursor: 'pointer' }}>
              {user ? 'Open the App' : 'Get Started Free'}
            </ParticleButton>
            <a href="#how-it-works"
              style={{ fontFamily: DRUK_WIDE, fontSize: 14, lineHeight: '17px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fff', textDecoration: 'none', padding: '14px 32px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)' }}
              className="hover:border-white/40 transition-colors">
              See how it works
            </a>
          </div>

          <p style={{ fontFamily: DRUK_WIDE, fontSize: 11, lineHeight: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.22)', marginTop: '1rem' }}>
            Free — 5 videos/month &nbsp;·&nbsp; PRO — unlimited for $9.99/month
          </p>
        </motion.div>

        {/* Stats — left-aligned internally, centered as a group */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="relative flex flex-wrap justify-center gap-x-14 gap-y-8 mt-20" style={{ zIndex: 2 }}>
          <Stat prefix="up to" val="100" label="videos per batch" />
          <Stat prefix="auto" val="50" label="pairs matched" />
          <Stat prefix="up to" val="4K" label="video quality" />
          <Stat val="Custom" label="background" />
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <h2 style={{ fontFamily: DRUK, fontWeight: 700, textTransform: 'uppercase', textAlign: 'center', marginBottom: '1rem', fontSize: 'clamp(1.8rem, 4vw, 3rem)', lineHeight: 1.1, letterSpacing: '0.01em' }}>
          Everything you need to scale<br />your YouTube channel
        </h2>
        <p style={{ fontFamily: DRUK_WIDE, fontSize: 14, lineHeight: '22px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: '4rem', maxWidth: '36rem', margin: '0 auto 4rem' }}>
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
              <h3 style={{ fontFamily: DRUK, fontWeight: 700, textTransform: 'uppercase', fontSize: '0.95rem', letterSpacing: '0.02em', marginBottom: '0.5rem' }}>{f.title}</h3>
              <p style={{ fontFamily: DRUK_WIDE, fontSize: 13, lineHeight: '20px', textTransform: 'uppercase', letterSpacing: '0.03em', color: 'rgba(255,255,255,0.4)' }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24 px-6 max-w-4xl mx-auto">
        <h2 style={{ fontFamily: DRUK, fontWeight: 700, textTransform: 'uppercase', textAlign: 'center', marginBottom: '4rem', fontSize: 'clamp(1.8rem, 4vw, 3rem)', lineHeight: 1.1, letterSpacing: '0.01em' }}>
          How it works
        </h2>
        <div className="space-y-12">
          {steps.map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="flex items-start gap-8">
              <div style={{ fontFamily: DRUK, fontWeight: 700, textTransform: 'uppercase', fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', lineHeight: 1.1, letterSpacing: '0.01em', flexShrink: 0, backgroundImage: 'linear-gradient(135deg, #3b82f6, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {s.num}
              </div>
              <div>
                <h3 style={{ fontFamily: DRUK, fontWeight: 700, textTransform: 'uppercase', fontSize: '1rem', letterSpacing: '0.02em', marginBottom: '0.4rem' }}>{s.title}</h3>
                <p style={{ fontFamily: DRUK_WIDE, fontSize: 13, lineHeight: '20px', textTransform: 'uppercase', letterSpacing: '0.03em', color: 'rgba(255,255,255,0.4)' }}>{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Drop zone preview ── */}
      <section className="py-24 px-6 max-w-5xl mx-auto text-center">
        <h2 style={{ fontFamily: DRUK, fontWeight: 700, textTransform: 'uppercase', marginBottom: '1rem', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', lineHeight: 1.1, letterSpacing: '0.01em' }}>
          Clean, focused, powerful
        </h2>
        <p style={{ fontFamily: DRUK_WIDE, fontSize: 13, lineHeight: '20px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgba(255,255,255,0.4)', marginBottom: '2.5rem' }}>
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
              <p style={{ fontFamily: DRUK, fontWeight: 700, textTransform: 'uppercase', fontSize: '1.4rem', letterSpacing: '0.02em', marginBottom: '0.5rem' }}>Drop Your Files</p>
              <p style={{ fontFamily: DRUK_WIDE, fontSize: 13, lineHeight: '20px', textTransform: 'uppercase', letterSpacing: '0.03em', color: 'rgba(255,255,255,0.3)' }}>Drag and drop your audio and image files here</p>
              <div className="flex items-center justify-center gap-3 mt-6">
                <span className="px-3 py-1 rounded-full border border-white/10 text-xs" style={{ fontFamily: DRUK_WIDE, fontSize: 11, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>🎵 MP3 / WAV</span>
                <span className="px-3 py-1 rounded-full border border-white/10 text-xs" style={{ fontFamily: DRUK_WIDE, fontSize: 11, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>🖼️ PNG / JPG</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-6 max-w-5xl mx-auto">
        <h2 style={{ fontFamily: DRUK, fontWeight: 700, textTransform: 'uppercase', textAlign: 'center', marginBottom: '1rem', fontSize: 'clamp(1.8rem, 4vw, 3rem)', lineHeight: 1.1, letterSpacing: '0.01em' }}>
          Simple pricing
        </h2>
        <p style={{ fontFamily: DRUK_WIDE, fontSize: 14, lineHeight: '22px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: '4rem' }}>
          Start free. Go unlimited when you're ready.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">

          {/* Free */}
          <div className="rounded-2xl p-8 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <h3 style={{ fontFamily: DRUK, fontWeight: 700, textTransform: 'uppercase', fontSize: '1.4rem', letterSpacing: '0.02em', marginBottom: '0.5rem' }}>Free</h3>
            <div style={{ fontFamily: DRUK, fontWeight: 700, textTransform: 'uppercase', fontSize: '2.8rem', letterSpacing: '-0.02em', marginBottom: '1.5rem', lineHeight: 1 }}>
              $0<span style={{ fontSize: '1rem', fontWeight: 400, color: 'rgba(255,255,255,0.35)', letterSpacing: 0 }}>/mo</span>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                '5 videos per month',
                'Credits reset on the 1st',
                'All core features',
                'Black & white backgrounds',
                'HD 1080p output',
              ].map(item => (
                <li key={item} className="flex items-center gap-2"
                  style={{ fontFamily: DRUK_WIDE, fontSize: 13, lineHeight: '17px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgba(255,255,255,0.7)' }}>
                  <span style={{ color: '#4ade80' }}>✓</span>{item}
                </li>
              ))}
            </ul>
            <button onClick={handleCTA}
              className="w-full py-3 rounded-xl border border-white/20 hover:border-white/40 transition-colors"
              style={{ fontFamily: DRUK_WIDE, fontSize: 14, lineHeight: '17px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fff', background: 'transparent', cursor: 'pointer' }}>
              {user ? "You're on Free" : 'Get Started'}
            </button>
          </div>

          {/* PRO */}
          <div className="rounded-2xl p-8 border border-blue-500/40 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(14,165,233,0.1))' }}>
            <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-blue-500"
              style={{ fontFamily: DRUK_WIDE, fontSize: 11, lineHeight: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fff' }}>
              Popular
            </div>
            <h3 style={{ fontFamily: DRUK, fontWeight: 700, textTransform: 'uppercase', fontSize: '1.4rem', letterSpacing: '0.02em', marginBottom: '0.5rem' }}>PRO</h3>
            <div style={{ fontFamily: DRUK, fontWeight: 700, textTransform: 'uppercase', fontSize: '2.8rem', letterSpacing: '-0.02em', marginBottom: '1.5rem', lineHeight: 1 }}>
              $9.99<span style={{ fontSize: '1rem', fontWeight: 400, color: 'rgba(255,255,255,0.35)', letterSpacing: 0 }}>/mo</span>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                'Unlimited video generation',
                'No monthly limits ever',
                'Up to 4K video quality',
                'Custom photo backgrounds',
                'Cancel anytime',
              ].map(item => (
                <li key={item} className="flex items-center gap-2"
                  style={{ fontFamily: DRUK_WIDE, fontSize: 13, lineHeight: '17px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgba(255,255,255,0.7)' }}>
                  <span style={{ color: '#38bdf8' }}>✓</span>{item}
                </li>
              ))}
            </ul>
            <button onClick={handleUpgradeCTA}
              className="w-full py-3 rounded-xl transition-all hover:scale-105"
              style={{ fontFamily: DRUK_WIDE, fontSize: 14, lineHeight: '17px', textTransform: 'uppercase', letterSpacing: '0.05em', background: BTN_BG, border: 'none', color: '#fff', cursor: 'pointer' }}>
              {user?.role === 'pro' || user?.role === 'admin' ? "You're on PRO ⭐" : 'Upgrade to PRO'}
            </button>
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center rounded-2xl p-12 border border-white/10"
          style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(14,165,233,0.08))' }}>
          <h2 style={{ fontFamily: DRUK, fontWeight: 700, textTransform: 'uppercase', marginBottom: '1rem', fontSize: 'clamp(1.6rem, 4vw, 2.5rem)', lineHeight: 1.1, letterSpacing: '0.01em' }}>
            Ready to make type beats<br />in batches and save hours
          </h2>
          <p style={{ fontFamily: SCRIPT, fontSize: '1.6rem', color: 'rgba(255,255,255,0.55)', marginBottom: '0.75rem', lineHeight: 1.2 }}>
            of your life?
          </p>
          <p style={{ fontFamily: DRUK_WIDE, fontSize: 13, lineHeight: '20px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgba(255,255,255,0.4)', marginBottom: '2rem' }}>
            Join producers who are uploading more beats while doing less work.
          </p>
          <ParticleButton onClick={handleCTA}
            className="transition-all hover:scale-105"
            style={{ fontFamily: DRUK_WIDE, fontSize: 14, lineHeight: '17px', textTransform: 'uppercase', letterSpacing: '0.05em', background: BTN_BG, boxShadow: BTN_GLOW, border: 'none', color: '#fff', padding: '16px 40px', borderRadius: 12, cursor: 'pointer' }}>
            {user ? 'Open the App' : 'Start Free — No Credit Card'}
          </ParticleButton>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 border-t border-white/[0.06]">
        <div className="flex flex-col md:flex-row items-center justify-between max-w-5xl mx-auto gap-4">
          <img src={typebeatLogo} alt="TypeBeatz" style={{ height: 16, opacity: 0.5 }} />
          <p style={{ fontFamily: DRUK_WIDE, fontSize: 11, lineHeight: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.3)' }}>
            © {new Date().getFullYear()} TypeBeatz. All rights reserved.
          </p>
          <div className="flex gap-4">
            {['Terms', 'Privacy'].map(l => (
              <a key={l} href={`/${l.toLowerCase()}`}
                style={{ fontFamily: DRUK_WIDE, fontSize: 11, lineHeight: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}
                className="hover:text-white transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
