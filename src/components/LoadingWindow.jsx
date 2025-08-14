import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';

const LoadingWindow = ({ isVisible, pairs, onClose, onStop }) => {
  const { getVideoGenerationState, generatedVideos, videoSettings, removePair } = useAppStore();

  // Function to get video background style based on user settings
  const getVideoBackgroundStyle = () => {
    // Safely access videoSettings with fallback
    const settings = videoSettings || {};
    const background = settings.background || 'black';

    if (background === 'white') {
      return { backgroundColor: 'white' };
    } else if (background === 'black') {
      return { backgroundColor: 'black' };
    } else if (background === 'custom' && settings.customBackground) {
      try {
        // Check if it's already a data URL (base64) or needs to be converted from File object
        const backgroundUrl = typeof settings.customBackground === 'string' 
          ? settings.customBackground 
          : URL.createObjectURL(settings.customBackground);

        return {
          backgroundImage: `url(${backgroundUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        };
      } catch (error) {
        console.warn('Error creating background URL:', error);
        return { backgroundColor: 'black' }; // fallback on error
      }
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
          {/* Header */}
          <div className="flex items-center justify-center p-6 pb-2">
            <motion.h2
              className="text-3xl font-bold text-white mb-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Generating Videos
            </motion.h2>
          </div>
          <motion.p
            className="text-gray-300 text-lg text-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Processing {pairs.length} video pairs...
          </motion.p>

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

                          {/* Video Preview or Completion checkmark */}
                          {isComplete && generatedVideo ? (
                            <video
                              src={generatedVideo.url}
                              className="absolute inset-0 w-full h-full object-contain rounded"
                              controls
                              preload="metadata"
                              style={{ background: 'black' }}
                            />
                          ) : isComplete ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </div>
                          ) : null}
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

          {/* Footer with Stop Button */}
          <div className="p-6 pt-2">
            {onStop && (
              <div className="flex justify-center">
                <motion.button
                  onClick={onStop}
                  className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  STOP!
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LoadingWindow;