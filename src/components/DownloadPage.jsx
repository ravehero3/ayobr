import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import VideoPreviewCard from './VideoPreviewCard';

const DownloadPage = ({ onDownloadAll, onBackToFileManagement }) => {
  const { generatedVideos, clearGeneratedVideos } = useAppStore();

  const handleStartOver = () => {
    clearGeneratedVideos();
    onBackToFileManagement();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 flex flex-col items-center justify-center p-6 overflow-auto"
      style={{ zIndex: 20 }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-main-title text-white mb-4">
          🎬 Your Videos Are Ready!
        </h1>
        <p className="text-base-body text-gray-300">
          Preview and download your generated type beat videos
        </p>
      </motion.div>

      {/* Video Grid */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="grid gap-6 max-w-6xl w-full mb-8"
        style={{
          gridTemplateColumns: generatedVideos.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))'
        }}
      >
        {generatedVideos.map((video, index) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
          >
            <VideoPreviewCard
              video={video}
              showDownloadButton={true}
              className="bg-gray-900/50 backdrop-blur-md border border-gray-700/30 rounded-2xl p-4"
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        {/* Download All Button */}
        <button
          onClick={onDownloadAll}
          className="spotlight-button download-button text-button-primary"
        >
          <div className="wrapper">
            <span>
              {generatedVideos.length === 1 ? 'DOWNLOAD VIDEO' : 'DOWNLOAD ALL VIDEOS'}
            </span>
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
        </button>

        {/* Start Over Button */}
        <button
          onClick={handleStartOver}
          className="px-8 py-3 bg-gray-700/50 backdrop-blur-md border border-gray-600/30 rounded-xl text-white font-medium transition-all duration-300 hover:bg-gray-600/50 hover:border-gray-500/50 text-button-secondary"
        >
          CREATE MORE VIDEOS
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="mt-8 text-center text-gray-400"
      >
        <p className="text-sm-notes">
          {generatedVideos.length} video{generatedVideos.length !== 1 ? 's' : ''} generated •
          Total size: {Math.round(generatedVideos.reduce((sum, video) => sum + (video.size || 0), 0) / 1024 / 1024 * 100) / 100} MB
        </p>
      </motion.div>
    </motion.div>
  );
};

export default DownloadPage;