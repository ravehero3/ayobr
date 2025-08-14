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
    // Verify FFmpeg is actually working
    try {
      await ffmpeg.listDir('/');
      console.log('Returning existing FFmpeg instance (verified working)');
      return ffmpeg;
    } catch (verifyError) {
      console.warn('FFmpeg instance appears broken, reinitializing...');
      isLoaded = false;
      ffmpeg = null;
    }
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
        
        // Verify initialization worked
        try {
          await ffmpeg.listDir('/');
          console.log('FFmpeg filesystem verification successful');
        } catch (fsError) {
          console.error('FFmpeg filesystem verification failed:', fsError);
          throw new Error('FFmpeg loaded but filesystem is not accessible');
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
  // Validate input files
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

  console.log('Starting FFmpeg processing for:', audioFile.name, imageFile.name);
  console.log('File sizes - Audio:', audioFile.size, 'Image:', imageFile.size);
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

    // Fixed file reading to prevent ArrayBuffer detachment
    const readFileAsArrayBuffer = async (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          // Create a copy of the ArrayBuffer to prevent detachment
          const arrayBuffer = event.target.result;
          const uint8Array = new Uint8Array(arrayBuffer);
          resolve(uint8Array);
        };
        reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
        reader.readAsArrayBuffer(file);
      });
    };

    // Enhanced file reading with proper error handling
    const getCachedFileData = async (file, type) => {
      const cacheKey = `${file.name}_${file.size}_${file.lastModified}`;

      if (fileCache.has(cacheKey)) {
        const cachedData = fileCache.get(cacheKey);
        // Return a copy to prevent detachment issues
        return new Uint8Array(cachedData);
      }

      console.log(`Reading ${type} file:`, file.name, 'Size:', file.size);

      let data;
      try {
        // Use fetchFile instead of custom reader for better compatibility with FFmpeg
        data = await fetchFile(file);

        if (!data || data.length === 0) {
          throw new Error(`File ${file.name} is empty or could not be read`);
        }

        console.log(`Successfully read ${type} file:`, file.name, 'Data size:', data.length);
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

    // Use the fixed data loading
    const [audioData, imageData] = await Promise.all([
      getCachedFileData(audioFile, 'audio'),
      getCachedFileData(imageFile, 'image')
    ]);

    // Use unique filenames to avoid conflicts
    audioFileName = `audio_${timestamp}.mp3`;
    imageFileName = `image_${timestamp}.jpg`;
    outputFileName = `output_${timestamp}.mp4`;

    try {
      console.log('Writing files to FFmpeg FS:', {
        imageSize: imageData?.length || 0,
        audioSize: audioData?.length || 0
      });

      // Check if data is valid before processing
      if (!imageData || imageData.length === 0) {
        throw new Error('Image data is empty or invalid');
      }
      if (!audioData || audioData.length === 0) {
        throw new Error('Audio data is empty or invalid');
      }

      // Clone ArrayBuffers to prevent detachment
      const imageBuffer = new Uint8Array(imageData);
      const audioBuffer = new Uint8Array(audioData);

      await ffmpeg.writeFile(imageFileName, imageBuffer);
      await ffmpeg.writeFile(audioFileName, audioBuffer);

      // Verify files were written successfully
      const imageWritten = await ffmpeg.readFile(imageFileName);
      const audioWritten = await ffmpeg.readFile(audioFileName);

      if (!imageWritten || imageWritten.length === 0) {
        throw new Error(`Failed to write image file ${imageFileName} to FFmpeg FS`);
      }

      if (!audioWritten || audioWritten.length === 0) {
        throw new Error(`Failed to write audio file ${audioFileName} to FFmpeg FS`);
      }

      console.log('Files written successfully to FFmpeg FS');
    } catch (writeError) {
      console.error('Error writing files to FFmpeg FS:', writeError);
      throw new Error(`Failed to prepare input files: ${writeError.message}`);
    }


    // Handle logo processing with improved error handling
    let logoFileName = null;
    if (videoSettings && videoSettings.useLogo && videoSettings.logoFile) {
      try {
        console.log('Processing logo for video overlay...');
        logoFileName = `logo_${timestamp}.png`;
        
        // Handle different logo data formats
        let logoData;
        if (typeof videoSettings.logoFile === 'string') {
          // Base64 data - convert to binary
          const base64Data = videoSettings.logoFile.replace(/^data:image\/[a-z]+;base64,/, '');
          logoData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        } else {
          // File object
          logoData = await getCachedFileData(videoSettings.logoFile, 'logo');
        }
        
        if (logoData && logoData.length > 0) {
          await ffmpeg.writeFile(logoFileName, logoData);
          console.log('Logo file written successfully:', logoFileName);
        } else {
          console.warn('Logo data is empty, skipping logo overlay');
          logoFileName = null;
        }
      } catch (error) {
        console.error('Error processing logo:', error);
        console.warn('Continuing video generation without logo overlay');
        logoFileName = null;
      }
    }

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

    // Add logo input if provided
    if (logoFileName) {
      ffmpegArgs.push('-i', logoFileName);
    }

    // Map inputs
    ffmpegArgs.push('-map', '0:v');  // Map video from first input (image)
    ffmpegArgs.push('-map', '1:a');  // Map audio from second input (audio file)

    // Get background color from settings (default to black)
    const backgroundColor = (videoSettings && videoSettings.background) ? videoSettings.background : 'black';

    // Build video filter with optional logo overlay
    let videoFilter = `scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:${backgroundColor}`;
    
    // Add logo overlay if logo file is available
    if (logoFileName) {
      // Logo positioned at 27% from left edge, vertically centered, maintain aspect ratio
      // Since logo is already resized to 200px width, we scale it appropriately for 1920px video
      const logoOverlay = `[0:v]${videoFilter}[bg];[2:v]scale=w=200:h=-1[logo];[bg][logo]overlay=(main_w*0.27-overlay_w/2):main_h/2-overlay_h/2`;
      videoFilter = logoOverlay;
    }

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
      
      // Simple cleanup without complex filesystem operations
      try {
        console.log('Attempting simple cleanup...');
        await ffmpeg.deleteFile(audioFileName).catch(() => {});
        await ffmpeg.deleteFile(imageFileName).catch(() => {});
        await ffmpeg.deleteFile(outputFileName).catch(() => {});
        if (logoFileName) {
          await ffmpeg.deleteFile(logoFileName).catch(() => {});
        }
      } catch (cleanupError) {
        console.warn('Simple cleanup failed, continuing...', cleanupError);
      }

      throw new Error(`FFmpeg processing failed: ${error.message || 'Unknown error'}`);
    }

    console.log('FFmpeg execution completed successfully');

    // Read the output file with better error handling
    let data;
    try {
      // Check if file exists first
      try {
        const fileData = await ffmpeg.readFile(outputFileName);
        data = fileData;
        console.log('Output file read successfully, size:', data.length, 'bytes');
      } catch (fileError) {
        // Try to list files to debug
        console.log('Failed to read output file, checking filesystem...');
        try {
          const files = await ffmpeg.listDir('/');
          console.log('Files in FFmpeg filesystem:', files);
        } catch (listError) {
          console.log('Cannot list filesystem:', listError);
        }
        throw fileError;
      }
    } catch (readError) {
      console.error('Failed to read output file:', readError);
      const errorMsg = readError && readError.message ? readError.message : 'Unknown file read error';
      throw new Error(`Failed to read generated video: ${errorMsg}`);
    }

    // Verify the data is valid
    if (!data || data.length === 0) {
      throw new Error('Generated video file is empty or invalid');
    }

    // Final progress update to 100%
    if (onProgress && !hasCompleted) {
      onProgress(100);
      hasCompleted = true;
    }

    // Simple sequential cleanup
    try {
      await ffmpeg.deleteFile(audioFileName);
      console.log('Cleaned audio file');
    } catch (e) { console.warn('Failed to clean audio file:', e.message); }
    
    try {
      await ffmpeg.deleteFile(imageFileName);
      console.log('Cleaned image file');
    } catch (e) { console.warn('Failed to clean image file:', e.message); }
    
    try {
      await ffmpeg.deleteFile(outputFileName);
      console.log('Cleaned output file');
    } catch (e) { console.warn('Failed to clean output file:', e.message); }
    
    // Clean up logo file if it was used
    if (logoFileName) {
      try {
        await ffmpeg.deleteFile(logoFileName);
        console.log('Cleaned logo file');
      } catch (e) { console.warn('Failed to clean logo file:', e.message); }
    }

    // Return a new Uint8Array to ensure data integrity
    return new Uint8Array(data);

  } catch (error) {
    console.error('FFmpeg processing error:', error);

    // Force reinitialize FFmpeg on filesystem errors
    if (error && error.message && error.message.includes('FS error')) {
      console.log('Filesystem error detected, reinitializing FFmpeg...');
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

        if (logoFileName) {
          cleanupPromises.push(ffmpeg.deleteFile(logoFileName).catch(() => {}));
        }

        await Promise.allSettled(cleanupPromises);
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