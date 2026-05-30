import { toBlobURL } from '@ffmpeg/util';

/** Must match package.json @ffmpeg/core version */
const CDN = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm';

let cachedUrls = null;
let loadPromise = null;

/**
 * Fetch WASM once and cache blob URLs (browser caches the HTTP fetch).
 * Required for COEP require-corp — direct URLs to ffmpeg-core fail on Render.
 */
export function preloadFFmpegCore() {
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const origin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : '';

    const sources = [
      ...(origin ? [`${origin}/ffmpeg-core.js`, `${origin}/ffmpeg-core.wasm`] : []),
      [`${CDN}/ffmpeg-core.js`, `${CDN}/ffmpeg-core.wasm`],
    ];

    let lastError;
    for (let i = 0; i < sources.length; i += 2) {
      const jsUrl = sources[i];
      const wasmUrl = sources[i + 1];
      if (!jsUrl || !wasmUrl) continue;
      try {
        const [coreURL, wasmURL] = await Promise.all([
          toBlobURL(jsUrl, 'text/javascript'),
          toBlobURL(wasmUrl, 'application/wasm'),
        ]);
        cachedUrls = { coreURL, wasmURL };
        return cachedUrls;
      } catch (err) {
        lastError = err;
        console.warn('FFmpeg core URL prefetch failed:', jsUrl, err?.message || err);
      }
    }

    throw new Error(
      lastError?.message ||
        'Could not load FFmpeg. Check your connection and refresh the page.'
    );
  })();

  loadPromise.catch(() => {
    loadPromise = null;
  });

  return loadPromise;
}

export async function getFFmpegCoreUrls() {
  if (cachedUrls) return cachedUrls;
  return preloadFFmpegCore();
}

export function resetFFmpegCoreCache() {
  cachedUrls = null;
  loadPromise = null;
}
