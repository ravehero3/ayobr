import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import sleepingAlienImg from '../assets/sleeping-alien-new.png';

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
            // Perfect center positioning - centered to the entire viewport
            position: 'fixed',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px', // Reasonable size for the alien
            height: '400px', 
            zIndex: 99998, // Behind footer (99999) but above other content
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <img
            src={sleepingAlienImg}
            alt="Sleeping Alien"
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SleepingAlien;