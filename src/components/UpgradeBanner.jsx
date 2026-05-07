import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UpgradeBanner({ user, onUpgradePro, onUpgradeUnlimited, checkoutLoading }) {
  const [dismissed, setDismissed] = useState(false);

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
          background: isExhausted
            ? 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(14,165,233,0.15))'
            : 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(14,165,233,0.12))',
          borderBottom: `1px solid ${isExhausted ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`
        }}>
        <div className="flex items-center gap-2 text-sm">
          <span>{isExhausted ? '🚫' : '⚠️'}</span>
          <span className={isExhausted ? 'text-red-300' : 'text-yellow-300'}>
            {proExhausted && 'You have used all 31 PRO videos this month. Go Unlimited for no limits.'}
            {proLow && `Only ${creditsLeft} PRO video${creditsLeft !== 1 ? 's' : ''} left this month.`}
            {freeExhausted && "You've used all 5 free credits this month. Upgrade to PRO for 31 videos/month."}
            {freeLow && `Only ${creditsLeft} free credit${creditsLeft !== 1 ? 's' : ''} left this month.`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {proExhausted || proLow ? (
            <button onClick={onUpgradeUnlimited} disabled={checkoutLoading}
              className="px-3 py-1 rounded-lg text-xs font-bold transition-all hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 flex items-center gap-1.5"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', color: '#000' }}>
              {checkoutLoading ? <><span className="inline-block w-3 h-3 border border-black/40 border-t-black rounded-full animate-spin" />Opening...</> : '🌟 Go Unlimited — $18.99/mo'}
            </button>
          ) : (
            <button onClick={onUpgradePro} disabled={checkoutLoading}
              className="px-3 py-1 rounded-lg text-xs font-bold transition-all hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 flex items-center gap-1.5"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)' }}>
              {checkoutLoading ? <><span className="inline-block w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />Opening...</> : 'Go PRO — $9.99/mo'}
            </button>
          )}
          {!isExhausted && (
            <button onClick={() => setDismissed(true)} className="text-gray-500 hover:text-white text-xs transition-colors">
              Dismiss
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
