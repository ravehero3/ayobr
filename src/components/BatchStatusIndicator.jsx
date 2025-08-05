import React from 'react';
import { motion } from 'framer-motion';

const BatchStatusIndicator = ({ totalPairs, completedPairs, isProcessing = false }) => {
  const progress = totalPairs > 0 ? Math.floor((completedPairs / totalPairs) * 100) : 0;
  const remaining = totalPairs - completedPairs;

  // Don't show for small batches
  if (totalPairs < 5) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full mb-6"
    >
      <div className="bg-gradient-to-r from-space-navy/80 to-space-dark/80 backdrop-blur-lg rounded-2xl p-6 border border-neon-cyan/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-blue-400/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              {isProcessing && (
                <div className="absolute inset-0 rounded-full border-2 border-neon-cyan/50 animate-spin border-t-transparent"></div>
              )}
            </div>
            <div>
              <h3 className="text-white text-lg font-semibold">
                Batch Processing Status
              </h3>
              <p className="text-gray-400 text-sm">
                Processing {totalPairs} video pairs {totalPairs >= 20 ? '• Large batch mode' : ''}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-neon-cyan">
              {progress}%
            </div>
            <div className="text-xs text-gray-400">
              {completedPairs}/{totalPairs} complete
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div className="w-full bg-gray-800/50 rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full relative"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {/* Animated shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
            </motion.div>
          </div>
          
          {/* Progress markers for large batches */}
          {totalPairs >= 20 && (
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          )}
        </div>

        {/* Status Details */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/30 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-white">{completedPairs}</div>
            <div className="text-xs text-gray-400">Completed</div>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-yellow-400">{remaining}</div>
            <div className="text-xs text-gray-400">Remaining</div>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-neon-cyan">
              {totalPairs <= 5 ? '4' : totalPairs <= 20 ? '6' : totalPairs <= 50 ? '8' : totalPairs <= 75 ? '10' : '12'}
            </div>
            <div className="text-xs text-gray-400">Concurrent</div>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-green-400">
              {totalPairs >= 100 ? 'Maximum' : totalPairs >= 50 ? 'High' : totalPairs >= 20 ? 'Medium' : 'Standard'}
            </div>
            <div className="text-xs text-gray-400">Batch Size</div>
          </div>
        </div>

        {/* Large batch optimization notice */}
        {totalPairs >= 20 && (
          <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm">
                <div className="text-blue-400 font-medium">
                  Large Batch Optimizations Active
                </div>
                <div className="text-gray-400">
                  Enhanced concurrency, memory management, and progress tracking for {totalPairs} files
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ETA for very large batches */}
        {totalPairs >= 50 && isProcessing && completedPairs > 0 && (
          <div className="mt-4 text-center">
            <div className="text-sm text-gray-400">
              Estimated completion time based on current processing speed
            </div>
            <div className="text-lg font-semibold text-neon-cyan">
              {(() => {
                const avgTimePerVideo = 90; // seconds (estimated)
                const remainingTime = remaining * avgTimePerVideo;
                const minutes = Math.floor(remainingTime / 60);
                const seconds = remainingTime % 60;
                return `~${minutes}m ${seconds}s`;
              })()}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default BatchStatusIndicator;