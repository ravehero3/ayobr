import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import SettingsPanel from './SettingsPanel';

const Footer = ({ onGenerateVideos }) => {
  const { pairs, generatedVideos, isGenerating, videoGenerationStates } = useAppStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const completePairs = pairs.filter(pair => pair.audio && pair.image);
  const hasFiles = pairs.some(pair => pair.audio || pair.image);

  // Calculate completion count during generation
  const completedVideosCount = Object.values(videoGenerationStates || {}).filter(state => state.isComplete).length;

  // Don't render footer if no files are present
  if (!hasFiles) {
    return null;
  }

  // Define a placeholder function for handleGoBack
  const handleGoBack = () => {
    // This function would contain the logic from the original button click handler
    const { clearAllPairs, setCurrentPage } = useAppStore.getState();
    if (generatedVideos.length > 0) {
      setCurrentPage('fileManagement');
    } else if (completePairs.length > 0) {
      clearAllPairs();
      setCurrentPage('upload');
    } else if (hasFiles) {
      clearAllPairs();
      setCurrentPage('upload');
    }
  };

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
        <div className="flex items-center" style={{ marginLeft: 'calc((100vw - 500px) / 2 - 292px)' }}>
          <button
            onClick={() => {
              // Handle going back to previous step with proper state cleanup
              const { clearAllPairs, setCurrentPage, setIsGenerating, clearAllVideoGenerationStates } = useAppStore.getState();
              
              // First, stop any ongoing generation and clear video states
              setIsGenerating(false);
              clearAllVideoGenerationStates();
              
              if (generatedVideos.length > 0) {
                // From download page, go back to file management
                setCurrentPage('fileManagement');
              } else if (completePairs.length > 0 || hasFiles) {
                // From generation page or file management, go back to upload and clear everything
                clearAllPairs();
                setCurrentPage('upload');
              } else {
                // Fallback: ensure we go to upload page
                clearAllPairs();
                setCurrentPage('upload');
              }
            }}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors duration-200 group"
          >
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm text-gray-300 group-hover:text-white transition-colors duration-200">
              Back
            </span>
          </button>
        </div>

        {/* Center - Ready Status or Progress */}
        <div className="flex items-center justify-center absolute left-1/2 transform -translate-x-1/2" style={{ marginLeft: '-70px', marginTop: '-2px' }}>
          {isGenerating ? (
            <div className="flex flex-col items-center space-y-1">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
                <span className="text-sm text-blue-300 font-medium">
                  {completedVideosCount} of {completePairs.length} completed
                </span>
              </div>
              <div className="w-48 bg-gray-700 rounded-full h-1">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-1 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.floor((completedVideosCount / completePairs.length) * 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm text-gray-300">
                {completePairs.length} Ready
              </span>
            </div>
          )}
        </div>

        {/* Generate Videos Button or Download All Videos Button - centered with footer */}
        <div className="absolute" style={{ left: 'calc(50% + 92px + 8px - 100px + 27px)', top: 'calc(50% + 1px)', transform: 'translateY(-50%)' }}>
          {generatedVideos.length === 0 && !isGenerating && (
            <button
              onClick={onGenerateVideos}
              disabled={isGenerating || completePairs.length === 0}
              className="generate-btn-subtle-particles"
            >
              Generate Videos
              <div className="particle-system">
                <div className="particle particle-1"></div>
                <div className="particle particle-2"></div>
                <div className="particle particle-3"></div>
                <div className="particle particle-4"></div>
                <div className="particle particle-5"></div>
                <div className="particle particle-6"></div>
                <div className="particle particle-7"></div>
              </div>
            </button>
          )}

          {/* Download All Videos Button - matching Generate Videos styling */}
          {generatedVideos.length > 0 && (
            <button
              onClick={() => {
                generatedVideos.forEach(video => {
                  const link = document.createElement('a');
                  link.href = video.url;
                  link.download = video.filename;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                });
              }}
              className="generate-btn-subtle-particles"
            >
              Download All Videos
              <div className="particle-system">
                <div className="particle particle-1"></div>
                <div className="particle particle-2"></div>
                <div className="particle particle-3"></div>
                <div className="particle particle-4"></div>
                <div className="particle particle-5"></div>
                <div className="particle particle-6"></div>
                <div className="particle particle-7"></div>
              </div>
            </button>
          )}
        </div>

        {/* Right side - Settings Button */}
        <div className="flex items-center" style={{ marginRight: 'calc((100vw - 500px) / 2 - 234px)' }}> {/* Moved 20px to the right (from -254px to -234px) */}
          <motion.button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center justify-center p-2 transition-all duration-300 hover:scale-105 flex-shrink-0"
            whileHover={{ 
              scale: 1.05,
              rotate: 360
            }}
            whileTap={{ scale: 0.95 }}
            transition={{
              rotate: { duration: 2, ease: "linear" }
            }}
          >
            <svg className="w-6 h-6 text-gray-400 hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </motion.button>
        </div>
      </div>

      {/* Settings Panel */}
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </motion.footer>
  );
};

export default Footer;