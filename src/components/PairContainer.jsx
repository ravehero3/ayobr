import React from 'react';
import { motion } from 'framer-motion';
import AudioContainer from './AudioContainer';
import ImageContainer from './ImageContainer';
import VideoGenerationAnimation from './VideoGenerationAnimation';
import { useAppStore } from '../store/appStore';

const PairContainer = ({ pair, onSwap, draggedItem, onDragStart, onDragEnd }) => {
  const { removePair, getVideoGenerationState, setVideoGenerationState, generatedVideos } = useAppStore();

  const videoState = getVideoGenerationState(pair.id);
  const generatedVideo = generatedVideos.find(v => v.pairId === pair.id);

  const handleDelete = () => {
    removePair(pair.id);
  };

  const handleVideoGenerationComplete = () => {
    setTimeout(() => {
      setVideoGenerationState(pair.id, { 
        ...videoState, 
        isComplete: false 
      });
    }, 500);
  };

  return (
    <motion.div
      className="relative group w-full"
      layout
      transition={{ duration: 0.3 }}
    >
      {/* Show generated video if available, otherwise show the original containers */}
      {generatedVideo ? (
        <div className="flex justify-center">
          <div
            className="relative w-full max-w-[800px] backdrop-blur-xl border overflow-hidden group/container"
            style={{
              height: '450px',
              minHeight: '450px',
              maxHeight: '450px',
              background: '#050A13',
              backgroundColor: '#0A0F1C',
              borderColor: '#10B981', // Green border for completed video
              borderWidth: '2px',
              boxShadow: `
                0 0 0 1px rgba(16, 185, 129, 0.4),
                0 0 20px rgba(16, 185, 129, 0.3),
                0 0 40px rgba(16, 185, 129, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.05)
              `,
              borderRadius: '16px',
              animation: 'border-pulse 3s ease-in-out infinite alternate'
            }}
          >
            {/* Success indicator */}
            <div 
              className="absolute top-6 right-8 w-6 h-6 rounded-full z-10 flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle, rgba(16, 185, 129, 1) 0%, rgba(34, 197, 94, 0.8) 50%, transparent 80%)',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.8)'
              }}
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div className="absolute inset-0 p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-lg font-bold">Generated Video</h3>
                <div className="flex items-center gap-2">
                  <span className="text-green-400 text-sm font-medium">Complete</span>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>
              
              <div className="flex-1 flex items-center justify-center">
                <video
                  src={generatedVideo.url}
                  controls
                  className="max-w-full max-h-full rounded-lg shadow-lg"
                  style={{
                    maxHeight: '320px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
                  }}
                  preload="metadata"
                />
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="text-gray-300 text-sm">
                  <span className="text-neon-blue">{pair.audio?.name}</span>
                  <span className="mx-2">+</span>
                  <span className="text-neon-blue">{pair.image?.name}</span>
                </div>
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = generatedVideo.url;
                    link.download = generatedVideo.filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white text-sm font-medium transition-all duration-300 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row items-center relative gap-4 lg:gap-6">
          {/* Audio Container - Made wider for better content display */}  
          <div className="relative w-full lg:w-1/2 min-w-[450px]">
            <div
              className="relative w-full backdrop-blur-xl border overflow-hidden group/container"
              style={{
                height: '300px',
                minHeight: '300px',
                maxHeight: '300px',
                width: '500px',
                minWidth: '500px',
                maxWidth: '500px',
                background: pair.audio ? '#050A13' : '#040608', // Darker for empty containers
                backgroundColor: pair.audio ? '#0A0F1C' : '#080C14', // Darker navy background for empty
                borderColor: pair.audio ? '#1E90FF' : 'rgba(30, 144, 255, 0.3)',
                borderWidth: '1.5px',
                boxShadow: pair.audio ? `
                  0 0 0 1px rgba(30, 144, 255, 0.3),
                  0 0 15px rgba(30, 144, 255, 0.4),
                  0 0 30px rgba(0, 207, 255, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.05)
                ` : `
                  0 0 0 1px rgba(30, 144, 255, 0.15),
                  0 0 8px rgba(30, 144, 255, 0.2),
                  0 0 15px rgba(0, 207, 255, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.02)
                `,
                borderRadius: '14px',
                animation: pair.audio ? 'border-pulse 3s ease-in-out infinite alternate' : 'none'
              }}
            >
              {/* Top-right highlight flare */}
              <div 
                className="absolute top-6 right-8 w-4 h-4 rounded-full z-10"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(30, 144, 255, 0.9) 30%, rgba(0, 207, 255, 0.6) 60%, transparent 80%)',
                  boxShadow: '0 0 25px rgba(255, 255, 255, 0.8), 0 0 50px rgba(30, 144, 255, 0.5)',
                  animation: 'flare-flicker 2s ease-in-out infinite alternate'
                }}
              />

              <div className="absolute inset-0 p-8">
                <AudioContainer
                  audio={pair.audio}
                  pairId={pair.id}
                  onSwap={onSwap}
                  draggedItem={draggedItem}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                />
              </div>
            </div>
          </div>

          {/* Connecting Bridge - Plus Symbol */}
          <div className="relative z-20 hidden lg:block flex items-center justify-center" style={{ width: '100px', height: '80px', margin: '0 -12px' }}>
            <div className="relative flex items-center justify-center" style={{ width: '60px', height: '60px' }}>
              {/* Horizontal bar of plus */}
              <div
                className="absolute backdrop-blur-xl border"
                style={{
                  width: '50px',
                  height: '12px',
                  background: '#050A13',
                  backgroundColor: '#0A0F1C',
                  borderColor: '#1E90FF',
                  borderWidth: '1.5px',
                  boxShadow: `
                    0 0 0 1px rgba(30, 144, 255, 0.3),
                    0 0 8px rgba(30, 144, 255, 0.4),
                    0 0 15px rgba(0, 207, 255, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.05)
                  `,
                  borderRadius: '6px'
                }}
              />
              {/* Vertical bar of plus */}
              <div
                className="absolute backdrop-blur-xl border"
                style={{
                  width: '12px',
                  height: '50px',
                  background: '#050A13',
                  backgroundColor: '#0A0F1C',
                  borderColor: '#1E90FF',
                  borderWidth: '1.5px',
                  boxShadow: `
                    0 0 0 1px rgba(30, 144, 255, 0.3),
                    0 0 8px rgba(30, 144, 255, 0.4),
                    0 0 15px rgba(0, 207, 255, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.05)
                  `,
                  borderRadius: '6px'
                }}
              />
              {/* Center glow effect */}
              <div 
                className="absolute w-3 h-3 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(30, 144, 255, 0.8) 0%, rgba(0, 207, 255, 0.4) 50%, transparent 70%)',
                  boxShadow: '0 0 15px rgba(30, 144, 255, 0.6)'
                }}
              />
            </div>
          </div>

          {/* Image Container - Made wider for better content display */}
          <div className="relative w-full lg:w-1/2 min-w-[450px]">
            <div
              className="relative w-full backdrop-blur-xl border overflow-hidden group/container"
              style={{
                height: '300px',
                minHeight: '300px',
                maxHeight: '300px',
                width: '500px',
                minWidth: '500px',
                maxWidth: '500px',
                background: pair.image ? '#050A13' : '#040608', // Darker for empty containers
                backgroundColor: pair.image ? '#0A0F1C' : '#080C14', // Darker navy background for empty
                borderColor: pair.image ? '#1E90FF' : 'rgba(30, 144, 255, 0.3)',
                borderWidth: '1.5px',
                boxShadow: pair.image ? `
                  0 0 0 1px rgba(30, 144, 255, 0.3),
                  0 0 15px rgba(30, 144, 255, 0.4),
                  0 0 30px rgba(0, 207, 255, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.05)
                ` : `
                  0 0 0 1px rgba(30, 144, 255, 0.15),
                  0 0 8px rgba(30, 144, 255, 0.2),
                  0 0 15px rgba(0, 207, 255, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.02)
                `,
                borderRadius: '14px',
                animation: pair.image ? 'border-pulse 3s ease-in-out infinite alternate' : 'none'
              }}
            >
              {/* Top-right highlight flare */}
              <div 
                className="absolute top-6 right-8 w-4 h-4 rounded-full z-10"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(30, 144, 255, 0.9) 30%, rgba(0, 207, 255, 0.6) 60%, transparent 80%)',
                  boxShadow: '0 0 25px rgba(255, 255, 255, 0.8), 0 0 50px rgba(30, 144, 255, 0.5)',
                  animation: 'flare-flicker 2s ease-in-out infinite alternate'
                }}
              />

              <div className="absolute inset-0 p-8">
                <ImageContainer
                  image={pair.image}
                  pairId={pair.id}
                  onSwap={onSwap}
                  draggedItem={draggedItem}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Generation Animation Overlay */}
      <VideoGenerationAnimation
        pair={pair}
        isGenerating={videoState.isGenerating}
        progress={videoState.progress}
        isComplete={videoState.isComplete}
        generatedVideo={generatedVideo}
        onComplete={handleVideoGenerationComplete}
      />

      {/* Delete button positioned at top right of container */}
      <button
        onClick={handleDelete}
        className="absolute top-4 right-4 z-30 p-2 rounded-xl bg-gray-800/60 backdrop-blur-sm border border-gray-600/40 text-gray-400 hover:text-red-400 hover:border-red-400/50 hover:bg-red-500/20 transition-all duration-300"
        style={{
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Hover enhancement for entire pair */}
      <div 
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.03) 100%)',
          boxShadow: '0 0 80px rgba(59, 130, 246, 0.15)'
        }}
      />
    </motion.div>
  );
};

export default PairContainer;