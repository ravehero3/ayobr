import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VideoGenerationAnimation = ({ 
  pair, 
  isGenerating, 
  progress, 
  isComplete, 
  onComplete,
  generatedVideo 
}) => {
  const [showCheckmark, setShowCheckmark] = useState(false);
  const [showVideoPreview, setShowVideoPreview] = useState(false);

  useEffect(() => {
    if (isComplete && !showCheckmark) {
      setShowCheckmark(true);
      // Hide checkmark after 2 seconds and show video preview
      setTimeout(() => {
        setShowCheckmark(false);
        setShowVideoPreview(true);
        if (onComplete) onComplete();
      }, 2000);
    }
  }, [isComplete, showCheckmark, onComplete]);

  if (!isGenerating && !isComplete && !showVideoPreview) {
    return null;
  }

  return (
    <motion.div
      className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-3xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <AnimatePresence mode="wait">
        {isGenerating && (
          <motion.div
            key="generating"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="text-center"
          >
            {/* Combining Animation */}
            <div className="flex items-center justify-center mb-6">
              <motion.div
                className="w-16 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg mr-4"
                animate={{
                  x: [0, 20, 0],
                  rotateY: [0, 180, 360]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div
                className="text-neon-blue text-2xl font-bold"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                +
              </motion.div>
              <motion.div
                className="w-16 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg ml-4"
                animate={{
                  x: [0, -20, 0],
                  rotateY: [0, -180, -360]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>

            {/* Progress Bar */}
            <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
              <motion.div
                className="h-full bg-gradient-to-r from-neon-blue to-cyan-400"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <p className="text-white text-sm">
              Generating Video... {Math.round(progress)}%
            </p>
          </motion.div>
        )}

        {showCheckmark && (
          <motion.div
            key="checkmark"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            className="text-center"
          >
            <motion.div
              className="w-20 h-20 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center"
              animate={{
                scale: [1, 1.1, 1],
                boxShadow: [
                  "0 0 0 0 rgba(34, 197, 94, 0.7)",
                  "0 0 0 20px rgba(34, 197, 94, 0)",
                  "0 0 0 0 rgba(34, 197, 94, 0)"
                ]
              }}
              transition={{ duration: 1 }}
            >
              <motion.svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <motion.path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </motion.svg>
            </motion.div>
            <p className="text-green-400 text-lg font-semibold">
              Video Generated!
            </p>
          </motion.div>
        )}

        {showVideoPreview && generatedVideo && (
          <motion.div
            key="preview"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <button
              onClick={() => {
                const video = document.createElement('video');
                video.src = generatedVideo.url;
                video.controls = true;
                video.style.maxWidth = '400px';
                video.style.maxHeight = '300px';
                video.style.borderRadius = '12px';
                
                const overlay = document.createElement('div');
                overlay.style.position = 'fixed';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                overlay.style.display = 'flex';
                overlay.style.alignItems = 'center';
                overlay.style.justifyContent = 'center';
                overlay.style.zIndex = '1000';
                overlay.style.backdropFilter = 'blur(10px)';
                
                overlay.appendChild(video);
                overlay.onclick = (e) => {
                  if (e.target === overlay) {
                    document.body.removeChild(overlay);
                  }
                };
                
                document.body.appendChild(overlay);
              }}
              className="bg-gradient-to-r from-neon-blue to-cyan-400 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
            >
              <svg className="w-5 h-5 inline-block mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Preview Video
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default VideoGenerationAnimation;