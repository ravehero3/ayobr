// Shared dynamic FFmpeg class loader.
// @ffmpeg/ffmpeg's ESM bundle uses `new Worker(new URL('./worker.js', import.meta.url))`
// which webpack cannot resolve — it creates a broken lazy chunk and the worker
// silently fails, causing ffmpeg.load() to hang forever.
//
// Fix: skip the webpack import. Load the UMD bundle (copied to dist/ during
// the build) as a plain <script> tag. When the browser loads it as its own
// script, document.currentScript.src is correct, so the UMD's runtime
// auto-detects the correct public path and resolves the companion worker
// (814.ffmpeg.js) from the same origin.

let _FFmpegClass = null;

export async function ensureFFmpegClass() {
  if (_FFmpegClass) return _FFmpegClass;
  if (window.FFmpegWASM?.FFmpeg) {
    _FFmpegClass = window.FFmpegWASM.FFmpeg;
    return _FFmpegClass;
  }

  await new Promise((resolve, reject) => {
    if (document.querySelector('script[data-ffmpeg-umd]')) {
      const poll = setInterval(() => {
        if (window.FFmpegWASM?.FFmpeg) { clearInterval(poll); resolve(); }
      }, 50);
      setTimeout(() => {
        clearInterval(poll);
        reject(new Error('FFmpeg UMD script load timed out'));
      }, 15000);
      return;
    }
    const script = document.createElement('script');
    script.setAttribute('data-ffmpeg-umd', '1');
    script.src = '/ffmpeg-lib.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error(
      'Failed to load /ffmpeg-lib.js — ensure npm run build has been run'
    ));
    document.head.appendChild(script);
  });

  _FFmpegClass = window.FFmpegWASM?.FFmpeg;
  if (!_FFmpegClass) throw new Error('window.FFmpegWASM.FFmpeg not found after UMD load');
  return _FFmpegClass;
}
