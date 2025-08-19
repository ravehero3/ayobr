import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import userIcon from '../assets/user_1754478889614.png';

const UserProfile = ({ isOpen, onClose }) => {
  const { userProfileImage, setUserProfileImage } = useAppStore();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [username, setUsername] = useState('Producer');
  const [email, setEmail] = useState('');

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB.');
      return;
    }

    setIsUploading(true);

    try {
      // Convert file to base64 for storage
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target.result;
        setUserProfileImage(imageData);
        setIsUploading(false);
      };
      reader.onerror = () => {
        alert('Error reading file. Please try again.');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error processing image. Please try again.');
      setIsUploading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[999999] flex items-center justify-center p-6"
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(20px) saturate(110%) brightness(80%)',
            WebkitBackdropFilter: 'blur(20px) saturate(110%) brightness(80%)',
            minHeight: '100vh',
            minWidth: '100vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={handleBackdropClick}
        >
          {/* User Profile Modal - Version 2 Glassmorphism */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative w-[420px] max-h-[80vh] rounded-3xl overflow-y-auto"
            style={{
              background: 'rgba(5, 5, 5, 0.5)',
              backdropFilter: 'blur(25px) saturate(120%) brightness(70%) contrast(125%)',
              WebkitBackdropFilter: 'blur(25px) saturate(120%) brightness(70%) contrast(125%)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: `
                0 8px 40px rgba(0, 0, 0, 0.8),
                0 0 0 1px rgba(255, 255, 255, 0.12),
                inset 0 1px 0 rgba(255, 255, 255, 0.08),
                inset 0 -1px 0 rgba(0, 0, 0, 0.4)
              `,
              padding: '40px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center text-white text-2xl rounded-lg transition-all duration-300 hover:bg-blue-500/10 hover:rotate-90"
            >
              ×
            </button>

            {/* Profile Picture Section */}
            <div className="text-center mb-8">
              <motion.button
                onClick={handleFileSelect}
                disabled={isUploading}
                className="relative w-32 h-32 rounded-full overflow-hidden mx-auto mb-4 group cursor-pointer transition-all duration-400"
                style={{
                  border: '3px solid rgba(59, 130, 246, 0.5)',
                  background: userProfileImage 
                    ? 'transparent' 
                    : 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(0, 0, 0, 0.9) 100%)',
                }}
                whileHover={{ 
                  scale: 1.05,
                  borderColor: 'rgba(59, 130, 246, 0.7)',
                  boxShadow: '0 0 30px rgba(59, 130, 246, 0.2)'
                }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Shine Effect */}
                <div 
                  className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-600 pointer-events-none"
                  style={{
                    background: 'linear-gradient(45deg, transparent, rgba(59, 130, 246, 0.1), transparent)',
                    transform: 'rotate(45deg) translateX(-100%) translateY(-100%)',
                    animation: 'shine 0.6s ease',
                  }}
                />

                {isUploading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full"
                    />
                  </div>
                ) : userProfileImage ? (
                  <img
                    src={userProfileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white text-5xl">
                    👤
                  </div>
                )}

                {/* Hover Overlay */}
                {userProfileImage && !isUploading && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="text-white text-center">
                      <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs">Change</span>
                    </div>
                  </div>
                )}
              </motion.button>
            </div>

            {/* User Information Form */}
            <div className="space-y-6">
              {/* Username Input */}
              <div className="space-y-2">
                <label className="block text-white text-sm font-medium uppercase tracking-wider">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full px-4 py-4 rounded-xl text-white text-base transition-all duration-300 focus:outline-none focus:border-blue-400/60 focus:shadow-lg focus:shadow-blue-500/10"
                  style={{
                    background: 'rgba(0, 0, 0, 0.85)',
                    border: '1px solid rgba(59, 130, 246, 0.35)',
                    backdropFilter: 'blur(10px)',
                  }}
                />
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <label className="block text-white text-sm font-medium uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-4 rounded-xl text-white text-base transition-all duration-300 focus:outline-none focus:border-blue-400/60 focus:shadow-lg focus:shadow-blue-500/10"
                  style={{
                    background: 'rgba(0, 0, 0, 0.85)',
                    border: '1px solid rgba(59, 130, 246, 0.35)',
                    backdropFilter: 'blur(10px)',
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center mt-8">
              <motion.button
                onClick={() => {
                  // Save functionality would go here
                  onClose();
                }}
                className="relative px-6 py-3 rounded-xl text-white text-sm font-semibold overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(145deg, #0a0a0a 0%, #000000 100%)',
                  boxShadow: `
                    inset 0 1px 0 rgba(59, 130, 246, 0.1),
                    0 4px 15px rgba(0, 0, 0, 0.5)
                  `,
                }}
                whileHover={{
                  boxShadow: `
                    inset 0 1px 0 rgba(59, 130, 246, 0.2),
                    0 8px 25px rgba(0, 0, 0, 0.6)
                  `
                }}
                whileTap={{ scale: 0.98 }}
              >
                <div 
                  className="absolute inset-0 rounded-xl opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.4) 0%, transparent 30%, transparent 70%, rgba(135, 206, 250, 0.4) 100%)',
                    padding: '1px',
                  }}
                />
                <div 
                  className="absolute top-0 left-0 right-0 h-1/2 rounded-t-xl opacity-20"
                  style={{
                    background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)',
                  }}
                />
                <span className="relative z-10">Save Profile</span>
              </motion.button>

              {/* Remove Picture Button */}
              {userProfileImage && (
                <motion.button
                  onClick={() => setUserProfileImage(null)}
                  className="px-6 py-3 rounded-xl text-red-400 text-sm font-semibold border border-red-500/30 hover:border-red-400/50 hover:bg-red-500/10 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Remove Picture
                </motion.button>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </motion.div>

          {/* Add CSS for shine animation */}
          <style jsx>{`
            @keyframes shine {
              0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
              100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UserProfile;