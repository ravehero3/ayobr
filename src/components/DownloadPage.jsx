
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';

const DownloadPage = ({ onDownloadAll, onBackToFileManagement }) => {
  const { generatedVideos, clearGeneratedVideos, removeVideo } = useAppStore();
  const [hoveredVideo, setHoveredVideo] = useState(null);

  const handleStartOver = () => {
    clearGeneratedVideos();
    onBackToFileManagement();
  };

  const handleVideoDownload = (video) => {
    const link = document.createElement('a');
    link.href = video.url;
    link.download = video.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRemoveVideo = (videoId, e) => {
    e.stopPropagation();
    removeVideo(videoId);
  };

  const formatDuration = (duration) => {
    if (!duration) return '3:24';
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Particle component for hover effect
  const Particle = ({ index, isHovered }) => (
    <motion.div
      className="absolute w-1 h-1 bg-blue-400 rounded-full"
      animate={isHovered ? {
        x: [0, Math.random() * 60 - 30, Math.random() * 60 - 30, 0],
        y: [0, Math.random() * 40 - 20, Math.random() * 40 - 20, 0],
        opacity: [0.3, 0.8, 0.5, 0.3],
        scale: [0.5, 1, 0.8, 0.5]
      } : {
        opacity: 0
      }}
      transition={{
        duration: 2 + Math.random() * 2,
        repeat: Infinity,
        delay: index * 0.2
      }}
      style={{
        left: `${20 + Math.random() * 60}%`,
        top: `${30 + Math.random() * 40}%`
      }}
    />
  );

  return (
    <div className="fixed inset-0 bg-black text-white overflow-auto" style={{ zIndex: 20 }}>
      <div className="min-h-screen py-12 px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-light mb-4 text-white">
              Videos Generated
            </h1>
            <p className="text-lg text-gray-400 mb-8">
              {generatedVideos.length} video{generatedVideos.length !== 1 ? 's' : ''} ready for download
            </p>
            
            <motion.button
              onClick={onDownloadAll}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Download All Videos
            </motion.button>
          </motion.div>
          
          {/* Video Grid */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence>
              {generatedVideos.map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className={`relative bg-gray-900 rounded-2xl p-6 cursor-pointer transition-all duration-300 ${
                    hoveredVideo === video.id 
                      ? 'bg-gray-800 shadow-2xl shadow-blue-500/20' 
                      : 'hover:bg-gray-850'
                  }`}
                  onMouseEnter={() => setHoveredVideo(video.id)}
                  onMouseLeave={() => setHoveredVideo(null)}
                  onClick={() => handleVideoDownload(video)}
                >
                  {/* Remove button - shows on hover */}
                  <AnimatePresence>
                    {hoveredVideo === video.id && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={(e) => handleRemoveVideo(video.id, e)}
                        className="absolute top-3 right-3 w-6 h-6 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center text-white text-sm z-10 transition-colors"
                      >
                        ×
                      </motion.button>
                    )}
                  </AnimatePresence>

                  {/* Particles */}
                  {hoveredVideo === video.id && (
                    <div className="absolute inset-0 pointer-events-none">
                      {[...Array(7)].map((_, i) => (
                        <Particle key={i} index={i} isHovered={hoveredVideo === video.id} />
                      ))}
                    </div>
                  )}

                  {/* Video Icon */}
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
                      <div className="text-2xl font-bold">▶</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full shadow-lg shadow-blue-500/30"
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                      />
                    </div>
                  </div>

                  {/* Video Info */}
                  <div className="text-center">
                    <h3 className="text-white font-medium text-sm mb-2 truncate">
                      {video.filename || `Video ${index + 1}`}
                    </h3>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>1920×1080</span>
                      <span>{formatDuration(video.duration)}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {(video.size / (1024 * 1024)).toFixed(1)} MB
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="flex justify-center mt-12"
          >
            <button
              onClick={handleStartOver}
              className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200"
            >
              Create More Videos
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DownloadPage;
