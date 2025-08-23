
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';

const DownloadPage = ({ onDownloadAll, onBackToFileManagement }) => {
  const { generatedVideos, pairs, videoSettings, removePair } = useAppStore();
  const [downloadingAll, setDownloadingAll] = useState(false);

  // Function to get video background style based on user settings
  const getVideoBackgroundStyle = () => {
    // Safely access videoSettings with fallback
    const currentStore = useAppStore.getState();
    const settings = currentStore.videoSettings || {};
    const background = settings.background || 'black';

    console.log('DownloadPage - Background settings:', { background, settings });

    if (background === 'white') {
      return { backgroundColor: 'white' };
    } else if (background === 'black') {
      return { backgroundColor: 'black' };
    } else if (background === 'custom' && settings.customBackground) {
      try {
        // Check if it's already a data URL (base64) or needs to be converted from File object
        const backgroundUrl = typeof settings.customBackground === 'string' 
          ? settings.customBackground 
          : URL.createObjectURL(settings.customBackground);

        return {
          backgroundImage: `url(${backgroundUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        };
      } catch (error) {
        console.warn('Error creating background URL:', error);
        return { backgroundColor: 'black' }; // fallback on error
      }
    }
    return { backgroundColor: 'black' }; // fallback
  };

  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    try {
      await onDownloadAll();
    } finally {
      setDownloadingAll(false);
    }
  };

  const handleDownloadSingle = async (video) => {
    try {
      const link = document.createElement('a');
      link.href = video.url;
      link.download = video.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading video:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex flex-col items-center justify-start bg-space-dark/90"
      style={{ zIndex: 999998, paddingTop: '72px', paddingBottom: '40px' }}
    >
      {/* Download Window - Same structure as LoadingWindow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-7xl mx-4 p-2 rounded-lg overflow-visible"
        style={{
          maxHeight: 'calc(100vh - 80px)',
          width: '100%',
          maxWidth: '112rem',
          background: 'transparent',
        }}
      >
        {/* Header - Same as LoadingWindow */}
        <div className="relative flex flex-col items-center justify-center header-no-blur" style={{ zIndex: 999999, paddingTop: '0px', paddingBottom: '24px', marginTop: '-58px' }}>
          <motion.h2
            className="text-3xl font-bold text-white mb-4 text-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)' }}
          >
            Your videos are ready!
          </motion.h2>
        </div>

        {/* Videos Grid - Same layout as LoadingWindow but with completed videos */}
        <div className="relative max-h-96 overflow-y-auto mb-8 px-4" style={{ marginTop: '20px', zIndex: 50 }}>
          <div 
            className="grid gap-6 w-full mx-auto"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, 240px)',
              justifyContent: 'center',
              justifyItems: 'center',
              maxWidth: 'calc(100vw - 160px)',
              padding: '0 80px',
              zIndex: 50,
              gap: '24px'
            }}
          >
            {pairs.filter(pair => generatedVideos.some(v => v.pairId === pair.id)).map((pair, index) => {
              const generatedVideo = generatedVideos.find(v => v.pairId === pair.id);

              return (
                <motion.div
                  key={pair.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="video-complete-container group"
                  style={{
                    position: 'relative',
                    width: '240px',
                    minWidth: '240px',
                    maxWidth: '240px',
                    height: '220px',
                    background: 'rgba(0, 0, 0, 0.41)',
                    borderRadius: '16px',
                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                    backdropFilter: 'blur(11.4px)',
                    WebkitBackdropFilter: 'blur(11.4px)',
                    border: '1px solid rgba(34, 197, 94, 0.6)', // Green border for completed
                    padding: '20px',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    overflow: 'visible',
                    zIndex: 60
                  }}
                  whileHover={{
                    backgroundColor: 'rgba(0, 0, 0, 0.51)',
                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1), 0 0 40px rgba(34, 197, 94, 0.3), 0 0 80px rgba(34, 197, 94, 0.2)',
                    zIndex: 70
                  }}
                >
                  {/* Success particles - always visible for completed videos */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl" style={{ zIndex: 80 }}>
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={`success-particle-${i}`}
                        className="absolute w-2 h-2 bg-green-400 rounded-full opacity-70"
                        style={{
                          top: `${20 + (i % 3) * 20}%`,
                          left: `${20 + (i % 3) * 20}%`,
                          boxShadow: '0 0 12px rgba(34, 197, 94, 0.8)',
                        }}
                        animate={{
                          x: [0, 15 * Math.cos(i * 60 * Math.PI / 180), 0],
                          y: [0, -10 * Math.sin(i * 60 * Math.PI / 180), 0],
                          scale: [0.8, 1.2, 0.8],
                          opacity: [0.4, 0.8, 0.4]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          delay: i * 0.5,
                          ease: "easeInOut"
                        }}
                      />
                    ))}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removePair(pair.id);
                    }}
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-white"
                    style={{ fontSize: '16px', fontWeight: 'bold', zIndex: 90 }}
                  >
                    ×
                  </button>

                  {/* Download button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadSingle(generatedVideo);
                    }}
                    className="absolute top-2 left-2 w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-green-400 hover:text-green-300"
                    style={{ fontSize: '14px', zIndex: 90 }}
                    title="Download video"
                  >
                    ↓
                  </button>

                  <div className="relative h-full flex flex-col">
                    {/* Title - Same as LoadingWindow */}
                    <div
                      className="text-white font-semibold mb-3 text-center relative"
                      style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                        lineHeight: '1.3',
                        zIndex: 75,
                        minHeight: '36px',
                        maxHeight: '36px',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {pair.audio?.name && pair.image?.name ? 
                        `${pair.audio.name.replace(/\.[^/.]+$/, "")} + ${pair.image.name.replace(/\.[^/.]+$/, "")}` :
                        generatedVideo?.filename || `Video ${index + 1}`
                      }
                    </div>

                    {/* Video Preview Area - Same positioning as LoadingWindow */}
                    <div className="flex-1 flex items-center justify-center" style={{ marginTop: '-7px', minHeight: '112px' }}>
                      <div 
                        className="aspect-video bg-black/30 rounded flex items-center justify-center relative overflow-hidden"
                        style={{ 
                          width: '192px', 
                          height: '108px', 
                          minWidth: '192px', 
                          maxWidth: '192px', 
                          minHeight: '108px', 
                          maxHeight: '108px',
                          position: 'relative',
                          flexShrink: 0,
                          padding: '2px'
                        }}
                      >
                        {/* Video background preview based on user settings */}
                        <div 
                          className="absolute inset-0 w-full h-full flex items-center justify-center"
                          style={{
                            ...getVideoBackgroundStyle()
                          }}
                        />

                        {/* Generated Video Preview - Always show the actual video */}
                        {generatedVideo && (
                          <video
                            src={generatedVideo.url}
                            className="absolute inset-0 w-full h-full object-contain rounded"
                            controls
                            preload="metadata"
                            style={{ background: 'transparent' }}
                            onError={(e) => {
                              console.error('Video playback error:', e);
                              console.log('Video URL:', generatedVideo.url);
                            }}
                          />
                        )}

                        {/* Success indicator overlay */}
                        <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center" style={{ zIndex: 10 }}>
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Completed Status Bar - Green instead of blue */}
                    <div className="w-full bg-white/10 rounded-full h-2 mt-4">
                      <div
                        className="h-full rounded-full w-full"
                        style={{
                          background: 'linear-gradient(90deg, #059669 0%, #10b981 50%, #34d399 100%)',
                          boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Footer - Empty */}
        <div className="p-6 pt-2">
          {/* Buttons removed */}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DownloadPage;
