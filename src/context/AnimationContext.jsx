import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const ANIMATION_KEYS = [
  { key: 'image_placeholder',  label: 'Animated image placeholder icon', desc: 'Floating/rocking icon in empty image slots on page 2' },
  { key: 'backdrop_blur',      label: 'Backdrop blur on containers',      desc: 'Glass blur effect on all cards — high GPU cost on integrated graphics' },
  { key: 'background_blur',    label: 'Background blur on upload',        desc: 'Full-screen 40 px blur applied to background image when files are added' },
  { key: 'noise_texture',      label: 'Noise texture overlay',            desc: 'Grain texture blended over glass containers via noise.png' },
  { key: 'loader_particles',   label: 'Video loader particles',           desc: 'Floating particles during the video-generation loader' },
  { key: 'waveform',           label: 'Audio waveform visualization',     desc: 'WaveSurfer canvas waveform on every audio file — heavy with 50 files' },
  { key: 'video_card_hover',   label: 'Video card hover glow',            desc: 'Lift + large blue glow/shadow on video card hover' },
  { key: 'pair_merge',         label: 'Pair merge animation',             desc: 'Visual merge animation when audio & image are processed' },
  { key: 'thumbnail_pulse',    label: 'Thumbnail pulse animation',        desc: 'Pulsing radial glow on video thumbnails (2 s infinite)' },
  { key: 'generate_btn',       label: 'Generate button border animation', desc: 'Animated conic-gradient border on the generate button (3 s infinite)' },
  { key: 'button_particles',   label: 'Button hover particles',           desc: 'Floating particle dots around generate button on hover' },
  { key: 'landing_animations', label: 'Landing page scroll animations',   desc: 'Word-reveal and blur-in transitions as content enters viewport' },
  { key: 'dropzone_animation', label: 'Drop-zone entrance animations',    desc: 'Scale/fade entrance + hover rotate on the upload drop zone' },
  { key: 'sleeping_alien',     label: 'Sleeping alien mascot',            desc: 'Alien mascot displayed during video generation' },
  { key: 'diagonal_move',      label: 'Background diagonal pan',          desc: '25 s diagonal pan + scale on landing-page background images' },
];

const DEFAULT_SETTINGS = Object.fromEntries(ANIMATION_KEYS.map(k => [k.key, true]));

const AnimationContext = createContext(null);

export function AnimationProvider({ children }) {
  const [adminSettings, setAdminSettings] = useState(DEFAULT_SETTINGS);
  const [perfMode, setPerfMode] = useState(() => {
    try { return localStorage.getItem('typebeatz_perf_mode') || 'max'; } catch { return 'max'; }
  });

  useEffect(() => {
    fetch('/api/animation-settings', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setAdminSettings(prev => ({ ...prev, ...data })); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.body.setAttribute('data-perf', perfMode);
    ANIMATION_KEYS.forEach(({ key }) => {
      const enabled = perfMode === 'low' ? false : adminSettings[key] !== false;
      document.body.setAttribute(`data-anim-${key.replace(/_/g, '-')}`, enabled ? 'on' : 'off');
    });
  }, [perfMode, adminSettings]);

  const isAnimEnabled = useCallback((key) => {
    if (perfMode === 'low') return false;
    return adminSettings[key] !== false;
  }, [perfMode, adminSettings]);

  const setUserPerfMode = useCallback((mode) => {
    setPerfMode(mode);
    try { localStorage.setItem('typebeatz_perf_mode', mode); } catch {}
  }, []);

  return (
    <AnimationContext.Provider value={{ isAnimEnabled, perfMode, setUserPerfMode, adminSettings, setAdminSettings }}>
      {children}
    </AnimationContext.Provider>
  );
}

export function useAnimation() {
  const ctx = useContext(AnimationContext);
  if (!ctx) throw new Error('useAnimation must be used within AnimationProvider');
  return ctx;
}
