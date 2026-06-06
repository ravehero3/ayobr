import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { useLanguage } from '../context/LanguageContext';

const NM = "'Neue Montreal', 'Inter', sans-serif";

/*
  Each option shows a miniature grid of pair cards.
  A pair = [wide audio rect] + [square image] — matching the real page 2 layout.
*/

const PairRow = ({ x, y, w, h, active }) => {
  const audioW = Math.round(w * 0.62);
  const imgW   = Math.round(w * 0.32);
  const gap    = w - audioW - imgW;
  const fill   = active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.09)';
  const stroke = active ? 'rgba(255,255,255,0.40)' : 'rgba(255,255,255,0.16)';
  return (
    <g>
      <rect x={x} y={y} width={audioW} height={h} rx="2" fill={fill} stroke={stroke} strokeWidth="0.8" />
      <rect x={x + audioW + gap} y={y} width={imgW} height={h} rx="2" fill={fill} stroke={stroke} strokeWidth="0.8" />
    </g>
  );
};

const LAYOUT_OPTIONS = [
  {
    mode: 0,
    icon: (active) => (
      <svg width="72" height="48" viewBox="0 0 72 48" fill="none">
        <PairRow x={2}  y={4}  w={68} h={11} active={active} />
        <PairRow x={2}  y={19} w={68} h={11} active={active} />
        <PairRow x={2}  y={34} w={68} h={11} active={active} />
      </svg>
    ),
  },
  {
    mode: 2,
    icon: (active) => (
      <svg width="72" height="48" viewBox="0 0 72 48" fill="none">
        <PairRow x={2}  y={4}  w={32} h={11} active={active} />
        <PairRow x={38} y={4}  w={32} h={11} active={active} />
        <PairRow x={2}  y={19} w={32} h={11} active={active} />
        <PairRow x={38} y={19} w={32} h={11} active={active} />
        <PairRow x={2}  y={34} w={32} h={11} active={active} />
        <PairRow x={38} y={34} w={32} h={11} active={active} />
      </svg>
    ),
  },
  {
    mode: 3,
    icon: (active) => (
      <svg width="72" height="48" viewBox="0 0 72 48" fill="none">
        <PairRow x={2}  y={4}  w={20} h={11} active={active} />
        <PairRow x={26} y={4}  w={20} h={11} active={active} />
        <PairRow x={50} y={4}  w={20} h={11} active={active} />
        <PairRow x={2}  y={19} w={20} h={11} active={active} />
        <PairRow x={26} y={19} w={20} h={11} active={active} />
        <PairRow x={50} y={19} w={20} h={11} active={active} />
        <PairRow x={2}  y={34} w={20} h={11} active={active} />
        <PairRow x={26} y={34} w={20} h={11} active={active} />
        <PairRow x={50} y={34} w={20} h={11} active={active} />
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
          <div className="fixed inset-0" style={{ zIndex: 99998 }} onClick={onClose} />
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
              borderRadius: 14,
              padding: '10px 10px 8px',
              fontFamily: NM,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', gap: 6 }}>
              {LAYOUT_OPTIONS.map(({ mode, icon }) => {
                const isActive = page2GridMode === mode;
                return (
                  <motion.button
                    key={mode}
                    onClick={() => handleSelect(mode)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: isActive ? 'rgba(255,255,255,0.11)' : 'transparent',
                      border: `1px solid ${isActive ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.06)'}`,
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
