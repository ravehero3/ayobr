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
      <div className="flex items-center justify-center relative">
        {/* Audio Container with puzzle piece connection */}
        <div className="w-96 h-48 relative">
          <div
            className="relative w-full h-full backdrop-blur-xl p-6 border"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.85) 100%)',
              borderColor: 'rgba(59, 130, 246, 0.3)',
              clipPath: 'polygon(0% 0%, 85% 0%, 85% 35%, 95% 35%, 95% 40%, 100% 40%, 100% 60%, 95% 60%, 95% 65%, 85% 65%, 85% 100%, 0% 100%)',
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

        {/* Image Container with puzzle piece connection */}
        <div className="w-96 h-48 relative -ml-4">
          <div
            className="relative w-full h-full backdrop-blur-xl p-6 border"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.85) 100%)',
              borderColor: 'rgba(59, 130, 246, 0.3)',
              clipPath: 'polygon(0% 40%, 5% 40%, 5% 35%, 15% 35%, 15% 0%, 100% 0%, 100% 100%, 15% 100%, 15% 65%, 5% 65%, 5% 60%, 0% 60%)',
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

        {/* Delete button positioned at top right */}
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
