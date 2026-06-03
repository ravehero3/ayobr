import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import page1Background from '../assets/page-1-background.png';

const NM = "'Neue Montreal', 'Inter', sans-serif";

const LAYOUTS = [
  {
    mode: 0,
    label: 'Výchozí',
    desc: '1 pár na řádek — horizontálně',
    icon: (active) => (
      <svg width="72" height="44" viewBox="0 0 72 44" fill="none">
        <rect x="2" y="12" width="30" height="20" rx="4"
          fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)'}
          stroke={active ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'} strokeWidth="1"/>
        <text x="36" y="24.5" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="sans-serif">+</text>
        <rect x="40" y="12" width="30" height="20" rx="4"
          fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)'}
          stroke={active ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'} strokeWidth="1"/>
      </svg>
    ),
  },
  {
    mode: 1,
    label: 'Kompaktní',
    desc: '1 pár na řádek — užší kontejnery',
    icon: (active) => (
      <svg width="72" height="44" viewBox="0 0 72 44" fill="none">
        <rect x="8" y="12" width="22" height="20" rx="4"
          fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)'}
          stroke={active ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'} strokeWidth="1"/>
        <text x="36" y="24.5" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="sans-serif">+</text>
        <rect x="42" y="12" width="22" height="20" rx="4"
          fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)'}
          stroke={active ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'} strokeWidth="1"/>
      </svg>
    ),
  },
  {
    mode: 2,
    label: '2 sloupce',
    desc: '2 páry vedle sebe — skládané',
    icon: (active) => (
      <svg width="72" height="52" viewBox="0 0 72 52" fill="none">
        {/* Col 1 */}
        <rect x="2" y="2" width="30" height="16" rx="3"
          fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)'}
          stroke={active ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'} strokeWidth="1"/>
        <text x="17" y="27" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="sans-serif">+</text>
        <rect x="2" y="33" width="30" height="16" rx="3"
          fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)'}
          stroke={active ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'} strokeWidth="1"/>
        {/* Col 2 */}
        <rect x="40" y="2" width="30" height="16" rx="3"
          fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)'}
          stroke={active ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'} strokeWidth="1"/>
        <text x="55" y="27" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="sans-serif">+</text>
        <rect x="40" y="33" width="30" height="16" rx="3"
          fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)'}
          stroke={active ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'} strokeWidth="1"/>
      </svg>
    ),
  },
  {
    mode: 3,
    label: '3 sloupce',
    desc: '3 páry vedle sebe — skládané',
    icon: (active) => (
      <svg width="72" height="52" viewBox="0 0 72 52" fill="none">
        {/* Col 1 */}
        <rect x="1" y="2" width="20" height="16" rx="3"
          fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)'}
          stroke={active ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'} strokeWidth="1"/>
        <text x="11" y="27" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="sans-serif">+</text>
        <rect x="1" y="33" width="20" height="16" rx="3"
          fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)'}
          stroke={active ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'} strokeWidth="1"/>
        {/* Col 2 */}
        <rect x="26" y="2" width="20" height="16" rx="3"
          fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)'}
          stroke={active ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'} strokeWidth="1"/>
        <text x="36" y="27" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="sans-serif">+</text>
        <rect x="26" y="33" width="20" height="16" rx="3"
          fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)'}
          stroke={active ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'} strokeWidth="1"/>
        {/* Col 3 */}
        <rect x="51" y="2" width="20" height="16" rx="3"
          fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)'}
          stroke={active ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'} strokeWidth="1"/>
        <text x="61" y="27" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="sans-serif">+</text>
        <rect x="51" y="33" width="20" height="16" rx="3"
          fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)'}
          stroke={active ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'} strokeWidth="1"/>
      </svg>
    ),
  },
];

const GridLayoutModal = ({ isOpen, onClose }) => {
  const { page2GridMode, setPage2GridMode } = useAppStore();
  const [selected, setSelected] = useState(page2GridMode);

  React.useEffect(() => {
    if (isOpen) setSelected(page2GridMode);
  }, [isOpen, page2GridMode]);

  const handleSave = () => {
    setPage2GridMode(selected);
    onClose();
  };

  const handleCancel = () => {
    setSelected(page2GridMode);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 99999 }}
          onClick={e => { if (e.target === e.currentTarget) handleCancel(); }}
        >
          {/* Blurred background */}
          <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: '-5%', backgroundImage: `url(${page1Background})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(40px)', transform: 'scale(1.08)', opacity: 0.55 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)' }} />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'relative', zIndex: 1,
              width: '100%', maxWidth: 520,
              background: 'rgba(8,8,12,0.94)',
              backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
              border: '1px solid rgba(255,255,255,0.09)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04) inset',
              borderRadius: 20,
              padding: '28px 24px 24px',
              fontFamily: NM,
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Title */}
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', marginBottom: 4, letterSpacing: '-0.01em' }}>
                Rozložení mřížky
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>
                Vyberte, jak mají být páry zobrazeny
              </p>
            </div>

            {/* Option grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
              {LAYOUTS.map(({ mode, label, desc, icon }) => {
                const isActive = selected === mode;
                return (
                  <motion.button
                    key={mode}
                    onClick={() => setSelected(mode)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 10, padding: '16px 12px',
                      borderRadius: 14,
                      background: isActive ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.03)',
                      border: `1.5px solid ${isActive ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.07)'}`,
                      cursor: 'pointer', transition: 'all 0.18s ease',
                      boxShadow: isActive ? '0 0 0 1px rgba(255,255,255,0.08) inset' : 'none',
                    }}
                  >
                    {icon(isActive)}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.55)', fontWeight: 600, fontSize: '0.8rem', marginBottom: 2 }}>
                        {label}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.67rem', lineHeight: 1.4 }}>
                        {desc}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleCancel}
                style={{
                  flex: 1, fontFamily: NM, fontWeight: 600, fontSize: '0.82rem',
                  borderRadius: 9999, padding: '10px 0',
                  background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
                  transition: 'filter 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; }}
              >
                Zrušit
              </button>
              <button
                onClick={handleSave}
                style={{
                  flex: 1, fontFamily: NM, fontWeight: 600, fontSize: '0.82rem',
                  borderRadius: 9999, padding: '10px 0',
                  background: '#ffffff', color: '#000',
                  border: 'none', cursor: 'pointer',
                  transition: 'filter 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.88)'; }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; }}
              >
                Použít
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GridLayoutModal;
