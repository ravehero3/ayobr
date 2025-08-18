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
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          key="sleeping-alien-container" 
          className="pointer-events-none"
          style={{
            // Perfect center positioning - moved 170px higher and 560px to the left
            position: 'fixed',
            left: 'calc(50% - 560px)',
            top: 'calc(50% - 170px)',
            transform: 'translate(-50%, -50%)',
            width: '1200px', // 2x bigger (600px * 2)
            height: '800px', // 2x bigger (400px * 2)
            zIndex: 99998, // Behind footer (99999) but above other content
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut", delay: 0.2 }}
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
            initial={{ opacity: 0, filter: 'brightness(0)' }}
            animate={{ opacity: 1, filter: 'brightness(1)' }}
            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SleepingAlien;