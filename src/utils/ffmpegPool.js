import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

const loadFFmpegInstance = async () => {
  const inst = new FFmpeg();
  try {
    const [coreURL, wasmURL] = await Promise.all([
      toBlobURL('/ffmpeg-core.js',   'text/javascript'),
      toBlobURL('/ffmpeg-core.wasm', 'application/wasm'),
    ]);
    await inst.load({ coreURL, wasmURL });
  } catch {
    const base = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm';
    const [coreURL, wasmURL] = await Promise.all([
      toBlobURL(`${base}/ffmpeg-core.js`,   'text/javascript'),
      toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
    ]);
    await inst.load({ coreURL, wasmURL });
  }
  return inst;
};

class Slot {
  constructor(id) {
    this.id = id;
    this.inst = null;
    this.busy = false;
    this._initPromise = null;
  }

  async init() {
    if (this.inst) return;
    if (this._initPromise) { await this._initPromise; return; }
    this._initPromise = loadFFmpegInstance().then(i => { this.inst = i; });
    await this._initPromise;
  }

  async terminate() {
    if (this.inst) {
      try { await this.inst.terminate(); } catch {}
      this.inst = null;
    }
    this._initPromise = null;
    this.busy = false;
  }
}

class FFmpegPool {
  constructor(size) {
    this.size = size;
    this.slots = Array.from({ length: size }, (_, i) => new Slot(i));
    this._waiting = [];
  }

  async acquire() {
    const free = this.slots.find(s => !s.busy);
    if (free) {
      free.busy = true;
      await free.init();
      return free;
    }
    return new Promise(resolve => this._waiting.push(resolve));
  }

  release(slot) {
    slot.busy = false;
    if (this._waiting.length > 0) {
      const next = this._waiting.shift();
      slot.busy = true;
      // slot.inst already loaded from previous acquire; init() is a no-op here
      slot.init().then(() => next(slot));
    }
  }

  async terminateAll() {
    this._waiting = [];
    await Promise.allSettled(this.slots.map(s => s.terminate()));
  }

  resize(newSize) {
    while (this.slots.length < newSize) {
      this.slots.push(new Slot(this.slots.length));
    }
    this.size = newSize;
  }
}

let _pool = null;
let _poolSize = 0;

export function getPool(size) {
  if (!_pool || _poolSize !== size) {
    if (_pool && _poolSize !== size) { _pool.resize(size); _poolSize = size; }
    else { _pool = new FFmpegPool(size); _poolSize = size; }
  }
  return _pool;
}

export async function terminatePool() {
  if (_pool) { await _pool.terminateAll(); _pool = null; _poolSize = 0; }
}
