import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { label: 'Videos per month', free: '5', pro: 'Unlimited' },
  { label: 'Audio + image pairs', free: 'Up to 5', pro: 'Up to 50' },
  { label: 'Video quality', free: '1080p', pro: '1080p' },
  { label: 'Audio quality', free: '320kbps', pro: '320kbps' },
  { label: 'High quality export', free: false, pro: true },
  { label: 'Batch download', free: true, pro: true },
  { label: 'Priority processing', free: false, pro: true },
];

function StatusBadge({ status }) {
  const map = {
    active:     { label: 'Active',      color: 'text-green-400',  bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)' },
    cancelling: { label: 'Cancelling',  color: 'text-yellow-400', bg: 'rgba(234,179,8,0.1)',   border: 'rgba(234,179,8,0.25)' },
    cancelled:  { label: 'Cancelled',   color: 'text-red-400',    bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)' },
    inactive:   { label: 'Inactive',    color: 'text-gray-400',   bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' },
  };
  const s = map[status] || map.inactive;
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.color}`}
      style={{ background: s.bg, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch { return null; }
}

export default function SubscriptionPanel({ onClose, onUpgrade, checkoutLoading }) {
  const { user } = useAuth();
  const [sub, setSub] = useState(null);
  const [subLoading, setSubLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelDone, setCancelDone] = useState(false);

  const isPro = user?.role === 'pro' || user?.role === 'admin';
  const creditsLeft = user?.credits?.credits_remaining ?? 5;
  const creditsUsed = user?.credits?.credits_used_this_month ?? 0;

  useEffect(() => {
    if (!isPro) { setSubLoading(false); return; }
    fetch('/api/paddle/subscription', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { setSub(data); setSubLoading(false); })
      .catch(() => setSubLoading(false));
  }, [isPro]);

  const handleCancel = async () => {
    if (!window.confirm("Are you sure? You'll keep PRO access until the end of your billing period.")) return;
    setCancelLoading(true);
    try {
      const res = await fetch('/api/paddle/cancel', { method: 'POST', credentials: 'include' });
      if (res.ok) {
        setCancelDone(true);
        setSub(prev => prev ? { ...prev, status: 'cancelling' } : prev);
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to cancel. Please try again.');
      }
    } catch {
      alert('Failed to cancel. Please try again.');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md mx-4 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        style={{ background: 'rgba(8,12,24,0.99)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
          <div>
            <h2 className="text-white font-bold text-lg">Subscription</h2>
            <p className="text-gray-500 text-xs mt-0.5">
              {isPro ? 'You\'re on the PRO plan' : 'You\'re on the Free plan'}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/8 transition-colors text-lg leading-none">
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[80vh] overflow-y-auto">

          {/* Current plan card */}
          <div className="rounded-xl p-4 border"
            style={{
              background: isPro
                ? 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08))'
                : 'rgba(255,255,255,0.03)',
              borderColor: isPro ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)'
            }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{isPro ? '⭐' : '🎟️'}</span>
                <div>
                  <p className="text-white font-semibold text-sm">{isPro ? 'PRO Plan' : 'Free Plan'}</p>
                  <p className="text-gray-500 text-xs">{isPro ? '$9.99 / month' : 'Up to 5 videos/month'}</p>
                </div>
              </div>
              {isPro && !subLoading && sub && <StatusBadge status={sub.status || 'active'} />}
              {!isPro && <StatusBadge status="inactive" />}
            </div>

            {/* PRO: billing info */}
            {isPro && !subLoading && sub && sub.status !== 'inactive' && (
              <div className="space-y-1.5 pt-3 border-t border-white/8">
                {sub.current_period_end && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      {sub.status === 'cancelling' || sub.status === 'cancelled'
                        ? 'Access until' : 'Next billing date'}
                    </span>
                    <span className={sub.status === 'cancelling' ? 'text-yellow-300' : 'text-gray-300'}>
                      {formatDate(sub.current_period_end)}
                    </span>
                  </div>
                )}
                {sub.status === 'cancelling' && (
                  <p className="text-yellow-400/80 text-xs pt-1">
                    Your subscription will end on the date above. You'll keep full access until then.
                  </p>
                )}
              </div>
            )}

            {/* Free: credit usage bar */}
            {!isPro && (
              <div className="pt-3 border-t border-white/8">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-gray-500">Videos this month</span>
                  <span className="text-gray-300">{creditsUsed} / 5 used</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (creditsUsed / 5) * 100)}%`,
                      background: creditsLeft === 0 ? '#ef4444' : creditsLeft <= 1 ? '#f59e0b' : 'linear-gradient(90deg, #3b82f6, #8b5cf6)'
                    }} />
                </div>
                <p className="text-xs text-gray-600 mt-1.5">Resets on the 1st of each month</p>
              </div>
            )}
          </div>

          {/* Cancellation success message */}
          <AnimatePresence>
            {cancelDone && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="rounded-xl p-3 text-sm text-yellow-300 text-center"
                style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
                Subscription scheduled for cancellation. You'll keep PRO access until the end of the billing period.
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feature comparison table */}
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">What's included</p>
            <div className="rounded-xl border border-white/8 overflow-hidden">
              <div className="grid grid-cols-3 text-xs font-semibold px-4 py-2.5 border-b border-white/8"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="text-gray-500">Feature</span>
                <span className="text-gray-400 text-center">Free</span>
                <span className="text-blue-400 text-center">PRO</span>
              </div>
              {FEATURES.map((f, i) => (
                <div key={i} className="grid grid-cols-3 items-center px-4 py-2.5 text-xs border-b border-white/5 last:border-0">
                  <span className="text-gray-400">{f.label}</span>
                  <span className="text-center">
                    {typeof f.free === 'boolean'
                      ? (f.free ? <span className="text-green-400">✓</span> : <span className="text-gray-600">—</span>)
                      : <span className="text-gray-300">{f.free}</span>}
                  </span>
                  <span className="text-center">
                    {typeof f.pro === 'boolean'
                      ? (f.pro ? <span className="text-green-400">✓</span> : <span className="text-gray-600">—</span>)
                      : <span className="text-blue-300 font-semibold">{f.pro}</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA buttons */}
          {!isPro && (
            <button onClick={onUpgrade} disabled={checkoutLoading}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
              {checkoutLoading
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Opening checkout...</>
                : '⭐ Upgrade to PRO — $9.99/month'}
            </button>
          )}

          {isPro && sub && sub.status === 'active' && !cancelDone && (
            <button onClick={handleCancel} disabled={cancelLoading}
              className="w-full py-2.5 rounded-xl text-sm text-red-400 border border-red-500/20 hover:bg-red-500/8 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {cancelLoading ? 'Cancelling...' : 'Cancel subscription'}
            </button>
          )}

          <button onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-300 transition-colors">
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
