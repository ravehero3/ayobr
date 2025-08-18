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

    // Clear any stuck generation states before starting
    const { clearStuckGenerationStates } = useAppStore.getState();
    clearStuckGenerationStates();

    try {
      setIsGenerating(true);
      // Also set the store state
      const { setIsGenerating: setStoreIsGenerating } = useAppStore.getState();
      setStoreIsGenerating(true);
      resetCancellation();
      setProgress(0);
      // Don't clear existing videos - let users accumulate multiple generations

      // Set concurrent video generation to 5 for optimal speed
      const maxConcurrent = Math.min(5, pairs.length);  // Process up to 5 videos concurrently

      console.log(`Processing ${pairs.length} videos with ${maxConcurrent} concurrent processes (reduced for stability)`);
      const processingQueue = [...pairs];
      const activePromises = new Set();
      let completedCount = 0;

      // Enhanced progress tracking for large batches
      const updateBatchProgress = async () => {
        const overallProgress = Math.floor((completedCount / pairs.length) * 100);
        setProgress(overallProgress);

        // Log progress for large batches
        if (pairs.length > 20) {
          console.log(`Batch progress: ${completedCount}/${pairs.length} (${overallProgress}%)`);
        }

        // Memory cleanup every 5 completed videos to prevent crashes
        if (completedCount % 5 === 0 && completedCount > 0) {
          console.log(`Performing memory cleanup after ${completedCount} completed videos`);
          // Force garbage collection if available
          if (window.gc) {
            window.gc();
          }

          // Small delay to allow cleanup to complete
          await new Promise(resolve => setTimeout(resolve, 100));
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

          // Skip if this pair already has a completed video or is complete
          const currentStore = useAppStore.getState();
          const existingVideo = currentStore.generatedVideos.find(v => v.pairId === pair.id);
          const videoState = currentStore.videoGenerationStates[pair.id];
          
          if (existingVideo || (videoState && videoState.isComplete && videoState.video)) {
            console.log(`Skipping pair ${pair.id} - video already exists or is complete`);
            completedCount++;
            await updateBatchProgress();
            continue;
          }

          const promise = processPairAsync(pair).catch(error => {
            console.error(`Error in processPairAsync for pair ${pair.id}:`, error);

            // Set error state for this specific pair
            setVideoGenerationState(pair.id, {
              isGenerating: false,
              progress: 0,
              isComplete: false,
              video: null,
              error: error.message || 'Video generation failed'
            });

            // Don't re-throw to prevent unhandled rejection
            return null;
          });
          activePromises.add(promise);
          promise.finally(async () => {
            activePromises.delete(promise);
            completedCount++;
            await updateBatchProgress();
          });
        }

        if (activePromises.size > 0) {
          await Promise.race(Array.from(activePromises));
        }
      }
      // Check if generation was cancelled before finishing
      if (isCancelling) {
        console.log('Video generation was cancelled');
        setIsGenerating(false);
        setProgress(0);

        // Clean up any partial state
        pairs.forEach(pair => {
          setVideoGenerationState(pair.id, {
            isGenerating: false,
            progress: 0,
            isComplete: false,
            video: null,
            error: null
          });
        });

        return;
      }

      console.log('Video generation completed successfully');
      setProgress(100);

      // Don't immediately reset - let the UI handle the transition
      // Only reset generation state, keep videos visible
      setIsGenerating(false);
      setStoreIsGenerating(false);
      
      console.log('Generation completed, videos should now be visible');

    } catch (error) {
      console.error('Error in generateVideos:', error);

      // Force stop any remaining processes
      forceStopAllProcesses();

      // Use comprehensive reset from store
      const { resetGenerationState } = useAppStore.getState();
      resetGenerationState();

      // Reset progress in hook
      setProgress(0);

      // Show user-friendly error message only if not cancelled
      if (!isCancelling) {
        console.error('Video generation error details:', error);
        // More informative error without alert popup that might cause issues
        console.warn(`Video generation failed: ${error.message || 'Unknown error occurred'}. Please try again.`);
      }

      // Reset cancellation state
      setTimeout(() => {
        resetCancellation();
        console.log('Error handled, app is ready for retry');
      }, 1000);
    } finally {
      // Cleanup is handled in the main flow above
      // No additional state reset needed here to prevent double reset
    }
  }, [isCancelling, setIsGenerating, addGeneratedVideo, clearGeneratedVideos, setVideoGenerationState, resetCancellation]);

  const processPairAsync = async (pair) => {
    try {
      if (isCancelling) return;

      // Check if this pair already has a generated video or is complete
      const store = useAppStore.getState();
      const existingVideo = store.generatedVideos.find(v => v.pairId === pair.id);
      const videoState = store.videoGenerationStates[pair.id];
      
      if (existingVideo || (videoState && videoState.isComplete && videoState.video)) {
        console.log(`Video already exists or is complete for pair ${pair.id}, skipping`);
        return existingVideo || videoState.video;
      }

      setVideoGenerationState(pair.id, {
        isGenerating: true,
        progress: 0,
        isComplete: false,
        video: null,
        error: null,
        startTime: Date.now()  // Track when generation started for timeout detection
      });

      console.log(`Processing video for pair ${pair.id}:`, pair);

      // Get video settings from app store including logo settings
      const videoSettings = {
        background: (store.videoSettings && store.videoSettings.background) ? store.videoSettings.background : 'black',
        logoFile: store.logoSettings?.logoFile,
        useLogo: store.logoSettings?.useLogoInVideos
      };
      console.log('Video settings for generation:', videoSettings);

      let videoData;
      try {
        videoData = await processVideoWithFFmpeg(
          pair.audio, 
          pair.image, 
          (progress) => {
            const clampedProgress = Math.min(Math.max(Math.floor(progress), 0), 100);
            console.log(`Setting video generation state for pair ${pair.id}:`, {
              isGenerating: true,
              progress: clampedProgress,
              isComplete: false,
              video: null
            });
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
          },
          videoSettings
        );
        console.log(`Video processing completed for pair ${pair.id}, buffer size:`, videoData ? videoData.length : 'null');
      } catch (processingError) {
        console.error(`Error during video processing for pair ${pair.id}:`, processingError);
        
        // Set error state for the pair
        setVideoGenerationState(pair.id, {
          isGenerating: false,
          progress: 0,
          isComplete: false,
          video: null,
          error: processingError.message || 'Video processing failed'
        });
        
        throw processingError; // Re-throw to be handled by the main catch block
      }

      if (isCancelling) {
        console.log('Video generation cancelled during blob creation');
        return null;
      }

      console.log('Creating video blob and URL...');
      console.log('Video data size received:', videoData ? videoData.length : 'null/undefined');

      if (!videoData || videoData.length === 0) {
        throw new Error('Invalid video data received from FFmpeg processor');
      }

      let videoBlob, videoUrl;
      try {
        videoBlob = new Blob([videoData], { type: 'video/mp4' });
        videoUrl = URL.createObjectURL(videoBlob);
        console.log('Video blob created successfully, size:', videoBlob.size);
      } catch (blobError) {
        console.error('Error creating video blob:', blobError);
        throw new Error(`Failed to create video blob: ${blobError.message}`);
      }

      // Ensure clean filename
      const audioName = pair.audio.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
      const imageName = pair.image.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");

      const video = {
        id: crypto.randomUUID(),
        pairId: pair.id,
        url: videoUrl,
        blob: videoBlob,
        filename: `video_${audioName}_${imageName}.mp4`,
        createdAt: new Date(),
        size: videoData.length
      };

      console.log('Video object created:', {
        id: video.id,
        filename: video.filename,
        size: video.size,
        pairId: video.pairId
      });

      // Add video to store immediately
      try {
        console.log('Adding video to store...');
        addGeneratedVideo(video);
        console.log('Video added to store successfully');

        // Verify video was added immediately
        const storeState = useAppStore.getState();
        const addedVideo = storeState.generatedVideos.find(v => v.id === video.id);
        console.log('Video verification:', addedVideo ? 'Successfully added' : 'Failed to add');
        console.log('Total videos in store:', storeState.generatedVideos.length);

        if (!addedVideo) {
          throw new Error('Video was not properly added to store');
        }
      } catch (storeError) {
        console.error('Error adding video to store:', storeError);
        throw new Error(`Failed to add video to store: ${storeError.message}`);
      }

      // Set final completion state
      console.log(`Setting completion state for pair ${pair.id}...`);
      setVideoGenerationState(pair.id, {
        isGenerating: false,
        progress: 100,
        isComplete: true,
        video: video,
        error: null
      });
      
      // Log the completion for debugging
      console.log(`Video completion state set for pair ${pair.id}:`, {
        isComplete: true,
        hasVideo: !!video,
        videoId: video.id
      });
      
      // Check if all videos are complete to update global state
      const allStates = useAppStore.getState().videoGenerationStates;
      const allPairsComplete = Object.values(allStates).every(state => 
        state && (state.isComplete || !state.isGenerating)
      );
      
      if (allPairsComplete) {
        console.log('All videos completed, updating global state');
        const { setIsGenerating: setStoreIsGenerating } = useAppStore.getState();
        setStoreIsGenerating(false);
      }
      
      console.log(`Video generation completed successfully for pair ${pair.id}`);
      return video;

    } catch (error) {
      console.error(`Error generating video for pair ${pair.id}:`, error);
      console.error('Error stack:', error.stack);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        cause: error.cause
      });
      
      // Check if this is an empty error object (often indicates successful completion)
      const isEmptyError = error && typeof error === 'object' && 
                          Object.keys(error).length === 0 && 
                          !error.message && !error.name;
      
      if (isEmptyError) {
        console.log('Detected empty error object after 100% progress - this is likely a false positive');
        console.log('Checking if we have valid video data in the generated videos...');
        
        // Check if a video was actually generated successfully
        const storeState = useAppStore.getState();
        const existingVideo = storeState.generatedVideos.find(v => v.pairId === pair.id);
        
        if (existingVideo) {
          console.log('Found successfully generated video despite empty error, marking as complete');
          setVideoGenerationState(pair.id, {
            isGenerating: false,
            progress: 100,
            isComplete: true,
            video: existingVideo,
            error: null
          });
          return existingVideo;
        }
      }

      // Check if generation was cancelled
      if (isCancelling || (error && error.message === 'Generation cancelled by user')) {
        console.log(`Video generation cancelled for pair ${pair.id}`);
        setVideoGenerationState(pair.id, {
          isGenerating: false,
          progress: 0,
          isComplete: false,
          video: null,
          error: null
        });
        return null;
      }

      // Handle actual errors
      const errorMessage = (error && typeof error === 'object' && error.message) ? error.message : 
                          (typeof error === 'string') ? error : 'Unknown error';
      setVideoGenerationState(pair.id, {
        isGenerating: false,
        progress: 0,
        isComplete: false,
        video: null,
        error: errorMessage
      });

      // Clean up any partial video data
      if (pair.video) {
        try {
          URL.revokeObjectURL(pair.video.url);
        } catch (e) {
          console.warn('Failed to revoke object URL:', e);
        }
      }

      // Check if this is a restart-related error that we can retry
      const errorMsg = (error && typeof error === 'object' && error.message) ? error.message : 
                      (typeof error === 'string') ? error : '';
      const isRestartableError = errorMsg.includes('restarting for next attempt') || 
                               errorMsg.includes('terminate') ||
                               errorMsg.includes('timeout');

      if (isRestartableError && !isCancelling) {
        console.log('Detected restartable error, FFmpeg will reinitialize for next video');
        // Set the pair as not generating but don't mark it as error - it might work on retry
        setVideoGenerationState(pair.id, {
          isGenerating: false,
          progress: 0,
          isComplete: false,
          video: null,
          error: null // Don't show error to user for restartable errors
        });
      } else {
        // Set error state for non-restartable errors
        const finalErrorMessage = (error && typeof error === 'object' && error.message) ? error.message : 
                                 (typeof error === 'string') ? error : 'Unknown error';
        setVideoGenerationState(pair.id, {
          isGenerating: false,
          progress: 0,
          isComplete: false,
          video: null,
          error: finalErrorMessage
        });
      }

      return null; // Don't throw to prevent unhandled rejections
    }
  };

  const stopGeneration = useCallback(() => {
    console.log('Stop generation clicked - forcing immediate termination');

    // Set cancelling flag first
    cancelGeneration();

    // Force stop all FFmpeg processes
    forceStopAllProcesses();

    // Immediately clear all generation states and return to containers view
    const { resetGenerationState, clearAllVideoGenerationStates, pairs } = useAppStore.getState();

    // Reset all states immediately
    setIsGenerating(false);
    setProgress(0);

    // Clear all video generation states for all pairs
    clearAllVideoGenerationStates();

    // Reset each pair's video generation state to ensure UI shows containers
    pairs.forEach(pair => {
      const { setVideoGenerationState } = useAppStore.getState();
      setVideoGenerationState(pair.id, {
        isGenerating: false,
        progress: 0,
        isComplete: false,
        video: null,
        error: null
      });
    });

    // Use comprehensive reset from store
    resetGenerationState();

    // Final cleanup after a short delay
    setTimeout(() => {
      resetCancellation();
      console.log('App completely reset and ready for new generation');
    }, 100); // Reduced delay for immediate feedback
  }, [cancelGeneration, setProgress, resetCancellation, setIsGenerating]);

  const resetAppForNewGeneration = useCallback(() => {
    console.log('Resetting app for new generation');

    // Reset all states
    setIsGenerating(false);
    setProgress(0);
    resetCancellation();

    // Clear all video generation states
    const { pairs, clearAllVideoGenerationStates } = useAppStore.getState();
    clearAllVideoGenerationStates();

    // Force cleanup of any lingering processes
    forceStopAllProcesses();

    console.log('App reset complete - ready for new generation');
  }, [setIsGenerating, setProgress, resetCancellation]);

  return {
    generateVideos,
    stopGeneration,
    resetAppForNewGeneration,
    progress
  };
};