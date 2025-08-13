import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';

const DropZone = ({ onFileDrop, hasFiles = false }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    onFileDrop(files);
  }, [onFileDrop]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e) => {
    const files = Array.from(e.target.files);
    onFileDrop(files);
    e.target.value = '';
  }, [onFileDrop]);

  return (
    <>
      {/* Hidden file input */}
      <input
        id="file-input"
        type="file"
        multiple
        accept="audio/*,image/*,.mp3,.wav,.png,.jpg,.jpeg,.heic"
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`
          relative w-full max-w-4xl mx-auto p-12 rounded-3xl
          bg-gradient-to-br from-space-dark/80 to-space-gray/60
          backdrop-blur-sm
          hover:bg-gradient-to-br hover:from-space-dark/90 hover:to-space-gray/70
          transition-all duration-300 ease-out
          cursor-pointer group
          min-h-[400px] flex items-center justify-center
          ${isDragOver ? 'bg-gradient-to-br from-neon-green/10 to-neon-blue/10 scale-[1.02]' : ''}
        `}
        style={{ zIndex: 50 }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input').click()}
      >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/5 to-neon-purple/5 rounded-3xl group-hover:from-neon-blue/10 group-hover:to-neon-purple/10 transition-all duration-300" />

      {/* Content - Centered */}
      <div className="relative text-center space-y-6 w-full flex flex-col items-center justify-center" style={{ zIndex: 60 }}>
        {/* Upload Icon with Circle */}
        <motion.div
          className="inline-flex items-center justify-center w-20 h-20 mx-auto mb-4 rounded-full border-2 border-white/20 group-hover:border-white/40 transition-all duration-300"
          whileHover={{ scale: 1.1, rotate: 5, borderColor: 'rgba(255, 255, 255, 0.6)' }}
          whileTap={{ scale: 0.95 }}
        >
          <svg className="w-8 h-8 text-white group-hover:text-white/80 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </motion.div>

        {/* Title */}
        <motion.h2
          className="text-3xl font-semibold text-white mb-2 group-hover:text-neon-blue/90 transition-colors duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Drop Your Files
        </motion.h2>

        {/* Description */}
        <motion.p
          className="text-lg text-gray-300 mb-8 max-w-md mx-auto leading-relaxed group-hover:text-gray-200 transition-colors duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Drag and drop your audio and image files here, or click to browse
        </motion.p>

        {/* Supported Formats */}
        <motion.div
          className="flex flex-wrap justify-center gap-4 max-w-lg mx-auto mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {/* Audio formats */}
          <div className="flex items-center gap-2 px-3 py-2 bg-space-gray/30 rounded-full border border-white/20 group-hover:border-white/30 transition-all duration-300">
            <svg className="w-4 h-4 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <span className="text-xs font-medium text-white whitespace-nowrap">MP3, WAV</span>
          </div>

          {/* Image formats */}
          <div className="flex items-center gap-2 px-3 py-2 bg-space-gray/30 rounded-full border border-white/20 group-hover:border-white/30 transition-all duration-300">
            <svg className="w-4 h-4 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-medium text-white whitespace-nowrap">PNG, JPG</span>
          </div>
        </motion.div>

        {/* Browse Button */}
        <motion.button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const fileInput = document.getElementById('file-input');
            if (fileInput) {
              fileInput.click();
            }
          }}
          type="button"
          className="px-7 py-2 bg-gradient-to-r from-neon-blue/80 to-neon-purple/80 hover:from-neon-blue hover:to-neon-purple text-white rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-neon-blue/25 hover:scale-105 active:scale-95 text-button-secondary font-semibold focus:outline-none"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          Browse Files
        </motion.button>
      </div>
    </motion.div>
    </>
  );
};

export default DropZone;