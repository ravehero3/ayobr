
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
    <div className="fixed inset-0 text-white overflow-auto" style={{ 
      zIndex: 20,
      backgroundImage: 'url(/attached_assets/background%20page%202_1754507959583.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      {/* Background overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40" style={{ zIndex: -1 }} />
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
            
            
          </motion.div>
          
          {/* Video Grid - 4 per row matching audio container width (384px) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="grid grid-cols-4 gap-4 max-w-6xl mx-auto"
          >
            <AnimatePresence>
              {generatedVideos.map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className={`relative glass-container cursor-pointer transition-all duration-300 ${
                    hoveredVideo === video.id 
                      ? 'shadow-2xl shadow-blue-500/20' 
                      : ''
                  }`}
                  style={{
                    width: '384px',
                    height: '192px',
                    padding: '16px'
                  }}
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

                  {/* Compact Video Preview */}
                  <div className="flex flex-col h-full">
                    {/* Video Icon - smaller */}
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                        <div className="text-lg font-bold">▶</div>
                      </div>
                    </div>

                    {/* Progress Bar - thinner */}
                    <div className="mb-3">
                      <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full shadow-lg shadow-blue-500/30"
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                        />
                      </div>
                    </div>

                    {/* Compact Video Info */}
                    <div className="text-center flex-1 flex flex-col justify-center">
                      <h3 className="text-white font-medium text-xs mb-1 truncate">
                        {video.filename || `Video ${index + 1}`}
                      </h3>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>1920×1080</span>
                        <span>{formatDuration(video.duration)}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {(video.size / (1024 * 1024)).toFixed(1)} MB
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>


        </div>
      </div>
    </div>
  );
};

export default DownloadPage;
