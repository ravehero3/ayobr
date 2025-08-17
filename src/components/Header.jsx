import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import typebeatLogo from '../assets/typebeatz logo 2 white version_1754509091303.png';
import userIcon from '../assets/user_1754478889614.png';
import UserProfile from './UserProfile';
import AppInfoWindow from './AppInfoWindow';

const Header = () => {
  const { generatedVideos, pairs, userProfileImage, isGenerating } = useAppStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAppInfoOpen, setIsAppInfoOpen] = useState(false);
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
          borderBottom: '1px solid rgba(64, 64, 64, 0.8)',
          paddingLeft: 'calc((100vw - 500px) / 2 - 247px)', // Restore original logo position
          paddingRight: '0px', // No right padding needed
        }}
      >
        {/* TypeBeatz Logo - Clickable */}
        <div className="flex items-center">
          <button
            onClick={() => setIsAppInfoOpen(true)}
            className="hover:scale-105 transition-all duration-200"
          >
            <img
              src={typebeatLogo}
              alt="TypeBeatz"
              className="object-contain opacity-90 hover:opacity-100 transition-opacity duration-200"
              style={{
                height: '20px' // Much smaller logo
              }}
            />
          </button>
        </div>

        {/* Status Indicator - Center (hide during generation) */}
        <div className="flex items-center space-x-4" style={{ marginLeft: '-30px' }}>
          {generatedVideos.length > 0 && !isGenerating && (
            <div className="flex items-center space-x-2 px-5 py-1.5 rounded-full bg-green-500/20 border border-green-500/30">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-xs text-green-300 font-medium">
                {generatedVideos.length} Video{generatedVideos.length !== 1 ? 's' : ''} Ready
              </span>
            </div>
          )}
        </div>

        {/* Profile Icon - Fixed relative to logo position */}
        <div className="absolute top-1/2 transform -translate-y-1/2 flex items-center" style={{ left: 'calc((100vw - 500px) / 2 + 715px)' }}>
          <button
            onClick={() => setIsProfileOpen(true)}
            className="w-8 h-8 rounded-full overflow-hidden border border-white/20 hover:border-blue-400/50 transition-all duration-300 hover:scale-105"
          >
            <img
              src={userProfileImage || userIcon}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </button>
        </div>

        {/* Settings Icon - Fixed relative to logo position */}
        <div className="absolute top-1/2 transform -translate-y-1/2 flex items-center" style={{ left: 'calc((100vw - 500px) / 2 + 772px)' }}>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300 settings-icon"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* User Profile Modal */}
        <UserProfile
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
        />

        {/* App Info Window */}
        <AppInfoWindow
          isOpen={isAppInfoOpen}
          onClose={() => setIsAppInfoOpen(false)}
        />
      </div>
    </motion.header>
  );
};

export default Header;