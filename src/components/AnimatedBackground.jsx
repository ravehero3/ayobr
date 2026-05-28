import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import page1Background from '../assets/page-1-background.png';
import starsBg from '../assets/stars_background_voodoo808_1778087733997.jpg';

const AnimatedBackground = () => {
  const pairs = useAppStore(state => state.pairs);
  const generatedVideos = useAppStore(state => state.generatedVideos);
  const storeIsGenerating = useAppStore(state => state.isGenerating);
  const videoGenerationStates = useAppStore(state => state.videoGenerationStates);

  const isGenerating = storeIsGenerating || Object.values(videoGenerationStates).some(s => s?.isGenerating);

  const [backgroundLoaded, setBackgroundLoaded] = useState({});
  const [lowMotionMode, setLowMotionMode] = useState(false);

  const hasFiles    = pairs.some(pair => pair.audio || pair.image);
  const hasVideos   = generatedVideos.length > 0;
  const hasCompletePairs = pairs.some(pair => pair.audio && pair.image);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const isIntelMac = /Macintosh/.test(navigator.userAgent) && /Intel/.test(navigator.userAgent);
    const isLowCoreCpu = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;
    const isLowMemoryDevice = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 8;
    setLowMotionMode(mediaQuery.matches || isIntelMac || isLowCoreCpu || isLowMemoryDevice);

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
          filter: showBlur ? (lowMotionMode ? 'blur(8px)' : 'blur(24px)') : 'none',
          transition: lowMotionMode ? 'none' : 'filter 0.55s ease-out',
        }}
        initial={{ opacity: lowMotionMode ? 1 : 0 }}
        animate={{ opacity: backgroundLoaded.page1 ? 1 : 0 }}
        transition={{ duration: lowMotionMode ? 0 : 0.8, ease: 'easeOut', delay: lowMotionMode ? 0 : 0.08 }}
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
            transition={{ duration: lowMotionMode ? 0.22 : 0.85, ease: 'easeInOut' }}
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
