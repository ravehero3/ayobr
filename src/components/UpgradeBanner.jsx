import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export default function UpgradeBanner({ user }) {
  const { t } = useLanguage();

  const creditsLeft = user?.credits?.credits_remaining;
  const freeExhausted = user?.role !== 'pro' && user?.role !== 'unlimited' && creditsLeft === 0;

  if (!freeExhausted) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-0 left-0 right-0 h-16 z-[9999] flex items-center justify-center px-6"
        style={{
          background: 'rgba(0, 0, 0, 0.38)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          fontFamily: "'Neue Montreal', 'Inter', sans-serif"
        }}
      >
        <div className="flex items-center gap-3 text-sm text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-x-circle">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          <span className="text-white font-medium">
            {t('banner.freeExhausted')}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
