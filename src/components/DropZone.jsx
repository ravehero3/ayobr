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
    <motion.div
      className={`relative transition-all duration-500 ${
        hasFiles 
          ? 'mb-4 p-4 border border-dashed rounded-xl' 
          : 'mb-8 p-12 border-2 border-dashed rounded-3xl'
      } ${
        isDragOver
          ? 'border-blue-400 bg-blue-400/10 shadow-lg shadow-blue-400/20'
          : 'border-gray-600 hover:border-blue-400/50'
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      whileHover={{ scale: hasFiles ? 1.01 : 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {/* Show centered content only when no files */}
      <motion.div 
        className="text-center flex flex-col items-center justify-center"
        style={{ minHeight: hasFiles ? '60px' : '300px' }}
        initial={{ opacity: hasFiles ? 0 : 1 }}
        animate={{ opacity: hasFiles ? 0 : 1 }}
        transition={{ duration: 0.5 }}
      >
        {!hasFiles && (
          <>
            <div className="mb-4">
              <svg
                className={`mx-auto h-16 w-16 transition-colors duration-300 ${
                  isDragOver ? 'text-blue-400' : 'text-gray-400'
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
              Drop Your Files
            </h3>
            
            <p className="text-gray-400 mb-4">
              Drag and drop your audio files (MP3, WAV) and images (PNG, JPG) anywhere on this page. They will automatically pair together to create your type beat videos.
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
          </>
        )}
        
        {hasFiles && (
          <p className="text-gray-400 text-sm">
            Drop more files here to add them
          </p>
        )}
      </motion.div>

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
