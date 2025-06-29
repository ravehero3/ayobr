import { useState, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { processVideoWithFFmpeg } from '../utils/ffmpegProcessor';

export const useFFmpeg = () => {
  const [progress, setProgress] = useState(0);
  const { setIsGenerating, addGeneratedVideo, setGeneratedVideos } = useAppStore();

  const generateVideos = useCallback(async (pairs) => {
    try {
      setIsGenerating(true);
      setProgress(0);
      setGeneratedVideos([]);

      const totalPairs = pairs.length;
      const generatedVideos = [];

      for (let i = 0; i < totalPairs; i++) {
        const pair = pairs[i];
        
        try {
          setProgress((i / totalPairs) * 100);
          
          const videoData = await processVideoWithFFmpeg(
            pair.audio,
            pair.image,
            (progressPercent) => {
              const overallProgress = ((i + progressPercent / 100) / totalPairs) * 100;
              setProgress(overallProgress);
            }
          );

          const videoBlob = new Blob([videoData], { type: 'video/mp4' });
          const videoUrl = URL.createObjectURL(videoBlob);

          const generatedVideo = {
            id: pair.id,
            name: `${pair.audio.name.split('.')[0]}_video`,
            url: videoUrl,
            data: videoData,
            duration: await getAudioDuration(pair.audio),
            size: videoData.byteLength
          };

          generatedVideos.push(generatedVideo);
          addGeneratedVideo(generatedVideo);
        } catch (error) {
          console.error(`Error generating video for pair ${pair.id}:`, error);
          // Continue with other pairs even if one fails
        }
      }

      setProgress(100);
      
      // Clean up after a delay
      setTimeout(() => {
        setProgress(0);
        setIsGenerating(false);
      }, 1000);

    } catch (error) {
      console.error('Error in video generation process:', error);
      setIsGenerating(false);
      setProgress(0);
      throw error;
    }
  }, [setIsGenerating, addGeneratedVideo, setGeneratedVideos]);

  return {
    generateVideos,
    progress
  };
};

// Helper function to get audio duration
const getAudioDuration = (audioFile) => {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.onloadedmetadata = () => {
      resolve(audio.duration);
    };
    audio.onerror = () => {
      resolve(0);
    };
    audio.src = URL.createObjectURL(audioFile);
  });
};
