import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import WaveSurfer from 'wavesurfer.js';

// Global reference to track currently playing audio
let currentlyPlayingWaveSurfer = null;

const AudioContainer = ({ audio, pairId, onSwap, draggedItem, onDragStart, onDragEnd, isContainerDragMode, draggedContainerType, draggedContainer, onContainerDragStart, onContainerDragEnd, onDelete, isDraggingContainer, shouldShowGlow }) => {
  // Import updatePair from store
  const { updatePair } = require('../store/appStore').useAppStore();
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isContainerDragging, setIsContainerDragging] = useState(false);
  const [isDraggingWithMouse, setIsDraggingWithMouse] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Mouse tracking for drag visualization
  React.useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDragPosition({ 
          x: e.clientX - rect.width / 2, 
          y: e.clientY - rect.height / 2 
        });
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, [isDragging, pairId]);

  React.useEffect(() => {
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
    if (!audio) return;

    setIsDragging(true);
    const dragData = {
      type: 'audio',
      pairId: pairId,
      content: audio
    };
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';

    // Also store in sessionStorage for move button operations
    sessionStorage.setItem('currentDragData', JSON.stringify(dragData));

    if (onDragStart) {
      onDragStart(dragData);
    }
  };

  const handleDragEnd = (e) => {
    setIsDragging(false);
    onDragEnd();
  };

  const handleDragOver = (e) => {
    e.preventDefault();

    // Check if this is an audio drag from another container
    try {
      const types = Array.from(e.dataTransfer.types);
      if (types.includes('application/json')) {
        const dragData = JSON.parse(e.dataTransfer.getData('application/json') || '{}');
        if (dragData.type === 'audio' && dragData.pairId !== pairId && audio) {
          e.dataTransfer.dropEffect = 'move';
          setIsDragOver(true);
          return;
        }
      }
    } catch (error) {
      // Fallback to checking draggedItem state
      if (draggedItem?.type === 'audio' && draggedItem.pairId !== pairId && audio) {
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
        return;
      }
    }

    // Also allow file drops
    if (e.dataTransfer.types.includes('Files')) {
      e.dataTransfer.dropEffect = 'copy';
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

    // Handle audio swapping from drag data
    try {
      const types = Array.from(e.dataTransfer.types);
      if (types.includes('application/json')) {
        const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
        if (dragData.type === 'audio' && dragData.pairId !== pairId && audio) {
          if (onSwap) {
            onSwap(dragData.pairId, pairId, 'audio');
          }
          return;
        }
      }
    } catch (error) {
      console.error('Error parsing drag data:', error);
    }

    // Fallback to state-based swapping
    if (draggedItem?.type === 'audio' && draggedItem.pairId !== pairId && audio) {
      if (onSwap) {
        onSwap(draggedItem.pairId, pairId, 'audio');
      }
      return;
    }

    // Handle file drops
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

  const handleMoveButtonMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('Move button mouse down for audio container:', { type: 'individual-container', containerType: 'audio', pairId, content: { audio } });

    // Calculate offset to center the container on the cursor
    const rect = containerRef.current.getBoundingClientRect();
    const offset = {
      x: rect.width / 2,  // Half container width to center horizontally
      y: rect.height / 2  // Half container height to center vertically
    };
    setDragOffset(offset);

    // Set visual states
    setIsContainerDragging(true);
    setIsDraggingWithMouse(true);
    setMousePosition({ x: e.clientX, y: e.clientY });

    // Store drag data in sessionStorage for reliable access
    const dragData = {
      type: 'individual-container',
      containerType: 'audio',
      pairId: pairId,
      content: { audio }
    };
    sessionStorage.setItem('currentDragData', JSON.stringify(dragData));

    // Trigger container drag mode
    if (onContainerDragStart) {
      onContainerDragStart(pairId, 'start', { id: pairId, type: 'audio', audio });
    }

    // Add global mouse move and up listeners
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = (e) => {
      // Check if we're dropping on another audio container
      const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
      const audioContainer = elementBelow?.closest('[data-audio-container]');
      
      if (audioContainer) {
        const targetPairId = audioContainer.getAttribute('data-pair-id');
        if (targetPairId && targetPairId !== pairId) {
          console.log('Dropping on audio container:', targetPairId);
          if (onSwap) {
            onSwap(pairId, targetPairId, 'audio');
          }
        }
      }

      setIsContainerDragging(false);
      setIsDraggingWithMouse(false);
      sessionStorage.removeItem('currentDragData');
      
      // End container drag mode
      if (onContainerDragEnd) {
        onContainerDragEnd(pairId, 'end');
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Enhanced highlighting logic - show GREEN glow when:
  // 1. Another audio container is being dragged (container drag mode)
  // 2. This container has audio content (valid drop target)
  // 3. This is not the container being dragged
  const shouldHighlight = (isDraggingContainer && draggedContainerType === 'audio' && !!audio && draggedContainer?.id !== pairId) ||
    (draggedItem?.type === 'audio' && draggedItem.pairId !== pairId && !!audio) ||
    shouldShowGlow;

  const handleContainerDragOver = (e) => {
    // Allow container dropping when in container drag mode or when dragging audio
    if ((isContainerDragMode && draggedContainerType === 'audio') || 
        (draggedItem?.type === 'audio' && draggedItem.pairId !== pairId)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleContainerDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('AudioContainer drop detected', {
      isDraggingContainer,
      draggedContainerType,
      draggedContainerId: draggedContainer?.id,
      currentPairId: pairId,
      hasAudio: !!audio
    });

    // Handle container swapping when dropping on this audio container
    if (isDraggingContainer && draggedContainerType === 'audio' && draggedContainer && draggedContainer.id !== pairId && audio) {
      console.log('Executing audio container swap:', draggedContainer.id, '->', pairId);
      
      if (onSwap) {
        onSwap(draggedContainer.id, pairId, 'audio');
      }
      
      // End the container drag mode
      if (onContainerDragEnd) {
        onContainerDragEnd('audio', 'end');
      }
      return;
    }

    // Handle regular audio file dropping from main container drag
    if (draggedItem?.type === 'audio' && draggedItem.pairId !== pairId) {
      console.log('Regular audio drag detected, triggering swap');
      if (onSwap) {
        onSwap(draggedItem.pairId, pairId, 'audio');
      }
    }
  };


  return (
    <>
      {/* Floating drag preview - appears when mouse dragging */}
      {isDraggingWithMouse && isContainerDragging && audio && (
        <div
          className="fixed pointer-events-none"
          style={{
            left: `${mousePosition.x - dragOffset.x}px`,
            top: `${mousePosition.y - dragOffset.y}px`,
            width: '450px',
            height: '136px',
            transform: 'rotate(10deg) scale(1.1)',
            opacity: 0.95,
            zIndex: 999999
          }}
        >
          <div
            className="w-full h-full rounded-2xl border-4 border-green-400 shadow-2xl backdrop-blur-sm"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)',
              boxShadow: `
                0 0 0 4px rgba(16, 185, 129, 1),
                0 0 50px rgba(16, 185, 129, 0.8),
                0 30px 80px rgba(0, 0, 0, 0.6)
              `,
              padding: '16px'
            }}
          >
            <div className="w-full h-full flex flex-col justify-between">
              {/* Header with filename and time */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm font-medium truncate">
                  {audio.name.replace(/\.[^/.]+$/, "")}
                </span>
                <div className="text-xs text-gray-400 flex-shrink-0">
                  Audio File
                </div>
              </div>

              {/* Waveform placeholder */}
              <div className="flex-1 flex items-center">
                <div className="w-full h-12 bg-gradient-to-r from-blue-500/20 to-blue-400/20 rounded flex items-end justify-center gap-1 px-2">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-blue-400 rounded-sm"
                      style={{
                        width: '3px',
                        height: `${Math.random() * 100 + 20}%`,
                        opacity: 0.7
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Play button */}
              <div className="flex items-center justify-center mt-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: 'rgba(53, 132, 228, 0.15)',
                    border: '2px solid rgba(53, 132, 228, 0.4)',
                    color: '#3584E4'
                  }}
                >
                  <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="m7 4 10 6L7 16V4z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty space placeholder when container is being dragged with mouse */}
      {isDraggingWithMouse && isContainerDragging ? (
        <div
          style={{
            width: '100%',
            height: '136px',
            minHeight: '136px',
            border: '2px dashed rgba(53, 132, 228, 0.3)',
            borderRadius: '8px',
            background: 'rgba(10, 15, 28, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(53, 132, 228, 0.5)',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Container being moved...
        </div>
      ) : (
        <div 
          className="relative"
          style={{
            minHeight: isContainerDragging ? '180px' : '136px', // Reserve space when container is lifted
            transition: 'min-height 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)'
          }}
        >
          <motion.div
            ref={containerRef}
            className="relative w-full h-full transition-all duration-300 group cursor-pointer audio-container"
            data-pair-id={pairId}
            data-audio-container="true"
            draggable={!!audio}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => {
              handleDragOver(e);
              handleContainerDragOver(e);
            }}
            onDragLeave={handleDragLeave}
            onDrop={(e) => {
              handleDrop(e);
              handleContainerDrop(e);
            }}
            whileHover={{ scale: audio ? 1.005 : 1 }}
            title={audio ? `${audio.name} • ${formatTime(duration)} • ${formatFileSize(audio.size)}` : undefined}
            style={{
        pointerEvents: 'auto',
        userSelect: 'none',
        background: shouldHighlight && audio
          ? 'rgba(16, 185, 129, 0.15)' // Green background when highlighted
          : audio ? 'rgba(15, 23, 42, 0.6)' : '#040608', // Dark theme adapted
        borderRadius: '8px',
        border: isDragOver 
          ? '3px solid rgba(34, 197, 94, 0.8)' // Stronger green border when valid drop target
          : shouldHighlight
          ? '3px solid rgba(16, 185, 129, 0.8)' // Green glow when another audio container is being dragged
          : (isContainerDragMode && draggedContainerType === 'audio')
          ? '3px solid rgba(16, 185, 129, 0.8)' // Green glow when container drag mode is active for audio
          : audio ? '1px solid rgba(53, 132, 228, 0.3)' : '1.5px solid rgba(30, 144, 255, 0.3)',
        boxShadow: isDragging
          ? '0 0 0 4px rgba(59, 130, 246, 1), 0 0 50px rgba(59, 130, 246, 0.8), 0 30px 80px rgba(0, 0, 0, 0.6)'
          : isDragOver
          ? '0 0 0 2px rgba(34, 197, 94, 0.6), 0 0 30px rgba(34, 197, 94, 0.5), inset 0 0 20px rgba(34, 197, 94, 0.1)'
          : shouldHighlight
          ? '0 0 0 3px rgba(16, 185, 129, 0.8), 0 0 40px rgba(16, 185, 129, 0.7), 0 0 80px rgba(16, 185, 129, 0.4), inset 0 0 25px rgba(16, 185, 129, 0.15)'
          : (isContainerDragMode && draggedContainerType === 'audio')
          ? '0 0 0 3px rgba(16, 185, 129, 0.8), 0 0 40px rgba(16, 185, 129, 0.7), 0 0 80px rgba(16, 185, 129, 0.4), inset 0 0 25px rgba(16, 185, 129, 0.15)'
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
        position: isDraggingWithMouse && isContainerDragging ? 'fixed' : 'relative',
        left: isDraggingWithMouse && isContainerDragging ? `${mousePosition.x - dragOffset.x}px` : 'auto',
        top: isDraggingWithMouse && isContainerDragging ? `${mousePosition.y - dragOffset.y}px` : 'auto',
        transform: isDraggingWithMouse && isContainerDragging
          ? 'rotate(10deg) scale(1.1)'
          : (isDraggingContainer && draggedContainerType === 'audio' && draggedContainer?.id === pairId)
          ? `translate(${dragPosition.x}px, ${dragPosition.y}px) scale(1.2) rotate(5deg)`
          : isDragging 
          ? `translate(${dragPosition.x}px, ${dragPosition.y}px) scale(1.15) rotate(3deg)`
          : isDragOver 
          ? 'scale(1.02)' 
          : shouldHighlight
          ? 'scale(1.05) translateY(-2px)' // Lift effect when highlighted
          : 'scale(1)',
        opacity: isContainerDragging 
          ? 0.95
          : (isDraggingContainer && draggedContainerType === 'audio' && draggedContainer?.id === pairId)
          ? 0.9
          : isDragging ? 0.9 : 1,
        transition: (isDragging || (isDraggingContainer && draggedContainerType === 'audio' && draggedContainer?.id === pairId))
          ? 'none' 
          : 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)', // Smoother transition for the lift effect
        zIndex: isDraggingWithMouse && isContainerDragging
          ? 99999 // Maximum z-index when dragging with mouse to appear above everything globally
          : isContainerDragging
          ? 50000 // Very high z-index when lifted
          : (isDraggingContainer && draggedContainerType === 'audio' && draggedContainer?.id === pairId)
          ? 1500
          : isDragging ? 1000 : shouldHighlight ? 100 : 1,
        pointerEvents: 'auto',
        userSelect: 'none'
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
            <span className="text-white text-sm font-medium truncate">
              {audio.name.replace(/\.[^/.]+$/, "")} {/* Remove file extension like Decibels */}
            </span>
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

          {/* Move button - positioned below audio preview */}
          <div className="flex items-center justify-center mt-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 opacity-60 hover:opacity-100 z-10 cursor-move"
              style={{
                backgroundColor: (isContainerDragMode && draggedContainerType === 'audio') ? 'rgba(16, 185, 129, 0.25)' : 'rgba(53, 132, 228, 0.15)',
                border: (isContainerDragMode && draggedContainerType === 'audio') ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(53, 132, 228, 0.3)',
                color: (isContainerDragMode && draggedContainerType === 'audio') ? '#10B981' : '#3584E4'
              }}
              title="Drag to move audio container"
              draggable="true"
              onDragStart={(e) => {
                e.stopPropagation();
                e.dataTransfer.effectAllowed = 'move';
                const dragData = {
                  type: 'individual-container',
                  containerType: 'audio',
                  pairId: pairId,
                  content: audio
                };
                e.dataTransfer.setData('application/json', JSON.stringify(dragData));
                e.dataTransfer.setData('text/plain', JSON.stringify(dragData));

                // Also store in sessionStorage for reliable access
                sessionStorage.setItem('currentDragData', JSON.stringify(dragData));

                console.log('Move button drag started:', dragData);

                // Set local dragging state for visual feedback
                setIsDragging(true);

                // Trigger the container drag system for cursor following
                if (onContainerDragStart) {
                  onContainerDragStart('audio', 'start', { 
                    id: pairId, 
                    type: 'audio',
                    content: audio,
                    audio: audio // Include the audio file for proper container type detection
                  });
                }
              }}
              onDragEnd={(e) => {
                // Reset local dragging state
                setIsDragging(false);

                if (onContainerDragEnd) {
                  onContainerDragEnd('audio', 'end');
                }
              }}
              onMouseDown={handleMoveButtonMouseDown}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
              </svg>
            </div>
          </div>

          {/* Delete button - positioned at bottom right */}
          <button
            className="absolute bottom-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 opacity-60 hover:opacity-100 z-10"
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
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
        </div>
      )}
    </>
  );
};

export default AudioContainer;