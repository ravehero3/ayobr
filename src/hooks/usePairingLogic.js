
import { useCallback } from 'react';
import { useAppStore } from '../store/appStore';

export const usePairingLogic = () => {
  const { pairs, setPairs, setCurrentPage, setIsFilesBeingDropped } = useAppStore();

  // Cache to track processed files and prevent immediate re-processing
  const processedFilesCache = new Set();

  const clearFileCache = useCallback(() => {
    processedFilesCache.clear();
  }, []);

  const handleFileDrop = useCallback((files) => {
    console.log('usePairingLogic: handleFileDrop called with files:', files);
    
    if (!files || files.length === 0) {
      console.log('usePairingLogic: No files provided');
      return;
    }

    // Mark that files are being dropped/processed
    setIsFilesBeingDropped(true);

    try {
      // Filter out files that have been recently processed (same file object)
      const unprocessedFiles = files.filter(file => {
        const fileKey = `${file.name}_${file.size}_${file.lastModified}`;
        if (processedFilesCache.has(fileKey)) {
          console.log('Skipping already processed file:', file.name);
          return false;
        }
        processedFilesCache.add(fileKey);
        return true;
      });

      if (unprocessedFiles.length === 0) {
        console.log('All files were already processed, skipping');
        setIsFilesBeingDropped(false);
        return;
      }

      console.log('Processing unprocessed files:', unprocessedFiles);

      // Separate audio and image files
      const audioFiles = unprocessedFiles.filter(file => {
        const isAudioType = file.type.startsWith('audio/') || 
                           file.type === 'audio/mpeg' || 
                           file.type === 'audio/wav' || 
                           file.type === 'audio/mp3';
        const hasAudioExtension = file.name.toLowerCase().endsWith('.mp3') || 
                                 file.name.toLowerCase().endsWith('.wav');
        return isAudioType || hasAudioExtension;
      });
      const imageFiles = unprocessedFiles.filter(file => {
        const isImageType = file.type.startsWith('image/');
        const hasImageExtension = file.name.toLowerCase().endsWith('.jpg') || 
                                 file.name.toLowerCase().endsWith('.jpeg') || 
                                 file.name.toLowerCase().endsWith('.png') || 
                                 file.name.toLowerCase().endsWith('.heic') || 
                                 file.name.toLowerCase().endsWith('.heif');
        return isImageType || hasImageExtension;
      });

      console.log('Separated files - Audio:', audioFiles.length, 'Images:', imageFiles.length);

      if (audioFiles.length === 0 && imageFiles.length === 0) {
        console.log('No valid audio or image files found');
        alert('Please upload valid audio files (MP3, WAV) or image files (PNG, JPG, JPEG).');
        setIsFilesBeingDropped(false);
        return;
      }

      // Get current pairs from the hook
      const currentPairs = pairs;
      
      // Get existing files to avoid exact duplicates (same file object)
      const existingAudioFiles = currentPairs.filter(pair => pair.audio).map(pair => pair.audio);
      const existingImageFiles = currentPairs.filter(pair => pair.image).map(pair => pair.image);

      // Mark these files as processed to prevent immediate re-processing
      [...audioFiles, ...imageFiles].forEach(file => {
        const fileKey = `${file.name}_${file.size}_${file.lastModified}`;
        processedFilesCache.add(fileKey);
      });

      // Filter out files that are already in pairs (exact same file object)
      const newAudioFiles = audioFiles.filter(file => !existingAudioFiles.includes(file));
      const newImageFiles = imageFiles.filter(file => !existingImageFiles.includes(file));

      console.log('New files after filtering - Audio:', newAudioFiles.length, 'Images:', newImageFiles.length);

      if (newAudioFiles.length === 0 && newImageFiles.length === 0) {
        console.log('All files are already in pairs');
        setIsFilesBeingDropped(false);
        return;
      }

      // Create new pairs for new files
      const newPairs = [...currentPairs];

      // First, try to fill existing empty slots
      newAudioFiles.forEach(audioFile => {
        const emptyPair = newPairs.find(pair => !pair.audio);
        if (emptyPair) {
          emptyPair.audio = audioFile;
          console.log('Added audio to existing pair:', emptyPair.id);
        } else {
          // Create new pair for this audio
          const newPair = {
            id: `pair-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            audio: audioFile,
            image: null
          };
          newPairs.push(newPair);
          console.log('Created new pair for audio:', newPair.id);
        }
      });

      newImageFiles.forEach(imageFile => {
        const emptyPair = newPairs.find(pair => !pair.image);
        if (emptyPair) {
          emptyPair.image = imageFile;
          console.log('Added image to existing pair:', emptyPair.id);
        } else {
          // Create new pair for this image
          const newPair = {
            id: `pair-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            audio: null,
            image: imageFile
          };
          newPairs.push(newPair);
          console.log('Created new pair for image:', newPair.id);
        }
      });

      console.log('Final pairs after processing:', newPairs.length);
      setPairs(newPairs);

      // Navigate to file management page
      setCurrentPage('fileManagement');
      
      // Small delay to allow UI to update, then clear the dropping state
      setTimeout(() => {
        setIsFilesBeingDropped(false);
      }, 100);

    } catch (error) {
      console.error('Error in handleFileDrop:', error);
      setIsFilesBeingDropped(false);
    }
  }, [pairs, setPairs, setCurrentPage, setIsFilesBeingDropped]);

  const moveContainerUp = useCallback((pairId) => {
    const currentPairs = [...pairs];
    const index = currentPairs.findIndex(pair => pair.id === pairId);
    
    if (index > 0) {
      [currentPairs[index], currentPairs[index - 1]] = [currentPairs[index - 1], currentPairs[index]];
      setPairs(currentPairs);
    }
  }, [pairs, setPairs]);

  const moveContainerDown = useCallback((pairId) => {
    const currentPairs = [...pairs];
    const index = currentPairs.findIndex(pair => pair.id === pairId);
    
    if (index < currentPairs.length - 1) {
      [currentPairs[index], currentPairs[index + 1]] = [currentPairs[index + 1], currentPairs[index]];
      setPairs(currentPairs);
    }
  }, [pairs, setPairs]);

  return {
    handleFileDrop,
    moveContainerUp,
    moveContainerDown,
    clearFileCache
  };
};
