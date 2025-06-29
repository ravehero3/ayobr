import React, { useState } from 'react';
import { motion } from 'framer-motion';

const VideoPreviewCard = ({ video }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const handlePlayPause = () => {
    const videoElement = document.getElementById(`video-${video.id}`);
    if (videoElement) {
      if (isPlaying) {
        videoElement.pause();
      } else {
        videoElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSaveVideo = () => {
    try {
      // Create download link for web environment
      const link = document.createElement('a');
      link.href = video.url;
      link.download = video.filename || `video_${new Date().getTime()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading video:', error);
      alert('Failed to download video. Please try again.');
    }
  };

  return (
    <motion.div
      className="relative bg-gradient-to-br from-space-navy to-space-dark rounded-3xl p-6 border border-neon-cyan/30 shadow-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        boxShadow: '0 0 20px rgba(0, 207, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-neon-cyan/5 to-neon-blue/5 animate-pulse" />
      
      <div className="relative space-y-4">
        {/* Video info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-neon-cyan" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
            <span className="text-white text-sm font-medium">
              {video.name || 'Generated Video'}
            </span>
          </div>
          <button
            onClick={handleSaveVideo}
            className="p-2 text-gray-400 hover:text-neon-cyan transition-colors duration-200"
            title="Save Video"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        </div>

        {/* Video preview */}
        <div className="relative aspect-video bg-black rounded-2xl overflow-hidden">
          {!videoError ? (
            <video
              id={`video-${video.id}`}
              className="w-full h-full object-cover"
              onError={() => setVideoError(true)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            >
              <source src={video.url} type="video/mp4" />
            </video>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-400 text-sm">Video preview unavailable</p>
              </div>
            </div>
          )}

          {/* Play button overlay */}
          {!isPlaying && !videoError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
              <motion.button
                onClick={handlePlayPause}
                className="p-4 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 transition-colors duration-200"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </motion.button>
            </div>
          )}
        </div>

        {/* Video details */}
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>1920 × 1080</span>
          <span>{video.duration ? `${Math.round(video.duration)}s` : 'Unknown duration'}</span>
        </div>
      </div>

      {/* Highlight flare */}
      <div className="absolute top-2 right-6 w-2 h-2 bg-cyan-400 rounded-full animate-ping opacity-75" />
    </motion.div>
  );
};

export default VideoPreviewCard;
