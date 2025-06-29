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
      className={`relative p-4 rounded-2xl border transition-all duration-300 aspect-video ${
        image 
          ? 'bg-gradient-to-r from-space-dark to-space-navy border-neon-blue/50'
          : 'bg-space-dark border-dashed border-gray-600'
      }`}
      draggable={!!image}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      whileHover={{ scale: image ? 1.02 : 1 }}
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
        <div className="h-full flex flex-col items-center justify-center text-gray-400">
          <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">Drop image file here</p>
          <p className="text-xs text-gray-500">PNG, JPG</p>
        </div>
      )}
    </motion.div>
  );
};

export default ImageContainer;
