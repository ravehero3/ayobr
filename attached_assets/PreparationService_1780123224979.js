import { fetchFile } from '@ffmpeg/util';

const CONFIG = {
  MAX_CONCURRENT_PREPARATIONS: 3, // Prepare up to 3 pairs simultaneously
  MEMORY_LIMIT: 450 * 1024 * 1024, // 450MB limit for prepared assets
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY: 1000
};

class PreparationService {
  constructor() {
    this.activePreparations = new Set();
    this.preparationPromises = new Map();
    this.abortControllers = new Map();
  }

  /**
   * Get audio duration using Web Audio API
   */
  async getAudioDuration(audioFile) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const audioBuffer = await audioContext.decodeAudioData(e.target.result);
          const duration = audioBuffer.duration;
          await audioContext.close();
          resolve(duration);
        } catch (error) {
          console.error('Error decoding audio:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read audio file'));
      reader.readAsArrayBuffer(audioFile);
    });
  }

  /**
   * Sanitize filename for FFmpeg compatibility
   */
  sanitizeFilename(filename) {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 100);
  }

  /**
   * Read file as ArrayBuffer
   */
  async readFileAsBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(new Uint8Array(e.target.result));
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Extract image metadata
   */
  async getImageMetadata(imageFile) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(imageFile);
      
      img.onload = () => {
        const metadata = {
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspectRatio: img.naturalWidth / img.naturalHeight
        };
        URL.revokeObjectURL(url);
        resolve(metadata);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  }

  /**
   * Prepare a single pair's data
   */
  async preparePairData(pair, videoSettings, onProgress) {
    const abortController = new AbortController();
    this.abortControllers.set(pair.id, abortController);

    try {
      console.log(`PreparationService: Starting preparation for pair ${pair.id}`);
      
      if (!pair.audio || !pair.image) {
        throw new Error('Pair missing audio or image file');
      }

      // Step 1: Read audio file (30% progress)
      onProgress?.(10);
      const audioBuffer = await this.readFileAsBuffer(pair.audio);
      
      if (abortController.signal.aborted) {
        throw new Error('Preparation cancelled');
      }

      // Step 2: Read image file (60% progress)
      onProgress?.(40);
      const imageBuffer = await this.readFileAsBuffer(pair.image);
      
      if (abortController.signal.aborted) {
        throw new Error('Preparation cancelled');
      }

      // Step 3: Get audio duration (80% progress)
      onProgress?.(70);
      const audioDuration = await this.getAudioDuration(pair.audio);
      
      if (abortController.signal.aborted) {
        throw new Error('Preparation cancelled');
      }

      // Step 4: Get image metadata (90% progress)
      onProgress?.(85);
      const imageMetadata = await this.getImageMetadata(pair.image);
      
      if (abortController.signal.aborted) {
        throw new Error('Preparation cancelled');
      }

      // Step 5: Prepare filenames
      onProgress?.(95);
      const sanitizedAudioName = this.sanitizeFilename(pair.audio.name);
      const sanitizedImageName = this.sanitizeFilename(pair.image.name);

      // Step 6: Process background if custom (optional)
      let backgroundBuffer = null;
      if (videoSettings?.background === 'custom' && videoSettings?.customBackground) {
        try {
          if (typeof videoSettings.customBackground === 'string') {
            // Base64 data
            const base64Data = videoSettings.customBackground.replace(/^data:image\/[a-z]+;base64,/, '');
            backgroundBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          } else {
            // File object
            backgroundBuffer = await this.readFileAsBuffer(videoSettings.customBackground);
          }
        } catch (error) {
          console.warn('Failed to prepare background, will use fallback:', error);
        }
      }

      const preparedData = {
        audioBuffer,
        imageBuffer,
        backgroundBuffer,
        audioDuration,
        imageMetadata,
        sanitizedAudioName,
        sanitizedImageName,
        audioFileName: pair.audio.name,
        imageFileName: pair.image.name,
        preparedAt: Date.now(),
        fileSignature: `${pair.audio.name}_${pair.audio.size}_${pair.image.name}_${pair.image.size}`
      };

      onProgress?.(100);
      console.log(`PreparationService: Successfully prepared pair ${pair.id}`);
      
      return preparedData;
    } catch (error) {
      console.error(`PreparationService: Error preparing pair ${pair.id}:`, error);
      throw error;
    } finally {
      this.abortControllers.delete(pair.id);
    }
  }

  /**
   * Prepare multiple pairs with concurrency control
   */
  async preparePairs(pairs, videoSettings, { onPairProgress, onPairComplete, onPairError }) {
    console.log(`PreparationService: Preparing ${pairs.length} pairs`);
    
    const results = [];
    const queue = [...pairs];

    const processPair = async (pair) => {
      this.activePreparations.add(pair.id);
      
      try {
        const preparedData = await this.preparePairData(
          pair,
          videoSettings,
          (progress) => onPairProgress?.(pair.id, progress)
        );
        
        onPairComplete?.(pair.id, preparedData);
        results.push({ pairId: pair.id, success: true, data: preparedData });
      } catch (error) {
        onPairError?.(pair.id, error);
        results.push({ pairId: pair.id, success: false, error });
      } finally {
        this.activePreparations.delete(pair.id);
      }
    };

    // Process pairs with concurrency limit using proper promise tracking
    const activePromises = new Map();
    
    while (queue.length > 0 || activePromises.size > 0) {
      // Start new preparations up to the concurrency limit
      while (queue.length > 0 && activePromises.size < CONFIG.MAX_CONCURRENT_PREPARATIONS) {
        const pair = queue.shift();
        const promise = processPair(pair)
          .finally(() => activePromises.delete(pair.id));
        activePromises.set(pair.id, promise);
      }

      // Wait for at least one to complete if we have active promises
      if (activePromises.size > 0) {
        await Promise.race(activePromises.values());
      }
    }

    console.log(`PreparationService: Completed preparation of ${results.length} pairs`);
    return results;
  }

  /**
   * Cancel preparation for a specific pair
   */
  cancelPreparation(pairId) {
    const abortController = this.abortControllers.get(pairId);
    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(pairId);
    }
    this.activePreparations.delete(pairId);
  }

  /**
   * Cancel all active preparations
   */
  cancelAll() {
    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();
    this.activePreparations.clear();
  }

  /**
   * Check if memory limit would be exceeded
   */
  wouldExceedMemoryLimit(currentMemoryUsage, newAssetSize) {
    return (currentMemoryUsage + newAssetSize) > CONFIG.MEMORY_LIMIT;
  }

  /**
   * Get configuration
   */
  getConfig() {
    return { ...CONFIG };
  }
}

// Export singleton instance
export const preparationService = new PreparationService();
export default preparationService;
