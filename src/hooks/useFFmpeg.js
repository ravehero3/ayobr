import { useState, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { processVideoWithFFmpeg, forceStopAllProcesses } from '../utils/ffmpegProcessor';

export const useFFmpeg = () => {
  const [progress, setProgress] = useState(0);
  const { 
    setIsGenerating, 
    addGeneratedVideo, 
    clearGeneratedVideos, 
    setVideoGenerationState, 
    isCancelling, 
    cancelGeneration, 
    resetCancellation,
    concurrencySettings 
  } = useAppStore();

  const generateVideos = useCallback(async (pairs) => {
    console.log('generateVideos called with pairs:', pairs);
    
    if (!pairs || pairs.length === 0) {
      console.error('No pairs provided for video generation');
      throw new Error('No pairs provided for video generation');
    }

    const invalidPairs = pairs.filter(pair => !pair.audio || !pair.image);
    if (invalidPairs.length > 0) {
      console.error('Invalid pairs found:', invalidPairs);
      throw new Error('All pairs must have both audio and image files');
    }

    try {
      setIsGenerating(true);
      resetCancellation();
      setProgress(0);
      clearGeneratedVideos();

      // Scalable concurrency for up to 100 files with optimized performance
      let maxConcurrent;
      if (pairs.length <= 5) {
        maxConcurrent = 4;       // Small batches: 4 concurrent
      } else if (pairs.length <= 20) {
        maxConcurrent = 6;       // Medium batches: 6 concurrent  
      } else if (pairs.length <= 50) {
        maxConcurrent = 8;       // Large batches: 8 concurrent
      } else if (pairs.length <= 75) {
        maxConcurrent = 10;      // Very large batches: 10 concurrent
      } else {
        maxConcurrent = 12;      // Maximum 100 files: 12 concurrent
      }
      
      console.log(`Processing ${pairs.length} videos with ${maxConcurrent} concurrent processes`);
      const processingQueue = [...pairs];
      const activePromises = new Set();
      let completedCount = 0;
      
      // Enhanced progress tracking for large batches
      const updateBatchProgress = () => {
        const overallProgress = Math.floor((completedCount / pairs.length) * 100);
        setProgress(overallProgress);
        
        // Log progress for large batches
        if (pairs.length > 20) {
          console.log(`Batch progress: ${completedCount}/${pairs.length} (${overallProgress}%)`);
        }
        
        // Memory cleanup every 10 completed videos for large batches
        if (pairs.length > 20 && completedCount % 10 === 0 && completedCount > 0) {
          console.log(`Performing memory cleanup after ${completedCount} completed videos`);
          // Force garbage collection if available
          if (window.gc) {
            window.gc();
          }
        }
      };

      while (processingQueue.length > 0 || activePromises.size > 0) {
        if (isCancelling) {
          console.log('Video generation cancelled - force stopping all processes');
          forceStopAllProcesses();
          break;
        }

        while (activePromises.size < maxConcurrent && processingQueue.length > 0) {
          const pair = processingQueue.shift();
          const promise = processPairAsync(pair);
          activePromises.add(promise);
          promise.finally(() => {
            activePromises.delete(promise);
            completedCount++;
            updateBatchProgress();
          });
        }

        if (activePromises.size > 0) {
          await Promise.race(Array.from(activePromises));
        }
      }
    } catch (error) {
      console.error('Error in generateVideos:', error);
      throw error;
    } finally {
      setIsGenerating(false);
      setProgress(100);
    }
  }, [isCancelling, setIsGenerating, addGeneratedVideo, clearGeneratedVideos, setVideoGenerationState, resetCancellation]);

  const processPairAsync = async (pair) => {
    try {
      if (isCancelling) return;
        
      setVideoGenerationState(pair.id, {
        isGenerating: true,
        progress: 0,
        isComplete: false,
        video: null
      });

      console.log(`Processing video for pair ${pair.id}:`, pair);
      const videoData = await processVideoWithFFmpeg(
        pair.audio, 
        pair.image, 
        (progress) => {
          const clampedProgress = Math.min(Math.max(Math.floor(progress), 0), 100);
          setVideoGenerationState(pair.id, {
            isGenerating: true,
            progress: clampedProgress,
            isComplete: false,
            video: null
          });
        },
        () => {
          if (isCancelling) {
            console.log('Cancellation detected, stopping FFmpeg process');
            return true;
          }
          return false;
        }
      );

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
        return;
      }
      
      console.error(`Error generating video for pair ${pair.id}:`, error);
      setVideoGenerationState(pair.id, {
        isGenerating: false,
        progress: 0,
        isComplete: false,
        video: null
      });
    }
  };

  const stopGeneration = useCallback(() => {
    console.log('Stop generation clicked - forcing immediate termination');
    cancelGeneration();
    forceStopAllProcesses();
  }, [cancelGeneration]);

  return {
    generateVideos,
    stopGeneration,
    progress
  };
};