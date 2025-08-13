import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg = null;
let isLoaded = false;
let isInitializing = false;
let initPromise = null;
let activeProcesses = new Set(); // Track active FFmpeg processes for immediate cancellation
let isForceStopped = false; // Track if processes were force stopped

// Scalable concurrency management for up to 100 files
const getOptimalConcurrency = (totalFiles) => {
  if (totalFiles <= 5) return 4;      // Small batches: 4 concurrent
  if (totalFiles <= 20) return 6;     // Medium batches: 6 concurrent
  if (totalFiles <= 50) return 8;     // Large batches: 8 concurrent
  if (totalFiles <= 75) return 10;    // Very large batches: 10 concurrent
  return 12;                          // Maximum 100 files: 12 concurrent
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
  console.log('Force stopping all FFmpeg processes...');
  isForceStopped = true;

  if (ffmpeg) {
    try {
      // Clear any progress listeners first to prevent further callbacks
      ffmpeg.off('progress');

      // Only terminate if FFmpeg is actually loaded
      if (isLoaded) {
        console.log('Gracefully terminating FFmpeg...');
        await ffmpeg.terminate();
      }

      // Clear the instance and state
      ffmpeg = null;
      isLoaded = false;
      isInitializing = false;
      initPromise = null;
      activeProcesses.clear();

      // Clean up caches
      fileCache.clear();
      processedImageCache.clear();
      audioBufferCache.clear();
      memoryCache.clear();

      // Reset process count
      processedCount = 0;

      console.log('All FFmpeg processes terminated and cleaned up');
    } catch (error) {
      console.error('Error terminating FFmpeg:', error);
      // Force clear everything even if termination fails
      ffmpeg = null;
      isLoaded = false;
      isInitializing = false;
      initPromise = null;
    }
  }

  // Reset force stopped flag immediately for fresh start
  isForceStopped = false;
};

// Restart FFmpeg completely - useful for debugging
export const restartFFmpeg = async () => {
  console.log('Restarting FFmpeg completely...');
  await forceStopAllProcesses(); // Now awaits the async operation

  // Wait a moment for cleanup
  await new Promise(resolve => setTimeout(resolve, 500));

  // Initialize fresh (force stopped flag is already reset in forceStopAllProcesses)
  return await initializeFFmpeg();
};

// Enhanced memory cleanup for 100-file batches
const cleanupMemory = () => {
  processedCount++;

  // Clean memory every 10 processed videos
  if (processedCount % MEMORY_CLEANUP_INTERVAL === 0) {
    console.log(`Performing memory cleanup after ${processedCount} processed videos`);

    // Clear excessive cache entries
    if (memoryCache.size > MAX_CACHE_SIZE) {
      const keysToDelete = Array.from(memoryCache.keys()).slice(0, memoryCache.size - MAX_CACHE_SIZE);
      keysToDelete.forEach(key => memoryCache.delete(key));
      console.log(`Cleaned up ${keysToDelete.length} cached items`);
    }

    // Clear file caches
    if (fileCache.size > maxCacheSize) {
      const oldestKeys = Array.from(fileCache.keys()).slice(0, fileCache.size - maxCacheSize);
      oldestKeys.forEach(key => fileCache.delete(key));
    }

    if (audioBufferCache.size > 20) {
      audioBufferCache.clear();
      console.log('Cleared audio buffer cache');
    }

    if (processedImageCache.size > 30) {
      processedImageCache.clear();
      console.log('Cleared processed image cache');
    }
  }

  // Force garbage collection if available
  if (window.gc) {
    window.gc();
  }
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
  console.log('initializeFFmpeg called, isLoaded:', isLoaded, 'isInitializing:', isInitializing);

  // Reset force stopped flag if we're initializing fresh
  if (isForceStopped) {
    console.log('Resetting force stopped flag for fresh initialization');
    isForceStopped = false;
  }

  // Return existing instance if already loaded
  if (isLoaded && ffmpeg && !isForceStopped) {
    console.log('Returning existing FFmpeg instance');
    return ffmpeg;
  }

  // Return existing promise if already initializing
  if (isInitializing && initPromise) {
    console.log('Returning existing initialization promise');
    return initPromise;
  }

  console.log('Starting FFmpeg initialization...');
  isInitializing = true;

  initPromise = (async () => {
    try {
      if (!ffmpeg || isForceStopped) {
        ffmpeg = new FFmpeg();
      }

      if (!isLoaded || isForceStopped) {
        // Simplified initialization optimized for Replit web environment
        try {
          console.log('Initializing FFmpeg with simplified approach...');

          // Use a simpler load approach that works better in web environments
          await ffmpeg.load({
            coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
            wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
            workerURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.worker.js'
          });
          console.log('FFmpeg loaded successfully with external CDN');

        } catch (cdnError) {
          console.error('External CDN loading failed:', cdnError);

          try {
            console.log('Trying default CDN fallback...');
            // Try the default load method as fallback
            await ffmpeg.load();
            console.log('FFmpeg loaded successfully with default CDN');
          } catch (fallbackError) {
            console.error('All FFmpeg loading methods failed:', fallbackError);
            throw new Error('Failed to initialize FFmpeg. Please refresh the page and try again.');
          }
        }
        isLoaded = true;
      }

      return ffmpeg;
    } catch (error) {
      console.error('FFmpeg initialization error:', error);
      isLoaded = false;
      ffmpeg = null;
      throw error;
    } finally {
      isInitializing = false;
    }
  })();

  return initPromise;
};

export const processVideoWithFFmpeg = async (audioFile, imageFile, onProgress, shouldCancel, videoSettings = null) => {
  console.log('Starting FFmpeg processing for:', audioFile.name, imageFile.name);
  console.log('Video settings:', videoSettings);

  try {
    const ffmpeg = await initializeFFmpeg();
    console.log('FFmpeg initialized successfully');

    // Clear any previous progress listeners to prevent memory leaks
    ffmpeg.off('progress');

    // Set up progress callback with throttling for better performance
    let lastProgressTime = 0;
    let hasCompleted = false;
    let progressCallbackActive = true;

    ffmpeg.on('progress', ({ progress }) => {
      const now = Date.now();
      // Throttle progress updates to every 200ms for better performance and prevent overload
      if (onProgress && progressCallbackActive && (now - lastProgressTime > 200) && !hasCompleted) {
        const normalizedProgress = Math.min(Math.max(progress * 100, 0), 100);
        onProgress(normalizedProgress);
        lastProgressTime = now;

        console.log(`FFmpeg progress: ${normalizedProgress.toFixed(1)}%`);

        // Mark as completed when we reach 100% to prevent restart
        if (normalizedProgress >= 100) {
          hasCompleted = true;
          progressCallbackActive = false;
        }
      }
    });

    // Ultra-optimized file reading with enhanced caching
    const getCachedFileData = async (file, type) => {
      const cacheKey = `${file.name}_${file.size}_${file.lastModified}`;

      if (fileCache.has(cacheKey)) {
        return fileCache.get(cacheKey);
      }

      const data = await fetchFile(file);

      // Manage cache size with LRU eviction
      if (fileCache.size >= maxCacheSize) {
        const firstKey = fileCache.keys().next().value;
        fileCache.delete(firstKey);
      }

      fileCache.set(cacheKey, data);
      return data;
    };

    // Pre-process image if not cached
    const getOptimizedImageData = async (file) => {
      const cacheKey = `opt_${file.name}_${file.size}_${file.lastModified}`;

      if (processedImageCache.has(cacheKey)) {
        return processedImageCache.get(cacheKey);
      }

      const data = await getCachedFileData(file, 'image');

      // Cache the processed image data
      if (processedImageCache.size >= maxCacheSize) {
        const firstKey = processedImageCache.keys().next().value;
        processedImageCache.delete(firstKey);
      }

      processedImageCache.set(cacheKey, data);
      return data;
    };

    // Use optimized data loading
    const [audioData, imageData] = await Promise.all([
      getCachedFileData(audioFile, 'audio'),
      getOptimizedImageData(imageFile)
    ]);

    // Use unique filenames to avoid conflicts
    const audioFileName = `audio_${Date.now()}.mp3`;
    const imageFileName = `image_${Date.now()}.jpg`;
    const outputFileName = `output_${Date.now()}.mp4`;
    let logoFileName = null;

    // Write files to FFmpeg filesystem
    await ffmpeg.writeFile(audioFileName, audioData);
    await ffmpeg.writeFile(imageFileName, imageData);

    // Handle logo file if provided and enabled (temporarily disabled for debugging)
    // if (logoSettings && logoSettings.useLogoInVideos && logoSettings.logoFile) {
    //   logoFileName = `logo_${Date.now()}.png`;
    //
    //   // Convert base64 logo to binary data
    //   const logoBase64 = logoSettings.logoFile.split(',')[1]; // Remove data:image/... prefix
    //   const logoData = Uint8Array.from(atob(logoBase64), c => c.charCodeAt(0));
    //   await ffmpeg.writeFile(logoFileName, logoData);
    //   console.log('Logo file written to FFmpeg filesystem:', logoFileName);
    // }

    // Get audio duration using Web Audio API
    const audioDuration = await getAudioDuration(audioFile);

    // Create 1920x1080 video with image centered and 20px white space above/below
    console.log('Executing FFmpeg command...');

    // Build FFmpeg command array
    let ffmpegArgs = [
      '-loop', '1',
      '-i', imageFileName,
      '-i', audioFileName
    ];

    // Add logo input if provided (temporarily disabled)
    // if (logoFileName) {
    //   ffmpegArgs.push('-i', logoFileName);
    // }

    // Map inputs
    ffmpegArgs.push('-map', '0:v');  // Map video from first input (image)
    ffmpegArgs.push('-map', '1:a');  // Map audio from second input (audio file)

    // Get background color from settings (default to black)
    const backgroundColor = (videoSettings && videoSettings.background) ? videoSettings.background : 'black';

    // Simplified video filter for better web performance
    const videoFilter = `scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:${backgroundColor}`;

    ffmpegArgs.push('-vf', videoFilter);

    // Ultra-fast parameters optimized for speed over quality
      ffmpegArgs.push(
        '-threads', '0',               // Use all available CPU cores
        '-c:v', 'libx264',
        '-preset', 'ultrafast',        // Fastest encoding preset
        '-tune', 'fastdecode',         // Optimize for fast decoding
        '-profile:v', 'baseline',      // Simpler profile for faster encoding
        '-level:v', '3.0',             // Lower level for faster processing
        '-crf', '28',                  // Lower quality but much faster
        '-r', '15',                    // Reduced frame rate for speed
        '-g', '30',                    // Smaller keyframe interval
        '-refs', '1',                  // Single reference frame for speed
        '-me_method', 'dia',           // Fastest motion estimation
        '-c:a', 'aac',                 // Use AAC codec for audio
        '-b:a', '96k',                 // Lower audio bitrate for speed
        '-ar', '22050',                // Lower sample rate for speed
        '-ac', '1',                    // Mono audio for speed
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',     // Optimize for streaming
        '-shortest',
        '-t', audioDuration.toString(),
        '-avoid_negative_ts', 'make_zero',
        '-f', 'mp4',                   // Explicit format
        '-y',
        outputFileName
      );

    console.log('FFmpeg command args:', ffmpegArgs);

    try {
      // Add timeout to prevent hanging with extended time for web environment
      const ffmpegPromise = ffmpeg.exec(ffmpegArgs);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('FFmpeg execution timeout after 120 seconds')), 120000);
      });

      console.log('Starting FFmpeg execution with optimized settings...');
      await Promise.race([ffmpegPromise, timeoutPromise]);

      // Disable progress callback to prevent issues during cleanup
      progressCallbackActive = false;
      console.log('FFmpeg command executed successfully');
    } catch (ffmpegError) {
      console.error('FFmpeg execution failed:', ffmpegError);
      console.error('FFmpeg command that failed:', ffmpegArgs);

      // Try to restart FFmpeg if it seems stuck or terminated
      if (ffmpegError.message.includes('timeout') || ffmpegError.message.includes('stuck') || ffmpegError.message.includes('terminate')) {
        console.log('Attempting to restart FFmpeg due to error...');
        await forceStopAllProcesses();
        throw new Error(`FFmpeg processing failed - restarting for next attempt`);
      }

      throw new Error(`FFmpeg processing failed: ${ffmpegError.message}`);
    }

    console.log('FFmpeg execution completed successfully');

    // Read the output file
    const data = await ffmpeg.readFile(outputFileName);
    console.log('Output file read successfully, size:', data.length, 'bytes');

    // Verify the data is valid
    if (!data || data.length === 0) {
      throw new Error('Generated video file is empty or invalid');
    }

    // Batch cleanup for faster I/O
    const cleanupPromises = [
      ffmpeg.deleteFile(audioFileName).catch(() => {}),
      ffmpeg.deleteFile(imageFileName).catch(() => {}),
      ffmpeg.deleteFile(outputFileName).catch(() => {})
    ];

    // Clean up logo file if it was used
    if (logoFileName) {
      cleanupPromises.push(ffmpeg.deleteFile(logoFileName).catch(() => {}));
    }

    await Promise.allSettled(cleanupPromises);

    // Increment processed count and cleanup memory for large batches
    processedCount++;
    if (processedCount % 10 === 0) {
      cleanupMemory();
    }

    // Return a new Uint8Array to ensure data integrity
    return new Uint8Array(data);

  } catch (error) {
    console.error('FFmpeg processing error:', error);

    // Clean up files on error
    try {
      const cleanupPromises = [
        ffmpeg.deleteFile(audioFileName).catch(() => {}),
        ffmpeg.deleteFile(imageFileName).catch(() => {}),
        ffmpeg.deleteFile(outputFileName).catch(() => {})
      ];

      // Clean up logo file if it was used
      if (logoFileName) {
        cleanupPromises.push(ffmpeg.deleteFile(logoFileName).catch(() => {}));
      }

      await Promise.allSettled(cleanupPromises);
    } catch (cleanupError) {
      console.warn('Error during cleanup:', cleanupError);
    }

    // Check if this is a cancellation error
    if (shouldCancel && shouldCancel()) {
      const cancellationError = new Error('Generation cancelled by user');
      cancellationError.isCancellation = true;
      throw cancellationError;
    }

    throw error;
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