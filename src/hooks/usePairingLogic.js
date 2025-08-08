
import { useCallback, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { v4 as uuidv4 } from 'uuid';

export const usePairingLogic = () => {
  const { pairs, addPair, updatePair, setPairs, setIsFilesBeingDropped } = useAppStore();
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
    // Immediately signal that files are being dropped for instant background change
    setIsFilesBeingDropped(true);
    
    // Clear any existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce the file processing to prevent rapid consecutive calls
    debounceTimeoutRef.current = setTimeout(() => {
      // Prevent concurrent processing
      if (processingRef.current) {
        console.log('Already processing files, ignoring duplicate call');
        setIsFilesBeingDropped(false);
        return;
      }
      
      processingRef.current = true;
      
      try {
        const dropId = Date.now();
        console.log(`Processing ${files.length} files for pairing (Drop ID: ${dropId})`);
        
        const audioFiles = files.filter(isAudioFile);
        const imageFiles = files.filter(isImageFile);

        console.log(`Found ${audioFiles.length} audio files and ${imageFiles.length} image files (Drop ID: ${dropId})`);

        // If no valid files, reset state and return
        if (audioFiles.length === 0 && imageFiles.length === 0) {
          console.log('No valid files found, resetting state');
          setIsFilesBeingDropped(false);
          return;
        }

        // Get current state for better duplicate detection
        const currentPairs = pairs;
        const existingAudioFiles = currentPairs.map(pair => pair.audio).filter(Boolean);
        const existingImageFiles = currentPairs.map(pair => pair.image).filter(Boolean);

        // Improved duplicate detection - check exact file properties
        const isDuplicateFile = (newFile, existingFiles) => {
          return existingFiles.some(existing => 
            existing.name === newFile.name && 
            existing.size === newFile.size && 
            existing.lastModified === newFile.lastModified &&
            existing.type === newFile.type
          );
        };

        const newAudioFiles = audioFiles.filter(file => !isDuplicateFile(file, existingAudioFiles));
        const newImageFiles = imageFiles.filter(file => !isDuplicateFile(file, existingImageFiles));

        console.log(`After duplicate filtering: ${newAudioFiles.length} new audio, ${newImageFiles.length} new images`);

        // If all files are duplicates, reset state and return
        if (newAudioFiles.length === 0 && newImageFiles.length === 0) {
          console.log('All files are duplicates, skipping processing');
          setIsFilesBeingDropped(false);
          return;
        }

        // Check if these exact files were just processed (additional safety)
        const currentFileIds = [...newAudioFiles, ...newImageFiles].map(getFileId);
        const hasRecentDuplicates = currentFileIds.some(id => lastProcessedFiles.current.has(id));
        
        if (hasRecentDuplicates) {
          console.log('Detected recently processed files, skipping to prevent duplicates');
          setIsFilesBeingDropped(false);
          return;
        }

        // Update the recently processed files set with shorter retention
        currentFileIds.forEach(id => lastProcessedFiles.current.add(id));
        
        // Clean up old entries more aggressively (keep only last 20 files)
        if (lastProcessedFiles.current.size > 20) {
          const entries = Array.from(lastProcessedFiles.current);
          const toDelete = entries.slice(0, entries.length - 20);
          toDelete.forEach(id => lastProcessedFiles.current.delete(id));
        }
        
        // Clear cache after a short delay to allow immediate re-drops
        setTimeout(() => {
          currentFileIds.forEach(id => lastProcessedFiles.current.delete(id));
        }, 2000);

        // Use current pairs from the hook
        const currentPairs = pairs;
        
        // Get existing files to avoid exact duplicates (same file object)
        const existingAudioFiles = currentPairs.filter(pair => pair.audio).map(pair => pair.audio);
        const existingImageFiles = currentPairs.filter(pair => pair.image).map(pair => pair.image);

        // Mark these files as processed to prevent immediate re-processing
        currentFileIds.forEach(id => lastProcessedFiles.current.add(id));

        // Clean up old processed file IDs (keep only last 50)
        if (lastProcessedFiles.current.size > 50) {
          const ids = Array.from(lastProcessedFiles.current);
          lastProcessedFiles.current.clear();
          ids.slice(-25).forEach(id => lastProcessedFiles.current.add(id));
        }

        // Start with current pairs
        const newPairs = [...currentPairs];
        
        // First, try to fill existing empty containers
        let audioIndex = 0;
        let imageIndex = 0;
        
        // Fill existing empty audio slots
        for (const pair of newPairs) {
          if (!pair.audio && audioIndex < newAudioFiles.length) {
            pair.audio = newAudioFiles[audioIndex];
            audioIndex++;
          }
        }
        
        // Fill existing empty image slots
        for (const pair of newPairs) {
          if (!pair.image && imageIndex < newImageFiles.length) {
            pair.image = newImageFiles[imageIndex];
            imageIndex++;
          }
        }
        
        // If we still have files left, create new pairs for them
        const remainingAudioFiles = newAudioFiles.slice(audioIndex);
        const remainingImageFiles = newImageFiles.slice(imageIndex);
        const maxRemaining = Math.max(remainingAudioFiles.length, remainingImageFiles.length);
        
        for (let i = 0; i < maxRemaining; i++) {
          const audioFile = remainingAudioFiles[i] || null;
          const imageFile = remainingImageFiles[i] || null;
          
          newPairs.push({
            id: uuidv4(),
            audio: audioFile,
            image: imageFile
          });
        }

        console.log(`Updated pairs count: ${newPairs.length} (Drop ID: ${dropId})`);
        setPairs(newPairs);
        
      } catch (error) {
        console.error('Error processing files:', error);
        setIsFilesBeingDropped(false);
      } finally {
        // Reset processing lock and file dropping state after a delay
        setTimeout(() => {
          processingRef.current = false;
          setIsFilesBeingDropped(false);
        }, 300);
      }
    }, 100); // Increased debounce delay for better stability
  }, [pairs, setPairs, setIsFilesBeingDropped]);

  const moveContainerUp = useCallback((pairId) => {
    const currentIndex = pairs.findIndex(pair => pair.id === pairId);
    if (currentIndex > 0) {
      const newPairs = [...pairs];
      // Swap with the previous pair
      [newPairs[currentIndex - 1], newPairs[currentIndex]] = [newPairs[currentIndex], newPairs[currentIndex - 1]];
      setPairs(newPairs);
    }
  }, [pairs, setPairs]);

  const moveContainerDown = useCallback((pairId) => {
    const currentIndex = pairs.findIndex(pair => pair.id === pairId);
    if (currentIndex >= 0 && currentIndex < pairs.length - 1) {
      const newPairs = [...pairs];
      // Swap with the next pair
      [newPairs[currentIndex], newPairs[currentIndex + 1]] = [newPairs[currentIndex + 1], newPairs[currentIndex]];
      setPairs(newPairs);
    }
  }, [pairs, setPairs]);

  const clearFileCache = useCallback(() => {
    lastProcessedFiles.current.clear();
    console.log('Cleared recent file cache');
  }, []);

  return {
    handleFileDrop,
    moveContainerUp,
    moveContainerDown,
    clearFileCache
  };
};
