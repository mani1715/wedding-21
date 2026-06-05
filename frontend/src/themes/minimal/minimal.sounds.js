/**
 * Modern Minimal — Procedural Web Audio
 * A single sustained piano-like note with slow decay + soft reverb tail.
 * Quiet, contemplative, intentional.
 */

class MinimalSounds {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.nodes = null;
    this.started = false;
  }

  async start() {
    if (this.started) return true;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;
    this.ctx = new Ctx();
    if (this.ctx.state === 'suspended') {
      try { await this.ctx.resume(); } catch (_) {}
    }
    if (this.ctx.state !== 'running') return false;

    this.master = this.ctx.createGain();
    this.master.gain.value = 0.0;
    this.master.connect(this.ctx.destination);

    this._startPad();
    this.started = true;
    return true;
  }

  /** Sustained quiet pad — sine + slight detune for warmth, low-pass shaped. */
  _startPad() {
    const ctx = this.ctx;
    const out = ctx.createGain();
    out.gain.value = 0.6;
    out.connect(this.master);

    // C5 base note (~523 Hz) + E5 (~659) — a major third interval
    const a = ctx.createOscillator();
    a.type = 'sine';
    a.frequency.value = 523.25;

    const b = ctx.createOscillator();
    b.type = 'sine';
    b.frequency.value = 659.25;

    // Subtle detune for organic warmth
    const c = ctx.createOscillator();
    c.type = 'sine';
    c.frequency.value = 523.25 * 1.005;

    // Very slow LFO on amplitude for breath
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.18;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.05;
    lfo.connect(lfoGain);

    const padMix = ctx.createGain();
    padMix.gain.value = 0.12;
    lfoGain.connect(padMix.gain);

    a.connect(padMix);
    b.connect(padMix);
    c.connect(padMix);

    // Low-pass for softness
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2200;
    lp.Q.value = 0.6;
    padMix.connect(lp);
    lp.connect(out);

    a.start(); b.start(); c.start(); lfo.start();
    this.nodes = { a, b, c, lfo, out };
  }

  /** A single piano-like note (stage 2 ring reveal). */
  pianoNote() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const dur = 4.0;
    const partials = [
      { f: 523.25, g: 0.55 },  // C5
      { f: 1046.5, g: 0.18 },  // octave
      { f: 1569.0, g: 0.08 },  // brightness
    ];
    partials.forEach(({ f, g }) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(g, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      o.connect(gain);
      gain.connect(this.master);
      o.start(t0);
      o.stop(t0 + dur);
    });
  }

  fadeTo(volume, dur = 0.8) {
    if (!this.master || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(volume, now + dur);
  }

  stop() {
    if (!this.nodes) return;
    try {
      this.fadeTo(0, 0.6);
      const stopAt = (this.ctx?.currentTime || 0) + 0.7;
      Object.values(this.nodes).forEach((n) => {
        try { n.stop && n.stop(stopAt); } catch (_) {}
      });
    } catch (_) {}
    setTimeout(() => {
      try { this.ctx && this.ctx.close(); } catch (_) {}
      this.ctx = null; this.master = null; this.nodes = null; this.started = false;
    }, 900);
  }
}

export const createMinimalSoundController = () => new MinimalSounds();
