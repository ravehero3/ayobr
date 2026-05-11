import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import typebeatLogo from '../assets/typebeatz logo 2 white version_1754509091303.png';
import useDocumentTitle from '../hooks/useDocumentTitle';

function StatCard({ label, value, sub }) {
  return (
    <div className="stat-card">
      <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">{label}</p>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      {sub && <p className="text-[11px] text-sky-400/50 mt-1 font-medium">{sub}</p>}
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch { return '—'; }
}

export default function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  useDocumentTitle("Account Settings");
  const [sub, setSub] = useState(null);
  const [referral, setReferral] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const isUnlimited = user?.role === 'unlimited' || user?.role === 'admin';
  const isPro       = user?.role === 'pro';
  const isPaid      = isPro || isUnlimited;

  useEffect(() => {
    if (!user) return;

    const fetches = [
      fetch('/api/user/referral', { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(data => setReferral(data))
        .catch(() => {})
    ];

    if (isPaid) {
      fetches.push(
        fetch('/api/paddle/subscription', { credentials: 'include' })
          .then(r => r.ok ? r.json() : null)
          .then(data => setSub(data))
          .catch(() => {})
      );
    }

    Promise.all(fetches).finally(() => setLoading(false));
  }, [user, isPaid]);

  const referralLink = referral?.code ? `${window.location.origin}/?ref=${referral.code}` : null;

  const handleCopy = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-[#050a13] flex flex-col items-center justify-center p-6">
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 rounded-full border-4 border-white/5 border-t-sky-500 shadow-[0_0_30px_rgba(14,165,233,0.2)]"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
          </div>
        </div>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-sky-400/60 text-sm font-medium tracking-widest uppercase"
        >
          Securing session...
        </motion.p>
      </div>
    );
  }

  const creditsRemaining = user?.credits?.credits_remaining ?? 5;
  const creditsUsed = user?.credits?.credits_used_this_month ?? 0;
  const lastReset = user?.credits?.last_reset_at;

  return (
    <div className="min-h-screen bg-[#050a13] text-white">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 h-14"
        style={{ background: 'rgba(5,10,19,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => navigate('/')} className="hover:opacity-80 transition-opacity">
          <img src={typebeatLogo} alt="TypeBeatz" style={{ height: 18 }} />
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/app')}
            className="text-sm text-gray-400 hover:text-white transition-colors">
            ← Back to App
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 pt-24 pb-16">

        {/* Profile header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-5 mb-8">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/10 flex-shrink-0">
            {user.profile_image_url ? (
              <img src={user.profile_image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold"
                style={{ background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)' }}>
                {(user.first_name?.[0] || user.email?.[0] || '?').toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {user.first_name}{user.last_name ? ` ${user.last_name}` : ''}
            </h1>
            {user.created_at && (
              <p className="text-gray-500 text-xs mt-2 font-medium">
                Member since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            )}
            <p className="text-gray-400 text-sm">{user.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              {isUnlimited ? (
                <span className="premium-badge border border-yellow-500/40 text-yellow-300 bg-yellow-500/10">
                  🌟 UNLIMITED
                </span>
              ) : isPro ? (
                <span className="premium-badge border border-sky-500/40 text-sky-300 bg-sky-500/10">
                  ⭐ PRO
                </span>
              ) : (
                <span className="premium-badge border border-white/10 text-gray-400 bg-white/5">
                  Free
                </span>
              )}
              {user.role === 'admin' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold border border-orange-500/40 text-orange-300"
                  style={{ background: 'rgba(249,115,22,0.1)' }}>
                  ⚙️ Admin
                </span>
              )}
              <span className="text-xs text-gray-600">Member since {formatDate(user.created_at)}</span>
            </div>
          </div>
        </motion.div>

        {/* This month usage */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">This Month</h2>
          <div className="grid grid-cols-2 gap-3">
            {isUnlimited ? (
              <>
                <StatCard label="Videos Generated" value="∞" sub="Unlimited" />
                <StatCard label="Plan" value="Unlimited" sub="$18.99 / month" />
              </>
            ) : isPro ? (
              <>
                <StatCard label="Videos Remaining" value={creditsRemaining} sub="of 31 PRO credits" />
                <StatCard label="Plan" value="PRO" sub="$9.99 / month" />
              </>
            ) : (
              <>
                <StatCard label="Videos Remaining" value={creditsRemaining} sub={`of 5 free credits`} />
                <StatCard label="Credits Used" value={creditsUsed} sub={lastReset ? `Reset: ${formatDate(lastReset)}` : 'Resets on the 1st'} />
              </>
            )}
          </div>

          {!isUnlimited && (
            <div className="mt-3 rounded-xl p-4 border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-gray-500">Monthly usage</span>
                <span className="text-gray-400">{creditsUsed} / {isPro ? 31 : 5} used</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (creditsUsed / (isPro ? 31 : 5)) * 100)}%`,
                    background: creditsRemaining === 0
                      ? '#ef4444'
                      : creditsRemaining <= (isPro ? 3 : 1)
                      ? '#f59e0b'
                      : 'linear-gradient(90deg, #3b82f6, #0ea5e9)'
                  }} />
              </div>
              <p className="text-xs text-gray-600 mt-2">Credits reset automatically on the 1st of each month.</p>
            </div>
          )}
        </motion.section>

        {/* Subscription */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Subscription</h2>
          <div className="rounded-xl p-5 border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.03)' }}>
            {isUnlimited ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌟</span>
                    <div>
                      <p className="text-white font-semibold text-sm">Unlimited Plan</p>
                      <p className="text-gray-500 text-xs">$18.99 / month — no limits, 4K rendering</p>
                    </div>
                  </div>
                  {sub && (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                      sub.status === 'active' ? 'text-green-400 border-green-500/25' : 'text-yellow-400 border-yellow-500/25'
                    }`} style={{ background: sub.status === 'active' ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)' }}>
                      {sub.status === 'active' ? 'Active' : sub.status === 'cancelling' ? 'Cancelling' : sub.status}
                    </span>
                  )}
                </div>
                {sub?.current_period_end && (
                  <p className="text-xs text-gray-500">
                    {sub.status === 'cancelling' ? 'Access until' : 'Next billing date'}:{' '}
                    <span className="text-gray-300">{formatDate(sub.current_period_end)}</span>
                  </p>
                )}
                <button onClick={() => navigate('/app?manage=true')}
                  className="text-xs text-sky-400 hover:text-sky-300 transition-colors">
                  Manage subscription →
                </button>
              </div>
            ) : isPro ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⭐</span>
                    <div>
                      <p className="text-white font-semibold text-sm">PRO Plan</p>
                      <p className="text-gray-500 text-xs">$9.99 / month — 31 videos/month, 1080p rendering</p>
                    </div>
                  </div>
                  {sub && (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                      sub.status === 'active' ? 'text-green-400 border-green-500/25' : 'text-yellow-400 border-yellow-500/25'
                    }`} style={{ background: sub.status === 'active' ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)' }}>
                      {sub.status === 'active' ? 'Active' : sub.status === 'cancelling' ? 'Cancelling' : sub.status}
                    </span>
                  )}
                </div>
                {sub?.current_period_end && (
                  <p className="text-xs text-gray-500">
                    {sub.status === 'cancelling' ? 'Access until' : 'Next billing date'}:{' '}
                    <span className="text-gray-300">{formatDate(sub.current_period_end)}</span>
                  </p>
                )}
                <div className="flex gap-4">
                  <button onClick={() => navigate('/app?manage=true')}
                    className="text-xs text-sky-400 hover:text-sky-300 transition-colors">
                    Manage subscription →
                  </button>
                  <button onClick={() => navigate('/app?upgrade=unlimited')}
                    className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors">
                    Upgrade to Unlimited →
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold text-sm">Free Plan</p>
                  <p className="text-gray-500 text-xs">5 videos per month, 720p rendering</p>
                </div>
                <button
                  onClick={() => navigate('/app?upgrade=true')}
                  className="px-4 py-2 rounded-lg text-xs font-bold transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)' }}>
                  Upgrade to PRO
                </button>
              </div>
            )}
          </div>
        </motion.section>

        {/* Referral */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Referrals</h2>
          <div className="rounded-xl p-5 border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.03)' }}>
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-sky-500 border-t-transparent" />
              </div>
            ) : referral ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white font-medium">🎁 Invite friends, earn credits</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Each friend who signs up gives you both +1 bonus credit.
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{referral.uses}</p>
                    <p className="text-xs text-gray-500">referred</p>
                  </div>
                </div>

                {referralLink && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">Your referral link</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 rounded-lg px-3 py-2 border border-white/10 text-xs text-sky-300 font-mono truncate"
                        style={{ background: 'rgba(255,255,255,0.02)' }}>
                        {referralLink}
                      </div>
                      <button onClick={handleCopy}
                        className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: copied ? 'rgba(34,197,94,0.15)' : 'linear-gradient(135deg, #3b82f6, #0ea5e9)',
                          border: copied ? '1px solid rgba(34,197,94,0.4)' : 'none',
                          color: copied ? '#4ade80' : 'white'
                        }}>
                        {copied ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}

                {referral.uses > 0 && (
                  <p className="text-xs text-green-400">
                    You've earned +{referral.uses} bonus credit{referral.uses !== 1 ? 's' : ''} from referrals!
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-2">Could not load referral info.</p>
            )}
          </div>
        </motion.section>

        {/* Account actions */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Account</h2>
          <div className="rounded-xl border border-white/[0.06] overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <button onClick={() => navigate('/app')}
              className="w-full text-left px-5 py-4 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-between border-b border-white/[0.06]">
              <span>🎬 Open App</span>
              <span className="text-gray-600">→</span>
            </button>
            {user.role === 'admin' && (
              <button onClick={() => navigate('/admin')}
                className="w-full text-left px-5 py-4 text-sm text-orange-400 hover:text-orange-300 hover:bg-white/5 transition-colors flex items-center justify-between border-b border-white/[0.06]">
                <span>⚙️ Admin Panel</span>
                <span className="text-orange-600">→</span>
              </button>
            )}
            <button onClick={logout}
              className="w-full text-left px-5 py-4 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors flex items-center justify-between">
              <span>Sign out</span>
              <span className="text-red-600">→</span>
            </button>
          </div>
        </motion.section>

      </div>
    </div>
  );
}
