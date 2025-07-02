import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AudioContainer from './AudioContainer';
import ImageContainer from './ImageContainer';
import VideoGenerationAnimation from './VideoGenerationAnimation';
import { useAppStore } from '../store/appStore';

const Pairs = ({ pair, onSwap, draggedItem, onDragStart, onDragEnd, clearFileCache, onContainerDrag, isValidContainerDragTarget, draggedContainer, isDraggingContainer, draggedContainerType }) => {
  const { removePair, getVideoGenerationState, setVideoGenerationState, generatedVideos } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOverContainer, setIsDragOverContainer] = useState(false);

  // Check if this container is a valid drop target
  const isValidDropTarget = draggedContainer && isValidContainerDragTarget && isValidContainerDragTarget(pair);
  const [isContainerDragTarget, setIsContainerDragTarget] = useState(false); // New state for container drag target

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
    
    // Only show drag over state if this is a valid drop target for container swapping
    if (draggedContainer && draggedContainer.id !== pair.id && isValidDropTarget) {
      setIsDragOverContainer(true);
    }
  };

  const handleContainerDragLeave = (e) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOverContainer(false);
    }
  };

  const handleContainerDrop = (e) => {
    e.preventDefault();
    setIsDragOverContainer(false);
    
    try {
      // Handle both main container drag and individual container drag
      const dragDataString = e.dataTransfer.getData('application/json');
      if (dragDataString) {
        const dragData = JSON.parse(dragDataString);
        
        // Handle main container drag (from drag handle)
        if (dragData.type === 'container' && dragData.pairId !== pair.id) {
          const draggedPairData = dragData.pairData;
          
          // Determine what type of content to swap based on what the dragged container has
          const draggedHasAudio = !!draggedPairData.audio;
          const draggedHasImage = !!draggedPairData.image;
          const targetHasAudio = !!pair.audio;
          const targetHasImage = !!pair.image;
          
          // Only allow same-type swapping
          if (draggedHasAudio && targetHasAudio) {
            // Swap audio content
            onSwap(dragData.pairId, pair.id, 'audio');
          } else if (draggedHasImage && targetHasImage) {
            // Swap image content
            onSwap(dragData.pairId, pair.id, 'image');
          }
        }
        // Handle individual container drag (from move buttons)
        else if (dragData.type === 'individual-container' && dragData.pairId !== pair.id) {
          const draggedContainerType = dragData.containerType;
          
          // Only allow same-type swapping
          if (draggedContainerType === 'audio' && pair.audio) {
            onSwap(dragData.pairId, pair.id, 'audio');
          } else if (draggedContainerType === 'image' && pair.image) {
            onSwap(dragData.pairId, pair.id, 'image');
          }
        }
      }
    } catch (error) {
      console.error('Error handling container drop:', error);
    }
    
    // Also handle the state-based drag system for compatibility
    if (draggedContainer && draggedContainer.id !== pair.id && isValidDropTarget) {
      const draggedHasAudio = !!draggedContainer.audio;
      const draggedHasImage = !!draggedContainer.image;
      
      if (draggedHasAudio && pair.audio) {
        onSwap(draggedContainer.id, pair.id, 'audio');
      } else if (draggedHasImage && pair.image) {
        onSwap(draggedContainer.id, pair.id, 'image');
      }
    }
  };

  const handleFileDrop = async (e) => {
    e.preventDefault();
    setIsDragOverContainer(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      // Handle file drops through the main drop handler
      const dropEvent = new Event('drop', { bubbles: true });
      dropEvent.dataTransfer = e.dataTransfer;
      document.dispatchEvent(dropEvent);
    }
  };

  const handleFilesDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if this is a file drag (not container drag)
    const types = Array.from(e.dataTransfer.types);
    if (types.includes('Files')) {
      setIsDragOverContainer(true);
    }
  };

  const handleFilesDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOverContainer(false);
    }
  };

  return (
    <motion.div className="relative">
      {/* Delete button - positioned at top right of container */}
      {!generatedVideo && (
        <button
          onClick={handleDelete}
          className="absolute top-4 right-4 z-30 p-2 rounded-xl bg-red-500/20 backdrop-blur-sm border border-red-400/40 text-red-400 hover:text-red-300 hover:border-red-300/50 hover:bg-red-500/30 transition-all duration-300"
          style={{
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}
          title="Delete this pair"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Video Generation Animation */}
      <VideoGenerationAnimation
        pair={pair}
        isGenerating={videoState?.isGenerating || false}
        progress={videoState?.progress || 0}
        isComplete={videoState?.isComplete || false}
        generatedVideo={generatedVideo}
        onComplete={handleVideoGenerationComplete}
      />

      {/* Drag handle positioned at top left of container */}
      {!generatedVideo && (
        <div
          className="absolute top-4 left-4 z-30 p-2 rounded-xl bg-gray-800/60 backdrop-blur-sm border border-gray-600/40 text-gray-400 hover:text-blue-400 hover:border-blue-400/50 hover:bg-blue-500/20 transition-all duration-300 cursor-move"
          style={{
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}
          draggable="true"
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('application/json', JSON.stringify({
              type: 'container',
              pairId: pair.id,
              pairData: pair
            }));
            handleContainerDragStart(e);
          }}
          onDragEnd={handleContainerDragEnd}
          title="Drag to reorder container"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
          </svg>
        </div>
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
        <div 
          className="flex flex-col lg:flex-row items-center relative gap-4 lg:gap-6 z-10"
          onDragOver={handleContainerDragOver}
          onDragLeave={handleContainerDragLeave}
          onDrop={handleContainerDrop}
        >
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
                borderColor: pair.audio ? '#1E90FF' : 'rgba(30, 144, 255, 0.3)',
                borderWidth: '1.5px',
                boxShadow: pair.audio ? `
                  0 0 0 1px rgba(30, 144, 255, 0.3),
                  0 0 15px rgba(30, 144, 255, 0.4),
                  0 0 30px rgba(0, 207, 255, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.05)
                ` : `
                  0 0 0 1px rgba(30, 144, 255, 0.15),
                  0 0 8px rgba(30, 144, 255, 0.2),
                  0 0 15px rgba(0, 207, 255, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.02)
                `,
                borderRadius: '14px',
                animation: pair.audio ? 'border-pulse 3s ease-in-out infinite alternate' : 'none'
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
                  draggedContainer={draggedContainer}
                  onContainerDragStart={onContainerDrag}
                  onContainerDragEnd={onContainerDrag}
                  // Pass the targeted highlighting props
                  isDraggingContainer={isDraggingContainer}
                  shouldShowGlow={(isDraggingContainer && draggedContainerType === 'audio' && draggedContainer && draggedContainer.id !== pair.id && !!pair.audio) || (draggedItem?.type === 'audio' && draggedItem.pairId !== pair.id && !!pair.audio)}
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
                  borderRadius: '6px',
                  animation: 'border-pulse 3s ease-in-out infinite alternate'
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
                  borderRadius: '6px',
                  animation: 'border-pulse 3s ease-in-out infinite alternate'
                }}
              />
              
              {/* Center flare effect */}
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
                borderColor: pair.image ? '#1E90FF' : 'rgba(30, 144, 255, 0.3)',
                borderWidth: '1.5px',
                boxShadow: pair.image ? `
                  0 0 0 1px rgba(30, 144, 255, 0.3),
                  0 0 15px rgba(30, 144, 255, 0.4),
                  0 0 30px rgba(0, 207, 255, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.05)
                ` : `
                  0 0 0 1px rgba(30, 144, 255, 0.15),
                  0 0 8px rgba(30, 144, 255, 0.2),
                  0 0 15px rgba(0, 207, 255, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.02)
                `,
                borderRadius: '14px',
                animation: pair.image ? 'border-pulse 3s ease-in-out infinite alternate' : 'none'
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
                  // Pass the targeted highlighting props
                  isDraggingContainer={isDraggingContainer}
                  shouldShowGlow={(isDraggingContainer && draggedContainerType === 'image' && draggedContainer && draggedContainer.id !== pair.id && !!pair.image) || (draggedItem?.type === 'image' && draggedItem.pairId !== pair.id && !!pair.image)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Pairs;