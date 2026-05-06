import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import typebeatLogo from '../assets/typebeatz logo 2 white version_1754509091303.png';

const features = [
  {
    icon: '🎵',
    title: 'Drop 100 files at once',
    desc: 'Drag in up to 50 audio files and 50 images in one go. TypeBeatz pairs them up automatically — no manual work needed.'
  },
  {
    icon: '🎬',
    title: 'Get 50 YouTube-ready videos',
    desc: 'Every audio + image pair becomes a full 1080p video with 320kbps audio. Perfect for YouTube type beat uploads.'
  },
  {
    icon: '😴',
    title: 'Sleep while it works',
    desc: 'Hit generate, close your eyes. TypeBeatz runs everything in the background. Wake up to a folder full of finished videos.'
  },
  {
    icon: '🖥️',
    title: 'Runs entirely in your browser',
    desc: 'No upload limits, no waiting on servers. All video processing happens locally on your machine using cutting-edge browser technology.'
  },
  {
    icon: '⚡',
    title: 'Swap & reorder in seconds',
    desc: 'Not happy with a pairing? Drag and drop to swap audio or images between pairs before you generate.'
  },
  {
    icon: '📦',
    title: 'Download everything at once',
    desc: 'When all videos are done, grab them all in one click. Ready to upload straight to YouTube.'
  }
];

const steps = [
  { num: '01', title: 'Upload your files', desc: 'Drag and drop your beat MP3s and artwork PNGs — up to 100 files at a time.' },
  { num: '02', title: 'Review your pairs', desc: 'TypeBeatz auto-pairs audio with images. Swap anything around if needed.' },
  { num: '03', title: 'Hit Generate', desc: 'Sit back. The app processes every video in the background while you do other things.' },
  { num: '04', title: 'Download & upload', desc: 'Your videos are ready. Download them all and upload directly to YouTube.' }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const handleCTA = () => {
    if (user) {
      navigate('/app');
    } else {
      login();
    }
  };

  const handleUpgradeCTA = () => {
    if (!user) {
      login();
    } else if (user.role === 'pro' || user.role === 'admin') {
      navigate('/app');
    } else {
      navigate('/app?upgrade=true');
    }
  };

  return (
    <div className="min-h-screen bg-[#050a13] text-white overflow-x-hidden">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
        style={{ background: 'rgba(5,10,19,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <img src={typebeatLogo} alt="TypeBeatz" style={{ height: 20 }} />
        <div className="flex items-center gap-4">
          <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</a>
          {user ? (
            <button onClick={() => navigate('/app')}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium transition-colors">
              Open App
            </button>
          ) : (
            <button onClick={login}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium transition-colors">
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center pt-20">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)' }} />
        </div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm mb-6">
            <span>😴</span> <span>Set it. Forget it. Wake up to 50 videos.</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Turn your beats into<br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
              YouTube videos
            </span><br />
            while you sleep
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            TypeBeatz is the tool every music producer needs. Drop your audio files and artwork,
            and the app automatically generates professional type beat videos — ready to upload to YouTube.
            No editing software. No manual work. Just results.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={handleCTA}
              className="px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', boxShadow: '0 0 40px rgba(59,130,246,0.3)' }}>
              {user ? 'Open the App' : 'Get Started Free'}
            </button>
            <a href="#how-it-works"
              className="px-8 py-4 rounded-xl font-semibold text-lg border border-white/10 hover:border-white/30 transition-colors">
              See how it works
            </a>
          </div>

          <p className="mt-4 text-sm text-gray-500">Free — 5 videos/month. PRO — unlimited for $9.99/month.</p>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="flex flex-wrap justify-center gap-12 mt-20">
          {[
            { val: '100', label: 'Files per batch' },
            { val: '50', label: 'Videos generated' },
            { val: '1080p', label: 'Video quality' },
            { val: '320kbps', label: 'Audio quality' }
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold text-white">{s.val}</div>
              <div className="text-sm text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Everything you need to scale your YouTube channel</h2>
        <p className="text-gray-400 text-center mb-16 max-w-xl mx-auto">
          Built specifically for type beat producers who want to upload more without spending hours editing.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="rounded-2xl p-6 border border-white/[0.06]"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6 max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">How it works</h2>
        <div className="space-y-12">
          {steps.map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="flex items-start gap-8">
              <div className="text-4xl font-bold text-transparent bg-clip-text flex-shrink-0"
                style={{ backgroundImage: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                {s.num}
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
                <p className="text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* App screenshot preview */}
      <section className="py-24 px-6 max-w-5xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">Clean, focused, powerful</h2>
        <p className="text-gray-400 mb-10">The whole workflow in one screen. Drop files, review pairs, generate.</p>
        <div className="rounded-2xl border border-white/10 overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.02)', padding: 2 }}>
          <div className="rounded-xl overflow-hidden" style={{ background: '#050a13', minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="text-center p-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-2 border-dashed border-white/20 mb-6">
                <svg className="w-10 h-10 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-white mb-2">Drop Your Files</p>
              <p className="text-gray-500">Drag and drop your audio and image files here</p>
              <div className="flex items-center justify-center gap-3 mt-6">
                <span className="px-3 py-1 rounded-full border border-white/10 text-xs text-gray-400">🎵 MP3, WAV</span>
                <span className="px-3 py-1 rounded-full border border-white/10 text-xs text-gray-400">🖼️ PNG, JPG</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Simple pricing</h2>
        <p className="text-gray-400 text-center mb-16">Start free. Go unlimited when you're ready.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free */}
          <div className="rounded-2xl p-8 border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <h3 className="text-xl font-bold mb-2">Free</h3>
            <div className="text-4xl font-bold mb-6">$0<span className="text-lg text-gray-400 font-normal">/mo</span></div>
            <ul className="space-y-3 text-sm text-gray-300 mb-8">
              {['5 videos per month', 'Credits reset on the 1st', 'All core features', 'Browser-based processing', 'HD video output'].map(i => (
                <li key={i} className="flex items-center gap-2"><span className="text-green-400">✓</span>{i}</li>
              ))}
            </ul>
            <button onClick={handleCTA}
              className="w-full py-3 rounded-xl border border-white/20 hover:border-white/40 font-medium transition-colors">
              {user ? 'You\'re on Free' : 'Get Started'}
            </button>
          </div>
          {/* PRO */}
          <div className="rounded-2xl p-8 border border-blue-500/40 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))' }}>
            <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-blue-500 text-xs font-bold">POPULAR</div>
            <h3 className="text-xl font-bold mb-2">PRO</h3>
            <div className="text-4xl font-bold mb-6">$9.99<span className="text-lg text-gray-400 font-normal">/mo</span></div>
            <ul className="space-y-3 text-sm text-gray-300 mb-8">
              {['Unlimited video generation', 'No monthly limits ever', 'Priority support', 'All current & future features', 'Cancel anytime'].map(i => (
                <li key={i} className="flex items-center gap-2"><span className="text-blue-400">✓</span>{i}</li>
              ))}
            </ul>
            <button onClick={handleUpgradeCTA}
              className="w-full py-3 rounded-xl font-medium transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
              {user?.role === 'pro' || user?.role === 'admin' ? 'You\'re on PRO ⭐' : 'Upgrade to PRO'}
            </button>
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center rounded-2xl p-12 border border-white/10"
          style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08))' }}>
          <h2 className="text-3xl font-bold mb-4">Ready to automate your YouTube workflow?</h2>
          <p className="text-gray-400 mb-8">Join producers who are uploading more beats while doing less work.</p>
          <button onClick={handleCTA}
            className="px-10 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', boxShadow: '0 0 40px rgba(59,130,246,0.3)' }}>
            {user ? 'Open the App' : 'Start Free — No Credit Card'}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/[0.06] text-center text-gray-500 text-sm">
        <div className="flex flex-col md:flex-row items-center justify-between max-w-5xl mx-auto gap-4">
          <img src={typebeatLogo} alt="TypeBeatz" style={{ height: 16, opacity: 0.6 }} />
          <p>© {new Date().getFullYear()} TypeBeatz. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
