
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';

function VideoFirstFrame({ src }) {
  const [frameUrl, setFrameUrl] = useState(null);

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    const vid = document.createElement('video');
    vid.preload = 'auto';
    vid.muted = true;
    vid.src = src;

    const capture = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = vid.videoWidth || 192;
        canvas.height = vid.videoHeight || 108;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
        const url = canvas.toDataURL('image/jpeg', 0.9);
        if (!cancelled && url.length > 100) setFrameUrl(url);
      } catch (_) {}
      vid.src = '';
    };

    vid.onseeked = capture;
    vid.onloadeddata = () => { vid.currentTime = 0.001; };
    vid.onerror = () => { vid.src = ''; };

    return () => { cancelled = true; vid.src = ''; };
  }, [src]);

  if (!frameUrl) {
    return <div className="absolute inset-0 w-full h-full bg-black rounded" />;
  }
  return (
    <img
      src={frameUrl}
      className="absolute inset-0 w-full h-full object-contain rounded"
      alt="Video preview"
      draggable={false}
    />
  );
}

const DownloadPage = ({ onDownloadAll, onBackToFileManagement }) => {
  const { generatedVideos, pairs, videoSettings, removePair } = useAppStore();
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [playingIds, setPlayingIds] = useState(new Set());

  const togglePlay = (id) => {
    setPlayingIds(prev => {
      if (prev.has(id)) return new Set();
      return new Set([id]);
    });
  };

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
      className="fixed inset-0 flex flex-col items-center justify-start bg-space-dark/90 overflow-y-auto"
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
        <div className="relative mb-8 px-4" style={{ marginTop: '20px', zIndex: 50 }}>
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
                    background: 'linear-gradient(to bottom, rgba(1,5,10,0.88), rgba(7,30,87,0.80))',
                    borderRadius: '16px',
                    boxShadow: '0 20px 50px -10px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(32px)',
                    WebkitBackdropFilter: 'blur(32px)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    padding: '2px',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    overflow: 'visible',
                    zIndex: 60
                  }}
                  whileHover={{
                    boxShadow: '0 24px 60px -10px rgba(0,0,0,0.8), 0 0 40px rgba(255,255,255,0.12), 0 0 80px rgba(59,130,246,0.08)',
                    borderColor: 'rgba(255,255,255,0.28)',
                    zIndex: 70
                  }}
                >
                  {/* Gradient border layer - positioned behind container */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(0, 0, 0, 0.8) 100%)',
                      zIndex: 0
                    }}
                  />
                  {/* Dark inner background - covers gradient except for 2px border */}
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      top: '2px',
                      left: '2px',
                      right: '2px',
                      bottom: '2px',
                      borderRadius: '14px',
                      background: 'rgba(0, 0, 0, 0.41)',
                      backdropFilter: 'blur(11.4px)',
                      WebkitBackdropFilter: 'blur(11.4px)',
                      zIndex: 1
                    }}
                  />
                  {/* Enhanced Particle system - same as LoadingWindow */}
                  <div className="absolute inset-0 pointer-events-none overflow-visible rounded-2xl" style={{ zIndex: 80 }}>
                    {/* Particles positioned around entire video preview container */}
                    {[...Array(12)].map((_, i) => {
                      // Distribute particles around the perimeter of the container
                      const angle = (i * 360) / 12;
                      const radius = 45;
                      const centerX = 50;
                      const centerY = 50;
                      
                      return (
                        <motion.div
                          key={`progress-particle-${i}`}
                          className="absolute rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{
                            width: '2px',
                            height: '2px',
                            background: 'rgba(255, 255, 255, 0.9)',
                            top: `${centerY + radius * Math.sin(angle * Math.PI / 180)}%`,
                            left: `${centerX + radius * Math.cos(angle * Math.PI / 180)}%`,
                            boxShadow: '0 0 8px rgba(255, 255, 255, 0.6)'
                          }}
                          animate={{
                            x: [0, 20 * Math.cos(i * 30 * Math.PI / 180), 20 * Math.cos((i * 30 + 90) * Math.PI / 180), 20 * Math.cos((i * 30 + 180) * Math.PI / 180), 20 * Math.cos((i * 30 + 270) * Math.PI / 180), 0],
                            y: [0, 20 * Math.sin(i * 30 * Math.PI / 180), 20 * Math.sin((i * 30 + 90) * Math.PI / 180), 20 * Math.sin((i * 30 + 180) * Math.PI / 180), 20 * Math.sin((i * 30 + 270) * Math.PI / 180), 0],
                            scale: [0.8, 1.2, 1.0, 0.8, 1.0, 0.8]
                          }}
                          transition={{
                            duration: 4.95,
                            repeat: Infinity,
                            delay: i * 0.25,
                            ease: "linear"
                          }}
                        />
                      );
                    })}
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
                        {/* First-frame thumbnail (pixel-perfect match to actual video) */}
                        {generatedVideo && !playingIds.has(pair.id) && (
                          <VideoFirstFrame src={generatedVideo.url} />
                        )}

                        {/* Video player — shown after user clicks play */}
                        {generatedVideo && playingIds.has(pair.id) && (
                          <video
                            src={generatedVideo.url}
                            className="absolute inset-0 w-full h-full object-contain rounded"
                            controls
                            autoPlay
                            preload="auto"
                            style={{ background: 'transparent' }}
                            onError={(e) => console.error('Video playback error:', e)}
                          />
                        )}

                        {/* Play button overlay — only when not playing */}
                        {generatedVideo && !playingIds.has(pair.id) && (
                          <button
                            onClick={(e) => { e.stopPropagation(); togglePlay(pair.id); }}
                            className="absolute inset-0 w-full h-full flex items-center justify-center group/play"
                            style={{ background: 'rgba(0,0,0,0.25)', zIndex: 5 }}
                          >
                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center group-hover/play:bg-white/35 transition-all">
                              <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                          </button>
                        )}

                        {/* Success indicator overlay */}
                        <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.5)]" style={{ zIndex: 10 }}>
                          <svg className="w-2.5 h-2.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Completed Status Bar - Monochromatic */}
                    <div className="w-full bg-white/10 rounded-full h-2 mt-4">
                      <div
                        className="h-full rounded-full w-full"
                        style={{
                          background: 'linear-gradient(90deg, #374151 0%, #9ca3af 50%, #ffffff 100%)',
                          boxShadow: '0 0 15px rgba(255, 255, 255, 0.2)'
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
