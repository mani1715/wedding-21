/* Shared bits for theme openings + closings.
 * - useSkipReveal: gives a `showSkip` boolean after 1.5s
 * - playTone: Web-Audio API wrapper to fire a single ADSR'd oscillator
 * - WhisperIn: framer-motion preset for the photographer's text after close
 */
import React, { useEffect, useState } from 'react';

export function useSkipReveal(afterMs = 1500) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), afterMs);
    return () => clearTimeout(t);
  }, [afterMs]);
  return show;
}

export const SkipButton = ({ onSkip, label = 'Skip' }) => {
  const show = useSkipReveal(1500);
  if (!show) return null;
  return (
    <button
      onClick={onSkip}
      data-testid="theme-opening-skip"
      style={{
        position: 'fixed', right: 18, bottom: 18, zIndex: 200,
        padding: '6px 14px', borderRadius: 999, fontSize: 11,
        letterSpacing: '0.25em', textTransform: 'uppercase',
        background: 'rgba(0,0,0,0.45)', color: 'rgba(255,248,220,0.85)',
        border: '1px solid rgba(255,248,220,0.30)', backdropFilter: 'blur(8px)',
        cursor: 'pointer', userSelect: 'none',
      }}
    >
      {label} ✕
    </button>
  );
};

/* Procedural web-audio tone — sine/sawtooth + ADSR.
 * Returns a `stop()` so the consumer can dispose on unmount. */
export function playTone({
  freq = 523, type = 'sine', attack = 0.05, decay = 0.4,
  sustain = 0.3, release = 1.2, volume = 0.15,
  detune = 0, when = 0,
} = {}) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return () => {};
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    osc.connect(gain);
    gain.connect(ctx.destination);

    const t0 = ctx.currentTime + when;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(volume, t0 + attack);
    gain.gain.linearRampToValueAtTime(volume * sustain, t0 + attack + decay);
    gain.gain.linearRampToValueAtTime(0.0001, t0 + attack + decay + release);

    osc.start(t0);
    osc.stop(t0 + attack + decay + release + 0.1);

    let disposed = false;
    const stop = () => {
      if (disposed) return;
      disposed = true;
      try { osc.stop(); } catch (e) { /* already stopped */ }
      try { ctx.close(); } catch (e) { /* already closed */ }
    };
    osc.onended = stop;
    return stop;
  } catch (e) {
    return () => {};
  }
}

/** Plays a series of tones (a chord or arpeggio). */
export function playSequence(notes = []) {
  const stops = notes.map((n) => playTone(n));
  return () => stops.forEach((s) => s && s());
}

/* A pure black canvas that owns its parent — used as the opening base. */
export const Stage = ({ children, fadeOutAt, onFadedOut, bg = '#040201', testId }) => {
  const [fading, setFading] = useState(false);
  useEffect(() => {
    if (fadeOutAt == null) return;
    const t = setTimeout(() => setFading(true), fadeOutAt);
    const t2 = setTimeout(() => onFadedOut?.(), fadeOutAt + 500);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, [fadeOutAt, onFadedOut]);
  return (
    <div
      data-testid={testId}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: bg, overflow: 'hidden',
        opacity: fading ? 0 : 1,
        transition: 'opacity 500ms ease-out',
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      {children}
    </div>
  );
};
