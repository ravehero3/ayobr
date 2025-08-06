
import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';

const Header = () => {
  const { generatedVideos, pairs } = useAppStore();
  const hasFiles = pairs.some(pair => pair.audio || pair.image);

  // Don't render header if no files are present
  if (!hasFiles) {
    return null;
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 h-16"
    >
      <div
        className="w-full h-full flex items-center justify-between px-6"
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
        {/* TypeBeatz Logo */}
        <div className="flex items-center">
          <img 
            src="./attached_assets/typebeatz logo 1_1754478881987.png" 
            alt="TypeBeatz"
            className="h-8 object-contain"
          />
        </div>

        {/* Status Indicator - Center */}
        <div className="flex items-center space-x-4">
          {generatedVideos.length > 0 && (
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-xs text-green-300 font-medium">
                {generatedVideos.length} Video{generatedVideos.length !== 1 ? 's' : ''} Ready
              </span>
            </div>
          )}
          {hasFiles && generatedVideos.length === 0 && (
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30">
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              <span className="text-xs text-blue-300 font-medium">
                {pairs.filter(pair => pair.audio && pair.image).length} Pair{pairs.filter(pair => pair.audio && pair.image).length !== 1 ? 's' : ''} Ready
              </span>
            </div>
          )}
        </div>

        {/* Profile Icon */}
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
            <img 
              src="./attached_assets/user_1754478889614.png" 
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
