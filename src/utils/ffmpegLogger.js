/**
 * Global FFmpeg log collector.
 * Module-level singleton — collects logs from ffmpegProcessor and makes them
 * available to the admin debug tab via a simple pub/sub pattern.
 */

const MAX_ENTRIES = 500;
const entries = [];
const listeners = new Set();

let ffmpegStatus = {
  initialized: false,
  initializing: false,
  coreVersion: null,
  loadSource: null,
  lastError: null,
  lastInitTime: null,
  processedCount: 0,
  activeProcesses: 0,
};

function notify() {
  const snapshot = { entries: [...entries], status: { ...ffmpegStatus } };
  listeners.forEach(cb => {
    try { cb(snapshot); } catch (_) {}
  });
}

/**
 * Push a log entry.
 * @param {'info'|'warn'|'error'|'debug'|'ffmpeg'} level
 * @param {string} message
 */
export function logFFmpeg(level, message) {
  const entry = {
    id: Date.now() + Math.random(),
    ts: new Date().toISOString(),
    level,
    message: String(message),
  };
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES);
  notify();
}

/**
 * Update the live FFmpeg status object (partial update).
 */
export function updateFFmpegStatus(patch) {
  Object.assign(ffmpegStatus, patch);
  notify();
}

/**
 * Subscribe to log updates.
 * @param {(snapshot: {entries: Array, status: Object}) => void} cb
 * @returns {() => void} unsubscribe function
 */
export function subscribeFFmpegLogs(cb) {
  listeners.add(cb);
  // Immediately call with current state
  cb({ entries: [...entries], status: { ...ffmpegStatus } });
  return () => listeners.delete(cb);
}

export function getFFmpegSnapshot() {
  return { entries: [...entries], status: { ...ffmpegStatus } };
}

export function clearFFmpegLogs() {
  entries.splice(0, entries.length);
  notify();
}
