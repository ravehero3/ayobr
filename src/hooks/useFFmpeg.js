import { useState, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { processVideoWithFFmpeg } from '../utils/ffmpegProcessor';

export const useFFmpeg = () => {
  const [progress, setProgress] = useState(0);
  const { setIsGenerating, addGeneratedVideo, clearGeneratedVideos, setVideoGenerationState } = useAppStore();

  const generateVideos = useCallback(async (pairs) => {
    try {
      setIsGenerating(true);
      setProgress(0);
      clearGeneratedVideos();

      // Process pairs in parallel with individual animations
      const promises = pairs.map(async (pair) => {
        // Set initial generating state for this pair
        setVideoGenerationState(pair.id, {
          isGenerating: true,
          progress: 0,
          isComplete: false,
          video: null
        });

        try {
          const videoData = await processVideoWithFFmpeg(
            pair.audio, 
            pair.image, 
            (progress) => {
              setVideoGenerationState(pair.id, {
                isGenerating: true,
                progress: progress,
                isComplete: false,
                video: null
              });
            }
          );

          const videoBlob = new Blob([videoData], { type: 'video/mp4' });
          const videoUrl = URL.createObjectURL(videoBlob);
          const video = {
            id: crypto.randomUUID(),
            pairId: pair.id,
            url: videoUrl,
            blob: videoBlob,
            filename: `video_${pair.audio.name.split('.')[0]}_${pair.image.name.split('.')[0]}.mp4`,
            createdAt: new Date()
          };

          addGeneratedVideo(video);

          // Set completion state for this pair
          setVideoGenerationState(pair.id, {
            isGenerating: false,
            progress: 100,
            isComplete: true,
            video: video
          });

        } catch (error) {
          console.error(`Error generating video for pair ${pair.id}:`, error);
          // Reset state on error
          setVideoGenerationState(pair.id, {
            isGenerating: false,
            progress: 0,
            isComplete: false,
            video: null
          });
        }
      });

      await Promise.all(promises);
    } catch (error) {
      console.error('Error in video generation process:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [setIsGenerating, addGeneratedVideo, clearGeneratedVideos, setVideoGenerationState]);

  return {
    generateVideos,
    progress
  };
};

// Helper function to get audio duration
const getAudioDuration = (audioFile) => {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.onloadedmetadata = () => {
      resolve(audio.duration);
    };
    audio.onerror = () => {
      resolve(0);
    };
    audio.src = URL.createObjectURL(audioFile);
  });
};
