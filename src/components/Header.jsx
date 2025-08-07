
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import typebeatLogo from '../assets/typebeatz logo 2 white version_1754509091303.png';
import userIcon from '../assets/user_1754478889614.png';
import UserProfile from './UserProfile';

const Header = () => {
  const { generatedVideos, pairs, userProfileImage } = useAppStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const hasFiles = pairs.some(pair => pair.audio || pair.image);

  // Don't render header if no files are present
  if (!hasFiles) {
    return null;
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0 }}
      className="fixed top-0 left-0 right-0 z-50 h-16"
    >
      <div
        className="w-full h-full flex items-center justify-between"
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 0 0 1px rgba(128, 128, 128, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.15)',
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          paddingLeft: 'calc((100vw - 500px) / 2 - 271px)', // Move logo 5px to the left (from -266px to -271px)
          paddingRight: 'calc((100vw - 500px) / 2 - 260px)', // Move profile icon 20px to the right (from -280px to -260px)
        }}
      >
        {/* TypeBeatz Logo */}
        <div className="flex items-center">
          <img 
            src={typebeatLogo}
            alt="TypeBeatz"
            className="object-contain opacity-90 hover:opacity-100 transition-opacity duration-200"
            style={{ 
              height: '20px' // Much smaller logo
            }}
          />
        </div>

        {/* Status Indicator - Center (only show videos ready, removed pair counter) */}
        <div className="flex items-center space-x-4">
          {generatedVideos.length > 0 && (
            <div className="flex items-center space-x-2 px-5 py-1.5 rounded-full bg-green-500/20 border border-green-500/30">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-xs text-green-300 font-medium">
                {generatedVideos.length} Video{generatedVideos.length !== 1 ? 's' : ''} Ready
              </span>
            </div>
          )}
        </div>

        {/* Profile Icon - Moved 350px to the right */}
        <div className="flex items-center">
          <button
            onClick={() => setIsProfileOpen(true)}
            className="w-8 h-8 rounded-full overflow-hidden border border-white/20 hover:border-blue-400/50 transition-all duration-300 hover:scale-105"
            style={{ marginRight: '0px' }} // Profile icon positioned via paddingRight
          >
            <img 
              src={userProfileImage || userIcon}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </button>
        </div>
        
        {/* User Profile Modal */}
        <UserProfile 
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
        />
      </div>
    </motion.header>
  );
};

export default Header;
