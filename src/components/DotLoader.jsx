
import React from 'react';

const DotLoader = ({ size = 'md', color = 'white' }) => {
  const sizeClasses = {
    sm: { containerSize: '60px', circleSize: '25px' },
    md: { containerSize: '80px', circleSize: '30px' }, 
    lg: { containerSize: '100px', circleSize: '40px' }
  };

  const colorStyles = {
    white: { dark: '#222', light: '#fff' },
    blue: { dark: '#374151', light: '#9CA3AF' },
    cyan: { dark: '#374151', light: '#9CA3AF' }
  };

  const { containerSize, circleSize } = sizeClasses[size] || sizeClasses.md;
  const colors = colorStyles[color] || colorStyles.white;

  return (
    <div className="flex items-center justify-center">
      <div 
        className="box-container"
        style={{
          width: containerSize,
          height: containerSize,
          display: 'grid',
          gridTemplateRows: '1fr 1fr',
          animation: 'spinLoader 1s ease infinite'
        }}
      >
        <div className="relative">
          <div 
            className="circle circle-1"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              height: circleSize,
              width: circleSize,
              background: colors.dark,
              borderRadius: '50%',
              animation: 'circle1 ease 1200ms infinite'
            }}
          />
        </div>
        <div className="relative">
          <div 
            className="circle circle-2"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              height: circleSize,
              width: circleSize,
              background: colors.light,
              borderRadius: '50%',
              animation: 'circle2 ease 1200ms infinite'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default DotLoader;
