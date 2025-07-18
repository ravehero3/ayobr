import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';

const PairMergeAnimation = ({ pair, isGenerating, progress, onAnimationComplete }) => {
  const [animationStage, setAnimationStage] = useState('idle'); // idle, merging, merged, completed
  const [showProgress, setShowProgress] = useState(false);
  const { generatedVideos } = useAppStore();
  
  // Find the generated video for this pair
  const generatedVideo = generatedVideos.find(v => v.pairId === pair.id);
  
  console.log(`PairMergeAnimation for pair ${pair.id}:`, {
    isGenerating,
    progress,
    animationStage,
    hasGeneratedVideo: !!generatedVideo,
    generatedVideo: generatedVideo ? { id: generatedVideo.id, filename: generatedVideo.filename } : null
  });

  useEffect(() => {
    // Only start animation if we don't already have a generated video
    if (isGenerating && animationStage === 'idle' && !generatedVideo) {
      // Start the merge animation
      setAnimationStage('merging');
      
      // Show merged container after animation
      setTimeout(() => {
        setAnimationStage('merged');
        setShowProgress(true);
      }, 800);
    }
  }, [isGenerating, animationStage, generatedVideo]);

  useEffect(() => {
    // When video is generated and we're in merged state, show video preview
    if (generatedVideo && animationStage === 'merged') {
      // Short delay to show completion, then transition to video preview
      setTimeout(() => {
        setAnimationStage('completed');
        setShowProgress(false);
        if (onAnimationComplete) onAnimationComplete();
      }, 1000);
    }
  }, [generatedVideo, animationStage, onAnimationComplete]);

  useEffect(() => {
    // Only reset if generation stops without completion AND we don't have a video
    if (!isGenerating && !generatedVideo && animationStage !== 'idle') {
      // Reset animation when generation stops without completion
      setAnimationStage('idle');
      setShowProgress(false);
    }
  }, [isGenerating, generatedVideo, animationStage]);

  if (animationStage === 'idle') {
    return null;
  }

  return (
    <div className="absolute inset-0 z-30">
      <AnimatePresence>
        {animationStage === 'merging' && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Audio container moving towards center */}
            <motion.div
              className="absolute left-0 top-0 w-1/2 h-full glass-container rounded-2xl flex items-center justify-center"
              initial={{ x: 0, scale: 1 }}
              animate={{ x: '50%', scale: 0.8 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              <div className="text-white text-sm font-medium">Audio</div>
            </motion.div>

            {/* Image container moving towards center */}
            <motion.div
              className="absolute right-0 top-0 w-1/2 h-full glass-container rounded-2xl flex items-center justify-center"
              initial={{ x: 0, scale: 1 }}
              animate={{ x: '-50%', scale: 0.8 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              <div className="text-white text-sm font-medium">Image</div>
            </motion.div>
          </motion.div>
        )}

        {animationStage === 'merged' && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
          >
            {/* Merged container with progress */}
            <div className="w-full h-full glass-container rounded-2xl flex flex-col items-center justify-center">
              <motion.h3 
                className="text-white text-sm font-medium mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Merging Audio & Image
              </motion.h3>

              {/* Progress Bar */}
              <div className="w-80 bg-gray-700 rounded-full h-4 mx-auto overflow-hidden shadow-lg mb-3">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-inner"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>

              <motion.p 
                className="text-gray-300 text-lg font-medium"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {progress}% Complete
              </motion.p>
            </div>
          </motion.div>
        )}

        {animationStage === 'completed' && generatedVideo && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.6 }}
          >
            {/* Video Preview with glassmorphism background */}
            <div className="w-full h-full glass-container rounded-2xl flex items-center justify-center p-6">
              <motion.div
                className="w-full max-w-[600px] aspect-video"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <video
                  src={generatedVideo.url}
                  controls
                  className="w-full h-full rounded-lg shadow-2xl object-contain"
                  style={{
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 255, 255, 0.1)'
                  }}
                  preload="metadata"
                  autoPlay={false}
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PairMergeAnimation;