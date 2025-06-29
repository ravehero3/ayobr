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
      className="relative bg-gradient-to-br from-space-navy to-space-dark rounded-3xl p-6 border border-neon-blue/30 shadow-xl"
      style={{
        boxShadow: '0 0 20px rgba(30, 144, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      }}
      layout
      transition={{ duration: 0.3 }}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-neon-blue/5 to-neon-cyan/5 animate-pulse" />
      
      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-red-400 transition-colors duration-200"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="relative space-y-4">
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

      {/* Highlight flare */}
      <div className="absolute top-2 right-8 w-2 h-2 bg-neon-cyan rounded-full animate-ping opacity-75" />
    </motion.div>
  );
};

export default PairContainer;
