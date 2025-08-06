import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import WaveSurfer from 'wavesurfer.js';
import DotLoader from './DotLoader';

// Global reference to track currently playing audio
let currentlyPlayingWaveSurfer = null;

const AudioContainer = ({ audio, pairId, onMoveUp, onMoveDown, onDelete, onSwap, onStartAudioDrag, onUpdateDragPosition, onEndDrag }) => {
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
  const [isWaveformLoading, setIsWaveformLoading] = useState(false);
  const containerRef = useRef(null);





  useEffect(() => {
    if (audio && containerRef.current && !isContentChanging) {
      const loadAudio = async () => {
        try {
          if (wavesurfer.current) {
            wavesurfer.current.destroy();
          }

          // Create blob URL for audio file to prevent fetch errors
          const audioBlob = new Blob([audio], { type: audio.type });
          const audioUrl = URL.createObjectURL(audioBlob);

          const ws = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: '#6C737F', // Muted gray for unplayed portions (like Decibels)
            progressColor: '#60A5FA', // Blue for played portions
            cursorColor: 'rgba(96, 165, 250, 0.6)',
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

          await ws.load(audioUrl);
          setDuration(ws.getDuration());
          wavesurfer.current = ws;

          // Clean up blob URL when component unmounts
          return () => {
            if (audioUrl) {
              URL.revokeObjectURL(audioUrl);
            }
          };
        } catch (error) {
          console.error("Error loading audio:", error);
          setIsWaveformLoading(false);
        } finally {
          setIsWaveformLoading(false);
        }
      };

      loadAudio();
    }

    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
      }
    };
  }, [audio, isContentChanging]);

  const handlePlayPause = () => {
    if (wavesurfer.current) {
      // Stop any currently playing audio BEFORE starting this one
      if (currentlyPlayingWaveSurfer && currentlyPlayingWaveSurfer !== wavesurfer.current) {
        currentlyPlayingWaveSurfer.pause();
      }

      // Play/pause this audio
      wavesurfer.current.playPause();

      // Update the global reference based on the new state
      if (wavesurfer.current.isPlaying()) {
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
      className="relative w-full h-full transition-all duration-300 group cursor-pointer audio-container glass-container"
      data-pair-id={pairId}
      data-audio-container="true"
      whileHover={{ scale: audio ? 1 : 1 }}
      title={audio ? `${audio.name} • ${formatTime(duration)} • ${formatFileSize(audio.size)}` : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleFileDrop}
      style={{
        padding: audio ? '16px' : '20px',
        height: '160px',
        minHeight: '160px',
        maxHeight: '160px',
        overflow: 'visible',
      }}
    >
      {audio ? (
        <div className="w-full h-full flex flex-col justify-between relative z-10">
          {/* Top header bar with title (center) and controls */}
          <div className="flex items-center justify-between mb-4 relative" style={{ marginTop: '-2px' }}>
            {/* Move Handle - Left side, aligned with title */}
            {isHovered && audio && onStartAudioDrag && (
              <button
                className="w-5 h-5 rounded flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 movehandle flex-shrink-0"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'rgba(255, 255, 255, 0.7)'
                }}
                title="Drag to swap with other audio containers"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  // Start the new drag system
                  const initialMousePosition = { x: e.clientX, y: e.clientY };
                  onStartAudioDrag(audio, initialMousePosition);

                  const handleMouseMove = (moveEvent) => {
                    onUpdateDragPosition({ x: moveEvent.clientX, y: moveEvent.clientY });
                  };

                  const handleMouseUp = (upEvent) => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);

                    // Check for valid drop target
                    const elementsUnder = document.elementsFromPoint(upEvent.clientX, upEvent.clientY);
                    const targetAudioContainer = elementsUnder.find(el => 
                      el.closest('[data-audio-container="true"]') && 
                      el.closest('[data-audio-container="true"]') !== containerRef.current
                    );

                    let targetFound = false;
                    if (targetAudioContainer) {
                      const targetPairId = targetAudioContainer.closest('[data-pair-id]')?.getAttribute('data-pair-id');
                      if (targetPairId && onSwap) {
                        onSwap(pairId, targetPairId, 'audio');
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
                {audio.name.replace(/\.[^/.]+$/, "")}
              </span>
            </div>

            {/* Delete button - Right side, aligned with title */}
            <button
              className="w-5 h-5 rounded flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100 flex-shrink-0"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'rgba(255, 255, 255, 0.7)'
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
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Waveform */}
          <div className="flex-1 flex items-start">
            <div 
              ref={waveformRef}
              className="w-full cursor-pointer relative z-10 bg-black/20 rounded-lg p-2 backdrop-blur-sm"
              style={{ height: '60px' }}
            >
              {/* Loading animation */}
              {isWaveformLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <svg 
                    className="w-8 h-8 text-white animate-pulse" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M2 10v3"/>
                    <path d="M6 6v11"/>
                    <path d="M10 3v18"/>
                    <path d="M14 8v7"/>
                    <path d="M18 5v13"/>
                    <path d="M22 10v3"/>
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Play button and time information */}
          <div className="flex items-center justify-between relative z-10" style={{ marginTop: '20px' }}>
            <div className="text-xs text-white bg-black/30 px-2 py-1 rounded backdrop-blur-sm">
              {formatTime(currentTime)}
            </div>

            {/* Play/pause button - centered */}
            <button
              onClick={handlePlayPause}
              className="w-8 h-8 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
              style={{
                color: 'rgba(255, 255, 255, 0.9)'
              }}
            >
              {isPlaying ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <polygon points="6 3 20 12 6 21 6 3"/>
                </svg>
              )}
            </button>

            <div className="text-xs text-white bg-black/30 px-2 py-1 rounded backdrop-blur-sm">
              {formatTime(duration)}
            </div>
          </div>


        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full relative z-10">
          <div 
            className="p-4 rounded-full mb-4 bg-white/10 backdrop-blur-sm border border-white/20"
          >
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2 12h2v2H2zm4-2h2v6H6zm4-4h2v12h-2zm4 2h2v8h-2zm4-4h2v16h-2z"/>
            </svg>
          </div>
          <p className="text-body-text text-white mb-1 text-center drop-shadow-lg">Drop audio file here</p>
          <p className="text-small-notes text-white/70 font-light text-center drop-shadow-sm px-6 py-1 rounded-full bg-white/5 backdrop-blur-sm">MP3, WAV</p>
        </div>
      )}
    </motion.div>
  );
};

export default AudioContainer;