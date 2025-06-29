import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg = null;
let isLoaded = false;
let isInitializing = false;
let initPromise = null;
let activeProcesses = new Set(); // Track active FFmpeg processes for immediate cancellation

// File cache to avoid re-reading the same files
const fileCache = new Map();
const maxCacheSize = 10; // Limit cache size to prevent memory issues

// Force stop all active FFmpeg processes immediately
export const forceStopAllProcesses = () => {
  console.log('Force stopping all FFmpeg processes...');
  
  if (ffmpeg) {
    try {
      // Terminate the FFmpeg instance immediately
      ffmpeg.terminate();
      ffmpeg = null;
      isLoaded = false;
      isInitializing = false;
      initPromise = null;
      activeProcesses.clear();
      console.log('All FFmpeg processes terminated');
    } catch (error) {
      console.error('Error terminating FFmpeg:', error);
    }
  }
};

export const initializeFFmpeg = async () => {
  console.log('initializeFFmpeg called, isLoaded:', isLoaded, 'isInitializing:', isInitializing);
  
  // Return existing instance if already loaded
  if (isLoaded && ffmpeg) {
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
      if (!ffmpeg) {
        ffmpeg = new FFmpeg();
      }

      if (!isLoaded) {
        // Direct initialization without blob URLs for Replit compatibility
        try {
          console.log('Initializing FFmpeg with CDN...');
          
          // Try the default CDN approach first
          await ffmpeg.load();
          console.log('FFmpeg loaded successfully via CDN');
          
        } catch (cdnError) {
          console.error('CDN loading failed:', cdnError);
          
          try {
            console.log('Trying direct URL loading...');
            // Use direct URLs without blob conversion
            await ffmpeg.load({
              coreURL: '/ffmpeg/ffmpeg-core.js',
              wasmURL: '/ffmpeg/ffmpeg-core.wasm'
            });
            console.log('FFmpeg loaded successfully from local files');
            
          } catch (localError) {
            console.error('Local files failed:', localError);
            
            // Final fallback to node_modules with direct paths
            try {
              console.log('Trying node_modules fallback...');
              await ffmpeg.load({
                coreURL: '/node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.js',
                wasmURL: '/node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.wasm'
              });
              console.log('FFmpeg loaded successfully from node_modules');
            } catch (finalError) {
              console.error('All FFmpeg loading methods failed:', finalError);
              throw finalError;
            }
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

export const processVideoWithFFmpeg = async (audioFile, imageFile, onProgress, shouldCancel) => {
  console.log('Starting FFmpeg processing for:', audioFile.name, imageFile.name);
  
  try {
    const ffmpeg = await initializeFFmpeg();
    console.log('FFmpeg initialized successfully');

    // Clear any previous progress listeners to prevent memory leaks
    ffmpeg.off('progress');
    
    // Set up progress callback with throttling for better performance
    let lastProgressTime = 0;
    ffmpeg.on('progress', ({ progress }) => {
      const now = Date.now();
      // Throttle progress updates to every 100ms for better performance
      if (onProgress && (now - lastProgressTime > 100)) {
        const normalizedProgress = Math.min(Math.max(progress * 100, 0), 100);
        onProgress(normalizedProgress);
        lastProgressTime = now;
      }
    });

    // Optimized file reading with caching
    const getCachedFileData = async (file, type) => {
      const cacheKey = `${file.name}_${file.size}_${file.lastModified}`;
      
      if (fileCache.has(cacheKey)) {
        return fileCache.get(cacheKey);
      }
      
      const data = await fetchFile(file);
      
      // Manage cache size
      if (fileCache.size >= maxCacheSize) {
        const firstKey = fileCache.keys().next().value;
        fileCache.delete(firstKey);
      }
      
      fileCache.set(cacheKey, data);
      return data;
    };

    const audioData = await getCachedFileData(audioFile, 'audio');
    const imageData = await getCachedFileData(imageFile, 'image');
    
    // Use unique filenames to avoid conflicts
    const audioFileName = `audio_${Date.now()}.mp3`;
    const imageFileName = `image_${Date.now()}.jpg`;
    const outputFileName = `output_${Date.now()}.mp4`;

    // Write files to FFmpeg filesystem
    await ffmpeg.writeFile(audioFileName, audioData);
    await ffmpeg.writeFile(imageFileName, imageData);

    // Get audio duration using Web Audio API
    const audioDuration = await getAudioDuration(audioFile);
    
    // Maximum speed FFmpeg command - optimized for fastest possible encoding
    // Create 1920x1080 video with image centered and 20px white space above/below
    console.log('Executing FFmpeg command...');
    await ffmpeg.exec([
      '-loop', '1',
      '-i', imageFileName,
      '-i', audioFileName,
      '-vf', `scale=1920:1040:force_original_aspect_ratio=decrease,pad=1920:1040:(ow-iw)/2:(oh-ih)/2:white,pad=1920:1080:0:20:white`,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',        // Fastest encoding preset
      '-tune', 'zerolatency',        // Ultra-low latency encoding
      '-crf', '35',                  // Higher CRF for maximum speed (acceptable quality)
      '-g', '15',                    // Very low GOP size for fastest processing
      '-keyint_min', '15',           // Match GOP size
      '-sc_threshold', '0',          // Disable scene change detection
      '-r', '1',                     // 1 FPS since image is static
      '-c:a', 'aac',
      '-b:a', '64k',                 // Minimal audio bitrate for speed
      '-ac', '1',                    // Mono audio for speed (most beats are mono anyway)
      '-ar', '22050',                // Lower sample rate for speed
      '-pix_fmt', 'yuv420p',
      '-shortest',
      '-t', audioDuration.toString(),
      '-avoid_negative_ts', 'make_zero',
      '-fflags', '+fastseek+genpts', // Fast seeking and PTS generation
      '-threads', '1',               // Single thread for WASM efficiency
      '-y',
      outputFileName
    ]);
    
    console.log('FFmpeg execution completed successfully');

    // Read the output file
    const data = await ffmpeg.readFile(outputFileName);
    console.log('Output file read successfully, size:', data.length);
    
    // Clean up files
    await ffmpeg.deleteFile(audioFileName);
    await ffmpeg.deleteFile(imageFileName);
    await ffmpeg.deleteFile(outputFileName);

    return data;

  } catch (error) {
    console.error('FFmpeg processing error:', error);
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