
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const ImageContainerCopy = ({ image, isVisible, mousePosition, shouldReturnToOrigin = false }) => {
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    if (image && isVisible) {
      const url = URL.createObjectURL(image);
      setImageUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [image, isVisible]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isVisible || !image) return null;

  return (
    <motion.div
      className="imagecontainercopy pointer-events-none"
      style={{
        position: 'fixed',
        left: `${mousePosition.x - 16}px`,
        top: `${mousePosition.y - 16}px`,
        width: '500px',
        height: '160px',
        padding: '16px',
        zIndex: 999999,
        minHeight: '160px',
        maxHeight: '160px',
        // Match the original container styling exactly
        background: 'rgba(0, 0, 0, 0.3)',
        backgroundImage: 'none',
        borderRadius: '24px',
        border: '1px solid rgba(128, 128, 128, 0.5)',
        boxShadow: `
          0 0 20px rgba(0, 0, 0, 0.15)
        `,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
      initial={{ scale: 1, rotate: 0 }}
      animate={{ 
        scale: shouldReturnToOrigin ? 0.8 : 1.05, 
        rotate: shouldReturnToOrigin ? 0 : 0,
        opacity: shouldReturnToOrigin ? 0 : 0.95
      }}
      transition={{ 
        duration: shouldReturnToOrigin ? 0.3 : 0.2,
        ease: shouldReturnToOrigin ? [0.4, 0, 0.2, 1] : [0.25, 0.46, 0.45, 0.94]
      }}
    >
      <div className="w-full h-full flex flex-col relative">
        {/* Top spacing - exactly 10px */}
        <div style={{ height: '10px', flexShrink: 0 }}></div>

        {/* Move Handle - Bottom Left matching original */}
        <div className="absolute bottom-2 left-2 z-20">
          <div
            className="w-5 h-5 rounded flex items-center justify-center transition-all duration-200"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'rgba(255, 255, 255, 0.8)'
            }}
          >
            {/* 4-way arrow/plus drag icon */}
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13,11H18L16.5,9.5L17.92,8.08L21.84,12L17.92,15.92L16.5,14.5L18,13H13V18L14.5,16.5L15.92,17.92L12,21.84L8.08,17.92L9.5,16.5L11,18V13H6L7.5,14.5L6.08,15.92L2.16,12L6.08,8.08L7.5,9.5L6,11H11V6L9.5,7.5L8.08,6.08L12,2.16L15.92,6.08L14.5,7.5L13,6V11Z"/>
            </svg>
          </div>
        </div>

        {/* Image preview area */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative overflow-hidden rounded flex-shrink-0" style={{ transform: 'scale(1.8)' }}>
            <img
              src={imageUrl}
              alt={image.name}
              className="w-20 h-20 object-contain"
              style={{
                borderRadius: '4px',
              }}
            />
          </div>
        </div>

        {/* Bottom spacing - exactly 10px */}
        <div style={{ height: '10px', flexShrink: 0 }}></div>
      </div>
    </motion.div>
  );
};

export default ImageContainerCopy;
