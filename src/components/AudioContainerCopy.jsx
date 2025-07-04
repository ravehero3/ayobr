import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const AudioContainerCopy = ({ audio, isVisible, mousePosition, shouldReturnToOrigin = false }) => {
  const waveformRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Create a static waveform display (non-interactive)
  useEffect(() => {
    if (audio && waveformRef.current && isVisible) {
      // Create a simple canvas-based waveform for the copy
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const container = waveformRef.current;
      
      canvas.width = container.clientWidth;
      canvas.height = 80;
      canvas.style.width = '100%';
      canvas.style.height = '80px';
      
      // Clear container and add canvas
      container.innerHTML = '';
      container.appendChild(canvas);
      
      // Draw a simple waveform representation
      ctx.fillStyle = '#6C737F';
      const barWidth = 2;
      const barGap = 1;
      const totalWidth = canvas.width;
      const numBars = Math.floor(totalWidth / (barWidth + barGap));
      
      for (let i = 0; i < numBars; i++) {
        const x = i * (barWidth + barGap);
        const height = Math.random() * 60 + 20; // Random height between 20-80
        const y = (80 - height) / 2;
        
        ctx.fillRect(x, y, barWidth, height);
      }
      
      // Get audio duration
      const audioElement = new Audio();
      audioElement.src = URL.createObjectURL(audio);
      audioElement.addEventListener('loadedmetadata', () => {
        setDuration(audioElement.duration);
      });
    }
  }, [audio, isVisible]);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isVisible || !audio) return null;

  return (
    <motion.div
      className="audiocontainercopy pointer-events-none"
      initial={{ scale: 1, rotate: 0 }}
      animate={{ 
        scale: shouldReturnToOrigin ? 0.8 : 1.02, 
        rotate: shouldReturnToOrigin ? 0 : 2,
        opacity: shouldReturnToOrigin ? 0 : 1
      }}
      transition={{ 
        duration: shouldReturnToOrigin ? 0.3 : 0.2,
        ease: shouldReturnToOrigin ? "easeOut" : "easeInOut"
      }}
      style={{
        position: 'fixed',
        left: mousePosition.x - 250, // Center the 500px wide container
        top: mousePosition.y - 68, // Center the 136px tall container
        width: '500px',
        height: '136px',
        background: 'rgba(15, 23, 42, 0.95)',
        borderRadius: '8px',
        border: '2px solid rgba(53, 132, 228, 0.8)',
        padding: '16px',
        zIndex: 999999,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(53, 132, 228, 0.4)',
        backdropFilter: 'blur(8px)'
      }}
    >
      <div className="w-full h-full flex flex-col justify-between relative">
        {/* Top header bar with title */}
        <div className="flex items-center justify-center mb-3">
          <span className="text-white text-sm font-medium truncate text-center">
            {audio.name.replace(/\.[^/.]+$/, "")}
          </span>
        </div>

        {/* Waveform */}
        <div className="flex-1 flex items-start">
          <div 
            ref={waveformRef}
            className="w-full"
            style={{ height: '60px' }}
          />
        </div>

        {/* Play button and time information */}
        <div className="flex items-center justify-between" style={{ marginTop: '20px' }}>
          <div className="text-xs text-gray-400">
            {formatTime(currentTime)}
          </div>

          {/* Static play button */}
          <div
            className="w-16 h-12 flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(53, 132, 228, 0.15)',
              border: '2px solid rgba(53, 132, 228, 0.4)',
              borderRadius: '10px',
              color: '#3584E4',
              transform: 'translateY(10px)'
            }}
          >
            <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="m7 4 10 6L7 16V4z"/>
            </svg>
          </div>

          <div className="text-xs text-gray-400">
            {formatTime(duration)}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AudioContainerCopy;