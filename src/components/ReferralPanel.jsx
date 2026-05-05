import React, { useEffect, useState } from 'react';

export default function ReferralPanel({ onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/user/referral', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const referralLink = stats?.code
    ? `${window.location.origin}/?ref=${stats.code}`
    : null;

  const handleCopy = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <div className="w-full max-w-sm mx-4 rounded-2xl border border-white/10 p-6 shadow-2xl"
        style={{ background: 'rgba(10,15,30,0.98)' }}
        onClick={e => e.stopPropagation()}>

        <div className="text-center mb-5">
          <div className="text-3xl mb-2">🎁</div>
          <h2 className="text-white font-bold text-lg mb-1">Invite friends, earn credits</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Share your link. When a friend signs up, they get <span className="text-green-400 font-medium">+1 bonus credit</span> and so do you.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : referralLink ? (
          <>
            <div className="rounded-xl border border-white/10 p-3 mb-3"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              <p className="text-xs text-gray-500 mb-1">Your referral link</p>
              <p className="text-sm text-blue-300 font-mono break-all">{referralLink}</p>
            </div>

            <button onClick={handleCopy}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all mb-4"
              style={{
                background: copied
                  ? 'rgba(34,197,94,0.15)'
                  : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                border: copied ? '1px solid rgba(34,197,94,0.4)' : 'none',
                color: copied ? '#4ade80' : 'white'
              }}>
              {copied ? '✓ Copied!' : 'Copy link'}
            </button>

            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-sm text-gray-400">Friends referred</span>
              <span className="text-white font-bold text-lg">{stats.uses}</span>
            </div>

            {stats.uses > 0 && (
              <p className="text-center text-xs text-green-400 mt-3">
                You've earned +{stats.uses} bonus credit{stats.uses !== 1 ? 's' : ''} from referrals!
              </p>
            )}
          </>
        ) : (
          <p className="text-center text-gray-500 text-sm py-4">Could not load referral info.</p>
        )}

        <button onClick={onClose}
          className="w-full mt-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white transition-colors">
          Close
        </button>
      </div>
    </div>
  );
}
