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

    // Create pairs by adding to existing pairs or creating new ones
    const newPairs = [...pairs];
    
    // Process audio files
    audioFiles.forEach(audioFile => {
      // Find an existing pair without audio
      const existingPair = newPairs.find(pair => !pair.audio);
      if (existingPair) {
        existingPair.audio = audioFile;
      } else {
        // Create new pair with just audio
        newPairs.push({
          id: uuidv4(),
          audio: audioFile,
          image: null
        });
      }
    });

    // Process image files
    imageFiles.forEach(imageFile => {
      // Find an existing pair without image
      const existingPair = newPairs.find(pair => !pair.image);
      if (existingPair) {
        existingPair.image = imageFile;
      } else {
        // Create new pair with just image
        newPairs.push({
          id: uuidv4(),
          audio: null,
          image: imageFile
        });
      }
    });

    console.log(`Created ${newPairs.length} pairs`);
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
