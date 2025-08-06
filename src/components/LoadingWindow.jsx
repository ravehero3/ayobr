
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="relative p-6 rounded-xl overflow-hidden"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${isComplete ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                      backdropFilter: 'blur(10px)',
                      margin: '4px' // Add margin to prevent edge overlapping
                    }}
                  >
                    {/* Success glow for completed videos */}
                    {isComplete && (
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl" />
                    )}

                    {/* Pair Content */}
                    <div className="relative z-10">
                      {/* Audio and Image Row */}
                      <div className="flex items-center justify-between mb-4 gap-4">
                        {/* Audio Miniature */}
                        <div className="flex items-center gap-3 flex-1 px-2">
                          <div className="w-10 h-10 rounded-lg bg-gray-500/20 flex items-center justify-center flex-shrink-0 border border-gray-600/30">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs text-gray-300 font-medium truncate">
                              {pair.audio?.name?.replace(/\.[^/.]+$/, '') || 'Audio'}
                            </div>
                          </div>
                        </div>

                        {/* Plus Symbol */}
                        <div className="mx-4 text-white/50 flex-shrink-0">
                          <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </div>
                        </div>

                        {/* Image Miniature */}
                        <div className="flex items-center gap-3 flex-1 px-2">
                          <div className="w-10 h-10 rounded-lg bg-gray-500/20 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-600/30">
                            {pair.image ? (
                              <img 
                                src={URL.createObjectURL(pair.image)} 
                                alt="Preview" 
                                className="w-full h-full object-cover rounded-lg grayscale"
                              />
                            ) : (
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs text-gray-300 font-medium truncate">
                              {pair.image?.name?.replace(/\.[^/.]+$/, '') || 'Image'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4 px-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-300 font-medium">
                            {isComplete ? 'Complete' : 'Processing...'}
                          </span>
                          <span className="text-xs text-white font-semibold bg-white/10 px-2 py-1 rounded-full">
                            {progress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-800/60 rounded-full h-3 overflow-hidden backdrop-blur-sm border border-white/10 shadow-inner">
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
                      <div className="flex items-center justify-center px-2 py-1">
                        {isComplete ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200 }}
                            className="flex items-center gap-2 text-green-400 bg-green-500/10 px-3 py-2 rounded-full border border-green-500/30"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-xs font-medium">Video Ready</span>
                          </motion.div>
                        ) : (
                          <div className="flex items-center gap-3 bg-blue-500/10 px-3 py-2 rounded-full border border-blue-500/30">
                            <div className="flex items-center gap-1">
                              {[1,2,3].map((i) => (
                                <motion.div
                                  key={i}
                                  className="w-1.5 h-1.5 bg-blue-400 rounded-full"
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
                            <span className="text-xs text-blue-300 font-medium">Generating</span>
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
