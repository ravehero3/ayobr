import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { useLanguage } from '../context/LanguageContext';
import GlassPlayButton from './GlassPlayButton';

const NM = "'Neue Montreal', 'Inter', sans-serif";

/* ─── Aspect ratio + image layout helpers (mirrors SettingsPanel) ─────── */
const getAspectRatioStyle = (quality) => {
  if (quality === 'square')    return '1 / 1';
  if (quality === 'ultrawide') return '2560 / 1080';
  return '16 / 9';
};

const getPreviewImageStyle = (imageLayout) => {
  if (imageLayout === 'padded') {
    const p = (100 / 1080) * 100;
    return {
      position: 'absolute',
      top: `${p.toFixed(2)}%`,
      left: 0,
      right: 0,
      height: `${(100 - p * 2).toFixed(2)}%`,
      width: '100%',
      objectFit: 'contain',
    };
  }
  if (imageLayout === 'thumbnail') {
    return {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      maxWidth: '100%',
      height: `${((250 / 1080) * 100).toFixed(2)}%`,
      width: 'auto',
      objectFit: 'contain',
    };
  }
  return { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' };
};

/* ─── Grid layout icons ─────────────────────────────────────── */
const IconGridAuto = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    {[0,6,12].map(x => [0,6,12].map(y => (
      <rect key={`${x}${y}`} x={x+1} y={y+1} width="4" height="4" rx="0.8"
        fill={active ? '#fff' : 'rgba(255,255,255,0.45)'} />
    )))}
  </svg>
);

const IconGridFull = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="1" y="3" width="16" height="4.5" rx="1" fill={active ? '#fff' : 'rgba(255,255,255,0.45)'} />
    <rect x="1" y="10.5" width="16" height="4.5" rx="1" fill={active ? '#fff' : 'rgba(255,255,255,0.45)'} />
  </svg>
);

const IconGridThird = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="1" y="1" width="16" height="2" rx="0.8" fill={active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.15)'} />
    <rect x="4" y="5" width="10" height="5.5" rx="1" fill={active ? '#fff' : 'rgba(255,255,255,0.45)'} />
    <rect x="1" y="13" width="16" height="2" rx="0.8" fill={active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.15)'} />
  </svg>
);

const IconGridSpiral = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="7" y="7" width="4" height="4" rx="0.8" fill={active ? '#fff' : 'rgba(255,255,255,0.45)'} />
    <rect x="7" y="12" width="4" height="4" rx="0.8" rx="0.8" fill={active ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.32)'} />
    <rect x="12" y="7" width="4" height="4" rx="0.8" fill={active ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.28)'} />
    <rect x="12" y="2" width="4" height="4" rx="0.8" fill={active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)'} />
    <rect x="7" y="2" width="4" height="4" rx="0.8" fill={active ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.18)'} />
    <rect x="2" y="2" width="4" height="4" rx="0.8" fill={active ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.14)'} />
    <rect x="2" y="7" width="4" height="4" rx="0.8" fill={active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.11)'} />
    <rect x="2" y="12" width="4" height="4" rx="0.8" fill={active ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)'} />
  </svg>
);

/* ─── Grid layout switcher panel ────────────────────────────── */
const GridSwitcher = ({ layout, setLayout }) => {
  const options = [
    { key: 'grid',   icon: IconGridAuto,   label: 'Grid' },
    { key: 'full',   icon: IconGridFull,   label: 'Full width' },
    { key: 'third',  icon: IconGridThird,  label: 'Centered' },
    { key: 'spiral', icon: IconGridSpiral, label: 'Spiral' },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      style={{
        position: 'fixed',
        bottom: '100px',
        left: '28px',
        zIndex: 10005,
        display: 'flex',
        flexDirection: 'row',
        gap: '4px',
        padding: '7px 9px',
        borderRadius: '14px',
        background: 'rgba(5,5,5,0.7)',
        backdropFilter: 'blur(25px) saturate(120%) brightness(70%) contrast(125%)',
        WebkitBackdropFilter: 'blur(25px) saturate(120%) brightness(70%) contrast(125%)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.07)',
      }}
    >
      {options.map(({ key, icon: Icon, label }) => {
        const isActive = layout === key;
        return (
          <button
            key={key}
            onClick={() => setLayout(key)}
            title={label}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              border: 'none',
              background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.18s ease',
              outline: 'none',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
          >
            <Icon active={isActive} />
          </button>
        );
      })}
    </motion.div>
  );
};

/* ─── Spiral position algorithm ─────────────────────────────── */
// Returns [col, row] for the nth card in a clockwise spiral
// Card 0 = center [0,0], card 1 = directly below [0,1], then spirals clockwise
function getSpiralPos(n) {
  if (n === 0) return [0, 0];
  // Directions: down, right, up, left
  const dx = [0, 1, 0, -1];
  const dy = [1, 0, -1, 0];
  let col = 0, row = 0, dir = 0, steps = 1, stepsDone = 0, turns = 0;
  for (let i = 0; i < n; i++) {
    col += dx[dir];
    row += dy[dir];
    stepsDone++;
    if (stepsDone === steps) {
      stepsDone = 0;
      dir = (dir + 1) % 4;
      turns++;
      if (turns % 2 === 0) steps++;
    }
  }
  return [col, row];
}

/* ─── Spiral grid layout component ──────────────────────────── */
const SpiralGridLayout = ({
  pairs, generatedVideos, playingIds, setPlayingIds, videoRefs,
  handlePlayPause, handleDownloadSingle, removePair, getVideoBackgroundStyle,
  quality, imageLayout,
}) => {
  const containerRef = useRef(null);
  const CARD_W = 360;
  const FOOTER_H = 50;
  const VIDEO_H = quality === 'square'
    ? CARD_W
    : quality === 'ultrawide'
      ? Math.round(CARD_W * 1080 / 2560)
      : Math.round(CARD_W * 9 / 16);
  const CARD_H = VIDEO_H + FOOTER_H;
  const GAP = 20;
  const CELL_W = CARD_W + GAP;
  const CELL_H = CARD_H + GAP;
  const PADDING = 80;

  const cards = pairs.filter(p => generatedVideos.find(v => v.pairId === p.id));
  const positions = cards.map((_, i) => getSpiralPos(i));

  const allCols = positions.map(([c]) => c);
  const allRows = positions.map(([, r]) => r);
  const minCol = cards.length > 0 ? Math.min(...allCols) : 0;
  const maxCol = cards.length > 0 ? Math.max(...allCols) : 0;
  const minRow = cards.length > 0 ? Math.min(...allRows) : 0;
  const maxRow = cards.length > 0 ? Math.max(...allRows) : 0;

  const gridW = (maxCol - minCol + 1) * CELL_W + PADDING * 2;
  const gridH = (maxRow - minRow + 1) * CELL_H + PADDING * 2;

  // Where col=0, row=0 maps to inside the grid (in px)
  const originX = PADDING + (-minCol) * CELL_W;
  const originY = PADDING + (-minRow) * CELL_H;

  useEffect(() => {
    if (!containerRef.current || cards.length === 0) return;
    const view = containerRef.current;
    // Scroll so card 0 is roughly centered in the viewport
    view.scrollLeft = originX - view.clientWidth / 2 + CARD_W / 2;
    view.scrollTop  = originY - view.clientHeight / 2 + CARD_H / 2;
  }, []); // run once on mount

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        overflow: 'auto',
        position: 'relative',
        paddingTop: 0,
        paddingBottom: 0,
      }}
    >
      <div style={{ position: 'relative', width: gridW, height: Math.max(gridH, 600) }}>
        {cards.map((pair, index) => {
          const generatedVideo = generatedVideos.find(v => v.pairId === pair.id);
          if (!generatedVideo) return null;
          const [col, row] = positions[index];
          const left = originX + col * CELL_W;
          const top  = originY + row * CELL_H;
          const isPlaying = !!playingIds[pair.id];
          const title = pair.audio?.name && pair.image?.name
            ? `${pair.audio.name.replace(/\.[^/.]+$/, '')} + ${pair.image.name.replace(/\.[^/.]+$/, '')}`
            : generatedVideo?.filename || `Video ${index + 1}`;

          return (
            <motion.div
              key={pair.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.04, duration: 0.3, ease: 'easeOut' }}
              className="group"
              style={{
                position: 'absolute',
                left,
                top,
                width: CARD_W,
                height: CARD_H,
                borderRadius: 16,
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.07)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            >
              {/* Download */}
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

              {/* Remove */}
              <button
                onClick={e => { e.stopPropagation(); removePair(pair.id); }}
                className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 text-gray-400 hover:text-white hover:scale-110"
                style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '18px', fontWeight: 'bold' }}
              >×</button>

              {/* Video area — aspect ratio matches selected quality */}
              <div className="relative w-full overflow-hidden" style={{ aspectRatio: getAspectRatioStyle(quality) }}>
                <div className="absolute inset-0" style={getVideoBackgroundStyle()} />
                {pair.image && !isPlaying && (
                  <img
                    src={URL.createObjectURL(pair.image)}
                    alt="Preview"
                    style={{ ...getPreviewImageStyle(imageLayout), opacity: 0.85 }}
                  />
                )}
                <video
                  ref={el => { if (el) videoRefs.current[pair.id] = el; }}
                  key={`spiral-vid-${pair.id}`}
                  src={generatedVideo.url}
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{ display: isPlaying ? 'block' : 'none', background: 'transparent', zIndex: 10 }}
                  controls controlsList="nodownload" preload="metadata"
                  onEnded={() => setPlayingIds(prev => ({ ...prev, [pair.id]: false }))}
                  onPause={() => setPlayingIds(prev => ({ ...prev, [pair.id]: false }))}
                  onPlay={() => setPlayingIds(prev => ({ ...prev, [pair.id]: true }))}
                />
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center cursor-pointer"
                    style={{ background: 'rgba(0,0,0,0.18)', zIndex: 15 }}
                    onClick={e => handlePlayPause(pair.id, e)}>
                    <GlassPlayButton isPlaying={false} onClick={e => handlePlayPause(pair.id, e)} size={60} />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 flex items-center justify-between">
                <p className="text-white/75 text-sm font-medium truncate" style={{ fontFamily: NM }} title={title}>
                  {title}
                </p>
                {isPlaying && (
                  <GlassPlayButton isPlaying={true} onClick={e => handlePlayPause(pair.id, e)} size={28} className="flex-shrink-0 ml-2" />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Main component ─────────────────────────────────────────── */
const LoadingWindow = ({ isVisible, pairs, onClose, onStop }) => {
  const { getVideoGenerationState, generatedVideos, isGenerating, videoSettings, removePair, resetApp } = useAppStore();
  const { t } = useLanguage();
  const [playingIds, setPlayingIds] = useState({});
  const videoRefs = useRef({});
  const [gridLayout, setGridLayout] = useState('grid');

  const handleDownloadSingle = async (video, event) => {
    if (event) event.stopPropagation();
    try {
      const link = document.createElement('a');
      link.href = video.url;
      link.download = video.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading video:', err);
    }
  };

  const getVideoBackgroundStyle = () => {
    const s = useAppStore.getState().videoSettings || {};
    if (s.background === 'white') return { backgroundColor: 'white' };
    if (s.background === 'custom' && s.customBackground) {
      try {
        const url = typeof s.customBackground === 'string' ? s.customBackground : URL.createObjectURL(s.customBackground);
        return { backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' };
      } catch { return { backgroundColor: 'black' }; }
    }
    return { backgroundColor: 'black' };
  };

  const handlePlayPause = (pairId, e) => {
    if (e) e.stopPropagation();
    const vid = videoRefs.current[pairId];
    if (!vid) return;
    if (playingIds[pairId]) {
      vid.pause();
      setPlayingIds({});
    } else {
      Object.entries(playingIds).forEach(([id, isPlaying]) => {
        if (isPlaying && videoRefs.current[id]) videoRefs.current[id].pause();
      });
      setPlayingIds({ [pairId]: true });
      vid.style.display = 'block';
      vid.play().catch(err => console.error('Video play failed:', err));
    }
  };

  if (!isVisible) return null;

  const allComplete = !isGenerating && generatedVideos.length > 0;

  /* ─── grid style for allComplete layout ─────────────────── */
  const getGridStyle = () => {
    if (gridLayout === 'full') {
      return { display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1080px', margin: '0 auto' };
    }
    if (gridLayout === 'third') {
      return { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', width: '100%' };
    }
    return {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
      gap: '22px',
      width: '100%',
      maxWidth: 'calc(100vw - 120px)',
      margin: '0 auto',
    };
  };

  const getCardStyle = () => {
    if (gridLayout === 'full') return { width: '100%' };
    if (gridLayout === 'third') return { width: 'calc(33.33vw - 40px)', minWidth: '280px', maxWidth: '560px' };
    return {};
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex flex-col items-center justify-start bg-space-dark/90"
        style={{ zIndex: 9999, paddingTop: '72px', paddingBottom: '40px', pointerEvents: 'none', overflowY: 'auto' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative w-full mx-4 rounded-lg overflow-visible"
          style={{
            width: '100%',
            maxWidth: '112rem',
            background: 'transparent',
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* ── GENERATING STATE: mini progress cards ─────────────── */}
          {isGenerating && (
            <div
              className="relative px-4"
              style={{ marginTop: '50px', zIndex: 50, paddingTop: '60px', paddingBottom: '60px' }}
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
                  const isComplete = !!generatedVideo || (videoState?.isComplete === true && !!videoState?.video);
                  const progressToDisplay = isComplete ? 100 : progressValue;
                  const videoToShow = generatedVideo || videoState?.video;
                  const isCurrentlyGenerating = videoState?.isGenerating && !isComplete;
                  const completedCount = pairs.filter(p => {
                    const ps = getVideoGenerationState(p.id);
                    return generatedVideos.find(v => v.pairId === p.id) || (ps?.isComplete && ps?.video);
                  }).length;
                  const currentIndex = pairs.findIndex(p => p.id === pair.id);
                  const anyActive = pairs.some(p => { const ps = getVideoGenerationState(p.id); return ps?.isGenerating && !ps?.isComplete; });
                  const shouldBeNext = currentIndex === completedCount && !isComplete && !anyActive;
                  const shouldShowPct = (isCurrentlyGenerating && progressToDisplay < 100 && !isComplete) || (shouldBeNext && !isComplete);
                  const shouldShowVideo = isComplete && !!(videoToShow?.url);
                  const isPlaying = !!playingIds[pair.id];

                  return (
                    <motion.div
                      key={pair.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="group"
                      style={{
                        position: 'relative', width: '240px', minWidth: '240px', maxWidth: '240px',
                        background: 'rgba(0,0,0,0.41)', borderRadius: '16px',
                        boxShadow: '0 4px 30px rgba(0,0,0,0.1)',
                        backdropFilter: 'blur(11.4px)', WebkitBackdropFilter: 'blur(11.4px)',
                        border: isComplete ? 'none' : '1px solid rgba(0,0,0,0.4)',
                        padding: isComplete ? '2px' : '20px',
                        transition: 'all 0.3s ease', cursor: 'default', overflow: 'visible', zIndex: 60,
                      }}
                    >
                      {isComplete && <>
                        <div className="absolute inset-0 pointer-events-none" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, rgba(29,78,216,0.8) 0%, rgba(135,206,235,0.8) 25%, rgba(29,78,216,0.8) 50%, rgba(15,23,42,0.9) 100%)', zIndex: 0 }} />
                        <div className="absolute pointer-events-none" style={{ top: '2px', left: '2px', right: '2px', bottom: '2px', borderRadius: '14px', background: 'rgba(0,0,0,0.41)', backdropFilter: 'blur(11.4px)', WebkitBackdropFilter: 'blur(11.4px)', zIndex: 1 }} />
                      </>}
                      <button onClick={e => { e.stopPropagation(); removePair(pair.id); }}
                        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-white"
                        style={{ fontSize: '16px', fontWeight: 'bold', zIndex: 90 }}>×</button>

                      <div className="relative h-full flex flex-col" style={{ zIndex: 5 }}>
                        <div className="text-white font-semibold mb-3 text-center"
                          style={{ fontSize: '14px', lineHeight: '1.3', minHeight: '36px', maxHeight: '36px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 75 }}>
                          {(() => {
                            const t = pair.audio?.name && pair.image?.name
                              ? `${pair.audio.name.replace(/\.[^/.]+$/, '')} + ${pair.image.name.replace(/\.[^/.]+$/, '')}`
                              : generatedVideo?.filename || `Video ${index + 1}`;
                            return t.length > 44 ? t.substring(0, 44) : t;
                          })()}
                        </div>
                        <div className="flex-1 flex items-center justify-center" style={{ marginTop: '-7px' }}>
                          <div className="rounded relative overflow-hidden"
                            style={{ width: '192px', aspectRatio: getAspectRatioStyle(videoSettings.quality), flexShrink: 0 }}>
                            <div className="absolute inset-0 w-full h-full" style={getVideoBackgroundStyle()} />
                            {pair.image && !isPlaying && (
                              <img
                                src={URL.createObjectURL(pair.image)}
                                alt="Preview"
                                style={{ ...getPreviewImageStyle(videoSettings.imageLayout), opacity: 0.8 }}
                              />
                            )}
                            {shouldShowVideo && videoToShow?.url && (
                              <video
                                ref={el => { if (el) videoRefs.current[pair.id] = el; }}
                                key={`gen-vid-${pair.id}`}
                                src={videoToShow.url}
                                className="absolute inset-0 w-full h-full object-contain"
                                style={{ display: isPlaying ? 'block' : 'none', background: 'transparent', zIndex: 15 }}
                                controlsList="nodownload" preload="metadata"
                                onEnded={() => setPlayingIds(prev => ({ ...prev, [pair.id]: false }))}
                              />
                            )}
                            {shouldShowPct && (
                              <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-medium"
                                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9)', zIndex: 10 }}>
                                {Math.round(progressToDisplay)}%
                              </div>
                            )}
                            {shouldShowVideo && videoToShow?.url && (
                              <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-200"
                                style={{ zIndex: 20, background: isPlaying ? 'transparent' : 'rgba(0,0,0,0.15)', opacity: isPlaying ? 0 : 1, pointerEvents: isPlaying ? 'none' : 'auto' }}
                                onClick={e => handlePlayPause(pair.id, e)}>
                                <GlassPlayButton isPlaying={false} onClick={e => handlePlayPause(pair.id, e)} size={36} />
                              </div>
                            )}
                          </div>
                        </div>
                        <motion.div className="w-full bg-white/10 rounded-full h-2 mt-4"
                          animate={{ opacity: isComplete ? 0 : 1 }} transition={{ duration: 0.5 }}>
                          <motion.div className="h-full rounded-full"
                            style={{ background: 'linear-gradient(90deg, #374151 0%, #d1d5db 100%)' }}
                            initial={{ width: 0 }}
                            animate={{ width: `${progressToDisplay}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }} />
                        </motion.div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── COMPLETED STATE: full video cards ─────────────────── */}
          {allComplete && gridLayout === 'spiral' ? (
            <SpiralGridLayout
              pairs={pairs}
              generatedVideos={generatedVideos}
              playingIds={playingIds}
              setPlayingIds={setPlayingIds}
              videoRefs={videoRefs}
              handlePlayPause={handlePlayPause}
              handleDownloadSingle={handleDownloadSingle}
              removePair={removePair}
              getVideoBackgroundStyle={getVideoBackgroundStyle}
              quality={videoSettings.quality}
              imageLayout={videoSettings.imageLayout}
            />
          ) : allComplete ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="px-6"
              style={{ paddingTop: '28px', paddingBottom: '100px' }}
            >
              <div style={getGridStyle()}>
                {pairs.map((pair, index) => {
                  const generatedVideo = generatedVideos.find(v => v.pairId === pair.id);
                  if (!generatedVideo) return null;
                  const isPlaying = !!playingIds[pair.id];
                  const title = pair.audio?.name && pair.image?.name
                    ? `${pair.audio.name.replace(/\.[^/.]+$/, '')} + ${pair.image.name.replace(/\.[^/.]+$/, '')}`
                    : generatedVideo?.filename || `Video ${index + 1}`;

                  return (
                    <motion.div
                      key={pair.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05, duration: 0.35, ease: 'easeOut' }}
                      className="relative group rounded-2xl overflow-hidden"
                      style={{
                        background: 'rgba(255,255,255,0.025)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        ...getCardStyle(),
                      }}
                    >
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

                      <button
                        onClick={e => { e.stopPropagation(); removePair(pair.id); }}
                        className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 text-gray-400 hover:text-white hover:scale-110"
                        style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '18px', fontWeight: 'bold' }}
                      >×</button>

                      <div className="relative w-full overflow-hidden rounded-t-2xl" style={{ aspectRatio: getAspectRatioStyle(videoSettings.quality) }}>
                        <div className="absolute inset-0" style={getVideoBackgroundStyle()} />
                        {pair.image && !isPlaying && (
                          <img
                            src={URL.createObjectURL(pair.image)}
                            alt="Preview"
                            style={{ ...getPreviewImageStyle(videoSettings.imageLayout), opacity: 0.85 }}
                          />
                        )}
                        <video
                          ref={el => { if (el) videoRefs.current[pair.id] = el; }}
                          key={`vid-${pair.id}`}
                          src={generatedVideo.url}
                          className="absolute inset-0 w-full h-full object-contain"
                          style={{ display: isPlaying ? 'block' : 'none', background: 'transparent', zIndex: 10 }}
                          controls controlsList="nodownload" preload="metadata"
                          onEnded={() => setPlayingIds(prev => ({ ...prev, [pair.id]: false }))}
                          onPause={() => setPlayingIds(prev => ({ ...prev, [pair.id]: false }))}
                          onPlay={() => setPlayingIds(prev => ({ ...prev, [pair.id]: true }))}
                        />
                        {!isPlaying && (
                          <div className="absolute inset-0 flex items-center justify-center cursor-pointer"
                            style={{ background: 'rgba(0,0,0,0.18)', zIndex: 15 }}
                            onClick={e => handlePlayPause(pair.id, e)}>
                            <GlassPlayButton isPlaying={false} onClick={e => handlePlayPause(pair.id, e)} size={60} />
                          </div>
                        )}
                      </div>

                      <div className="px-4 py-3 flex items-center justify-between">
                        <p className="text-white/75 text-sm font-medium truncate" style={{ fontFamily: NM }} title={title}>
                          {title}
                        </p>
                        {isPlaying && (
                          <GlassPlayButton isPlaying={true} onClick={e => handlePlayPause(pair.id, e)} size={28} className="flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ) : null}
        </motion.div>
      </motion.div>

      {/* ── Grid layout switcher (bottom-left, above footer) ─────── */}
      {allComplete && <GridSwitcher layout={gridLayout} setLayout={setGridLayout} />}
    </AnimatePresence>
  );
};

export default LoadingWindow;
