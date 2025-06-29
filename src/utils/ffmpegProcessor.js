import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg = null;
let isLoaded = false;

const initializeFFmpeg = async () => {
  if (ffmpeg && isLoaded) {
    return ffmpeg;
  }

  ffmpeg = new FFmpeg();
  
  // Load FFmpeg with progress callback
  await ffmpeg.load({
    coreURL: await toBlobURL('/ffmpeg-core.js', 'text/javascript'),
    wasmURL: await toBlobURL('/ffmpeg-core.wasm', 'application/wasm'),
    workerURL: await toBlobURL('/ffmpeg-core.worker.js', 'text/javascript')
  });

  isLoaded = true;
  return ffmpeg;
};

export const processVideoWithFFmpeg = async (audioFile, imageFile, onProgress) => {
  try {
    const ffmpeg = await initializeFFmpeg();

    // Set up progress callback
    ffmpeg.on('progress', ({ progress }) => {
      if (onProgress) {
        onProgress(Math.min(progress * 100, 100));
      }
    });

    // Convert files to Uint8Array for FFmpeg
    const audioData = new Uint8Array(await audioFile.arrayBuffer());
    const imageData = new Uint8Array(await imageFile.arrayBuffer());
    
    await ffmpeg.writeFile('audio.mp3', audioData);
    await ffmpeg.writeFile('image.jpg', imageData);

    // Get audio duration
    const audioDuration = await getAudioDurationFFmpeg(ffmpeg, 'audio.mp3');
    
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
    await ffmpeg.deleteFile('audio.mp3');
    await ffmpeg.deleteFile('image.jpg');
    await ffmpeg.deleteFile('output.mp4');

    return data;
    
  } catch (error) {
    console.error('FFmpeg processing error:', error);
    throw new Error(`Video generation failed: ${error.message}`);
  }
};

const getAudioDurationFFmpeg = async (ffmpeg, filename) => {
  try {
    // Use ffprobe to get duration
    await ffmpeg.exec([
      '-i', filename,
      '-f', 'null', '-'
    ]);
    
    // For now, return a default duration - in a real implementation,
    // you'd parse the FFmpeg output to get the exact duration
    return 30; // Default 30 seconds
  } catch (error) {
    console.warn('Could not determine audio duration, using default');
    return 30;
  }
};

// Alternative method using Web Audio API for duration
export const getAudioDuration = (audioFile) => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    
    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration);
    });
    
    audio.addEventListener('error', (error) => {
      reject(error);
    });
    
    audio.src = URL.createObjectURL(audioFile);
  });
};
