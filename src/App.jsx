import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from './store/appStore';
import { usePairingLogic } from './hooks/usePairingLogic';
import { useFFmpeg } from './hooks/useFFmpeg';
import PairContainer from './components/PairContainer';
import VideoPreviewCard from './components/VideoPreviewCard';
import BatchStatusIndicator from './components/BatchStatusIndicator';
import ScreenSizeWarning from './components/ScreenSizeWarning';
import DropZone from './components/DropZone';


function App() {
  const { pairs, generatedVideos, isGenerating, isCancelling, setVideoGenerationState, addGeneratedVideo, setIsGenerating, clearGeneratedVideos, getCompletePairs } = useAppStore();
  const { handleFileDrop, swapContainers } = usePairingLogic();
  const { generateVideos, stopGeneration } = useFFmpeg();
  const [draggedItem, setDraggedItem] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragStart = useCallback((item) => {
    setDraggedItem(item);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
  }, []);

  const handleGenerateVideos = async () => {
    const completePairs = getCompletePairs();

    if (completePairs.length === 0) {
      alert('Please add at least one complete pair (audio + image) to generate videos.');
      return;
    }

    console.log('Starting video generation for pairs:', completePairs);

    // Check if FFmpeg files are accessible
    try {
      const response = await fetch('/ffmpeg/ffmpeg-core.js');
      if (!response.ok) {
        console.error('FFmpeg core file not accessible:', response.status);
        alert('FFmpeg files are not accessible. Please ensure they are in the public/ffmpeg folder.');
        return;
      }
      console.log('FFmpeg files are accessible');
    } catch (error) {
      console.error('Error checking FFmpeg files:', error);
      alert('Error checking FFmpeg files. Please check the console for details.');
      return;
    }

    try {
      setIsGenerating(true);
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
    setIsDragOver(true);
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

      <div className="fixed inset-0 flex flex-col">
        {/* Header */}
        <header className="p-6 border-b border-neon-blue/20 flex-shrink-0">
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
        <main className="flex-1 flex flex-col p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* Empty State */}
        {pairs.length === 0 && (
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
        {pairs.length > 0 && (
          <div className="w-full flex flex-col items-center mb-8">
            <div className="flex flex-col gap-12 max-w-[1200px] w-full px-6">
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
                    <PairContainer
                      pair={pair}
                      onSwap={swapContainers}
                      draggedItem={draggedItem}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {pairs.length > 0 && (
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

        {/* Generated Videos */}
        {generatedVideos.length > 0 && (
          <div className="space-y-4" style={{ width: '1200px', maxHeight: '200px', overflowY: 'auto' }}>
            <h2 className="text-xl font-bold text-white text-center">Generated Videos</h2>
            <div className="grid grid-cols-6 gap-4 justify-items-center">
              {generatedVideos.map((video) => (
                <VideoPreviewCard key={video.id} video={video} />
              ))}
            </div>
          </div>
        )}

        {/* Pairs Section */}
        {pairs.length === 0 ? (
          <DropZone onFileDrop={handleFileDrop} />
        ) : (
          <>
            <BatchStatusIndicator 
              totalPairs={pairs.length} 
              completedPairs={generatedVideos.length}
              isProcessing={isGenerating}
            />
            {pairs.length > 20 && (
              <div className="bg-neon-blue/10 border border-neon-blue/30 rounded-lg p-4 w-full text-center mb-6">
                <p className="text-neon-blue font-semibold">
                  Processing {pairs.length} pairs - Large batch mode activated
                </p>
                <p className="text-gray-400 text-sm">
                  Optimized for efficient processing of up to 100 file pairs
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 w-full" style={{ 
              maxHeight: pairs.length > 20 ? '60vh' : 'auto',
              overflowY: pairs.length > 20 ? 'auto' : 'visible'
            }}>
              {pairs.map((pair) => (
                <PairContainer
                  key={pair.id}
                  pair={pair}
                  onSwap={swapContainers}
                />
              ))}
            </div>
          </>
        )}
          </div>
        </main>
      </div>

    </div>
  );
}

export default App;