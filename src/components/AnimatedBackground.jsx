import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';

const AnimatedBackground = () => {
  // Get reactive state from Zustand store - these will trigger re-renders
  const pairs = useAppStore(state => state.pairs);
  const generatedVideos = useAppStore(state => state.generatedVideos);
  const isGenerating = useAppStore(state => state.isGenerating);

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

  // Determine which background should be shown
  const currentBackgroundKey = hasFiles ? 'page2' : 'page1';

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden" style={{ zIndex: -10 }}>


      {/* Layer 1: Base Dark Texture - Always visible */}
      <AnimatePresence mode="wait">
        {currentBackgroundKey === 'page1' && (
          <motion.div
            key="page1"
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            style={{
              backgroundImage: backgroundLoaded.page1
                ? 'url(/attached_assets/page%201_1754508034866.png)'
                : 'none',
              backgroundColor: '#000000',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              zIndex: -12
            }}
          />
        )}

        {currentBackgroundKey === 'page2' && (
          <motion.div
            key="page2"
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
              filter: 'blur(3px)', // Apply gaussian blur to page 2 background
              zIndex: -12
            }}
          />
        )}
      </AnimatePresence>


    </div>
  );
};

export default AnimatedBackground;