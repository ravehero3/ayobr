import { useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { v4 as uuidv4 } from 'uuid';

export const usePairingLogic = () => {
  const { pairs, addPair, updatePair, setPairs } = useAppStore();

  const isAudioFile = (file) => {
    return file.type.startsWith('audio/') || 
           file.name.toLowerCase().endsWith('.mp3') || 
           file.name.toLowerCase().endsWith('.wav');
  };

  const isImageFile = (file) => {
    return file.type.startsWith('image/') ||
           file.name.toLowerCase().endsWith('.png') ||
           file.name.toLowerCase().endsWith('.jpg') ||
           file.name.toLowerCase().endsWith('.jpeg');
  };

  const handleFileDrop = useCallback((files) => {
    console.log(`Processing ${files.length} files for pairing`);
    
    const audioFiles = files.filter(isAudioFile);
    const imageFiles = files.filter(isImageFile);

    console.log(`Found ${audioFiles.length} audio files and ${imageFiles.length} image files`);

    // If no valid files, don't change anything
    if (audioFiles.length === 0 && imageFiles.length === 0) {
      return;
    }

    // Get existing file names to avoid duplicates
    const existingAudioNames = pairs.filter(pair => pair.audio).map(pair => pair.audio.name);
    const existingImageNames = pairs.filter(pair => pair.image).map(pair => pair.image.name);

    // Filter out files that are already in pairs
    const newAudioFiles = audioFiles.filter(file => !existingAudioNames.includes(file.name));
    const newImageFiles = imageFiles.filter(file => !existingImageNames.includes(file.name));

    console.log(`After filtering duplicates: ${newAudioFiles.length} new audio files, ${newImageFiles.length} new image files`);

    // If no new files after filtering, don't change anything
    if (newAudioFiles.length === 0 && newImageFiles.length === 0) {
      console.log('No new files to add - all files already exist in pairs');
      return;
    }

    // Start with existing pairs
    const newPairs = [...pairs];
    
    // Create pairs by pairing audio and image files together
    const maxFiles = Math.max(newAudioFiles.length, newImageFiles.length);
    
    for (let i = 0; i < maxFiles; i++) {
      const audioFile = newAudioFiles[i] || null;
      const imageFile = newImageFiles[i] || null;
      
      // Try to fill existing incomplete pairs first
      if (audioFile && !imageFile) {
        // Audio only - find a pair without audio
        const existingPair = newPairs.find(pair => !pair.audio);
        if (existingPair) {
          existingPair.audio = audioFile;
          continue;
        }
      }
      
      if (imageFile && !audioFile) {
        // Image only - find a pair without image
        const existingPair = newPairs.find(pair => !pair.image);
        if (existingPair) {
          existingPair.image = imageFile;
          continue;
        }
      }
      
      // Create new pair (either both files or single file if no existing pairs to fill)
      newPairs.push({
        id: uuidv4(),
        audio: audioFile,
        image: imageFile
      });
    }

    console.log(`Updated pairs count: ${newPairs.length}`);
    setPairs(newPairs);
  }, [pairs, setPairs]);

  const swapContainers = useCallback((fromPairId, toPairId, type) => {
    const newPairs = [...pairs];
    const fromPair = newPairs.find(pair => pair.id === fromPairId);
    const toPair = newPairs.find(pair => pair.id === toPairId);

    if (fromPair && toPair) {
      // Swap the specified type (audio or image)
      const temp = fromPair[type];
      fromPair[type] = toPair[type];
      toPair[type] = temp;

      setPairs(newPairs);
    }
  }, [pairs, setPairs]);

  return {
    handleFileDrop,
    swapContainers
  };
};
