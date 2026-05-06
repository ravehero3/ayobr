import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import typebeatLogo from '../assets/typebeatz logo 2 white version_1754509091303.png';

export default function Navbar({ onUpgrade, checkoutLoading, onManageSubscription, onInvite }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const isPro = user?.role === 'pro' || user?.role === 'admin';
  const creditsLeft = user?.credits?.credits_remaining;

  return (
    <div className="fixed top-0 left-0 right-0 z-[10000] flex items-center justify-between px-6 h-14"
      style={{
        background: 'rgba(5,10,19,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>

      <button onClick={() => navigate('/')} className="hover:opacity-80 transition-opacity">
        <img src={typebeatLogo} alt="TypeBeatz" style={{ height: 18 }} />
      </button>

      <div className="flex items-center gap-3">
        {/* Free user: credit badge + upgrade button */}
        {user && !isPro && (
          <>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 text-xs text-gray-300"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              <span>🎟️</span>
              <span>{creditsLeft ?? 5} credits left</span>
            </div>
            {onUpgrade && (
              <button
                onClick={onUpgrade}
                disabled={checkoutLoading}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 flex items-center gap-1.5"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)' }}>
                {checkoutLoading ? (
                  <>
                    <span className="inline-block w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                    Opening...
                  </>
                ) : 'Go PRO'}
              </button>
            )}
          </>
        )}

        {/* PRO badge — clickable to manage subscription */}
        {user && isPro && user.role !== 'admin' && (
          <button
            onClick={onManageSubscription}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-500/40 text-blue-300 hover:border-blue-400/70 transition-colors text-xs font-bold"
            style={{ background: 'rgba(59,130,246,0.1)' }}
            title="Manage subscription">
            ⭐ PRO
          </button>
        )}

        {/* Admin badge */}
        {user?.role === 'admin' && (
          <span className="px-3 py-1 rounded-full text-xs font-bold border border-orange-500/40 text-orange-300"
            style={{ background: 'rgba(249,115,22,0.1)' }}>
            ⚙️ Admin
          </span>
        )}

        {/* Admin panel link */}
        {user?.role === 'admin' && (
          <button onClick={() => navigate('/admin')}
            className="text-sm text-orange-400 hover:text-orange-300 transition-colors">
            Panel
          </button>
        )}

        {/* User avatar + dropdown menu */}
        {user ? (
          <div className="relative">
            <button onClick={() => setMenuOpen(v => !v)} className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 group-hover:border-blue-400/50 transition-colors">
                {user.profile_image_url ? (
                  <img src={user.profile_image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-500/20 text-blue-300 text-sm font-bold">
                    {(user.first_name?.[0] || user.email?.[0] || '?').toUpperCase()}
                  </div>
                )}
              </div>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-10 z-50 w-52 rounded-xl border border-white/10 py-1 shadow-2xl"
                  style={{ background: 'rgba(10,15,30,0.97)', backdropFilter: 'blur(16px)' }}>
                  <div className="px-4 py-2 border-b border-white/10">
                    <p className="text-sm font-medium text-white truncate">{user.first_name || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email || ''}</p>
                  </div>
                  <button onClick={() => { navigate('/app'); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                    🎬 App
                  </button>
                  <button onClick={() => { navigate('/account'); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                    👤 Account settings
                  </button>
                  {!isPro && onUpgrade && (
                    <button onClick={() => { onUpgrade(); setMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-white/5 transition-colors">
                      ⭐ Upgrade to PRO
                    </button>
                  )}
                  {isPro && user.role !== 'admin' && onManageSubscription && (
                    <button onClick={() => { onManageSubscription(); setMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-white/5 transition-colors">
                      ⭐ Manage subscription
                    </button>
                  )}
                  {user.role === 'admin' && (
                    <button onClick={() => { navigate('/admin'); setMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-orange-400 hover:text-orange-300 hover:bg-white/5 transition-colors">
                      ⚙️ Admin Panel
                    </button>
                  )}
                  <button onClick={() => { onInvite && onInvite(); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-green-400 hover:text-green-300 hover:bg-white/5 transition-colors">
                    🎁 Invite friends (+1 credit)
                  </button>
                  <button onClick={logout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors border-t border-white/5 mt-1">
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button onClick={() => navigate('/login')}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)' }}>
            Sign In
          </button>
        )}
      </div>
    </div>
  );
}
