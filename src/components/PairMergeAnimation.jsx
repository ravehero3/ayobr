import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';

const PairMergeAnimation = ({ pair, isGenerating, progress, onAnimationComplete }) => {
  const [animationStage, setAnimationStage] = useState('idle'); // idle, merging, merged, completed
  const [showProgress, setShowProgress] = useState(false);
  const [audioPosition, setAudioPosition] = useState(null);
  const [imagePosition, setImagePosition] = useState(null);
  const containerRef = useRef(null);
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
      // Capture the positions of the actual audio and image containers
      const captureContainerPositions = () => {
        const pairElement = document.querySelector(`[data-pair-id="${pair.id}"]`);
        if (pairElement) {
          const audioElement = pairElement.querySelector('.audio-container');
          const imageElement = pairElement.querySelector('.image-container');
          
          if (audioElement && imageElement) {
            const containerRect = pairElement.getBoundingClientRect();
            const audioRect = audioElement.getBoundingClientRect();
            const imageRect = imageElement.getBoundingClientRect();
            
            // Calculate relative positions within the pair container
            setAudioPosition({
              x: audioRect.left - containerRect.left,
              y: audioRect.top - containerRect.top,
              width: audioRect.width,
              height: audioRect.height
            });
            
            setImagePosition({
              x: imageRect.left - containerRect.left,
              y: imageRect.top - containerRect.top,
              width: imageRect.width,
              height: imageRect.height
            });
          }
        }
      };
      
      captureContainerPositions();
      
      // Start the merge animation after a brief delay to ensure positions are captured
      setTimeout(() => {
        setAnimationStage('merging');
      }, 100);
      
      // Show merged container after animation
      setTimeout(() => {
        setAnimationStage('merged');
        setShowProgress(true);
      }, 1200);
    }
  }, [isGenerating, animationStage, generatedVideo, pair.id]);

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
    <div ref={containerRef} className="absolute inset-0 z-30">
      <AnimatePresence>
        {animationStage === 'merging' && audioPosition && imagePosition && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Overlay to hide original containers */}
            <div className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm" />
            
            {/* Audio container clone moving towards center */}
            <motion.div
              className="absolute glass-container rounded-2xl flex items-center justify-center overflow-hidden"
              style={{
                left: audioPosition.x,
                top: audioPosition.y,
                width: audioPosition.width,
                height: audioPosition.height,
              }}
              initial={{ 
                x: 0, 
                y: 0, 
                scale: 1,
                opacity: 1
              }}
              animate={{ 
                x: (window.innerWidth / 2) - audioPosition.x - (audioPosition.width / 2),
                y: (window.innerHeight / 2) - audioPosition.y - (audioPosition.height / 2),
                scale: 0.8,
                opacity: 0.9
              }}
              transition={{ duration: 1.0, ease: "easeInOut" }}
            >
              {/* Audio content clone */}
              <motion.div 
                className="text-white text-sm font-medium"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                {pair.audio?.name?.replace(/\.[^/.]+$/, '') || 'Audio'}
              </motion.div>
            </motion.div>

            {/* Image container clone moving towards center */}
            <motion.div
              className="absolute glass-container rounded-2xl flex items-center justify-center overflow-hidden"
              style={{
                left: imagePosition.x,
                top: imagePosition.y,
                width: imagePosition.width,
                height: imagePosition.height,
              }}
              initial={{ 
                x: 0, 
                y: 0, 
                scale: 1,
                opacity: 1
              }}
              animate={{ 
                x: (window.innerWidth / 2) - imagePosition.x - (imagePosition.width / 2),
                y: (window.innerHeight / 2) - imagePosition.y - (imagePosition.height / 2),
                scale: 0.8,
                opacity: 0.9
              }}
              transition={{ duration: 1.0, ease: "easeInOut" }}
            >
              {/* Image content clone */}
              <motion.div 
                className="text-white text-sm font-medium"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                {pair.image?.name?.replace(/\.[^/.]+$/, '') || 'Image'}
              </motion.div>
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
            {/* Video Loading Container */}
            <div className="w-full h-full glass-container rounded-2xl flex flex-col items-center justify-center p-8 relative overflow-hidden">
              {/* Ambient glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl" />
              
              {/* Video Loading Container Title */}
              <motion.h3 
                className="text-white text-lg font-semibold mb-6 tracking-wide"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                  textShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
                  background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Video Loading Container
              </motion.h3>

              {/* Merging visualization */}
              <motion.div 
                className="flex items-center gap-4 mb-8"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                
                <motion.div 
                  className="text-2xl text-blue-400"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  +
                </motion.div>
                
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                
                <motion.div 
                  className="text-2xl text-blue-400"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
                >
                  →
                </motion.div>
                
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-400 to-indigo-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
              </motion.div>

              {/* Progress Bar */}
              <motion.div 
                className="w-4/5 max-w-md mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="bg-gray-800/50 rounded-full h-3 overflow-hidden backdrop-blur-sm border border-white/10">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full relative"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                  </motion.div>
                </div>
              </motion.div>

              <motion.p 
                className="text-blue-200 text-sm font-medium tracking-wider"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
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
            {/* Video Preview Container */}
            <div className="w-full h-full glass-container rounded-2xl flex flex-col items-center justify-center p-6 relative overflow-hidden">
              {/* Success glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-2xl" />
              
              {/* Success indicator */}
              <motion.div 
                className="mb-4 flex items-center gap-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <motion.div
                  className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                <motion.span 
                  className="text-green-400 font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Video Generated Successfully
                </motion.span>
              </motion.div>

              {/* Video Preview */}
              <motion.div
                className="w-full max-w-[700px] aspect-video relative"
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <video
                  src={generatedVideo.url}
                  controls
                  className="w-full h-full rounded-xl shadow-2xl object-contain border border-white/10"
                  style={{
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(59, 130, 246, 0.2)',
                    background: 'rgba(0, 0, 0, 0.3)'
                  }}
                  preload="metadata"
                  autoPlay={false}
                />
                
                {/* Video overlay with play button when not playing */}
                <motion.div 
                  className="absolute inset-0 bg-black/20 rounded-xl flex items-center justify-center cursor-pointer group"
                  initial={{ opacity: 1 }}
                  whileHover={{ opacity: 0.8 }}
                  onClick={(e) => {
                    const video = e.currentTarget.previousElementSibling;
                    if (video && video.paused) {
                      video.play();
                      e.currentTarget.style.opacity = '0';
                      e.currentTarget.style.pointerEvents = 'none';
                    }
                  }}
                >
                  <motion.div
                    className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:bg-white transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg className="w-8 h-8 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* Video info */}
              <motion.div 
                className="mt-4 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <p className="text-gray-300 text-sm">
                  Click the play button to preview your generated video
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PairMergeAnimation;