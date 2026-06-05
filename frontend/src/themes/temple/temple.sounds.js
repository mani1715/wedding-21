/**
 * South Indian Temple — Procedural Web Audio
 * Nadaswaram drone (high-pitched reed instrument) + brass bell ring.
 * No audio files; everything synthesised live.
 */

class TempleSounds {
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
    this._startNadaswaram();
    this.started = true;
    return true;
  }

  /** Nadaswaram drone — bright sawtooth + filtered overtones + subtle vibrato. */
  _startNadaswaram() {
    const ctx = this.ctx;
    const out = ctx.createGain();
    out.gain.value = 1;
    out.connect(this.master);

    // Sa (~261 Hz) and Pa (~392 Hz) — classical Indian drone interval
    const sa = ctx.createOscillator();
    sa.type = 'sawtooth';
    sa.frequency.value = 261.6;

    const pa = ctx.createOscillator();
    pa.type = 'sawtooth';
    pa.frequency.value = 392.0;

    // Bright reed-like melodic shimmer (octave up)
    const melodic = ctx.createOscillator();
    melodic.type = 'triangle';
    melodic.frequency.value = 880;

    // Slow melodic motion
    const melodicLfo = ctx.createOscillator();
    melodicLfo.frequency.value = 0.25;
    const melodicLfoGain = ctx.createGain();
    melodicLfoGain.gain.value = 80;
    melodicLfo.connect(melodicLfoGain);
    melodicLfoGain.connect(melodic.frequency);

    // Vibrato on Sa & Pa
    const vib = ctx.createOscillator();
    vib.frequency.value = 6.0;
    const vibGain = ctx.createGain();
    vibGain.gain.value = 3.5;
    vib.connect(vibGain);
    vibGain.connect(sa.frequency);
    vibGain.connect(pa.frequency);

    // Resonant lowpass shaping
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1800;
    lp.Q.value = 5;

    const mix = ctx.createGain();
    mix.gain.value = 0.18;
    sa.connect(mix);
    pa.connect(mix);
    melodic.connect(mix);

    mix.connect(lp);
    lp.connect(out);

    sa.start();
    pa.start();
    melodic.start();
    vib.start();
    melodicLfo.start();

    this.nodes = { sa, pa, melodic, vib, melodicLfo, out };
  }

  /** Public alias for start() — used by opening components. */
  play() { return this.start(); }

  /** Fade volume to silent (without tearing down the audio graph). */
  mute() { this.fadeTo(0, 0.3); }

  /** Fade volume back to audible. */
  unmute() { this.fadeTo(0.8, 0.4); }

  /** Fade master gain to volume over `dur` seconds. */
  fadeTo(volume, dur = 0.8) {
    if (!this.master || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(volume, now + dur);
  }

  /** Brass bell ring — fundamental + bright overtones with long decay. */
  bell() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const dur = 3.5;

    // Bell partials (Hindu temple bell: fundamental + perfect 5th + minor 7th)
    const partials = [
      { f: 440,  g: 0.4 },   // A4 fundamental
      { f: 660,  g: 0.25 },  // perfect 5th
      { f: 880,  g: 0.18 },  // octave
      { f: 1320, g: 0.10 },  // brightness
    ];

    partials.forEach(({ f, g }) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(g, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.connect(gain);
      gain.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + dur);
    });
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
      this.ctx = null;
      this.master = null;
      this.nodes = null;
      this.started = false;
    }, 900);
  }
}

export const createTempleSoundController = () => new TempleSounds();
