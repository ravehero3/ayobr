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
  console.log('AnimatedBackground: Has complete pairs:', hasCompletePairs);
  console.log('AnimatedBackground: Has videos:', hasVideos);
  console.log('AnimatedBackground: Is generating:', isGenerating);

  // Preload the GIF when needed
  useEffect(() => {
    if (!backgroundLoaded.gif) {
      const img = new Image();
      img.onload = () => {
        console.log('AnimatedBackground: GIF loaded');
        setBackgroundLoaded(prev => ({
          ...prev,
          gif: true
        }));
      };
      img.src = '/attached_assets/typebeatznew_1754459272105.gif';
    }
  }, [backgroundLoaded]);
  
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

      {/* Current Background: Dynamic Flame GIF - This is what's currently shown, fades out when files are added */}
      <motion.div
        className="absolute -inset-10 w-[140%] h-[140%] bg-cover bg-center animate-diagonal-move"
        animate={{ 
          opacity: hasFiles ? 0 : 1, // Simple: fade out when any files are present
          scale: hasFiles ? 0.9 : 1,
          filter: isGenerating ? 'blur(8px)' : 'blur(0px)'
        }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        style={{
          backgroundImage: 'url(/attached_assets/typebeatznew_1754459272105.gif)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: -11
        }}
      />

      {/* Layer 2: Particle System - Shows after current background fades */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        animate={{ 
          opacity: hasFiles && !hasCompletePairs ? 0.3 : 0,
          scale: hasFiles ? 1 : 0.95
        }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
        style={{
          background: `
            radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)
          `,
          zIndex: -12
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