import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from './store/appStore';
import { usePairingLogic } from './hooks/usePairingLogic';
import { useFFmpeg } from './hooks/useFFmpeg';
import DropZone from './components/DropZone';
import PairContainer from './components/PairContainer';
import VideoPreviewCard from './components/VideoPreviewCard';

function App() {
  const { pairs, generatedVideos, isGenerating } = useAppStore();
  const { handleFileDrop, swapContainers } = usePairingLogic();
  const { generateVideos, progress } = useFFmpeg();
  const [draggedItem, setDraggedItem] = useState(null);

  const handleDragStart = useCallback((item) => {
    setDraggedItem(item);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
  }, []);

  const handleGenerateVideos = async () => {
    const validPairs = pairs.filter(pair => pair.audio && pair.image);
    if (validPairs.length === 0) {
      alert('Please add at least one complete audio-image pair to generate videos.');
      return;
    }
    
    await generateVideos(validPairs);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-space-dark via-space-navy to-space-black">
      {/* Header */}
      <header className="p-6 border-b border-neon-blue/20">
        <div className="max-w-full mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">
            Type Beat Video Generator
          </h1>
          <p className="text-gray-400">
            Create stunning type beat videos by pairing audio files with images
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-full mx-auto p-6">
        {/* Drop Zone */}
        <DropZone onFileDrop={handleFileDrop} />

        {/* Pairs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 mb-8">
          <AnimatePresence>
            {pairs.map((pair) => (
              <motion.div
                key={pair.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
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

        {/* Generate Button */}
        {pairs.length > 0 && (
          <div className="flex justify-center mb-8">
            <motion.button
              onClick={handleGenerateVideos}
              disabled={isGenerating}
              className="px-8 py-4 bg-gradient-to-r from-neon-blue to-neon-cyan rounded-2xl text-white font-semibold text-lg shadow-lg hover:shadow-neon-blue/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isGenerating ? (
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Generating Videos... {Math.round(progress)}%</span>
                </div>
              ) : (
                'Generate Videos'
              )}
            </motion.button>
          </div>
        )}

        {/* Generated Videos */}
        {generatedVideos.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Generated Videos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {generatedVideos.map((video) => (
                <VideoPreviewCard key={video.id} video={video} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
