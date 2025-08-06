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
  
  // Get the explicit current page from store if available
  const explicitPage = useAppStore(state => state.currentPage);
  
  let currentPage;
  // Priority order: explicit page setting > state-based detection
  if (explicitPage) {
    currentPage = explicitPage;
  } else if (hasVideos && !isGenerating) {
    currentPage = 'download';
  } else if (isGenerating) {
    currentPage = 'generation';
  } else if (hasFiles) {
    currentPage = 'fileManagement';
  } else {
    currentPage = 'upload';
  }

  // Calculate progress level (0-4) based on user actions
  let progressLevel = 0;
  if (hasFiles) progressLevel = 1; // Files added
  if (hasCompletePairs) progressLevel = 2; // Complete pairs created
  if (isGenerating || hasVideos) progressLevel = 3; // Video generation started/completed
  if (hasVideos && !isGenerating) progressLevel = 4; // Videos ready for download
  
  // Debug logging for page detection
  console.log('AnimatedBackground: Current page:', currentPage);
  console.log('AnimatedBackground: Has files:', pairs.some(pair => pair.audio || pair.image));
  console.log('AnimatedBackground: Has videos:', generatedVideos.length > 0);
  console.log('AnimatedBackground: Is generating:', isGenerating);
  
  // Background configurations for each page
  const pageConfigs = {
    upload: {
      type: 'gradient',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      animated: false
    },
    fileManagement: {
      type: 'gif',
      background: 'url(/attached_assets/typebeatznew_1754459272105.gif)',
      animated: true,
      preloadUrl: '/attached_assets/typebeatznew_1754459272105.gif'
    },
    generation: {
      type: 'blurred-gif', 
      background: 'url(/attached_assets/typebeatznew_1754459272105.gif)',
      animated: true,
      blur: true,
      preloadUrl: '/attached_assets/typebeatznew_1754459272105.gif'
    },
    download: {
      type: 'download-gradient',
      background: 'linear-gradient(135deg, #0f1419 0%, #1a2332 50%, #0d1b2a 100%)',
      animated: false
    }
  };

  // Preload backgrounds when needed
  useEffect(() => {
    const config = pageConfigs[currentPage];
    console.log('AnimatedBackground: Loading background for page:', currentPage, config);
    if (config?.preloadUrl && !backgroundLoaded[currentPage]) {
      const img = new Image();
      img.onload = () => {
        console.log('AnimatedBackground: Background loaded for page:', currentPage);
        setBackgroundLoaded(prev => ({
          ...prev,
          [currentPage]: true
        }));
      };
      img.src = config.preloadUrl;
    }
  }, [currentPage, backgroundLoaded]);
  
  const config = pageConfigs[currentPage] || pageConfigs.upload;
  console.log('AnimatedBackground: Using config for page:', currentPage, config);
  
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden" style={{ zIndex: -10 }}>
      {/* Layer 1: Base Dark Texture - Always visible */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0d0d0d 100%)',
          zIndex: -13
        }}
      />

      {/* Layer 2: Animated Particle System - Fades out when files added (progress >= 1) */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        animate={{ 
          opacity: progressLevel >= 1 ? 0 : 1,
          scale: progressLevel >= 1 ? 1.1 : 1
        }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        style={{
          background: `
            radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)
          `,
          zIndex: -12
        }}
      />

      {/* Layer 3: Dynamic Flame GIF - Fades out when complete pairs created (progress >= 2) */}
      <motion.div
        className="absolute -inset-10 w-[140%] h-[140%] bg-cover bg-center animate-diagonal-move"
        animate={{ 
          opacity: progressLevel >= 2 ? 0 : (hasFiles ? 1 : 0),
          scale: progressLevel >= 2 ? 0.9 : 1,
          filter: isGenerating ? 'blur(8px)' : 'blur(0px)'
        }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
        style={{
          backgroundImage: 'url(/attached_assets/typebeatznew_1754459272105.gif)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: -11
        }}
      />

      {/* Layer 4: Energetic Overlay Pattern - Fades out during generation (progress >= 3) */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        animate={{ 
          opacity: progressLevel >= 3 ? 0 : (hasCompletePairs ? 0.3 : 0),
          scale: progressLevel >= 3 ? 1.1 : 1
        }}
        transition={{ duration: 1.0, ease: "easeInOut" }}
        style={{
          background: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 2px,
              rgba(59, 130, 246, 0.02) 2px,
              rgba(59, 130, 246, 0.02) 4px
            ),
            repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 2px,
              rgba(147, 51, 234, 0.02) 2px,
              rgba(147, 51, 234, 0.02) 4px
            )
          `,
          zIndex: -10
        }}
      />

      {/* Final Layer: Success Gradient - Appears when videos are ready (progress >= 4) */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        animate={{ 
          opacity: progressLevel >= 4 ? 0.7 : 0,
          scale: progressLevel >= 4 ? 1 : 0.95
        }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        style={{
          background: 'linear-gradient(135deg, #0f1419 0%, #1a2332 50%, #0d1b2a 100%)',
          zIndex: -9
        }}
      />
      
      {/* Enhanced Noise Overlay - Opacity varies with progress */}
      <motion.div 
        className="absolute inset-0 w-full h-full pointer-events-none"
        animate={{ 
          opacity: Math.max(0.05, 0.15 - (progressLevel * 0.025))
        }}
        transition={{ duration: 1 }}
        style={{
          backgroundImage: 'url(/noise.png)',
          backgroundSize: '256px 256px',
          backgroundRepeat: 'repeat',
          zIndex: -8,
          mixBlendMode: 'overlay'
        }}
      />
      
      {/* Dynamic readability overlay */}
      <motion.div 
        className="absolute inset-0 w-full h-full pointer-events-none"
        animate={{ 
          opacity: hasFiles ? 0.15 : 0
        }}
        transition={{ duration: 1.5 }}
        style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(5,10,19,0.25) 100%)',
          zIndex: -7
        }}
      />
    </div>
  );
};

export default AnimatedBackground;