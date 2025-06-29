import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ImageContainer = ({ image, pairId, onSwap, draggedItem, onDragStart, onDragEnd }) => {
  const [imageUrl, setImageUrl] = useState(null);

  React.useEffect(() => {
    if (image) {
      const url = URL.createObjectURL(image);
      setImageUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [image]);

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move';
    onDragStart({ type: 'image', pairId, data: image });
  };

  const handleDragOver = (e) => {
    if (draggedItem?.type === 'image') {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (draggedItem?.type === 'image' && draggedItem.pairId !== pairId) {
      onSwap(draggedItem.pairId, pairId, 'image');
    }
  };

  return (
    <motion.div
      className="relative rounded-2xl transition-all duration-300 aspect-video"
      draggable={!!image}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      whileHover={{ scale: image ? 1.01 : 1 }}
      style={image ? {
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        padding: '20px'
      } : {
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.4) 0%, rgba(30, 41, 59, 0.3) 100%)',
        backdropFilter: 'blur(4px)',
        border: '2px dashed rgba(107, 114, 128, 0.3)',
        padding: '20px'
      }}
    >
      {image ? (
        <div className="h-full flex flex-col">
          {/* Image info */}
          <div className="flex items-center space-x-2 mb-3">
            <svg className="w-5 h-5 text-neon-cyan" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <span className="text-white text-sm font-medium truncate flex-1">
              {image.name}
            </span>
          </div>

          {/* Image preview */}
          <div className="flex-1 relative overflow-hidden rounded-xl">
            <img
              src={imageUrl}
              alt={image.name}
              className="w-full h-full object-cover"
              style={{ padding: '10px 0' }}
            />
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-gray-300">
          <div 
            className="p-4 rounded-full mb-4"
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.05) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}
          >
            <svg className="w-8 h-8 text-blue-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-300 mb-1">Drop image file here</p>
          <p className="text-xs text-gray-500 font-light">PNG, JPG</p>
        </div>
      )}
    </motion.div>
  );
};

export default ImageContainer;
