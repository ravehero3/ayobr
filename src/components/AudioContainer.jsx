import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import WaveSurfer from 'wavesurfer.js';

// Global reference to track currently playing audio
let currentlyPlayingWaveSurfer = null;

const AudioContainer = ({ audio, pairId, onSwap, draggedItem, onDragStart, onDragEnd, isContainerDragMode, draggedContainerType, onContainerDragStart, onContainerDragEnd }) => {
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (audio && waveformRef.current) {
      // Initialize WaveSurfer with Decibels-style waveform
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#6C737F', // Muted gray for unplayed portions (like Decibels)
        progressColor: '#3584E4', // GNOME blue for played portions
        cursorColor: 'rgba(53, 132, 228, 0.6)',
        barWidth: 2,
        barRadius: 1,
        barGap: 1,
        height: 80, // Taller for prominence like Decibels
        normalize: true,
        backend: 'WebAudio',
        interact: true,
        barMinHeight: 1,
        responsive: true
      });

      // Load audio file
      const url = URL.createObjectURL(audio);
      wavesurfer.current.load(url);

      // Event listeners
      wavesurfer.current.on('ready', () => {
        setDuration(wavesurfer.current.getDuration());
      });

      wavesurfer.current.on('audioprocess', () => {
        setCurrentTime(wavesurfer.current.getCurrentTime());
      });

      wavesurfer.current.on('play', () => {
        setIsPlaying(true);
        currentlyPlayingWaveSurfer = wavesurfer.current;
      });
      wavesurfer.current.on('pause', () => {
        setIsPlaying(false);
        if (currentlyPlayingWaveSurfer === wavesurfer.current) {
          currentlyPlayingWaveSurfer = null;
        }
      });

      return () => {
        if (wavesurfer.current) {
          wavesurfer.current.destroy();
        }
        URL.revokeObjectURL(url);
      };
    }
  }, [audio]);

  const handlePlayPause = () => {
    if (wavesurfer.current) {
      // Stop any currently playing audio
      if (currentlyPlayingWaveSurfer && currentlyPlayingWaveSurfer !== wavesurfer.current) {
        currentlyPlayingWaveSurfer.pause();
      }

      // Play/pause this audio
      wavesurfer.current.playPause();

      // Update the global reference
      if (!wavesurfer.current.isPlaying()) {
        currentlyPlayingWaveSurfer = wavesurfer.current;
      } else {
        currentlyPlayingWaveSurfer = null;
      }
    }
  };

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
    onDragStart({ type: 'audio', pairId, data: audio });
  };

  const handleDragEnd = (e) => {
    setIsDragging(false);
    onDragEnd();
  };

  const handleDragOver = (e) => {
    // Allow dropping audio on any audio container (including empty ones)
    if (draggedItem?.type === 'audio' && draggedItem.pairId !== pairId) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (draggedItem?.type === 'audio' && draggedItem.pairId !== pairId) {
      onSwap(draggedItem.pairId, pairId, 'audio');
    }
  };

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

  const handleMoveButtonClick = (e) => {
    e.stopPropagation();
    onContainerDragStart?.('audio');
  };



  return (
    <motion.div
      className="relative w-full h-full transition-all duration-300 group cursor-pointer"
      draggable={!!audio}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      whileHover={{ scale: audio ? 1.005 : 1 }}
      title={audio ? `${audio.name} • ${formatTime(duration)} • ${formatFileSize(audio.size)}` : undefined}
      style={{
        pointerEvents: 'auto',
        userSelect: 'none',
        background: audio ? 'rgba(15, 23, 42, 0.6)' : '#040608', // Dark theme adapted
        borderRadius: '8px',
        border: isDragOver 
          ? '3px solid rgba(34, 197, 94, 0.8)' // Stronger green border when valid drop target
          : (isContainerDragMode && draggedContainerType === 'audio')
          ? '3px solid rgba(16, 185, 129, 0.8)' // Green glow when container drag mode is active for audio
          : audio ? '1px solid rgba(53, 132, 228, 0.3)' : '1.5px solid rgba(30, 144, 255, 0.3)',
        boxShadow: isDragging
          ? '0 0 0 3px rgba(59, 130, 246, 0.8), 0 0 40px rgba(59, 130, 246, 0.6), 0 20px 60px rgba(0, 0, 0, 0.4)'
          : isDragOver
          ? '0 0 0 2px rgba(34, 197, 94, 0.6), 0 0 30px rgba(34, 197, 94, 0.5), inset 0 0 20px rgba(34, 197, 94, 0.1)'
          : (isContainerDragMode && draggedContainerType === 'audio')
          ? '0 0 0 2px rgba(16, 185, 129, 0.6), 0 0 30px rgba(16, 185, 129, 0.5), 0 0 60px rgba(16, 185, 129, 0.3), inset 0 0 20px rgba(16, 185, 129, 0.1)'
          : audio 
            ? '0 0 0 1px rgba(53, 132, 228, 0.2), 0 0 20px rgba(53, 132, 228, 0.1)'
            : `
            0 0 0 1px rgba(30, 144, 255, 0.15),
            0 0 8px rgba(30, 144, 255, 0.2),
            0 0 15px rgba(0, 207, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.02)
          `,
        padding: audio ? '16px' : '20px',
        height: '136px',
        minHeight: '136px',
        maxHeight: '136px',
        transform: isDragging 
          ? 'scale(1.05) translateY(-8px) rotate(2deg)' 
          : isDragOver 
          ? 'scale(1.02)' 
          : 'scale(1)',
        opacity: isDragging ? 0.8 : 1,
        transition: 'all 0.2s ease-in-out',
        zIndex: isDragging ? 1000 : 1
      }}
    >
      {/* Drag and Drop Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-green-500/20 rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
            <p className="text-green-400 font-semibold text-sm">Drop to Swap Audio</p>
          </div>
        </div>
      )}

      {audio ? (
        <div className="w-full h-full flex flex-col justify-between relative">
          {/* Header with filename and time */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white text-sm font-medium truncate">
                {audio.name.replace(/\.[^/.]+$/, "")} {/* Remove file extension like Decibels */}
              </span>
            </div>
            <div className="text-xs text-gray-400 flex-shrink-0">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Large Waveform - The centerpiece like in Decibels */}
          <div className="flex-1 flex items-center">
            <div 
              ref={waveformRef}
              className="w-full cursor-pointer"
              style={{ height: '60px' }}
            />
          </div>

          {/* Bottom controls - Large play button like Decibels */}
          <div className="flex items-center justify-center mt-2">
            {/* Play button - centered */}
            <button
              onClick={handlePlayPause}
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                backgroundColor: isPlaying ? '#3584E4' : 'rgba(53, 132, 228, 0.15)',
                border: `2px solid ${isPlaying ? '#3584E4' : 'rgba(53, 132, 228, 0.4)'}`,
                boxShadow: isPlaying 
                  ? '0 0 20px rgba(53, 132, 228, 0.4)'
                  : '0 0 10px rgba(53, 132, 228, 0.2)',
                color: isPlaying ? 'white' : '#3584E4'
              }}
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="m7 4 10 6L7 16V4z"/>
                </svg>
              )}
            </button>
          </div>

          {/* Move button - positioned at bottom left */}
          <button
            className="absolute bottom-3 left-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 opacity-60 hover:opacity-100 z-10"
            style={{
              backgroundColor: (isContainerDragMode && draggedContainerType === 'audio') ? 'rgba(16, 185, 129, 0.25)' : 'rgba(53, 132, 228, 0.15)',
              border: (isContainerDragMode && draggedContainerType === 'audio') ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(53, 132, 228, 0.3)',
              color: (isContainerDragMode && draggedContainerType === 'audio') ? '#10B981' : '#3584E4'
            }}
            title="Click to activate drag mode for audio containers"
            onClick={handleMoveButtonClick}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
            </svg>
          </button>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-300 mb-1 text-center">Drop audio file here</p>
          <p className="text-xs text-gray-500 font-light text-center">MP3, WAV</p>
        </div>
      )}
    </motion.div>
  );
};

export default AudioContainer;