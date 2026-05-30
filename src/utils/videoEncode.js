/** Output size from user quality setting */
export function getVideoDimensions(quality) {
  if (quality === '4k') return { width: 3840, height: 2160 };
  if (quality === 'hd') return { width: 1280, height: 720 };
  return { width: 1920, height: 1080 };
}

/**
 * Encode args aligned with the last known-good build (30.5).
 * Pre-composited JPEG at target resolution + audio; 4K uses single thread for WASM memory safety.
 */
export function buildFastEncodeArgs(
  imageFileName,
  audioFileName,
  outputFileName,
  audioDuration,
  quality = 'fullhd'
) {
  const is4K = quality === '4k';
  const threadCount = is4K ? '1' : '4';
  const duration = Math.max(0.1, Number(audioDuration) || 180);

  return [
    '-loop',
    '1',
    '-framerate',
    '5',
    '-i',
    imageFileName,
    '-i',
    audioFileName,
    '-c:v',
    'libx264',
    '-preset',
    'ultrafast',
    '-tune',
    'zerolatency',
    '-crf',
    '28',
    '-pix_fmt',
    'yuv420p',
    '-r',
    '5',
    '-g',
    '60',
    '-keyint_min',
    '60',
    '-c:a',
    'aac',
    '-b:a',
    '320k',
    '-ar',
    '48000',
    '-ac',
    '2',
    '-threads',
    threadCount,
    '-movflags',
    '+faststart',
    '-shortest',
    '-t',
    String(duration),
    '-y',
    outputFileName,
  ];
}
