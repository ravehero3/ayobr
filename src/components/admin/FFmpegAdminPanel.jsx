import React, { useState, useEffect, useCallback } from 'react';
import {
  clearFFmpegDiagnostics,
  exportDiagnosticsText,
  getEnvironmentSnapshot,
  getFFmpegDiagnosticsSnapshot,
  getFFmpegJobEvents,
  getFFmpegLogs,
  getFFmpegRuntimeState,
  subscribeFFmpegDiagnostics,
} from '../../utils/ffmpegDiagnostics';
import {
  initializeFFmpeg,
  restartFFmpeg,
  forceStopAllProcesses,
  processVideoWithFFmpeg,
} from '../../utils/ffmpegProcessor';
import { preloadFFmpegCore } from '../../utils/ffmpegCoreUrls';

const NM = "'Neue Montreal', 'Inter', sans-serif";
const CARD = 'rgba(255,255,255,0.03)';
const BORDER = 'rgba(255,255,255,0.08)';
const BLUE = '#3b82f6';

function Row({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: `1px solid ${BORDER}` }}>
      <span style={{ fontFamily: NM, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', width: 140, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </span>
      <span style={{ fontFamily: mono ? 'monospace' : NM, fontSize: 11, color: '#fff', wordBreak: 'break-all', lineHeight: 1.5 }}>
        {value ?? '—'}
      </span>
    </div>
  );
}

function levelColor(level) {
  if (level === 'error') return '#f87171';
  if (level === 'warn') return '#fbbf24';
  return 'rgba(255,255,255,0.55)';
}

export default function FFmpegAdminPanel({ flash }) {
  const [tick, setTick] = useState(0);
  const [logFilter, setLogFilter] = useState('all');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => subscribeFFmpegDiagnostics(() => setTick((n) => n + 1)), []);

  const env = getEnvironmentSnapshot();
  const runtime = getFFmpegRuntimeState();
  const logs = getFFmpegLogs({
    level: logFilter === 'all' ? undefined : logFilter,
    limit: 250,
  });
  const jobs = getFFmpegJobEvents(25);
  const snap = getFFmpegDiagnosticsSnapshot();

  const copyAll = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(exportDiagnosticsText());
      flash?.('Diagnostika zkopírována');
    } catch {
      flash?.('Kopírování selhalo');
    }
  }, [flash]);

  const runLoadTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      await preloadFFmpegCore();
      await initializeFFmpeg();
      setTestResult({ ok: true, message: 'FFmpeg WASM načteno OK' });
      flash?.('FFmpeg load OK');
    } catch (e) {
      setTestResult({ ok: false, message: e?.message || String(e) });
      flash?.('FFmpeg load selhalo');
    } finally {
      setTesting(false);
    }
  };

  const runMiniEncode = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 180;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, 320, 180);
      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('FFmpeg test', 40, 100);

      const imageBlob = await new Promise((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error('canvas blob failed')), 'image/jpeg', 0.9)
      );
      const imageFile = new File([imageBlob], 'test-cover.jpg', { type: 'image/jpeg' });

      const ac = new AudioContext();
      const sampleRate = 44100;
      const duration = 1.5;
      const frames = Math.floor(sampleRate * duration);
      const buffer = ac.createBuffer(1, frames, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < frames; i++) {
        data[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.2;
      }
      const wavBlob = audioBufferToWav(buffer);
      const audioFile = new File([wavBlob], 'test-tone.wav', { type: 'audio/wav' });
      await ac.close();

      const out = await processVideoWithFFmpeg(
        `admin-test-${Date.now()}`,
        audioFile,
        imageFile,
        null,
        () => false,
        { quality: 'hd', background: 'black' },
        null
      );

      setTestResult({
        ok: true,
        message: `Mini encode OK (${out?.length ?? 0} bytes)`,
      });
      flash?.('Test encode OK');
    } catch (e) {
      setTestResult({ ok: false, message: e?.message || String(e) });
      flash?.('Test encode selhal');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div key={tick}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: NM, fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>
          FFmpeg diagnostika
        </h2>
        <p style={{ fontFamily: NM, fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.7, maxWidth: 720 }}>
          Živé logy z prohlížeče (WASM). Po generování videa v aplikaci se zde objeví chyby exec, init a WASM výstup.
          4K používá 1 vlákno a concurrency 1 — jako fungující build z 30.5.
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {[
          { label: 'Načíst FFmpeg', action: runLoadTest },
          { label: 'Test encode (HD)', action: runMiniEncode },
          { label: 'Restart FFmpeg', action: async () => { setTesting(true); try { await restartFFmpeg(); flash?.('Restart OK'); } catch (e) { flash?.(e.message); } finally { setTesting(false); } } },
          { label: 'Force stop', action: async () => { await forceStopAllProcesses(); flash?.('Zastaveno'); } },
          { label: 'Kopírovat JSON', action: copyAll },
          { label: 'Vymazat logy', action: () => { clearFFmpegDiagnostics(); flash?.('Logy smazány'); } },
        ].map((btn) => (
          <button
            key={btn.label}
            disabled={testing}
            onClick={btn.action}
            style={{
              fontFamily: NM,
              fontWeight: 700,
              fontSize: 10,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '10px 16px',
              borderRadius: 9999,
              cursor: testing ? 'not-allowed' : 'pointer',
              border: `1px solid ${BORDER}`,
              background: 'rgba(255,255,255,0.06)',
              color: '#fff',
              opacity: testing ? 0.5 : 1,
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {testResult && (
        <div
          style={{
            marginBottom: 20,
            padding: '12px 16px',
            borderRadius: 10,
            background: testResult.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${testResult.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: testResult.ok ? '#34d399' : '#f87171',
            fontFamily: NM,
            fontSize: 12,
          }}
        >
          {testResult.message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ fontFamily: NM, fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', color: BLUE, marginBottom: 12, textTransform: 'uppercase' }}>
            Runtime
          </div>
          <Row label="Loaded" value={runtime.loaded ? 'yes' : 'no'} />
          <Row label="Initializing" value={runtime.initializing ? 'yes' : 'no'} />
          <Row label="Core" value={runtime.coreSource} mono />
          <Row label="Active pair" value={runtime.activePairId} mono />
          <Row label="OK / fail" value={`${runtime.processedCount} / ${runtime.failedCount}`} />
          <Row label="Last init" value={runtime.lastInitAt} />
          <Row label="Last success" value={runtime.lastSuccessAt} />
          <Row label="Last error" value={runtime.lastExecError || runtime.lastInitError} mono />
        </div>

        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ fontFamily: NM, fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', color: BLUE, marginBottom: 12, textTransform: 'uppercase' }}>
            Prostředí
          </div>
          <Row label="COOP / COEP" value={String(env.crossOriginIsolated)} />
          <Row label="SharedArrayBuffer" value={env.sharedArrayBuffer ? 'yes' : 'no'} />
          <Row label="Heap used" value={env.jsHeapUsedMB != null ? `${env.jsHeapUsedMB} MB` : 'n/a'} />
          <Row label="Heap limit" value={env.jsHeapLimitMB != null ? `${env.jsHeapLimitMB} MB` : 'n/a'} />
          <Row label="CPU cores" value={env.hardwareConcurrency} />
          <Row label="Device RAM" value={env.deviceMemory != null ? `${env.deviceMemory} GB` : 'n/a'} />
          <Row label="Online" value={env.online ? 'yes' : 'no'} />
        </div>

        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ fontFamily: NM, fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', color: BLUE, marginBottom: 12, textTransform: 'uppercase' }}>
            Statistiky logů
          </div>
          <Row label="Total" value={snap.logCounts.total} />
          <Row label="Errors" value={snap.logCounts.error} />
          <Row label="Warnings" value={snap.logCounts.warn} />
          <Row label="Last exec" value={runtime.lastExecAt} />
        </div>
      </div>

      {runtime.lastExecArgs && (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16, marginBottom: 24 }}>
          <div style={{ fontFamily: NM, fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase' }}>
            Poslední FFmpeg příkaz
          </div>
          <pre style={{ margin: 0, fontSize: 10, lineHeight: 1.6, color: 'rgba(255,255,255,0.7)', overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            ffmpeg {runtime.lastExecArgs.join(' ')}
          </pre>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden', minHeight: 280 }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, fontFamily: NM, fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
            Job events
          </div>
          <div style={{ maxHeight: 320, overflow: 'auto', padding: 12 }}>
            {jobs.length === 0 && (
              <div style={{ fontFamily: NM, fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: 24 }}>
                Zatím žádné joby — spusť generování v /app
              </div>
            )}
            {jobs.map((j, i) => (
              <div key={i} style={{ marginBottom: 10, fontSize: 10, fontFamily: 'monospace', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
                <span style={{ color: BLUE }}>{j.ts?.slice(11, 19)}</span> [{j.type}] {j.pairId || ''} {j.quality || ''} {j.error ? `— ${j.error}` : ''} {j.bytes ? `(${j.bytes}b)` : ''}
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden', minHeight: 280 }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontFamily: NM, fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
              Log stream
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              {['all', 'error', 'warn', 'info'].map((f) => (
                <button
                  key={f}
                  onClick={() => setLogFilter(f)}
                  style={{
                    fontFamily: NM,
                    fontSize: 9,
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 9999,
                    border: `1px solid ${logFilter === f ? BLUE : BORDER}`,
                    background: logFilter === f ? `${BLUE}25` : 'transparent',
                    color: logFilter === f ? BLUE : 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div style={{ maxHeight: 320, overflow: 'auto', padding: 12 }}>
            {logs.map((log) => (
              <div key={log.id} style={{ marginBottom: 8, fontSize: 10, fontFamily: 'monospace', lineHeight: 1.45 }}>
                <span style={{ color: 'rgba(255,255,255,0.25)' }}>{log.ts?.slice(11, 23)}</span>{' '}
                <span style={{ color: levelColor(log.level) }}>[{log.level}]</span>{' '}
                <span style={{ color: 'rgba(167,139,250,0.9)' }}>{log.category}</span>{' '}
                <span style={{ color: 'rgba(255,255,255,0.75)' }}>{log.message}</span>
                {log.meta && (
                  <pre style={{ margin: '4px 0 0', fontSize: 9, color: 'rgba(255,255,255,0.35)', whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(log.meta, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Minimal WAV encoder for admin smoke test */
function audioBufferToWav(buffer) {
  const numCh = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitDepth = 16;
  const samples = buffer.length;
  const blockAlign = (numCh * bitDepth) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples * blockAlign;
  const buf = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buf);
  const writeStr = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numCh, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);
  let offset = 44;
  const ch0 = buffer.getChannelData(0);
  for (let i = 0; i < samples; i++) {
    const s = Math.max(-1, Math.min(1, ch0[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return new Blob([buf], { type: 'audio/wav' });
}
