import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { label: 'Videos per month',   free: '5',     pro: '31',        unlimited: 'Unlimited' },
  { label: 'Video quality',      free: '720p',  pro: '1080p',     unlimited: '4K' },
  { label: 'Audio quality',      free: '320kbps', pro: '320kbps', unlimited: '320kbps' },
  { label: 'High quality export',free: false,   pro: true,        unlimited: true },
  { label: '4K output',          free: false,   pro: false,       unlimited: true },
  { label: 'Custom backgrounds', free: false,   pro: true,        unlimited: true },
  { label: 'Batch download',     free: true,    pro: true,        unlimited: true },
];

function StatusBadge({ status }) {
  const map = {
    active:     { label: 'Active',     color: 'text-green-400',  bg: 'rgba(34,197,94,0.1)',    border: 'rgba(34,197,94,0.25)' },
    cancelling: { label: 'Cancelling', color: 'text-yellow-400', bg: 'rgba(234,179,8,0.1)',    border: 'rgba(234,179,8,0.25)' },
    cancelled:  { label: 'Cancelled',  color: 'text-red-400',    bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.25)' },
    inactive:   { label: 'Inactive',   color: 'text-gray-400',   bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' },
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
  try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); }
  catch { return null; }
}

export default function SubscriptionPanel({ onClose, onUpgradePro, onUpgradeUnlimited, checkoutLoading }) {
  const { user } = useAuth();
  const [sub, setSub]               = useState(null);
  const [subLoading, setSubLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelDone, setCancelDone]       = useState(false);
  const [isAnnual, setIsAnnual]           = useState(true);

  const isUnlimited = user?.role === 'unlimited';
  const isPro       = user?.role === 'pro';
  const isAdmin     = user?.role === 'admin';
  const isPaid      = isPro || isUnlimited || isAdmin;

  const creditsLeft = user?.credits?.credits_remaining ?? (isPro ? 31 : 5);
  const creditsUsed = user?.credits?.credits_used_this_month ?? 0;
  const creditTotal = isPro ? 31 : 5;

  useEffect(() => {
    if (!isPaid || isAdmin) { setSubLoading(false); return; }
    fetch('/api/paddle/subscription', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { setSub(data); setSubLoading(false); })
      .catch(() => setSubLoading(false));
  }, [isPaid, isAdmin]);

  const handleCancel = async () => {
    if (!window.confirm("Are you sure? You'll keep access until the end of your billing period.")) return;
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
    } catch { alert('Failed to cancel. Please try again.'); }
    finally { setCancelLoading(false); }
  };

  const planLabel = isAdmin ? 'Admin' : isUnlimited ? 'Unlimited' : isPro ? 'PRO' : 'Free';
  const planPrice = isUnlimited ? 'Unlimited Access' : isPro ? 'PRO Access' : 'Up to 5 videos/month';
  const planIcon  = isAdmin ? '⚙️' : isUnlimited ? '🌟' : isPro ? '⭐' : '🎟️';
  const planBg    = isUnlimited ? 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(245,158,11,0.08))'
                  : isPro       ? 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(14,165,233,0.08))'
                  : 'rgba(255,255,255,0.03)';
  const planBorder = isUnlimited ? 'rgba(251,191,36,0.3)' : isPro ? 'rgba(14,165,233,0.3)' : 'rgba(255,255,255,0.08)';

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md mx-4 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        style={{ background: 'rgba(5, 10, 19, 0.98)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
          <div>
            <h2 className="text-white font-bold text-lg">Subscription</h2>
            <p className="text-gray-500 text-xs mt-0.5">You're on the {planLabel} plan</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/8 transition-colors text-lg leading-none">
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[80vh] overflow-y-auto">

          {/* Current plan card */}
          <div className="rounded-xl p-4 border" style={{ background: planBg, borderColor: planBorder }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{planIcon}</span>
                <div>
                  <p className="text-white font-semibold text-sm">{planLabel} Plan</p>
                  <p className="text-gray-500 text-xs">{planPrice}</p>
                </div>
              </div>
              {isPaid && !isAdmin && !subLoading && sub && <StatusBadge status={sub.status || 'active'} />}
              {!isPaid && <StatusBadge status="inactive" />}
            </div>

            {/* Paid: billing info */}
            {isPaid && !isAdmin && !subLoading && sub && sub.status !== 'inactive' && (
              <div className="space-y-1.5 pt-3 border-t border-white/8">
                {sub.current_period_end && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      {sub.status === 'cancelling' || sub.status === 'cancelled' ? 'Access until' : 'Next billing date'}
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

            {/* Credit/usage bar — free and pro */}
            {!isUnlimited && !isAdmin && (
              <div className="pt-3 border-t border-white/8">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-gray-500">Videos this month</span>
                  <span className="text-gray-300">{creditsUsed} / {creditTotal} used</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (creditsUsed / creditTotal) * 100)}%`,
                      background: creditsLeft === 0 ? '#ef4444' : creditsLeft <= 3 ? '#f59e0b' : 'linear-gradient(90deg, #3b82f6, #0ea5e9)'
                    }} />
                </div>
                <p className="text-xs text-gray-600 mt-1.5">Resets on the 1st of each month</p>
              </div>
            )}

            {/* Unlimited: show infinity */}
            {(isUnlimited || isAdmin) && (
              <div className="pt-3 border-t border-white/8 flex items-center gap-2">
                <span className="text-yellow-400 text-sm">∞</span>
                <span className="text-gray-500 text-xs">No limits — generate as many videos as you want</span>
              </div>
            )}
          </div>

          {/* Cancellation success message */}
          <AnimatePresence>
            {cancelDone && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="rounded-xl p-3 text-sm text-yellow-300 text-center"
                style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
                Subscription scheduled for cancellation. You'll keep access until the end of the billing period.
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feature comparison */}
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">Plan comparison</p>
            <div className="rounded-xl border border-white/8 overflow-hidden">
              <div className="grid grid-cols-4 text-xs font-semibold px-4 py-2.5 border-b border-white/8"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="text-gray-500">Feature</span>
                <span className="text-gray-400 text-center">Free</span>
                <span className="text-blue-400 text-center">PRO</span>
                <span className="text-yellow-400 text-center">Unlimited</span>
              </div>
              {FEATURES.map((f, i) => (
                <div key={i} className="grid grid-cols-4 items-center px-4 py-2.5 text-xs border-b border-white/5 last:border-0">
                  <span className="text-gray-400">{f.label}</span>
                  {['free', 'pro', 'unlimited'].map(plan => (
                    <span key={plan} className="text-center">
                      {typeof f[plan] === 'boolean'
                        ? (f[plan] ? <span className="text-green-400">✓</span> : <span className="text-gray-600">—</span>)
                        : <span className={plan === 'unlimited' ? 'text-yellow-300 font-semibold' : plan === 'pro' ? 'text-blue-300' : 'text-gray-300'}>{f[plan]}</span>}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* CTA buttons */}
          {!isPaid && (
            <div className="space-y-4 pt-2">
              {/* Toggle */}
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 9999, padding: 4, width: 'fit-content', margin: '0 auto' }}>
                <button onClick={() => setIsAnnual(false)} className={`px-4 py-1.5 text-xs rounded-full font-medium transition-colors ${!isAnnual ? 'bg-white/10 text-white' : 'text-white/50'}`}>Monthly</button>
                <button onClick={() => setIsAnnual(true)} className={`px-4 py-1.5 text-xs rounded-full font-medium transition-colors flex items-center gap-1.5 ${isAnnual ? 'bg-white/10 text-white' : 'text-white/50'}`}>Yearly <span className="text-blue-400 text-[10px] bg-blue-500/20 px-1.5 rounded">-20%</span></button>
              </div>
              
              <div className="space-y-2">
                <button onClick={() => onUpgradePro(isAnnual ? 'yearly' : 'monthly')} disabled={checkoutLoading}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)' }}>
                  {checkoutLoading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Opening...</> : `⭐ Upgrade to PRO — ${isAnnual ? '$95.88/yr' : '$9.99/mo'}`}
                </button>
                <button onClick={() => onUpgradeUnlimited(isAnnual ? 'yearly' : 'monthly')} disabled={checkoutLoading}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', color: '#000' }}>
                  {checkoutLoading ? <><span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />Opening...</> : `🌟 Go Unlimited — ${isAnnual ? '$179.88/yr' : '$18.99/mo'}`}
                </button>
              </div>
            </div>
          )}

          {isPro && !isAdmin && (
            <div className="space-y-4 pt-2">
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 9999, padding: 4, width: 'fit-content', margin: '0 auto' }}>
                <button onClick={() => setIsAnnual(false)} className={`px-4 py-1.5 text-xs rounded-full font-medium transition-colors ${!isAnnual ? 'bg-white/10 text-white' : 'text-white/50'}`}>Monthly</button>
                <button onClick={() => setIsAnnual(true)} className={`px-4 py-1.5 text-xs rounded-full font-medium transition-colors flex items-center gap-1.5 ${isAnnual ? 'bg-white/10 text-white' : 'text-white/50'}`}>Yearly <span className="text-blue-400 text-[10px] bg-blue-500/20 px-1.5 rounded">-20%</span></button>
              </div>
              
              <div className="space-y-2">
                <button onClick={() => onUpgradeUnlimited(isAnnual ? 'yearly' : 'monthly')} disabled={checkoutLoading}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', color: '#000' }}>
                  {checkoutLoading ? <><span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />Opening...</> : `🌟 Upgrade to Unlimited — ${isAnnual ? '$179.88/yr' : '$18.99/mo'}`}
                </button>
              {sub && sub.status === 'active' && !cancelDone && (
                <button onClick={handleCancel} disabled={cancelLoading}
                  className="w-full py-2.5 rounded-xl text-sm text-red-400 border border-red-500/20 hover:bg-red-500/8 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {cancelLoading ? 'Cancelling...' : 'Cancel subscription'}
                </button>
              )}
              </div>
            </div>
          )}

          {isUnlimited && !isAdmin && sub && sub.status === 'active' && !cancelDone && (
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
