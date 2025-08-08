import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';

const DownloadPage = ({ onDownloadAll, onBackToFileManagement }) => {
  const { generatedVideos, clearGeneratedVideos } = useAppStore();
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

  const formatDuration = (duration) => {
    if (!duration) return '3:24';
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-gray-900 text-white overflow-auto" style={{ zIndex: 20 }}>
      <div className="min-h-screen py-10 px-5">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <h1 className="text-5xl font-bold mb-3" style={{
              background: 'linear-gradient(135deg, #87CEEB, #1e3a8a)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Video Generation Complete
            </h1>
            <p className="text-xl text-blue-300 mb-3">
              {generatedVideos.length} Full HD videos successfully generated
            </p>
            <div className="inline-block px-4 py-2 bg-gradient-to-r from-blue-800 to-blue-900 text-white rounded-full text-sm font-semibold mb-8 shadow-lg shadow-blue-500/40">
              <span className="text-xs opacity-80 mr-2">FULL HD</span>
              1920×1080
            </div>
            
            <div className="flex justify-center mb-12">
              <button
                onClick={onDownloadAll}
                className="download-all-btn"
              >
                <span className="download-icon">⬇</span>
                {generatedVideos.length === 1 ? 'Download Video' : 'Download All Videos'}
              </button>
            </div>
          </motion.div>
          
          {/* Video Grid */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="grid gap-10 justify-items-center"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))'
            }}
          >
            {generatedVideos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                className="video-card-container"
                onMouseEnter={() => setHoveredVideo(video.id)}
                onMouseLeave={() => setHoveredVideo(null)}
                onClick={() => handleVideoDownload(video)}
              >
                <div className="video-card">
                  {/* Glow Effect */}
                  <div className="video-card-glow"></div>
                  
                  {/* Full HD Badge */}
                  <div className="hd-badge">FULL HD</div>
                  
                  {/* Video Thumbnail */}
                  <div className="video-thumbnail">
                    <div className="thumbnail-pulse"></div>
                    <div className="video-icon">TB</div>
                  </div>
                  
                  {/* Play Button */}
                  <div className="play-button">
                    <span>▶</span>
                  </div>
                  
                  {/* Video Info */}
                  <div className="video-info">
                    <div className="video-title">{video.filename || `Type Beat ${index + 1}`}</div>
                    <div className="video-details">
                      <span className="video-resolution">1920×1080</span>
                      <span className="video-duration">{formatDuration(video.duration)}</span>
                    </div>
                  </div>
                  
                  {/* Particle System */}
                  <div className="video-particle-system">
                    {[1,2,3,4,5,6,7,8].map(num => (
                      <div key={num} className={`video-particle video-particle-${num}`}></div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
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
              className="create-more-btn"
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