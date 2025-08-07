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
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '24px',
        backgroundImage: 'url("/noise.png")',
        backgroundBlendMode: 'soft-light',
        backgroundSize: '150px 150px',
        backgroundRepeat: 'repeat',
        padding: image ? '16px' : '20px',
        height: '160px',
        minHeight: '160px',
        maxHeight: '160px',
        overflow: 'visible',
        border: '1px solid rgba(128, 128, 128, 0.5)',
        boxShadow: `
          0 0 0 2px rgba(255, 255, 255, 0.1),
          0 0 20px rgba(0, 0, 0, 0.15)
        `,
        marginBottom: '16px',
      }}
      data-pair-id={pairId}
      data-image-container="true"
      whileHover={{ scale: 1.005 }}
      title={image ? `${image.name} • ${imageDimensions} • ${formatFileSize(image.size)}` : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleFileDrop}
    >
      {image ? (
        <div className="w-full h-full flex flex-col justify-between relative z-10">
          {/* Top header bar with controls - matching audio container layout */}
          <div className="flex items-center justify-between mb-4 relative" style={{ marginTop: '-2px' }}>
            {/* Move Handle - Left side, aligned with audio container */}
            {isHovered && image && onStartImageDrag && (
              <button
                className="w-5 h-5 rounded flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 movehandle flex-shrink-0"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'rgba(255, 255, 255, 0.7)'
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
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13,11H18L16.5,9.5L17.92,8.08L21.84,12L17.92,15.92L16.5,14.5L18,13H13V18L14.5,16.5L15.92,17.92L12,21.84L8.08,17.92L9.5,16.5L11,18V13H6L7.5,14.5L6.08,15.92L2.16,12L6.08,8.08L7.5,9.5L6,11H11V6L9.5,7.5L8.08,6.08L12,2.16L15.92,6.08L14.5,7.5L13,6V11Z"/>
              </svg>
              </button>
            )}

            {/* File title - Always centered, independent of move button */}
            <div className="absolute inset-x-0 flex justify-center pointer-events-none">
              <span className="text-white text-body-text font-medium truncate text-center drop-shadow-lg">
                {image.name.replace(/\.[^/.]+$/, "")}
              </span>
            </div>

            {/* Delete button - Right side, aligned with audio container */}
            <button
              className="w-5 h-5 rounded flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100 flex-shrink-0"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'rgba(255, 255, 255, 0.7)'
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
          </div>

          {/* Perfectly centered image preview - takes remaining space */}
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <img
              src={imageUrl}
              alt={image.name}
              className="object-contain rounded-lg"
              style={{
                width: '142%',
                height: '142%',
                maxWidth: '142%',
                maxHeight: '142%'
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full relative z-10">
          <div 
            className="p-4 rounded-full mb-4 bg-white/10 backdrop-blur-sm border border-white/20"
          >
            <svg className="w-8 h-8 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-white mb-1 text-center drop-shadow-lg">Drop image file here</p>
          <p className="text-xs text-white/70 font-light text-center drop-shadow-sm pl-6 pr-7 py-1 rounded-full bg-white/5 backdrop-blur-sm" style={{ marginLeft: '-2px' }}>PNG,<span style={{ marginLeft: '-2px' }}>JPG</span>, HEIC</p>
        </div>
      )}
    </motion.div>
  );
};

export default ImageContainer;