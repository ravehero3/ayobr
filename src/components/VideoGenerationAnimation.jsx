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

  // Don't show overlay if generation is complete and animation is done
  if (!isGenerating && !showMerging && !showSuccess) {
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
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <h3 className="text-white text-xl font-bold mb-2">Generating Video...</h3>
              <p className="text-gray-300 text-sm mb-4">
                Merging {pair.audio?.name} with {pair.image?.name}
              </p>
            </div>

            <div className="w-64 bg-gray-700 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-white text-sm mt-2">{Math.round(progress)}%</p>
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