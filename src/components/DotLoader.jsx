import React from 'react';

const DotLoader = ({ size = 'md', color = 'white' }) => {
  const sizeClasses = {
    sm: { width: '8px', height: '8px' },
    md: { width: '10px', height: '10px' }, 
    lg: { width: '12px', height: '12px' }
  };

  const colorStyles = {
    white: 'white',
    blue: 'rgba(59, 130, 246, 0.8)',
    cyan: 'rgba(34, 211, 238, 0.8)'
  };

  const dotSize = sizeClasses[size] || sizeClasses.md;
  const dotColor = colorStyles[color] || colorStyles.white;

  return (
    <div className="flex items-center justify-center">
      <div 
        className="dot-overtaking"
        style={{
          width: dotSize.width,
          height: dotSize.height,
          background: dotColor,
          borderRadius: '50%',
          display: 'inline-block',
          position: 'relative',
          animation: 'overtaking 1s infinite ease-in-out'
        }}
      />
    </div>
  );
};

export default DotLoader;