import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

const CDN_ESM = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

async function loadWithBlobUrls(ffmpeg, base) {
  const [coreURL, wasmURL] = await Promise.all([
    toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
    toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
  ]);
  await ffmpeg.load({ coreURL, wasmURL });
}

/**
 * COEP-safe FFmpeg load — CDN first (fast edge), then same-origin dist, then default bundle.
 * Returns a loaded FFmpeg instance.
 */
export async function loadFFmpegWasm() {
  const localBase =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : '';

  const attempts = [
    (ffmpeg) => loadWithBlobUrls(ffmpeg, CDN_ESM),
    ...(localBase ? [(ffmpeg) => loadWithBlobUrls(ffmpeg, localBase)] : []),
    (ffmpeg) => ffmpeg.load(),
  ];

  let lastError;
  for (let i = 0; i < attempts.length; i++) {
    const ffmpeg = new FFmpeg();
    try {
      await attempts[i](ffmpeg);
      return ffmpeg;
    } catch (err) {
      lastError = err;
      console.warn(`FFmpeg load attempt ${i + 1} failed:`, err?.message || err);
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
