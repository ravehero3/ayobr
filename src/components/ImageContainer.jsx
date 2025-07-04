import React, { useState, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { motion } from 'framer-motion';

const ImageContainer = ({ image, pairId, onMoveUp, onMoveDown, onDelete, onSwap, onStartImageDrag, onUpdateDragPosition, onEndDrag }) => {
  const { updatePair } = useAppStore();
  const [imageUrl, setImageUrl] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef(null);

  React.useEffect(() => {
    if (image) {
      const url = URL.createObjectURL(image);
      setImageUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [image]);

  const handleFileDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (imageFile) {
      updatePair(pairId, { image: imageFile });
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
      ref={containerRef}
      className="relative w-full h-full transition-all duration-300 group cursor-pointer image-container"
      data-pair-id={pairId}
      data-image-container="true"
      whileHover={{ scale: image ? 1.005 : 1 }}
      title={image ? `${image.name} • ${imageDimensions} • ${formatFileSize(image.size)}` : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleFileDrop}
      style={{
        background: image ? '#1A1A1A' : '#1A1A1A',
        borderRadius: '12px',
        border: image ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.1)',
        padding: image ? '16px' : '20px',
        height: '180px',
        minHeight: '180px',
        maxHeight: '180px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
      }}
    >
      {image ? (
        <div className="w-full h-full flex flex-col relative">
          {/* Top spacing - exactly 10px */}
          <div style={{ height: '10px', flexShrink: 0 }}></div>
          
          {/* Image preview - takes remaining space minus button area */}
          <div className="flex-1 flex items-center justify-center" style={{ minHeight: '0' }}>
            <div className="relative overflow-hidden rounded flex-shrink-0" style={{ transform: 'scale(1.8)' }}>
              <img
                src={imageUrl}
                alt={image.name}
                className="w-20 h-20 object-contain"
                style={{
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                }}
              />
            </div>
          </div>

          {/* Bottom spacing - exactly 10px */}
          <div style={{ height: '10px', flexShrink: 0 }}></div>

          {/* Delete button - positioned at top right */}
          <button
            className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100 z-10"
            style={{
              backgroundColor: 'rgba(220, 38, 38, 0.15)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              color: '#DC2626'
            }}
            title="Delete image"
            onClick={() => {
              if (onDelete) {
                onDelete();
              }
            }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Move Handle - Top Left, visible only on hover */}
          {isHovered && image && onStartImageDrag && (
            <div className="absolute top-3 left-3 z-20">
              <button
                className="w-8 h-8 rounded flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 hover:shadow-glow movehandle"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white'
                }}
                title="Drag to swap with other image containers"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  // Start the new drag system
                  const initialMousePosition = { x: e.clientX, y: e.clientY };
                  onStartImageDrag(image, initialMousePosition);
                  
                  const handleMouseMove = (moveEvent) => {
                    onUpdateDragPosition({ x: moveEvent.clientX, y: moveEvent.clientY });
                  };
                  
                  const handleMouseUp = (upEvent) => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                    
                    // Check for valid drop target
                    const elementsUnder = document.elementsFromPoint(upEvent.clientX, upEvent.clientY);
                    const targetImageContainer = elementsUnder.find(el => 
                      el.closest('[data-image-container="true"]') && 
                      el.closest('[data-image-container="true"]') !== containerRef.current
                    );
                    
                    let targetFound = false;
                    if (targetImageContainer) {
                      const targetPairId = targetImageContainer.closest('[data-pair-id]')?.getAttribute('data-pair-id');
                      if (targetPairId && onSwap) {
                        onSwap(pairId, targetPairId, 'image');
                        targetFound = true;
                      }
                    }
                    
                    onEndDrag(targetFound);
                  };
                  
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              >
                {/* 4-way arrow/plus drag icon */}
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13,11H18L16.5,9.5L17.92,8.08L21.84,12L17.92,15.92L16.5,14.5L18,13H13V18L14.5,16.5L15.92,17.92L12,21.84L8.08,17.92L9.5,16.5L11,18V13H6L7.5,14.5L6.08,15.92L2.16,12L6.08,8.08L7.5,9.5L6,11H11V6L9.5,7.5L8.08,6.08L12,2.16L15.92,6.08L14.5,7.5L13,6V11Z"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-gray-300">
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
          <p className="text-sm font-medium text-gray-300 mb-1 text-center">Drop image file here</p>
          <p className="text-xs text-gray-500 font-light text-center">PNG, JPG, HEIC</p>
        </div>
      )}
    </motion.div>
  );
};

export default ImageContainer;