import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import mrakyBackground from '../assets/mraky-a-zzz.png';

const LoadingWindow = ({ isVisible, pairs, onClose, onStop }) => {
  const { getVideoGenerationState, generatedVideos, videoSettings, removePair } = useAppStore();

  // Function to get video background style based on user settings
  const getVideoBackgroundStyle = () => {
    // Safely access videoSettings with fallback - ensure we get the most recent settings
    const currentStore = useAppStore.getState();
    const settings = currentStore.videoSettings || {};
    const background = settings.background || 'black';

    console.log('LoadingWindow - Background settings:', { background, settings });

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
        className="fixed inset-0 flex flex-col items-center justify-start bg-space-dark/90"
        style={{ zIndex: 999998, paddingTop: '72px', paddingBottom: '40px' }} // Above all elements including header
      >
        {/* Loading Window - No Background */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative w-full max-w-7xl mx-4 p-2 rounded-lg overflow-visible"
          style={{
            maxHeight: 'calc(100vh - 80px)',
            width: '100%',
            maxWidth: '112rem',
            background: 'transparent',
          }}
        >
          {/* No sleeping alien backgrounds here - only in AnimatedBackground */}

          {/* Header space - keeping for layout consistency */}
          <div className="relative flex flex-col items-center justify-center header-no-blur" style={{ zIndex: 999999, paddingTop: '0px', paddingBottom: '24px', marginTop: '-64px' }}>
            {/* Header text removed */}
          </div>

          {/* Miniature Containers Grid - Moved 30px down */}
          <div className="relative overflow-y-auto mb-8 px-4" style={{ marginTop: '50px', zIndex: 50, maxHeight: 'calc(24rem + 100px)' }}>
            {/* Grid of pairs */}
          <div
            className="grid gap-6 w-full mx-auto"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, 240px)',
              justifyContent: 'center',
              justifyItems: 'center',
              maxWidth: 'calc(100vw - 160px)',
              padding: '0 80px',
              zIndex: 50,
              gap: '24px'
            }}
          >
              {pairs.map((pair, index) => {
                const videoState = getVideoGenerationState(pair.id);
                const generatedVideo = generatedVideos.find(v => v.pairId === pair.id);

                // Simplified completion detection
                const progressValue = Math.max(0, videoState?.progress || 0);
                const hasGeneratedVideo = !!generatedVideo;
                const hasStateVideo = !!(videoState?.video);
                const isComplete = hasGeneratedVideo || (videoState?.isComplete === true && hasStateVideo);
                const progress = isComplete ? 100 : progressValue;
                const videoToShow = generatedVideo || videoState?.video;

                // Enhanced display logic for video previews with proper sequential generation
                const shouldShowVideoPreview = (isComplete || progress === 100) && !!videoToShow && videoToShow.url;
                
                // Show percentage for generating videos OR trigger next video in sequence
                const isCurrentlyGenerating = videoState?.isGenerating;
                const isNextInQueue = !hasGeneratedVideo && !hasStateVideo && !isComplete && progress === 0;
                
                // Check if this should be the next video to generate (first incomplete video after any completed ones)
                const completedVideosCount = pairs.filter(p => {
                  const pState = getVideoGenerationState(p.id);
                  const pVideo = generatedVideos.find(v => v.pairId === p.id);
                  return pVideo || (pState?.isComplete && pState?.video);
                }).length;
                
                const currentIndex = pairs.findIndex(p => p.id === pair.id);
                const shouldBeGenerating = currentIndex === completedVideosCount && !hasGeneratedVideo && !hasStateVideo;
                
                // Check if any video is currently generating
                const anyVideoGenerating = pairs.some(p => getVideoGenerationState(p.id)?.isGenerating);
                
                const shouldShowPercentage = (isCurrentlyGenerating && progress >= 0 && progress < 100) || 
                                           (shouldBeGenerating && !anyVideoGenerating);
                
                const shouldShowPlayButton = shouldShowVideoPreview;

                // For debugging
                const debugInfo = {
                  hasVideo: !!generatedVideo,
                  hasStateVideo: !!videoState?.video,
                  isComplete,
                  progress,
                  progressValue,
                  shouldShowVideoPreview,
                  shouldShowPercentage,
                  shouldShowPlayButton,
                  videoState: {
                    isGenerating: videoState?.isGenerating,
                    isComplete: videoState?.isComplete,
                    progress: videoState?.progress,
                    hasVideo: !!videoState?.video
                  },
                  allGeneratedVideos: generatedVideos.length
                };
                console.log(`LoadingWindow pair ${pair.id}:`, debugInfo);

                return (
                  <motion.div
                    key={pair.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="video-loading-container group"
                    style={{
                      position: 'relative',
                      width: '240px',
                      minWidth: '240px',
                      maxWidth: '240px',
                      height: '220px',
                      background: 'rgba(0, 0, 0, 0.41)',
                      borderRadius: '16px',
                      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                      backdropFilter: 'blur(11.4px)',
                      WebkitBackdropFilter: 'blur(11.4px)',
                      border: '1px solid rgba(0, 0, 0, 0.4)',
                      padding: '20px',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      overflow: 'visible',
                      zIndex: 60
                    }}
                    whileHover={{
                      backgroundColor: 'rgba(0, 0, 0, 0.51)',
                      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1), 0 0 40px rgba(19, 0, 255, 0.3), 0 0 80px rgba(79, 172, 254, 0.2)',
                      zIndex: 70
                    }}
                  >
                    {/* Enhanced Particle system - similar to Generate Videos button */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl" style={{ zIndex: 80 }}>
                      {/* Progress bar area particles - positioned around progress bar */}
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={`progress-particle-${i}`}
                          className="absolute rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{
                            width: '2px',
                            height: '2px',
                            background: i % 2 === 0 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(179, 229, 252, 0.8)',
                            // Position around progress bar area (bottom of container)
                            top: `${75 + (i % 2) * 8}%`, // Around progress bar vertical area
                            left: `${15 + (i * 10)}%`, // Spread across progress bar width
                            boxShadow: '0 0 8px rgba(255, 255, 255, 0.6)'
                          }}
                          animate={{
                            // Perfect circular motion around progress bar - returns to start position
                            x: [0, 15 * Math.cos(i * 45 * Math.PI / 180), 15 * Math.cos((i * 45 + 90) * Math.PI / 180), 15 * Math.cos((i * 45 + 180) * Math.PI / 180), 15 * Math.cos((i * 45 + 270) * Math.PI / 180), 0],
                            y: [0, 8 * Math.sin(i * 45 * Math.PI / 180), 8 * Math.sin((i * 45 + 90) * Math.PI / 180), 8 * Math.sin((i * 45 + 180) * Math.PI / 180), 8 * Math.sin((i * 45 + 270) * Math.PI / 180), 0],
                            scale: [0.8, 1.2, 1.0, 0.8, 1.0, 0.8]
                          }}
                          transition={{
                            duration: 4.95, // 50% slower (3.3 * 1.5 = 4.95)
                            repeat: Infinity,
                            delay: i * 0.33, // Also make delay 50% slower (0.22 * 1.5 = 0.33)
                            ease: "linear" // Linear easing for consistent speed throughout
                          }}
                        />
                      ))}

                      {/* Completion particles - only show when reaching 100% but no video yet */}
                      {progressValue >= 100 && !shouldShowVideoPreview && [...Array(6)].map((_, i) => (
                        <motion.div
                          key={`complete-particle-${i}`}
                          className="absolute w-2 h-2 bg-green-400 rounded-full"
                          style={{
                            // Position around completed progress bar
                            top: `${78 + (i % 2) * 6}%`,
                            left: `${20 + i * 12}%`,
                            boxShadow: '0 0 12px rgba(34, 197, 94, 0.8)',
                          }}
                          animate={{
                            // Perfect celebratory burst pattern around progress bar
                            x: [0, 20 * Math.cos(i * 60 * Math.PI / 180), 10 * Math.cos(i * 60 * Math.PI / 180), 0],
                            y: [0, -15 * Math.sin(i * 60 * Math.PI / 180), -8 * Math.sin(i * 60 * Math.PI / 180), 0],
                            scale: [0, 1.8, 0.5, 1.5, 0.8, 0],
                            opacity: [0, 1, 0.8, 1, 0.6, 0]
                          }}
                          transition={{
                            duration: 4.125, // 50% slower (2.75 * 1.5 = 4.125)
                            repeat: Infinity,
                            delay: i * 0.495, // 50% slower delay (0.33 * 1.5 = 0.495)
                            ease: "linear" // Linear easing for consistent speed
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
                      className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-white"
                      style={{ fontSize: '16px', fontWeight: 'bold', zIndex: 90 }}
                    >
                      ×
                    </button>

                    <div className="relative h-full flex flex-col">
                      {/* Title - Audio + Image names - positioned in front of image */}
                      <div
                        className="text-white font-semibold mb-3 text-center relative"
                        style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                          lineHeight: '1.3',
                          zIndex: 75,
                          minHeight: '36px',
                          maxHeight: '36px',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {(() => {
                          let title = '';
                          if (pair.audio?.name && pair.image?.name) {
                            title = `${pair.audio.name.replace(/\.[^/.]+$/, "")} + ${pair.image.name.replace(/\.[^/.]+$/, "")}`;
                          } else {
                            title = generatedVideo?.filename || `Video ${index + 1}`;
                          }
                          // Truncate to 44 characters maximum
                          return title.length > 44 ? title.substring(0, 44) : title;
                        })()}
                      </div>

                      {/* Video Preview Area - moved 30px down from previous position and fixed positioning */}
                      <div className="flex-1 flex items-center justify-center" style={{ marginTop: '-7px', minHeight: '112px' }}>
                        <div
                          className="aspect-video bg-black/30 rounded flex items-center justify-center relative overflow-hidden"
                          style={{
                            width: '192px',
                            height: '108px',
                            minWidth: '192px',
                            maxWidth: '192px',
                            minHeight: '108px',
                            maxHeight: '108px',
                            position: 'relative',
                            flexShrink: 0,
                            padding: '2px'
                          }}
                        >
                          {/* Video background preview based on user settings - centered */}
                          <div
                            className="absolute inset-0 w-full h-full flex items-center justify-center"
                            style={{
                              ...getVideoBackgroundStyle()
                            }}
                          />

                          {/* Foreground image preview - centered with proper spacing */}
                          {pair.image && (
                            <div className="absolute flex items-center justify-center" style={{
                              top: '2px',
                              left: '2px',
                              right: '2px',
                              bottom: '2px'
                            }}>
                              <img
                                src={URL.createObjectURL(pair.image)}
                                alt="Preview"
                                className="max-w-full max-h-full object-contain opacity-80"
                                style={{ zIndex: 1 }}
                              />
                            </div>
                          )}

                          {/* Progress percentage - fade out when reaching 100% or when video is ready */}
                          {shouldShowPercentage && (
                            <div
                              className="absolute text-white text-sm font-medium text-center transition-opacity duration-500"
                              style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                zIndex: 10,
                                textShadow: '0 2px 8px rgba(0, 0, 0, 0.9), 0 1px 4px rgba(0, 0, 0, 0.8), 0 0 2px rgba(0, 0, 0, 1)',
                                opacity: shouldShowPercentage ? 1 : 0
                              }}
                            >
                              {Math.round(progress)}%
                            </div>
                          )}



                          {/* Video Preview with Play Button - show when we have a generated video */}
                          {shouldShowVideoPreview && videoToShow?.url && (
                            <div
                              className="absolute inset-0 flex items-center justify-center transition-opacity duration-500"
                              style={{
                                opacity: shouldShowVideoPreview ? 1 : 0,
                                zIndex: 9999999 // Ensure video preview is above all other elements
                              }}
                            >
                              <div className="relative w-full h-full" style={{ zIndex: 9999999 }}>
                                {/* Enhanced video player with better error handling */}
                                <video
                                  key={`video-player-${pair.id}`}
                                  src={videoToShow.url}
                                  className="absolute inset-0 w-full h-full object-contain rounded"
                                  style={{
                                    background: 'transparent',
                                    display: 'none', // Initially hidden until play button is clicked
                                    zIndex: 9999999
                                  }}
                                  preload="metadata"
                                  onLoadedData={() => {
                                    console.log(`Video loaded successfully for ${pair.id}`);
                                  }}
                                  onError={(e) => {
                                    console.error(`Video error for ${pair.id}:`, e);
                                    console.log('Video URL:', videoToShow.url);
                                    console.log('Video object:', videoToShow);
                                  }}
                                />

                                {/* Interactive video thumbnail with play button */}
                                <div
                                  className="absolute inset-0 cursor-pointer group"
                                  style={{ zIndex: 9999999 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    console.log(`Play button clicked for video ${pair.id}`);
                                    console.log('Video URL:', videoToShow.url);

                                    const videoElement = e.currentTarget.parentElement.querySelector('video');
                                    const overlay = e.currentTarget;

                                    if (videoElement && videoToShow.url) {
                                      console.log('Starting video playback...');

                                      // Show video player
                                      videoElement.style.display = 'block';
                                      videoElement.setAttribute('controls', 'true');
                                      videoElement.setAttribute('controlsList', 'nodownload');
                                      videoElement.style.zIndex = '9999999';

                                      // Start playback
                                      videoElement.play()
                                        .then(() => {
                                          console.log('Video playback started successfully');
                                          overlay.style.display = 'none'; // Hide overlay after successful play
                                        })
                                        .catch(err => {
                                          console.error('Video playback failed:', err);
                                          console.log('Attempting to create new video element...');

                                          // Fallback: Try opening in new tab
                                          window.open(videoToShow.url, '_blank');
                                        });
                                    } else {
                                      console.error('Video element or URL not available');
                                      console.log('VideoElement exists:', !!videoElement);
                                      console.log('Video URL exists:', !!videoToShow.url);
                                    }
                                  }}
                                >
                                  {/* Simple video preview thumbnail */}
                                  <div
                                    className="absolute inset-0 w-full h-full object-contain rounded pointer-events-none flex items-center justify-center"
                                    style={{
                                      background: 'rgba(0,0,0,0.3)',
                                      color: 'white',
                                      fontSize: '12px',
                                      textAlign: 'center',
                                      zIndex: 9999999
                                    }}
                                  >
                                    Video Ready
                                    <br />
                                    Click to Play
                                  </div>

                                  {/* Play button overlay with highest z-index */}
                                  <div
                                    className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors"
                                    style={{ zIndex: 9999999 }}
                                  >
                                    <div
                                      className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all duration-200 shadow-lg"
                                      style={{ zIndex: 9999999 }}
                                    >
                                      <svg className="w-5 h-5 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z"/>
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Single Progress Bar - fade out when video preview shows */}
                      <motion.div
                        className="w-full bg-white/10 rounded-full h-2 mt-4"
                        animate={{ opacity: shouldShowPercentage ? 1 : 0 }}
                        transition={{ duration: 0.5 }}
                      >
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
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Footer - removed Stop Button */}
          <div className="p-6 pt-2">
            {/* Empty footer space */}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LoadingWindow;