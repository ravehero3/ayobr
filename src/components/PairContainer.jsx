import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AudioContainer from './AudioContainer';
import ImageContainer from './ImageContainer';
import VideoGenerationAnimation from './VideoGenerationAnimation';
import { useAppStore } from '../store/appStore';

const PairContainer = ({ pair, onSwap, draggedItem, onDragStart, onDragEnd, clearFileCache, onContainerDrag, isValidContainerDragTarget, draggedContainer, isDraggingContainer, draggedContainerType }) => {
  const { removePair, getVideoGenerationState, setVideoGenerationState, generatedVideos } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOverContainer, setIsDragOverContainer] = useState(false);

  // Check if this container is a valid drop target
  const isValidDropTarget = draggedContainer && isValidContainerDragTarget && isValidContainerDragTarget(pair);
  const [isContainerDragTarget, setIsContainerDragTarget] = useState(false); // New state for container drag target
  
  // Determine if this container should glow based on drag type
  const shouldShowGlow = isDraggingContainer && draggedContainer && draggedContainer.id !== pair.id && (() => {
    if (draggedContainerType === 'audio') {
      // Only highlight audio containers when dragging audio
      return !!pair.audio && !pair.image; // Must have audio and not be a mixed container
    } else if (draggedContainerType === 'image') {
      // Only highlight image containers when dragging image
      return !!pair.image && !pair.audio; // Must have image and not be a mixed container
    }
    return false;
  })();

  const videoState = getVideoGenerationState(pair.id);
  const generatedVideo = generatedVideos.find(v => v.pairId === pair.id);

  const handleDelete = () => {
    removePair(pair.id);
    // Clear the file cache to allow the same files to be dropped again
    if (clearFileCache) {
      clearFileCache();
    }
  };

  const handleVideoGenerationComplete = () => {
    // This function is called when video generation animation completes
    console.log(`Video generation animation completed for pair ${pair.id}`);

    // Don't reset the state - let the generated video stay displayed
    // The video should remain visible after generation is complete
  };

  const handleContainerDragStart = (e) => {
    if (generatedVideo) return; // Don't allow dragging if video is generated

    e.stopPropagation();
    setIsDragging(true);
    onContainerDrag?.(pair.id, 'start', pair);
  };

  const handleContainerDragEnd = () => {
    setIsDragging(false);
    onContainerDrag?.(pair.id, 'end');
  };

  const handleContainerDragOver = (e) => {
    e.preventDefault();

    // Check for individual container drag data
    try {
      const dragDataString = e.dataTransfer.getData('application/json');
      if (dragDataString) {
        const dragData = JSON.parse(dragDataString);

        if (dragData.type === 'individual-container' && dragData.pairId !== pair.id) {
          const draggedContainerType = dragData.containerType;

          // Only highlight if same type containers can be swapped
          if ((draggedContainerType === 'audio' && pair.audio) || 
              (draggedContainerType === 'image' && pair.image)) {
            setIsDragOverContainer(true);
          }
        }
      }
    } catch (error) {
      // Fallback to original logic if drag data parsing fails
      if (draggedContainer && draggedContainer.id !== pair.id && isValidDropTarget) {
        setIsDragOverContainer(true);
      }
    }
  };

  const handleContainerDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOverContainer(false);
    }
  };

  const handleContainerDrop = (e) => {
    e.preventDefault();
    setIsDragOverContainer(false);

    try {
      const dragDataString = e.dataTransfer.getData('application/json');
      if (dragDataString) {
        const dragData = JSON.parse(dragDataString);

        // Handle individual container swapping (audio with audio, image with image)
        if (dragData.type === 'individual-container' && dragData.pairId !== pair.id) {
          const draggedContainerType = dragData.containerType;

          // Only allow same-type swapping
          if (draggedContainerType === 'audio' && pair.audio) {
            // Swap audio content only
            onSwap(dragData.pairId, pair.id, 'audio');
          } else if (draggedContainerType === 'image' && pair.image) {
            // Swap image content only
            onSwap(dragData.pairId, pair.id, 'image');
          }
        }
      }
    } catch (error) {
      console.error('Error handling container drop:', error);
    }
  };

  return (
    <motion.div
      className={`relative group w-full ${isDragging ? 'opacity-50' : ''} ${isDragOverContainer ? 'mb-32' : ''}`}
      layout
      transition={{ duration: 0.3 }}
      onDragOver={handleContainerDragOver}
      onDragLeave={handleContainerDragLeave}
      onDrop={handleContainerDrop}
      style={{
        border: isDragOverContainer ? '2px solid rgba(16, 185, 129, 0.8)' : 'none',
        borderRadius: isDragOverContainer ? '16px' : '0px',
        padding: isDragOverContainer ? '4px' : '0px',
        boxShadow: isDragOverContainer ? '0 0 20px rgba(16, 185, 129, 0.4)' : 'none'
      }}
    >
      {/* Empty space layer - shown when dragging */}
      {isDragging && (
        <motion.div
          className="absolute inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            background: '#2A2A2A',
            border: '2px dashed #4A5568',
            borderRadius: '16px',
            boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.5)',
          }}
        />
      )}

      {/* Show generated video if available, otherwise show the original containers */}
      {generatedVideo ? (
        <div className="flex justify-center relative z-10">
          <div
            className="relative w-full max-w-[800px] backdrop-blur-xl border overflow-hidden group/container"
            style={{
              height: '450px',
              minHeight: '450px',
              maxHeight: '450px',
              background: '#050A13',
              backgroundColor: '#0A0F1C',
              borderColor: '#10B981', // Green border for completed video
              borderWidth: '2px',
              boxShadow: `
                0 0 0 1px rgba(16, 185, 129, 0.4),
                0 0 20px rgba(16, 185, 129, 0.3),
                0 0 40px rgba(16, 185, 129, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.05)
              `,
              borderRadius: '16px',
              animation: 'border-pulse 3s ease-in-out infinite alternate'
            }}
          >
            {/* Clean video display - just the video */}
            <div className="absolute inset-0 p-6 flex items-center justify-center">
              <video
                src={generatedVideo.url}
                controls
                className="w-full h-full rounded-lg shadow-lg object-contain"
                style={{
                  maxHeight: '400px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
                }}
                preload="metadata"
              />
            </div>

            {/* Download button - positioned subtly */}
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = generatedVideo.url;
                link.download = generatedVideo.filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="absolute bottom-4 right-4 p-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-lg text-white text-sm font-medium transition-all duration-300 flex items-center gap-2 opacity-0 group-hover:opacity-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row items-center relative gap-4 lg:gap-6 z-10">
          {/* Audio Container - Made wider for better content display */}  
          <div className="relative w-full lg:w-1/2 min-w-[450px]">
            <div
              className="relative w-full backdrop-blur-xl border overflow-hidden group/container"
              style={{
                height: '300px',
                minHeight: '300px',
                maxHeight: '300px',
                width: '500px',
                minWidth: '500px',
                maxWidth: '500px',
                background: pair.audio ? '#050A13' : '#040608', // Darker for empty containers
                backgroundColor: pair.audio ? '#0A0F1C' : '#080C14', // Darker navy background for empty
                borderColor: (shouldShowGlow && draggedContainerType === 'audio') ? '#10B981' : (isValidDropTarget ? '#10B981' : (pair.audio ? '#1E90FF' : 'rgba(30, 144, 255, 0.3)')), // Green border for valid drop targets or glow
                borderWidth: (shouldShowGlow && draggedContainerType === 'audio') ? '3px' : (isValidDropTarget ? '3px' : '1.5px'),
                boxShadow: (shouldShowGlow && draggedContainerType === 'audio') ? `
                  0 0 0 1px rgba(16, 185, 129, 0.5),
                  0 0 25px rgba(16, 185, 129, 0.7),
                  0 0 50px rgba(16, 185, 129, 0.5),
                  inset 0 1px 0 rgba(255, 255, 255, 0.1)
                ` : (isValidDropTarget ? `
                  0 0 0 1px rgba(16, 185, 129, 0.5),
                  0 0 20px rgba(16, 185, 129, 0.6),
                  0 0 40px rgba(16, 185, 129, 0.4),
                  inset 0 1px 0 rgba(255, 255, 255, 0.1)
                ` : (pair.audio ? `
                  0 0 0 1px rgba(30, 144, 255, 0.3),
                  0 0 15px rgba(30, 144, 255, 0.4),
                  0 0 30px rgba(0, 207, 255, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.05)
                ` : `
                  0 0 0 1px rgba(30, 144, 255, 0.15),
                  0 0 8px rgba(30, 144, 255, 0.2),
                  0 0 15px rgba(0, 207, 255, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.02)
                `)),
                borderRadius: '14px',
                animation: isValidDropTarget ? 'border-pulse 1.5s ease-in-out infinite alternate' : (pair.audio ? 'border-pulse 3s ease-in-out infinite alternate' : 'none')
              }}
            >
              

              <div className="absolute inset-0 p-8">
                <AudioContainer
                  audio={pair.audio}
                  pairId={pair.id}
                  onSwap={onSwap}
                  draggedItem={draggedItem}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  isContainerDragMode={isContainerDragTarget}
                  draggedContainerType={draggedContainer?.type}
                  onContainerDragStart={onContainerDrag}
                  onContainerDragEnd={onContainerDrag}
                />
              </div>
            </div>
          </div>

          {/* Connecting Bridge - Plus Symbol */}
          <div className="relative z-20 hidden lg:block flex items-center justify-center" style={{ width: '100px', height: '80px', margin: '0 -12px' }}>
            <div className="relative flex items-center justify-center" style={{ width: '60px', height: '60px' }}>
              {/* Horizontal bar of plus */}
              <div
                className="absolute backdrop-blur-xl border"
                style={{
                  width: '50px',
                  height: '12px',
                  background: '#050A13',
                  backgroundColor: '#0A0F1C',
                  borderColor: '#1E90FF',
                  borderWidth: '1.5px',
                  boxShadow: `
                    0 0 0 1px rgba(30, 144, 255, 0.3),
                    0 0 8px rgba(30, 144, 255, 0.4),
                    0 0 15px rgba(0, 207, 255, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.05)
                  `,
                  borderRadius: '6px'
                }}
              />
              {/* Vertical bar of plus */}
              <div
                className="absolute backdrop-blur-xl border"
                style={{
                  width: '12px',
                  height: '50px',
                  background: '#050A13',
                  backgroundColor: '#0A0F1C',
                  borderColor: '#1E90FF',
                  borderWidth: '1.5px',
                  boxShadow: `
                    0 0 0 1px rgba(30, 144, 255, 0.3),
                    0 0 8px rgba(30, 144, 255, 0.4),
                    0 0 15px rgba(0, 207, 255, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.05)
                  `,
                  borderRadius: '6px'
                }}
              />
              {/* Center glow effect */}
              <div 
                className="absolute w-3 h-3 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(30, 144, 255, 0.8) 0%, rgba(0, 207, 255, 0.4) 50%, transparent 70%)',
                  boxShadow: '0 0 15px rgba(30, 144, 255, 0.6)'
                }}
              />
            </div>
          </div>

          {/* Image Container - Made wider for better content display */}
          <div className="relative w-full lg:w-1/2 min-w-[450px]">
            <div
              className="relative w-full backdrop-blur-xl border overflow-hidden group/container"
              style={{
                height: '300px',
                minHeight: '300px',
                maxHeight: '300px',
                width: '500px',
                minWidth: '500px',
                maxWidth: '500px',
                background: pair.image ? '#050A13' : '#040608', // Darker for empty containers
                backgroundColor: pair.image ? '#0A0F1C' : '#080C14', // Darker navy background for empty
                borderColor: (shouldShowGlow && draggedContainerType === 'image') ? '#10B981' : (isValidDropTarget ? '#10B981' : (pair.image ? '#1E90FF' : 'rgba(30, 144, 255, 0.3)')), // Green border for valid drop targets or glow
                borderWidth: (shouldShowGlow && draggedContainerType === 'image') ? '3px' : (isValidDropTarget ? '3px' : '1.5px'),
                boxShadow: (shouldShowGlow && draggedContainerType === 'image') ? `
                  0 0 0 1px rgba(16, 185, 129, 0.5),
                  0 0 25px rgba(16, 185, 129, 0.7),
                  0 0 50px rgba(16, 185, 129, 0.5),
                  inset 0 1px 0 rgba(255, 255, 255, 0.1)
                ` : (isValidDropTarget ? `
                  0 0 0 1px rgba(16, 185, 129, 0.5),
                  0 0 20px rgba(16, 185, 129, 0.6),
                  0 0 40px rgba(16, 185, 129, 0.4),
                  inset 0 1px 0 rgba(255, 255, 255, 0.1)
                ` : (pair.image ? `
                  0 0 0 1px rgba(30, 144, 255, 0.3),
                  0 0 15px rgba(30, 144, 255, 0.4),
                  0 0 30px rgba(0, 207, 255, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.05)
                ` : `
                  0 0 0 1px rgba(30, 144, 255, 0.15),
                  0 0 8px rgba(30, 144, 255, 0.2),
                  0 0 15px rgba(0, 207, 255, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.02)
                `)),
                borderRadius: '14px',
                animation: isValidDropTarget ? 'border-pulse 1.5s ease-in-out infinite alternate' : (pair.image ? 'border-pulse 3s ease-in-out infinite alternate' : 'none')
              }}
            >
              

              <div className="absolute inset-0 p-8">
                <ImageContainer
                  image={pair.image}
                  pairId={pair.id}
                  onSwap={onSwap}
                  draggedItem={draggedItem}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  isContainerDragMode={isContainerDragTarget}
                  draggedContainerType={draggedContainer?.type}
                  onContainerDragStart={onContainerDrag}
                  onContainerDragEnd={onContainerDrag}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Generation Animation Overlay */}
      <VideoGenerationAnimation
        pair={pair}
        isGenerating={videoState.isGenerating}
        progress={videoState.progress}
        isComplete={videoState.isComplete}
        generatedVideo={generatedVideo}
        onComplete={handleVideoGenerationComplete}
      />



      {/* Delete button positioned at top right of container */}
      <button
        onClick={handleDelete}
        className="absolute bottom-4 right-4 z-30 p-2 rounded-xl bg-gray-800/60 backdrop-blur-sm border border-gray-600/40 text-gray-400 hover:text-red-400 hover:border-red-400/50 hover:bg-red-500/20 transition-all duration-300"
        style={{
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Hover enhancement for entire pair */}
      <div 
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.03) 100%)',
          boxShadow: '0 0 80px rgba(59, 130, 246, 0.15)'
        }}
      />
    </motion.div>
  );
};

export default PairContainer;