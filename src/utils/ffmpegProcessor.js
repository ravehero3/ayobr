import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { getFFmpegCoreUrls, preloadFFmpegCore, resetFFmpegCoreCache } from './ffmpegCoreUrls';
import { renderCoverArtJpeg } from './imagePrep';
import { getVideoDimensions, buildFastEncodeArgs } from './videoEncode';
import {
  attachFFmpegInstanceLogs,
  ffmpegLog,
  getFFmpegRuntimeState,
  patchFFmpegRuntimeState,
  recordJobEvent,
} from './ffmpegDiagnostics';

const DEBUG = false;
let ffmpeg = null;
let isLoaded = false;
let isInitializing = false;
let initPromise = null;
let activeProcesses = new Set(); // Track active FFmpeg processes for immediate cancellation
let isForceStopped = false; // Track if processes were force stopped
let currentProcessingPairId = null; // Track which pair is currently being processed
let processingSessionCounter = 0; // Session counter to track unique processing sessions
let currentProgressToken = null;

// Reduced concurrency for memory stability
const getOptimalConcurrency = (totalFiles) => {
  if (totalFiles <= 5) return 1;      // Small batches: 1 at a time for stability
  if (totalFiles <= 20) return 2;     // Medium batches: 2 concurrent maximum
  if (totalFiles <= 50) return 2;     // Large batches: 2 concurrent maximum
  return 2;                           // Maximum: 2 concurrent for memory stability
};

// Memory management for large batches
const memoryCache = new Map();
const MAX_CACHE_SIZE = 100; // Increased cache for 100-file batches
let processedCount = 0;
const MEMORY_CLEANUP_INTERVAL = 10; // Clean memory every 10 processed videos

// Enhanced file cache for faster processing
const fileCache = new Map();
const maxCacheSize = 50; // Increased cache size for 100 files
const processedImageCache = new Map();
const audioBufferCache = new Map(); // Cache for audio file buffers

// Force stop all active FFmpeg processes gracefully
export const forceStopAllProcesses = async () => {
  DEBUG && console.log('Force stopping all FFmpeg processes...');
  isForceStopped = true;

  resetFFmpegCoreCache();

  if (ffmpeg) {
    try {
      // Clear any progress listeners first to prevent further callbacks
      ffmpeg.off('progress');

      // Clean up ALL temporary files before terminating
      try {
        const files = await ffmpeg.listDir('/');
        const tempFiles = files.filter(f => 
          !f.isDir && (
            f.name.startsWith('logo_') || 
            f.name.startsWith('audio_') || 
            f.name.startsWith('image_') || 
            f.name.startsWith('output_') ||
            f.name.startsWith('bg_')
          )
        );
        DEBUG && console.log(`Found ${tempFiles.length} temporary files to clean up`);

        for (const tempFile of tempFiles) {
          try {
            await ffmpeg.deleteFile(tempFile.name);
            DEBUG && console.log(`Cleaned up temporary file: ${tempFile.name}`);
          } catch (e) {
            console.warn(`Failed to clean temp file ${tempFile.name}:`, e.message);
          }
        }
      } catch (e) {
        console.warn('Failed to clean up temporary files:', e.message);
      }

      // Only terminate if FFmpeg is actually loaded
      if (isLoaded) {
        DEBUG && console.log('Gracefully terminating FFmpeg...');
        await ffmpeg.terminate();
        // Wait for termination to complete
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Clear the instance and state
      ffmpeg = null;
      isLoaded = false;
      isInitializing = false;
      initPromise = null;
      activeProcesses.clear();
      
      // Invalidate progress token to block any lingering callbacks
      currentProgressToken = null;

      // Clean up caches
      fileCache.clear();
      processedImageCache.clear();
      audioBufferCache.clear();
      memoryCache.clear();

      // Reset process count
      processedCount = 0;

      DEBUG && console.log('All FFmpeg processes terminated and cleaned up');
    } catch (error) {
      console.error('Error terminating FFmpeg:', error);
      // Force clear everything even if termination fails
      ffmpeg = null;
      isLoaded = false;
      isInitializing = false;
      initPromise = null;
      currentProgressToken = null; // Invalidate token even on error
    }
  }

  // Reset force stopped flag immediately for fresh start
  isForceStopped = false;
  patchFFmpegRuntimeState({ loaded: false, activePairId: null, initializing: false });
};

// Restart FFmpeg completely - useful for debugging
export const restartFFmpeg = async () => {
  DEBUG && console.log('Restarting FFmpeg completely...');
  await forceStopAllProcesses(); // Now awaits the async operation

  // Wait a moment for cleanup
  await new Promise(resolve => setTimeout(resolve, 500));

  // Initialize fresh (force stopped flag is already reset in forceStopAllProcesses)
  return await initializeFFmpeg();
};

// Enhanced memory cleanup for 100-file batches
const cleanupMemory = () => {
  processedCount++;

  DEBUG && console.log(`Memory cleanup after video ${processedCount}`);

  // Clear excessive cache entries
  if (memoryCache.size > 20) { // Reduced cache size
    const keysToDelete = Array.from(memoryCache.keys()).slice(0, memoryCache.size - 10);
    keysToDelete.forEach(key => memoryCache.delete(key));
    DEBUG && console.log(`Cleaned up ${keysToDelete.length} cached items`);
  }

  // Clear file caches more aggressively
  if (fileCache.size > 10) {
    const oldestKeys = Array.from(fileCache.keys()).slice(0, fileCache.size - 5);
    oldestKeys.forEach(key => fileCache.delete(key));
  }

  if (audioBufferCache.size > 5) {
    audioBufferCache.clear();
    DEBUG && console.log('Cleared audio buffer cache');
  }

  if (processedImageCache.size > 5) {
    processedImageCache.clear();
    DEBUG && console.log('Cleared processed image cache');
  }

  // Force browser memory cleanup for web environment
  if (window.gc) {
    try { window.gc(); } catch(e) { /* ignore */ }
  }

  // Clear URL objects that might be holding memory
  if (typeof window !== 'undefined' && window.URL && window.URL.revokeObjectURL) {
    // Clear any blob URLs that might be in memory (browser cleanup)
    try {
      const memoryKeys = Object.keys(memoryCache);
      memoryKeys.forEach(key => {
        const item = memoryCache.get(key);
        if (item && typeof item === 'string' && item.startsWith('blob:')) {
          window.URL.revokeObjectURL(item);
        }
      });
    } catch(e) { /* ignore cleanup errors */ }
  }
  
  DEBUG && console.log(`Memory cleanup complete. Active processes: ${activeProcesses.size}, Cache size: ${memoryCache.size}`);
};

// Progress tracking for large batches
export const getBatchProgress = () => {
  return {
    processed: processedCount,
    active: activeProcesses.size,
    cached: memoryCache.size
  };
};

export const initializeFFmpeg = async () => {
  DEBUG && console.log('initializeFFmpeg called, isLoaded:', isLoaded, 'isInitializing:', isInitializing, 'isForceStopped:', isForceStopped);

  // Always reset force stopped flag when initializing
  if (isForceStopped) {
    DEBUG && console.log('Resetting force stopped flag for fresh initialization');
    isForceStopped = false;
    isLoaded = false; // Force re-initialization when recovering from force stop
    ffmpeg = null;
    initPromise = null; // Clear existing promise
  }

  if (isLoaded && ffmpeg && !isForceStopped) {
    return ffmpeg;
  }

  // Return existing promise if already initializing and not force stopped
  if (isInitializing && initPromise && !isForceStopped) {
    DEBUG && console.log('Returning existing initialization promise');
    return initPromise;
  }

  DEBUG && console.log('Starting FFmpeg initialization...');
  isInitializing = true;

  initPromise = (async () => {
    try {
      if (!ffmpeg) {
        DEBUG && console.log('Creating new FFmpeg instance');
        ffmpeg = new FFmpeg();
      }

      if (!isLoaded) {
        patchFFmpegRuntimeState({ initializing: true, lastInitError: null });
        ffmpegLog('info', 'init', 'Loading FFmpeg WASM core…');
        const { coreURL, wasmURL } = await getFFmpegCoreUrls();
        patchFFmpegRuntimeState({
          coreSource: coreURL?.startsWith('blob:') ? 'blob (cached)' : coreURL,
        });
        await ffmpeg.load({ coreURL, wasmURL });
        attachFFmpegInstanceLogs(ffmpeg, 'singleton');
        await ffmpeg.listDir('/');
        isLoaded = true;
        isForceStopped = false;
        patchFFmpegRuntimeState({
          loaded: true,
          initializing: false,
          lastInitAt: new Date().toISOString(),
        });
        ffmpegLog('info', 'init', 'FFmpeg loaded successfully', {
          sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
        });
      }

      return ffmpeg;
    } catch (error) {
      console.error('FFmpeg initialization error:', error);
      ffmpegLog('error', 'init', error?.message || 'FFmpeg init failed', { stack: error?.stack });
      patchFFmpegRuntimeState({
        loaded: false,
        initializing: false,
        lastInitError: error?.message || String(error),
      });
      isLoaded = false;
      isForceStopped = false;
      ffmpeg = null;
      initPromise = null;
      throw error;
    } finally {
      isInitializing = false;
    }
  })();

  return initPromise;
};

export const processVideoWithFFmpeg = async (pairId, audioFile, imageFile, onProgress, shouldCancel, videoSettings = null, preparedAssets = null) => {
  // Validate input files (skip if we have prepared assets)
  if (!preparedAssets) {
    if (!audioFile || !audioFile.name) {
      throw new Error('Invalid audio file provided');
    }

    if (!imageFile || !imageFile.name) {
      throw new Error('Invalid image file provided');
    }

    if (audioFile.size === 0) {
      throw new Error(`Audio file ${audioFile.name} is empty`);
    }

    if (imageFile.size === 0) {
      throw new Error(`Image file ${imageFile.name} is empty`);
    }
  }

  DEBUG && console.log('Starting FFmpeg processing for:', audioFile.name, imageFile.name);
  DEBUG && console.log('File sizes - Audio:', audioFile.size, 'Image:', imageFile.size);
  DEBUG && console.log('Video settings:', videoSettings);
  DEBUG && console.log('Using pre-cached assets:', !!preparedAssets);

  let audioFileName = null;
  let imageFileName = null;
  let outputFileName = null;
  let logoFileName = null; // Declare logoFileName here
  const timestamp = Date.now(); // Generate a timestamp for temporary files
  let progressHandler = null; // Declare handler outside try block for finally cleanup
  const quality = videoSettings?.quality ?? 'fullhd';

  try {
    if (onProgress) onProgress(8);

    const ffmpeg = await initializeFFmpeg();
    if (onProgress) onProgress(18);
    DEBUG && console.log('FFmpeg initialized successfully');

    ffmpeg.off('progress');

    processingSessionCounter++;
    const currentSessionId = processingSessionCounter;
    currentProcessingPairId = pairId;
    const capturedPairId = pairId;
    patchFFmpegRuntimeState({ activePairId: pairId });
    recordJobEvent('job-start', { pairId, quality: videoSettings?.quality });
    ffmpegLog('info', 'job', `Starting encode for pair ${pairId}`, {
      quality: videoSettings?.quality,
      audio: audioFile?.name,
      image: imageFile?.name,
    });
    DEBUG && console.log(`[${pairId}] Starting FFmpeg, session: ${currentSessionId}`);


    // Set up progress callback with better completion handling
    let lastProgressTime = 0;
    let hasCompleted = false;
    let progressCallbackActive = true;
    let isNearCompletion = false;
    const processingPairId = pairId;

    // Store handler reference for proper cleanup (assign to outer scope variable)
    progressHandler = ({ progress }) => {
      if (capturedPairId !== currentProcessingPairId) return;

      const now = Date.now();
      if (onProgress && progressCallbackActive && (now - lastProgressTime > 100) && !hasCompleted) {
        const normalizedProgress = Math.min(Math.max(progress * 100, 0), 100);
        
        // Handle near-completion differently to prevent stuck at 99%
        if (normalizedProgress >= 99) {
          if (!isNearCompletion) {
            DEBUG && console.log(`[Pair ${capturedPairId}] FFmpeg approaching completion (99%+), preparing for file output...`);
            isNearCompletion = true;
            // Report 99% but don't mark as fully completed yet
            onProgress(99);
            lastProgressTime = now;
          }
          // Don't update progress further until file is actually ready
        } else {
          onProgress(normalizedProgress);
          lastProgressTime = now;

          // Log progress for better user feedback with pairId tracking
          if (normalizedProgress % 10 === 0 || normalizedProgress > 90) {
            DEBUG && console.log(`[Pair ${capturedPairId}] FFmpeg progress: ${normalizedProgress.toFixed(1)}%`);
          }
        }
      }
    };

    // Add handler with logging
    ffmpeg.on('progress', progressHandler);
    DEBUG && console.log(`[${pairId}] ✅ ADDED progress handler (session ${currentSessionId})`);

    // Enhanced file reading with proper error handling
    const getCachedFileData = async (file, type) => {
      const cacheKey = `${file.name}_${file.size}_${file.lastModified}`;

      if (fileCache.has(cacheKey)) {
        const cachedData = fileCache.get(cacheKey);
        // Return a copy to prevent detachment issues
        return new Uint8Array(cachedData);
      }

      DEBUG && console.log(`Reading ${type} file:`, file.name, 'Size:', file.size);

      let data;
      try {
        // Use fetchFile instead of custom reader for better compatibility with FFmpeg
        data = await fetchFile(file);

        if (!data || data.length === 0) {
          throw new Error(`File ${file.name} is empty or could not be read`);
        }

        DEBUG && console.log(`Successfully read ${type} file:`, file.name, 'Data size:', data.length);
      } catch (error) {
        console.error(`Error reading ${type} file:`, error);
        throw new Error(`Failed to read ${type} file: ${file.name}`);
      }

      // Cache the data
      if (fileCache.size >= maxCacheSize) {
        const firstKey = fileCache.keys().next().value;
        fileCache.delete(firstKey);
      }

      fileCache.set(cacheKey, data);
      return new Uint8Array(data); // Return a copy
    };

    const { width: RW, height: RH } = getVideoDimensions(quality);
    const bg = videoSettings?.background ?? 'black';
    const customBg =
      bg === 'custom' && videoSettings?.customBackground
        ? videoSettings.customBackground
        : null;

    let audioDuration =
      preparedAssets?.audioDuration ?? (await getAudioDuration(audioFile));
    if (onProgress) onProgress(28);

    const imageSource = imageFile;
    const jpegFrame = await renderCoverArtJpeg(
      imageSource,
      RW,
      RH,
      bg,
      customBg
    );
    if (onProgress) onProgress(38);

    let audioData;
    if (preparedAssets?.audioBuffer) {
      audioData = preparedAssets.audioBuffer;
    } else {
      audioData = new Uint8Array(await fetchFile(audioFile));
    }

    audioFileName = `audio_${pairId}_${timestamp}.mp3`;
    imageFileName = `image_${pairId}_${timestamp}.jpg`;
    outputFileName = `output_${pairId}_${timestamp}.mp4`;

    await Promise.all([
      ffmpeg.writeFile(imageFileName, jpegFrame),
      ffmpeg.writeFile(audioFileName, new Uint8Array(audioData)),
    ]);
    if (onProgress) onProgress(45);

    const ffmpegArgs = buildFastEncodeArgs(
      imageFileName,
      audioFileName,
      outputFileName,
      audioDuration,
      quality
    );

    patchFFmpegRuntimeState({
      lastExecArgs: ffmpegArgs,
      lastExecAt: new Date().toISOString(),
      lastExecError: null,
    });
    ffmpegLog('info', 'exec', `FFmpeg exec (${quality})`, { args: ffmpegArgs });
    DEBUG && console.log('FFmpeg command args:', ffmpegArgs);

    // Execute FFmpeg command with enhanced timeout protection
    DEBUG && console.log('Starting FFmpeg execution...');

    try {
      const execPromise = ffmpeg.exec(ffmpegArgs);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('FFmpeg execution timeout')), 900000); // 15 minute timeout for multiple video batches
      });

      await Promise.race([execPromise, timeoutPromise]);
      DEBUG && console.log('FFmpeg command executed successfully');
    } catch (execError) {
      console.error('FFmpeg execution error:', execError);

      // Check if this is a recoverable error or just a warning
      const errorMsg = execError.message || String(execError);
      const isWarningError = errorMsg.includes('Application provided invalid, non monotonically increasing dts') ||
                           errorMsg.includes('deprecated') ||
                           errorMsg.includes('warning') ||
                           errorMsg.toLowerCase().includes('non-monotonic') ||
                           errorMsg.includes('Last message repeated') ||
                           errorMsg.includes('Past duration') ||
                           errorMsg.includes('monotonic dts');

      if (isWarningError) {
        DEBUG && console.log('FFmpeg warning detected, continuing with output check...');
        ffmpegLog('warn', 'exec', errorMsg, { pairId });
      } else {
        ffmpegLog('error', 'exec', errorMsg, { pairId, quality });
        patchFFmpegRuntimeState({ lastExecError: errorMsg });
        if (quality === '4k') {
          ffmpegLog('warn', 'init', '[4K] Exec failed — resetting FFmpeg instance for next job');
          isLoaded = false;
          ffmpeg = null;
          initPromise = null;
          patchFFmpegRuntimeState({ loaded: false });
        }
        throw execError;
      }
    }

    DEBUG && console.log('FFmpeg execution completed successfully');

    // Read output file immediately — exec() is fully awaited above
    DEBUG && console.log('Reading output file...');

    let data;
    try {
      data = await ffmpeg.readFile(outputFileName);
    } catch (firstErr) {
      // One short retry in case of a transient FS flush delay
      await new Promise(resolve => setTimeout(resolve, 300));
      try {
        data = await ffmpeg.readFile(outputFileName);
      } catch (readError) {
        console.error('Video generation failed - could not read output:', readError.message || readError);
        console.error('- Audio:', audioFile.name, 'Image:', imageFile.name);
        throw new Error('Video generation failed: output file could not be read');
      }
    }

    if (!data || data.length < 1000) {
      throw new Error(`Video generation failed: output file is too small (${data ? data.length : 0} bytes)`);
    }

    if (onProgress && !hasCompleted) {
      onProgress(100);
      hasCompleted = true;
      progressCallbackActive = false;
    }

    DEBUG && console.log('FFmpeg execution completed successfully');

    // Parallel cleanup — all deletes fire at once
    const cleanupFiles = [audioFileName, imageFileName, outputFileName];
    await Promise.all(cleanupFiles.map(f => ffmpeg.deleteFile(f).catch(() => {})));

    cleanupMemory();
    patchFFmpegRuntimeState({
      processedCount: getFFmpegRuntimeState().processedCount + 1,
      lastSuccessAt: new Date().toISOString(),
    });
    recordJobEvent('job-complete', {
      pairId,
      quality,
      bytes: data?.length ?? 0,
    });
    ffmpegLog('info', 'job', `Encode complete for ${pairId}`, { bytes: data?.length });

    return new Uint8Array(data);

  } catch (error) {
    console.error('FFmpeg processing error:', error);
    ffmpegLog('error', 'job', error?.message || 'Processing failed', {
      pairId,
      quality: videoSettings?.quality,
    });
    patchFFmpegRuntimeState({
      failedCount: getFFmpegRuntimeState().failedCount + 1,
      lastExecError: error?.message || String(error),
    });
    recordJobEvent('job-failed', {
      pairId,
      quality: videoSettings?.quality,
      error: error?.message || String(error),
    });

    // Check if this is an empty error object (which often indicates success)
    const isEmptyError = error && typeof error === 'object' && 
                        Object.keys(error).length === 0 && 
                        !error.message && !error.name;

    if (isEmptyError) {
      DEBUG && console.log('Detected empty error object, this usually indicates successful completion');
      // Check if we completed successfully and have valid data
      if (hasCompleted && data && data.length > 0) {
        DEBUG && console.log('Found valid data despite empty error, returning successfully');
        return new Uint8Array(data);
      } else {
        DEBUG && console.log('Empty error but no valid data available, treating as real error');
      }
    }

    // Force reinitialize FFmpeg on filesystem errors
    if (error && error.message && error.message.includes('FS error')) {
      DEBUG && console.log('Filesystem error detected, reinitializing FFmpeg...');
      try {
        await forceStopAllProcesses();
        // FFmpeg will be reinitialized on next call
      } catch (reinitError) {
        console.warn('Failed to reinitialize FFmpeg:', reinitError);
      }
    }

    // Clean up files on error (only if FFmpeg is still accessible)
    if (ffmpeg && isLoaded) {
      try {
        const cleanupPromises = [
          ffmpeg.deleteFile(audioFileName).catch(() => {}),
          ffmpeg.deleteFile(imageFileName).catch(() => {}),
          ffmpeg.deleteFile(outputFileName).catch(() => {})
        ];

        await Promise.allSettled(cleanupPromises);
        
        // Call memory cleanup after error cleanup
        cleanupMemory();
      } catch (cleanupError) {
        console.warn('Error during cleanup:', cleanupError);
      }
    }

    // Check if this is a cancellation error
    if (shouldCancel && shouldCancel()) {
      const cancellationError = new Error('Generation cancelled by user');
      cancellationError.isCancellation = true;
      
      throw cancellationError;
    }

    // Handle actual errors
    const errorMessage = error && error.message ? error.message : 'Unknown error occurred';
    console.error(`Error during video generation for unknown pair: ${errorMessage}`);

    throw error;
  } finally {
    // CRITICAL: Clean up event handlers and state to prevent leaks into next job
    if (ffmpeg && progressHandler) {
      try {
        DEBUG && console.log(`[${pairId}] 🧹 REMOVING progress handler...`);
        ffmpeg.off('progress', progressHandler);
        DEBUG && console.log(`[${pairId}] ✅ Progress handler REMOVED successfully`);
      } catch (cleanupError) {
        console.warn(`[${pairId}] ❌ Error removing progress handler:`, cleanupError);
      }
    }

    // Clear the current processing pair tracker
    if (currentProcessingPairId === pairId) {
      currentProcessingPairId = null;
      DEBUG && console.log(`[Job Cleanup] Cleared current processing pair: ${pairId}`);
    }
    
    // CRITICAL FIX: Ensure FFmpeg filesystem is ACTUALLY clean before signaling completion
    // This prevents video 2 from having to clean up video 1's leftover files
    if (ffmpeg && isLoaded) {
      try {
        const files = await ffmpeg.listDir('/');
        const tempFiles = files.filter(f => 
          !f.isDir && (
            f.name.startsWith('logo_') || 
            f.name.startsWith('audio_') || 
            f.name.startsWith('image_') || 
            f.name.startsWith('output_') ||
            f.name.startsWith('bg_')
          )
        );
        
        if (tempFiles.length > 0) {
          DEBUG && console.log(`[${pairId}] 🧹 Found ${tempFiles.length} leftover temp files, cleaning...`);
          DEBUG && console.log(`[${pairId}] Files to clean:`, tempFiles.map(f => f.name));
          // Use Promise.allSettled to ensure all deletions attempt to complete
          await Promise.allSettled(
            tempFiles.map(async (tempFile) => {
              try {
                await ffmpeg.deleteFile(tempFile.name);
                DEBUG && console.log(`[${pairId}] ✅ Deleted: ${tempFile.name}`);
              } catch (e) {
                console.warn(`[${pairId}] ❌ Failed to delete ${tempFile.name}:`, e.message);
              }
            })
          );
          DEBUG && console.log(`[${pairId}] ✅ All leftover files cleaned`);
        } else {
          DEBUG && console.log(`[${pairId}] ✅ FFmpeg filesystem is CLEAN (no temp files)`);
        }
      } catch (e) {
        console.warn(`[Job Cleanup] Could not verify filesystem state:`, e.message);
      }
    }

    // Force garbage collection between videos for memory stability
    if (window.gc) {
      try { window.gc(); } catch(e) { /* ignore */ }
    }

    if (currentProcessingPairId === pairId) {
      patchFFmpegRuntimeState({ activePairId: null });
    }
    DEBUG && console.log(`[${pairId}] ✅ Cleanup complete, ready for next job`);
  }
};

// Pool-mode processor: uses a caller-provided FFmpeg instance with local state only.
// No module-level shared state is touched, so N instances can run truly concurrently.
export const processVideoWithFFmpegInstance = async (
  ffmpegInst, pairId, audioFile, imageFile,
  onProgress, shouldCancel, videoSettings = null, preparedAssets = null
) => {
  const timestamp = Date.now();
  const audioFileName  = `audio_${pairId}_${timestamp}.mp3`;
  const imageFileName  = `image_${pairId}_${timestamp}.jpg`;
  const outputFileName = `output_${pairId}_${timestamp}.mp4`;
  let progressHandler = null;
  let hasCompleted = false;
  let progressCallbackActive = true;

  try {
    ffmpegInst.off('progress');

    progressHandler = ({ progress }) => {
      if (!progressCallbackActive || hasCompleted || !onProgress) return;
      const pct = Math.min(Math.max(progress * 100, 0), 99);
      onProgress(pct);
    };
    ffmpegInst.on('progress', progressHandler);

    const quality = videoSettings?.quality;
    const { width: RW, height: RH } = getVideoDimensions(quality);
    const bg = videoSettings?.background ?? 'black';
    const customBg =
      bg === 'custom' && videoSettings?.customBackground
        ? videoSettings.customBackground
        : null;

    const audioDuration =
      preparedAssets?.audioDuration ?? (await getAudioDuration(audioFile));

    const jpegFrame = await renderCoverArtJpeg(imageFile, RW, RH, bg, customBg);

    const audioData = preparedAssets?.audioBuffer
      ? preparedAssets.audioBuffer
      : new Uint8Array(await fetchFile(audioFile));

    await Promise.all([
      ffmpegInst.writeFile(imageFileName, jpegFrame),
      ffmpegInst.writeFile(audioFileName, new Uint8Array(audioData)),
    ]);

    const ffmpegArgs = buildFastEncodeArgs(
      imageFileName,
      audioFileName,
      outputFileName,
      audioDuration,
      quality
    );

    attachFFmpegInstanceLogs(ffmpegInst, `pool-${pairId}`);
    patchFFmpegRuntimeState({ lastExecArgs: ffmpegArgs, lastExecAt: new Date().toISOString() });

    try {
      await Promise.race([
        ffmpegInst.exec(ffmpegArgs),
        new Promise((_, rej) => setTimeout(() => rej(new Error('FFmpeg timeout')), 900000)),
      ]);
    } catch (execError) {
      const msg = execError?.message ?? String(execError);
      const isWarning = /non monotonically|deprecated|warning|Past duration|monotonic dts/i.test(msg);
      if (!isWarning) {
        ffmpegLog('error', 'exec-pool', msg, { pairId, quality });
        if (quality === '4k') {
          ffmpegLog('warn', 'init', '[4K pool] Exec failed — terminate pool slot on next release');
        }
        throw execError;
      }
      ffmpegLog('warn', 'exec-pool', msg, { pairId });
    }

    // Read output
    let data;
    try {
      data = await ffmpegInst.readFile(outputFileName);
    } catch {
      await new Promise(r => setTimeout(r, 300));
      data = await ffmpegInst.readFile(outputFileName);
    }

    if (!data || data.length < 1000) {
      throw new Error(`Output file too small (${data?.length ?? 0} bytes)`);
    }

    if (onProgress && !hasCompleted) { onProgress(100); hasCompleted = true; }
    progressCallbackActive = false;

    // FS cleanup
    const toClean = [audioFileName, imageFileName, outputFileName];
    await Promise.allSettled(toClean.map(f => ffmpegInst.deleteFile(f).catch(() => {})));

    return new Uint8Array(data);

  } catch (error) {
    try {
      await Promise.allSettled([
        ffmpegInst.deleteFile(audioFileName).catch(() => {}),
        ffmpegInst.deleteFile(imageFileName).catch(() => {}),
        ffmpegInst.deleteFile(outputFileName).catch(() => {}),
      ]);
    } catch {}

    if (shouldCancel?.()) {
      const err = new Error('Generation cancelled by user');
      err.isCancellation = true;
      throw err;
    }
    throw error;
  } finally {
    progressCallbackActive = false;
    if (ffmpegInst && progressHandler) {
      try { ffmpegInst.off('progress', progressHandler); } catch {}
    }
  }
};

export const getAudioDuration = (audioFile) => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.onloadedmetadata = () => {
      resolve(audio.duration);
    };
    audio.onerror = (error) => {
      console.error('Error loading audio metadata:', error);
      reject(error);
    };
    audio.src = URL.createObjectURL(audioFile);
  });
};