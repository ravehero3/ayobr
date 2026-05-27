import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { useFFmpeg } from '../hooks/useFFmpeg';
import typebeatLogo from '../assets/typebeatz logo 2 white version_1754509091303.png';
import userIcon from '../assets/user_1754478889614.png';
import UserProfile from './UserProfile';
import AppInfoWindow from './AppInfoWindow';

const NM = "'Neue Montreal', 'Inter', sans-serif";

const Header = () => {
  const { generatedVideos, pairs, userProfileImage, username, isGenerating, resetGenerationState } = useAppStore();
  const { stopGeneration, resetAppForNewGeneration } = useFFmpeg();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAppInfoOpen, setIsAppInfoOpen] = useState(false);
  const hasFiles = pairs.some(pair => pair.audio || pair.image);

  const handleResetApp = () => {
    stopGeneration();
    resetAppForNewGeneration();
    resetGenerationState();
  };

  // Don't render header if no files are present
  if (!hasFiles) {
    return null;
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0 }}
      className="fixed top-0 left-0 right-0 h-16"
      style={{ zIndex: 10000 }}
    >
      <div
        className="w-full h-full flex items-center justify-between px-4 md:px-[64px]"
        style={{
          background: 'rgba(0, 0, 0, 0.38)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          fontFamily: NM
        }}
      >
        {/* TypeBeatz Logo */}
        <div className="flex items-center">
          <button
            onClick={() => setIsAppInfoOpen(true)}
            className="hover:scale-105 transition-all duration-200"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            <img
              src={typebeatLogo}
              alt="TypeBeatz"
              className="object-contain opacity-90 hover:opacity-100 transition-opacity duration-200 h-5"
            />
          </button>
        </div>

        {/* Producer name — absolutely centered in the header */}
        <div className="absolute left-0 right-0 flex justify-center pointer-events-none" style={{ zIndex: 1 }}>
          <span className="text-white text-sm font-semibold opacity-90 tracking-wide" style={{ fontFamily: NM }}>
            {username}
          </span>
        </div>

        {/* Right side: Profile */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsProfileOpen(true)}
            className="w-8 h-8 rounded-full overflow-hidden border border-white/20 hover:border-white/50 transition-all duration-300 hover:scale-105"
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