import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import sleepingAlienImg from '../assets/sleeping-alien-updated.png';

const SleepingAlien = () => {
  const pairs = useAppStore(state => state.pairs);
  const storeIsGenerating = useAppStore(state => state.isGenerating);
  const videoGenerationStates = useAppStore(state => state.videoGenerationStates);
  const [isHidden, setIsHidden] = useState(false);
  const revealTimer = useRef(null);

  const isGenerating = storeIsGenerating || Object.values(videoGenerationStates).some(s => s?.isGenerating);
  const hasCompletePairs = pairs.some(pair => pair.audio && pair.image);
  const shouldShow = isGenerating && hasCompletePairs;

  const handleMouseEnter = () => {
    if (revealTimer.current) clearTimeout(revealTimer.current);
    setIsHidden(true);
    revealTimer.current = setTimeout(() => setIsHidden(false), 3500);
  };

  return (
    <AnimatePresence mode="wait">
      {shouldShow && (
        <motion.div
          key="sleeping-alien-container"
          style={{
            position: 'fixed',
            left: 'calc(50% + 30px)',
            top: 'calc(50% + 220px)',
            width: '1200px',
            height: '800px',
            zIndex: 10001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
          initial={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }}
          animate={{ opacity: isHidden ? 0 : 1, scale: 1, x: '-50%', y: '-50%' }}
          exit={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }}
          transition={{ duration: isHidden ? 0.2 : 1.2, delay: isHidden ? 0 : 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <img
            src={sleepingAlienImg}
            alt="Sleeping Alien"
            style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </motion.div>
      )}

      {/* Ghost zone — detects hover, triggers hide. pointer-events off when alien hidden so cards are clickable */}
      {shouldShow && (
        <div
          style={{
            position: 'fixed',
            left: 'calc(50% + 30px)',
            top: 'calc(50% + 220px)',
            width: '1200px',
            height: '800px',
            zIndex: 10002,
            transform: 'translate(-50%, -50%)',
            pointerEvents: isHidden ? 'none' : 'auto',
            cursor: 'default',
          }}
          onMouseEnter={handleMouseEnter}
        />
      )}
    </AnimatePresence>
  );
};

export default SleepingAlien;
