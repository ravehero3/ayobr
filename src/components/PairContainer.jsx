import React from 'react';
import { motion } from 'framer-motion';
import AudioContainer from './AudioContainer';
import ImageContainer from './ImageContainer';
import { useAppStore } from '../store/appStore';

const PairContainer = ({ pair, onSwap, draggedItem, onDragStart, onDragEnd }) => {
  const { removePair } = useAppStore();

  const handleDelete = () => {
    removePair(pair.id);
  };

  return (
    <motion.div
      className="relative group w-full"
      layout
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-center space-x-6 relative">
        {/* Audio Container */}
        <div className="flex-1 max-w-xs">
          <div
            className="relative bg-gradient-to-br from-gray-900/95 to-gray-800/90 backdrop-blur-xl rounded-3xl p-6 border"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.85) 100%)',
              borderColor: 'rgba(59, 130, 246, 0.3)',
              boxShadow: `
                0 0 0 1px rgba(59, 130, 246, 0.3),
                0 0 40px rgba(59, 130, 246, 0.15),
                0 0 80px rgba(59, 130, 246, 0.08),
                inset 0 1px 0 rgba(255, 255, 255, 0.05)
              `
            }}
          >
            {/* Top-right brilliant highlight */}
            <div 
              className="absolute top-4 right-6 w-2 h-2 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(59, 130, 246, 0.8) 40%, transparent 70%)',
                boxShadow: '0 0 20px rgba(255, 255, 255, 0.6), 0 0 40px rgba(59, 130, 246, 0.4)'
              }}
            />
            
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

        {/* Connection Line with Rounded Corners */}
        <div className="relative flex items-center justify-center">
          <svg
            width="120"
            height="40"
            viewBox="0 0 120 40"
            className="absolute"
            style={{ zIndex: 10 }}
          >
            <defs>
              <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(59, 130, 246, 0.8)" />
                <stop offset="50%" stopColor="rgba(147, 51, 234, 0.6)" />
                <stop offset="100%" stopColor="rgba(59, 130, 246, 0.8)" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <path
              d="M 10 20 Q 30 5, 60 20 Q 90 35, 110 20"
              stroke="url(#connectionGradient)"
              strokeWidth="20"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              filter="url(#glow)"
              opacity="0.9"
            />
          </svg>
          
          {/* Connection indicator */}
          <div 
            className="relative z-20 w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(147, 51, 234, 0.7) 100%)',
              boxShadow: '0 0 25px rgba(59, 130, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
            }}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>

        {/* Image Container */}
        <div className="flex-1 max-w-xs">
          <div
            className="relative bg-gradient-to-br from-gray-900/95 to-gray-800/90 backdrop-blur-xl rounded-3xl p-6 border"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.85) 100%)',
              borderColor: 'rgba(59, 130, 246, 0.3)',
              boxShadow: `
                0 0 0 1px rgba(59, 130, 246, 0.3),
                0 0 40px rgba(59, 130, 246, 0.15),
                0 0 80px rgba(59, 130, 246, 0.08),
                inset 0 1px 0 rgba(255, 255, 255, 0.05)
              `
            }}
          >
            {/* Top-right brilliant highlight */}
            <div 
              className="absolute top-4 right-6 w-2 h-2 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(59, 130, 246, 0.8) 40%, transparent 70%)',
                boxShadow: '0 0 20px rgba(255, 255, 255, 0.6), 0 0 40px rgba(59, 130, 246, 0.4)'
              }}
            />
            
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

        {/* Delete button positioned above the connection */}
        <button
          onClick={handleDelete}
          className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-30 p-2 rounded-xl bg-gray-800/60 backdrop-blur-sm border border-gray-600/40 text-gray-400 hover:text-red-400 hover:border-red-400/50 hover:bg-red-500/20 transition-all duration-300"
          style={{
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
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
