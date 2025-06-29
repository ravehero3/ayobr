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
      <div className="flex flex-col sm:flex-row items-center relative">
        {/* Audio Container */}
        <div className="relative w-full sm:w-1/2">
          <div
            className="relative w-full backdrop-blur-xl border overflow-hidden"
            style={{
              height: '200px',
              minHeight: '200px',
              maxHeight: '200px',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.85) 100%)',
              borderColor: 'rgba(59, 130, 246, 0.4)',
              borderWidth: '2px',
              boxShadow: `
                0 0 0 1px rgba(59, 130, 246, 0.2),
                0 0 40px rgba(59, 130, 246, 0.15),
                0 0 80px rgba(59, 130, 246, 0.08),
                inset 0 1px 0 rgba(255, 255, 255, 0.05)
              `,
              borderTopLeftRadius: '24px',
              borderBottomLeftRadius: '24px',
              borderTopRightRadius: '0px',
              borderBottomRightRadius: '0px',
              clipPath: 'polygon(0% 0%, 90% 0%, 100% 30%, 100% 70%, 90% 100%, 0% 100%)'
            }}
          >
            {/* Top-right brilliant highlight */}
            <div 
              className="absolute top-4 right-6 w-3 h-3 rounded-full z-10"
              style={{
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(59, 130, 246, 0.8) 40%, transparent 70%)',
                boxShadow: '0 0 20px rgba(255, 255, 255, 0.6), 0 0 40px rgba(59, 130, 246, 0.4)'
              }}
            />

            <div className="absolute inset-0 p-6">
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

        {/* Connector */}
        <div className="relative z-20 hidden sm:block" style={{ width: '40px', height: '80px', marginLeft: '-20px', marginRight: '-20px' }}>
          <div
            className="w-full h-full backdrop-blur-xl border"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.85) 100%)',
              borderColor: 'rgba(59, 130, 246, 0.4)',
              borderWidth: '2px',
              boxShadow: `
                0 0 0 1px rgba(59, 130, 246, 0.2),
                0 0 40px rgba(59, 130, 246, 0.15),
                0 0 80px rgba(59, 130, 246, 0.08),
                inset 0 1px 0 rgba(255, 255, 255, 0.05)
              `,
              borderRadius: '20px'
            }}
          />
        </div>

        {/* Image Container */}
        <div className="relative w-full sm:w-1/2">
          <div
            className="relative w-full backdrop-blur-xl border overflow-hidden"
            style={{
              height: '200px',
              minHeight: '200px',
              maxHeight: '200px',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.85) 100%)',
              borderColor: 'rgba(59, 130, 246, 0.4)',
              borderWidth: '2px',
              boxShadow: `
                0 0 0 1px rgba(59, 130, 246, 0.2),
                0 0 40px rgba(59, 130, 246, 0.15),
                0 0 80px rgba(59, 130, 246, 0.08),
                inset 0 1px 0 rgba(255, 255, 255, 0.05)
              `,
              borderTopLeftRadius: '0px',
              borderBottomLeftRadius: '0px',
              borderTopRightRadius: '24px',
              borderBottomRightRadius: '24px',
              clipPath: 'polygon(10% 0%, 100% 0%, 100% 100%, 10% 100%, 0% 70%, 0% 30%)'
            }}
          >
            {/* Top-right brilliant highlight */}
            <div 
              className="absolute top-4 right-6 w-3 h-3 rounded-full z-10"
              style={{
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(59, 130, 246, 0.8) 40%, transparent 70%)',
                boxShadow: '0 0 20px rgba(255, 255, 255, 0.6), 0 0 40px rgba(59, 130, 246, 0.4)'
              }}
            />

            <div className="absolute inset-0 p-6">
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