import React from 'react';
import { useAppStore } from '../store/appStore';

const AnimatedBackground = () => {
  const { pairs, isGenerating } = useAppStore();
  
  // Check if we're in the empty state (first page) or file management state (second page)
  const isEmptyState = pairs.every(pair => !pair.audio && !pair.image);
  const hasAnyFiles = pairs.some(pair => pair.audio || pair.image);
  
  // Determine which background to show:
  // - First page (empty state): drag and drop background  
  // - Second page (has files): animated type beatz GIF background
  const backgroundImage = isEmptyState 
    ? 'url(/attached_assets/DRAG AND DROP__1754389613176.png)'
    : 'url(/attached_assets/typebeatznew_1754424064040.gif)';
    
  // Apply blur when generating videos
  const blurClass = isGenerating ? 'blur-md' : '';
  
  return (
    <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden">
      {/* Dynamic background image */}
      <div 
        className={`absolute -inset-10 w-[140%] h-[140%] bg-cover bg-center animate-diagonal-move transition-all duration-1000 ${blurClass}`}
        style={{
          backgroundImage,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Noise overlay */}
      <div 
        className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'url(/attached_assets/noise_1751735379404.png)',
          backgroundSize: '256px 256px',
          backgroundRepeat: 'repeat',
        }}
      />
    </div>
  );
};

export default AnimatedBackground;