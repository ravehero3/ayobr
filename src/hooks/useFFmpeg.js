import { useState, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { processVideoWithFFmpeg } from '../utils/ffmpegProcessor';

export const useFFmpeg = () => {
  const [progress, setProgress] = useState(0);
  const { setIsGenerating, addGeneratedVideo, clearGeneratedVideos, setVideoGenerationState, isCancelling, cancelGeneration, resetCancellation } = useAppStore();

  const generateVideos = useCallback(async (pairs) => {
    try {
      setIsGenerating(true);
      resetCancellation();
      setProgress(0);
      clearGeneratedVideos();

      // Process pairs with controlled concurrency for optimal resource utilization
      const maxConcurrentJobs = Math.min(pairs.length, 2); // Process up to 2 videos simultaneously
      const processingQueue = [...pairs];
      const activeJobs = new Map();

      const processNextPair = async () => {
        if (processingQueue.length === 0 || isCancelling) {
          return;
        }

        const pair = processingQueue.shift();
        
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
              // Check for cancellation during progress updates
              if (isCancelling) {
                throw new Error('Generation cancelled');
              }
              
              const clampedProgress = Math.min(Math.max(progress, 0), 100);
              setVideoGenerationState(pair.id, {
                isGenerating: true,
                progress: clampedProgress,
                isComplete: false,
                video: null
              });
            }
          );

          // Check for cancellation before creating blob
          if (isCancelling) {
            console.log('Video generation cancelled during blob creation');
            return;
          }

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
        } finally {
          activeJobs.delete(pair.id);
          // Process next pair in queue
          if (processingQueue.length > 0 && !isCancelling) {
            processNextPair();
          }
        }
      };

      // Start initial concurrent jobs
      for (let i = 0; i < maxConcurrentJobs && i < pairs.length; i++) {
        processNextPair();
      }

      // Wait for all jobs to complete
      while (activeJobs.size > 0 && !isCancelling) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Error in video generation process:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [setIsGenerating, addGeneratedVideo, clearGeneratedVideos, setVideoGenerationState]);

  const stopGeneration = useCallback(() => {
    cancelGeneration();
  }, [cancelGeneration]);

  return {
    generateVideos,
    stopGeneration,
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
