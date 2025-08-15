import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AppInfoWindow = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          display: 'flex'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        
        {/* App Info Window */}
        <motion.div
          className="relative w-96 h-72 p-8 flex flex-col items-center justify-center text-center"
          style={{
            background: 'rgba(0, 0, 0, 0.47)',
            borderRadius: '16px',
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(9.7px)',
            WebkitBackdropFilter: 'blur(9.7px)',
            border: '1px solid rgba(0, 0, 0, 0.44)',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center text-white hover:text-gray-300 transition-colors"
            onClick={onClose}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.854 4.854a.5.5 0 0 0-.708-.708L8 8.293 3.854 4.146a.5.5 0 1 0-.708.708L7.293 9l-4.147 4.146a.5.5 0 0 0 .708.708L8 9.707l4.146 4.147a.5.5 0 0 0 .708-.708L8.707 9l4.147-4.146z"/>
            </svg>
          </button>

          {/* TypeBeatz Logo */}
          <img 
            src="/src/assets/typebeatz logo 2 white version_1754509091303.png" 
            alt="TypeBeatz Logo" 
            className="w-24 h-auto mb-6"
          />

          {/* App Info */}
          <div className="text-white space-y-3">
            <h2 className="text-xl font-semibold">TypeBeatz Video Generator</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              Create stunning type beat videos by combining your audio tracks with images. 
              Perfect for music producers and content creators.
            </p>
            <div className="text-xs text-gray-400 pt-2">
              Version 1.0
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AppInfoWindow;