import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const ImageContainerCopy = ({ image, isVisible, mousePosition }) => {
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
      initial={{ scale: 1, rotate: 0 }}
      animate={{ scale: 1.02, rotate: 2 }}
      style={{
        position: 'fixed',
        left: mousePosition.x - 250, // Center the 500px wide container
        top: mousePosition.y - 90, // Center the 180px tall container
        width: '500px',
        height: '180px',
        background: 'rgba(15, 23, 42, 0.95)',
        borderRadius: '8px',
        border: '2px solid rgba(53, 132, 228, 0.8)',
        padding: '16px',
        zIndex: 999999,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(53, 132, 228, 0.4)',
        backdropFilter: 'blur(8px)'
      }}
    >
      <div className="w-full h-full flex flex-col relative">
        {/* Top spacing - exactly 10px */}
        <div style={{ height: '10px', flexShrink: 0 }}></div>
        
        {/* Image preview - takes remaining space */}
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
      </div>
    </motion.div>
  );
};

export default ImageContainerCopy;