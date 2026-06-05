
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';

function VideoPreview({ src, playing, onTogglePlay, width, height }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) {
      v.muted = false;
      v.play().catch(() => {});
    } else {
      v.pause();
      v.currentTime = 0;
      v.muted = true;
    }
  }, [playing]);

  return (
    <div style={{ width, height, position: 'relative', flexShrink: 0, borderRadius: '4px', overflow: 'hidden' }}>
      <video
        ref={videoRef}
        src={src}
        preload="auto"
        muted
        playsInline
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          background: 'transparent',
          display: 'block',
        }}
      />

      <button
        onClick={(e) => { e.stopPropagation(); onTogglePlay(); }}
        className="absolute inset-0 w-full h-full flex items-center justify-center group/play"
        style={{ background: playing ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0.25)', zIndex: 5, opacity: playing ? 0 : 1, transition: 'opacity 0.2s, background 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(0,0,0,0.25)'; }}
        onMouseLeave={e => { if (playing) { e.currentTarget.style.opacity = '0'; e.currentTarget.style.background = 'rgba(0,0,0,0)'; } }}
      >
        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center group-hover/play:bg-white/35 transition-all">
          {playing ? (
            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 10 10">
              <rect x="1" y="0" width="3" height="10" rx="0.5" />
              <rect x="6" y="0" width="3" height="10" rx="0.5" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </div>
      </button>

      <div
        className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
        style={{ zIndex: 10 }}
      >
        <svg className="w-2.5 h-2.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    </div>
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
        {/* Header */}
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

        {/* Videos Grid */}
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

              const q = videoSettings?.quality || 'fullhd';
              const pw = 192;
              const ph = q === 'square' ? 192 : q === 'ultrawide' ? Math.round(pw * 1080 / 2560) : 108;

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
                  {/* Gradient border layer */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(0, 0, 0, 0.8) 100%)',
                      zIndex: 0
                    }}
                  />
                  {/* Dark inner background */}
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      top: '2px', left: '2px', right: '2px', bottom: '2px',
                      borderRadius: '14px',
                      background: 'rgba(0, 0, 0, 0.41)',
                      backdropFilter: 'blur(11.4px)',
                      WebkitBackdropFilter: 'blur(11.4px)',
                      zIndex: 1
                    }}
                  />
                  {/* Particles */}
                  <div className="absolute inset-0 pointer-events-none overflow-visible rounded-2xl" style={{ zIndex: 80 }}>
                    {[...Array(12)].map((_, i) => {
                      const angle = (i * 360) / 12;
                      const radius = 45;
                      return (
                        <motion.div
                          key={`progress-particle-${i}`}
                          className="absolute rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{
                            width: '2px', height: '2px',
                            background: 'rgba(255, 255, 255, 0.9)',
                            top: `${50 + radius * Math.sin(angle * Math.PI / 180)}%`,
                            left: `${50 + radius * Math.cos(angle * Math.PI / 180)}%`,
                            boxShadow: '0 0 8px rgba(255, 255, 255, 0.6)'
                          }}
                          animate={{
                            x: [0, 20 * Math.cos(i * 30 * Math.PI / 180), 20 * Math.cos((i * 30 + 90) * Math.PI / 180), 20 * Math.cos((i * 30 + 180) * Math.PI / 180), 20 * Math.cos((i * 30 + 270) * Math.PI / 180), 0],
                            y: [0, 20 * Math.sin(i * 30 * Math.PI / 180), 20 * Math.sin((i * 30 + 90) * Math.PI / 180), 20 * Math.sin((i * 30 + 180) * Math.PI / 180), 20 * Math.sin((i * 30 + 270) * Math.PI / 180), 0],
                            scale: [0.8, 1.2, 1.0, 0.8, 1.0, 0.8]
                          }}
                          transition={{ duration: 4.95, repeat: Infinity, delay: i * 0.25, ease: "linear" }}
                        />
                      );
                    })}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); removePair(pair.id); }}
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-white"
                    style={{ fontSize: '16px', fontWeight: 'bold', zIndex: 90 }}
                  >×</button>

                  {/* Download button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDownloadSingle(generatedVideo); }}
                    className="absolute top-2 left-2 w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-green-400 hover:text-green-300"
                    style={{ fontSize: '14px', zIndex: 90 }}
                    title="Download video"
                  >↓</button>

                  <div className="relative h-full flex flex-col">
                    {/* Title */}
                    <div
                      className="text-white font-semibold mb-3 text-center relative"
                      style={{
                        fontSize: '14px', fontWeight: '600',
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                        lineHeight: '1.3', zIndex: 75,
                        minHeight: '36px', maxHeight: '36px',
                        overflow: 'hidden',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      {pair.audio?.name && pair.image?.name
                        ? `${pair.audio.name.replace(/\.[^/.]+$/, "")} + ${pair.image.name.replace(/\.[^/.]+$/, "")}`
                        : generatedVideo?.filename || `Video ${index + 1}`}
                    </div>

                    {/* Video Preview — exact match to actual video */}
                    <div className="flex-1 flex items-center justify-center" style={{ marginTop: '-7px', minHeight: '112px' }}>
                      {generatedVideo ? (
                        <VideoPreview
                          src={generatedVideo.url}
                          playing={playingIds.has(pair.id)}
                          onTogglePlay={() => togglePlay(pair.id)}
                          width={pw}
                          height={ph}
                        />
                      ) : (
                        <div style={{ width: pw, height: ph, background: 'rgba(0,0,0,0.3)', borderRadius: '4px' }} />
                      )}
                    </div>

                    {/* Progress bar */}
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

        <div className="p-6 pt-2" />
      </motion.div>
    </motion.div>
  );
};

export default DownloadPage;
