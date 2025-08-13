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
import AnimatedBackground from './components/AnimatedBackground';
import LoadingWindow from './components/LoadingWindow';
import DownloadPage from './components/DownloadPage';
import Header from './components/Header';
import Footer from './components/Footer';
import SettingsPanel from './components/SettingsPanel';
import SpacingSlider from './components/SpacingSlider';


function App() {
  const { pairs, generatedVideos, isGenerating, isCancelling, setVideoGenerationState, addGeneratedVideo, setIsGenerating, clearGeneratedVideos, getCompletePairs, setPairs, getVideoGenerationState, getCurrentPage, setCurrentPage, containerSpacing, resetPageState, setIsFilesBeingDropped } = useAppStore();
  const { handleFileDrop, moveContainerUp, moveContainerDown, clearFileCache } = usePairingLogic();
  const { generateVideos, stopGeneration } = useFFmpeg();
  const [isDragOver, setIsDragOver] = useState(false);
  const [hasLeftDownloadPage, setHasLeftDownloadPage] = useState(false);

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

    // Trigger swap animation on source container too
    const sourceElement = document.querySelector(`[data-pair-id="${sourcePairId}"]`);
    if (sourceElement) {
      const containerDiv = sourceElement.querySelector('.relative');
      if (containerDiv) {
        containerDiv.classList.add('animate-swap-container');
        setTimeout(() => {
          containerDiv.classList.remove('animate-swap-container');
        }, 800);
      }
    }

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

  // Wrapper for DropZone component - handles files array directly
  const handleDropZoneFiles = useCallback((files) => {
    if (files.length > 0) {
      // Clear the file cache before processing to ensure fresh processing
      clearFileCache();
      handleFileDrop(files);
    }
  }, [handleFileDrop, clearFileCache]);

  // Page management
  const currentPage = getCurrentPage();

  // Track when user leaves download page after generating videos
  React.useEffect(() => {
    if (currentPage === 'download' && generatedVideos.length > 0) {
      setHasLeftDownloadPage(false); // Reset when on download page
    } else if (currentPage !== 'download' && generatedVideos.length > 0) {
      setHasLeftDownloadPage(true); // Mark as left when navigating away with videos
    }
  }, [currentPage, generatedVideos.length]);

  // Recovery mechanism for stuck states
  React.useEffect(() => {
    const checkForStuckState = () => {
      const hasFiles = pairs.some(pair => pair.audio || pair.image);
      const hasVideos = generatedVideos.length > 0;

      // If we're on upload page but have files, and not generating or dropping files
      if (currentPage === 'upload' && hasFiles && !isGenerating && !useAppStore.getState().isFilesBeingDropped) {
        console.log('Detected stuck state: on upload page with files, recovering...');
        resetPageState();
      }

      // If we're stuck in file dropping state for too long
      if (useAppStore.getState().isFilesBeingDropped) {
        setTimeout(() => {
          if (useAppStore.getState().isFilesBeingDropped) {
            console.log('File dropping state stuck, forcing reset...');
            setIsFilesBeingDropped(false);
          }
        }, 3000); // 3 second timeout
      }

      // Check for stuck video generation states
      if (isGenerating) {
        const { videoGenerationStates, clearStuckGenerationStates } = useAppStore.getState();
        const stuckStates = Object.values(videoGenerationStates).filter(state => 
          state.isGenerating && state.progress > 0 && state.progress < 100 && !state.isComplete
        );

        if (stuckStates.length > 0) {
          console.log('Detected stuck video generation states, clearing...');
          clearStuckGenerationStates();
        }
      }
    };

    const timeoutId = setTimeout(checkForStuckState, 2000);
    return () => clearTimeout(timeoutId);
  }, [currentPage, pairs, generatedVideos, isGenerating, resetPageState, setIsFilesBeingDropped]);

  const handleBackToFileManagement = useCallback(() => {
    clearGeneratedVideos();
    setHasLeftDownloadPage(false); // Reset when clearing videos
    // This will automatically set page to 'fileManagement' or 'upload' based on files
  }, [clearGeneratedVideos]);

  const handleBackToDownloads = useCallback(() => {
    // Force navigate back to download page
    setHasLeftDownloadPage(false);
    setCurrentPage('download');
  }, [setHasLeftDownloadPage, setCurrentPage]);

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

    // Check if already generating
    if (isGenerating) {
      console.log('Generation already in progress');
      return;
    }

    console.log('Starting video generation for pairs:', completePairs);

    try {
      console.log('Calling generateVideos function');
      await generateVideos(completePairs);
      console.log('Video generation completed successfully');
    } catch (error) {
      console.error('Error generating videos:', error);

      // Check if it was cancelled
      if (error.message === 'Generation cancelled by user' || isCancelling) {
        console.log('Video generation was cancelled by user');
        // Don't show error alert for cancellation
      } else {
        alert('Failed to generate videos. Please try again.');
      }
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

  // Determine if files are present for conditional rendering
  const hasFiles = pairs.some(pair => pair.audio || pair.image);

  return (
    <div 
      className={`fixed inset-0 w-screen h-screen transition-all duration-300 overflow-auto ${
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
      {/* Animated Background */}
      <AnimatedBackground />

      <div className="fixed inset-0 flex justify-center">
        <div className="w-full max-w-6xl transition-all duration-300 overflow-auto">
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
              <h2 className="text-section-title text-white mb-2">Drop Files Anywhere</h2>
              <p className="text-lg text-gray-300">Audio and images will be automatically paired</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page 1: Upload Page - Drop Zone - Show when no files are present */}
      {currentPage === 'upload' && (
        <motion.div
          data-page-section="upload"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 flex items-center justify-center p-6 pt-24 pb-24"
          style={{ zIndex: 100 }}
        >
          <DropZone
            onFileDrop={handleDropZoneFiles}
            hasFiles={false}
          />
        </motion.div>
      )}

      {/* Page 4: Download Page - Show when videos are generated */}
      {currentPage === 'download' && (
        <div data-page-section="download">
          <DownloadPage
            onDownloadAll={handleDownloadVideos}
            onBackToFileManagement={handleBackToFileManagement}
          />
        </div>
      )}

      <div className="fixed inset-0 flex flex-col bg-overlay" style={{ zIndex: 2 }}>
        {/* Main Content with conditional header/footer spacing */}
        <main className={`flex-1 flex flex-col ${hasFiles ? 'pt-20 px-6 pb-24' : 'p-6'} overflow-y-auto transition-all duration-500 ${isGenerating ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 scale-100'}`}>
          <div className="w-full space-y-6">

            {/* Page 2: File Management - Pairs Grid */}
            {currentPage === 'fileManagement' && (
              <motion.div data-page-section="fileManagement">
                <motion.div
                  className="w-full flex flex-col items-center mb-8"
                >
                  <motion.div
                    className="flex flex-col max-w-[1200px] w-full px-6"
                    style={{ gap: `${containerSpacing}px`, marginTop: '64px' }} // Set to 64px to match header height
                  >
                    <AnimatePresence>
                      {pairs
                        .filter(pair => {
                          // During generation, only show pairs that have files or are being processed
                          if (isGenerating) {
                            return (pair.audio && pair.image) || getVideoGenerationState(pair.id);
                          }
                          // When not generating, show pairs that have at least one file
                          return pair.audio || pair.image;
                        })
                        .map((pair, index) => (
                        <motion.div
                          key={pair.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.4, delay: 0.1 }}
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
                  </motion.div>
                </motion.div>
              </motion.div>
            )}

            {/* Action Buttons for File Management Page */}
            {currentPage === 'fileManagement' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center gap-4 mb-8"
                style={{ marginTop: '10px' }}
              >
                {/* Back to Downloads button - only show if user has generated videos and left download page */}
                {hasLeftDownloadPage && generatedVideos.length > 0 && (
                  <motion.button
                    onClick={handleBackToDownloads}
                    className="spotlight-button back-to-downloads-button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="wrapper">
                      <span>← BACK TO DOWNLOADS</span>
                      <div className="circle circle-1"></div>
                      <div className="circle circle-2"></div>
                      <div className="circle circle-3"></div>
                      <div className="circle circle-4"></div>
                      <div className="circle circle-5"></div>
                      <div className="circle circle-6"></div>
                      <div className="circle circle-7"></div>
                      <div className="circle circle-8"></div>
                      <div className="circle circle-9"></div>
                      <div className="circle circle-10"></div>
                      <div className="circle circle-11"></div>
                      <div className="circle circle-12"></div>
                    </div>
                  </motion.button>
                )}

                {/* Generate Videos button moved to Footer */}

                {/* Stop Generation Button */}
                {isGenerating && !isCancelling && (
                  <motion.button
                    onClick={stopGeneration}
                    className="spotlight-button stop-button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="wrapper">
                      <span>STOP!</span>
                      <div className="circle circle-1"></div>
                      <div className="circle circle-2"></div>
                      <div className="circle circle-3"></div>
                      <div className="circle circle-4"></div>
                      <div className="circle circle-5"></div>
                      <div className="circle circle-6"></div>
                      <div className="circle circle-7"></div>
                      <div className="circle circle-8"></div>
                      <div className="circle circle-9"></div>
                      <div className="circle circle-10"></div>
                      <div className="circle circle-11"></div>
                      <div className="circle circle-12"></div>
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

                {/* Show Download All Videos button when videos are generated */}
                {generatedVideos.length > 0 && (
                  <motion.button
                    onClick={() => {
                      generatedVideos.forEach(video => {
                        const link = document.createElement('a');
                        link.href = video.url;
                        link.download = video.filename;
                        link.click();
                      });
                    }}
                    className="spotlight-button download-button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="wrapper">
                      <span>DOWNLOAD ALL VIDEOS</span>
                      <div className="circle circle-1"></div>
                      <div className="circle circle-2"></div>
                      <div className="circle circle-3"></div>
                      <div className="circle circle-4"></div>
                      <div className="circle circle-5"></div>
                      <div className="circle circle-6"></div>
                      <div className="circle circle-7"></div>
                      <div className="circle circle-8"></div>
                      <div className="circle circle-9"></div>
                      <div className="circle circle-10"></div>
                      <div className="circle circle-11"></div>
                      <div className="circle circle-12"></div>
                    </div>
                  </motion.button>
                )}
              </motion.div>
            )}

            {/* Batch Status Indicator */}
            {hasFiles && (
              <BatchStatusIndicator 
                totalPairs={pairs.length} 
                completedPairs={generatedVideos.length}
                isProcessing={isGenerating}
              />
            )}
          </div>
        </main>
      </div>

      {/* Header */}
      <Header />

      {/* Footer */}
      <Footer onGenerateVideos={handleGenerateVideos} />

      {/* Spacing Slider */}
      <SpacingSlider />


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

      {/* Loading Window */}
      <LoadingWindow 
        isVisible={isGenerating}
        pairs={getCompletePairs()}
        onClose={() => {
          // Loading window will close automatically when generation completes
        }}
        onStop={stopGeneration}
      />

        </div>
      </div>
    </div>
  );
}

export default App;