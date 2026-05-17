import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export default function UpgradeBanner({ user, onUpgradePro, onUpgradeUnlimited, checkoutLoading }) {
  const [dismissed, setDismissed] = useState(false);
  const { t } = useLanguage();

  const role       = user?.role;
  const creditsLeft = user?.credits?.credits_remaining;

  // PRO users who hit their 31 limit
  const proExhausted = role === 'pro' && creditsLeft === 0;
  const proLow       = role === 'pro' && creditsLeft !== undefined && creditsLeft > 0 && creditsLeft <= 3;

  // Free users running low or out
  const freeExhausted = (!role || role === 'free') && creditsLeft === 0;
  const freeLow       = (!role || role === 'free') && creditsLeft !== undefined && creditsLeft > 0 && creditsLeft <= 2;

  const show = !dismissed && (proExhausted || proLow || freeExhausted || freeLow);
  if (!show) return null;

  const isExhausted = proExhausted || freeExhausted;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-14 left-0 right-0 z-[9999] flex items-center justify-between px-6 py-2"
        style={{
          background: 'rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
        <div className="flex items-center gap-2 text-sm">
          <span>{isExhausted ? '🚫' : '⚠️'}</span>
          <span className="text-gray-300 font-medium">
            {proExhausted && t('banner.proExhausted')}
            {proLow && t('banner.proLow').replace('{count}', creditsLeft)}
            {freeExhausted && t('banner.freeExhausted')}
            {freeLow && t('banner.freeLow').replace('{count}', creditsLeft)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {proExhausted || proLow ? (
            <button onClick={onUpgradeUnlimited} disabled={checkoutLoading}
              className="px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all bg-white text-black hover:scale-105 disabled:opacity-60 flex items-center gap-1.5"
            >
              {checkoutLoading ? <><span className="inline-block w-3 h-3 border border-black/40 border-t-black rounded-full animate-spin" />{t('nav.opening')}</> : t('banner.goUnlimited')}
            </button>
          ) : (
            <button onClick={onUpgradePro} disabled={checkoutLoading}
              className="px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all bg-white text-black hover:scale-105 disabled:opacity-60 flex items-center gap-1.5"
            >
              {checkoutLoading ? <><span className="inline-block w-3 h-3 border border-black/40 border-t-black rounded-full animate-spin" />{t('nav.opening')}</> : t('banner.goPro')}
            </button>
          )}
          {!isExhausted && (
            <button onClick={() => setDismissed(true)} className="text-gray-500 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors ml-2">
              {t('banner.dismiss')}
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
