---
name: FFmpeg quality-aware encoding
description: videoEncode.js buildFastEncodeArgs must receive quality param to set correct CRF and audio bitrate per resolution
---

## Rule
`buildFastEncodeArgs(imageFile, audioFile, outputFile, duration, quality)` must receive `quality` from the caller.
Both `processVideoWithFFmpeg` and `processVideoWithFFmpegInstance` in ffmpegProcessor.js must pass `quality` (from videoSettings?.quality).

## Quality settings
- `4k` → CRF 20, audio 320k, sampleRate 48000
- `fullhd` (default) → CRF 23, audio 192k, sampleRate 44100
- `hd` → CRF 26, audio 128k, sampleRate 44100

**Why:** Old code used hardcoded CRF 30 + 128k audio for all resolutions. At 4K this produces very poor image quality and low audio fidelity — users noticed degraded output.

**How to apply:** Always pass `quality` as the 5th arg to `buildFastEncodeArgs`. In pool mode, extract quality as `videoSettings?.quality ?? 'fullhd'`.
