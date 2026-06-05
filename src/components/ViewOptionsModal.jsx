import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { useLanguage } from '../context/LanguageContext';

const NM = "'Neue Montreal', 'Inter', sans-serif";

const LAYOUT_ICONS = [
  {
    mode: 0,
    icon: (active) => (
      <svg width="64" height="40" viewBox="0 0 64 40" fill="none">
        {/* One full-width row: audio card + image card */}
        <rect x="2" y="8" width="27" height="24" rx="4"
          fill={active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)'}
          stroke={active ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.14)'} strokeWidth="1.2"/>
        <line x1="9"  y1="20" x2="23" y2="20" stroke={active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.18)'} strokeWidth="1.1" strokeLinecap="round"/>
        <line x1="9"  y1="15" x2="19" y2="15" stroke={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)'} strokeWidth="0.9" strokeLinecap="round"/>
        <line x1="9"  y1="25" x2="16" y2="25" stroke={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)'} strokeWidth="0.9" strokeLinecap="round"/>
        <text x="33" y="22" textAnchor="middle" fill={active ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.2)'} fontSize="8" fontFamily="sans-serif">+</text>
        <rect x="36" y="8" width="26" height="24" rx="4"
          fill={active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)'}
          stroke={active ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.14)'} strokeWidth="1.2"/>
        <rect x="42" y="13" width="14" height="14" rx="2"
          fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.09)'}/>
      </svg>
    ),
  },
  {
    mode: 2,
    icon: (active) => (
      <svg width="64" height="40" viewBox="0 0 64 40" fill="none">
        {/* Pair 1 */}
        <rect x="1" y="8" width="12" height="24" rx="3"
          fill={active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)'}
          stroke={active ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.14)'} strokeWidth="1.2"/>
        <line x1="4"  y1="20" x2="11" y2="20" stroke={active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.18)'} strokeWidth="1" strokeLinecap="round"/>
        <text x="17" y="22" textAnchor="middle" fill={active ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.2)'} fontSize="7" fontFamily="sans-serif">+</text>
        <rect x="21" y="8" width="12" height="24" rx="3"
          fill={active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)'}
          stroke={active ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.14)'} strokeWidth="1.2"/>
        <rect x="24" y="13" width="6" height="14" rx="1.5"
          fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.09)'}/>
        {/* Pair 2 */}
        <rect x="38" y="8" width="12" height="24" rx="3"
          fill={active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)'}
          stroke={active ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.14)'} strokeWidth="1.2"/>
        <line x1="41" y1="20" x2="48" y2="20" stroke={active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.18)'} strokeWidth="1" strokeLinecap="round"/>
        <text x="54" y="22" textAnchor="middle" fill={active ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.2)'} fontSize="7" fontFamily="sans-serif">+</text>
        <rect x="57" y="8" width="6" height="24" rx="2"
          fill={active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)'}
          stroke={active ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.14)'} strokeWidth="1.2"/>
      </svg>
    ),
  },
  {
    mode: 3,
    icon: (active) => (
      <svg width="64" height="40" viewBox="0 0 64 40" fill="none">
        {/* Pair 1 */}
        <rect x="1" y="9" width="8" height="22" rx="2"
          fill={active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)'}
          stroke={active ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.14)'} strokeWidth="1.2"/>
        <line x1="3"  y1="20" x2="7.5" y2="20" stroke={active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.18)'} strokeWidth="0.9" strokeLinecap="round"/>
        <text x="13" y="21.5" textAnchor="middle" fill={active ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.2)'} fontSize="6" fontFamily="sans-serif">+</text>
        <rect x="17" y="9" width="8" height="22" rx="2"
          fill={active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)'}
          stroke={active ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.14)'} strokeWidth="1.2"/>
        <rect x="19" y="14" width="4" height="12" rx="1"
          fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.09)'}/>
        {/* Pair 2 */}
        <rect x="28" y="9" width="8" height="22" rx="2"
          fill={active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)'}
          stroke={active ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.14)'} strokeWidth="1.2"/>
        <line x1="30" y1="20" x2="34.5" y2="20" stroke={active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.18)'} strokeWidth="0.9" strokeLinecap="round"/>
        <text x="40" y="21.5" textAnchor="middle" fill={active ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.2)'} fontSize="6" fontFamily="sans-serif">+</text>
        <rect x="44" y="9" width="8" height="22" rx="2"
          fill={active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)'}
          stroke={active ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.14)'} strokeWidth="1.2"/>
        <rect x="46" y="14" width="4" height="12" rx="1"
          fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.09)'}/>
        {/* Pair 3 */}
        <rect x="55" y="9" width="8" height="22" rx="2"
          fill={active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)'}
          stroke={active ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.14)'} strokeWidth="1.2"/>
        <line x1="57" y1="20" x2="61.5" y2="20" stroke={active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.18)'} strokeWidth="0.9" strokeLinecap="round"/>
      </svg>
    ),
  },
];

const ViewOptionsModal = ({ isOpen, onClose }) => {
  const { page2GridMode, setPage2GridMode } = useAppStore();
  const { t } = useLanguage();

  const handleSelect = (mode) => {
    setPage2GridMode(mode);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div
            className="fixed inset-0"
            style={{ zIndex: 99998 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed',
              bottom: '72px',
              left: '16px',
              zIndex: 99999,
              background: 'rgba(8,8,14,0.96)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              border: '1px solid rgba(255,255,255,0.09)',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04) inset',
              borderRadius: 16,
              padding: '14px 14px 12px',
              fontFamily: NM,
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Compact header */}
            <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 10px 2px' }}>
              {t('view.subtitle')}
            </p>

            {/* Icon-only option row */}
            <div style={{ display: 'flex', gap: 8 }}>
              {LAYOUT_ICONS.map(({ mode, icon }) => {
                const isActive = page2GridMode === mode;
                return (
                  <motion.button
                    key={mode}
                    onClick={() => handleSelect(mode)}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: isActive ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.03)',
                      border: `1.5px solid ${isActive ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.07)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {icon(isActive)}
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
