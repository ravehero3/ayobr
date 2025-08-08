
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';

const SettingsPanel = ({ isOpen, onClose }) => {
  const { 
    concurrencySettings, 
    setConcurrencySettings,
    videoSettings,
    setVideoBackground,
    setCustomBackground,
    setVideoQuality
  } = useAppStore();

  const [selectedBackground, setSelectedBackground] = useState(videoSettings.background || 'black');
  const [selectedResolution, setSelectedResolution] = useState(videoSettings.quality || 'fullhd');
  const [logoFile, setLogoFile] = useState(null);

  const handleBackgroundChange = (background) => {
    setSelectedBackground(background);
  };

  const handleResolutionChange = (resolution) => {
    setSelectedResolution(resolution);
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setLogoFile(file);
      // You can add logo handling logic here
    }
  };

  const handleSave = () => {
    setVideoBackground(selectedBackground);
    setVideoQuality(selectedResolution);
    if (logoFile) {
      // Handle logo file if needed
      console.log('Logo file:', logoFile);
    }
    onClose();
  };

  const handleCancel = () => {
    // Reset selections to current values
    setSelectedBackground(videoSettings.background || 'black');
    setSelectedResolution(videoSettings.quality || 'fullhd');
    setLogoFile(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Invisible backdrop for closing */}
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background: 'transparent'
            }}
            onClick={onClose}
          />

          {/* Settings Window */}
          <motion.div
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{
              width: '480px',
              height: '640px',
              background: 'rgba(8, 8, 12, 0.85)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              border: '2px solid rgba(255, 255, 255, 0.08)',
              boxShadow: `
                0 32px 64px rgba(0, 0, 0, 0.6),
                0 8px 16px rgba(0, 0, 0, 0.4),
                inset 0 1px 0 rgba(255, 255, 255, 0.05)
              `,
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}
          >
            {/* Title */}
            <h2 
              className="text-center mb-2"
              style={{
                color: '#e0e0e0',
                fontSize: '20px',
                fontWeight: '600'
              }}
            >
              Settings
            </h2>

            {/* Logo Upload Area */}
            <motion.div
              className="cursor-pointer relative overflow-hidden"
              style={{
                height: '120px',
                background: 'rgba(15, 15, 25, 0.6)',
                border: '2px dashed rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
              }}
              whileHover={{
                borderColor: 'rgba(59, 130, 246, 0.4)',
                background: 'rgba(59, 130, 246, 0.05)'
              }}
              onClick={() => document.getElementById('logoUpload').click()}
            >
              <div style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '16px',
                fontWeight: '500'
              }}>
                {logoFile ? logoFile.name : 'Your Logo'}
              </div>
              <input
                type="file"
                id="logoUpload"
                accept="image/*"
                onChange={handleLogoUpload}
                style={{ display: 'none' }}
              />
            </motion.div>

            {/* Background Selection */}
            <div>
              <div style={{
                color: '#e0e0e0',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '12px',
                opacity: '0.9'
              }}>
                Background
              </div>
              <div style={{
                display: 'flex',
                gap: '16px',
                justifyContent: 'space-between'
              }}>
                {/* White Background */}
                <motion.div
                  className="cursor-pointer relative overflow-hidden"
                  style={{
                    flex: '1',
                    height: '80px',
                    borderRadius: '12px',
                    border: selectedBackground === 'white' 
                      ? '2px solid rgba(59, 130, 246, 0.8)' 
                      : '2px solid rgba(255, 255, 255, 0.1)',
                    background: 'linear-gradient(135deg, #ffffff, #f8f8f8)',
                    boxShadow: selectedBackground === 'white' 
                      ? '0 0 20px rgba(59, 130, 246, 0.3), inset 0 0 20px rgba(59, 130, 246, 0.1)'
                      : 'none',
                    transition: 'all 0.3s ease'
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleBackgroundChange('white')}
                />

                {/* Black Background */}
                <motion.div
                  className="cursor-pointer relative overflow-hidden"
                  style={{
                    flex: '1',
                    height: '80px',
                    borderRadius: '12px',
                    border: selectedBackground === 'black' 
                      ? '2px solid rgba(59, 130, 246, 0.8)' 
                      : '2px solid rgba(255, 255, 255, 0.1)',
                    background: 'linear-gradient(135deg, #1a1a1a, #000000)',
                    boxShadow: selectedBackground === 'black' 
                      ? '0 0 20px rgba(59, 130, 246, 0.3), inset 0 0 20px rgba(59, 130, 246, 0.1)'
                      : 'none',
                    transition: 'all 0.3s ease'
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleBackgroundChange('black')}
                />

                {/* Custom Background */}
                <motion.div
                  className="cursor-pointer relative overflow-hidden"
                  style={{
                    flex: '1',
                    height: '80px',
                    borderRadius: '12px',
                    border: selectedBackground === 'custom' 
                      ? '2px solid rgba(59, 130, 246, 0.8)' 
                      : '2px solid rgba(255, 255, 255, 0.1)',
                    background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4), rgba(17, 24, 39, 0.6))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: selectedBackground === 'custom' 
                      ? '0 0 20px rgba(59, 130, 246, 0.3), inset 0 0 20px rgba(59, 130, 246, 0.1)'
                      : 'none',
                    transition: 'all 0.3s ease'
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleBackgroundChange('custom')}
                >
                  <div style={{
                    color: '#e0e0e0',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    Custom
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Resolution Selection */}
            <div>
              <div style={{
                color: '#e0e0e0',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '12px',
                opacity: '0.9'
              }}>
                Resolution
              </div>
              <div style={{
                display: 'flex',
                gap: '16px'
              }}>
                {/* Full HD */}
                <motion.div
                  className="cursor-pointer text-center"
                  style={{
                    flex: '1',
                    padding: '20px',
                    background: selectedResolution === 'fullhd' 
                      ? 'rgba(59, 130, 246, 0.05)' 
                      : 'rgba(15, 15, 25, 0.6)',
                    border: selectedResolution === 'fullhd' 
                      ? '2px solid rgba(59, 130, 246, 0.8)' 
                      : '2px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    boxShadow: selectedResolution === 'fullhd' 
                      ? '0 0 20px rgba(59, 130, 246, 0.2), inset 0 0 10px rgba(59, 130, 246, 0.1)'
                      : 'none',
                    transition: 'all 0.3s ease'
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleResolutionChange('fullhd')}
                >
                  <div style={{
                    width: '60px',
                    height: '32px',
                    margin: '0 auto 8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '10px',
                    borderRadius: '4px',
                    background: 'linear-gradient(135deg, #1e40af, #1e3a8a)',
                    color: 'white',
                    position: 'relative'
                  }}>
                    <div style={{ position: 'absolute', top: '4px', fontSize: '8px', fontWeight: '600' }}>
                      FULL HD
                    </div>
                    <div style={{ position: 'absolute', bottom: '4px', fontSize: '10px', fontWeight: '700' }}>
                      1080p
                    </div>
                  </div>
                  <div style={{
                    color: '#e0e0e0',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '4px'
                  }}>
                    Full HD
                  </div>
                  <div style={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '12px'
                  }}>
                    1920×1080
                  </div>
                </motion.div>

                {/* 4K Ultra HD */}
                <motion.div
                  className="cursor-pointer text-center"
                  style={{
                    flex: '1',
                    padding: '20px',
                    background: selectedResolution === '4k' 
                      ? 'rgba(59, 130, 246, 0.05)' 
                      : 'rgba(15, 15, 25, 0.6)',
                    border: selectedResolution === '4k' 
                      ? '2px solid rgba(59, 130, 246, 0.8)' 
                      : '2px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    boxShadow: selectedResolution === '4k' 
                      ? '0 0 20px rgba(59, 130, 246, 0.2), inset 0 0 10px rgba(59, 130, 246, 0.1)'
                      : 'none',
                    transition: 'all 0.3s ease'
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleResolutionChange('4k')}
                >
                  <div style={{
                    width: '60px',
                    height: '32px',
                    margin: '0 auto 8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    borderRadius: '4px',
                    background: 'linear-gradient(135deg, #1e40af, #111827)',
                    color: 'white',
                    position: 'relative'
                  }}>
                    <div style={{ position: 'absolute', fontSize: '16px', fontWeight: '900', top: '2px' }}>
                      4K
                    </div>
                    <div style={{ 
                      position: 'absolute', 
                      bottom: '2px', 
                      fontSize: '6px', 
                      fontWeight: '500',
                      letterSpacing: '0.5px'
                    }}>
                      ULTRA HD
                    </div>
                  </div>
                  <div style={{
                    color: '#e0e0e0',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '4px'
                  }}>
                    4K Ultra HD
                  </div>
                  <div style={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '12px'
                  }}>
                    3840×2160
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '16px',
              marginTop: 'auto',
              paddingTop: '24px'
            }}>
              <motion.button
                className="cursor-pointer"
                style={{
                  flex: '1',
                  padding: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  background: 'rgba(15, 15, 25, 0.8)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  transition: 'all 0.3s ease'
                }}
                whileHover={{
                  background: 'rgba(25, 25, 35, 0.9)',
                  borderColor: 'rgba(255, 255, 255, 0.25)',
                  color: '#ffffff'
                }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCancel}
              >
                Cancel
              </motion.button>

              <motion.button
                className="cursor-pointer"
                style={{
                  flex: '1',
                  padding: '16px',
                  border: '2px solid rgba(59, 130, 246, 0.5)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.9))',
                  color: '#ffffff',
                  transition: 'all 0.3s ease'
                }}
                whileHover={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 1), rgba(37, 99, 235, 1))',
                  boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)',
                  y: -1
                }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
              >
                Save
              </motion.button>
            </div>
          </motion.div>

          {/* CSS Animation Keyframes */}
          <style jsx>{`
            @keyframes gradientShift {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );
};

export default SettingsPanel;
