import React from 'react';

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden">
      {/* Moving background image */}
      <div 
        className="absolute -inset-10 w-[140%] h-[140%] bg-cover bg-center animate-diagonal-move"
        style={{
          backgroundImage: 'url(/attached_assets/DRAG AND DROP__1754389613176.png)',
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