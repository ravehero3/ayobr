
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

  if (!showWarning || localStorage.getItem('hide-size-warning') === 'true') return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[9999] px-6">
      <div className="bg-[#0a0f1e] border border-white/10 rounded-2xl p-8 max-w-md text-center shadow-2xl">
        <div className="text-yellow-500 mb-6">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-3">Best on Desktop</h2>
        <p className="text-gray-400 mb-6 text-sm leading-relaxed">
          TypeBeatz is a powerful batch video generator best experienced on a larger screen. You can continue on mobile, but some features like drag-and-drop may be limited.
        </p>
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => {
              localStorage.setItem('hide-size-warning', 'true');
              setShowWarning(false);
            }}
            className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all text-sm font-medium border border-white/10"
          >
            Continue anyway
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScreenSizeWarning;
