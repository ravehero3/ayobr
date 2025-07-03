
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useVideoPlayback } from '../hooks/useVideoPlayback';

const VideoPreviewCard = ({ video }) => {
  const [videoError, setVideoError] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef(null);
  const { currentlyPlayingId, setCurrentlyPlaying, pauseAll, isPlaying } = useVideoPlayback();
  
  // Check if this video is currently playing
  const isVideoPlaying = isPlaying(video.id);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement) {
      const updateTime = () => setCurrentTime(videoElement.currentTime);
      const updateDuration = () => setDuration(videoElement.duration);
      const handlePlay = () => setCurrentlyPlaying(video.id);
      const handlePause = () => {
        if (isPlaying(video.id)) {
          pauseAll();
        }
      };
      const handleEnded = () => {
        if (isPlaying(video.id)) {
          pauseAll();
        }
      };

      videoElement.addEventListener('timeupdate', updateTime);
      videoElement.addEventListener('loadedmetadata', updateDuration);
      videoElement.addEventListener('play', handlePlay);
      videoElement.addEventListener('pause', handlePause);
      videoElement.addEventListener('ended', handleEnded);

      return () => {
        videoElement.removeEventListener('timeupdate', updateTime);
        videoElement.removeEventListener('loadedmetadata', updateDuration);
        videoElement.removeEventListener('play', handlePlay);
        videoElement.removeEventListener('pause', handlePause);
        videoElement.removeEventListener('ended', handleEnded);
      };
    }
  }, [video.id, setCurrentlyPlaying, pauseAll, isPlaying]);

  // Effect to pause this video when another video starts playing
  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement && currentlyPlayingId !== video.id && !videoElement.paused) {
      videoElement.pause();
    }
  }, [currentlyPlayingId, video.id]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        // Pause all other videos and play this one
        setCurrentlyPlaying(video.id);
        videoRef.current.play();
      }
    }
  };

  const handleSeek = (e) => {
    if (videoRef.current && duration) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const seekTime = (clickX / rect.width) * duration;
      videoRef.current.currentTime = seekTime;
    }
  };

  const handleSaveVideo = () => {
    try {
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

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <motion.div
      className="relative w-full transition-all duration-300 group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.005 }}
      style={{
        background: 'rgba(15, 23, 42, 0.6)',
        borderRadius: '8px',
        border: '1px solid rgba(53, 132, 228, 0.3)',
        boxShadow: '0 0 0 1px rgba(53, 132, 228, 0.2), 0 0 20px rgba(53, 132, 228, 0.1)',
        padding: '16px',
        height: '300px',
        minHeight: '300px',
        maxHeight: '300px',
        width: '500px',
        minWidth: '500px',
        maxWidth: '500px'
      }}
    >
      <div className="w-full h-full flex flex-col justify-between">
        {/* Header with filename and time */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <button
              onClick={handleSaveVideo}
              className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 hover:bg-blue-500/30 transition-colors"
              title="Save Video"
            >
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            <span className="text-white text-sm font-medium truncate">
              {video.name?.replace(/\.[^/.]+$/, "") || 'Generated Video'}
            </span>
          </div>
          <div className="text-xs text-gray-400 flex-shrink-0">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* Video Display - The centerpiece */}
        <div className="flex-1 flex items-center mb-2">
          <div className="w-full relative aspect-video bg-black rounded-lg overflow-hidden" style={{ height: '180px' }}>
            {!videoError ? (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                onError={() => setVideoError(true)}
                muted
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
          </div>
        </div>

        {/* Progress Bar - Like Decibels timeline */}
        <div className="mb-3">
          <div 
            className="w-full h-2 bg-gray-600 rounded-full cursor-pointer relative overflow-hidden"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-blue-500 transition-all duration-100 ease-out"
              style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
            />
            <div 
              className="absolute top-0 w-1 h-full bg-blue-300 opacity-60 transition-all duration-100"
              style={{ left: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
            />
          </div>
        </div>

        {/* Bottom controls - Large play button like Decibels */}
        <div className="flex items-center justify-center">
          <button
            onClick={handlePlayPause}
            disabled={videoError}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: isVideoPlaying ? '#3584E4' : 'rgba(53, 132, 228, 0.15)',
              border: `2px solid ${isVideoPlaying ? '#3584E4' : 'rgba(53, 132, 228, 0.4)'}`,
              boxShadow: isVideoPlaying 
                ? '0 0 20px rgba(53, 132, 228, 0.4)'
                : '0 0 10px rgba(53, 132, 228, 0.2)',
              color: isVideoPlaying ? 'white' : '#3584E4'
            }}
          >
            {isVideoPlaying ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="m7 4 10 6L7 16V4z"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default VideoPreviewCard;
