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
      className="relative group"
      layout
      transition={{ duration: 0.3 }}
    >
      {/* Main container with premium glass effect */}
      <div
        className="relative bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-[32px] p-8 border border-blue-500/20"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.85) 100%)',
          boxShadow: `
            0 0 0 1px rgba(59, 130, 246, 0.3),
            0 0 40px rgba(59, 130, 246, 0.15),
            0 0 80px rgba(59, 130, 246, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.05)
          `
        }}
      >
        {/* Animated border glow */}
        <div 
          className="absolute inset-0 rounded-[32px] opacity-60"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.4) 0%, rgba(147, 51, 234, 0.2) 50%, rgba(59, 130, 246, 0.4) 100%)',
            filter: 'blur(1px)',
            zIndex: -1
          }}
        />
        
        {/* Top-right brilliant highlight */}
        <div 
          className="absolute top-6 right-12 w-3 h-3 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(59, 130, 246, 0.8) 40%, transparent 70%)',
            boxShadow: '0 0 20px rgba(255, 255, 255, 0.6), 0 0 40px rgba(59, 130, 246, 0.4)'
          }}
        />
        
        {/* Delete button with premium styling */}
        <button
          onClick={handleDelete}
          className="absolute top-6 right-6 z-20 p-2.5 rounded-xl bg-gray-800/40 backdrop-blur-sm border border-gray-600/30 text-gray-400 hover:text-red-400 hover:border-red-400/40 hover:bg-red-500/10 transition-all duration-300"
          style={{
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content with subtle inner glow */}
        <div className="relative space-y-6">
          <AudioContainer
            audio={pair.audio}
            pairId={pair.id}
            onSwap={onSwap}
            draggedItem={draggedItem}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
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

        {/* Subtle inner light reflection */}
        <div 
          className="absolute inset-x-6 top-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
          style={{ filter: 'blur(0.5px)' }}
        />
      </div>
      
      {/* Hover enhancement */}
      <div 
        className="absolute inset-0 rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.05) 100%)',
          boxShadow: '0 0 60px rgba(59, 130, 246, 0.2)'
        }}
      />
    </motion.div>
  );
};

export default PairContainer;
