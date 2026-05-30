/** Output size from user quality setting */
export function getVideoDimensions(quality) {
  if (quality === '4k') return { width: 3840, height: 2160 };
  if (quality === 'hd') return { width: 1280, height: 720 };
  return { width: 1920, height: 1080 };
}

/**
 * Quality-aware encoding settings.
 * Higher quality = lower CRF (better video) + higher audio bitrate.
 */
function getEncodeSettings(quality) {
  if (quality === '4k') {
    return { crf: 20, audioBitrate: '320k', sampleRate: '48000' };
  }
  if (quality === 'hd') {
    return { crf: 26, audioBitrate: '128k', sampleRate: '44100' };
  }
  // fullhd (default)
  return { crf: 23, audioBitrate: '192k', sampleRate: '44100' };
}

/**
 * Fast encode for pre-composited JPEG frame + audio (static type-beat visual).
 * 1 fps + stillimage tune = minimal CPU work for a single image.
 * Quality settings scale with the selected output resolution.
 */
export function buildFastEncodeArgs(imageFileName, audioFileName, outputFileName, audioDuration, quality = 'fullhd') {
  const { crf, audioBitrate, sampleRate } = getEncodeSettings(quality);
  return [
    '-loop', '1',
    '-framerate', '1',
    '-i', imageFileName,
    '-i', audioFileName,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-tune', 'stillimage',
    '-crf', String(crf),
    '-pix_fmt', 'yuv420p',
    '-r', '1',
    '-g', '1',
    '-c:a', 'aac',
    '-b:a', audioBitrate,
    '-ar', sampleRate,
    '-ac', '2',
    '-movflags', '+faststart',
    '-shortest',
    '-t', String(Math.max(0.1, audioDuration)),
    '-y',
    outputFileName,
  ];
}
