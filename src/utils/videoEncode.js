/** Output size from user quality setting */
export function getVideoDimensions(quality) {
  if (quality === '4k') return { width: 3840, height: 2160 };
  if (quality === 'hd') return { width: 1280, height: 720 };
  return { width: 1920, height: 1080 };
}

/**
 * Fast encode for pre-composited JPEG frame + audio (static type-beat visual).
 * 1 fps + stillimage tune = minimal work for a single image.
 */
export function buildFastEncodeArgs(imageFileName, audioFileName, outputFileName, audioDuration) {
  return [
    '-loop', '1',
    '-framerate', '1',
    '-i', imageFileName,
    '-i', audioFileName,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-tune', 'stillimage',
    '-crf', '30',
    '-pix_fmt', 'yuv420p',
    '-r', '1',
    '-g', '1',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-ar', '44100',
    '-ac', '2',
    '-movflags', '+faststart',
    '-shortest',
    '-t', String(Math.max(0.1, audioDuration)),
    '-y',
    outputFileName,
  ];
}
