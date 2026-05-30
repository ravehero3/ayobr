import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { logFFmpeg, updateFFmpegStatus } from './ffmpegLogger';
import { ensureFFmpegClass } from './ffmpegLoader';

const DEBUG = false;
let ffmpeg = null;
let isLoaded = false;
let isInitializing = false;
let initPromise = null;
let activeProcesses = new Set();
let isForceStopped = false;
let currentProcessingPairId = null;
let processingSessionCounter = 0;
let cleanupCompletionPromise = Promise.resolve();
let cleanupCompletionResolver = null;
let currentProgressToken = null;

// ─── Caches ───────────────────────────────────────────────────────────────────
const fileCache = new Map();
const maxCacheSize = 50;
const processedImageCache = new Map();
const audioBufferCache = new Map();
const audioDurationCache = new Map();
const memoryCache = new Map();
let processedCount = 0;

// ─── Memory cleanup ──────────────────────────────────────────────────────────
const cleanupMemory = () => {
  processedCount++;
  if (memoryCache.size > 20) {
    Array.from(memoryCache.keys()).slice(0, memoryCache.size - 10).forEach(k => memoryCache.delete(k));
  }
  if (fileCache.size > 10) {
    Array.from(fileCache.keys()).slice(0, fileCache.size - 5).forEach(k => fileCache.delete(k));
  }
  if (audioBufferCache.size > 5) audioBufferCache.clear();
  if (processedImageCache.size > 5) processedImageCache.clear();
  if (typeof window !== 'undefined' && window.gc) {
    try { window.gc(); } catch (_) {}
  }
};

// ─── Force stop ──────────────────────────────────────────────────────────────
export const forceStopAllProcesses = async () => {
  DEBUG && console.log('Force stopping all FFmpeg processes...');
  isForceStopped = true;

  if (cleanupCompletionResolver) {
    cleanupCompletionResolver();
    cleanupCompletionResolver = null;
  }

  if (ffmpeg) {
    try {
      ffmpeg.off('progress');
      ffmpeg.off('log');

      try {
        const files = await ffmpeg.listDir('/');
        const tempFiles = files.filter(f =>
          !f.isDir && (f.name.startsWith('logo_') || f.name.startsWith('audio_') ||
            f.name.startsWith('image_') || f.name.startsWith('output_') || f.name.startsWith('bg_'))
        );
        for (const f of tempFiles) {
          try { await ffmpeg.deleteFile(f.name); } catch (_) {}
        }
      } catch (_) {}

      if (isLoaded) {
        await ffmpeg.terminate();
        await new Promise(r => setTimeout(r, 500));
      }
    } catch (err) {
      console.error('Error terminating FFmpeg:', err);
    }
  }

  ffmpeg = null;
  isLoaded = false;
  isInitializing = false;
  initPromise = null;
  activeProcesses.clear();
  currentProgressToken = null;
  fileCache.clear();
  processedImageCache.clear();
  audioBufferCache.clear();
  audioDurationCache.clear();
  memoryCache.clear();
  processedCount = 0;
  isForceStopped = false;

  updateFFmpegStatus({ initialized: false, initializing: false, activeProcesses: 0 });
  logFFmpeg('info', 'FFmpeg: stopped and cleared');
};

// ─── Restart ─────────────────────────────────────────────────────────────────
export const restartFFmpeg = async () => {
  await forceStopAllProcesses();
  await new Promise(r => setTimeout(r, 500));
  return initializeFFmpeg();
};

export const getBatchProgress = () => ({
  processed: processedCount,
  active: activeProcesses.size,
  cached: memoryCache.size,
});

// ─── Initialize ──────────────────────────────────────────────────────────────
export const initializeFFmpeg = async () => {
  if (isForceStopped) {
    isForceStopped = false;
    isLoaded = false;
    ffmpeg = null;
    initPromise = null;
  }

  if (isLoaded && ffmpeg) {
    try {
      const files = await ffmpeg.listDir('/');
      // Clean any stuck temp files
      const stuck = files.filter(f =>
        !f.isDir && (f.name.startsWith('audio_') || f.name.startsWith('image_') || f.name.startsWith('output_'))
      );
      for (const f of stuck) {
        try { await ffmpeg.deleteFile(f.name); } catch (_) {}
      }
      return ffmpeg;
    } catch (_) {
      isLoaded = false;
      ffmpeg = null;
      initPromise = null;
    }
  }

  if (isInitializing && initPromise) return initPromise;

  isInitializing = true;
  updateFFmpegStatus({ initializing: true, initialized: false, lastError: null });
  logFFmpeg('info', 'FFmpeg: loading core…');

  initPromise = (async () => {
    try {
      const FFmpegClass = await ensureFFmpegClass();
      ffmpeg = new FFmpegClass();

      // Try local copy first (fastest, avoids CDN round-trip)
      // Then fall back to CDN
      const LOCAL_BASE = `${typeof window !== 'undefined' ? window.location.origin : ''}/`;
      const CDN_BASE   = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm/';

      // Race ffmpeg.load() against a timeout so a hanging worker never blocks forever.
      // The internal @ffmpeg/ffmpeg worker can silently fail to initialise when bundled
      // with webpack (import.meta.url resolution issue), causing load() to never resolve.
      const loadWithTimeout = (opts, ms, label) => Promise.race([
        opts ? ffmpeg.load(opts) : ffmpeg.load(),
        new Promise((_, rej) =>
          setTimeout(() => rej(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
        ),
      ]);

      // Preflight: verify local WASM file actually exists before bothering to download it
      const localWasmOk = await fetch(`${LOCAL_BASE}ffmpeg-core.wasm`, { method: 'HEAD' })
        .then(r => r.ok).catch(() => false);

      let loaded = false;

      // Attempt 1: local files served from dist/
      if (localWasmOk) {
        try {
          logFFmpeg('info', 'FFmpeg: trying local files…');
          const [coreURL, wasmURL, workerURL] = await Promise.all([
            toBlobURL(`${LOCAL_BASE}ffmpeg-core.js`,        'text/javascript'),
            toBlobURL(`${LOCAL_BASE}ffmpeg-core.wasm`,      'application/wasm'),
            toBlobURL(`${LOCAL_BASE}ffmpeg-core.worker.js`, 'text/javascript').catch(() => null),
          ]);
          const loadOpts = { coreURL, wasmURL };
          if (workerURL) loadOpts.workerURL = workerURL;
          await loadWithTimeout(loadOpts, 30000, 'local load');
          logFFmpeg('info', 'FFmpeg: loaded from local files ✓');
          loaded = true;
        } catch (localErr) {
          logFFmpeg('warn', `FFmpeg: local load failed (${localErr?.message || localErr}) — trying CDN…`);
        }
      } else {
        logFFmpeg('warn', 'FFmpeg: local WASM not found — skipping to CDN…');
      }

      // Attempt 2: CDN via toBlobURL
      if (!loaded) {
        try {
          logFFmpeg('info', `FFmpeg: fetching from CDN (${CDN_BASE})…`);
          const [coreURL, wasmURL, workerURL] = await Promise.all([
            toBlobURL(`${CDN_BASE}ffmpeg-core.js`,        'text/javascript'),
            toBlobURL(`${CDN_BASE}ffmpeg-core.wasm`,      'application/wasm'),
            toBlobURL(`${CDN_BASE}ffmpeg-core.worker.js`, 'text/javascript').catch(() => null),
          ]);
          const loadOpts = { coreURL, wasmURL };
          if (workerURL) loadOpts.workerURL = workerURL;
          await loadWithTimeout(loadOpts, 60000, 'CDN load');
          logFFmpeg('info', 'FFmpeg: loaded from CDN ✓');
          loaded = true;
        } catch (cdnErr) {
          logFFmpeg('error', `FFmpeg: CDN load failed (${cdnErr?.message || cdnErr})`);
        }
      }

      // Attempt 3: bare load() — last resort
      if (!loaded) {
        logFFmpeg('info', 'FFmpeg: trying bare load()…');
        await loadWithTimeout(null, 30000, 'bare load');
        logFFmpeg('info', 'FFmpeg: bare load succeeded ✓');
        loaded = true;
      }

      // Wire log event AFTER successful load
      ffmpeg.on('log', ({ type, message }) => {
        logFFmpeg(type === 'stderr' ? 'ffmpeg' : 'info', message);
      });

      await ffmpeg.listDir('/');
      isLoaded = true;
      isForceStopped = false;
      updateFFmpegStatus({
        initialized: true,
        initializing: false,
        lastInitTime: new Date().toISOString(),
        lastError: null,
      });
      logFFmpeg('info', `FFmpeg ready ✓  (threads: ${typeof SharedArrayBuffer !== 'undefined'})`);
      return ffmpeg;

    } catch (err) {
      console.error('FFmpeg init failed:', err);
      logFFmpeg('error', `FFmpeg init failed: ${err?.message || err}`);
      updateFFmpegStatus({ initialized: false, initializing: false, lastError: err?.message || String(err) });
      isLoaded = false;
      isForceStopped = false;
      ffmpeg = null;
      initPromise = null;
      throw err;
    } finally {
      isInitializing = false;
    }
  })();

  return initPromise;
};

// ─── Build FFmpeg args ────────────────────────────────────────────────────────
function buildArgs(imageFileName, audioFileName, outputFileName, audioDuration, videoSettings) {
  const quality = videoSettings?.quality ?? 'fullhd';
  const bg      = videoSettings?.background ?? 'black';

  let RW = 1920, RH = 1080;
  if (quality === '4k') { RW = 3840; RH = 2160; }
  else if (quality === 'hd') { RW = 1280; RH = 720; }

  const backgroundColor = bg === 'white' ? 'white' : 'black';
  const videoFilter = `scale=${RW}:${RH}:force_original_aspect_ratio=decrease,pad=${RW}:${RH}:(ow-iw)/2:(oh-ih)/2:${backgroundColor}`;

  // 4K needs single-thread to stay within WASM memory limits
  const threadCount = quality === '4k' ? '1' : '4';

  return [
    '-loop', '1',
    '-i', imageFileName,
    '-i', audioFileName,
    '-vf', videoFilter,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-tune', 'zerolatency',
    '-crf', '28',
    '-pix_fmt', 'yuv420p',
    '-r', '5',
    '-g', '60', '-keyint_min', '60',
    '-c:a', 'aac',
    '-b:a', '320k',
    '-ar', '48000',
    '-ac', '2',
    '-threads', threadCount,
    '-shortest',
    '-t', String(Math.max(0.1, audioDuration)),
    '-y',
    outputFileName,
  ];
}

// ─── Build args with custom background ───────────────────────────────────────
function buildArgsWithCustomBg(imageFileName, audioFileName, bgFileName, outputFileName, audioDuration, videoSettings) {
  const quality = videoSettings?.quality ?? 'fullhd';
  let RW = 1920, RH = 1080;
  if (quality === '4k') { RW = 3840; RH = 2160; }
  else if (quality === 'hd') { RW = 1280; RH = 720; }

  const videoFilter =
    `[2:v]scale=${RW}:${RH}:force_original_aspect_ratio=increase,crop=${RW}:${RH}[bg];` +
    `[0:v]scale=${RW}:${RH}:force_original_aspect_ratio=decrease[img];` +
    `[bg][img]overlay=(W-w)/2:(H-h)/2`;

  const threadCount = quality === '4k' ? '1' : '4';

  return [
    '-loop', '1',
    '-i', imageFileName,
    '-i', audioFileName,
    '-i', bgFileName,
    '-vf', videoFilter,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-tune', 'zerolatency',
    '-crf', '28',
    '-pix_fmt', 'yuv420p',
    '-r', '5',
    '-g', '60', '-keyint_min', '60',
    '-c:a', 'aac',
    '-b:a', '320k',
    '-ar', '48000',
    '-ac', '2',
    '-threads', threadCount,
    '-shortest',
    '-t', String(Math.max(0.1, audioDuration)),
    '-y',
    outputFileName,
  ];
}

// ─── Audio duration ───────────────────────────────────────────────────────────
export const getAudioDuration = (audioFile) => {
  const key = `${audioFile.name}_${audioFile.size}_${audioFile.lastModified}`;
  if (audioDurationCache.has(key)) return Promise.resolve(audioDurationCache.get(key));

  return new Promise((resolve) => {
    const audio = new Audio();
    let url = null;
    const done = (dur) => {
      clearTimeout(timer);
      if (url) URL.revokeObjectURL(url);
      audioDurationCache.set(key, dur);
      resolve(dur);
    };
    const timer = setTimeout(() => {
      console.warn('getAudioDuration timeout → defaulting to 180s');
      done(180);
    }, 5000);
    audio.onloadedmetadata = () => done(audio.duration || 180);
    audio.onerror = () => done(180);
    url = URL.createObjectURL(audioFile);
    audio.src = url;
  });
};

// ─── File cache helper ────────────────────────────────────────────────────────
const getCachedFile = async (file, label) => {
  const key = `${file.name}_${file.size}_${file.lastModified}`;
  if (fileCache.has(key)) return new Uint8Array(fileCache.get(key));
  const data = await fetchFile(file);
  if (!data || data.length === 0) throw new Error(`${label} file is empty: ${file.name}`);
  if (fileCache.size >= maxCacheSize) fileCache.delete(fileCache.keys().next().value);
  fileCache.set(key, data);
  return new Uint8Array(data);
};

// ─── Main processor (sequential, singleton FFmpeg) ────────────────────────────
export const processVideoWithFFmpeg = async (
  pairId, audioFile, imageFile, onProgress, shouldCancel,
  videoSettings = null, preparedAssets = null
) => {
  if (!preparedAssets) {
    if (!audioFile?.name) throw new Error('Invalid audio file');
    if (!imageFile?.name) throw new Error('Invalid image file');
    if (audioFile.size === 0) throw new Error(`Audio file is empty: ${audioFile.name}`);
    if (imageFile.size === 0) throw new Error(`Image file is empty: ${imageFile.name}`);
  }

  const timestamp   = Date.now();
  const audioFileName  = `audio_${pairId}_${timestamp}.mp3`;
  const imageFileName  = `image_${pairId}_${timestamp}.jpg`;
  const outputFileName = `output_${pairId}_${timestamp}.mp4`;
  let bgFileName    = null;
  let progressHandler = null;
  let hasCompleted  = false;
  let data;

  try {
    if (onProgress) onProgress(5);
    const ffmpegInst = await initializeFFmpeg();
    if (onProgress) onProgress(15);

    // Wait for previous job's cleanup to complete (prevent FS race conditions)
    await cleanupCompletionPromise;

    let resolveCleanup;
    cleanupCompletionPromise = new Promise(r => { resolveCleanup = r; });
    cleanupCompletionResolver = resolveCleanup;

    processingSessionCounter++;
    const sessionId = processingSessionCounter;
    currentProgressToken = null;
    const token = crypto.randomUUID();
    currentProgressToken = token;
    currentProcessingPairId = pairId;

    // Audio duration — must be hoisted above the progress handler so the closure
    // has a valid value when FFmpeg first fires progress events.
    // Use preparedAssets if available (synchronous); otherwise default to 180 and
    // refine it after reading the file below.
    let audioDuration = preparedAssets?.audioDuration || 180;

    // Progress handler
    let lastPT = 0;
    let isNearComplete = false;
    progressHandler = ({ progress, time }) => {
      if (token !== currentProgressToken) return;
      if (pairId !== currentProcessingPairId || sessionId !== processingSessionCounter) return;
      const now = Date.now();
      if (!onProgress || hasCompleted || now - lastPT < 100) return;
      let pct = progress;
      if ((!pct || isNaN(pct)) && time !== undefined) {
        pct = (time / 1000000) / (audioDuration || 180);
      }
      const norm = Math.min(Math.max((pct || 0) * 100, 0), 100);
      if (norm >= 99) {
        if (!isNearComplete) { isNearComplete = true; onProgress(99); lastPT = now; }
      } else {
        onProgress(norm); lastPT = now;
      }
    };
    ffmpegInst.on('progress', progressHandler);

    // Read files
    let audioData, imageData;
    if (preparedAssets?.audioBuffer && preparedAssets?.imageBuffer) {
      audioData = preparedAssets.audioBuffer;
      imageData = preparedAssets.imageBuffer;
    } else {
      [audioData, imageData] = await Promise.all([
        getCachedFile(audioFile, 'audio'),
        getCachedFile(imageFile, 'image'),
      ]);
    }
    if (onProgress) onProgress(25);

    // Refine audio duration now that we have the file (if not already from preparedAssets)
    if (!preparedAssets?.audioDuration) {
      const resolved = await getAudioDuration(audioFile);
      if (resolved && !isNaN(resolved) && isFinite(resolved) && resolved > 0) {
        audioDuration = resolved;
      } else {
        console.warn('Invalid audio duration, defaulting to 180s');
        audioDuration = 180;
      }
    }
    if (onProgress) onProgress(30);

    // Write main files
    await Promise.all([
      ffmpegInst.writeFile(imageFileName, new Uint8Array(imageData)),
      ffmpegInst.writeFile(audioFileName, new Uint8Array(audioData)),
    ]);
    if (onProgress) onProgress(40);

    // Handle custom background
    let useCustomBg = false;
    if (videoSettings?.background === 'custom' && videoSettings?.customBackground) {
      try {
        bgFileName = `bg_${pairId}_${timestamp}.jpg`;
        const cbf = videoSettings.customBackground;
        let bgData;
        if (typeof cbf === 'string') {
          const b64 = cbf.replace(/^data:image\/[a-z]+;base64,/, '');
          bgData = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        } else {
          bgData = new Uint8Array(await fetchFile(cbf));
        }
        if (bgData.length > 0) {
          await ffmpegInst.writeFile(bgFileName, bgData);
          useCustomBg = true;
        } else {
          bgFileName = null;
        }
      } catch (err) {
        console.warn('Custom background failed, using black:', err.message);
        bgFileName = null;
      }
    }

    // Build FFmpeg args
    const args = useCustomBg
      ? buildArgsWithCustomBg(imageFileName, audioFileName, bgFileName, outputFileName, audioDuration, videoSettings)
      : buildArgs(imageFileName, audioFileName, outputFileName, audioDuration, videoSettings);

    const quality = videoSettings?.quality ?? 'fullhd';
    const dims = quality === '4k' ? '3840×2160' : quality === 'hd' ? '1280×720' : '1920×1080';
    logFFmpeg('info', `FFmpeg: encoding ${pairId} · ${quality} (${dims}) · ${audioDuration.toFixed(1)}s`);

    if (onProgress) onProgress(45);
    updateFFmpegStatus({ activeProcesses: activeProcesses.size + 1 });

    // Execute
    try {
      await Promise.race([
        ffmpegInst.exec(args),
        new Promise((_, rej) => setTimeout(() => rej(new Error('FFmpeg timeout after 15min')), 900000)),
      ]);
    } catch (execErr) {
      const msg = String(execErr?.message ?? execErr);
      const isWarning = /non monotonically|deprecated|warning|Past duration|monotonic dts/i.test(msg);
      if (!isWarning) {
        if (quality === '4k') {
          console.warn('[4K] Encode failed, resetting FFmpeg instance');
          isLoaded = false; ffmpeg = null; initPromise = null;
        }
        throw execErr;
      }
    }

    // Read output
    try {
      data = await ffmpegInst.readFile(outputFileName);
    } catch (_) {
      await new Promise(r => setTimeout(r, 300));
      data = await ffmpegInst.readFile(outputFileName);
    }

    if (!data || data.length < 1000) {
      throw new Error(`Output too small (${data?.length ?? 0} bytes)`);
    }

    if (onProgress && !hasCompleted) { onProgress(100); hasCompleted = true; }

    // Cleanup FS
    const toDelete = [audioFileName, imageFileName, outputFileName];
    if (bgFileName && useCustomBg) toDelete.push(bgFileName);
    await Promise.allSettled(toDelete.map(f => ffmpegInst.deleteFile(f).catch(() => {})));

    cleanupMemory();
    updateFFmpegStatus({ activeProcesses: Math.max(0, activeProcesses.size - 1) });
    logFFmpeg('info', `FFmpeg: done ${pairId} (${(data.length / 1024 / 1024).toFixed(1)} MB)`);

    return new Uint8Array(data);

  } catch (err) {
    console.error('FFmpeg processing error:', err);
    logFFmpeg('error', `FFmpeg error [${pairId}]: ${err?.message || err}`);
    updateFFmpegStatus({ activeProcesses: Math.max(0, activeProcesses.size - 1) });

    if (ffmpeg && isLoaded) {
      await Promise.allSettled([
        ffmpeg.deleteFile(audioFileName).catch(() => {}),
        ffmpeg.deleteFile(imageFileName).catch(() => {}),
        ffmpeg.deleteFile(outputFileName).catch(() => {}),
        bgFileName ? ffmpeg.deleteFile(bgFileName).catch(() => {}) : Promise.resolve(),
      ]);
      cleanupMemory();
    }

    if (shouldCancel?.()) {
      const e = new Error('Generation cancelled by user');
      e.isCancellation = true;
      if (cleanupCompletionResolver) { cleanupCompletionResolver(); cleanupCompletionResolver = null; }
      throw e;
    }
    throw err;

  } finally {
    if (ffmpeg && progressHandler) {
      try { ffmpeg.off('progress', progressHandler); } catch (_) {}
    }
    if (currentProcessingPairId === pairId) currentProcessingPairId = null;
    currentProgressToken = null;

    // Verify FS is clean
    if (ffmpeg && isLoaded) {
      try {
        const files = await ffmpeg.listDir('/');
        const leftovers = files.filter(f =>
          !f.isDir && (f.name.startsWith('audio_') || f.name.startsWith('image_') ||
            f.name.startsWith('output_') || f.name.startsWith('bg_'))
        );
        if (leftovers.length > 0) {
          await Promise.allSettled(leftovers.map(f => ffmpeg.deleteFile(f.name).catch(() => {})));
        }
      } catch (_) {}
    }

    if (typeof window !== 'undefined' && window.gc) {
      try { window.gc(); } catch (_) {}
    }

    if (cleanupCompletionResolver) {
      cleanupCompletionResolver();
      cleanupCompletionResolver = null;
    }
  }
};

// ─── Pool-mode processor (concurrent, each call gets its own FFmpeg instance) ─
export const processVideoWithFFmpegInstance = async (
  ffmpegInst, pairId, audioFile, imageFile,
  onProgress, shouldCancel, videoSettings = null, preparedAssets = null
) => {
  const timestamp      = Date.now();
  const audioFileName  = `audio_${pairId}_${timestamp}.mp3`;
  const imageFileName  = `image_${pairId}_${timestamp}.jpg`;
  const outputFileName = `output_${pairId}_${timestamp}.mp4`;
  let bgFileName       = null;
  let progressHandler  = null;
  let hasCompleted     = false;

  try {
    ffmpegInst.off('progress');

    let audioDuration = 180;
    progressHandler = ({ progress, time }) => {
      if (!onProgress || hasCompleted) return;
      let pct = progress;
      if ((!pct || isNaN(pct)) && time !== undefined) pct = (time / 1000000) / audioDuration;
      onProgress(Math.min(Math.max((pct || 0) * 100, 0), 99));
    };
    ffmpegInst.on('progress', progressHandler);

    // Read files
    let audioData, imageData;
    if (preparedAssets?.audioBuffer && preparedAssets?.imageBuffer) {
      audioData = preparedAssets.audioBuffer;
      imageData = preparedAssets.imageBuffer;
    } else {
      const [aRaw, iRaw] = await Promise.all([fetchFile(audioFile), fetchFile(imageFile)]);
      audioData = new Uint8Array(aRaw);
      imageData = new Uint8Array(iRaw);
    }

    audioDuration = preparedAssets?.audioDuration ?? await getAudioDuration(audioFile);
    if (!audioDuration || isNaN(audioDuration) || !isFinite(audioDuration) || audioDuration <= 0) {
      audioDuration = 180;
    }

    await Promise.all([
      ffmpegInst.writeFile(imageFileName, new Uint8Array(imageData)),
      ffmpegInst.writeFile(audioFileName, new Uint8Array(audioData)),
    ]);

    // Custom background
    let useCustomBg = false;
    if (videoSettings?.background === 'custom' && videoSettings?.customBackground) {
      try {
        bgFileName = `bg_${pairId}_${timestamp}.jpg`;
        const cbf = videoSettings.customBackground;
        let bgData;
        if (typeof cbf === 'string') {
          const b64 = cbf.replace(/^data:image\/[a-z]+;base64,/, '');
          bgData = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        } else {
          bgData = new Uint8Array(await fetchFile(cbf));
        }
        if (bgData.length > 0) {
          await ffmpegInst.writeFile(bgFileName, bgData);
          useCustomBg = true;
        } else {
          bgFileName = null;
        }
      } catch (_) { bgFileName = null; }
    }

    const args = useCustomBg
      ? buildArgsWithCustomBg(imageFileName, audioFileName, bgFileName, outputFileName, audioDuration, videoSettings)
      : buildArgs(imageFileName, audioFileName, outputFileName, audioDuration, videoSettings);

    logFFmpeg('info', `FFmpeg[pool]: encoding ${pairId} at ${videoSettings?.quality ?? 'fullhd'}`);

    try {
      await Promise.race([
        ffmpegInst.exec(args),
        new Promise((_, rej) => setTimeout(() => rej(new Error('FFmpeg timeout')), 900000)),
      ]);
    } catch (execErr) {
      const msg = String(execErr?.message ?? execErr);
      const isWarning = /non monotonically|deprecated|warning|Past duration|monotonic dts/i.test(msg);
      if (!isWarning) throw execErr;
    }

    let data;
    try {
      data = await ffmpegInst.readFile(outputFileName);
    } catch (_) {
      await new Promise(r => setTimeout(r, 300));
      data = await ffmpegInst.readFile(outputFileName);
    }

    if (!data || data.length < 1000) throw new Error(`Output too small (${data?.length ?? 0} bytes)`);

    if (onProgress && !hasCompleted) { onProgress(100); hasCompleted = true; }

    const toDelete = [audioFileName, imageFileName, outputFileName];
    if (bgFileName && useCustomBg) toDelete.push(bgFileName);
    await Promise.allSettled(toDelete.map(f => ffmpegInst.deleteFile(f).catch(() => {})));

    logFFmpeg('info', `FFmpeg[pool]: done ${pairId} (${(data.length / 1024 / 1024).toFixed(1)} MB)`);
    return new Uint8Array(data);

  } catch (err) {
    await Promise.allSettled([
      ffmpegInst.deleteFile(audioFileName).catch(() => {}),
      ffmpegInst.deleteFile(imageFileName).catch(() => {}),
      ffmpegInst.deleteFile(outputFileName).catch(() => {}),
      bgFileName ? ffmpegInst.deleteFile(bgFileName).catch(() => {}) : Promise.resolve(),
    ]);
    if (shouldCancel?.()) {
      const e = new Error('Generation cancelled by user');
      e.isCancellation = true;
      throw e;
    }
    throw err;

  } finally {
    hasCompleted = true;
    if (ffmpegInst && progressHandler) {
      try { ffmpegInst.off('progress', progressHandler); } catch (_) {}
    }
  }
};
