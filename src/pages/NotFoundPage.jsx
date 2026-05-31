import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import typebeatLogo from '../assets/typebeatz logo 2 white version_1754509091303.png';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 py-4"
        style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => navigate('/')} className="hover:opacity-80 transition-opacity">
          <img src={typebeatLogo} alt="TypeBeatz" style={{ height: 20 }} />
        </button>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="relative mb-8 select-none">
            <div className="text-[120px] font-black text-transparent bg-clip-text leading-none"
              style={{ backgroundImage: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(14,165,233,0.3))' }}>
              404
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-3">This page doesn't exist</h1>
          <p className="text-gray-400 mb-10 max-w-sm">
            Looks like you wandered off. The page you're looking for isn't here — but your videos are.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate('/')}
              className="px-8 py-3 rounded-xl font-semibold transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)' }}>
              Go Home
            </button>
            <button onClick={() => navigate('/app')}
              className="px-8 py-3 rounded-xl font-semibold border border-white/10 hover:border-white/30 transition-colors">
              Open App
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
