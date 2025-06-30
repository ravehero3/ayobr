
import React, { useState, useEffect } from 'react';

const ScreenSizeWarning = () => {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      
      if (screenWidth < 1280 || screenHeight < 800) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-red-900 border border-red-500 rounded-lg p-8 max-w-md text-center">
        <div className="text-red-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-4">Screen Too Small</h2>
        <p className="text-gray-300 mb-4">
          This application requires a minimum screen resolution of 1280x800 pixels to function properly.
        </p>
        <p className="text-sm text-gray-400">
          Current screen: {window.screen.width}x{window.screen.height}
        </p>
      </div>
    </div>
  );
};

export default ScreenSizeWarning;
