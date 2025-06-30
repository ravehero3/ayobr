
import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';

const BatchStatusIndicator = ({ totalPairs, completedPairs }) => {
  const { isGenerating, generatedVideos } = useAppStore();
  
  const progress = totalPairs > 0 ? (completedPairs / totalPairs) * 100 : 0;
  const remainingPairs = totalPairs - completedPairs;

  if (!isGenerating && totalPairs === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-space-navy/80 backdrop-blur-sm border border-neon-blue/30 rounded-xl p-4 mb-6"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-neon-cyan rounded-full animate-pulse"></div>
          <h3 className="text-white font-semibold">
            Batch Processing: {completedPairs}/{totalPairs} videos
          </h3>
        </div>
        <div className="text-sm text-gray-400">
          {remainingPairs > 0 && `${remainingPairs} remaining`}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
        <motion.div
          className="bg-gradient-to-r from-neon-blue to-neon-cyan h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-400">
        <span>{Math.round(progress)}% complete</span>
        <span>
          {isGenerating ? 'Processing...' : 'Complete'}
        </span>
      </div>

      {/* Performance metrics */}
      {totalPairs > 20 && (
        <div className="mt-3 pt-3 border-t border-gray-600">
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="text-center">
              <div className="text-neon-blue font-semibold">{generatedVideos.length}</div>
              <div className="text-gray-400">Generated</div>
            </div>
            <div className="text-center">
              <div className="text-neon-cyan font-semibold">{Math.round(progress)}%</div>
              <div className="text-gray-400">Progress</div>
            </div>
            <div className="text-center">
              <div className="text-green-400 font-semibold">
                {totalPairs > 50 ? 'Large' : 'Medium'}
              </div>
              <div className="text-gray-400">Batch Size</div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default BatchStatusIndicator;
