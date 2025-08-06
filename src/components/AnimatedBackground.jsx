import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';

const AnimatedBackground = () => {
  const { pairs, isGenerating } = useAppStore();
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  
  // Check if we're in the empty state (first page) or file management state (second page)
  const isEmptyState = pairs.every(pair => !pair.audio && !pair.image);
  const hasAnyFiles = pairs.some(pair => pair.audio || pair.image);
  
  // Preload the GIF background when transitioning
  useEffect(() => {
    if (hasAnyFiles && !backgroundLoaded) {
      const img = new Image();
      img.onload = () => setBackgroundLoaded(true);
      img.src = '/attached_assets/typebeatznew_1754424064040.gif';
    }
  }, [hasAnyFiles, backgroundLoaded]);
  
  // Page states for different backgrounds
  const getBackgroundConfig = () => {
    if (isEmptyState) {
      return {
        type: 'gradient',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        animated: false,
        opacity: 1
      };
    } else {
      return {
        type: 'gif',
        background: 'url(/attached_assets/typebeatznew_1754424064040.gif)',
        animated: true,
        opacity: backgroundLoaded ? 1 : 0.7
      };
    }
  };
  
  const config = getBackgroundConfig();
  
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden" style={{ zIndex: -10 }}>
      <AnimatePresence mode="wait">
        {/* Page 1: Empty State Background */}
        {isEmptyState && (
          <motion.div
            key="empty-background"
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
        
        {/* Page 2: File Management Background */}
        {hasAnyFiles && (
          <motion.div
            key="animated-background"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ 
              opacity: config.opacity,
              scale: 1,
              filter: isGenerating ? 'blur(8px)' : 'blur(0px)'
            }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ 
              duration: 1.2, 
              ease: "easeInOut",
              filter: { duration: 0.5 }
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
      </AnimatePresence>
      
      {/* Enhanced Noise Overlay with subtle animation */}
      <motion.div 
        className="absolute inset-0 w-full h-full pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ duration: 1 }}
        style={{
          backgroundImage: 'url(/attached_assets/noise_1751735379404.png)',
          backgroundSize: '256px 256px',
          backgroundRepeat: 'repeat',
          zIndex: -9,
          mixBlendMode: 'overlay'
        }}
      />
      
      {/* Subtle gradient overlay for better text readability */}
      {hasAnyFiles && (
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