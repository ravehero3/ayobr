
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg = null;
let isLoaded = false;
let isInitializing = false;
let initPromise = null;

// File cache to avoid re-reading the same files
const fileCache = new Map();
const maxCacheSize = 5; // Smaller cache for better memory management in WASM

// Simple initialization without preloading for Replit compatibility
const initializeFFmpegInstance = async () => {
  const ffmpegInstance = new FFmpeg();
  
  // Try default initialization first (works better in Replit)
  try {
    await ffmpegInstance.load();
    return ffmpegInstance;
  } catch (error) {
    console.warn('Default FFmpeg load failed, trying with specific URLs:', error);
    
    // Fallback to CDN with simplified approach
    try {
      await ffmpegInstance.load({
        coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
        wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
        workerURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.worker.js'
      });
      return ffmpegInstance;
    } catch (cdnError) {
      console.error('Both FFmpeg initialization methods failed:', cdnError);
      throw new Error('Unable to initialize video processor. Please refresh the page and try again.');
    }
  }
};

const initializeFFmpeg = async () => {
  // Return existing instance if already loaded
  if (ffmpeg && isLoaded) {
    return ffmpeg;
  }

  // Prevent multiple simultaneous initializations
  if (isInitializing) {
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (ffmpeg && isLoaded) {
      return ffmpeg;
    }
  }

  isInitializing = true;
  
  try {
    ffmpeg = await initializeFFmpegInstance();
    isLoaded = true;
    isInitializing = false;
    return ffmpeg;
  } catch (error) {
    isInitializing = false;
    throw error;
  }
};

export const processVideoWithFFmpeg = async (audioFile, imageFile, onProgress) => {
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
    
    await ffmpeg.writeFile(audioFileName, audioData);
    await ffmpeg.writeFile(imageFileName, imageData);

    // Get audio duration using Web Audio API
    const audioDuration = await getAudioDuration(audioFile);
    
    // Pre-compute optimal dimensions to avoid complex scaling during encoding
    const targetWidth = 1920;
    const targetHeight = 1040; // 1080 - 40px for top/bottom padding
    
    // Ultra-fast FFmpeg command - maximum speed optimizations for simple static video
    // Create 1920x1080 video with image centered and 20px white space above/below
    await ffmpeg.exec([
      '-loop', '1',
      '-i', imageFileName,
      '-i', audioFileName,
      '-vf', `scale=1920:1040:force_original_aspect_ratio=decrease,pad=1920:1040:(ow-iw)/2:(oh-ih)/2:white,pad=1920:1080:0:20:white,fps=1`,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',        // Fastest encoding preset
      '-tune', 'stillimage',         // Optimized for still images
      '-crf', '40',                  // Even higher CRF for maximum speed
      '-g', '999999',                // Single keyframe for static content
      '-x264-params', 'bframes=0:ref=1:me=dia:subme=1:analyse=none:trellis=0:no-fast-pskip=0:8x8dct=0',
      '-movflags', '+faststart',     // Enable fast start for web playback
      '-c:a', 'aac',
      '-b:a', '48k',                 // Minimal audio bitrate
      '-ac', '1',                    // Mono audio
      '-ar', '22050',                // Lower sample rate
      '-pix_fmt', 'yuv420p',
      '-shortest',
      '-t', audioDuration.toString(),
      '-avoid_negative_ts', 'make_zero',
      '-fflags', '+bitexact+fastseek',
      '-threads', '1',               // Single thread for WASM
      '-y',
      outputFileName
    ]);

    // Read the output file
    const data = await ffmpeg.readFile(outputFileName);
    
    // Clean up with better error handling
    const filesToClean = [audioFileName, imageFileName, outputFileName];
    for (const fileName of filesToClean) {
      try {
        await ffmpeg.deleteFile(fileName);
      } catch (cleanupError) {
        // Ignore cleanup errors - they're non-critical
      }
    }

    return data;
    
  } catch (error) {
    console.error('FFmpeg processing error:', error);
    throw new Error(`Video generation failed: ${error.message}`);
  }
};

// Use Web Audio API for more reliable duration detection
export const getAudioDuration = (audioFile) => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    
    const cleanup = () => {
      URL.revokeObjectURL(audio.src);
    };
    
    audio.addEventListener('loadedmetadata', () => {
      const duration = audio.duration;
      cleanup();
      resolve(duration || 30); // Fallback to 30 seconds if duration is invalid
    });
    
    audio.addEventListener('error', (error) => {
      cleanup();
      console.warn('Could not determine audio duration, using default');
      resolve(30); // Use default instead of rejecting
    });
    
    audio.src = URL.createObjectURL(audioFile);
  });
};
