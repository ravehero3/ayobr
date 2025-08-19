
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import typebeatzLogo from '../assets/typebeatz-alien-logo-updated.png';
import typebeatzTitleLogo from '../assets/typebeatz-title-logo.png';

const AppInfoWindow = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-center justify-center"
        style={{
          zIndex: 999999, // Absolute highest z-index to ensure it appears above everything
          pointerEvents: 'auto',
          paddingTop: '380px', // Move 300px down from original position
          paddingBottom: '96px' // Account for footer (64px) + spacing
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Enhanced Gaussian blur backdrop matching UserProfile */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(20px) saturate(110%) brightness(80%)',
            WebkitBackdropFilter: 'blur(20px) saturate(110%) brightness(80%)',
            minHeight: '100vh',
            minWidth: '100vw',
          }}
        />
        
        {/* App Info Window - Fixed centered position, no dragging */}
        <motion.div
          className="relative p-8 flex flex-col items-center justify-center text-center cursor-default"
          style={{
            width: '460px',
            height: '484px',
            background: 'rgba(5, 5, 5, 0.85)',
            borderRadius: '20px',
            boxShadow: `
              0 8px 40px rgba(0, 0, 0, 0.8),
              0 0 0 1px rgba(255, 255, 255, 0.12),
              inset 0 1px 0 rgba(255, 255, 255, 0.08),
              inset 0 -1px 0 rgba(0, 0, 0, 0.4)
            `,
            backdropFilter: 'blur(25px) saturate(120%) brightness(70%) contrast(125%)',
            WebkitBackdropFilter: 'blur(25px) saturate(120%) brightness(70%) contrast(125%)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            zIndex: 999999
          }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button - Always visible */}
          <button
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white hover:text-gray-300 transition-colors z-10 rounded-full text-xl"
            onClick={onClose}
          >
            ×
          </button>

          {/* Logo above title */}
          <div className="w-full flex justify-center mb-4">
            <img 
              src={typebeatzLogo} 
              alt="TypeBeatz Logo" 
              className="h-64 object-contain"
              style={{ maxWidth: '280px' }}
            />
          </div>

          {/* App Info */}
          <div className="text-white space-y-3">
            <h1 className="text-2xl font-bold text-white mb-2">
              TypeBeatz Video Generator
            </h1>
            <p className="text-gray-300 text-sm leading-relaxed px-2">
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
