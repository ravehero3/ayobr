import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import sleepingAlienImg from '../assets/mraky-a-zzz.png';

const AnimatedBackground = () => {
  // Get reactive state from Zustand store - these will trigger re-renders
  const pairs = useAppStore(state => state.pairs);
  const generatedVideos = useAppStore(state => state.generatedVideos);
  const storeIsGenerating = useAppStore(state => state.isGenerating);
  const videoGenerationStates = useAppStore(state => state.videoGenerationStates);

  // Check if any pair is currently generating
  const isGenerating = storeIsGenerating || Object.values(videoGenerationStates).some(state => state?.isGenerating);

  const [backgroundLoaded, setBackgroundLoaded] = useState({});

  // Enhanced page detection with multiple state checks
  const hasFiles = pairs.some(pair => pair.audio || pair.image);
  const hasVideos = generatedVideos.length > 0;
  const hasCompletePairs = pairs.some(pair => pair.audio && pair.image);

  // We no longer need page detection for the progressive background system

  // Calculate progress level (0-4) based on user actions
  let progressLevel = 0;
  if (hasFiles) progressLevel = 1; // Files added
  if (hasCompletePairs) progressLevel = 2; // Complete pairs created
  if (isGenerating || hasVideos) progressLevel = 3; // Video generation started/completed
  if (hasVideos && !isGenerating) progressLevel = 4; // Videos ready for download

  // Debug logging for progress detection
  console.log('AnimatedBackground: Progress level:', progressLevel);
  console.log('AnimatedBackground: Has files:', hasFiles);
  console.log('AnimatedBackground: Pairs:', pairs);
  console.log('AnimatedBackground: Has complete pairs:', hasCompletePairs);
  console.log('AnimatedBackground: Has videos:', hasVideos);
  console.log('AnimatedBackground: Is generating:', isGenerating);

  // Preload both background images when needed
  useEffect(() => {
    // Preload Page 1 background
    if (!backgroundLoaded.page1) {
      const img1 = new Image();
      img1.onload = () => {
        console.log('AnimatedBackground: Page 1 PNG loaded');
        setBackgroundLoaded(prev => ({
          ...prev,
          page1: true
        }));
      };
      img1.src = '/attached_assets/page%201_1754508034866.png';
    }

    // Preload Page 2 background (Earth from Space)
    if (!backgroundLoaded.page2) {
      const img2 = new Image();
      img2.onload = () => {
        console.log('AnimatedBackground: Page 2 Earth background loaded');
        setBackgroundLoaded(prev => ({
          ...prev,
          page2: true
        }));
      };
      img2.src = '/attached_assets/background%20page%202_1754507959583.jpg';
    }
  }, [backgroundLoaded]);

  // Background logic:
  // - Always show page 1 background as base
  // - Apply blur when files are added
  // - Show Earth background (page 4) when videos are generated

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden" style={{ zIndex: -10 }}>


      {/* Single background layer that transitions blur smoothly */}
      <motion.div
        className="absolute inset-0 w-full h-full bg-cover bg-center"
        style={{
          backgroundImage: backgroundLoaded.page1
            ? 'url(/attached_assets/page%201_1754508034866.png)'
            : 'none',
          backgroundColor: '#000000',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: -12
        }}
        animate={{
          filter: hasFiles && !hasVideos && !isGenerating ? 'blur(20px)' : 'blur(0px)', // 20px blur when files added but not generating, no blur when generating or initially
        }}
        transition={{ duration: 1.0, ease: "easeInOut" }}
      />

      {/* Page 4 background (Earth) - shown when videos are generated */}
      <AnimatePresence>
        {hasVideos && !isGenerating && (
          <motion.div
            key="page4"
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            style={{
              backgroundImage: backgroundLoaded.page2
                ? 'url(/attached_assets/background%20page%202_1754507959583.jpg)'
                : 'none',
              backgroundColor: '#000000',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              zIndex: -11 // Above the main background
            }}
          />
        )}
      </AnimatePresence>

      {/* Background Overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        style={{
          zIndex: 1,
          pointerEvents: 'none'
        }}
      />

      {/* Sleeping Alien - only visible during video generation, positioned behind footer */}
      {isGenerating && (
        <motion.img
          key="sleeping-alien-big" // Unique key to prevent conflicts
          src={sleepingAlienImg}
          alt="Sleeping Alien"
          className="absolute" // Removed size classes to use custom width
          style={{
            left: 'calc(50% - 580px)', // Moved 20px more to the left (560px + 20px = 580px total)
            top: 'calc(50% - 170px)', // Moved 80px higher (90px + 80px = 170px total)
            transform: 'translateX(-50%) translateY(-50%)',
            width: '80vw', // Increased from 66.67vw to 80vw (bigger)
            height: 'auto', // Maintain aspect ratio
            zIndex: 1000, // Above blur effects and other background elements
            opacity: 1,
            filter: 'none', // Explicitly no filters - no blur or effects
            // No blur or brightness filters - keep original image quality
            pointerEvents: 'none', // Don't interfere with UI interactions
          }}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      )}

    </div>
  );
};

export default AnimatedBackground;