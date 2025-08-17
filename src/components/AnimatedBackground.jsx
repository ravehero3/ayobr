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

      {/* Sleeping Alien - only visible during video generation when on file management page */}
      {isGenerating && hasFiles && hasCompletePairs && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            zIndex: 9999, // Highest possible z-index to be above everything
            isolation: 'isolate', // Create completely separate stacking context
            filter: 'none !important', // Prevent any filter inheritance at parent level
            backdropFilter: 'none !important', // No backdrop filter at parent level
            WebkitBackdropFilter: 'none !important', // Webkit support at parent level
            contain: 'layout style paint', // CSS containment to prevent outside interference
          }}
        >
          <motion.div
            key="sleeping-alien-container"
            className="absolute"
            style={{
              isolation: 'isolate', // Additional isolation layer
              filter: 'none !important', // Double protection against filters
              backdropFilter: 'none !important',
              WebkitBackdropFilter: 'none !important',
              zIndex: 1, // Local z-index within parent
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.img
              src={sleepingAlienImg}
              alt="Sleeping Alien"
              className="absolute"
              style={{
                left: 'calc(50% - 640px)', // Moved 40px to the right (680px - 40px = 640px total)
                top: 'calc(50% - 220px)', // Moved 50px higher (170px + 50px = 220px total)
                transform: 'translateX(-50%) translateY(-50%)',
                width: '80vw', // Increased from 66.67vw to 80vw (bigger)
                height: 'auto', // Maintain aspect ratio
                filter: 'none !important', // Triple protection - force no filters with !important
                backdropFilter: 'none !important', // Ensure no backdrop filters
                WebkitBackdropFilter: 'none !important', // Webkit support
                willChange: 'transform', // Optimize for animations
                isolation: 'isolate', // Additional isolation at image level
                imageRendering: 'auto', // Use default rendering for crisp, unblurred image
                WebkitImageRendering: 'auto', // Webkit support
                MozImageRendering: 'auto', // Firefox support
                msInterpolationMode: 'bicubic', // IE support for smooth rendering
                position: 'relative', // Ensure it's not affected by parent filters
                transformOrigin: 'center center', // Ensure proper scaling origin
                mixBlendMode: 'normal', // Prevent blend mode issues
                opacity: 1, // Explicit opacity to prevent transparency issues
              }}
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default AnimatedBackground;