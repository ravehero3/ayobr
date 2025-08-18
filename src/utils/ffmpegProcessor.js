import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg = null;
let isLoaded = false;
let isInitializing = false;
let initPromise = null;
let activeProcesses = new Set(); // Track active FFmpeg processes for immediate cancellation
let isForceStopped = false; // Track if processes were force stopped

// Reduced concurrency for memory stability
const getOptimalConcurrency = (totalFiles) => {
  if (totalFiles <= 5) return 2;      // Small batches: 2 concurrent
  if (totalFiles <= 20) return 3;     // Medium batches: 3 concurrent
  if (totalFiles <= 50) return 4;     // Large batches: 4 concurrent
  return 5;                           // Maximum: 5 concurrent for memory stability
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

      // Clean up old logo files before terminating
      try {
        const files = await ffmpeg.listDir('/');
        const logoFiles = files.filter(f => f.name.startsWith('logo_') && !f.isDir);
        console.log(`Found ${logoFiles.length} logo files to clean up`);
        
        for (const logoFile of logoFiles) {
          try {
            await ffmpeg.deleteFile(logoFile.name);
            console.log(`Cleaned up old logo file: ${logoFile.name}`);
          } catch (e) {
            console.warn(`Failed to clean logo file ${logoFile.name}:`, e.message);
          }
        }
      } catch (e) {
        console.warn('Failed to clean up logo files:', e.message);
      }

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

  // Clean memory every 5 processed videos (more frequent cleanup)
  if (processedCount % 5 === 0) {
    console.log(`Performing memory cleanup after ${processedCount} processed videos`);

    // Clear excessive cache entries
    if (memoryCache.size > 20) { // Reduced cache size
      const keysToDelete = Array.from(memoryCache.keys()).slice(0, memoryCache.size - 10);
      keysToDelete.forEach(key => memoryCache.delete(key));
      console.log(`Cleaned up ${keysToDelete.length} cached items`);
    }

    // Clear file caches more aggressively
    if (fileCache.size > 10) {
      const oldestKeys = Array.from(fileCache.keys()).slice(0, fileCache.size - 5);
      oldestKeys.forEach(key => fileCache.delete(key));
    }

    if (audioBufferCache.size > 5) {
      audioBufferCache.clear();
      console.log('Cleared audio buffer cache');
    }

    if (processedImageCache.size > 5) {
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
        // Try loading FFmpeg with fallback options
        try {
          console.log('Trying default FFmpeg load...');
          await ffmpeg.load();
          console.log('FFmpeg loaded successfully with default method');
        } catch (defaultError) {
          console.error('Default FFmpeg loading failed:', defaultError);

          try {
            console.log('Trying external CDN...');
            await ffmpeg.load({
              coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
              wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
              workerURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.worker.js'
            });
            console.log('FFmpeg loaded successfully with external CDN');
          } catch (cdnError) {
            console.error('External CDN loading failed:', cdnError);
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

        // Log progress more frequently for better user feedback
        if (normalizedProgress % 5 === 0 || normalizedProgress > 95) {
          console.log(`FFmpeg progress: ${normalizedProgress.toFixed(1)}%`);
        }

        // Mark as completed when we reach 100% to prevent restart
        if (normalizedProgress >= 100) {
          hasCompleted = true;
          progressCallbackActive = false;
        }
      }
    });

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




    // Get audio duration using Web Audio API
    const audioDuration = await getAudioDuration(audioFile);

    // Create 1920x1080 video with image centered and 20px white space above/below
    console.log('Executing FFmpeg command...');

    // Build simplified FFmpeg command for better compatibility
    let ffmpegArgs = [
      '-loop', '1',
      '-i', imageFileName,
      '-i', audioFileName
    ];





    // Get background color from settings (default to black) and ensure FFmpeg compatibility
    let backgroundColor = 'black';
    let useCustomBackground = false;
    let customBackgroundFile = null;
    
    if (videoSettings && videoSettings.background) {
      if (videoSettings.background === 'white') {
        backgroundColor = 'white';
      } else if (videoSettings.background === 'black') {
        backgroundColor = 'black';
      } else if (videoSettings.background === 'custom' && videoSettings.customBackground) {
        useCustomBackground = true;
        customBackgroundFile = videoSettings.customBackground;
        backgroundColor = 'black'; // Fallback if custom fails
      } else {
        backgroundColor = 'black';
      }
    }
    
    console.log('Background settings:', { 
      backgroundColor, 
      useCustomBackground, 
      hasCustomFile: !!customBackgroundFile 
    });

    // Handle custom background implementation
    let customBackgroundFileName = null;
    if (useCustomBackground && customBackgroundFile) {
      try {
        console.log('Processing custom background...');
        customBackgroundFileName = `bg_${timestamp}.jpg`;
        
        let backgroundData;
        if (typeof customBackgroundFile === 'string') {
          // Base64 data - convert to binary
          const base64Data = customBackgroundFile.replace(/^data:image\/[a-z]+;base64,/, '');
          backgroundData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        } else {
          // File object
          backgroundData = await getCachedFileData(customBackgroundFile, 'background');
        }
        
        if (backgroundData && backgroundData.length > 0) {
          await ffmpeg.writeFile(customBackgroundFileName, backgroundData);
          console.log('Custom background written successfully:', customBackgroundFileName);
        } else {
          console.warn('Custom background data is empty, using fallback');
          useCustomBackground = false;
          customBackgroundFileName = null;
        }
      } catch (error) {
        console.error('Error processing custom background:', error);
        console.warn('Using black background as fallback');
        useCustomBackground = false;
        customBackgroundFileName = null;
      }
    }

    // Add custom background input if provided
    if (customBackgroundFileName && useCustomBackground) {
      ffmpegArgs.push('-i', customBackgroundFileName);
    }

    // Build video filter with proper input index handling
    let videoFilter;
    // Input indices: image=0, audio=1, background=2 (if exists)
    let backgroundIndex = 2;

    console.log('Video filter inputs:', {
      hasCustomBackground: useCustomBackground && !!customBackgroundFileName,
      backgroundIndex
    });

    if (useCustomBackground && customBackgroundFileName) {
      // Custom background video filter - overlay image on background
      videoFilter = `[${backgroundIndex}:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080[bg];[0:v]scale=1920:1080:force_original_aspect_ratio=decrease[img];[bg][img]overlay=(W-w)/2:(H-h)/2`;
    } else {
      // Standard solid color background - center image on solid background
      videoFilter = `scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:${backgroundColor}`;
    }

    // Ultra-optimized parameters for maximum speed
    ffmpegArgs.push(
      '-vf', videoFilter,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',        // Fastest encoding preset
      '-tune', 'fastdecode',         // Optimize for fast decoding
      '-crf', '30',                  // Higher CRF for much faster encoding (lower quality but significantly faster)
      '-pix_fmt', 'yuv420p',
      '-r', '15',                    // Lower frame rate for faster processing (15 fps instead of default 25)
      '-c:a', 'aac',
      '-b:a', '320k',                // High-quality audio bitrate (320k)
      '-ar', '44100',                // Standard sample rate for high quality (44.1 kHz)
      '-ac', '2',                    // Stereo audio for full quality
      '-threads', '0',               // Use all CPU cores
      '-shortest',
      '-t', audioDuration.toString(),
      '-y',                          // Overwrite output file
      outputFileName
    );

    console.log('FFmpeg command args:', ffmpegArgs);

    // Execute FFmpeg command with enhanced timeout protection
    console.log('Starting FFmpeg execution...');
    
    try {
      const execPromise = ffmpeg.exec(ffmpegArgs);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('FFmpeg execution timeout')), 600000); // Increased to 10 minute timeout
      });

      await Promise.race([execPromise, timeoutPromise]);
      console.log('FFmpeg command executed successfully');
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
        console.log('FFmpeg warning detected, continuing with output check...');
      } else {
        // Re-throw for actual errors
        throw execError;
      }
    }

    // Disable progress callback to prevent issues during cleanup
    progressCallbackActive = false;

    console.log('FFmpeg execution completed successfully');

    // Add small delay to ensure filesystem is ready and force garbage collection
    if (window.gc) {
      window.gc();
    }
    await new Promise(resolve => setTimeout(resolve, 200)); // Reduced delay for faster processing

    // Read the generated video file with retries
    console.log('Reading output file...');

    let data;
    let retryCount = 0;
    const maxRetries = 5; // Increased retries

    while (retryCount < maxRetries) {
      try {
        // Add delay before first read attempt and cleanup memory
        if (retryCount === 0) {
          if (window.gc) {
            window.gc();
          }
          await new Promise(resolve => setTimeout(resolve, 500)); // Reduced delay
        }

        // Check if output file exists first using listDir
        try {
          const files = await ffmpeg.listDir('/');
          const outputExists = files.some(f => f.name === outputFileName && !f.isDir);
          console.log(`Output file ${outputFileName} exists:`, outputExists);

          if (!outputExists) {
            if (retryCount === 0) {
              // On first attempt, wait longer for filesystem sync
              console.log('Output file not found, waiting for filesystem sync...');
              await new Promise(resolve => setTimeout(resolve, 2000));
              continue; // Try again without incrementing retry count
            }
            throw new Error('Output file was not created by FFmpeg');
          }
        } catch (listError) {
          console.warn('Could not check file existence:', listError.message);
          // Continue anyway and try to read the file
        }

        // Try to get file stats
        try {
          const fileList = await ffmpeg.listDir('/');
          const outputFile = fileList.find(f => f.name === outputFileName);
          if (outputFile && !outputFile.isDir) {
            console.log(`Found output file ${outputFileName} in filesystem`);
          }
        } catch (e) {
          console.warn('Could not verify file in filesystem:', e.message);
        }

        data = await ffmpeg.readFile(outputFileName);
        console.log('Successfully read output file, size:', data ? data.length : 'null');

        if (data && data.length > 1000) { // Minimum reasonable file size
          break; // Success!
        } else {
          throw new Error(`Output file is too small: ${data ? data.length : 0} bytes`);
        }
      } catch (readError) {
        retryCount++;
        console.error(`Failed to read output file (attempt ${retryCount}/${maxRetries}):`, readError.message || readError);

        if (retryCount < maxRetries) {
          // Progressive delay: 1s, 2s, 3s, 4s
          await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
          
          // Force garbage collection between retries
          if (window.gc) {
            window.gc();
          }
        } else {
          // Final attempt failed - list files for debugging
          try {
            const debugFiles = await ffmpeg.listDir('/');
            console.log('Files in FFmpeg filesystem after error:', debugFiles);
          } catch (listError) {
            console.log('Cannot list files:', listError);
          }

          // Enhanced error details for debugging
          console.error('Video generation failed - detailed error:');
          console.error('- Audio file:', audioFile.name, 'size:', audioFile.size);
          console.error('- Image file:', imageFile.name, 'size:', imageFile.size);
          console.error('- Output file expected:', outputFileName);
          console.error('- Last read error:', readError.message || readError);
          
          throw new Error(`Video generation failed: Output file could not be read after ${maxRetries} attempts`);
        }
      }
    }

    console.log('FFmpeg execution completed successfully');

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

    // Clean up custom background file if it was used
    if (customBackgroundFileName && useCustomBackground) {
      try {
        await ffmpeg.deleteFile(customBackgroundFileName);
        console.log('Cleaned custom background file');
      } catch (e) { console.warn('Failed to clean custom background file:', e.message); }
    }

    // Return a new Uint8Array to ensure data integrity
    return new Uint8Array(data);

  } catch (error) {
    console.error('FFmpeg processing error:', error);
    
    // Check if this is an empty error object (which often indicates success)
    const isEmptyError = error && typeof error === 'object' && 
                        Object.keys(error).length === 0 && 
                        !error.message && !error.name;
    
    if (isEmptyError) {
      console.log('Detected empty error object, this usually indicates successful completion');
      // Check if we completed successfully and have valid data
      if (hasCompleted && data && data.length > 0) {
        console.log('Found valid data despite empty error, returning successfully');
        return new Uint8Array(data);
      } else {
        console.log('Empty error but no valid data available, treating as real error');
      }
    }

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

        if (customBackgroundFileName && useCustomBackground) {
          cleanupPromises.push(ffmpeg.deleteFile(customBackgroundFileName).catch(() => {}));
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