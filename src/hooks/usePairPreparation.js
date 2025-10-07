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
    getPreparedAssets,
    clearPreparedAssets,
    assignDisplayIndex,
    isPreparingPairs,
    setIsPreparingPairs,
    preparedAssets
  } = useAppStore();

  const preparingRef = useRef(false);
  const lastPreparedSignatures = useRef(new Set());
  const previousPreparedAssets = useRef({});

  /**
   * Check if a pair needs preparation
   */
  const needsPreparation = useCallback((pair) => {
    if (!pair.audio || !pair.image) return false;
    
    const signature = `${pair.audio.name}_${pair.audio.size}_${pair.image.name}_${pair.image.size}`;
    
    // Check if signature is not in cache OR if prepared assets don't actually exist in store
    // This ensures we re-prepare even if we have the signature but assets were cleared
    const hasSignature = lastPreparedSignatures.current.has(signature);
    const assetsExist = getPreparedAssets(pair.id) !== null;
    
    // Need preparation if: no signature OR signature exists but assets are gone
    return !hasSignature || !assetsExist;
  }, [getPreparedAssets]);

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

  // Monitor preparedAssets changes to detect when assets are cleared, replaced, or modified
  useEffect(() => {
    const prevAssets = previousPreparedAssets.current;
    const currentAssets = preparedAssets || {};
    
    // Check for removed, nullified, or changed assets at the INDIVIDUAL PAIR level
    Object.keys(prevAssets).forEach(pairId => {
      const prevAsset = prevAssets[pairId];
      const currentAsset = currentAssets[pairId];
      
      // Case 1: Asset was deleted (not in current)
      if (!currentAsset) {
        if (prevAsset?.fileSignature) {
          console.log(`Asset cleared for pair ${pairId}, removing signature:`, prevAsset.fileSignature);
          lastPreparedSignatures.current.delete(prevAsset.fileSignature);
        }
      }
      // Case 2: Asset became null/undefined (even though key exists)
      else if (currentAsset === null || currentAsset === undefined) {
        if (prevAsset?.fileSignature) {
          console.log(`Asset became null for pair ${pairId}, removing signature:`, prevAsset.fileSignature);
          lastPreparedSignatures.current.delete(prevAsset.fileSignature);
        }
      }
      // Case 3: Asset was replaced (different fileSignature)
      else if (prevAsset?.fileSignature && currentAsset?.fileSignature && 
               prevAsset.fileSignature !== currentAsset.fileSignature) {
        console.log(`Asset replaced for pair ${pairId}, old signature: ${prevAsset.fileSignature}, new signature: ${currentAsset.fileSignature}`);
        lastPreparedSignatures.current.delete(prevAsset.fileSignature);
        // Note: new signature is added by onPairComplete when preparation finishes
      }
    });
    
    // Update previous assets reference (shallow copy to ensure clean comparison on next run)
    previousPreparedAssets.current = { ...currentAssets };
  }, [preparedAssets]);

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
