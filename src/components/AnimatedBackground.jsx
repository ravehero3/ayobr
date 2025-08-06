import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';

const AnimatedBackground = () => {
  // Get reactive state from Zustand store - these will trigger re-renders
  const pairs = useAppStore(state => state.pairs);
  const generatedVideos = useAppStore(state => state.generatedVideos);
  const isGenerating = useAppStore(state => state.isGenerating);
  
  const [backgroundLoaded, setBackgroundLoaded] = useState({});
  
  // Calculate current page directly based on reactive state
  const hasFiles = pairs.some(pair => pair.audio || pair.image);
  const hasVideos = generatedVideos.length > 0;
  
  let currentPage;
  if (hasVideos) {
    currentPage = 'download';
  } else if (isGenerating) {
    currentPage = 'generation';
  } else if (hasFiles) {
    currentPage = 'fileManagement';
  } else {
    currentPage = 'upload';
  }
  
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
      <AnimatePresence mode="wait">
        {/* Page 1: Upload Page - Dark Gradient */}
        {currentPage === 'upload' && (
          <motion.div
            key="upload-background"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full"
            style={{
              background: config.background,
              zIndex: -10
            }}
          />
        )}
        
        {/* Page 2: File Management - Blue Flame GIF */}
        {currentPage === 'fileManagement' && (
          <motion.div
            key="fileManagement-background"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ 
              opacity: backgroundLoaded[currentPage] ? 1 : 0.7,
              scale: 1
            }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ 
              duration: 1.2, 
              ease: "easeInOut"
            }}
            className="absolute -inset-10 w-[140%] h-[140%] bg-cover bg-center animate-diagonal-move"
            style={{
              backgroundImage: config.background,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              zIndex: -10
            }}
          />
        )}

        {/* Page 3: Generation - Blurred Blue Flame GIF */}
        {currentPage === 'generation' && (
          <motion.div
            key="generation-background"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ 
              opacity: backgroundLoaded[currentPage] ? 1 : 0.7,
              scale: 1,
              filter: 'blur(8px)'
            }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ 
              duration: 1.2, 
              ease: "easeInOut"
            }}
            className="absolute -inset-10 w-[140%] h-[140%] bg-cover bg-center animate-diagonal-move"
            style={{
              backgroundImage: config.background,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              zIndex: -10
            }}
          />
        )}

        {/* Page 4: Download - Special Dark Blue Gradient */}
        {currentPage === 'download' && (
          <motion.div
            key="download-background"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.0, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full"
            style={{
              background: config.background,
              zIndex: -10
            }}
          />
        )}
      </AnimatePresence>
      
      {/* Enhanced Noise Overlay with subtle animation */}
      <motion.div 
        className="absolute inset-0 w-full h-full pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ duration: 1 }}
        style={{
          backgroundImage: 'url(/noise.png)',
          backgroundSize: '256px 256px',
          backgroundRepeat: 'repeat',
          zIndex: -9,
          mixBlendMode: 'overlay'
        }}
      />
      
      {/* Subtle gradient overlay for better text readability */}
      {(currentPage === 'fileManagement' || currentPage === 'generation') && (
        <motion.div 
          className="absolute inset-0 w-full h-full pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ duration: 1.5 }}
          style={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(5,10,19,0.3) 100%)',
            zIndex: -8
          }}
        />
      )}
    </div>
  );
};

export default AnimatedBackground;