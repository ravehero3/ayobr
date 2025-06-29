
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
  const [showMerging, setShowMerging] = useState(false);
  const [showVideoPreview, setShowVideoPreview] = useState(false);

  useEffect(() => {
    if (isGenerating && progress > 0) {
      setShowMerging(true);
    }
  }, [isGenerating, progress]);

  useEffect(() => {
    if (isComplete && !showVideoPreview) {
      setTimeout(() => {
        setShowVideoPreview(true);
        setShowMerging(false);
        if (onComplete) onComplete();
      }, 1000);
    }
  }, [isComplete, showVideoPreview, onComplete]);

  if (!isGenerating && !isComplete && !showVideoPreview) {
    return null;
  }

  return (
    <motion.div
      className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-3xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <AnimatePresence mode="wait">
        {showMerging && isGenerating && !showVideoPreview && (
          <motion.div
            key="merging"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="text-center relative"
          >
            {/* Container Merging Animation */}
            <div className="flex items-center justify-center mb-8 relative">
              {/* Audio Container */}
              <motion.div
                className="w-24 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center"
                animate={{
                  x: progress > 50 ? [0, 60, 80] : [0, 20, 0],
                  scale: progress > 80 ? [1, 0.8, 0] : 1,
                  opacity: progress > 80 ? [1, 0.5, 0] : 1
                }}
                transition={{
                  duration: 0.8,
                  ease: "easeInOut"
                }}
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12a7.971 7.971 0 00-1.343-4.243 1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </motion.div>

              {/* Merging Effect */}
              <motion.div
                className="mx-4 text-neon-blue text-3xl font-bold"
                animate={{ 
                  opacity: progress > 30 ? [1, 0.3, 1] : 1,
                  scale: progress > 50 ? [1, 1.5, 1] : 1
                }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                ⟷
              </motion.div>

              {/* Image Container */}
              <motion.div
                className="w-24 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center"
                animate={{
                  x: progress > 50 ? [0, -60, -80] : [0, -20, 0],
                  scale: progress > 80 ? [1, 0.8, 0] : 1,
                  opacity: progress > 80 ? [1, 0.5, 0] : 1
                }}
                transition={{
                  duration: 0.8,
                  ease: "easeInOut"
                }}
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </motion.div>

              {/* Merged Container appears at 80% */}
              {progress > 80 && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="w-32 h-20 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-lg flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-80 h-3 bg-gray-700/50 rounded-full overflow-hidden mb-6 backdrop-blur-sm">
              <motion.div
                className="h-full bg-gradient-to-r from-neon-blue via-purple-500 to-pink-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(progress, 0)}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>

            <motion.p 
              className="text-white text-lg font-semibold"
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {progress < 30 ? "Preparing files..." : 
               progress < 60 ? "Merging audio and image..." :
               progress < 90 ? "Generating video..." : "Finalizing..."}
            </motion.p>
            <p className="text-gray-300 text-sm mt-2">
              {Math.round(Math.max(progress, 0))}%
            </p>
          </motion.div>
        )}

        {showVideoPreview && generatedVideo && !showMerging && (
          <motion.div
            key="video-preview"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center max-w-md w-full"
          >
            {/* Video Container */}
            <motion.div
              className="relative bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border-2"
              style={{
                borderColor: 'rgba(59, 130, 246, 0.6)',
                boxShadow: `
                  0 0 0 1px rgba(59, 130, 246, 0.3),
                  0 0 20px rgba(59, 130, 246, 0.4),
                  0 0 40px rgba(59, 130, 246, 0.2)
                `
              }}
              animate={{
                boxShadow: [
                  "0 0 0 1px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.4)",
                  "0 0 0 1px rgba(59, 130, 246, 0.5), 0 0 30px rgba(59, 130, 246, 0.6)",
                  "0 0 0 1px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.4)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {/* Success Icon */}
              <motion.div
                className="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>

              <h3 className="text-white text-xl font-bold mb-2">Video Generated!</h3>
              <p className="text-gray-300 text-sm mb-4">{generatedVideo.filename}</p>

              {/* Preview Button */}
              <button
                onClick={() => {
                  const video = document.createElement('video');
                  video.src = generatedVideo.url;
                  video.controls = true;
                  video.autoplay = true;
                  video.style.maxWidth = '90vw';
                  video.style.maxHeight = '80vh';
                  video.style.borderRadius = '12px';
                  
                  const overlay = document.createElement('div');
                  overlay.style.position = 'fixed';
                  overlay.style.top = '0';
                  overlay.style.left = '0';
                  overlay.style.width = '100%';
                  overlay.style.height = '100%';
                  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
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
                className="bg-gradient-to-r from-neon-blue to-cyan-400 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
              >
                <svg className="w-5 h-5 inline-block mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Preview Video
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default VideoGenerationAnimation;
