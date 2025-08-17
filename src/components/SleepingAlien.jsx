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

  // TEMPORARY: Always show for testing
  const alwaysShow = true;

  return (
    <AnimatePresence>
      {alwaysShow && (
        <motion.div
          key="sleeping-alien-container" 
          className="pointer-events-none sleeping-alien-no-blur"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9950, // Above background and loading window
            isolation: 'isolate',
            filter: 'none !important',
            backdropFilter: 'none !important',
            WebkitBackdropFilter: 'none !important',
            // Create a completely new rendering context
            willChange: 'transform, opacity',
            transform: 'translateZ(0)', // Force new composite layer
            contain: 'strict', // Full containment
            // Temporary background to see if container renders
            backgroundColor: 'rgba(0, 255, 0, 0.5)' // Green background for testing
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div
            style={{
              // Create another isolation layer
              position: 'fixed',
              left: '50%',
              bottom: '10vh',
              transform: 'translateX(-50%)',
              width: '40vw',
              maxWidth: '600px',
              minWidth: '300px',
              height: 'auto',
              isolation: 'isolate',
              filter: 'none !important',
              backdropFilter: 'none !important',
              WebkitBackdropFilter: 'none !important',
              transform: 'translateZ(0)',
              willChange: 'transform',
              contain: 'layout style paint',
            }}
          >
            <img
              src={sleepingAlienImg}
              alt="Sleeping Alien"
              style={{
                // Complete override of any inherited styles
                display: 'block',
                position: 'relative',
                width: '100%',
                height: 'auto',
                maxHeight: '30vh',
                objectFit: 'contain',
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
              // Ensure no inherited blur effects
              transform: 'translateZ(0)',
              willChange: 'transform',
              // Force no blur with CSS variables override
              '--webkit-backdrop-filter': 'none !important',
              '--backdrop-filter': 'none !important',
              // Create new stacking context
              contain: 'layout style paint',
              // Override any parent blur effects with more specificity
              WebkitFilter: 'none !important',
              msFilter: 'none !important',
              filter: 'none !important',
              // Force hardware acceleration
              WebkitTransform: 'translate3d(0, 0, 0)',
              transform: 'translate3d(0, 0, 0)',
              // Ensure crisp rendering
              imageRendering: 'auto',
              WebkitImageRendering: 'auto',
              // Additional blur prevention
              backdropFilter: 'none !important',
              WebkitBackdropFilter: 'none !important',
            }}
          />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SleepingAlien;