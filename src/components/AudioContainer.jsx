import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import WaveSurfer from 'wavesurfer.js';

// Global reference to track currently playing audio
let currentlyPlayingWaveSurfer = null;

const AudioContainer = ({ audio, pairId, onMoveUp, onMoveDown, onDelete }) => {
  // Import updatePair from store
  const { updatePair } = require('../store/appStore').useAppStore();
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isContentChanging, setIsContentChanging] = useState(false);
  const [previousAudio, setPreviousAudio] = useState(null);
  const containerRef = useRef(null);

  

  

  React.useEffect(() => {
    // Only initialize WaveSurfer if we're not in the middle of a content change
    if (audio && waveformRef.current && !isContentChanging) {
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

  const handleFileDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const audioFile = files.find(file => file.type.startsWith('audio/'));

    if (audioFile) {
      updatePair(pairId, { audio: audioFile });
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

  return (
    <motion.div
      ref={containerRef}
      className="relative w-full h-full transition-all duration-300 group cursor-pointer audio-container"
      data-pair-id={pairId}
      data-audio-container="true"
      whileHover={{ scale: audio ? 1.005 : 1 }}
      title={audio ? `${audio.name} • ${formatTime(duration)} • ${formatFileSize(audio.size)}` : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleFileDrop}
      style={{
        background: audio ? 'rgba(15, 23, 42, 0.6)' : '#040608',
        borderRadius: '8px',
        border: audio ? '1px solid rgba(75, 85, 99, 0.4)' : '1px solid rgba(75, 85, 99, 0.3)',
        padding: audio ? '16px' : '20px',
        height: '136px',
        minHeight: '136px',
        maxHeight: '136px'
      }}
    >
      {audio ? (
        <div className="w-full h-full flex flex-col justify-between relative">
          {/* Top header bar with title (center) and delete button (right) */}
          <div className="flex items-center justify-between mb-3">
            {/* File title - centered */}
            <span className="text-white text-sm font-medium truncate text-center flex-1">
              {audio.name.replace(/\.[^/.]+$/, "")}
            </span>

            {/* Delete button - top right */}
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 opacity-70 hover:opacity-100 z-10"
              style={{
                backgroundColor: 'rgba(220, 38, 38, 0.15)',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                color: '#DC2626'
              }}
              title="Delete audio"
              onClick={() => {
                if (wavesurfer.current) {
                  wavesurfer.current.pause();
                }
                if (onDelete) {
                  onDelete();
                }
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Waveform */}
          <div className="flex-1 flex items-start">
            <div 
              ref={waveformRef}
              className="w-full cursor-pointer"
              style={{ height: '60px' }}
            />
          </div>

          {/* Play button and time information */}
          <div className="flex items-center justify-between" style={{ marginTop: '20px' }}>
            <div className="text-xs text-gray-400">
              {formatTime(currentTime)}
            </div>

            {/* Play/pause button - centered */}
            <button
              onClick={handlePlayPause}
              className="w-16 h-12 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                backgroundColor: isPlaying ? '#3584E4' : 'rgba(53, 132, 228, 0.15)',
                border: `2px solid ${isPlaying ? '#3584E4' : 'rgba(53, 132, 228, 0.4)'}`,
                borderRadius: '10px',
                color: isPlaying ? 'white' : '#3584E4',
                transform: 'translateY(10px)'
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

            <div className="text-xs text-gray-400">
              {formatTime(duration)}
            </div>
          </div>

          {/* Up/Down Arrow Controls - Bottom Right, visible only on hover */}
          {isHovered && (
            <div className="absolute bottom-3 right-3 flex flex-col space-y-1">
              {/* Up Arrow */}
              <button
                onClick={() => onMoveUp && onMoveUp(pairId)}
                className="w-6 h-6 rounded flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                style={{
                  backgroundColor: 'rgba(53, 132, 228, 0.15)',
                  border: '1px solid rgba(53, 132, 228, 0.3)',
                  color: '#3584E4'
                }}
                title="Move up"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 14l5-5 5 5z"/>
                </svg>
              </button>
              
              {/* Down Arrow */}
              <button
                onClick={() => onMoveDown && onMoveDown(pairId)}
                className="w-6 h-6 rounded flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                style={{
                  backgroundColor: 'rgba(53, 132, 228, 0.15)',
                  border: '1px solid rgba(53, 132, 228, 0.3)',
                  color: '#3584E4'
                }}
                title="Move down"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 10l5 5 5-5z"/>
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