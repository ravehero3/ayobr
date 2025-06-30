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
    console.log(`Processing ${files.length} files for pairing (optimized for up to 100 files)`);
    
    const audioFiles = files.filter(isAudioFile);
    const imageFiles = files.filter(isImageFile);

    console.log(`Found ${audioFiles.length} audio files and ${imageFiles.length} image files`);

    // Enhanced batch processing for up to 100 files
    const newPairs = [...pairs];
    
    // Remove completely empty pairs for efficiency
    const filteredPairs = newPairs.filter(pair => pair.audio || pair.image);
    
    // Efficient pairing algorithm for large batches
    const audioToProcess = [...audioFiles];
    const imageToProcess = [...imageFiles];
    
    // Fill existing pairs first (optimized for large batches)
    for (let i = 0; i < filteredPairs.length && (audioToProcess.length > 0 || imageToProcess.length > 0); i++) {
      const pair = filteredPairs[i];
      if (!pair.audio && audioToProcess.length > 0) {
        pair.audio = audioToProcess.shift();
      }
      if (!pair.image && imageToProcess.length > 0) {
        pair.image = imageToProcess.shift();
      }
    }

    // Create new pairs for remaining files (batch optimized)
    const maxRemaining = Math.max(audioToProcess.length, imageToProcess.length);
    for (let i = 0; i < maxRemaining; i++) {
      filteredPairs.push({
        id: uuidv4(),
        audio: audioToProcess[i] || null,
        image: imageToProcess[i] || null
      });
    }

    // Process image files efficiently
    const imagesToProcess = [...imageFiles];
    filteredPairs.forEach(pair => {
      if (!pair.image && imagesToProcess.length > 0) {
        pair.image = imagesToProcess.shift();
      }
    });

    // Process remaining image files
    imagesToProcess.forEach(imageFile => {
      filteredPairs.push({
        id: uuidv4(),
        audio: null,
        image: imageFile
      });
    });

    // Always ensure we have at least one empty pair for new drops
    filteredPairs.push({
      id: uuidv4(),
      audio: null,
      image: null
    });

    console.log(`Created ${filteredPairs.length} pairs`);
    setPairs(filteredPairs);
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
