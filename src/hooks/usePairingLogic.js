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
    const audioFiles = files.filter(isAudioFile);
    const imageFiles = files.filter(isImageFile);

    // Create pairs from existing pairs and new files
    const newPairs = [...pairs];
    
    // Try to fill existing empty slots first
    audioFiles.forEach(audioFile => {
      const emptyAudioPair = newPairs.find(pair => !pair.audio);
      if (emptyAudioPair) {
        emptyAudioPair.audio = audioFile;
      } else {
        newPairs.push({
          id: uuidv4(),
          audio: audioFile,
          image: null
        });
      }
    });

    imageFiles.forEach(imageFile => {
      const emptyImagePair = newPairs.find(pair => !pair.image);
      if (emptyImagePair) {
        emptyImagePair.image = imageFile;
      } else {
        newPairs.push({
          id: uuidv4(),
          audio: null,
          image: imageFile
        });
      }
    });

    // Always ensure we have at least one empty pair for new drops
    const hasCompletelyEmptyPair = newPairs.some(pair => !pair.audio && !pair.image);
    if (!hasCompletelyEmptyPair) {
      newPairs.push({
        id: uuidv4(),
        audio: null,
        image: null
      });
    }

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
