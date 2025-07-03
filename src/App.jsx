import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from './store/appStore';
import { usePairingLogic } from './hooks/usePairingLogic';
import { useFFmpeg } from './hooks/useFFmpeg';
import Pairs from './components/Pairs';
import VideoPreviewCard from './components/VideoPreviewCard';
import BatchStatusIndicator from './components/BatchStatusIndicator';
import ScreenSizeWarning from './components/ScreenSizeWarning';
import DropZone from './components/DropZone';


function App() {
  const { pairs, generatedVideos, isGenerating, isCancelling, setVideoGenerationState, addGeneratedVideo, setIsGenerating, clearGeneratedVideos, getCompletePairs, setPairs } = useAppStore();
  const { handleFileDrop, swapContainers, clearFileCache } = usePairingLogic();
  const { generateVideos, stopGeneration } = useFFmpeg();
  const [draggedItem, setDraggedItem] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedContainer, setDraggedContainer] = useState(null);
  const [isContainerDragMode, setIsContainerDragMode] = useState(false);
  const [draggedContainerType, setDraggedContainerType] = useState(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isDraggingContainer, setIsDraggingContainer] = useState(false);

  const handleDragStart = useCallback((item) => {
    setDraggedItem(item);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
  }, []);

  const handleContainerDrag = (containerType, action, pairData) => {
    console.log('Container drag event:', containerType, action, pairData);

    if (action === 'start') {
      // Start container drag mode
      setIsContainerDragMode(true);
      setIsDraggingContainer(true);
      setDraggedContainerType(containerType); // 'audio' or 'image'
      setDraggedContainer(pairData); // The actual pair data with id

      console.log('Started dragging container:', {
        type: containerType,
        pairId: pairData.id,
        isDragging: true
      });

      // Auto-reset after 15 seconds as safety
      setTimeout(() => {
        if (isDraggingContainer) {
          console.log('Auto-resetting drag state');
          setIsContainerDragMode(false);
          setIsDraggingContainer(false);
          setDraggedContainerType(null);
          setDraggedContainer(null);
        }
      }, 15000);
    } else if (action === 'end') {
      console.log('Ending container drag');
      setDraggedContainer(null);
      setIsDraggingContainer(false); 
      setDraggedContainerType(null);
      setIsContainerDragMode(false);
    }
  };

  // Mouse tracking for drag visualization
  const handleMouseMove = useCallback((e) => {
    if (isDraggingContainer) {
      setDragPosition({ x: e.clientX, y: e.clientY });
    }
  }, [isDraggingContainer]);

  // Add mouse move listener when dragging
  React.useEffect(() => {
    if (isDraggingContainer) {
      document.addEventListener('mousemove', handleMouseMove);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, [isDraggingContainer, handleMouseMove]);

  const isValidContainerDragTarget = (targetPair) => {
    if (!draggedContainer || targetPair.id === draggedContainer.id) return false;

    // Determine what type the dragged container is
    const draggedHasAudio = !!draggedContainer.audio;
    const draggedHasImage = !!draggedContainer.image;
    const targetHasAudio = !!targetPair.audio;
    const targetHasImage = !!targetPair.image;

    // Enforce same-type swapping only:
    // - Audio containers can only swap with other audio containers
    // - Image containers can only swap with other image containers
    // - Empty containers can accept any type
    if (draggedHasAudio) {
      return targetHasAudio; // Audio can only swap with audio
    } else if (draggedHasImage) {
      return targetHasImage; // Image can only swap with image
    } else {
      // Dragged container is empty - can swap with any container
      return true;
    }
  };

  const handleGenerateVideos = async () => {
    console.log('Generate Videos button clicked');
    const completePairs = getCompletePairs();

    console.log('Complete pairs found:', completePairs.length);
    console.log('Complete pairs data:', completePairs);

    if (completePairs.length === 0) {
      console.log('No complete pairs found - showing alert');
      alert('Please add audio and image files first.');
      return;
    }

    console.log('Starting video generation for pairs:', completePairs);

    try {
      console.log('Setting isGenerating to true');
      setIsGenerating(true);
      console.log('Calling generateVideos function');
      await generateVideos(completePairs);
      console.log('Video generation completed successfully');
    } catch (error) {
      console.error('Error generating videos:', error);
      setIsGenerating(false);
      alert('Failed to generate videos. Please try again.');
    }
  };

  const handleDownloadVideos = async () => {
    if (generatedVideos.length === 0) {
      alert('No videos to download. Generate some videos first!');
      return;
    }

    if (generatedVideos.length === 1) {
      // Single video download
      const video = generatedVideos[0];
      const link = document.createElement('a');
      link.href = video.url;
      link.download = video.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Multiple videos - create ZIP (simplified approach)
      for (const video of generatedVideos) {
        const link = document.createElement('a');
        link.href = video.url;
        link.download = video.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();

    // Only show file drop overlay if dragging external files (not internal containers)
    const hasFiles = e.dataTransfer.types.includes('Files');
    const hasContainerData = e.dataTransfer.types.includes('text/plain');

    // Only trigger file drop UI if we have files and no container drag data
    if (hasFiles && !hasContainerData) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);

    // Only process files if this is an external file drop (not internal container dragging)
    const files = Array.from(e.dataTransfer.files);
    const hasContainerData = e.dataTransfer.types.includes('text/plain');

    if (files.length > 0 && !hasContainerData) {
      handleFileDrop(files);
    }
  }, [handleFileDrop]);

  const handleGlobalDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      // Clear the file cache before processing to ensure fresh processing
      clearFileCache();
      handleFileDrop(files);
    }
  }, [handleFileDrop, clearFileCache]);

  return (
    <div 
      className={`fixed inset-0 w-screen h-screen bg-gradient-to-br from-space-dark via-space-navy to-space-black transition-all duration-300 overflow-auto ${
        isDragOver ? 'bg-opacity-80 ring-4 ring-neon-blue/50' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-space-dark/90 backdrop-blur-sm"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                className="inline-flex items-center justify-center w-32 h-32 mb-6 rounded-full bg-neon-blue/20 border-4 border-dashed border-neon-blue"
              >
                <svg className="w-16 h-16 text-neon-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-2">Drop Files Anywhere</h2>
              <p className="text-xl text-gray-300">Audio and images will be automatically paired</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag Preview - Container that follows cursor */}
      <AnimatePresence>
        {isDraggingContainer && draggedContainer && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.9, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed pointer-events-none z-50"
            style={{
              left: dragPosition.x - 450, // Start at container position, not centered
              top: dragPosition.y - 96, // Start at container position
              transform: 'rotate(-3deg)' // Slight rotation for visual effect
            }}
          >
            {/* Show full-size version of the actual container being dragged */}
            <div
              className="backdrop-blur-sm border-2 rounded-xl overflow-hidden"
              style={{
                width: '450px', // Full size to match original container
                height: draggedContainerType === 'audio' ? '192px' : '200px',
                background: 'linear-gradient(135deg, #0A0F1C 0%, #050A13 100%)',
                borderColor: draggedContainerType === 'audio' ? '#1E90FF' : '#10B981',
                boxShadow: `
                  0 0 30px rgba(${draggedContainerType === 'audio' ? '30, 144, 255' : '16, 185, 129'}, 0.6),
                  0 0 60px rgba(${draggedContainerType === 'audio' ? '30, 144, 255' : '16, 185, 129'}, 0.4),
                  inset 0 1px 0 rgba(255, 255, 255, 0.1)
                `
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center p-4">
                {draggedContainerType === 'audio' ? (
                  // Simplified audio preview - just the title centered
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white text-lg font-medium text-center px-4">
                      {draggedContainer.audio?.name?.replace(/\.[^/.]+$/, "") || "Audio File"}
                    </span>
                  </div>
                ) : (
                  // Image container preview - full size
                  <div className="w-full h-full flex flex-col items-center justify-center relative">
                    {draggedContainer.image ? (
                      <img
                        src={URL.createObjectURL(draggedContainer.image)}
                        alt="Dragged"
                        className="w-full h-full object-cover rounded-lg opacity-80"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-green-500/20 to-emerald-400/20 rounded-lg flex items-center justify-center">
                        <svg className="w-12 h-12 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed inset-0 flex flex-col">
        {/* Header */}
        <header className={`p-6 border-b border-neon-blue/20 flex-shrink-0 transition-all duration-300 ${isContainerDragMode ? 'blur-sm' : ''}`}>
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              Type Beat Video Generator
            </h1>
            <p className="text-gray-400">
              Drop audio files and images anywhere to create stunning type beat videos
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className={`flex-1 flex flex-col p-6 overflow-y-auto transition-all duration-300 ${isContainerDragMode ? 'blur-sm' : ''}`}>
          <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* Empty State */}
        {pairs.every(pair => !pair.audio && !pair.image) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center flex-1 text-center w-full"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 mb-6 rounded-full bg-neon-blue/10 border-2 border-dashed border-neon-blue/30">
              <svg className="w-12 h-12 text-neon-blue/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Drop Your Files</h2>
            <p className="text-gray-400 text-lg max-w-md">
              Drag and drop your audio files (MP3, WAV) and images (PNG, JPG) anywhere on this page. 
              They will automatically pair together to create your type beat videos.
            </p>
          </motion.div>
        )}

        {/* Pairs Grid - Updated for wider containers */}
        {pairs.some(pair => pair.audio || pair.image) && (
          <div className="w-full flex flex-col items-center mb-8">
            <div className="flex flex-col gap-4 max-w-[1200px] w-full px-6">
              <AnimatePresence>
                {pairs.map((pair) => (
                  <motion.div
                    key={pair.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="w-full"
                  >
                    <Pairs
                      pair={pair}
                      onSwap={swapContainers}
                      draggedItem={draggedItem}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      clearFileCache={clearFileCache}
                      onContainerDrag={handleContainerDrag}
                      isValidContainerDragTarget={isValidContainerDragTarget}
                      draggedContainer={draggedContainer}
                      isDraggingContainer={isDraggingContainer}
                      draggedContainerType={draggedContainerType}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {pairs.some(pair => pair.audio || pair.image) && (
          <div className="flex justify-center gap-4 mb-8">
            <motion.button
              onClick={handleGenerateVideos}
              disabled={isGenerating}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white font-semibold text-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isGenerating ? (
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Generating Videos...</span>
                </div>
              ) : (
                'Generate Videos'
              )}
            </motion.button>

            {/* Stop Generation Button */}
            {isGenerating && !isCancelling && (
              <motion.button
                onClick={stopGeneration}
                className="px-8 py-4 bg-red-600 hover:bg-red-500 rounded-2xl text-white font-semibold text-lg shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Stop Generation</span>
                </div>
              </motion.button>
            )}

            {/* Cancelling Status */}
            {isCancelling && (
              <motion.div
                className="px-8 py-4 bg-yellow-600 rounded-2xl text-white font-semibold text-lg shadow-lg shadow-yellow-500/25"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Stopping Generation...</span>
                </div>
              </motion.div>
            )}

            {generatedVideos.length > 0 && (
              <motion.button
                onClick={handleDownloadVideos}
                className="px-8 py-4 bg-green-600 hover:bg-green-500 rounded-2xl text-white font-semibold text-lg shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download Videos</span>
                </div>
              </motion.button>
            )}
          </div>
        )}



        {/* Batch Status Indicator */}
        {pairs.some(pair => pair.audio || pair.image) && (
          <BatchStatusIndicator 
            totalPairs={pairs.length} 
            completedPairs={generatedVideos.length}
            isProcessing={isGenerating}
          />
        )}
          </div>
        </main>
      </div>

    </div>
  );
}

export default App;