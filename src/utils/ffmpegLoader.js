import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

const CORE_VERSION = '0.12.10';
const FALLBACK_VERSION = '0.12.6';

const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms);
    }),
  ]);

/** Same-origin base for ffmpeg-core assets copied into dist/ at build time. */
export function getLocalCoreBase() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}`;
  }
  return '';
}

async function loadFromUrls(ffmpeg, coreURL, wasmURL) {
  await ffmpeg.load({ coreURL, wasmURL });
}

async function loadFromBase(ffmpeg, base) {
  const [coreURL, wasmURL] = await Promise.all([
    toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
    toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
  ]);
  await loadFromUrls(ffmpeg, coreURL, wasmURL);
}

/**
 * Load FFmpeg WASM with COEP-safe blob URLs.
 * Tries local dist files first, then CDN fallbacks (matching yesterday's working versions).
 * Returns a fresh loaded FFmpeg instance.
 */
export async function createLoadedFFmpeg({ onStatus } = {}) {
  const localBase = getLocalCoreBase();
  const attempts = [
    {
      name: 'local',
      run: async (ffmpeg) => {
        if (!localBase) throw new Error('No window origin');
        await loadFromBase(ffmpeg, localBase);
      },
    },
    {
      name: 'cdn-0.12.10',
      run: (ffmpeg) => loadFromBase(ffmpeg, `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/esm`),
    },
    {
      name: 'cdn-0.12.6',
      run: (ffmpeg) => loadFromBase(ffmpeg, `https://unpkg.com/@ffmpeg/core@${FALLBACK_VERSION}/dist/esm`),
    },
    {
      name: 'default-bundle',
      run: async (ffmpeg) => {
        await ffmpeg.load();
      },
    },
  ];

  let lastError;
  for (const attempt of attempts) {
    const ffmpeg = new FFmpeg();
    try {
      onStatus?.(`Loading FFmpeg (${attempt.name})…`);
      await withTimeout(attempt.run(ffmpeg), 120000, `FFmpeg load (${attempt.name})`);
      onStatus?.('FFmpeg ready');
      return ffmpeg;
    } catch (err) {
      lastError = err;
      console.warn(`FFmpeg load attempt "${attempt.name}" failed:`, err?.message || err);
      try {
        if (ffmpeg.loaded) await ffmpeg.terminate();
      } catch {
        /* ignore */
      }
    }
  }

  throw new Error(
    lastError?.message ||
      'Failed to initialize FFmpeg. Refresh the page and try again.'
  );
}
