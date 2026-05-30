import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassmorphismVideoLoader from './GlassmorphismVideoLoader';

const VideoGenerationAnimation = ({
  pair,
  isGenerating,
  progress,
  isComplete,
  onComplete,
  generatedVideo
}) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    if (isComplete && generatedVideo && !showSuccess && !animationComplete) {
      // Show success animation after a brief delay
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
      setShowSuccess(false);
      setAnimationComplete(false);
    }
  }, [isGenerating, isComplete]);

  // Show glassmorphism loader during generation
  if (isGenerating && !isComplete) {
    return (
      <GlassmorphismVideoLoader
        isVisible={true}
        progress={progress}
        filename={generatedVideo?.filename}
        onClose={() => {
          // Handle close if needed
        }}
      />
    );
  }

  // Don't show overlay if generation is complete and animation is done, or if generation is cancelled
  if ((!isGenerating && !showSuccess) || (!isGenerating && !isComplete && !generatedVideo)) {
    return null;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center glass-container rounded-2xl z-20">
      <AnimatePresence>
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