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
import AudioContainerCopy from './components/AudioContainerCopy';
import ImageContainerCopy from './components/ImageContainerCopy';


function App() {
  const { pairs, generatedVideos, isGenerating, isCancelling, setVideoGenerationState, addGeneratedVideo, setIsGenerating, clearGeneratedVideos, getCompletePairs, setPairs } = useAppStore();
  const { handleFileDrop, moveContainerUp, moveContainerDown, clearFileCache } = usePairingLogic();
  const { generateVideos, stopGeneration } = useFFmpeg();
  const [isDragOver, setIsDragOver] = useState(false);

  // Drag overlay state
  const [dragState, setDragState] = useState({
    isAudioDragging: false,
    isImageDragging: false,
    draggedAudio: null,
    draggedImage: null,
    mousePosition: { x: 0, y: 0 }
  });

  // Drag handlers for containers
  const handleStartAudioDrag = useCallback((audio, mousePosition) => {
    setDragState({
      isAudioDragging: true,
      isImageDragging: false,
      draggedAudio: audio,
      draggedImage: null,
      mousePosition
    });
  }, []);

  const handleStartImageDrag = useCallback((image, mousePosition) => {
    setDragState({
      isAudioDragging: false,
      isImageDragging: true,
      draggedAudio: null,
      draggedImage: image,
      mousePosition
    });
  }, []);

  const handleUpdateDragPosition = useCallback((mousePosition) => {
    setDragState(prev => ({
      ...prev,
      mousePosition
    }));
  }, []);

  const handleEndDrag = useCallback((targetFound = false) => {
    if (!targetFound) {
      // If no valid target found, animate back to origin
      // The container copy components will handle this animation
      setTimeout(() => {
        setDragState({
          isAudioDragging: false,
          isImageDragging: false,
          draggedAudio: null,
          draggedImage: null,
          mousePosition: { x: 0, y: 0 }
        });
      }, 300); // Wait for return animation to complete
    } else {
      // Immediate cleanup if dropped on valid target
      setDragState({
        isAudioDragging: false,
        isImageDragging: false,
        draggedAudio: null,
        draggedImage: null,
        mousePosition: { x: 0, y: 0 }
      });
    }
  }, []);

  // Swap function to handle audio/image swapping between containers
  const handleSwap = useCallback((sourcePairId, targetPairId, type) => {
    const currentPairs = [...pairs];
    const sourceIndex = currentPairs.findIndex(p => p.id === sourcePairId);
    const targetIndex = currentPairs.findIndex(p => p.id === targetPairId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    if (type === 'audio') {
      // Swap audio files between containers
      const tempAudio = currentPairs[sourceIndex].audio;
      currentPairs[sourceIndex].audio = currentPairs[targetIndex].audio;
      currentPairs[targetIndex].audio = tempAudio;
    } else if (type === 'image') {
      // Swap image files between containers
      const tempImage = currentPairs[sourceIndex].image;
      currentPairs[sourceIndex].image = currentPairs[targetIndex].image;
      currentPairs[targetIndex].image = tempImage;
    }

    setPairs(currentPairs);
  }, [pairs, setPairs]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();

    // Show file drop overlay when dragging files
    const hasFiles = e.dataTransfer.types.includes('Files');
    if (hasFiles) {
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

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
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

  return (
    <div 
      className={`fixed inset-0 w-screen h-screen custom-background transition-all duration-300 overflow-auto ${
        isDragOver ? 'bg-opacity-80 ring-4 ring-neon-blue/50' : ''
      } ${
        dragState.isAudioDragging ? 'audio-drag-active' : ''
      } ${
        dragState.isImageDragging ? 'image-drag-active' : ''
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

      <div className="fixed inset-0 flex flex-col bg-overlay" style={{ zIndex: 2 }}>
        {/* Header */}
        <header className="p-6 border-b border-white/10 flex-shrink-0">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              Type Beat Video Generator
            </h1>
            <p className="text-sm text-[#AAA]">
              Drop audio files and images anywhere to create stunning type beat videos
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col p-6 overflow-y-auto">
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
            <div className="flex flex-col gap-6 max-w-[1200px] w-full px-6">
              <AnimatePresence>
                {pairs.map((pair, index) => (
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
                      index={index}
                      onMoveUp={moveContainerUp}
                      onMoveDown={moveContainerDown}
                      onStartAudioDrag={handleStartAudioDrag}
                      onStartImageDrag={handleStartImageDrag}
                      onUpdateDragPosition={handleUpdateDragPosition}
                      onEndDrag={handleEndDrag}
                      onSwap={handleSwap}
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
            <button
              onClick={handleGenerateVideos}
              disabled={isGenerating}
              className="generate-videos-btn"
            >
              <span className="btn-text">
                {isGenerating ? 'Generating...' : 'Generate Videos'}
              </span>
              <span className="btn-icon">
                {isGenerating ? '⟳' : '→'}
              </span>
            </button>

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

      {/* Drag Overlay for Container Copies */}
      <AudioContainerCopy 
        audio={dragState.draggedAudio}
        isVisible={dragState.isAudioDragging}
        mousePosition={dragState.mousePosition}
      />

      <ImageContainerCopy 
        image={dragState.draggedImage}
        isVisible={dragState.isImageDragging}
        mousePosition={dragState.mousePosition}
      />

    </div>
  );
}

export default App;