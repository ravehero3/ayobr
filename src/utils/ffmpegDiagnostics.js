const MAX_LOG_ENTRIES = 600;
const MAX_JOB_EVENTS = 80;

const logs = [];
const jobEvents = [];
const listeners = new Set();

let runtimeState = {
  loaded: false,
  initializing: false,
  lastInitAt: null,
  lastInitError: null,
  coreSource: null,
  activePairId: null,
  lastExecArgs: null,
  lastExecAt: null,
  lastExecError: null,
  lastSuccessAt: null,
  processedCount: 0,
  failedCount: 0,
};

function notify() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
}

export function subscribeFFmpegDiagnostics(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function ffmpegLog(level, category, message, meta = null) {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ts: new Date().toISOString(),
    level,
    category,
    message: typeof message === 'string' ? message : String(message),
    meta: meta ?? undefined,
  };
  logs.unshift(entry);
  if (logs.length > MAX_LOG_ENTRIES) logs.length = MAX_LOG_ENTRIES;

  if (level === 'error') {
    console.error(`[FFmpeg:${category}]`, entry.message, meta ?? '');
  } else if (level === 'warn') {
    console.warn(`[FFmpeg:${category}]`, entry.message, meta ?? '');
  } else {
    console.log(`[FFmpeg:${category}]`, entry.message, meta ?? '');
  }

  notify();
}

export function recordJobEvent(type, detail = {}) {
  const event = { ts: new Date().toISOString(), type, ...detail };
  jobEvents.unshift(event);
  if (jobEvents.length > MAX_JOB_EVENTS) jobEvents.length = MAX_JOB_EVENTS;
  notify();
}

export function patchFFmpegRuntimeState(patch) {
  runtimeState = { ...runtimeState, ...patch };
  notify();
}

export function getFFmpegRuntimeState() {
  return { ...runtimeState };
}

export function getFFmpegLogs({ level, category, limit = 200 } = {}) {
  let out = logs;
  if (level) out = out.filter((e) => e.level === level);
  if (category) out = out.filter((e) => e.category === category);
  return out.slice(0, limit);
}

export function getFFmpegJobEvents(limit = 40) {
  return jobEvents.slice(0, limit);
}

export function clearFFmpegDiagnostics() {
  logs.length = 0;
  jobEvents.length = 0;
  runtimeState = {
    ...runtimeState,
    lastExecError: null,
    lastInitError: null,
  };
  notify();
}

export function getEnvironmentSnapshot() {
  const nav = typeof navigator !== 'undefined' ? navigator : {};
  const mem = performance?.memory;
  return {
    userAgent: nav.userAgent ?? 'unknown',
    platform: nav.platform ?? 'unknown',
    language: nav.language ?? 'unknown',
    hardwareConcurrency: nav.hardwareConcurrency ?? null,
    deviceMemory: nav.deviceMemory ?? null,
    crossOriginIsolated: typeof crossOriginIsolated !== 'undefined' ? crossOriginIsolated : null,
    sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
    wasmSupported: typeof WebAssembly !== 'undefined',
    online: nav.onLine ?? true,
    jsHeapUsedMB: mem ? Math.round(mem.usedJSHeapSize / 1048576) : null,
    jsHeapLimitMB: mem ? Math.round(mem.jsHeapSizeLimit / 1048576) : null,
    viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : null,
    location: typeof window !== 'undefined' ? window.location?.href : null,
  };
}

export function getFFmpegDiagnosticsSnapshot() {
  return {
    environment: getEnvironmentSnapshot(),
    runtime: getFFmpegRuntimeState(),
    recentLogs: getFFmpegLogs({ limit: 120 }),
    recentJobs: getFFmpegJobEvents(30),
    logCounts: {
      total: logs.length,
      error: logs.filter((l) => l.level === 'error').length,
      warn: logs.filter((l) => l.level === 'warn').length,
    },
  };
}

export function attachFFmpegInstanceLogs(ffmpeg, label = 'main') {
  if (!ffmpeg || ffmpeg.__diagAttached) return;
  ffmpeg.__diagAttached = true;
  ffmpeg.on('log', ({ message, type }) => {
    const level = type === 'fferr' || /error/i.test(message) ? 'error' : type === 'warning' ? 'warn' : 'info';
    ffmpegLog(level, `wasm-${label}`, message);
  });
}

export function exportDiagnosticsText() {
  const snap = getFFmpegDiagnosticsSnapshot();
  return JSON.stringify(snap, null, 2);
}
