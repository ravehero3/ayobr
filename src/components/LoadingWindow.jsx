import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';

const LoadingWindow = ({ isVisible, pairs, onClose, onStop }) => {
  const { getVideoGenerationState, generatedVideos, videoSettings, removePair } = useAppStore();

  // Function to get video background style based on user settings
  const getVideoBackgroundStyle = () => {
    if (videoSettings.background === 'white') {
      return { backgroundColor: 'white' };
    } else if (videoSettings.background === 'black') {
      return { backgroundColor: 'black' };
    } else if (videoSettings.background === 'custom' && videoSettings.customBackground) {
      return {
        backgroundImage: `url(${URL.createObjectURL(videoSettings.customBackground)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    }
    return { backgroundColor: 'black' }; // fallback
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 flex items-center justify-center bg-space-dark/90 backdrop-blur-sm"
        style={{ paddingTop: '80px', paddingBottom: '80px' }}
      >
        {/* Loading Window - No Background */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative w-full max-w-4xl mx-4 p-2 rounded-lg overflow-hidden"
          style={{
            maxHeight: '85vh',
            width: '100%',
            maxWidth: '4rem * 16'
          }}
        >
          {/* Close/Cancel Button */}
          <button
            onClick={onStop}
            className="absolute top-6 right-6 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-gray-500/20 hover:bg-gray-500/40 border border-gray-500/30 hover:border-gray-500/50 transition-all duration-200 group"
          >
            <svg
              className="w-4 h-4 text-gray-400 group-hover:text-gray-300 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Content Container with proper padding */}
          <div className="p-10">
            {/* Header */}
            <div className="flex items-center justify-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Generating Videos
              </h2>
            </div>
            <motion.p
              className="text-gray-300 text-lg"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Processing {pairs.length} video pairs...
            </motion.p>
          </div>

          {/* Miniature Containers Grid */}
          <div className="relative z-10 max-h-80 overflow-y-auto mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
              {pairs.map((pair, index) => {
                const videoState = getVideoGenerationState(pair.id);
                const generatedVideo = generatedVideos.find(v => v.pairId === pair.id);
                const isComplete = !!generatedVideo;
                const progress = isComplete ? 100 : (videoState?.progress || 0);

                console.log(`LoadingWindow pair ${pair.id}:`, {
                  hasVideo: !!generatedVideo,
                  isComplete,
                  progress,
                  videoState
                });

                return (
                  <motion.div
                    key={pair.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="video-loading-container group"
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '180px',
                      background: isComplete ? 'rgba(0, 0, 0, 0.44)' : 'transparent',
                      borderRadius: '16px',
                      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                      backdropFilter: 'blur(11.4px)',
                      WebkitBackdropFilter: 'blur(11.4px)',
                      border: isComplete ? '1px solid rgba(0, 0, 0, 0.09)' : '1px solid rgba(255, 255, 255, 0.1)',
                      padding: '20px',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      overflow: 'visible'
                    }}
                    whileHover={{
                      scale: 1.02,
                      boxShadow: isComplete
                        ? '0 4px 30px rgba(0, 0, 0, 0.1), 0 0 40px rgba(19, 0, 255, 0.3), 0 0 80px rgba(79, 172, 254, 0.2)'
                        : '0 4px 30px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {/* Particle system */}
                    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1000 }}>
                      {[...Array(7)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-1 h-1 bg-white rounded-full"
                          style={{
                            top: `${-10 + Math.random() * 60}px`,
                            left: `${12 + i * 12}%`,
                            boxShadow: '0 0 6px rgba(255, 255, 255, 0.6)',
                            opacity: 0
                          }}
                          animate={isComplete ? {
                            x: [0, Math.random() * 60 - 30, Math.random() * 60 - 30, 0],
                            y: [0, Math.random() * 40 - 20, Math.random() * 40 - 20, 0],
                            scale: [0, 1, 0.8, 0],
                            opacity: [0, 0.8, 0.6, 0]
                          } : { opacity: 0 }}
                          transition={{
                            duration: 15 + Math.random() * 10,
                            repeat: Infinity,
                            delay: i * 3,
                            ease: "easeInOut"
                          }}
                        />
                      ))}
                    </div>

                    {/* Delete button - appears on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removePair(pair.id);
                      }}
                      className="absolute top-2 right-2 z-30 w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-white"
                      style={{ fontSize: '16px', fontWeight: 'bold' }}
                    >
                      ×
                    </button>

                    <div className="relative z-10 h-full flex flex-col">
                      {/* Title - Audio + Image names - positioned in front of image */}
                      <div
                        className="text-white font-semibold mb-3 text-center relative"
                        style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                          lineHeight: '1.3',
                          zIndex: 20
                        }}
                      >
                        {pair.audio?.name && pair.image?.name ? 
                          `${pair.audio.name.replace(/\.[^/.]+$/, "")} + ${pair.image.name.replace(/\.[^/.]+$/, "")}` :
                          generatedVideo?.filename || `Video ${index + 1}`
                        }
                      </div>

                      {/* Video Preview Area - moved 3px down from previous position */}
                      <div className="flex-1 flex items-center justify-center" style={{ marginTop: '-37px' }}>
                        <div 
                          className="aspect-video bg-black/30 rounded border border-white/20 flex items-center justify-center relative overflow-hidden"
                          style={{ width: '160px', height: '90px' }}
                        >
                          {/* Video background preview based on user settings */}
                          <div 
                            className="absolute inset-0"
                            style={getVideoBackgroundStyle()}
                          />

                          {/* Foreground image preview */}
                          {pair.image && (
                            <img 
                              src={URL.createObjectURL(pair.image)}
                              alt="Preview"
                              className="absolute inset-0 w-full h-full object-contain opacity-80"
                              style={{ zIndex: 1 }}
                            />
                          )}

                          {/* Single progress overlay in center of preview - only percentage counter we keep */}
                          {!isComplete && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center" style={{ zIndex: 50 }}>
                              <div className="text-white text-sm font-medium" style={{ zIndex: 51 }}>
                                {Math.round(progress)}%
                              </div>
                            </div>
                          )}

                          {/* Completion checkmark */}
                          {isComplete && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Single Progress Bar - only the colorful one */}
                      <div className="w-full bg-white/10 rounded-full h-2 mt-4">
                        <motion.div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${progress}%`,
                            background: 'linear-gradient(90deg, #1e40af 0%, #3b82f6 50%, #93c5fd 100%)',
                            boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)'
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Overall Progress */}
            <motion.div
              className="relative z-10 mt-8 text-center rounded-xl p-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="text-sm text-gray-200 mb-3 font-medium">
                Overall Progress: {generatedVideos.length} of {pairs.length} completed
              </div>
              <div className="w-full bg-gray-800/60 rounded-full h-4 overflow-hidden backdrop-blur-sm border border-white/15 max-w-md mx-auto shadow-inner">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full relative"
                  initial={{ width: 0 }}
                  animate={{ width: `${(generatedVideos.length / pairs.length) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                </motion.div>
              </div>
              <div className="text-xs text-gray-400 mt-2">
                {Math.round((generatedVideos.length / pairs.length) * 100)}% Complete
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LoadingWindow;