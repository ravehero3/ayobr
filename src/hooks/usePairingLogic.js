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

    // Start with existing pairs that have content
    const existingPairs = pairs.filter(pair => pair.audio || pair.image);
    const audioToProcess = [...audioFiles];
    const imageToProcess = [...imageFiles];
    
    // Fill existing incomplete pairs first
    for (const pair of existingPairs) {
      if (!pair.audio && audioToProcess.length > 0) {
        pair.audio = audioToProcess.shift();
      }
      if (!pair.image && imageToProcess.length > 0) {
        pair.image = imageToProcess.shift();
      }
    }

    // Create new pairs only for remaining files
    const finalPairs = [...existingPairs];
    const maxRemaining = Math.max(audioToProcess.length, imageToProcess.length);
    
    for (let i = 0; i < maxRemaining; i++) {
      finalPairs.push({
        id: uuidv4(),
        audio: audioToProcess[i] || null,
        image: imageToProcess[i] || null
      });
    }

    // Only add one empty pair if we have no pairs at all
    if (finalPairs.length === 0) {
      finalPairs.push({
        id: uuidv4(),
        audio: null,
        image: null
      });
    }

    console.log(`Created ${finalPairs.length} pairs`);
    setPairs(finalPairs);
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
