import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { useLanguage } from '../context/LanguageContext';
import { useAnimation } from '../context/AnimationContext';
import SettingsPanel from './SettingsPanel';
import ViewOptionsModal from './ViewOptionsModal';

const Footer = ({ onGenerateVideos, onStop }) => {
  const { pairs, generatedVideos, isGenerating, videoGenerationStates, popPage, resetApp, spacingSliderVisible, setSpacingSliderVisible } = useAppStore();
  const { t } = useLanguage();
  const { isAnimEnabled } = useAnimation();
  const blurEnabled = isAnimEnabled('backdrop_blur');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isViewOptionsOpen, setIsViewOptionsOpen] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const completePairs = pairs.filter(pair => pair.audio && pair.image);
  const hasFiles = pairs.some(pair => pair.audio || pair.image);

  // Page detection: Page 3 = generating or has generated videos
  const isOnPage3 = isGenerating || generatedVideos.length > 0;

  // Helper function to get the video generation state for a given pair ID
  const getVideoGenerationState = (pairId) => {
    return videoGenerationStates[pairId];
  };

  // Calculate completion count during generation
  // Count videos that have reached 100% progress OR have been generated
  const completedVideosCount = pairs.filter(pair => {
    const videoState = getVideoGenerationState(pair.id);
    const hasGeneratedVideo = generatedVideos.some(v => v.pairId === pair.id);
    return hasGeneratedVideo || (videoState && videoState.progress >= 100);
  }).length;

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
      style={{ zIndex: 99999 }}
    >
      <div
        className="w-full h-full flex items-center justify-between px-4 md:px-[64px]"
        style={{
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: blurEnabled ? 'blur(16px)' : 'none',
          WebkitBackdropFilter: blurEnabled ? 'blur(16px)' : 'none',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Left side - Back Arrow and Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={async () => {
              const { clearAllPairs, setCurrentPage, setIsGenerating, clearAllVideoGenerationStates, clearGeneratedVideos, resetGenerationState, cancelGeneration } = useAppStore.getState();

              if (isGenerating) {
                cancelGeneration();
                const { forceStopAllProcesses } = await import('../utils/ffmpegProcessor');
                await forceStopAllProcesses();
                resetGenerationState();
                clearAllVideoGenerationStates();
                clearGeneratedVideos();
                setCurrentPage('fileManagement');
              } else {
                setIsGenerating(false);
                clearAllVideoGenerationStates();
                if (generatedVideos.length > 0) {
                  clearGeneratedVideos();
                  setCurrentPage('fileManagement');
                } else {
                  clearAllPairs();
                  setCurrentPage('upload');
                }
              }
            }}
            className="flex items-center space-x-1 sm:space-x-2 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors duration-200 group"
          >
            <svg className="w-5 h-5 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="hidden xs:inline text-sm text-gray-300 group-hover:text-white">{t('app.back')}</span>
          </button>

          {/* Spacing slider toggle — fader icon, only on page 2 */}
          {!isOnPage3 && (
            <motion.button
              onClick={() => setSpacingSliderVisible(!spacingSliderVisible)}
              className="hidden md:flex p-2 rounded-lg hover:bg-white/5 transition-all"
              title="Spacing"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"
                stroke={spacingSliderVisible ? '#ffffff' : 'rgba(255,255,255,0.35)'}
                strokeWidth="1.8"
                style={{ transition: 'stroke 0.2s ease' }}
              >
                <line x1="4" y1="4" x2="4" y2="20"/>
                <line x1="12" y1="4" x2="12" y2="20"/>
                <line x1="20" y1="4" x2="20" y2="20"/>
                <rect x="1.5" y="7" width="5" height="3.5" rx="1"/>
                <rect x="9.5" y="13" width="5" height="3.5" rx="1"/>
                <rect x="17.5" y="5" width="5" height="3.5" rx="1"/>
              </svg>
            </motion.button>
          )}

          {/* View options button — moved to left, only on page 2 */}
          {!isOnPage3 && (
            <motion.button
              onClick={() => setIsViewOptionsOpen(v => !v)}
              className="hidden md:flex p-2 rounded-lg hover:bg-white/5 transition-all"
              title={t('view.title')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                style={{ color: isViewOptionsOpen ? '#ffffff' : 'rgba(255,255,255,0.35)', transition: 'color 0.2s' }}>
                <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="1.8"/>
                <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="1.8"/>
                <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="1.8"/>
                <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="1.8"/>
              </svg>
            </motion.button>
          )}
        </div>

        {/* Center - Status or Action Button */}
        <div className="flex-1 flex items-center justify-center">
          {isGenerating ? (
            <div className="flex flex-col items-center">
              <span className="text-xs text-white font-medium mb-1">
                {completedVideosCount} / {completePairs.length}
              </span>
              <div className="w-24 sm:w-48 bg-gray-700 rounded-full h-1">
                <div
                  className="bg-white h-1 rounded-full transition-all duration-300"
                  style={{ width: `${completePairs.length > 0 ? (completedVideosCount / completePairs.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          ) : generatedVideos.length === 0 ? (
            <button
              onClick={onGenerateVideos}
              disabled={isGenerating || completePairs.length === 0}
              className="generate-btn-subtle-particles scale-90 sm:scale-100"
            >
              {t('app.generateVideos')}
            </button>
          ) : (
            <button
              disabled={!!downloadProgress}
              onClick={async () => {
                if (downloadProgress) return;
                const isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS|Android/i.test(navigator.userAgent);

                if (isSafari) {
                  // Safari: sequential downloads — one at a time with a delay so Safari
                  // doesn't cancel previous downloads when a new one starts
                  for (let i = 0; i < generatedVideos.length; i++) {
                    setDownloadProgress({ current: i + 1, total: generatedVideos.length });
                    const video = generatedVideos[i];
                    try {
                      const response = await fetch(video.url);
                      const blob = await response.blob();
                      const freshUrl = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = freshUrl;
                      link.download = video.filename;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      await new Promise(resolve => setTimeout(resolve, 1500));
                      URL.revokeObjectURL(freshUrl);
                    } catch (err) {
                      console.error('Download error:', err);
                    }
                  }
                  setDownloadProgress(null);
                } else {
                  // Chrome / Firefox: instant simultaneous downloads work fine
                  generatedVideos.forEach(video => {
                    const link = document.createElement('a');
                    link.href = video.url;
                    link.download = video.filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  });
                }
              }}
              className="generate-btn-subtle-particles scale-90 sm:scale-100"
              style={downloadProgress ? { opacity: 0.75, cursor: 'default' } : {}}
            >
              {downloadProgress
                ? `${downloadProgress.current} / ${downloadProgress.total}`
                : t('app.downloadAll')}
            </button>
          )}
        </div>

        {/* Right side - Settings or Start Over */}
        <div className="flex items-center gap-1">
          {!isOnPage3 ? (
            <>
              {/* Video settings button */}
              <motion.button
                onClick={() => setIsSettingsOpen(true)}
                className="relative p-2 rounded-lg hover:bg-white/5 transition-all"
                whileHover={{ rotate: 90 }}
              >
                <svg className="w-6 h-6 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </motion.button>
            </>
          ) : (
            <button
              onClick={() => {
                if (onStop) onStop();
                resetApp();
              }}
              className="flex items-center space-x-1 sm:space-x-2 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors group"
            >
              <svg className="w-5 h-5 text-white group-hover:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="hidden xs:inline text-sm text-white group-hover:text-gray-200">{t('app.reset')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      {/* View Options Modal (page 2) */}
      <ViewOptionsModal isOpen={isViewOptionsOpen} onClose={() => setIsViewOptionsOpen(false)} />
    </motion.footer>
  );
};

export default Footer;