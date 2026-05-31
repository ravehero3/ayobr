import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import typebeatLogo from '../assets/typebeatz logo 2 white version_1754509091303.png';
import useDocumentTitle from '../hooks/useDocumentTitle';

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

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  useDocumentTitle("Log In");
  const [showRights, setShowRights] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const { agreeToRights } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      if (!user.rights_agreed) {
        setShowRights(true);
      } else {
        navigate('/app');
      }
    }
  }, [user, loading, navigate]);

  const handleAgreeAndContinue = async () => {
    if (!agreed) return;
    const ok = await agreeToRights();
    if (ok) navigate('/app');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-white/5" />
          <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-2 border-white border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (showRights && user) {
    return (
        <div className="min-h-screen text-white flex flex-col items-center justify-center px-6" style={{ background: '#000' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg rounded-2xl border border-white/10 p-8 backdrop-blur-xl relative z-10"
          style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">{t('login.rights.title')}</h2>
            <p className="text-gray-400 text-sm">{t('login.rights.subtitle')}</p>
          </div>

          <div className="rounded-xl border border-white/10 p-5 mb-6 text-sm text-gray-300 leading-relaxed space-y-3"
            style={{ background: 'rgba(255,255,255,0.02)' }}>
            <p className="font-semibold text-white">{t('login.rights.header')}</p>
            <p>{t('login.rights.body')}</p>
            <ul className="list-disc pl-5 space-y-1 text-gray-400">
              <li>{t('login.rights.li1')}</li>
              <li>{t('login.rights.li2')}</li>
              <li>{t('login.rights.li3')}</li>
              <li>{t('login.rights.li4')}</li>
            </ul>
            <p className="text-gray-500 text-xs">{t('login.rights.disclaimer')}</p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer mb-6">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
              className="mt-0.5 accent-white" />
            <span className="text-sm text-gray-300">
              {t('login.rights.checkbox')}
            </span>
          </label>

          <button onClick={handleAgreeAndContinue} disabled={!agreed}
            className="w-full py-3 rounded-xl font-semibold transition-all"
            style={{
              background: agreed ? '#fff' : 'rgba(255,255,255,0.05)',
              color: agreed ? '#000' : 'rgba(255,255,255,0.3)',
              cursor: agreed ? 'pointer' : 'not-allowed'
            }}>
            {t('login.rights.cta')}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
      <div className="min-h-screen text-white flex flex-col items-center justify-center px-6" style={{ background: '#000' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{ background: 'rgba(255,255,255,0.05)' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', lineHeight: 1 }}>
            <span>{t('login.welcome')}</span>
            <img src={typebeatLogo} alt="TypeBeatz" style={{ height: 26, display: 'block', flexShrink: 0 }} />
          </h1>
          <p className="text-gray-400 mt-4">{t('login.signInSubtitle')}</p>
        </div>

        <div className="rounded-2xl border border-white/10 p-8 backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="space-y-4 mb-8 text-sm text-gray-400">
            <div className="flex items-center gap-3">
              <span>{t('login.feature1')}</span>
            </div>
            <div className="flex items-center gap-3">
              <span>{t('login.feature2')}</span>
            </div>
            <div className="flex items-center gap-3">
              <span>{t('login.feature3')}</span>
            </div>
          </div>

          <ParticleButton onClick={login}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-sm transition-all hover:scale-105 mb-6"
            style={{ background: '#fff', color: '#000' }}>
            {t('login.cta')}
          </ParticleButton>

          <p className="text-xs text-gray-500 text-center leading-relaxed">
            {t('login.agreeText')}{' '}
            <a href="/terms" className="text-white hover:underline transition-colors">{t('login.terms')}</a>
            <br />
            {t('login.and')}{' '}
            <a href="/privacy" className="text-white hover:underline transition-colors">{t('login.privacy')}</a>.
          </p>
        </div>

        <p className="text-center mt-6">
          <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-white transition-colors">
            {t('login.backHome')}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
