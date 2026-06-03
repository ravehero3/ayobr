import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { useAnimation } from '../context/AnimationContext';
import page1Background from '../assets/page-1-background.png';
import starsBg from '../assets/stars_background_voodoo808_1778087733997.jpg';

const AnimatedBackground = () => {
  const { isAnimEnabled } = useAnimation();
  const pairs = useAppStore(state => state.pairs);
  const generatedVideos = useAppStore(state => state.generatedVideos);
  const storeIsGenerating = useAppStore(state => state.isGenerating);
  const videoGenerationStates = useAppStore(state => state.videoGenerationStates);

  const isGenerating = storeIsGenerating || Object.values(videoGenerationStates).some(s => s?.isGenerating);

  const [backgroundLoaded, setBackgroundLoaded] = useState({});

  const hasFiles    = pairs.some(pair => pair.audio || pair.image);
  const hasVideos   = generatedVideos.length > 0;
  const hasCompletePairs = pairs.some(pair => pair.audio && pair.image);

  useEffect(() => {
    const img1 = new Image();
    img1.onload = () => setBackgroundLoaded(prev => ({ ...prev, page1: true }));
    img1.src = page1Background;

    const img2 = new Image();
    img2.onload = () => setBackgroundLoaded(prev => ({ ...prev, stars: true }));
    img2.src = starsBg;
  }, []);

  const showBlur = hasFiles && !hasVideos;

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden" style={{ zIndex: -10 }}>

      {/* Page 1 background — opacity only via Framer Motion, blur via CSS transition */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: backgroundLoaded.page1 ? `url(${page1Background})` : 'none',
          backgroundColor: '#000000',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: -12,
          willChange: 'opacity',
          transform: 'translateZ(0)',
          filter: (showBlur && isAnimEnabled('background_blur')) ? 'blur(40px)' : 'none',
          transition: 'filter 1.0s ease-in-out',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: backgroundLoaded.page1 ? 1 : 0 }}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.1 }}
      />

      {/* Stars background — shown when videos are ready */}
      <AnimatePresence>
        {hasVideos && !isGenerating && (
          <motion.div
            key="stars-complete"
            className="absolute inset-0 w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            style={{
              backgroundImage: backgroundLoaded.stars ? `url(${starsBg})` : 'none',
              backgroundColor: '#000000',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              zIndex: -11,
              willChange: 'opacity',
              transform: 'translateZ(0)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Dark overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        style={{ zIndex: 1, pointerEvents: 'none' }}
      />
    </div>
  );
};

export default AnimatedBackground;
