---
name: FFmpeg WASM COEP loading fix
description: The server sends Cross-Origin-Embedder-Policy require-corp which blocks loading FFmpeg WASM from unpkg CDN. Fix is to serve files locally and use toBlobURL.
---

## Rule
Never use bare CDN URLs in `ffmpeg.load()`. Always use `toBlobURL` from `@ffmpeg/util`, and prefer locally-served WASM files over CDN.

**Why:** `Cross-Origin-Embedder-Policy: require-corp` (required for SharedArrayBuffer / FFmpeg WASM) blocks cross-origin subresource loads unless the resource sends `Cross-Origin-Resource-Policy: cross-origin`. unpkg.com does NOT send this header. `toBlobURL` works around this by fetching via regular `fetch()` (not a subresource load) and wrapping the result in a same-origin `blob:` URL. Bare CDN URLs passed directly to `ffmpeg.load()` fail silently in production.

**How to apply:**
1. Build script copies `@ffmpeg/core` WASM files to `dist/` after webpack: `cp node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.js dist/ffmpeg-core.js && cp node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.wasm dist/ffmpeg-core.wasm`
2. In `ffmpegProcessor.js` and `ffmpegPool.js`, load with: `toBlobURL('/ffmpeg-core.js', 'text/javascript')` and `toBlobURL('/ffmpeg-core.wasm', 'application/wasm')` — local paths first, CDN via `toBlobURL` as fallback only.
3. `@ffmpeg/core` 0.12.x is single-threaded — no `workerURL` is needed.
4. If webpack cache errors occur with WASM files, run `rm -rf node_modules/.cache` before rebuilding.
