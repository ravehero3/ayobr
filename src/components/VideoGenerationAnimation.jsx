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
  const [showSuccess, setShowSuccess] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    if (isGenerating && progress > 0) {
      setShowMerging(true);
      setShowSuccess(false);
      setAnimationComplete(false);
    }
  }, [isGenerating, progress]);

  useEffect(() => {
    if (isComplete && generatedVideo && !showSuccess && !animationComplete) {
      // First hide the merging animation
      setShowMerging(false);

      // Then show success animation after a brief delay
      setTimeout(() => {
        setShowSuccess(true);
      }, 300);

      // Hide success animation and complete the process
      setTimeout(() => {
        setShowSuccess(false);
        setAnimationComplete(true);
        if (onComplete) onComplete();
      }, 2000); // Show success for 2 seconds
    }
  }, [isComplete, generatedVideo, showSuccess, animationComplete, onComplete]);

  // Reset animation state when video generation starts fresh
  useEffect(() => {
    if (isGenerating && progress === 0) {
      setAnimationComplete(false);
      setShowSuccess(false);
    }
  }, [isGenerating, progress]);

  // Reset animation when generation is cancelled/stopped
  useEffect(() => {
    if (!isGenerating && !isComplete) {
      // Generation was stopped/cancelled
      setShowMerging(false);
      setShowSuccess(false);
      setAnimationComplete(false);
    }
  }, [isGenerating, isComplete]);

  // Don't show overlay if generation is complete and animation is done, or if generation is cancelled
  if ((!isGenerating && !showMerging && !showSuccess) || (!isGenerating && !isComplete && !generatedVideo)) {
    return null;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-2xl z-20">
      <AnimatePresence>
        {showMerging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-center"
          >
            <div className="absolute inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex flex-col items-center justify-center z-10">
            <div className="text-center flex flex-col items-center justify-center h-full">
              <motion.div className="relative w-20 h-20 mx-auto mb-6">
                {/* Outer ring */}
                <motion.div 
                  className="absolute inset-0 border-4 border-gray-600 rounded-full"
                />
                {/* Spinning gradient ring */}
                <motion.div 
                  className="absolute inset-0 border-4 border-transparent rounded-full"
                  style={{
                    borderTopColor: '#3B82F6',
                    borderRightColor: '#8B5CF6',
                    borderBottomColor: 'transparent',
                    borderLeftColor: 'transparent',
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                {/* Inner glow */}
                <motion.div 
                  className="absolute inset-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
              <motion.h3 
                className="text-white text-sm font-medium mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Merging Audio & Image
              </motion.h3>

              {/* Centered Progress Bar */}
              <div className="w-80 bg-gray-700 rounded-full h-4 mx-auto overflow-hidden shadow-lg">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-inner"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
              <motion.p 
                className="text-gray-300 text-lg mt-3 font-medium"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {progress}% Complete
              </motion.p>
            </div>
          </div>
          </motion.div>
        )}

        {showSuccess && generatedVideo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="text-center"
          >
            <div className="mb-4">
              <motion.div 
                className="w-20 h-20 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 200, 
                  damping: 15,
                  duration: 0.6
                }}
                style={{
                  boxShadow: '0 0 30px rgba(34, 197, 94, 0.5), 0 0 60px rgba(34, 197, 94, 0.3)'
                }}
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
              <motion.h3 
                className="text-white text-xl font-bold mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Video Generated Successfully!
              </motion.h3>
              <motion.p 
                className="text-gray-300 text-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                {generatedVideo.filename}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoGenerationAnimation;