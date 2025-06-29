import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg = null;
let isLoaded = false;
let isInitializing = false;
let initPromise = null;

// File cache to avoid re-reading the same files
const fileCache = new Map();
const maxCacheSize = 10; // Limit cache size to prevent memory issues

export const initializeFFmpeg = async () => {
  // Return existing instance if already loaded
  if (isLoaded && ffmpeg) {
    return ffmpeg;
  }

  // Return existing promise if already initializing
  if (isInitializing && initPromise) {
    return initPromise;
  }

  isInitializing = true;

  initPromise = (async () => {
    try {
      if (!ffmpeg) {
        ffmpeg = new FFmpeg();
      }

      if (!isLoaded) {
        // Load FFmpeg from public directory for Replit compatibility
        try {
          await ffmpeg.load({
            coreURL: await toBlobURL('/ffmpeg/ffmpeg-core.js', 'text/javascript'),
            wasmURL: await toBlobURL('/ffmpeg/ffmpeg-core.wasm', 'application/wasm')
          });
        } catch (blobError) {
          console.log('Public directory blob URLs failed, trying node_modules:', blobError);
          // Fallback to node_modules if public directory fails
          try {
            await ffmpeg.load({
              coreURL: await toBlobURL('/node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.js', 'text/javascript'),
              wasmURL: await toBlobURL('/node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.wasm', 'application/wasm')
            });
          } catch (nodeError) {
            console.log('Node modules blob URLs failed, trying direct paths:', nodeError);
            // Last resort: direct paths
            await ffmpeg.load({
              coreURL: '/ffmpeg/ffmpeg-core.js',
              wasmURL: '/ffmpeg/ffmpeg-core.wasm'
            });
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
  try {
    const ffmpeg = await initializeFFmpeg();

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

    // Read the output file
    const data = await ffmpeg.readFile(outputFileName);
    
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