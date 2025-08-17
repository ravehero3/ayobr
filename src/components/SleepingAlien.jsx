import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import sleepingAlienImg from '../assets/mraky-a-zzz.png';

const SleepingAlien = () => {
  // Get reactive state from Zustand store
  const pairs = useAppStore(state => state.pairs);
  const storeIsGenerating = useAppStore(state => state.isGenerating);
  const videoGenerationStates = useAppStore(state => state.videoGenerationStates);

  // Check if any pair is currently generating
  const isGenerating = storeIsGenerating || Object.values(videoGenerationStates).some(state => state?.isGenerating);

  // Enhanced page detection
  const hasFiles = pairs.some(pair => pair.audio || pair.image);
  const hasCompletePairs = pairs.some(pair => pair.audio && pair.image);

  return (
    <AnimatePresence>
      {isGenerating && hasFiles && hasCompletePairs && (
        <motion.div
          key="sleeping-alien-container"
          className="fixed inset-0 pointer-events-none"
          style={{
            zIndex: 9999, // Highest z-index to be above everything
            isolation: 'isolate', // Create completely separate stacking context
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <img
            src={sleepingAlienImg}
            alt="Sleeping Alien"
            style={{
              position: 'fixed',
              left: '50%',
              bottom: '0', // Position from bottom instead of top
              marginLeft: '-40vw', // Half of 80vw to center it
              marginBottom: '-10vh', // Move slightly below bottom edge
              width: '80vw',
              height: 'auto',
              filter: 'none !important',
              backdropFilter: 'none !important',
              WebkitBackdropFilter: 'none !important',
              imageRendering: 'auto',
              WebkitImageRendering: 'auto',
              MozImageRendering: 'auto',
              msInterpolationMode: 'bicubic',
              isolation: 'isolate',
              mixBlendMode: 'normal',
              opacity: 1,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SleepingAlien;