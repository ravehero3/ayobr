import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import WaveSurfer from 'wavesurfer.js';

// Global reference to track currently playing audio
let currentlyPlayingWaveSurfer = null;
let currentlyPlayingAudioId = null;

// Function to generate realistic waveform patterns based on file characteristics
const generateRealisticWaveform = (fileName, fileSize) => {
  // Create a seed based on filename for consistent patterns
  const seed = fileName.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);

  // Use seeded random for consistent patterns per file
  const seededRandom = (s) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  const peaks = [];
  const numBars = 120;

  // Extract BPM from filename if present (common in music files)
  const bpmMatch = fileName.match(/(\d+)\s*bpm/i);
  const bpm = bpmMatch ? parseInt(bpmMatch[1]) : 120; // Default 120 BPM

  // Create rhythm-based pattern
  const beatsPerBar = 4;
  const barsInPattern = 8;
  const totalBeats = beatsPerBar * barsInPattern;

  for (let i = 0; i < numBars; i++) {
    let baseHeight = 0.3; // Base level
    const position = (i / numBars) * totalBeats;

    // Add rhythm emphasis on beats
    const beatPosition = position % beatsPerBar;
    if (beatPosition < 0.1) { // On the beat
      baseHeight += 0.4;
    } else if (beatPosition < 0.3) { // Just after beat
      baseHeight += 0.2;
    }

    // Add file-specific variation using seed
    const variation = seededRandom(seed + i * 100) * 0.4;
    baseHeight += variation;

    // Add some musical structure (build-ups, drops)
    const songPosition = i / numBars;
    if (songPosition > 0.2 && songPosition < 0.4) { // Build-up
      baseHeight *= (1 + songPosition * 0.5);
    } else if (songPosition > 0.4 && songPosition < 0.6) { // Drop/chorus
      baseHeight *= 1.3;
    } else if (songPosition > 0.8) { // Outro fade
      baseHeight *= (1 - (songPosition - 0.8) * 2);
    }

    // Ensure reasonable bounds
    baseHeight = Math.max(0.05, Math.min(0.95, baseHeight));
    peaks.push(baseHeight);
  }

  return peaks;
};

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
  const [waveformPeaks, setWaveformPeaks] = useState(null);
  const [realTimeWaveformData, setRealTimeWaveformData] = useState(null);
  const [completeWaveformData, setCompleteWaveformData] = useState(null);
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
      // Initialize WaveSurfer with GNOME Decibels styling (player2)
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#5e5c64', // GNOME dark theme unplayed color
        progressColor: '#3584e4', // GNOME blue for played portions
        cursorColor: 'rgba(53, 132, 228, 0.9)',
        barWidth: 1.5,
        barRadius: 0, // Sharp edges like Decibels
        barGap: 0.5,
        height: 40, // More compact height like Decibels
        normalize: true,
        backend: 'WebAudio',
        interact: true,
        barMinHeight: 1,
        responsive: true,
        fillParent: true
      });

      // Load audio file
      const url = URL.createObjectURL(audio);
      wavesurfer.current.load(url);

      // Event listeners
      wavesurfer.current.on('ready', () => {
        setDuration(wavesurfer.current.getDuration());

        // Extract and store actual waveform peaks for drag preview
        const extractWaveformPeaks = () => {
          try {
            // Method 1: Extract from audio buffer directly (most reliable)
            if (wavesurfer.current.backend && wavesurfer.current.backend.buffer) {
              const buffer = wavesurfer.current.backend.buffer;
              const peaks = [];
              const channelData = buffer.getChannelData(0);
              const targetBars = 120;
              const sampleSize = Math.floor(channelData.length / targetBars);

              for (let i = 0; i < targetBars; i++) {
                const start = i * sampleSize;
                const end = Math.min(start + sampleSize, channelData.length);
                let max = 0;

                // Calculate RMS (Root Mean Square) for better representation
                let sum = 0;
                let count = 0;
                for (let j = start; j < end; j++) {
                  const value = Math.abs(channelData[j]);
                  sum += value * value;
                  count++;
                  if (value > max) max = value;
                }

                // Use RMS value for more accurate waveform representation
                const rms = count > 0 ? Math.sqrt(sum / count) : 0;
                peaks.push(Math.max(rms, max * 0.3)); // Blend RMS with peak for better visual
              }

              if (peaks.length > 0) {
                setWaveformPeaks(peaks);
                setCompleteWaveformData(peaks); // Store complete waveform for green box
                console.log('Extracted RMS waveform peaks for', audio.name, ':', peaks.length, 'peaks', 'max:', Math.max(...peaks).toFixed(3));
                return true;
              }
            }

            // Method 2: Try to get peaks from the backend
            if (wavesurfer.current.backend && wavesurfer.current.backend.getPeaks) {
              const peaks = wavesurfer.current.backend.getPeaks(120, 0, wavesurfer.current.getDuration());
              if (peaks && peaks.length > 0) {
                setWaveformPeaks(peaks.map(p => Math.abs(p)));
                console.log('Extracted peaks using getPeaks method for', audio.name, ':', peaks.length, 'peaks');
                return true;
              }
            }

            // Method 3: Try to get peak data from wavesurfer drawer
            if (wavesurfer.current.drawer && wavesurfer.current.drawer.normalizedPeaks) {
              const peaks = Array.from(wavesurfer.current.drawer.normalizedPeaks).slice(0, 120);
              if (peaks.length > 0) {
                setWaveformPeaks(peaks.map(p => Math.abs(p)));
                console.log('Extracted normalized peaks from drawer for', audio.name, ':', peaks.length, 'peaks');
                return true;
              }
            }

            return false;
          } catch (error) {
            console.log('Error extracting waveform peaks for', audio.name, ':', error);
            return false;
          }
        };

        // Try multiple times with different delays to catch the waveform data
        const tryExtractPeaks = (attempt = 1, maxAttempts = 5) => {
          const success = extractWaveformPeaks();
          if (!success && attempt < maxAttempts) {
            const delay = attempt * 200; // Increasing delay
            setTimeout(() => tryExtractPeaks(attempt + 1, maxAttempts), delay);
          } else if (!success) {
            // Final fallback: Generate realistic-looking waveform based on audio file characteristics
            console.log('Using fallback waveform generation for', audio.name);
            const fallbackPeaks = generateRealisticWaveform(audio.name, audio.size);
            setWaveformPeaks(fallbackPeaks);
            setCompleteWaveformData(fallbackPeaks); // Store complete waveform for green box
          }
        };

        // Start extraction attempts
        tryExtractPeaks();
      });

      wavesurfer.current.on('audioprocess', () => {
        setCurrentTime(wavesurfer.current.getCurrentTime());
      });

      wavesurfer.current.on('play', () => {
        // Stop any other currently playing audio
        if (currentlyPlayingWaveSurfer && currentlyPlayingWaveSurfer !== wavesurfer.current) {
          currentlyPlayingWaveSurfer.pause();
        }

        setIsPlaying(true);
        currentlyPlayingWaveSurfer = wavesurfer.current;
        currentlyPlayingAudioId = pairId;
      });

      wavesurfer.current.on('pause', () => {
        setIsPlaying(false);
        if (currentlyPlayingWaveSurfer === wavesurfer.current) {
          currentlyPlayingWaveSurfer = null;
          currentlyPlayingAudioId = null;
        }
      });

      wavesurfer.current.on('finish', () => {
        setIsPlaying(false);
        if (currentlyPlayingWaveSurfer === wavesurfer.current) {
          currentlyPlayingWaveSurfer = null;
          currentlyPlayingAudioId = null;
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
      // Stop any currently playing audio from other containers
      if (currentlyPlayingWaveSurfer && currentlyPlayingWaveSurfer !== wavesurfer.current) {
        currentlyPlayingWaveSurfer.pause();
        currentlyPlayingWaveSurfer = null;
        currentlyPlayingAudioId = null;
      }

      // Toggle play/pause for this audio
      if (wavesurfer.current.isPlaying()) {
        // Currently playing, so pause it
        wavesurfer.current.pause();
        setIsPlaying(false);
        currentlyPlayingWaveSurfer = null;
        currentlyPlayingAudioId = null;
      } else {
        // Currently paused, so play it
        wavesurfer.current.play();
        setIsPlaying(true);
        currentlyPlayingWaveSurfer = wavesurfer.current;
        currentlyPlayingAudioId = pairId;
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

    // Set fixed offset for green box centering (not based on current container)
    setDragOffset({ x: 0, y: 0 }); // No offset needed since we center in the green box positioning

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
      setMousePosition({ x: 0, y: 0 });
      setDragOffset({ x: 0, y: 0 });
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
      {/* Dragged Container Preview - Shows full waveform in green tilted container */}
      {(isDraggingWithMouse && isContainerDragging) || (isDraggingContainer && draggedContainerType === 'audio' && draggedContainer?.id === pairId) ? (
        <>
          {/* Empty space placeholder */}
          <div
            style={{
              width: '100%',
              height: '120px',
              minHeight: '120px',
              border: '2px dashed rgba(16, 185, 129, 0.4)',
              borderRadius: '8px',
              background: 'rgba(10, 15, 28, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(16, 185, 129, 0.6)',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Audio container being moved...
          </div>

          {/* Green box - Portal-based rendering to ensure it's always on top */}
          {audio && (isDraggingWithMouse && isContainerDragging) && createPortal(
            <div
              className="green-box-drag-preview"
              style={{
                position: 'fixed',
                left: `${mousePosition.x - 225}px`, // Always center horizontally (450px / 2 = 225px)
                top: `${mousePosition.y - 60}px`,   // Always center vertically (120px / 2 = 60px)
                width: '450px',
                height: '120px',
                transform: 'rotate(2deg) scale(1.1)',
                zIndex: 999999999, // Extremely high z-index to ensure it's always on top
                pointerEvents: 'none',
                background: 'rgba(16, 185, 129, 0.95)',
                borderRadius: '8px',
                border: '2px solid rgba(16, 185, 129, 1)',
                boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.8), 0 0 40px rgba(16, 185, 129, 0.7), 0 0 80px rgba(16, 185, 129, 0.4)',
                padding: '16px',
                opacity: 0.95,
                isolation: 'isolate', // Creates new stacking context
                willChange: 'transform', // Forces hardware acceleration
                // Additional CSS properties to ensure it stays on top
                backdropFilter: 'blur(1px)',
                WebkitBackdropFilter: 'blur(1px)',
                contain: 'layout style paint'
              }}
            >
              <div className="w-full h-full flex flex-col justify-between">
                {/* Header with filename */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm font-medium truncate">
                    {audio.name.replace(/\.[^/.]+$/, "")}
                  </span>
                  <div className="text-xs text-white/80 flex-shrink-0">
                    {formatTime(duration)}
                  </div>
                </div>

                {/* Display the exact same waveform as the audio container */}
                <div className="flex-1 flex items-center">
                  <div 
                    className="w-full"
                    style={{ 
                      height: '60px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Mirror the exact waveform from wavesurfer */}
                    <div 
                      className="w-full h-full"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '4px',
                        position: 'relative'
                      }}
                    >
                      <div className="flex items-center justify-center h-full relative">
                        {/* Display complete waveform from start to end */}
                        <div className="w-full h-full flex items-end justify-center px-1 gap-0.5">
                          {(() => {
                            // Use the complete waveform data to show full song
                            let displayPeaks;

                            if (completeWaveformData && completeWaveformData.length > 0) {
                              // Use the complete extracted waveform data - shows entire song
                              displayPeaks = completeWaveformData;
                              console.log('Using complete waveform data for drag preview:', audio.name, displayPeaks.length, 'peaks (full song)');
                            } else if (waveformPeaks && waveformPeaks.length > 0) {
                              // Fallback to regular waveform data
                              displayPeaks = waveformPeaks;
                              console.log('Using extracted waveform data for drag preview:', audio.name, displayPeaks.length, 'peaks');
                            } else {
                              // Generate complete file-specific pattern showing full song
                              displayPeaks = generateRealisticWaveform(audio.name, audio.size);
                              console.log('Using generated complete waveform for drag preview:', audio.name);
                            }

                            // Ensure we have enough bars to represent the complete song
                            const targetBars = 150; // More bars for complete representation
                            if (displayPeaks.length < targetBars) {
                              // Interpolate to fill more bars for complete visualization
                              const interpolated = [];
                              for (let i = 0; i < targetBars; i++) {
                                const sourceIndex = (i / targetBars) * (displayPeaks.length - 1);
                                const lowerIndex = Math.floor(sourceIndex);
                                const upperIndex = Math.min(Math.ceil(sourceIndex), displayPeaks.length - 1);
                                const fraction = sourceIndex - lowerIndex;

                                const interpolatedValue = displayPeaks[lowerIndex] * (1 - fraction) + 
                                                        displayPeaks[upperIndex] * fraction;
                                interpolated.push(interpolatedValue);
                              }
                              displayPeaks = interpolated;
                            }

                            return displayPeaks.map((peak, i) => {
                              // Normalize peak value to percentage
                              const normalizedPeak = Math.abs(peak);
                              const height = Math.max(Math.min(normalizedPeak * 100, 95), 5);

                              // Calculate playback progress for visual feedback across complete song
                              const progress = duration > 0 ? currentTime / duration : 0;
                              const barProgress = i / displayPeaks.length;
                              const isPlayed = barProgress <= progress;

                              return (
                                <div
                                  key={i}
                                  style={{
                                    width: '1.5px', // Slightly thinner for more bars
                                    height: `${height}%`,
                                    backgroundColor: isPlayed ? '#FFFFFF' : 'rgba(255, 255, 255, 0.8)',
                                    borderRadius: '1px',
                                    minHeight: '5%',
                                    maxHeight: '95%',
                                    flexShrink: 0,
                                    transition: 'background-color 0.1s ease'
                                  }}
                                />
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom controls */}
                <div className="flex items-center justify-center mt-2">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      border: '2px solid rgba(255, 255, 255, 0.4)',
                      color: 'white'
                    }}
                  >
                    <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="m7 4 10 6L7 16V4z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>,
            document.body // Render directly into document body to ensure highest z-index context
          )}
        </>
      ) : (
        <div 
          className="relative"
          style={{
            minHeight: isContainerDragging ? '120px' : '100px', // Reserve space when container is lifted
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
            ? '0 0 0 1px rgba(53, 132, 228, 0.2), 0 0 20px rgba(53, 132, 228,0.1)'
            : `
            0 0 0 1px rgba(30, 144, 255, 0.15),
            0 0 8px rgba(30, 144, 255, 0.2),
            0 0 15px rgba(0, 207, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.02)
          `,
        padding: audio ? '16px' : '20px',
        height: '120px',
        minHeight: '120px',
        maxHeight: '120px',
        position: (isDraggingWithMouse && isContainerDragging) ? 'fixed' : 'relative',
        left: (isDraggingWithMouse && isContainerDragging) ? `${mousePosition.x - dragOffset.x}px` : 'auto',
        top: (isDraggingWithMouse && isContainerDragging) ? `${mousePosition.y - dragOffset.y}px` : 'auto',
        transform: (isDraggingWithMouse && isContainerDragging)
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
        opacity: (isDraggingWithMouse && isContainerDragging)
          ? 0.95
          : isContainerDragging 
          ? 0.95
          : (isDraggingContainer && draggedContainerType === 'audio' && draggedContainer?.id === pairId)
          ? 0.9
          : isDragging ? 0.9 : 1,
        transition: (isDragging || (isDraggingContainer && draggedContainerType === 'audio' && draggedContainer?.id === pairId) || (isDraggingWithMouse && isContainerDragging))
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
        <div className="w-full h-full flex flex-col relative" style={{
          background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)',
          borderRadius: '12px',
          border: '1px solid #404040',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), 0 1px 4px rgba(0, 0, 0, 0.2)',
          padding: '16px'
        }}>
          {/* GNOME Decibels Header - Dark mode */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              {/* Track info */}
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white leading-tight truncate max-w-[200px]">
                  {audio.name.replace(/\.[^/.]+$/, "")}
                </span>
              </div>
            </div>
          </div>

          {/* GNOME Decibels Waveform - Dark mode */}
          <div className="flex-1 flex items-center mb-2" style={{ minHeight: '80px' }}>
            <div 
              ref={waveformRef}
              className="w-full cursor-pointer rounded-sm"
              style={{ 
                height: '80px',
                background: '#1a1a1a',
                border: '1px solid #2d2d2d',
                borderRadius: '4px'
              }}
            />
          </div>

          {/* Time display row - GNOME Decibels style with swapped positions */}
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="text-xs text-gray-300 font-mono tabular-nums">
              {formatTime(currentTime)}
            </div>
            <div className="text-xs text-gray-400 font-mono tabular-nums">
              {formatTime(duration)}
            </div>
          </div>

          {/* GNOME Decibels Controls - Dark mode */}
          <div className="flex items-center justify-between">
            {/* Left controls */}
            <div className="flex items-center space-x-2">
              {/* Main play button - GNOME Decibels style */}
              <button
                onClick={handlePlayPause}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: isPlaying ? '#3584e4' : '#2d2d2d',
                  border: `1px solid ${isPlaying ? '#3584e4' : '#404040'}`,
                  boxShadow: isPlaying 
                    ? '0 1px 3px rgba(53, 132, 228, 0.4)'
                    : '0 1px 2px rgba(0, 0, 0, 0.2)',
                  color: 'white'
                }}
              >
                {isPlaying ? (
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="m7 4 10 6L7 16V4z"/>
                  </svg>
                )}
              </button>
            </div>

            {/* Right controls */}
            <div className="flex items-center space-x-2">
              {/* Move button - Dark mode */}
              <div
                className="w-6 h-6 rounded-sm flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95 cursor-move"
                style={{
                  backgroundColor: (isContainerDragMode && draggedContainerType === 'audio') ? 'rgba(16, 185, 129, 0.2)' : '#2d2d2d',
                  border: (isContainerDragMode && draggedContainerType === 'audio') ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid #404040',
                  color: (isContainerDragMode && draggedContainerType === 'audio') ? '#10B981' : '#babdb6',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                }}
                title="Move audio container"
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

                  sessionStorage.setItem('currentDragData', JSON.stringify(dragData));
                  setIsDragging(true);

                  if (onContainerDragStart) {
                    onContainerDragStart('audio', 'start', { 
                      id: pairId, 
                      type: 'audio',
                      content: audio,
                      audio: audio
                    });
                  }
                }}
                onDragEnd={(e) => {
                  setIsDragging(false);
                  if (onContainerDragEnd) {
                    onContainerDragEnd('audio', 'end');
                  }
                }}
                onMouseDown={handleMoveButtonMouseDown}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                </svg>
              </div>

              {/* Delete button - Dark mode */}
              <button
                className="w-6 h-6 rounded-sm flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: '#2d2d2d',
                  border: '1px solid #404040',
                  color: '#ed333b',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
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
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
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