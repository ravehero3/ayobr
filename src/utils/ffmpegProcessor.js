
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg = null;
let isLoaded = false;
let isInitializing = false;
let initPromise = null;

// Preload FFmpeg as soon as the module is imported
const preloadFFmpeg = async () => {
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    try {
      const ffmpegInstance = new FFmpeg();
      
      // Use toBlobURL for more reliable CDN access
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      
      const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
      const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');
      const workerURL = await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript');
      
      await ffmpegInstance.load({
        coreURL,
        wasmURL,
        workerURL
      });

      ffmpeg = ffmpegInstance;
      isLoaded = true;
      return ffmpegInstance;
    } catch (error) {
      console.warn('FFmpeg preload failed, will try on demand:', error);
      return null;
    }
  })();
  
  return initPromise;
};

// Start preloading immediately but catch any errors
preloadFFmpeg().catch(() => {
  // Silently fail, will initialize on demand
});

const initializeFFmpeg = async () => {
  // If preload succeeded, use the preloaded instance
  if (ffmpeg && isLoaded) {
    return ffmpeg;
  }

  // Wait for preload to complete if it's still running
  if (initPromise) {
    const preloadedInstance = await initPromise;
    if (preloadedInstance && isLoaded) {
      return preloadedInstance;
    }
  }

  // Fallback to on-demand initialization if preload failed
  if (isInitializing) {
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (ffmpeg && isLoaded) {
      return ffmpeg;
    }
  }

  isInitializing = true;
  ffmpeg = new FFmpeg();
  
  try {
    // Use toBlobURL for more reliable CDN access
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    
    const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
    const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');
    const workerURL = await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript');
    
    await ffmpeg.load({
      coreURL,
      wasmURL,
      workerURL
    });

    isLoaded = true;
    isInitializing = false;
    return ffmpeg;
  } catch (error) {
    console.error('Failed to initialize FFmpeg with CDN, trying default method:', error);
    
    // Try default loading method
    try {
      await ffmpeg.load();
      isLoaded = true;
      isInitializing = false;
      return ffmpeg;
    } catch (fallbackError) {
      console.error('FFmpeg initialization completely failed:', fallbackError);
      isInitializing = false;
      throw new Error('Failed to initialize FFmpeg. This may be due to browser compatibility or network restrictions. Please try refreshing the page or use a different browser.');
    }
  }
};

export const processVideoWithFFmpeg = async (audioFile, imageFile, onProgress) => {
  try {
    const ffmpeg = await initializeFFmpeg();

    // Clear any previous progress listeners
    ffmpeg.off('progress');
    
    // Set up progress callback
    ffmpeg.on('progress', ({ progress }) => {
      if (onProgress) {
        const normalizedProgress = Math.min(Math.max(progress * 100, 0), 100);
        onProgress(normalizedProgress);
      }
    });

    // Convert files to Uint8Array for FFmpeg
    const audioData = await fetchFile(audioFile);
    const imageData = await fetchFile(imageFile);
    
    await ffmpeg.writeFile('audio.mp3', audioData);
    await ffmpeg.writeFile('image.jpg', imageData);

    // Get audio duration using Web Audio API
    const audioDuration = await getAudioDuration(audioFile);
    
    // Ultra-fast FFmpeg command optimized for simple static image + audio
    // Create 1920x1080 video with image centered and 20px white space above/below
    await ffmpeg.exec([
      '-loop', '1',
      '-i', 'image.jpg',
      '-i', 'audio.mp3',
      '-vf', `scale=1920:1040:force_original_aspect_ratio=decrease,pad=1920:1040:(ow-iw)/2:(oh-ih)/2:white,pad=1920:1080:0:20:white`,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',        // Fastest encoding preset
      '-tune', 'stillimage',         // Optimized for static images
      '-crf', '30',                  // Higher CRF for faster encoding (still good quality)
      '-g', '30',                    // Lower GOP size for faster processing
      '-r', '1',                     // 1 FPS since image is static (much faster)
      '-c:a', 'aac',
      '-b:a', '96k',                 // Lower audio bitrate for faster processing
      '-ac', '2',                    // Stereo audio
      '-ar', '44100',                // Standard sample rate
      '-pix_fmt', 'yuv420p',
      '-shortest',
      '-t', audioDuration.toString(),
      '-avoid_negative_ts', 'make_zero',
      '-fflags', '+genpts',          // Generate presentation timestamps
      '-y',
      'output.mp4'
    ]);

    // Read the output file
    const data = await ffmpeg.readFile('output.mp4');
    
    // Clean up
    try {
      await ffmpeg.deleteFile('audio.mp3');
      await ffmpeg.deleteFile('image.jpg');
      await ffmpeg.deleteFile('output.mp4');
    } catch (cleanupError) {
      console.warn('Cleanup error (non-critical):', cleanupError);
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
