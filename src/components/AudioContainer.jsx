import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import WaveSurfer from 'wavesurfer.js';

const AudioContainer = ({ 
  audio, 
  pairId, 
  onSwap, 
  draggedItem, 
  onDragStart, 
  onDragEnd, 
  isContainerDragMode, 
  draggedContainerType, 
  onContainerDragStart, 
  onContainerDragEnd, 
  onDelete,
  isDraggingContainer,
  draggedContainer,
  shouldShowGlow
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isContainerDragging, setIsContainerDragging] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const containerRef = useRef(null);

  // Format time utility function
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize WaveSurfer
  useEffect(() => {
    if (audio && waveformRef.current && !wavesurferRef.current) {
      try {
        console.log('Using fallback waveform generation for', audio.name);
        
        wavesurferRef.current = WaveSurfer.create({
          container: waveformRef.current,
          waveColor: 'rgba(53, 132, 228, 0.3)',
          progressColor: 'rgba(53, 132, 228, 0.8)',
          cursorColor: 'rgba(53, 132, 228, 1)',
          barWidth: 2,
          barRadius: 1,
          responsive: true,
          height: 80,
          normalize: true,
          backend: 'WebAudio',
          mediaControls: false
        });

        wavesurferRef.current.loadBlob(audio);

        wavesurferRef.current.on('ready', () => {
          setDuration(wavesurferRef.current.getDuration());
        });

        wavesurferRef.current.on('audioprocess', () => {
          setCurrentTime(wavesurferRef.current.getCurrentTime());
        });

        wavesurferRef.current.on('play', () => {
          setIsPlaying(true);
        });

        wavesurferRef.current.on('pause', () => {
          setIsPlaying(false);
        });

        wavesurferRef.current.on('finish', () => {
          setIsPlaying(false);
        });

      } catch (error) {
        console.error('Error initializing WaveSurfer:', error);
      }
    }

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, [audio]);

  const handlePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'audio',
      pairId: pairId,
      data: audio
    }));
    setIsDragging(true);
    onDragStart({ type: 'audio', pairId, data: audio });
  };

  const handleDragEnd = (e) => {
    setIsDragging(false);
    onDragEnd();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    
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
      if (draggedItem?.type === 'audio' && draggedItem.pairId !== pairId && audio) {
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
        return;
      }
    }

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

    if (draggedItem?.type === 'audio' && draggedItem.pairId !== pairId && audio) {
      if (onSwap) {
        onSwap(draggedItem.pairId, pairId, 'audio');
      }
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    const audioFile = files.find(file => file.type.startsWith('audio/'));
    if (audioFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        // Handle file drop logic here if needed
      };
      reader.readAsDataURL(audioFile);
    }
  };

  const handleContainerMouseDown = (e) => {
    console.log('Move button mouse down for audio container:', {
      type: 'individual-container',
      containerType: 'audio',
      pairId: pairId,
      content: { audio }
    });

    if (onContainerDragStart) {
      onContainerDragStart('audio', 'start', { 
        id: pairId, 
        type: 'audio',
        audio: audio
      });
    }
  };

  const renderDragPreview = () => {
    if (!isDraggingContainer || draggedContainer?.pairId !== pairId) return null;

    return createPortal(
      <motion.div
        className="fixed pointer-events-none z-[9999] w-[450px] h-[192px]"
        style={{
          left: draggedContainer.x - 225,
          top: draggedContainer.y - 96,
          transform: 'scale(1.05)',
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1.05 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2 }}
      >
        <div 
          className="w-full h-full flex flex-col"
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
            borderRadius: '12px',
            padding: '20px',
            border: '2px solid rgba(16, 185, 129, 0.6)',
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)'
          }}
        >
          <h3 className="text-white text-sm font-medium truncate mb-4">
            {audio?.name?.replace(/\.[^/.]+$/, "")}
          </h3>
          
          <div className="flex-1 flex items-center justify-center mb-4">
            <div 
              className="w-full"
              style={{ 
                height: '80px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div style={{
                width: '90%',
                height: '60px',
                background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.8) 0%, rgba(16, 185, 129, 0.4) 50%, rgba(16, 185, 129, 0.2) 100%)',
                borderRadius: '4px'
              }} />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: 'rgba(53, 132, 228, 0.2)',
                  border: '2px solid rgba(53, 132, 228, 0.4)',
                  color: 'white'
                }}
              >
                <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="m7 4 10 6L7 16V4z"/>
                </svg>
              </div>
              
              <div className="flex items-center space-x-2 text-xs text-gray-300 font-mono">
                <span>0:00</span>
                <span>/</span>
                <span>0:00</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>,
      document.body
    );
  };

  return (
    <>
      {renderDragPreview()}
      
      <div 
        className="relative"
        style={{
          minHeight: isContainerDragging ? '120px' : '100px',
          transition: 'min-height 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)'
        }}
      >
        <motion.div
          ref={containerRef}
          className="relative w-full h-full transition-all duration-300 group cursor-pointer audio-container"
          data-pair-id={pairId}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          draggable={audio ? true : false}
          onDragStart={audio ? handleDragStart : undefined}
          onDragEnd={audio ? handleDragEnd : undefined}
          style={{
            background: 'linear-gradient(135deg, #0A0F1C 0%, #1E293B 100%)',
            borderRadius: '24px',
            minHeight: '192px',
            padding: '0px',
            border: shouldShowGlow && draggedContainerType === 'audio' 
              ? '3px solid rgba(16, 185, 129, 0.6)' 
              : isDragOver 
                ? '3px solid rgba(34, 197, 94, 0.6)' 
                : '3px solid rgba(30, 144, 255, 0.4)',
            boxShadow: shouldShowGlow && draggedContainerType === 'audio'
              ? '0 0 30px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              : isDragOver
                ? '0 0 30px rgba(34, 197, 94, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                : '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            transform: isContainerDragging ? 'scale(1.05) translateY(-10px)' : 'scale(1)',
            zIndex: isContainerDragging ? 10 : 1,
            opacity: isContainerDragging ? 0.5 : 1,
            transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)'
          }}
          animate={{
            scale: isContainerDragging ? 1.05 : 1,
            y: isContainerDragging ? -10 : 0,
            opacity: isContainerDragging ? 0.5 : 1
          }}
          transition={{ duration: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
        >
          {audio ? (
            <div className="w-full h-full flex flex-col relative" style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
              borderRadius: '12px',
              padding: '20px'
            }}>
              <div className="mb-4">
                <h3 className="text-white text-sm font-medium truncate">
                  {audio.name.replace(/\.[^/.]+$/, "")}
                </h3>
              </div>

              <div className="flex-1 flex items-center justify-center mb-4">
                <div 
                  ref={waveformRef}
                  className="w-full cursor-pointer"
                  style={{ 
                    height: '80px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handlePlayPause}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{
                      backgroundColor: isPlaying ? '#3584e4' : 'rgba(53, 132, 228, 0.2)',
                      border: `2px solid ${isPlaying ? '#3584e4' : 'rgba(53, 132, 228, 0.4)'}`,
                      boxShadow: isPlaying 
                        ? '0 0 20px rgba(53, 132, 228, 0.4)'
                        : '0 0 10px rgba(53, 132, 228, 0.2)',
                      color: 'white'
                    }}
                  >
                    {isPlaying ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="m7 4 10 6L7 16V4z"/>
                      </svg>
                    )}
                  </button>
                  
                  <div className="flex items-center space-x-2 text-xs text-gray-300 font-mono">
                    <span>{formatTime(currentTime)}</span>
                    <span>/</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-move"
                  style={{
                    backgroundColor: (isContainerDragMode && draggedContainerType === 'audio') ? 'rgba(16, 185, 129, 0.9)' : 'rgba(53, 132, 228, 0.2)',
                    border: (isContainerDragMode && draggedContainerType === 'audio') ? '1px solid rgba(16, 185, 129, 1)' : '1px solid rgba(53, 132, 228, 0.4)',
                    color: 'white',
                    backdropFilter: 'blur(4px)'
                  }}
                  title="Move audio container"
                  draggable="true"
                  onMouseDown={handleContainerMouseDown}
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
                      onContainerDragEnd('audio', 'end', null);
                    }
                  }}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
              </div>

              {onDelete && (
                <button
                  onClick={() => onDelete(pairId)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.9)',
                    border: '1px solid rgba(239, 68, 68, 1)',
                    color: 'white',
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
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
      </div>
    </>
  );
};

export default AudioContainer;