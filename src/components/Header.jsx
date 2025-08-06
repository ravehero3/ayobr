
import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';

const Header = () => {
  const { generatedVideos, pairs } = useAppStore();
  const hasFiles = pairs.some(pair => pair.audio || pair.image);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 h-20"
    >
      <div
        className="w-full h-full flex items-center justify-between px-8"
        style={{
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
        }}
      >
        {/* Logo/Brand */}
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white">Video Generator</h1>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center space-x-4">
          {generatedVideos.length > 0 && (
            <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-sm text-green-300 font-medium">
                {generatedVideos.length} Video{generatedVideos.length !== 1 ? 's' : ''} Ready
              </span>
            </div>
          )}
          {hasFiles && generatedVideos.length === 0 && (
            <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30">
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              <span className="text-sm text-blue-300 font-medium">
                {pairs.filter(pair => pair.audio && pair.image).length} Pair{pairs.filter(pair => pair.audio && pair.image).length !== 1 ? 's' : ''} Ready
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
