import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import sleepingAlienImg from '../assets/sleeping-alien-updated.png';

const SleepingAlien = () => {
  // Get reactive state from Zustand store
  const pairs = useAppStore(state => state.pairs);
  const storeIsGenerating = useAppStore(state => state.isGenerating);
  const videoGenerationStates = useAppStore(state => state.videoGenerationStates);

  // Check if any pair is currently generating
  const isGenerating = storeIsGenerating || Object.values(videoGenerationStates).some(state => state?.isGenerating);

  // Only show during active video generation - more strict conditions
  const hasCompletePairs = pairs.some(pair => pair.audio && pair.image);

  // Debug logging to verify conditions
  console.log('SleepingAlien Debug:', {
    storeIsGenerating,
    isGenerating,
    hasCompletePairs,
    shouldShow: isGenerating && hasCompletePairs,
    videoGenerationStatesCount: Object.keys(videoGenerationStates).length
  });

  // Show only when actually generating videos
  const shouldShow = isGenerating && hasCompletePairs;

  return (
    <AnimatePresence mode="wait">
      {shouldShow && (
        <motion.div
          key="sleeping-alien-container" 
          className="pointer-events-none"
          style={{
            position: 'fixed',
            left: 'calc(50% + 30px)',
            top: 'calc(50% + 220px)',
            width: '1200px',
            height: '800px',
            zIndex: 9998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          initial={{ opacity: 0, scale: 0.95, x: '-50%', y: '-50%' }}
          animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
          exit={{ opacity: 0, scale: 0.95, x: '-50%', y: '-50%' }}
          transition={{ 
            duration: 0.8, 
            ease: [0.4, 0.0, 0.2, 1]
          }}
        >
          <motion.img
            src={sleepingAlienImg}
            alt="Sleeping Alien"
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SleepingAlien;