
import { useCallback, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { v4 as uuidv4 } from 'uuid';

export const usePairingLogic = () => {
  const { pairs, addPair, updatePair, setPairs } = useAppStore();
  const processingRef = useRef(false);
  const lastProcessedFiles = useRef(new Set());
  const debounceTimeoutRef = useRef(null);

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

  // Create a unique identifier for a file
  const getFileId = (file) => {
    return `${file.name}_${file.size}_${file.lastModified}`;
  };

  const handleFileDrop = useCallback((files) => {
    // Clear any existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce the file processing to prevent rapid consecutive calls
    debounceTimeoutRef.current = setTimeout(() => {
      // Prevent concurrent processing
      if (processingRef.current) {
        console.log('Already processing files, ignoring duplicate call');
        return;
      }
      
      processingRef.current = true;
      
      try {
        const dropId = Date.now();
        console.log(`Processing ${files.length} files for pairing (Drop ID: ${dropId})`);
        
        const audioFiles = files.filter(isAudioFile);
        const imageFiles = files.filter(isImageFile);

        console.log(`Found ${audioFiles.length} audio files and ${imageFiles.length} image files (Drop ID: ${dropId})`);

        // If no valid files, don't change anything
        if (audioFiles.length === 0 && imageFiles.length === 0) {
          return;
        }

        // Check if these exact files were just processed
        const currentFileIds = [...audioFiles, ...imageFiles].map(getFileId);
        const hasRecentDuplicates = currentFileIds.some(id => lastProcessedFiles.current.has(id));
        
        if (hasRecentDuplicates) {
          console.log('Detected recently processed files, skipping to prevent duplicates');
          return;
        }

        // Update the recently processed files set
        currentFileIds.forEach(id => lastProcessedFiles.current.add(id));
        
        // Clean up old entries (keep only last 50 files)
        if (lastProcessedFiles.current.size > 50) {
          const entries = Array.from(lastProcessedFiles.current);
          const toDelete = entries.slice(0, entries.length - 50);
          toDelete.forEach(id => lastProcessedFiles.current.delete(id));
        }

        // Use current pairs from the hook
        const currentPairs = pairs;
        
        // Get existing file names to avoid duplicates
        const existingAudioNames = currentPairs.filter(pair => pair.audio).map(pair => pair.audio.name);
        const existingImageNames = currentPairs.filter(pair => pair.image).map(pair => pair.image.name);

        // Filter out files that are already in pairs
        const newAudioFiles = audioFiles.filter(file => !existingAudioNames.includes(file.name));
        const newImageFiles = imageFiles.filter(file => !existingImageNames.includes(file.name));

        console.log(`After filtering duplicates: ${newAudioFiles.length} new audio files, ${newImageFiles.length} new image files (Drop ID: ${dropId})`);

        // If no new files after filtering, don't change anything
        if (newAudioFiles.length === 0 && newImageFiles.length === 0) {
          console.log(`No new files to add - all files already exist in pairs (Drop ID: ${dropId})`);
          return;
        }

        // Start with current pairs
        const newPairs = [...currentPairs];
        
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

        console.log(`Updated pairs count: ${newPairs.length} (Drop ID: ${dropId})`);
        setPairs(newPairs);
        
      } finally {
        // Reset processing lock after a delay
        setTimeout(() => {
          processingRef.current = false;
        }, 200);
      }
    }, 50); // 50ms debounce delay
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
