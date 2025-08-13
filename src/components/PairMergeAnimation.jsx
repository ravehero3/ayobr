
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';

const PairMergeAnimation = ({ pair, isGenerating, progress, onAnimationComplete }) => {
  const [animationStage, setAnimationStage] = useState('idle'); // idle, merging, merged, completed
  const [showProgress, setShowProgress] = useState(false);
  const [audioPosition, setAudioPosition] = useState(null);
  const [imagePosition, setImagePosition] = useState(null);
  const containerRef = useRef(null);
  const { generatedVideos, videoSettings } = useAppStore();

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
    // Start animation immediately when generation starts (regardless of existing video)
    if (isGenerating && animationStage === 'idle') {
      // Capture the positions of the actual audio and image containers
      const captureContainerPositions = () => {
        const pairElement = document.querySelector(`[data-pair-id="${pair.id}"]`);
        console.log('Looking for pair element:', `[data-pair-id="${pair.id}"]`, pairElement);

        if (pairElement) {
          // Look for the actual container elements more broadly
          const audioElement = pairElement.querySelector('[class*="audio"]') || pairElement.querySelector('.audio-container');
          const imageElement = pairElement.querySelector('[class*="image"]') || pairElement.querySelector('.image-container');
          const plusElement = pairElement.querySelector('.connecting-bridge');

          console.log('Found elements:', { audioElement, imageElement, plusElement });

          if (audioElement && imageElement) {
            const containerRect = pairElement.getBoundingClientRect();
            const audioRect = audioElement.getBoundingClientRect();
            const imageRect = imageElement.getBoundingClientRect();

            // If plus element is found, use it for center position, otherwise calculate center
            let centerX, centerY;
            if (plusElement) {
              const plusRect = plusElement.getBoundingClientRect();
              centerX = plusRect.left + (plusRect.width / 2) - containerRect.left;
              centerY = plusRect.top + (plusRect.height / 2) - containerRect.top;
            } else {
              // Fallback: calculate center between audio and image
              centerX = (audioRect.right + imageRect.left) / 2 - containerRect.left;
              centerY = (audioRect.top + audioRect.bottom) / 2 - containerRect.top;
            }

            console.log('Calculated positions:', {
              audio: { x: audioRect.left - containerRect.left, y: audioRect.top - containerRect.top },
              image: { x: imageRect.left - containerRect.left, y: imageRect.top - containerRect.top },
              center: { x: centerX, y: centerY }
            });

            // Calculate positions relative to the pair container
            setAudioPosition({
              x: audioRect.left - containerRect.left,
              y: audioRect.top - containerRect.top,
              width: audioRect.width,
              height: audioRect.height,
              centerX,
              centerY
            });

            setImagePosition({
              x: imageRect.left - containerRect.left,
              y: imageRect.top - containerRect.top,
              width: imageRect.width,
              height: imageRect.height,
              centerX,
              centerY
            });

            return true; // Successful capture
          } else {
            console.log('Could not find audio/image elements');
            return false;
          }
        }
        return false;
      };

      const positionsCaptured = captureContainerPositions();

      if (positionsCaptured) {
        // Start the merge animation after a brief delay to ensure positions are captured
        setTimeout(() => {
          console.log('Starting merge animation');
          setAnimationStage('merging');
        }, 100);

        // Show merged container after animation
        setTimeout(() => {
          console.log('Moving to merged state');
          setAnimationStage('merged');
          setShowProgress(true);
        }, 1600); // Increased delay to allow merge animation to complete
      } else {
        // Skip directly to merged if we can't capture positions - but still show the animation
        console.log('Skipping merge animation, going directly to merged');
        setTimeout(() => {
          setAnimationStage('merged');
          setShowProgress(true);
        }, 100);
      }
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

  // Get background style based on video settings
  const getBackgroundStyle = () => {
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
            {/* Audio container clone moving towards center (plus sign position) */}
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
                x: audioPosition.centerX - audioPosition.x - (audioPosition.width / 2),
                y: audioPosition.centerY - audioPosition.y - (audioPosition.height / 2),
                scale: 0.7,
                opacity: 0
              }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            >
              {/* Audio icon and content */}
              <motion.div 
                className="flex items-center gap-2"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ delay: 0.6, duration: 0.3 }}
              >
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <span className="text-white text-sm font-medium">
                  {pair.audio?.name?.replace(/\.[^/.]+$/, '') || 'Audio'}
                </span>
              </motion.div>
            </motion.div>

            {/* Image container clone moving towards center (plus sign position) */}
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
                x: imagePosition.centerX - imagePosition.x - (imagePosition.width / 2),
                y: imagePosition.centerY - imagePosition.y - (imagePosition.height / 2),
                scale: 0.7,
                opacity: 0
              }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            >
              {/* Image icon and content */}
              <motion.div 
                className="flex items-center gap-2"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ delay: 0.6, duration: 0.3 }}
              >
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-white text-sm font-medium">
                  {pair.image?.name?.replace(/\.[^/.]+$/, '') || 'Image'}
                </span>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {animationStage === 'merged' && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Video Preview Container - shows what the video will look like */}
            <div 
              className="glass-container rounded-2xl relative overflow-hidden mx-auto"
              style={{
                width: 'min(500px, 90vw)',
                height: 'min(300px, 60vh)',
                maxWidth: '100%',
                maxHeight: '100%'
              }}
            >
              {/* Background layer - shows the actual video background that will be used */}
              <div 
                className="absolute inset-0"
                style={getBackgroundStyle()}
              />

              {/* Image preview - shows how the image will appear in the video */}
              {pair.image && (
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <img 
                    src={URL.createObjectURL(pair.image)}
                    alt="Video Preview"
                    className="max-w-full max-h-full object-contain"
                    style={{
                      filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))'
                    }}
                  />
                </div>
              )}
              
              {/* Dark overlay for better text readability */}
              <div className="absolute inset-0 bg-black/40" />

              {/* Title overlay - positioned at top */}
              <motion.div
                className="absolute top-4 left-4 right-4 z-20 text-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 
                  className="text-white font-semibold break-words"
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)',
                    lineHeight: '1.3'
                  }}
                >
                  {pair.audio?.name && pair.image?.name ? 
                    `${pair.audio.name.replace(/\.[^/.]+$/, "")} + ${pair.image.name.replace(/\.[^/.]+$/, "")}` :
                    'Generating Video'
                  }
                </h3>
              </motion.div>

              {/* Single Progress Bar - centered in the middle */}
              <motion.div 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 px-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                style={{ width: '90%', maxWidth: '280px' }}
              >
                <div className="text-center mb-3">
                  <p 
                    className="text-white font-medium"
                    style={{
                      fontSize: '14px',
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)'
                    }}
                  >
                    Processing... {Math.round(progress)}%
                  </p>
                </div>
                
                <div 
                  className="relative w-full bg-black/30 rounded-full overflow-hidden border border-white/20"
                  style={{ height: '8px' }}
                >
                  <motion.div
                    className="h-full rounded-full relative"
                    style={{
                      background: 'linear-gradient(90deg, #1e40af 0%, #3b82f6 50%, #93c5fd 100%)',
                      boxShadow: '0 0 20px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.2)'
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Processing indicator at bottom */}
              <motion.div
                className="absolute bottom-4 left-4 right-4 z-20 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <p 
                  className="text-white/90 text-sm font-medium"
                  style={{
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)'
                  }}
                >
                  Creating your video...
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}

        {animationStage === 'completed' && generatedVideo && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.6 }}
          >
            {/* Video Preview Container - properly contained */}
            <div 
              className="glass-container rounded-2xl relative overflow-hidden mx-auto"
              style={{
                width: 'min(500px, 90vw)',
                height: 'min(300px, 60vh)',
                maxWidth: '100%',
                maxHeight: '100%'
              }}
            >
              {/* Generated video as background preview */}
              <video
                src={generatedVideo.url}
                className="absolute inset-0 w-full h-full object-cover"
                muted
                loop
                autoPlay
                playsInline
              />

              {/* Dark overlay for better text readability */}
              <div className="absolute inset-0 bg-black/30" />

              {/* Success indicator at top */}
              <motion.div 
                className="absolute top-4 left-4 right-4 z-20 flex items-center justify-center gap-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <motion.div
                  className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                <motion.span 
                  className="text-green-400 font-medium text-sm"
                  style={{
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)'
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Video Generated Successfully
                </motion.span>
              </motion.div>

              {/* Video title overlay */}
              <motion.div
                className="absolute top-12 left-4 right-4 z-20 text-center"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 
                  className="text-white font-semibold break-words"
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)',
                    lineHeight: '1.3'
                  }}
                >
                  {pair.audio?.name && pair.image?.name ? 
                    `${pair.audio.name.replace(/\.[^/.]+$/, "")} + ${pair.image.name.replace(/\.[^/.]+$/, "")}` :
                    'Generated Video'
                  }
                </h3>
              </motion.div>

              {/* Play button overlay - centered */}
              <motion.div 
                className="absolute inset-0 flex items-center justify-center z-20"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.div
                  className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center cursor-pointer group hover:bg-white transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    // This is a preview - the actual video controls will be in the main view
                    console.log('Video preview clicked');
                  }}
                >
                  <svg className="w-6 h-6 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </motion.div>
              </motion.div>

              {/* Info text at bottom */}
              <motion.div
                className="absolute bottom-4 left-4 right-4 z-20 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <p 
                  className="text-white/90 text-xs font-medium"
                  style={{
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)'
                  }}
                >
                  Video ready for download
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
