
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';

const LoadingWindow = ({ isVisible, pairs, onClose }) => {
  const { getVideoGenerationState, generatedVideos, cancelVideoGeneration } = useAppStore();

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
            maxHeight: '80vh',
            width: 'calc(100% + 20px)', // 10px wider on each side
            maxWidth: 'calc(4rem * 16 + 20px)' // max-w-4xl + 20px
          }}
        >
          {/* Close/Cancel Button */}
          <button
            onClick={() => {
              cancelVideoGeneration();
              onClose();
            }}
            className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 hover:border-red-500/50 transition-all duration-200 group"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
          >
            <svg 
              className="w-4 h-4 text-red-400 group-hover:text-red-300 transition-colors" 
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
          <div className="p-8">
            {/* Header */}
            <div className="relative z-10 text-center mb-6">
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
          <div className="relative z-10 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pairs.map((pair, index) => {
                const videoState = getVideoGenerationState(pair.id);
                const generatedVideo = generatedVideos.find(v => v.pairId === pair.id);
                const isComplete = !!generatedVideo;
                const progress = isComplete ? 100 : (videoState?.progress || 0);

                return (
                  <motion.div
                    key={pair.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="relative p-4 rounded-xl overflow-hidden"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${isComplete ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    {/* Success glow for completed videos */}
                    {isComplete && (
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl" />
                    )}

                    {/* Pair Content */}
                    <div className="relative z-10">
                      {/* Audio and Image Row */}
                      <div className="flex items-center justify-between mb-3">
                        {/* Audio Miniature */}
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-gray-500/20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs text-gray-400 font-medium truncate">
                              {pair.audio?.name?.replace(/\.[^/.]+$/, '') || 'Audio'}
                            </div>
                          </div>
                        </div>

                        {/* Plus Symbol */}
                        <div className="mx-2 text-white/40">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </div>

                        {/* Image Miniature */}
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-gray-500/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {pair.image ? (
                              <img 
                                src={URL.createObjectURL(pair.image)} 
                                alt="Preview" 
                                className="w-full h-full object-cover rounded-lg grayscale"
                              />
                            ) : (
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs text-gray-400 font-medium truncate">
                              {pair.image?.name?.replace(/\.[^/.]+$/, '') || 'Image'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-400">
                            {isComplete ? 'Complete' : 'Processing...'}
                          </span>
                          <span className="text-xs text-white font-medium">
                            {progress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-800/50 rounded-full h-2 overflow-hidden backdrop-blur-sm border border-white/5">
                          <motion.div
                            className={`h-full rounded-full relative ${
                              isComplete 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                : 'bg-gradient-to-r from-blue-400 to-blue-500'
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                          >
                            {!isComplete && (
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                            )}
                          </motion.div>
                        </div>
                      </div>

                      {/* Status Indicator */}
                      <div className="flex items-center justify-center">
                        {isComplete ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200 }}
                            className="flex items-center gap-1 text-green-400"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-xs font-medium">Video Ready</span>
                          </motion.div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              {[1,2,3].map((i) => (
                                <motion.div
                                  key={i}
                                  className="w-1 h-1 bg-gray-400 rounded-full"
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
                            <span className="text-xs text-gray-400 font-medium">Generating</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Overall Progress */}
            <motion.div 
              className="relative z-10 mt-6 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="text-sm text-gray-300 mb-2">
                Overall Progress: {generatedVideos.length} of {pairs.length} completed
              </div>
              <div className="w-full bg-gray-800/50 rounded-full h-3 overflow-hidden backdrop-blur-sm border border-white/10 max-w-md mx-auto">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full relative"
                  initial={{ width: 0 }}
                  animate={{ width: `${(generatedVideos.length / pairs.length) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LoadingWindow;
