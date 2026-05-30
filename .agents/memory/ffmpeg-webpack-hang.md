---
name: FFmpeg webpack hang fix
description: Why ffmpeg.load() hangs forever when bundled with webpack and how to fix it
---

## The Problem
`@ffmpeg/ffmpeg` v0.12 ESM bundle uses `new Worker(new URL('./worker.js', import.meta.url))` internally. Webpack cannot statically resolve `import.meta.url` at the call site — it emits a "Critical dependency: the request of a dependency is an expression" warning and creates a broken lazy chunk. The worker silently fails to initialize, so `ffmpeg.load()` never resolves. The admin panel shows "LOADING" forever.

**Why:** `import.meta.url` in a dependency processed by webpack gets replaced with the *bundle* URL, not the worker file URL. The resulting worker chunk loads incorrectly in the browser.

## Fix 1 — Alias to UMD bundle (root cause fix)
In `webpack.config.js` resolve.alias:
```js
'@ffmpeg/ffmpeg': path.resolve(__dirname, 'node_modules/@ffmpeg/ffmpeg/dist/umd/ffmpeg.js'),
```
UMD does not use `import.meta.url` for worker creation, so webpack bundles it cleanly.

## Fix 2 — Timeout on ffmpeg.load() (defense in depth)
Wrap every `ffmpeg.load()` call in a `Promise.race()` against a timeout (30s local, 60s CDN, 30s bare). If the worker hangs, it fails gracefully and falls through to the next attempt instead of blocking forever.

## Fix 3 — Preflight HEAD check
Before trying local WASM load, do a HEAD request to `/ffmpeg-core.wasm`. Skip local attempt if 404 (build didn't copy the file), go straight to CDN. Prevents wasting 30s on a doomed local attempt.

**How to apply:** Any project using `@ffmpeg/ffmpeg` with webpack must use the UMD alias OR configure webpack's Worker handling explicitly.
