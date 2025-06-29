import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import WaveSurfer from 'wavesurfer.js';

const AudioContainer = ({ audio, pairId, onSwap, draggedItem, onDragStart, onDragEnd }) => {
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (audio && waveformRef.current) {
      // Initialize WaveSurfer with exactly 40 bars
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#1E90FF',
        progressColor: '#00CFFF',
        cursorColor: '#FFFFFF',
        barWidth: 6,
        barRadius: 3,
        barGap: 3,
        height: 60,
        normalize: true,
        backend: 'WebAudio',
        interact: true,
        barMinHeight: 2
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

      wavesurfer.current.on('play', () => setIsPlaying(true));
      wavesurfer.current.on('pause', () => setIsPlaying(false));

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
      wavesurfer.current.playPause();
    }
  };

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move';
    onDragStart({ type: 'audio', pairId, data: audio });
  };

  const handleDragOver = (e) => {
    if (draggedItem?.type === 'audio') {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
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

  return (
    <motion.div
      className={`relative rounded-2xl transition-all duration-300 group ${
        audio 
          ? `${isPlaying ? 'ring-2 ring-blue-400/50' : ''}`
          : ''
      }`}
      draggable={!!audio}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      whileHover={{ scale: audio ? 1.01 : 1 }}
      title={audio ? `${audio.name} • ${formatTime(duration)} • ${formatFileSize(audio.size)}` : undefined}
      style={audio ? {
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        boxShadow: isPlaying 
          ? '0 0 30px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          : '0 8px 24px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        padding: '20px'
      } : {
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.4) 0%, rgba(30, 41, 59, 0.3) 100%)',
        backdropFilter: 'blur(4px)',
        border: '2px dashed rgba(107, 114, 128, 0.3)',
        padding: '20px'
      }}
    >
      {audio ? (
        <div className="space-y-3">
          {/* Audio info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-neon-blue" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12a7.971 7.971 0 00-1.343-4.243 1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span className="text-white text-sm font-medium truncate max-w-32">
                {audio.name}
              </span>
            </div>
            <span className="text-gray-400 text-xs">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Waveform */}
          <div 
            ref={waveformRef}
            className="w-full cursor-pointer"
          />

          {/* Controls */}
          <div className="flex items-center justify-center mt-4">
            <button
              onClick={handlePlayPause}
              className="group p-3 rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(147, 51, 234, 0.15) 100%)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                boxShadow: '0 4px 16px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              }}
            >
              {isPlaying ? (
                <svg className="w-5 h-5 text-white group-hover:text-blue-200 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white group-hover:text-blue-200 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-gray-300">
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
          <p className="text-sm font-medium text-gray-300 mb-1">Drop audio file here</p>
          <p className="text-xs text-gray-500 font-light">MP3, WAV</p>
        </div>
      )}
    </motion.div>
  );
};

export default AudioContainer;
