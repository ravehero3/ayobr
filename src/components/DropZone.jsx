import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';

const DropZone = ({ onFileDrop }) => {
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
    <motion.div
      className={`relative mb-8 p-12 border-2 border-dashed rounded-3xl transition-all duration-300 ${
        isDragOver
          ? 'border-neon-cyan bg-neon-cyan/10 shadow-lg shadow-neon-cyan/20'
          : 'border-gray-600 hover:border-neon-blue/50'
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="mb-4">
          <svg
            className={`mx-auto h-16 w-16 transition-colors duration-300 ${
              isDragOver ? 'text-neon-cyan' : 'text-gray-400'
            }`}
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        
        <h3 className="text-xl font-semibold text-white mb-2">
          Drop your files here
        </h3>
        
        <p className="text-gray-400 mb-4">
          Support for MP3, WAV audio files and PNG, JPG, HEIC images
        </p>
        
        <div className="space-y-2">
          <input
            type="file"
            accept=".mp3,.wav,.png,.jpg,.jpeg,.heic,.heif"
            multiple
            onChange={handleFileInput}
            className="hidden"
            id="file-input"
          />
          <label
            htmlFor="file-input"
            className="inline-block px-6 py-3 bg-gradient-to-r from-neon-blue to-neon-cyan rounded-xl text-white font-medium cursor-pointer hover:shadow-lg hover:shadow-neon-blue/30 transition-all duration-300"
          >
            Browse Files
          </label>
        </div>
      </div>

      {/* Animated background glow */}
      {isDragOver && (
        <motion.div
          className="absolute inset-0 rounded-3xl"
          style={{
            background: 'linear-gradient(to right, rgba(30, 144, 255, 0.2), rgba(0, 207, 255, 0.2))'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </motion.div>
  );
};

export default DropZone;
