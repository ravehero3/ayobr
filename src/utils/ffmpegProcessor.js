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

export const processVideoWithFFmpeg = async (audioFile, imageFile, onProgress, shouldCancel) => {
  let ffmpeg = null;

  try {
    ffmpeg = FFmpeg();

    // Set up progress tracking with smooth 1-100 progression
    ffmpeg.on('progress', ({ progress, time }) => {
      // Check for cancellation
      if (shouldCancel && shouldCancel()) {
        throw new Error('Generation cancelled by user');
      }

      // Convert progress to percentage (0-1 to 0-100) with smooth increments
      const percentage = Math.min(Math.max(Math.round(progress * 100), 0), 100);
      onProgress(percentage);
    });

    // Load FFmpeg
    await ffmpeg.load({
      coreURL: '/node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.js',
      wasmURL: '/node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.wasm'
    });

    // Check for cancellation after loading
    if (shouldCancel && shouldCancel()) {
      throw new Error('Generation cancelled by user');
    }

    const imageFileName = 'image.jpg';
    const audioFileName = 'audio.mp3';
    const outputFileName = 'output.mp4';

    // Write input files
    const imageData = new Uint8Array(await imageFile.arrayBuffer());
    const audioData = new Uint8Array(await audioFile.arrayBuffer());

    await ffmpeg.writeFile(imageFileName, imageData);
    await ffmpeg.writeFile(audioFileName, audioData);

    // Check for cancellation after writing files
    if (shouldCancel && shouldCancel()) {
      throw new Error('Generation cancelled by user');
    }

    // Get audio duration
    const audioDuration = await getAudioDuration(audioFile);

    const targetWidth = 1920;
    const targetHeight = 1040; // 1080 - 40px for top/bottom padding

    // Maximum speed FFmpeg command - optimized for fastest encoding while preserving audio quality
    // Create 1920x1080 video with image centered and 20px white space above/below
    await ffmpeg.exec([
      '-loop', '1',
      '-i', imageFileName,
      '-i', audioFileName,
      '-vf', `scale=1920:1040:force_original_aspect_ratio=decrease,pad=1920:1040:(ow-iw)/2:(oh-ih)/2:white,pad=1920:1080:0:20:white`,
      '-r', '1',                     // Increased framerate for smoother progress reporting
      '-c:v', 'libx264',
      '-preset', 'ultrafast',        // Fastest encoding preset
      '-tune', 'stillimage',         // Optimized for still images
      '-crf', '45',                  // Higher CRF for maximum speed
      '-g', '30',                    // GOP size for better progress tracking
      '-x264-params', 'bframes=0:ref=1:me=dia:subme=0:analyse=none:trellis=0:no-fast-pskip=1:no-mbtree=1:aq-mode=0:no-mixed-refs=1',
      '-movflags', '+faststart',     // Enable fast start for web playback
      '-c:a', 'copy',                // Copy audio without re-encoding for maximum speed and quality
      '-pix_fmt', 'yuv420p',
      '-shortest',
      '-t', audioDuration.toString(),
      '-avoid_negative_ts', 'make_zero',
      '-fflags', '+fastseek+genpts',
      '-threads', '1',               // Single thread for WASM
      '-progress', 'pipe:1',         // Enable detailed progress reporting
      '-y',
      outputFileName
    ]);

    // Final check for cancellation
    if (shouldCancel && shouldCancel()) {
      throw new Error('Generation cancelled by user');
    }

    // Read output
    const outputData = await ffmpeg.readFile(outputFileName);

    return outputData;
  } catch (error) {
    if (error.message === 'Generation cancelled by user') {
      console.log('Video generation cancelled by user');
      throw error;
    }
    console.error('FFmpeg processing error:', error);
    throw error;
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