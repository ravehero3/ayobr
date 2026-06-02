import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { useLanguage } from '../context/LanguageContext';

const NM = "'Neue Montreal', 'Inter', sans-serif";

const LoadingWindow = ({ isVisible, pairs, onClose, onStop }) => {
  const { getVideoGenerationState, generatedVideos, isGenerating, videoSettings, removePair, resetApp } = useAppStore();
  const { t } = useLanguage();
  const [playingIds, setPlayingIds] = useState({});
  const videoRefs = useRef({});

  const handleDownloadSingle = async (video, event) => {
    if (event) event.stopPropagation();
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

  const getVideoBackgroundStyle = () => {
    const currentStore = useAppStore.getState();
    const settings = currentStore.videoSettings || {};
    const background = settings.background || 'black';
    if (background === 'white') return { backgroundColor: 'white' };
    if (background === 'black') return { backgroundColor: 'black' };
    if (background === 'custom' && settings.customBackground) {
      try {
        const backgroundUrl = typeof settings.customBackground === 'string'
          ? settings.customBackground
          : URL.createObjectURL(settings.customBackground);
        return { backgroundImage: `url(${backgroundUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' };
      } catch {
        return { backgroundColor: 'black' };
      }
    }
    return { backgroundColor: 'black' };
  };

  const handlePlayVideo = (pairId, videoUrl, e) => {
    e.stopPropagation();
    const vid = videoRefs.current[pairId];
    if (!vid) return;
    vid.style.display = 'block';
    vid.play().then(() => {
      setPlayingIds(prev => ({ ...prev, [pairId]: true }));
    }).catch(() => {
      window.open(videoUrl, '_blank');
    });
  };

  if (!isVisible) return null;

  const allComplete = !isGenerating && generatedVideos.length > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex flex-col items-center justify-start bg-space-dark/90"
        style={{ zIndex: 9999, paddingTop: '72px', paddingBottom: '40px', pointerEvents: 'none', overflow: 'hidden' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative w-full mx-4 rounded-lg overflow-visible"
          style={{
            maxHeight: 'calc(100vh - 112px)',
            width: '100%',
            maxWidth: '112rem',
            background: 'transparent',
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* ── GENERATING STATE: mini progress cards ─────────────────── */}
          {isGenerating && (
            <div
              className="relative overflow-y-auto px-4"
              style={{ marginTop: '50px', zIndex: 50, flex: 1, paddingTop: '60px', paddingBottom: '60px' }}
            >
              <div
                className="grid gap-6 w-full mx-auto"
                style={{
                  gridTemplateColumns: 'repeat(auto-fit, 240px)',
                  justifyContent: 'center',
                  justifyItems: 'center',
                  maxWidth: 'calc(100vw - 160px)',
                  padding: '0 80px',
                }}
              >
                {pairs.map((pair, index) => {
                  const videoState = getVideoGenerationState(pair.id);
                  const generatedVideo = generatedVideos.find(v => v.pairId === pair.id);
                  const progressValue = Math.max(0, videoState?.progress || 0);
                  const hasGeneratedVideo = !!generatedVideo;
                  const hasStateVideo = !!(videoState?.video);
                  const isComplete = hasGeneratedVideo || (videoState?.isComplete === true && hasStateVideo);
                  const progressToDisplay = isComplete ? 100 : progressValue;
                  const videoToShow = generatedVideo || videoState?.video;
                  const isCurrentlyGenerating = videoState?.isGenerating && !isComplete;
                  const completedCount = pairs.filter(p => {
                    const pState = getVideoGenerationState(p.id);
                    const pVideo = generatedVideos.find(v => v.pairId === p.id);
                    return pVideo || (pState?.isComplete && pState?.video);
                  }).length;
                  const currentIndex = pairs.findIndex(p => p.id === pair.id);
                  const shouldBeGeneratingNext = currentIndex === completedCount && !hasGeneratedVideo && !hasStateVideo && !isComplete;
                  const anyVideoActivelyGenerating = pairs.some(p => {
                    const pState = getVideoGenerationState(p.id);
                    return pState?.isGenerating && !pState?.isComplete;
                  });
                  const shouldShowPercentage = (isCurrentlyGenerating && progressToDisplay < 100 && !isComplete) ||
                    (shouldBeGeneratingNext && !anyVideoActivelyGenerating && !isComplete);
                  const shouldShowVideoPreview = isComplete && !!(videoToShow?.url);

                  return (
                    <motion.div
                      key={pair.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="group"
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
                        border: isComplete ? 'none' : '1px solid rgba(0, 0, 0, 0.4)',
                        padding: isComplete ? '2px' : '20px',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        overflow: 'visible',
                        zIndex: 60
                      }}
                    >
                      {isComplete && (
                        <div className="absolute inset-0 pointer-events-none" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, rgba(29, 78, 216, 0.8) 0%, rgba(135, 206, 235, 0.8) 25%, rgba(29, 78, 216, 0.8) 50%, rgba(15, 23, 42, 0.9) 100%)', zIndex: 0 }} />
                      )}
                      {isComplete && (
                        <div className="absolute pointer-events-none" style={{ top: '2px', left: '2px', right: '2px', bottom: '2px', borderRadius: '14px', background: 'rgba(0, 0, 0, 0.41)', backdropFilter: 'blur(11.4px)', WebkitBackdropFilter: 'blur(11.4px)', zIndex: 1 }} />
                      )}

                      <button
                        onClick={e => { e.stopPropagation(); removePair(pair.id); }}
                        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-white"
                        style={{ fontSize: '16px', fontWeight: 'bold', zIndex: 90 }}
                      >×</button>

                      <div className="relative h-full flex flex-col" style={{ zIndex: 5 }}>
                        <div className="text-white font-semibold mb-3 text-center" style={{ fontSize: '14px', lineHeight: '1.3', minHeight: '36px', maxHeight: '36px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 75 }}>
                          {(() => {
                            let title = pair.audio?.name && pair.image?.name
                              ? `${pair.audio.name.replace(/\.[^/.]+$/, "")} + ${pair.image.name.replace(/\.[^/.]+$/, "")}`
                              : generatedVideo?.filename || `Video ${index + 1}`;
                            return title.length > 44 ? title.substring(0, 44) : title;
                          })()}
                        </div>

                        <div className="flex-1 flex items-center justify-center" style={{ marginTop: '-7px', minHeight: '112px' }}>
                          <div className="aspect-video rounded relative overflow-hidden" style={{ width: '192px', height: '108px', minWidth: '192px', maxWidth: '192px', minHeight: '108px', maxHeight: '108px', flexShrink: 0 }}>
                            <div className="absolute inset-0 w-full h-full" style={getVideoBackgroundStyle()} />
                            {pair.image && (
                              <div className="absolute flex items-center justify-center" style={{ top: '2px', left: '2px', right: '2px', bottom: '2px' }}>
                                <img src={URL.createObjectURL(pair.image)} alt="Preview" className="max-w-full max-h-full object-contain opacity-80" />
                              </div>
                            )}
                            {shouldShowPercentage && (
                              <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-medium" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9)', zIndex: 10 }}>
                                {Math.round(progressToDisplay)}%
                              </div>
                            )}
                            {shouldShowVideoPreview && videoToShow?.url && (
                              <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 20 }}>
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors cursor-pointer"
                                  onClick={e => { e.stopPropagation(); window.open(videoToShow.url, '_blank'); }}>
                                  <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 shadow-lg">
                                    <svg className="w-4 h-4 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <motion.div
                          className="w-full bg-white/10 rounded-full h-2 mt-4"
                          animate={{ opacity: isComplete ? 0 : 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: isComplete ? 'linear-gradient(90deg, #9ca3af 0%, #ffffff 100%)' : 'linear-gradient(90deg, #374151 0%, #d1d5db 100%)' }}
                            initial={{ width: 0 }}
                            animate={{ width: `${progressToDisplay}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          />
                        </motion.div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── COMPLETED STATE: big glassmorphism cards ──────────────── */}
          {allComplete && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="flex-1 overflow-y-auto px-6"
              style={{ paddingTop: '24px', paddingBottom: '80px' }}
            >
              <div
                className="grid w-full mx-auto"
                style={{
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '20px',
                  maxWidth: 'calc(100vw - 120px)',
                  margin: '0 auto',
                }}
              >
                {pairs.map((pair, index) => {
                  const generatedVideo = generatedVideos.find(v => v.pairId === pair.id);
                  if (!generatedVideo) return null;
                  const isPlaying = playingIds[pair.id];

                  const title = pair.audio?.name && pair.image?.name
                    ? `${pair.audio.name.replace(/\.[^/.]+$/, "")} + ${pair.image.name.replace(/\.[^/.]+$/, "")}`
                    : generatedVideo?.filename || `Video ${index + 1}`;

                  return (
                    <motion.div
                      key={pair.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.06, duration: 0.4, ease: 'easeOut' }}
                      className="relative group rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden"
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                      }}
                      whileHover={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        borderColor: 'rgba(255, 255, 255, 0.10)',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.3), 0 0 60px rgba(59,130,246,0.08)',
                      }}
                    >
                      {/* Inner glow layer */}
                      <div className="absolute inset-0 rounded-2xl pointer-events-none transition-all duration-300"
                        style={{ background: 'rgba(255,255,255,0.005)' }} />

                      {/* Download button — top-left on hover */}
                      <button
                        onClick={e => handleDownloadSingle(generatedVideo, e)}
                        className="absolute top-3 left-3 z-20 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                        style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
                        title="Download"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>

                      {/* Remove button — top-right on hover */}
                      <button
                        onClick={e => { e.stopPropagation(); removePair(pair.id); }}
                        className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 text-gray-400 hover:text-white hover:scale-110"
                        style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '18px', fontWeight: 'bold' }}
                      >×</button>

                      {/* Video preview area — 16:9 */}
                      <div className="relative w-full overflow-hidden rounded-t-2xl" style={{ aspectRatio: '16/9' }}>
                        {/* Background */}
                        <div className="absolute inset-0" style={getVideoBackgroundStyle()} />

                        {/* Image thumbnail */}
                        {pair.image && !isPlaying && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <img
                              src={URL.createObjectURL(pair.image)}
                              alt="Preview"
                              className="max-w-full max-h-full object-contain"
                              style={{ opacity: 0.85 }}
                            />
                          </div>
                        )}

                        {/* Video element */}
                        <video
                          ref={el => { if (el) videoRefs.current[pair.id] = el; }}
                          key={`vid-${pair.id}`}
                          src={generatedVideo.url}
                          className="absolute inset-0 w-full h-full object-contain"
                          style={{ display: isPlaying ? 'block' : 'none', background: 'transparent' }}
                          controls
                          controlsList="nodownload"
                          preload="metadata"
                        />

                        {/* Play overlay — hidden when playing */}
                        {!isPlaying && (
                          <div
                            className="absolute inset-0 flex items-center justify-center transition-all duration-200 cursor-pointer"
                            style={{ background: 'rgba(0,0,0,0.15)' }}
                            onClick={e => handlePlayVideo(pair.id, generatedVideo.url, e)}
                          >
                            <motion.div
                              className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl"
                              style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)' }}
                              whileHover={{ scale: 1.12 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <svg className="w-6 h-6 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </motion.div>
                          </div>
                        )}

                        {/* Completed badge */}
                        <div
                          className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                          <span className="text-white/80 text-xs font-medium" style={{ fontFamily: NM }}>Ready</span>
                        </div>
                      </div>

                      {/* Card footer — title */}
                      <div className="px-4 py-3">
                        <p
                          className="text-white/80 text-sm font-medium truncate"
                          style={{ fontFamily: NM }}
                          title={title}
                        >
                          {title}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── Footer actions ─────────────────────────────────────────── */}
          {allComplete && (
            <div className="flex justify-center gap-4 px-6 pb-4 pt-2 flex-shrink-0">
              <button
                onClick={async () => {
                  for (const video of generatedVideos) {
                    const link = document.createElement('a');
                    link.href = video.url;
                    link.download = video.filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    await new Promise(r => setTimeout(r, 400));
                  }
                }}
                style={{ fontFamily: NM, fontWeight: 600, fontSize: '0.82rem', background: '#fff', color: '#000', border: 'none', padding: '9px 22px', borderRadius: 9999, cursor: 'pointer', transition: 'opacity 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                {t('app.downloadAll')}
              </button>
              <button
                onClick={() => resetApp()}
                style={{ fontFamily: NM, fontWeight: 600, fontSize: '0.82rem', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', padding: '9px 22px', borderRadius: 9999, cursor: 'pointer', transition: 'opacity 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                {t('app.reset')}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LoadingWindow;
