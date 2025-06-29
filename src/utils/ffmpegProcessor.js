
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg = null;
let isLoaded = false;

const initializeFFmpeg = async () => {
  if (ffmpeg && isLoaded) {
    return ffmpeg;
  }

  ffmpeg = new FFmpeg();
  
  try {
    // Load FFmpeg with proper URLs - use the CDN versions
    await ffmpeg.load({
      coreURL: await toBlobURL('https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js', 'text/javascript'),
      wasmURL: await toBlobURL('https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm', 'application/wasm'),
      workerURL: await toBlobURL('https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.worker.js', 'text/javascript')
    });

    isLoaded = true;
    return ffmpeg;
  } catch (error) {
    console.error('Failed to initialize FFmpeg:', error);
    throw new Error('Failed to initialize FFmpeg. Please refresh the page and try again.');
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
    
    // FFmpeg command to create 1920x1080 video with image centered vertically 
    // and 30px space above/below as specified in requirements
    await ffmpeg.exec([
      '-loop', '1',
      '-i', 'image.jpg',
      '-i', 'audio.mp3',
      '-filter_complex', `
        [0:v]scale=1920:1020:force_original_aspect_ratio=decrease,
        pad=1920:1020:(ow-iw)/2:(oh-ih)/2:white,
        pad=1920:1080:0:30:white,
        setpts=PTS-STARTPTS[v];
        [1:a]asetpts=PTS-STARTPTS[a]
      `,
      '-map', '[v]',
      '-map', '[a]',
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-pix_fmt', 'yuv420p',
      '-shortest',
      '-t', audioDuration.toString(),
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
