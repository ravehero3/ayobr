import React, { useState, useEffect } from 'react';
import VideoGenerationService from '../services/VideoGenerationService';

function VideoGenerationQueue() {
  const [jobs, setJobs] = useState([]);
  const [previewVideo, setPreviewVideo] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setJobs(VideoGenerationService.getAllJobs());

    const unsubscribe = VideoGenerationService.onJobUpdate((eventType, data) => {
      setJobs(VideoGenerationService.getAllJobs());
    });

    return unsubscribe;
  }, []);

  const handleGenerateFromPairs = async (pairs) => {
    if (pairs.length === 0) return;

    setIsGenerating(true);
    try {
      await VideoGenerationService.generateVideos(pairs);
    } catch (error) {
      console.error('Failed to generate videos:', error);
      alert('Failed to start video generation: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancel = async (jobId) => {
    try {
      await VideoGenerationService.cancelJob(jobId);
    } catch (error) {
      console.error('Failed to cancel job:', error);
      alert('Failed to cancel job: ' + error.message);
    }
  };

  const handlePreview = (jobId) => {
    const videoPath = VideoGenerationService.getVideoPath(jobId);
    if (videoPath) {
      setPreviewVideo({ jobId, path: videoPath });
    }
  };

  const handleClosePreview = async () => {
    if (previewVideo) {
      try {
        await VideoGenerationService.cleanupJob(previewVideo.jobId);
      } catch (error) {
        console.error('Failed to cleanup job:', error);
      }
      setPreviewVideo(null);
    }
  };

  const handleRetry = async (jobId) => {
    try {
      const job = VideoGenerationService.getJobStatus(jobId);
      if (job) {
        await VideoGenerationService.cleanupJob(jobId);
        await VideoGenerationService.generateVideo(job.imagePath, job.audioPath);
      }
    } catch (error) {
      console.error('Failed to retry job:', error);
      alert('Failed to retry job: ' + error.message);
    }
  };

  const handleRemove = async (jobId) => {
    try {
      await VideoGenerationService.cleanupJob(jobId);
    } catch (error) {
      console.error('Failed to remove job:', error);
    }
  };

  const getStatusText = (job) => {
    switch (job.status) {
      case 'queued':
        return '⏳ Waiting in queue...';
      case 'processing':
        return '🔄 Processing...';
      case 'completed':
        return '✅ Completed';
      case 'failed':
        return `❌ Failed: ${job.error || 'Unknown error'}`;
      default:
        return job.status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'queued':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'processing':
        return 'bg-blue-500/20 text-blue-300';
      case 'completed':
        return 'bg-green-500/20 text-green-300';
      case 'failed':
        return 'bg-red-500/20 text-red-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  if (jobs.length === 0) {
    return null;
  }

  return (
    <div className="video-generation-queue w-full max-w-4xl mx-auto p-6">
      <div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Video Generation Queue</h2>
        
        <div className="space-y-4">
          {jobs.map(job => (
            <div 
              key={job.id} 
              className={`job-item bg-white/5 rounded-lg p-4 border ${
                job.status === 'processing' ? 'border-blue-500/50' : 'border-white/10'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <img 
                    src={job.imagePath} 
                    alt="thumbnail" 
                    className="w-20 h-20 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
                
                <div className="flex-1">
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-2 ${getStatusColor(job.status)}`}>
                    {getStatusText(job)}
                  </div>
                  
                  {job.status === 'processing' && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-400">Progress</span>
                        <span className="text-sm font-medium text-white">{job.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-blue-500 h-full transition-all duration-300 ease-out"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 mt-2">
                    Created: {new Date(job.createdAt).toLocaleTimeString()}
                    {job.completedAt && ` • Completed: ${new Date(job.completedAt).toLocaleTimeString()}`}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  {(job.status === 'queued' || job.status === 'processing') && (
                    <button 
                      onClick={() => handleCancel(job.id)}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  {job.status === 'completed' && (
                    <>
                      <button 
                        onClick={() => handlePreview(job.id)}
                        className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg text-sm font-medium transition-colors"
                      >
                        Preview
                      </button>
                      <button 
                        onClick={() => handleRemove(job.id)}
                        className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 rounded-lg text-sm font-medium transition-colors"
                      >
                        Remove
                      </button>
                    </>
                  )}
                  {job.status === 'failed' && (
                    <>
                      <button 
                        onClick={() => handleRetry(job.id)}
                        className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-sm font-medium transition-colors"
                      >
                        Retry
                      </button>
                      <button 
                        onClick={() => handleRemove(job.id)}
                        className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 rounded-lg text-sm font-medium transition-colors"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {previewVideo && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleClosePreview}
        >
          <div 
            className="bg-gray-900 rounded-lg p-6 max-w-4xl w-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Video Preview</h3>
              <button 
                onClick={handleClosePreview}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <video 
              src={previewVideo.path}
              controls 
              autoPlay
              className="w-full rounded-lg"
            />
            <div className="mt-4 flex justify-end">
              <button 
                onClick={handleClosePreview}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoGenerationQueue;
