---
name: Sequential FFmpeg quality/background bug
description: The sequential video path in useFFmpeg.js was missing quality and customBackground from the videoSettings object passed to processVideoWithFFmpeg.
---

## Rule
When building `videoSettings` in `processPairAsync` (sequential path), always include `quality` and `customBackground` alongside `background`.

**Why:** The concurrent pool path (`buildVideoSettings`) correctly included all three fields. The sequential path only included `background`, so `videoSettings.quality` was always `undefined` → FFmpeg defaulted to 1920×1080 for every video, ignoring the user's resolution choice. Custom backgrounds were also silently dropped.

**How to apply:** Any time you add a new field to `videoSettings` in the store or in `buildVideoSettings` (pool path), mirror that field in the `videoSettings` object inside `processPairAsync` (sequential path) in `src/hooks/useFFmpeg.js`.
