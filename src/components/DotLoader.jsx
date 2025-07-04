
import React from 'react';

const DotLoader = ({ size = 'md', color = 'white' }) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3', 
    lg: 'w-4 h-4'
  };

  const colorStyles = {
    white: 'rgba(255, 255, 255, 0.8)',
    blue: 'rgba(59, 130, 246, 0.8)',
    cyan: 'rgba(34, 211, 238, 0.8)'
  };

  const dotSize = sizeClasses[size] || sizeClasses.md;
  const dotColor = colorStyles[color] || colorStyles.white;

  return (
    <div className="flex items-center justify-center space-x-1">
      <div 
        className={`${dotSize} rounded-full`}
        style={{
          backgroundColor: dotColor,
          animation: 'dotElastic 0.6s infinite linear',
          animationDelay: '0s'
        }}
      />
      <div 
        className={`${dotSize} rounded-full`}
        style={{
          backgroundColor: dotColor,
          animation: 'dotElastic 0.6s infinite linear',
          animationDelay: '0.1s'
        }}
      />
      <div 
        className={`${dotSize} rounded-full`}
        style={{
          backgroundColor: dotColor,
          animation: 'dotElastic 0.6s infinite linear',
          animationDelay: '0.2s'
        }}
      />
    </div>
  );
};

export default DotLoader;
