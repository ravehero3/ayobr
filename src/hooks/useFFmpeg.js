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

      // Process pairs sequentially to avoid resource conflicts and enable proper cancellation
      for (const pair of pairs) {
        // Check for cancellation before starting each pair
        if (isCancelling) {
          console.log('Video generation cancelled');
          break;
        }
        
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
              // Ensure smooth 1-100 progress tracking
              const clampedProgress = Math.min(Math.max(Math.floor(progress), 0), 100);
              setVideoGenerationState(pair.id, {
                isGenerating: true,
                progress: clampedProgress,
                isComplete: false,
                video: null
              });
            },
            // Pass cancellation checker function that properly stops FFmpeg
            () => {
              if (isCancelling) {
                console.log('Cancellation detected, stopping FFmpeg process');
                return true;
              }
              return false;
            }
          );

          // Check for cancellation before creating blob
          if (isCancelling) {
            console.log('Video generation cancelled during blob creation');
            break;
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
          if (error.message === 'Generation cancelled by user') {
            console.log(`Video generation cancelled for pair ${pair.id}`);
            setVideoGenerationState(pair.id, {
              isGenerating: false,
              progress: 0,
              isComplete: false,
              video: null
            });
            break;
          }
          
          console.error(`Error generating video for pair ${pair.id}:`, error);
          // Reset state on error
          setVideoGenerationState(pair.id, {
            isGenerating: false,
            progress: 0,
            isComplete: false,
            video: null
          });
        }
      }
    } catch (error) {
      console.error('Error in video generation process:', error);
      throw error;
    } finally {
      setIsGenerating(false);
      resetCancellation();
    }
  }, [setIsGenerating, addGeneratedVideo, clearGeneratedVideos, setVideoGenerationState, isCancelling, resetCancellation]);

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
