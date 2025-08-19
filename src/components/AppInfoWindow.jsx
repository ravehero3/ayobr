
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import typebeatzAlienLogo from '../assets/typebeatz-alien-logo.png';

const AppInfoWindow = ({ isOpen, onClose }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  if (!isOpen) return null;

  const handleDragStart = (event, info) => {
    setIsDragging(true);
  };

  const handleDrag = (event, info) => {
    setPosition({
      x: position.x + info.delta.x,
      y: position.y + info.delta.y
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-center justify-center"
        style={{
          zIndex: 99999, // Ensure it appears above everything
          pointerEvents: 'auto'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Enhanced Backdrop with stronger blur */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(25px) saturate(150%)',
            WebkitBackdropFilter: 'blur(25px) saturate(150%)'
          }}
        />
        
        {/* App Info Window - Positioned at exact center */}
        <motion.div
          className="relative w-96 h-80 p-8 flex flex-col items-center justify-center text-center cursor-default"
          style={{
            background: 'rgba(10, 15, 28, 0.85)',
            borderRadius: '20px',
            boxShadow: '0 16px 60px rgba(0, 0, 0, 0.5), 0 8px 32px rgba(96, 165, 250, 0.1)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(96, 165, 250, 0.2)',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`,
            zIndex: 100000
          }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          drag
          dragConstraints={{
            left: -window.innerWidth/2 + 200,
            right: window.innerWidth/2 - 200,
            top: -window.innerHeight/2 + 200,
            bottom: window.innerHeight/2 - 200
          }}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          whileDrag={{ scale: 1.02 }}
        >
          {/* Move Handle - Top Left Corner */}
          <motion.div
            className="absolute top-3 left-3 w-6 h-6 cursor-move flex items-center justify-center"
            style={{
              background: 'rgba(96, 165, 250, 0.15)',
              borderRadius: '6px',
              border: '1px solid rgba(96, 165, 250, 0.3)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="rgba(255, 255, 255, 0.6)">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
            </svg>
          </motion.div>

          {/* Close Button */}
          <button
            className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center text-white hover:text-gray-300 transition-colors z-10"
            onClick={onClose}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.854 4.854a.5.5 0 0 0-.708-.708L8 8.293 3.854 4.146a.5.5 0 1 0-.708.708L7.293 9l-4.147 4.146a.5.5 0 0 0 .708.708L8 9.707l4.146 4.147a.5.5 0 0 0 .708-.708L8.707 9l4.147-4.146z"/>
            </svg>
          </button>

          {/* Sleeping Alien Logo - Full width of window */}
          <div className="w-full flex justify-center mb-6">
            <img 
              src={typebeatzAlienLogo} 
              alt="TypeBeatz Alien Logo" 
              className="max-w-full h-20 object-contain"
              style={{ maxWidth: '280px' }}
            />
          </div>

          {/* App Info */}
          <div className="text-white space-y-3">
            <h2 className="text-xl font-semibold">TypeBeatz Video Generator</h2>
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
