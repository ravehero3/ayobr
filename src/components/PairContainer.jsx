import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AudioContainer from './AudioContainer';
import ImageContainer from './ImageContainer';
import VideoGenerationAnimation from './VideoGenerationAnimation';
import PairMergeAnimation from './PairMergeAnimation';
import { useAppStore } from '../store/appStore';

const Pairs = ({ pair, onSwap, draggedItem, onDragStart, onDragEnd, clearFileCache, onContainerDrag, isValidContainerDragTarget, draggedContainer, isDraggingContainer, draggedContainerType, onStartAudioDrag, onStartImageDrag, onUpdateDragPosition, onEndDrag }) => {
  const { removePair, getVideoGenerationState, setVideoGenerationState, generatedVideos, pairs, setPairs, updatePair } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOverContainer, setIsDragOverContainer] = useState(false);
  const [isValidDragTarget, setIsValidDragTarget] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

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
      setIsValidDragTarget(true);
    }
  };

  const handleContainerDragLeave = (e) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOverContainer(false);
      setIsValidDragTarget(false);
    }
  };

  const handleContainerDrop = (e) => {
    e.preventDefault();
    setIsDragOverContainer(false);
    setIsValidDragTarget(false);

    try {
      // Trigger swap animation
      setIsSwapping(true);
      setTimeout(() => setIsSwapping(false), 800); // Reset after animation completes

      // Handle both main container drag (from drag handle)
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
            setTimeout(() => onSwap(dragData.pairId, pair.id, 'audio'), 200);
          } else if (draggedHasImage && targetHasImage) {
            // Swap image content
            setTimeout(() => onSwap(dragData.pairId, pair.id, 'image'), 200);
          }
        }
        // Handle individual container drag (from move buttons)
        else if (dragData.type === 'individual-container' && dragData.pairId !== pair.id) {
          const draggedContainerType = dragData.containerType;

          // Only allow same-type swapping
          if (draggedContainerType === 'audio' && pair.audio) {
            setTimeout(() => onSwap(dragData.pairId, pair.id, 'audio'), 200);
          } else if (draggedContainerType === 'image' && pair.image) {
            setTimeout(() => onSwap(dragData.pairId, pair.id, 'image'), 200);
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
        setTimeout(() => onSwap(draggedContainer.id, pair.id, 'audio'), 200);
      } else if (draggedHasImage && pair.image) {
        setTimeout(() => onSwap(draggedContainer.id, pair.id, 'image'), 200);
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
    <motion.div className="relative" data-pair-id={pair.id}>
      {/* Delete button - positioned at top right of container */}
      {!generatedVideo && (
        <button
          onClick={handleDelete}
          className="absolute top-4 right-4 z-30 p-2 rounded-xl bg-red-500/20 backdrop-blur-sm border border-red-400/40 text-red-400 hover:text-red-300 hover:border-red-300/50 hover:bg-red-500/30 transition-all duration-300 opacity-0 group-hover:opacity-100"
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

      {/* Individual pair animations are now handled by the central LoadingWindow */}

      {/* Show generated video if available and not generating */}
      {generatedVideo && !videoState?.isGenerating ? (
        <div className="flex justify-center relative z-10">
          <div
            className="relative w-full max-w-[800px] border overflow-hidden group/container glass-container"
            style={{
              height: '450px',
              minHeight: '450px',
              maxHeight: '450px',
              borderColor: '#10B981', // Green border for completed video
              borderWidth: '2px',
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
      ) : !videoState?.isGenerating && !generatedVideo ? (
        <div 
          className="flex flex-col lg:flex-row items-center relative z-10 group/pair mb-8"
          style={{ 
            gap: '4px',
            paddingLeft: '30px',
            paddingRight: '30px',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '69px'
          }}
        >
          {/* Audio Container */}  
          <div 
            className={`relative transition-all duration-300 ${
              isSwapping ? 'animate-swap-container' : ''
            }`}
            onDragOver={handleContainerDragOver}
            onDragLeave={handleContainerDragLeave}
            onDrop={handleContainerDrop}
          >
            <div
              className="relative group/container audio-container"
              style={{
                height: '200px',
                minHeight: '200px',
                maxHeight: '200px',
                width: '500px',
                minWidth: '500px',
                maxWidth: '500px',
                overflow: 'visible',
              }}
            >

              <div className="absolute inset-0 p-4">
                <motion.div
                  animate={{
                    opacity: videoState?.isGenerating ? 0.3 : 1
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <AudioContainer
                    audio={pair.audio}
                    pairId={pair.id}
                  onMoveUp={() => {
                    const currentIndex = pairs.findIndex(p => p.id === pair.id);
                    if (currentIndex > 0) {
                      const newPairs = [...pairs];
                      [newPairs[currentIndex - 1], newPairs[currentIndex]] = [newPairs[currentIndex], newPairs[currentIndex - 1]];
                      setPairs(newPairs);
                    }
                  }}
                  onMoveDown={() => {
                    const currentIndex = pairs.findIndex(p => p.id === pair.id);
                    if (currentIndex >= 0 && currentIndex < pairs.length - 1) {
                      const newPairs = [...pairs];
                      [newPairs[currentIndex], newPairs[currentIndex + 1]] = [newPairs[currentIndex + 1], newPairs[currentIndex]];
                      setPairs(newPairs);
                    }
                  }}
                  onDelete={() => {
                    updatePair(pair.id, { audio: null });
                  }}
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
                    // New drag overlay handlers
                    onStartAudioDrag={onStartAudioDrag}
                    onUpdateDragPosition={onUpdateDragPosition}
                    onEndDrag={onEndDrag}
                  />
                </motion.div>
              </div>
            </div>
          </div>

          {/* Connecting Bridge - Simple Plus Symbol */}
          <div className="relative z-20 hidden lg:flex items-center justify-center flex-shrink-0 connecting-bridge" style={{ 
            width: '24px', 
            height: '48px'
          }}>
            <div className="relative flex items-center justify-center" style={{ width: '24px', height: '48px' }}>
              {/* Plus icon using SVG for crisp rendering */}
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none"
              >
                <path 
                  d="M12 5V19M5 12H19" 
                  stroke="rgba(255, 255, 255, 0.2)" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Image Container */}
          <div 
            className={`relative transition-all duration-300 ${
              isSwapping ? 'animate-swap-container' : ''
            }`}
            onDragOver={handleContainerDragOver}
            onDragLeave={handleContainerDragLeave}
            onDrop={handleContainerDrop}
          >
            <div
              className="relative overflow-hidden group/container image-container"
              style={{
                height: '200px',
                minHeight: '200px',
                maxHeight: '200px',
                width: '500px',
                minWidth: '500px',
                maxWidth: '500px',
                overflow: 'visible',
              }}
            >

              <div className="absolute inset-0 p-4">
                <motion.div
                  animate={{
                    opacity: videoState?.isGenerating ? 0.3 : 1
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <ImageContainer
                  image={pair.image}
                  pairId={pair.id}
                  onMoveUp={() => {
                    const currentIndex = pairs.findIndex(p => p.id === pair.id);
                    if (currentIndex > 0) {
                      const newPairs = [...pairs];
                      [newPairs[currentIndex - 1], newPairs[currentIndex]] = [newPairs[currentIndex], newPairs[currentIndex - 1]];
                      setPairs(newPairs);
                    }
                  }}
                  onMoveDown={() => {
                    const currentIndex = pairs.findIndex(p => p.id === pair.id);
                    if (currentIndex >= 0 && currentIndex < pairs.length - 1) {
                      const newPairs = [...pairs];
                      [newPairs[currentIndex], newPairs[currentIndex + 1]] = [newPairs[currentIndex + 1], newPairs[currentIndex]];
                      setPairs(newPairs);
                    }
                  }}
                  onDelete={() => {
                    updatePair(pair.id, { image: null });
                  }}
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
                    // New drag overlay handlers
                    onStartImageDrag={onStartImageDrag}
                    onUpdateDragPosition={onUpdateDragPosition}
                    onEndDrag={onEndDrag}
                  />
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
};

export default Pairs;