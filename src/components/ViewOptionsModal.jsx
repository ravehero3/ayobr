import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';

const NM = "'Neue Montreal', 'Inter', sans-serif";

const LAYOUTS = [
  {
    mode: 0,
    label: '1 pár/řádek',
    desc: 'Audio + image vedle sebe',
    icon: (active) => (
      <svg width="72" height="40" viewBox="0 0 72 40" fill="none">
        {/* One full-width pair: audio + image side by side */}
        <rect x="3" y="10" width="29" height="20" rx="4"
          fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'}
          stroke={active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)'} strokeWidth="1.2"/>
        <line x1="10" y1="20" x2="26" y2="20" stroke={active ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.18)'} strokeWidth="1" strokeLinecap="round"/>
        <line x1="10" y1="15" x2="22" y2="15" stroke={active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'} strokeWidth="0.8" strokeLinecap="round"/>
        <line x1="10" y1="25" x2="20" y2="25" stroke={active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'} strokeWidth="0.8" strokeLinecap="round"/>
        <text x="36" y="22" textAnchor="middle" fill={active ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)'} fontSize="9" fontFamily="sans-serif">+</text>
        <rect x="40" y="10" width="29" height="20" rx="4"
          fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'}
          stroke={active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)'} strokeWidth="1.2"/>
        <rect x="46" y="14" width="16" height="12" rx="2"
          fill={active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)'}
          stroke="none"/>
      </svg>
    ),
  },
  {
    mode: 2,
    label: '2 páry/řádek',
    desc: 'Dva páry vedle sebe',
    icon: (active) => (
      <svg width="72" height="40" viewBox="0 0 72 40" fill="none">
        {/* Pair 1: audio + image */}
        <rect x="1" y="10" width="14" height="20" rx="3"
          fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'}
          stroke={active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)'} strokeWidth="1.2"/>
        <line x1="5" y1="20" x2="12" y2="20" stroke={active ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.18)'} strokeWidth="0.9" strokeLinecap="round"/>
        <text x="19.5" y="22" textAnchor="middle" fill={active ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)'} fontSize="8" fontFamily="sans-serif">+</text>
        <rect x="24" y="10" width="14" height="20" rx="3"
          fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'}
          stroke={active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)'} strokeWidth="1.2"/>
        <rect x="27" y="14" width="7" height="12" rx="1.5"
          fill={active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)'}/>
        {/* Pair 2: audio + image */}
        <rect x="43" y="10" width="14" height="20" rx="3"
          fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'}
          stroke={active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)'} strokeWidth="1.2"/>
        <line x1="47" y1="20" x2="54" y2="20" stroke={active ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.18)'} strokeWidth="0.9" strokeLinecap="round"/>
        <text x="61.5" y="22" textAnchor="middle" fill={active ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)'} fontSize="8" fontFamily="sans-serif">+</text>
        <rect x="66" y="10" width="5" height="20" rx="2"
          fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'}
          stroke={active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)'} strokeWidth="1.2"/>
      </svg>
    ),
  },
  {
    mode: 3,
    label: '3 páry/řádek',
    desc: 'Tři páry vedle sebe',
    icon: (active) => (
      <svg width="72" height="40" viewBox="0 0 72 40" fill="none">
        {/* Pair 1 */}
        <rect x="1" y="11" width="9" height="18" rx="2"
          fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'}
          stroke={active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)'} strokeWidth="1.2"/>
        <line x1="3.5" y1="20" x2="8" y2="20" stroke={active ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.18)'} strokeWidth="0.8" strokeLinecap="round"/>
        <text x="14.5" y="22" textAnchor="middle" fill={active ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)'} fontSize="7" fontFamily="sans-serif">+</text>
        <rect x="19" y="11" width="9" height="18" rx="2"
          fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'}
          stroke={active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)'} strokeWidth="1.2"/>
        <rect x="21" y="15" width="4" height="10" rx="1"
          fill={active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)'}/>
        {/* Pair 2 */}
        <rect x="31" y="11" width="9" height="18" rx="2"
          fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'}
          stroke={active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)'} strokeWidth="1.2"/>
        <line x1="33.5" y1="20" x2="38" y2="20" stroke={active ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.18)'} strokeWidth="0.8" strokeLinecap="round"/>
        <text x="44.5" y="22" textAnchor="middle" fill={active ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)'} fontSize="7" fontFamily="sans-serif">+</text>
        <rect x="49" y="11" width="9" height="18" rx="2"
          fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'}
          stroke={active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)'} strokeWidth="1.2"/>
        <rect x="51" y="15" width="4" height="10" rx="1"
          fill={active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)'}/>
        {/* Pair 3 */}
        <rect x="61" y="11" width="9" height="18" rx="2"
          fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'}
          stroke={active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)'} strokeWidth="1.2"/>
        <line x1="63.5" y1="20" x2="68" y2="20" stroke={active ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.18)'} strokeWidth="0.8" strokeLinecap="round"/>
      </svg>
    ),
  },
];

const ViewOptionsModal = ({ isOpen, onClose }) => {
  const { page2GridMode, setPage2GridMode } = useAppStore();

  const handleSelect = (mode) => {
    setPage2GridMode(mode);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Click outside to close */}
          <div
            className="fixed inset-0"
            style={{ zIndex: 99998 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed',
              bottom: '72px',
              left: '16px',
              zIndex: 99999,
              width: 280,
              background: 'rgba(8,8,12,0.97)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset',
              borderRadius: 16,
              padding: '16px',
              fontFamily: NM,
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ marginBottom: 12 }}>
              <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '0.82rem', margin: 0, letterSpacing: '-0.01em' }}>
                Zobrazení
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.68rem', margin: '3px 0 0' }}>
                Počet párů na řádek
              </p>
            </div>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {LAYOUTS.map(({ mode, label, desc, icon }) => {
                const isActive = page2GridMode === mode;
                return (
                  <motion.button
                    key={mode}
                    onClick={() => handleSelect(mode)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: isActive ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.03)',
                      border: `1.5px solid ${isActive ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.07)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <div style={{ flexShrink: 0 }}>{icon(isActive)}</div>
                    <div>
                      <div style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.55)', fontWeight: 600, fontSize: '0.78rem' }}>
                        {label}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.65rem', marginTop: 1 }}>
                        {desc}
                      </div>
                    </div>
                    {isActive && (
                      <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.7)', flexShrink: 0 }} />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ViewOptionsModal;
