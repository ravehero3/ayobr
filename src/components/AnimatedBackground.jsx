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
      img.src = '/attached_assets/typebeatznew_1754502880376.gif';
    }
  }, [backgroundLoaded]);
  
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden" style={{ zIndex: -10 }}>
      {/* Clean slate - no backgrounds for now */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          background: '#000000',
          zIndex: -10
        }}
      />
    </div>
  );
};

export default AnimatedBackground;