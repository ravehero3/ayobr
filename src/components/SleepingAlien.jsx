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
          <motion.img
            src={sleepingAlienImg}
            alt="Sleeping Alien"
            style={{
              position: 'absolute',
              left: 'calc(50% - 540px)', // Original position 580px, moved 40px right = 540px
              top: 'calc(50% - 220px)', // Keep same vertical position
              transform: 'translateX(-50%) translateY(-50%)',
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
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SleepingAlien;