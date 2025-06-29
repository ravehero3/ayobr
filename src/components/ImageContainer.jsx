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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getImageDimensions = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(`${img.width}x${img.height}`);
      img.onerror = () => resolve('Unknown');
      img.src = URL.createObjectURL(file);
    });
  };

  const [imageDimensions, setImageDimensions] = React.useState('');

  React.useEffect(() => {
    if (image) {
      getImageDimensions(image).then(setImageDimensions);
    }
  }, [image]);

  return (
    <motion.div
      className="relative rounded-2xl transition-all duration-300 group"
      draggable={!!image}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      whileHover={{ scale: image ? 1.01 : 1 }}
      title={image ? `${image.name} • ${imageDimensions} • ${formatFileSize(image.size)}` : undefined}
      style={image ? {
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        padding: '20px',
        height: '136px',
        minHeight: '136px',
        maxHeight: '136px'
      } : {
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.4) 0%, rgba(30, 41, 59, 0.3) 100%)',
        backdropFilter: 'blur(4px)',
        border: '2px dashed rgba(107, 114, 128, 0.3)',
        padding: '20px',
        height: '136px',
        minHeight: '136px',
        maxHeight: '136px'
      }}
    >
      {image ? (
        <div className="relative h-full w-full overflow-hidden rounded-lg">
          {/* Full container image */}
          <img
            src={imageUrl}
            alt={image.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback for HEIC files that might not display
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="hidden w-full h-full items-center justify-center bg-gray-800/50">
            <div className="text-center">
              <svg className="w-8 h-8 mx-auto text-blue-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-xs text-gray-400">Image Preview</p>
              <p className="text-xs text-gray-500">{image.name.split('.').pop()?.toUpperCase()}</p>
            </div>
          </div>

          {/* Hover overlay with filename */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-6 h-6 mx-auto text-neon-cyan mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              <p className="text-white text-sm font-medium truncate max-w-32">
                {image.name}
              </p>
            </div>
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
          <p className="text-xs text-gray-500 font-light">PNG, JPG, HEIC</p>
        </div>
      )}
    </motion.div>
  );
};

export default ImageContainer;
