import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg = null;
let isLoaded = false;
let isInitializing = false;
let initPromise = null;
let activeProcesses = new Set(); // Track active FFmpeg processes for immediate cancellation
let isForceStopped = false; // Track if processes were force stopped

// Optimized concurrency management for maximum speed
const getOptimalConcurrency = (totalFiles) => {
  if (totalFiles <= 5) return 6;      // Small batches: 6 concurrent
  if (totalFiles <= 20) return 8;     // Medium batches: 8 concurrent
  if (totalFiles <= 50) return 12;    // Large batches: 12 concurrent
  if (totalFiles <= 75) return 16;    // Very large batches: 16 concurrent
  return 20;                          // Maximum 100 files: 20 concurrent
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
  console.log('initializeFFmpeg called, isLoaded:', isLoaded, 'isInitializing:', isInitializing, 'isForceStopped:', isForceStopped);

  // Always reset force stopped flag when initializing
  if (isForceStopped) {
    console.log('Resetting force stopped flag for fresh initialization');
    isForceStopped = false;
    isLoaded = false; // Force re-initialization when recovering from force stop
    ffmpeg = null;
  }

  // Return existing instance if already loaded and not force stopped
  if (isLoaded && ffmpeg && !isForceStopped) {
    console.log('Returning existing FFmpeg instance');
    return ffmpeg;
  }

  // Return existing promise if already initializing and not force stopped
  if (isInitializing && initPromise && !isForceStopped) {
    console.log('Returning existing initialization promise');
    return initPromise;
  }

  console.log('Starting FFmpeg initialization...');
  isInitializing = true;

  initPromise = (async () => {
    try {
      // Always create a new FFmpeg instance for fresh start
      if (!ffmpeg) {
        console.log('Creating new FFmpeg instance');
        ffmpeg = new FFmpeg();
      }

      if (!isLoaded) {
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
        isForceStopped = false; // Ensure force stopped is cleared on successful load
      }

      return ffmpeg;
    } catch (error) {
      console.error('FFmpeg initialization error:', error);
      isLoaded = false;
      isForceStopped = false; // Reset on error to allow retry
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

  let audioFileName = null;
  let imageFileName = null;
  let outputFileName = null;
  let logoFileName = null; // Declare logoFileName here
  const timestamp = Date.now(); // Generate a timestamp for temporary files

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
      // Throttle progress updates to every 100ms for faster updates
      if (onProgress && progressCallbackActive && (now - lastProgressTime > 100) && !hasCompleted) {
        const normalizedProgress = Math.min(Math.max(progress * 100, 0), 100);
        onProgress(normalizedProgress);
        lastProgressTime = now;

        // Only log every 10% for performance
        if (normalizedProgress % 10 === 0) {
          console.log(`FFmpeg progress: ${normalizedProgress.toFixed(1)}%`);
        }

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
    audioFileName = `audio_${timestamp}.mp3`;
    imageFileName = `image_${timestamp}.jpg`;
    outputFileName = `output_${timestamp}.mp4`;

    // Write files to FFmpeg filesystem with error checking
    try {
      console.log('Writing files to FFmpeg FS:', {
        imageSize: imageData.length,
        audioSize: audioData.length
      });

      ffmpeg.FS('writeFile', imageFileName, imageData);
      ffmpeg.FS('writeFile', audioFileName, audioData);

      // Verify files were written successfully
      const imageWritten = ffmpeg.FS('readFile', imageFileName);
      const audioWritten = ffmpeg.FS('readFile', audioFileName);

      if (imageWritten.length === 0 || audioWritten.length === 0) {
        throw new Error('Failed to write input files to FFmpeg FS');
      }

      console.log('Files written successfully to FFmpeg FS');
    } catch (writeError) {
      console.error('Error writing files to FFmpeg FS:', writeError);
      throw new Error(`Failed to prepare input files: ${writeError.message}`);
    }


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

    // Ultra-optimized parameters for maximum speed
      ffmpegArgs.push(
        '-threads', '0',               // Use all available CPU cores
        '-c:v', 'libx264',
        '-preset', 'ultrafast',        // Fastest encoding preset
        '-tune', 'zerolatency',        // Optimize for minimal latency
        '-profile:v', 'baseline',      // Simpler profile for faster encoding
        '-level:v', '3.0',             // Lower level for faster processing
        '-crf', '30',                  // Even lower quality for maximum speed
        '-r', '10',                    // Very low frame rate for speed
        '-g', '10',                    // Very small keyframe interval
        '-refs', '1',                  // Single reference frame for speed
        '-me_method', 'dia',           // Fastest motion estimation
        '-subq', '1',                  // Fastest subpixel estimation
        '-trellis', '0',               // Disable trellis quantization
        '-aq-mode', '0',               // Disable adaptive quantization
        '-fast-pskip', '1',            // Enable fast P-frame skipping
        '-partitions', 'none',         // Disable partitions for speed
        '-flags', '+cgop',             // Closed GOP for faster seeking
        '-bf', '0',                    // No B-frames for speed
        '-wpredp', '0',                // Disable weighted prediction
        '-mixed-refs', '0',            // Disable mixed references
        '-8x8dct', '0',                // Disable 8x8 DCT
        '-fast-first-pass', '1',       // Fast first pass
        '-c:a', 'aac',                 // Use AAC codec for audio
        '-b:a', '64k',                 // Even lower audio bitrate
        '-ar', '22050',                // Lower sample rate for speed
        '-ac', '1',                    // Mono audio for speed
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart+frag_keyframe+empty_moov', // Optimize for streaming
        '-shortest',
        '-t', audioDuration.toString(),
        '-avoid_negative_ts', 'make_zero',
        '-f', 'mp4',                   // Explicit format
        '-y',
        outputFileName
      );

    console.log('FFmpeg command args:', ffmpegArgs);

    try {
      // Reduced timeout for faster failure detection
      const ffmpegPromise = ffmpeg.exec(ffmpegArgs);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('FFmpeg execution timeout after 30 seconds')), 30000);
      });

      console.log('Starting FFmpeg execution with optimized settings...');
      await Promise.race([ffmpegPromise, timeoutPromise]);

      // Disable progress callback to prevent issues during cleanup
      progressCallbackActive = false;
      console.log('FFmpeg command executed successfully');
    } catch (error) {
      console.error('FFmpeg execution failed:', error);
      console.error('FFmpeg command that failed:', ffmpegArgs);
      console.error('FFmpeg error stack:', error?.stack);

      // Clean up any temporary files that might be left behind
      try {
        const files = ffmpeg.FS('readdir', '/');
        files.forEach(file => {
          if (file.includes(timestamp) || file.startsWith('image_') || file.startsWith('audio_') || file.startsWith('output_')) {
            try {
              ffmpeg.FS('unlink', file);
            } catch (cleanupError) {
              console.warn('Failed to clean up file:', file, cleanupError);
            }
          }
        });
      } catch (cleanupError) {
        console.warn('Error during cleanup:', cleanupError);
      }

      throw new Error(`FFmpeg processing failed: ${error.message || 'Unknown error'}`);
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

    // Increment processed count and cleanup memory more frequently to prevent crashes
    processedCount++;
    if (processedCount % 3 === 0) {
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

    // Handle actual errors
    const errorMessage = error && error.message ? error.message : 'Unknown error occurred';
    // Assuming setVideoGenerationState is available in the scope where processVideoWithFFmpeg is called
    // If not, this part might need adjustment or passing setVideoGenerationState as a parameter.
    // For now, we'll log the error as the original code implies it's handled elsewhere.
    console.error(`Error during video generation for unknown pair: ${errorMessage}`);

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