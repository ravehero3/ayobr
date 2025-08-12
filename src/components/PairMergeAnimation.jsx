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
            className="absolute flex items-center justify-center inset-0"
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Video Loading Container - centered and always visible */}
            <div 
              className="glass-container rounded-2xl flex flex-col items-center justify-center p-8 relative overflow-hidden mx-auto"
              style={{
                width: '600px',
                height: '300px',
                maxWidth: '90vw'
              }}
            >
              {/* Ambient glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl" />

              {/* Miniature representations */}
              <div className="flex items-center gap-4 mb-6">
                {/* Audio miniature - representing the actual audio container */}
                <motion.div 
                  className="glass-container rounded-lg p-2 w-20 h-12 flex flex-col items-center justify-center"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center gap-0.5 mb-1">
                    {[1,2,3,4,5].map((i) => (
                      <motion.div
                        key={i}
                        className="w-0.5 bg-green-400 rounded-full"
                        style={{ height: `${4 + (i % 3) * 2}px` }}
                        animate={{ 
                          scaleY: [1, 1.5, 1],
                          opacity: [0.7, 1, 0.7]
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.1
                        }}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-green-400 font-medium truncate w-full text-center">
                    {pair.audio?.name?.replace(/\.[^/.]+$/, '').substring(0, 8) || 'Audio'}
                  </div>
                </motion.div>

                {/* Plus symbol */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-white/60"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </motion.div>

                {/* Image miniature - showing actual image */}
                <motion.div 
                  className="glass-container rounded-lg p-1 w-20 h-12 flex flex-col items-center justify-center overflow-hidden"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {pair.image ? (
                    <>
                      <img 
                        src={URL.createObjectURL(pair.image)} 
                        alt="Preview" 
                        className="w-full h-8 object-cover rounded"
                      />
                      <div className="text-xs text-blue-400 font-medium truncate w-full text-center mt-0.5">
                        {pair.image.name.replace(/\.[^/.]+$/, '').substring(0, 8)}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-gray-600 rounded flex flex-col items-center justify-center">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div className="text-xs text-gray-400">Image</div>
                    </div>
                  )}
                </motion.div>

                {/* Arrow pointing to video */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/60"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.div>

                {/* Video loading miniature with three dots animation */}
                <motion.div 
                  className="glass-container rounded-lg p-2 w-20 h-12 flex flex-col items-center justify-center"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center gap-1 mb-1">
                    {[1,2,3].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 bg-purple-400 rounded-full"
                        animate={{ 
                          scale: [1, 1.5, 1],
                          opacity: [0.3, 1, 0.3]
                        }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          delay: i * 0.2
                        }}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-purple-400 font-medium">
                    Video
                  </div>
                </motion.div>
              </div>

              {/* Loading Title with file names */}
              <motion.div
                className="text-center mb-6 relative z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 
                  className="text-white font-semibold mb-2"
                  style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                    lineHeight: '1.3'
                  }}
                >
                  {pair.audio?.name && pair.image?.name ? 
                    `${pair.audio.name.replace(/\.[^/.]+$/, "")} + ${pair.image.name.replace(/\.[^/.]+$/, "")}` :
                    'Generating Video'
                  }
                </h3>
                <p 
                  className="text-white/80 mb-4"
                  style={{
                    fontSize: '14px',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  Processing... {Math.round(progress)}%
                </p>

                {/* Video Preview Area */}
                <motion.div 
                  className="w-full max-w-[300px] mx-auto mb-4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div 
                    className="aspect-video bg-black/30 rounded-lg border border-white/20 flex items-center justify-center relative overflow-hidden"
                    style={{ minHeight: '150px' }}
                  >
                    {/* Background image preview */}
                    {pair.image && (
                      <img 
                        src={URL.createObjectURL(pair.image)}
                        alt="Preview"
                        className="absolute inset-0 w-full h-full object-cover opacity-60"
                      />
                    )}
                    
                    {/* Audio waveform indicator */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1">
                      {[...Array(12)].map((_, i) => (
                        <div 
                          key={i}
                          className="bg-green-400/80 rounded-full"
                          style={{
                            width: '4px',
                            height: `${10 + Math.random() * 16}px`,
                            animation: `pulse ${0.5 + i * 0.1}s infinite alternate`
                          }}
                        />
                      ))}
                    </div>

                    {/* Progress overlay */}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded">
                        {Math.round(progress)}%
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Progress Bar */}
              <div className="w-full max-w-md mx-auto mb-6 relative z-10">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-white/80">Progress</span>
                  <span className="text-sm text-white font-medium">{Math.round(progress)}%</span>
                </div>
                <div 
                  className="relative w-full bg-white/10 rounded overflow-visible"
                  style={{ height: '8px' }}
                >
                  <motion.div
                    className="h-full rounded relative transition-all duration-300"
                    style={{
                      background: 'linear-gradient(90deg, #1300ff 0%, #4facfe 100%)',
                      boxShadow: '0 0 20px rgba(19, 0, 255, 0.25), 0 0 40px rgba(19, 0, 255, 0.15), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.2)'
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                  </motion.div>
                </div>
              </div>

              {/* Progress Bar */}
              <motion.div 
                className="w-full max-w-[300px] mx-auto mb-4"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <div className="w-full bg-white/10 rounded-full h-3">
                  <motion.div 
                    className="bg-gradient-to-r from-blue-400 to-purple-500 h-3 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
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