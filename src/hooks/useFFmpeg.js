import { useState, useCallback } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { useAppStore } from '../store/appStore';
import { useAuth } from '../context/AuthContext';
import {
  processVideoWithFFmpeg,
  processVideoWithFFmpegInstance,
  forceStopAllProcesses,
  getAudioDuration,
} from '../utils/ffmpegProcessor';
import { getPool } from '../utils/ffmpegPool';

export const useFFmpeg = () => {
  const DEBUG = false;
  const [progress, setProgress] = useState(0);
  const { user } = useAuth();
  const {
    setIsGenerating,
    addGeneratedVideo,
    clearGeneratedVideos,
    setVideoGenerationState,
    resetCancellation,
    getPreparedAssets,
    clearPreparedAssets,
  } = useAppStore();

  // Sequential processing (maxConcurrent = 1) is the proven-stable approach.
  // Pool/concurrent mode kept for Pro/Unlimited but can be disabled if issues arise.
  const maxConcurrent = (() => {
    const role = user?.role;
    if (role === 'unlimited' || role === 'admin') return 3;
    if (role === 'pro') return 2;
    return 1;
  })();

  // ── Helper: build video settings from store ─────────────────────────────────
  const getVideoSettings = () => {
    const s = useAppStore.getState();
    return {
      background:       s.videoSettings?.background       ?? 'black',
      customBackground: s.videoSettings?.customBackground ?? null,
      quality:          s.videoSettings?.quality          ?? 'fullhd',
    };
  };

  // ── Helper: process one pair (sequential mode) ──────────────────────────────
  const processPairAsync = async (pair) => {
    if (useAppStore.getState().isCancelling) return null;

    const store = useAppStore.getState();
    const existing = store.generatedVideos.find(v => v.pairId === pair.id);
    if (existing) return existing;

    setVideoGenerationState(pair.id, {
      isGenerating: true, progress: 0, isComplete: false,
      video: null, error: null, startTime: Date.now(), lastUpdate: Date.now(),
    });

    const videoSettings  = getVideoSettings();
    const preparedAssets = getPreparedAssets(pair.id);

    let videoData;
    try {
      videoData = await processVideoWithFFmpeg(
        pair.id,
        pair.audio,
        pair.image,
        (pct) => {
          const st = useAppStore.getState().videoGenerationStates[pair.id];
          if (!st?.isGenerating) return;
          setVideoGenerationState(pair.id, {
            isGenerating: true,
            progress: Math.min(Math.max(Math.floor(pct), 0), 100),
            isComplete: false, video: null, lastUpdate: Date.now(),
          });
        },
        () => useAppStore.getState().isCancelling,
        videoSettings,
        preparedAssets,
      );
      if (preparedAssets) clearPreparedAssets(pair.id);
    } catch (err) {
      if (preparedAssets) clearPreparedAssets(pair.id);
      if (err.message?.includes('timeout')) forceStopAllProcesses();
      setVideoGenerationState(pair.id, {
        isGenerating: false, progress: 0, isComplete: false,
        video: null, error: err.message || 'Video generation failed',
      });
      throw err;
    }

    if (useAppStore.getState().isCancelling) return null;

    if (!videoData || videoData.length === 0) {
      const msg = 'Invalid video data received from FFmpeg';
      setVideoGenerationState(pair.id, {
        isGenerating: false, progress: 0, isComplete: false, video: null, error: msg,
      });
      throw new Error(msg);
    }

    const blob = new Blob([videoData], { type: 'video/mp4' });
    const url  = URL.createObjectURL(blob);
    const audioName = pair.audio.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const imageName = pair.image.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');

    const video = {
      id: crypto.randomUUID(),
      pairId: pair.id,
      url,
      blob,
      filename: `video_${audioName}_${imageName}.mp4`,
      createdAt: new Date(),
      size: videoData.length,
    };

    setVideoGenerationState(pair.id, {
      isGenerating: false, progress: 100, isComplete: true, video, error: null,
    });
    addGeneratedVideo(video);
    return video;
  };

  // ── Main generate function ──────────────────────────────────────────────────
  const generateVideos = useCallback(async (pairs) => {
    if (!pairs?.length) throw new Error('No pairs provided for video generation');

    const invalid = pairs.filter(p => !p.audio || !p.image);
    if (invalid.length > 0) throw new Error('All pairs must have both audio and image files');

    const { clearStuckGenerationStates, ensureAutoNavigation } = useAppStore.getState();
    clearStuckGenerationStates();

    try {
      setIsGenerating(true);
      useAppStore.getState().setIsGenerating(true);
      resetCancellation();
      setProgress(0);
      ensureAutoNavigation();

      let completedCount = 0;

      // Initialise all pair states to queued
      pairs.forEach((pair, i) => {
        setVideoGenerationState(pair.id, {
          isGenerating: false, progress: 0, isComplete: false,
          video: null, error: null, queuePosition: i, isInQueue: true,
        });
      });

      const tickProgress = () => {
        completedCount++;
        setProgress(Math.floor((completedCount / pairs.length) * 100));
        if (completedCount % 10 === 0 && typeof window !== 'undefined' && window.gc) {
          try { window.gc(); } catch (_) {}
        }
      };

      if (maxConcurrent === 1) {
        // ── SEQUENTIAL PATH ──────────────────────────────────────────────────
        // Prefetch next 2 pairs while the current one encodes
        const prefetch = async (pairsToFetch) => {
          const { setPreparedAssets, getPreparedAssets: getPA } = useAppStore.getState();
          await Promise.allSettled(pairsToFetch.map(async (pair) => {
            if (getPA(pair.id)) return;
            try {
              const [aData, iData] = await Promise.all([fetchFile(pair.audio), fetchFile(pair.image)]);
              const dur = await getAudioDuration(pair.audio);
              setPreparedAssets(pair.id, {
                audioBuffer: new Uint8Array(aData),
                imageBuffer: new Uint8Array(iData),
                audioDuration: dur,
              });
            } catch (e) { console.warn(`Prefetch failed for ${pair.id}:`, e.message); }
          }));
        };

        // Start prefetching first two pairs immediately
        if (pairs[0]) prefetch([pairs[0]]);
        if (pairs[1]) prefetch([pairs[1]]);

        for (let i = 0; i < pairs.length; i++) {
          if (useAppStore.getState().isCancelling) { forceStopAllProcesses(); break; }

          const pair = pairs[i];
          // Prefetch 2 ahead
          if (pairs[i + 2]) prefetch([pairs[i + 2]]);

          try {
            const existing = useAppStore.getState().generatedVideos.find(v => v.pairId === pair.id);
            if (existing) {
              setVideoGenerationState(pair.id, {
                isGenerating: false, progress: 100, isComplete: true, video: existing, error: null,
              });
            } else {
              setVideoGenerationState(pair.id, {
                isGenerating: true, progress: 0, isComplete: false, video: null, error: null,
                queuePosition: i, isCurrentlyProcessing: true, startTime: Date.now(), lastUpdate: Date.now(),
              });
              await processPairAsync(pair);
            }
          } catch (err) {
            setVideoGenerationState(pair.id, {
              isGenerating: false, progress: 0, isComplete: false,
              video: null, error: err.message || 'Video generation failed', isCurrentlyProcessing: false,
            });
          }

          tickProgress();
          if (i < pairs.length - 1 && !useAppStore.getState().isCancelling) {
            await new Promise(r => setTimeout(r, 50));
          }
        }

      } else {
        // ── CONCURRENT POOL PATH (Pro = 2, Unlimited/Admin = 3) ──────────────
        const pool = getPool(maxConcurrent);

        await Promise.allSettled(pairs.map(async (pair, idx) => {
          if (useAppStore.getState().isCancelling) return;

          const slot = await pool.acquire();
          try {
            if (useAppStore.getState().isCancelling) return;

            const existing = useAppStore.getState().generatedVideos.find(v => v.pairId === pair.id);
            if (existing) {
              setVideoGenerationState(pair.id, {
                isGenerating: false, progress: 100, isComplete: true, video: existing, error: null,
              });
              tickProgress();
              return;
            }

            setVideoGenerationState(pair.id, {
              isGenerating: true, progress: 0, isComplete: false, video: null, error: null,
              queuePosition: idx, isCurrentlyProcessing: true,
              startTime: Date.now(), lastUpdate: Date.now(),
            });

            const videoSettings  = getVideoSettings();
            const preparedAssets = getPreparedAssets(pair.id);

            const videoData = await processVideoWithFFmpegInstance(
              slot.inst,
              pair.id,
              pair.audio,
              pair.image,
              (pct) => {
                const st = useAppStore.getState().videoGenerationStates[pair.id];
                if (!st?.isGenerating) return;
                setVideoGenerationState(pair.id, {
                  isGenerating: true,
                  progress: Math.floor(pct),
                  isComplete: false, video: null, lastUpdate: Date.now(),
                });
              },
              () => useAppStore.getState().isCancelling,
              videoSettings,
              preparedAssets,
            );

            if (preparedAssets) clearPreparedAssets(pair.id);

            if (videoData) {
              const blob = new Blob([videoData], { type: 'video/mp4' });
              const url  = URL.createObjectURL(blob);
              const vo = {
                pairId: pair.id, url, blob,
                audioName: pair.audio?.name,
                imageName: pair.image?.name,
                timestamp: Date.now(),
              };
              addGeneratedVideo(vo);
              setVideoGenerationState(pair.id, {
                isGenerating: false, progress: 100, isComplete: true,
                video: vo, error: null, isCurrentlyProcessing: false, isFinished: true,
              });
            }
            tickProgress();

          } catch (err) {
            tickProgress();
            setVideoGenerationState(pair.id, {
              isGenerating: false, progress: 0, isComplete: false,
              video: null, error: err.message || 'Video generation failed', isCurrentlyProcessing: false,
            });
          } finally {
            pool.release(slot);
          }
        }));
      }

      // ── Post-generation cleanup ──────────────────────────────────────────
      if (useAppStore.getState().isCancelling) {
        setIsGenerating(false);
        setProgress(0);
        pairs.forEach(p => setVideoGenerationState(p.id, {
          isGenerating: false, progress: 0, isComplete: false, video: null, error: null,
        }));
        return;
      }

      setProgress(100);
      await new Promise(r => setTimeout(r, 300));

      // Finalise states
      const { generatedVideos, videoGenerationStates } = useAppStore.getState();
      pairs.forEach((pair) => {
        const vid = generatedVideos.find(v => v.pairId === pair.id);
        const st  = videoGenerationStates[pair.id];
        if (vid) {
          setVideoGenerationState(pair.id, {
            isGenerating: false, progress: 100, isComplete: true, video: vid, error: null,
          });
        } else if (!st?.error && !(st?.isComplete && st?.video)) {
          setVideoGenerationState(pair.id, {
            isGenerating: false, progress: 0, isComplete: false, video: null,
            error: 'Video generation failed',
          });
        }
      });

      setIsGenerating(false);
      useAppStore.getState().setIsGenerating(false);
      DEBUG && console.log('All videos generated');

    } catch (err) {
      console.error('generateVideos error:', err);
      forceStopAllProcesses();
      const { resetGenerationState } = useAppStore.getState();
      resetGenerationState();
      setProgress(0);
      if (!useAppStore.getState().isCancelling) {
        console.warn(`Video generation failed: ${err.message || 'Unknown error'}`);
      }
      setTimeout(() => resetCancellation(), 1000);
    }
  }, [
    setIsGenerating, addGeneratedVideo, clearGeneratedVideos,
    setVideoGenerationState, resetCancellation,
    getPreparedAssets, clearPreparedAssets,
  ]);

  const stopGeneration = useCallback(async () => {
    const { cancelGeneration } = useAppStore.getState();
    if (cancelGeneration) cancelGeneration();
    await forceStopAllProcesses();
    setProgress(0);
  }, []);

  // For components that need to reset between generations
  const resetAppForNewGeneration = useCallback(() => {
    const { resetGenerationState } = useAppStore.getState();
    if (resetGenerationState) resetGenerationState();
    setProgress(0);
  }, []);

  return { generateVideos, stopGeneration, resetAppForNewGeneration, progress };
};
