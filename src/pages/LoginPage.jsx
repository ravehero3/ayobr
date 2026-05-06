import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import typebeatLogo from '../assets/typebeatz logo 2 white version_1754509091303.png';

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
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
      <div className="min-h-screen bg-[#050a13] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (showRights && user) {
    return (
      <div className="min-h-screen bg-[#050a13] text-white flex flex-col items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg rounded-2xl border border-white/10 p-8"
          style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">⚖️</div>
            <h2 className="text-2xl font-bold mb-2">One quick thing before you start</h2>
            <p className="text-gray-400 text-sm">We need you to confirm ownership of your content.</p>
          </div>

          <div className="rounded-xl border border-white/10 p-5 mb-6 text-sm text-gray-300 leading-relaxed space-y-3"
            style={{ background: 'rgba(255,255,255,0.02)' }}>
            <p className="font-semibold text-white">Content Rights Agreement</p>
            <p>By using TypeBeatz to generate videos, you confirm that:</p>
            <ul className="list-disc pl-5 space-y-1 text-gray-400">
              <li>You own the rights to all audio files you upload, or have a valid license to use them.</li>
              <li>You own the rights to all images you upload, or have a valid license to use them.</li>
              <li>You will not use TypeBeatz to create content that infringes on third-party copyrights.</li>
              <li>You are solely responsible for any content you create and distribute using this tool.</li>
            </ul>
            <p className="text-gray-500 text-xs">TypeBeatz is not responsible for any copyright claims arising from content you create. By continuing, you take full legal responsibility for your uploads.</p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer mb-6">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
              className="mt-0.5 accent-blue-500" />
            <span className="text-sm text-gray-300">
              I confirm that I own the rights to all audio and image files I upload. I understand and accept full responsibility for the content I create.
            </span>
          </label>

          <button onClick={handleAgreeAndContinue} disabled={!agreed}
            className="w-full py-3 rounded-xl font-semibold transition-all"
            style={{
              background: agreed ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'rgba(255,255,255,0.05)',
              color: agreed ? 'white' : 'rgba(255,255,255,0.3)',
              cursor: agreed ? 'pointer' : 'not-allowed'
            }}>
            I Agree — Take Me to the App
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050a13] text-white flex flex-col items-center justify-center px-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <img src={typebeatLogo} alt="TypeBeatz" className="mx-auto mb-6" style={{ height: 24 }} />
          <h1 className="text-3xl font-bold mb-2">Welcome to TypeBeatz</h1>
          <p className="text-gray-400">Sign in to start generating type beat videos</p>
        </div>

        <div className="rounded-2xl border border-white/10 p-8" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="space-y-4 mb-6 text-sm text-gray-400">
            <div className="flex items-center gap-3">
              <span className="text-green-400">✓</span>
              <span>5 free videos every month</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-400">✓</span>
              <span>Auto-pair 50 audio + 50 images into 50 videos</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-400">✓</span>
              <span>1080p video, 320kbps audio — YouTube ready</span>
            </div>
          </div>

          <button onClick={login}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-semibold text-base transition-all hover:scale-105 mb-4"
            style={{ background: '#fff', color: '#1f1f1f', boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
            <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-xs text-gray-500 text-center">
            By signing in, you agree to our{' '}
            <a href="/terms" className="text-blue-400 hover:underline">Terms of Service</a> and{' '}
            <a href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</a>.
          </p>
        </div>

        <p className="text-center mt-6">
          <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-white transition-colors">
            ← Back to home
          </button>
        </p>
      </motion.div>
    </div>
  );
}
