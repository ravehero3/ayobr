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

        {showVideoPreview && generatedVideo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-center"
          >
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-white text-xl font-bold mb-2">Video Generated!</h3>
              <p className="text-gray-300 text-sm mb-4">{generatedVideo.filename}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoGenerationAnimation;