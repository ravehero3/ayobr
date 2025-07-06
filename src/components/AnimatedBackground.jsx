import React from 'react';

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden">
      {/* Moving background image */}
      <div 
        className="absolute inset-0 w-[120%] h-[120%] bg-cover bg-center animate-diagonal-move"
        style={{
          backgroundImage: 'url(/attached_assets/background_1751734336497.jpg)',
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