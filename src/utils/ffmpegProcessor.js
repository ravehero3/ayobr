
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg = null;
let isLoaded = false;
let isInitializing = false;
let initPromise = null;

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
