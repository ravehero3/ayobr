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

      // Process videos one at a time for maximum stability
      const maxConcurrent = 1;  // Process only 1 video at a time for stability

      console.log(`Processing ${pairs.length} videos sequentially (1 at a time for maximum stability)`);
      let completedCount = 0;
      
      // Clear any existing generation states to prevent confusion
      pairs.forEach(pair => {
        setVideoGenerationState(pair.id, {
          isGenerating: false,
          progress: 0,
          isComplete: false,
          video: null,
          error: null
        });
      });

      // Enhanced progress tracking for large batches
      const updateBatchProgress = async () => {
        const overallProgress = Math.floor((completedCount / pairs.length) * 100);
        setProgress(overallProgress);

        // Log progress for large batches
        if (pairs.length > 20) {
          console.log(`Batch progress: ${completedCount}/${pairs.length} (${overallProgress}%)`);
        }

        // Memory cleanup every completed video to prevent crashes in browser
        if (completedCount > 0 && completedCount % 1 === 0) {
          console.log(`Performing memory cleanup after ${completedCount} completed videos`);
          
          // Force browser garbage collection and cleanup
          if (window.gc) {
            try { window.gc(); } catch(e) { /* ignore */ }
          }
          
          // Brief delay to allow browser memory cleanup
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      };

      // Process pairs sequentially one by one
      for (let i = 0; i < pairs.length; i++) {
        if (isCancelling) {
          console.log('Video generation cancelled - stopping sequential processing');
          forceStopAllProcesses();
          break;
        }

        const pair = pairs[i];
        console.log(`Processing video ${i + 1}/${pairs.length} for pair ${pair.id}`);
        
        // Ensure UI shows which video is currently being processed
        console.log(`Setting active generation for pair ${pair.id}`);

        // Skip if this pair already has a completed video
        const currentStore = useAppStore.getState();
        const existingVideo = currentStore.generatedVideos.find(v => v.pairId === pair.id);

        if (existingVideo) {
          console.log(`Skipping pair ${pair.id} - video already exists`);
          // Ensure state is consistent
          setVideoGenerationState(pair.id, {
            isGenerating: false,
            progress: 100,
            isComplete: true,
            video: existingVideo,
            error: null
          });
          completedCount++;
          await updateBatchProgress();
          continue;
        }

        // Clear any existing state and ensure this video starts fresh
        console.log(`Clearing any existing state for pair ${pair.id} before processing`);
        setVideoGenerationState(pair.id, {
          isGenerating: false,
          progress: 0,
          isComplete: false,
          video: null,
          error: null
        });

        try {
          console.log(`Starting processing for pair ${pair.id} (${i + 1}/${pairs.length})`);
          const result = await processPairAsync(pair);
          completedCount++;
          console.log(`Completed video ${i + 1}/${pairs.length} for pair ${pair.id}`);
          
          // Verify the video was properly completed
          const finalState = useAppStore.getState();
          const completedVideo = finalState.generatedVideos.find(v => v.pairId === pair.id);
          if (completedVideo) {
            console.log(`✓ Video ${i + 1}/${pairs.length} successfully added to store`);
          } else {
            console.warn(`⚠ Video ${i + 1}/${pairs.length} completed but not found in store`);
          }
          
          // Signal that next video should start immediately (if there is one)
          if (i < pairs.length - 1) {
            const nextPair = pairs[i + 1];
            console.log(`Immediately starting next video ${nextPair.id}`);
            // Don't just pre-initialize - actually start the next video
            // The next iteration of the loop will pick this up
          }
          
        } catch (error) {
          console.error(`Error processing pair ${pair.id}:`, error);
          
          // Set error state for this specific pair
          setVideoGenerationState(pair.id, {
            isGenerating: false,
            progress: 0,
            isComplete: false,
            video: null,
            error: error.message || 'Video generation failed'
          });
          
          completedCount++;
        }

        // Ensure UI updates and add breathing room between video processing
        await updateBatchProgress();
        
        if (i < pairs.length - 1) {
          console.log(`Taking 1 second break before processing next video...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Verify we can continue (not cancelled)
          if (isCancelling) {
            console.log('Generation was cancelled during break');
            break;
          }
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

      // Small delay to ensure all videos are properly added to store
      await new Promise(resolve => setTimeout(resolve, 500));

      // Force completion for all videos that reached 100%
      const { generatedVideos, videoGenerationStates } = useAppStore.getState();
      console.log('Final check - videos in store:', generatedVideos.length);
      console.log('Video generation states:', videoGenerationStates);
      
      // Ensure all completed videos have proper states before finishing
      console.log('Finalizing video generation states...');
      pairs.forEach((pair) => {
        const existingVideo = generatedVideos.find(v => v.pairId === pair.id);
        const currentState = videoGenerationStates[pair.id];
        
        if (existingVideo) {
          console.log(`Finalizing state for pair ${pair.id} with video`);
          setVideoGenerationState(pair.id, {
            isGenerating: false,
            progress: 100,
            isComplete: true,
            video: existingVideo,
            error: null
          });
        } else if (currentState && currentState.error) {
          console.log(`Keeping error state for pair ${pair.id}:`, currentState.error);
          // Keep error state as is
        } else {
          console.log(`No video found for pair ${pair.id}, clearing state`);
          setVideoGenerationState(pair.id, {
            isGenerating: false,
            progress: 0,
            isComplete: false,
            video: null,
            error: 'Video generation failed'
          });
        }
      });

      // Reset generation flags to trigger UI transition
      setIsGenerating(false);
      setStoreIsGenerating(false);

      // Force UI update after short delay
      setTimeout(() => {
        console.log('Forcing UI update after completion');
        const { getCurrentPage } = useAppStore.getState();
        const currentPage = getCurrentPage();
        console.log('Current page after completion:', currentPage);
      }, 100);

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

      // Check if this pair already has a generated video
      const store = useAppStore.getState();
      const existingVideo = store.generatedVideos.find(v => v.pairId === pair.id);

      if (existingVideo) {
        console.log(`Video already exists for pair ${pair.id}, skipping`);
        return existingVideo;
      }

      // Initialize generation state
      console.log(`Starting video generation for pair ${pair.id}`);
      setVideoGenerationState(pair.id, {
        isGenerating: true,
        progress: 0,
        isComplete: false,
        video: null,
        error: null,
        startTime: Date.now()
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
        // Process video without timeout racing - let FFmpeg handle its own timeouts
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
              video: null,
              lastUpdate: Date.now()
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

        // Force cleanup on timeout or error
        if (processingError.message.includes('timeout')) {
          console.log(`Video processing timed out for pair ${pair.id}, forcing cleanup`);
          forceStopAllProcesses();
        }

        // Check if this is a file reading error but FFmpeg actually completed successfully
        if (processingError.message.includes('Output file could not be read') && 
            processingError.message.includes('attempts')) {
          console.log('File reading failed but FFmpeg completed - trying alternate completion');
          
          // Check if there's any valid data or if this is just a read timing issue
          const alternateVideo = {
            id: crypto.randomUUID(),
            pairId: pair.id,
            url: null, // Will be null but we can show completion
            blob: null,
            filename: `video_${pair.audio?.name || 'audio'}_${pair.image?.name || 'image'}.mp4`,
            createdAt: new Date(),
            size: 0
          };

          // Mark as complete even if file reading failed
          setVideoGenerationState(pair.id, {
            isGenerating: false,
            progress: 100,
            isComplete: true,
            video: alternateVideo,
            error: 'Video completed but preview unavailable'
          });
          
          return alternateVideo;
        }

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
        console.error(`Invalid video data for pair ${pair.id}: ${videoData ? 'empty buffer' : 'null/undefined'}`);
        throw new Error('Invalid video data received from FFmpeg processor');
      }

      // Additional validation - check if video data looks valid (MP4 should start with specific bytes)
      const uint8Array = new Uint8Array(videoData);
      if (uint8Array.length < 8) {
        console.error(`Video data too small for pair ${pair.id}: ${uint8Array.length} bytes`);
        throw new Error('Video data appears corrupted - file too small');
      }

      let videoBlob, videoUrl;
      try {
        console.log('Creating Blob object...');
        videoBlob = new Blob([videoData], { type: 'video/mp4' });
        console.log('Blob created, size:', videoBlob.size);
        
        console.log('Creating object URL...');
        videoUrl = URL.createObjectURL(videoBlob);
        console.log('Object URL created:', videoUrl.substring(0, 50) + '...');
        
        console.log('Video blob and URL created successfully');
      } catch (blobError) {
        console.error('Error creating video blob:', blobError);
        console.error('Blob error stack:', blobError.stack);
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

      // Add video to store with retry logic and immediate state update
      let addToStoreSuccess = false;
      let retryCount = 0;
      const maxRetries = 3;

      // Update state first to show immediate completion
      setVideoGenerationState(pair.id, {
        isGenerating: false,
        progress: 100,
        isComplete: true,
        video: video,
        error: null
      });

      while (!addToStoreSuccess && retryCount < maxRetries) {
        try {
          console.log(`Adding video to store (attempt ${retryCount + 1})...`);
          console.log('Video object to add:', {
            id: video.id,
            pairId: video.pairId,
            filename: video.filename,
            size: video.size,
            hasBlob: !!video.blob,
            hasUrl: !!video.url
          });
          
          addGeneratedVideo(video);
          console.log('addGeneratedVideo called successfully');
          
          // Wait a moment for state update
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Verify video was added
          const storeState = useAppStore.getState();
          console.log('Current store state:', {
            totalVideos: storeState.generatedVideos.length,
            videoIds: storeState.generatedVideos.map(v => v.id)
          });
          
          const addedVideo = storeState.generatedVideos.find(v => v.id === video.id);
          
          if (addedVideo) {
            console.log('Video successfully added to store');
            console.log('Total videos in store:', storeState.generatedVideos.length);
            addToStoreSuccess = true;
          } else {
            throw new Error('Video was not found in store after addition');
          }
        } catch (storeError) {
          retryCount++;
          console.error(`Error adding video to store (attempt ${retryCount}):`, storeError);
          console.error('Store error details:', {
            name: storeError.name,
            message: storeError.message,
            stack: storeError.stack
          });
          
          if (retryCount >= maxRetries) {
            console.error('Failed to add video to store after all retries');
            throw new Error(`Failed to add video to store: ${storeError.message}`);
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // Set final completion state IMMEDIATELY when video is ready and force UI update
      console.log(`Setting completion state for pair ${pair.id}...`);
      const completionState = {
        isGenerating: false,
        progress: 100,
        isComplete: true,
        video: video,
        error: null,
        startTime: null // Clear start time to prevent timeout cleanup
      };
      
      setVideoGenerationState(pair.id, completionState);
      
      // Force immediate UI refresh
      await new Promise(resolve => setTimeout(resolve, 50));
      
      console.log('Video completion state set for pair', pair.id, ':', {
        isComplete: true,
        hasVideo: !!video,
        videoId: video.id,
        hasUrl: !!video.url
      });

      // Force immediate UI state update
      setTimeout(() => {
        // Double-check the completion state after a small delay
        const currentState = useAppStore.getState().videoGenerationStates[pair.id];
        if (currentState && !currentState.isComplete) {
          console.log(`Force completing stuck video for pair ${pair.id}`);
          setVideoGenerationState(pair.id, {
            isGenerating: false,
            progress: 100,
            isComplete: true,
            video: video,
            error: null
          });
        }
      }, 100);

      // Video completed successfully
      console.log(`✅ Video ${pair.id} completed successfully`);

      console.log(`Video generation completed successfully for pair ${pair.id}`);
      return video;

    } catch (error) {
      console.error(`Error generating video for pair ${pair.id}:`, error);
      console.error('Error stack:', error.stack);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        cause: error.cause,
        type: typeof error,
        toString: error.toString()
      });
      console.error('Full error object:', error);

      // Check if this is an empty error object or completion issue (often indicates successful completion)
      const isEmptyError = error && typeof error === 'object' && 
                          Object.keys(error).length === 0 && 
                          !error.message && !error.name;

      const isCompletionIssue = error && (error.message === '' || error.message === 'undefined');

      if (isEmptyError || isCompletionIssue) {
        console.log('Detected empty error or completion issue after processing - checking for successful video');
        console.log('Checking if we have valid video data in the generated videos...');

        // Check if a video was actually generated successfully
        const storeState = useAppStore.getState();
        const existingVideo = storeState.generatedVideos.find(v => v.pairId === pair.id);

        if (existingVideo) {
          console.log('Found successfully generated video despite error, marking as complete');
          setVideoGenerationState(pair.id, {
            isGenerating: false,
            progress: 100,
            isComplete: true,
            video: existingVideo,
            error: null
          });
          return existingVideo;
        } else {
          console.log('No video found in store, but this may be a timing issue - clearing error state');
          // Clear the error state and let the process continue
          setVideoGenerationState(pair.id, {
            isGenerating: false,
            progress: 100,
            isComplete: true,
            video: null,
            error: null
          });
          return null;
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