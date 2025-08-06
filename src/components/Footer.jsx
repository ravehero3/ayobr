
import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';

const Footer = () => {
  const { pairs, generatedVideos, isGenerating } = useAppStore();
  const completePairs = pairs.filter(pair => pair.audio && pair.image);
  const hasFiles = pairs.some(pair => pair.audio || pair.image);

  // Don't render footer if no files are present
  if (!hasFiles) {
    return null;
  }

  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed bottom-0 left-0 right-0 z-50 h-16"
    >
      <div
        className="w-full h-full flex items-center justify-between px-8"
        style={{
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderBottom: 'none',
          borderLeft: 'none',
          borderRight: 'none',
        }}
      >
        {/* Left side - Back Arrow */}
        <div className="flex items-center">
          <button
            onClick={() => {
              // Handle going back to previous step
              const { clearAllPairs, setCurrentPage } = useAppStore.getState();
              if (generatedVideos.length > 0) {
                // From download page, go back to file management
                setCurrentPage('fileManagement');
              } else if (completePairs.length > 0) {
                // From file management with complete pairs, go back to upload
                clearAllPairs();
                setCurrentPage('upload');
              } else if (hasFiles) {
                // From file management with files, go back to upload
                clearAllPairs();
                setCurrentPage('upload');
              }
            }}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors duration-200 group"
          >
            <svg 
              className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors duration-200" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm text-gray-300 group-hover:text-blue-300 transition-colors duration-200">
              Back
            </span>
          </button>
        </div>

        {/* Center - Processing status */}
        {isGenerating && (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
            <span className="text-sm text-blue-300 font-medium">Processing...</span>
          </div>
        )}

        {/* Right side - Stats */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm text-gray-300">
              {completePairs.length} Ready
            </span>
          </div>
          {generatedVideos.length > 0 && (
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-green-300 font-medium">
                {generatedVideos.length} Generated
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
