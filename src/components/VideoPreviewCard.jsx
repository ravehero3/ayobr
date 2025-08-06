import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';

const VideoPreviewCard = ({ video }) => {
  const { removeGeneratedVideo } = useAppStore();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      // Revoke the object URL to free up memory
      if (video.url) {
        URL.revokeObjectURL(video.url);
      }

      // Remove from store
      removeGeneratedVideo(video.id);

      console.log(`Video ${video.filename} deleted successfully`);
    } catch (error) {
      console.error('Error deleting video:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = video.url;
    link.download = video.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700">
      <div className="relative mb-4">
        <video
          src={video.url}
          controls
          className="w-full rounded-lg"
          style={{ maxHeight: '200px' }}
          preload="metadata"
        />

        {/* Delete button overlay */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 disabled:bg-red-700 text-white p-2 rounded-full shadow-lg transition-colors"
          title="Delete video"
        >
          {isDeleting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-white font-medium text-sm truncate" title={video.filename}>
          {video.filename}
        </h3>

        <div className="flex justify-between items-center text-xs text-gray-400">
          <span className="text-small-notes">{formatFileSize(video.size)}</span>
          <span className="text-small-notes">{new Date(video.createdAt).toLocaleTimeString()}</span>
        </div>

        <button
          onClick={handleDownload}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors text-button-primary"
        >
          Download
        </button>
      </div>
    </div>
  );
};

export default VideoPreviewCard;