import React from 'react';
import { useAppStore } from '../store/appStore';

const AnimatedBackground = () => {
  const { pairs, isGenerating } = useAppStore();
  
  // Check if any files have been dropped
  const hasFiles = pairs.some(pair => pair.audio || pair.image);
  
  // Determine which background to show
  const backgroundImage = hasFiles 
    ? 'url(/attached_assets/type beatz_1754412396458.gif)'
    : 'url(/attached_assets/DRAG AND DROP__1754389613176.png)';
    
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