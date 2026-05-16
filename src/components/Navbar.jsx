import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from './LanguageToggle';
import typebeatLogo from '../assets/typebeatz logo 2 white version_1754509091303.png';

const NM = "'Neue Montreal', 'Inter', sans-serif";

export default function Navbar({ onUpgradePro, onUpgradeUnlimited, checkoutLoading, onManageSubscription, onInvite }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const isUnlimited = user?.role === 'unlimited';
  const isPro       = user?.role === 'pro';
  const isAdmin     = user?.role === 'admin';
  const isPaidPlan  = isPro || isUnlimited || isAdmin;
  const creditsLeft = user?.credits?.credits_remaining;

  return (
    <nav className="fixed top-0 left-0 right-0 z-[10000] flex items-center justify-between px-4 md:px-[64px] py-4"
      style={{ 
        background: 'rgba(0,0,0,0.38)', 
        backdropFilter: 'blur(16px)', 
        WebkitBackdropFilter: 'blur(16px)', 
        borderBottom: '1px solid rgba(255,255,255,0.06)' 
      }}>

      <button onClick={() => navigate('/')} className="hover:opacity-80 transition-opacity" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
        <img src={typebeatLogo} alt="TypeBeatz" style={{ height: 20 }} />
      </button>

      <div className="flex items-center gap-4">

        {/* Free user: credit badge + upgrade button */}
        {user && !isPaidPlan && (
          <>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 text-xs text-gray-300"
              style={{ background: 'rgba(255,255,255,0.04)', fontFamily: NM }}>
              <span>{creditsLeft ?? 5} {t('creditsLeft')}</span>
            </div>
            {onUpgradePro && (
              <button onClick={onUpgradePro} disabled={checkoutLoading}
                className="transition-opacity hover:opacity-80 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                style={{ fontFamily: NM, fontWeight: 600, fontSize: '0.8rem', lineHeight: 1.5, background: '#fff', border: 'none', color: '#000', padding: '6px 14px', borderRadius: 9999, cursor: 'pointer' }}>
                {checkoutLoading ? (
                  <><span className="inline-block w-3 h-3 border border-black/40 border-t-black rounded-full animate-spin" />Opening...</>
                ) : t('goPro')}
              </button>
            )}
          </>
        )}

        {/* PRO user: show credit count + badge */}
        {user && isPro && (
          <>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 text-xs text-gray-300"
              style={{ background: 'rgba(255,255,255,0.04)', fontFamily: NM }}>
              <span>{creditsLeft ?? 31} / 31 left</span>
            </div>
            <button onClick={onManageSubscription}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/20 text-white hover:border-white/50 transition-colors text-xs font-bold"
              style={{ background: 'rgba(255,255,255,0.05)', fontFamily: NM }}>
              PRO
            </button>
          </>
        )}

        {/* UNLIMITED badge */}
        {user && isUnlimited && (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-white/20 text-white"
            style={{ background: 'rgba(255,255,255,0.05)', fontFamily: NM }}>
            UNLIMITED
          </span>
        )}

        {/* Admin badge */}
        {isAdmin && (
          <>
            <span className="px-3 py-1 rounded-full text-xs font-bold border border-white/20 text-white"
              style={{ background: 'rgba(255,255,255,0.05)', fontFamily: NM }}>
              Admin
            </span>
            <button onClick={() => navigate('/admin')}
              className="text-sm text-gray-400 hover:text-white transition-colors"
              style={{ fontFamily: NM }}>
              Panel
            </button>
          </>
        )}

        <LanguageToggle />

        {/* User avatar + dropdown */}
        {user ? (
          <div className="relative">
            <button onClick={() => setMenuOpen(v => !v)} className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 group-hover:border-white/50 transition-colors">
                {user.profile_image_url ? (
                  <img
                    src={user.profile_image_url}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                  />
                ) : null}
                <div
                  className="w-full h-full items-center justify-center bg-white/10"
                  style={{ display: user.profile_image_url ? 'none' : 'flex' }}
                >
                  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <rect width="40" height="40" fill="rgba(255,255,255,0.06)"/>
                    <circle cx="20" cy="15" r="7" fill="rgba(255,255,255,0.25)"/>
                    <path d="M4 38c0-8.837 7.163-16 16-16s16 7.163 16 16" fill="rgba(255,255,255,0.18)"/>
                  </svg>
                </div>
              </div>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-12 z-50 w-52 rounded-xl border border-white/10 py-1 shadow-2xl"
                  style={{ background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(16px)', fontFamily: NM }}>
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-sm font-medium text-white truncate">{user.first_name || 'User'}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email || ''}</p>
                  </div>
                  <div className="py-1">
                    <button onClick={() => { navigate('/app'); setMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                      App
                    </button>
                    <button onClick={() => { navigate('/account'); setMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                      Account settings
                    </button>
                  </div>
                  
                  <div className="py-1 border-t border-white/5">
                    {!isPaidPlan && onUpgradePro && (
                      <button onClick={() => { onUpgradePro(); setMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors font-medium">
                        Upgrade to PRO
                      </button>
                    )}
                    {!isPaidPlan && onUpgradeUnlimited && (
                      <button onClick={() => { onUpgradeUnlimited(); setMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors font-medium">
                        Go Unlimited
                      </button>
                    )}
                    {isPro && onManageSubscription && (
                      <button onClick={() => { onManageSubscription(); setMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors">
                        Manage subscription
                      </button>
                    )}
                    {isUnlimited && onManageSubscription && (
                      <button onClick={() => { onManageSubscription(); setMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors">
                        Manage subscription
                      </button>
                    )}
                  </div>

                  <div className="py-1 border-t border-white/5">
                    {isAdmin && (
                      <button onClick={() => { navigate('/admin'); setMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors">
                        Admin Panel
                      </button>
                    )}
                  </div>
                  
                  <div className="py-1 border-t border-white/5">
                    <button onClick={logout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <button onClick={() => navigate('/login')}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all hover:opacity-80"
            style={{ background: '#fff', color: '#000', fontFamily: NM }}>
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}
