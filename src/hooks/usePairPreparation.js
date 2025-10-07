import { useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import preparationService from '../services/PreparationService';

export const usePairPreparation = () => {
  const {
    pairs,
    videoSettings,
    setPairPreparationState,
    setPreparedAssets,
    getPreparationMemoryUsage,
    clearPreparedAssets,
    assignDisplayIndex,
    isPreparingPairs,
    setIsPreparingPairs
  } = useAppStore();

  const preparingRef = useRef(false);
  const lastPreparedSignatures = useRef(new Set());

  /**
   * Check if a pair needs preparation
   */
  const needsPreparation = useCallback((pair) => {
    if (!pair.audio || !pair.image) return false;
    
    const signature = `${pair.audio.name}_${pair.audio.size}_${pair.image.name}_${pair.image.size}`;
    return !lastPreparedSignatures.current.has(signature);
  }, []);

  /**
   * Prepare complete pairs automatically
   */
  const prepareCompletePairs = useCallback(async () => {
    if (preparingRef.current) {
      console.log('Preparation already in progress, skipping');
      return;
    }

    const completePairs = pairs.filter(p => p.audio && p.image);
    const pairsToPrep = completePairs.filter(needsPreparation);

    if (pairsToPrep.length === 0) {
      return;
    }

    console.log(`Starting preparation for ${pairsToPrep.length} pairs`);
    preparingRef.current = true;
    setIsPreparingPairs(true);

    // Assign display indices to new pairs
    pairsToPrep.forEach(pair => {
      assignDisplayIndex(pair.id);
    });

    // Set initial preparation state for all pairs
    pairsToPrep.forEach(pair => {
      setPairPreparationState(pair.id, {
        status: 'queued',
        progress: 0,
        error: null
      });
    });

    try {
      await preparationService.preparePairs(
        pairsToPrep,
        videoSettings,
        {
          onPairProgress: (pairId, progress) => {
            setPairPreparationState(pairId, {
              status: 'preparing',
              progress,
              error: null
            });
          },
          onPairComplete: (pairId, preparedData) => {
            const memoryUsage = getPreparationMemoryUsage();
            const assetSize = preparedData.audioBuffer.byteLength + preparedData.imageBuffer.byteLength;

            // Check memory limit
            if (preparationService.wouldExceedMemoryLimit(memoryUsage, assetSize)) {
              console.warn(`Memory limit would be exceeded for pair ${pairId}, skipping cache`);
              setPairPreparationState(pairId, {
                status: 'skipped',
                progress: 100,
                error: 'Memory limit reached'
              });
              return;
            }

            setPreparedAssets(pairId, preparedData);
            setPairPreparationState(pairId, {
              status: 'ready',
              progress: 100,
              error: null
            });

            // Mark as prepared
            lastPreparedSignatures.current.add(preparedData.fileSignature);
            
            console.log(`Pair ${pairId} prepared successfully`);
          },
          onPairError: (pairId, error) => {
            setPairPreparationState(pairId, {
              status: 'failed',
              progress: 0,
              error: error.message
            });
            console.error(`Failed to prepare pair ${pairId}:`, error);
          }
        }
      );
    } catch (error) {
      console.error('Preparation error:', error);
    } finally {
      preparingRef.current = false;
      setIsPreparingPairs(false);
    }
  }, [pairs, videoSettings, needsPreparation, setPairPreparationState, setPreparedAssets, getPreparationMemoryUsage, assignDisplayIndex, setIsPreparingPairs]);

  /**
   * Retry preparation for a specific pair
   */
  const retryPreparation = useCallback(async (pairId) => {
    const pair = pairs.find(p => p.id === pairId);
    if (!pair || !pair.audio || !pair.image) return;

    console.log(`Retrying preparation for pair ${pairId}`);
    
    setPairPreparationState(pairId, {
      status: 'queued',
      progress: 0,
      error: null
    });

    try {
      const preparedData = await preparationService.preparePairData(
        pair,
        videoSettings,
        (progress) => {
          setPairPreparationState(pairId, {
            status: 'preparing',
            progress,
            error: null
          });
        }
      );

      setPreparedAssets(pairId, preparedData);
      setPairPreparationState(pairId, {
        status: 'ready',
        progress: 100,
        error: null
      });

      lastPreparedSignatures.current.add(preparedData.fileSignature);
    } catch (error) {
      setPairPreparationState(pairId, {
        status: 'failed',
        progress: 0,
        error: error.message
      });
      console.error(`Retry failed for pair ${pairId}:`, error);
    }
  }, [pairs, videoSettings, setPairPreparationState, setPreparedAssets]);

  /**
   * Cancel preparation for a specific pair
   */
  const cancelPreparation = useCallback((pairId) => {
    preparationService.cancelPreparation(pairId);
    setPairPreparationState(pairId, {
      status: 'idle',
      progress: 0,
      error: 'Cancelled'
    });
  }, [setPairPreparationState]);

  /**
   * Clear all prepared data
   */
  const clearAllPreparations = useCallback(() => {
    preparationService.cancelAll();
    lastPreparedSignatures.current.clear();
    preparingRef.current = false;
  }, []);

  // Auto-prepare when pairs are added or modified
  useEffect(() => {
    const completePairs = pairs.filter(p => p.audio && p.image);
    const pairsToPrep = completePairs.filter(needsPreparation);
    
    if (pairsToPrep.length > 0 && !isPreparingPairs) {
      // Debounce preparation to avoid rapid re-triggers
      const timer = setTimeout(() => {
        prepareCompletePairs();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [pairs, prepareCompletePairs, needsPreparation, isPreparingPairs]);

  return {
    prepareCompletePairs,
    retryPreparation,
    cancelPreparation,
    clearAllPreparations,
    isPreparingPairs
  };
};
