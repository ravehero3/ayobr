import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';

const LoadingWindow = ({ isVisible, pairs, onClose, onStop }) => {
  const { getVideoGenerationState, generatedVideos } = useAppStore();

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        {/* Loading Window - Glassmorphism Style */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative w-full max-w-4xl mx-4 p-2 rounded-lg overflow-hidden"
          style={{
            background: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 45px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
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

          {/* Ambient glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-lg" />

          {/* Content Container with proper padding */}
          <div className="p-10">
            {/* Header */}
            <div className="relative z-10 text-center mb-8">
            <motion.h2
              className="text-3xl font-bold text-white mb-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Generating Videos
            </motion.h2>
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

                return (
                  <motion.div
                    key={pair.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="video-loading-container"
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

                    <div className="relative z-10">
                      {/* Title */}
                      <div
                        className="text-white font-semibold mb-2"
                        style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                        }}
                      >
                        {generatedVideo?.filename || `Video ${index + 1}`}
                      </div>

                      {/* Subtitle */}
                      <div
                        className="text-white/80 mb-6"
                        style={{
                          fontSize: '12px',
                          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                        }}
                      >
                        {isComplete ? 'Generation Complete' : `Processing... ${Math.round(progress)}%`}
                      </div>

                      {/* Miniature containers row */}
                      <div className="flex items-center justify-center gap-2 mb-6">
                        {/* Audio mini container */}
                        {pair.audio && (
                          <div className="w-10 h-6 bg-black/20 rounded border border-white/10 flex items-center justify-center">
                            <div className="w-4 h-1 bg-green-400 rounded-full"></div>
                          </div>
                        )}

                        <div className="text-gray-400 text-sm">+</div>

                        {/* Image mini container */}
                        {pair.image && (
                          <div className="w-10 h-6 bg-black/20 rounded border border-white/10 flex items-center justify-center">
                            <div className="w-4 h-4 bg-purple-400 rounded"></div>
                          </div>
                        )}

                        <div className="text-gray-400 text-sm">→</div>

                        {/* Video result */}
                        <div className="w-12 h-8 bg-black/20 rounded border border-white/10 flex items-center justify-center">
                          {isComplete ? (
                            <div className="text-green-400 font-bold">✓</div>
                          ) : (
                            <div className="flex gap-0.5">
                              {[1,2,3].map((i) => (
                                <motion.div
                                  key={i}
                                  className="w-1 h-1 bg-blue-400 rounded-full"
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
                          )}
                        </div>
                      </div>

                      {/* Progress Container */}
                      <div
                        className="relative w-full bg-white/10 rounded overflow-visible"
                        style={{ height: '8px' }}
                      >
                        <motion.div
                          className="h-full rounded relative transition-all duration-300"
                          style={{
                            width: `${progress}%`,
                            background: isComplete
                              ? 'linear-gradient(90deg, #1300ff 0%, #4facfe 100%)'
                              : '#333',
                            boxShadow: isComplete
                              ? '0 0 20px rgba(19, 0, 255, 0.25), 0 0 40px rgba(19, 0, 255, 0.15), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.2)'
                              : 'none'
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.5 }}
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
              className="relative z-10 mt-8 text-center bg-white/5 rounded-xl p-6 border border-white/10"
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