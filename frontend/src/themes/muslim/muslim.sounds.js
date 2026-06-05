/**
 * Muslim Nikah — Procedural Web Audio
 * Oud-like plucked string melody with reverb-tail decay.
 */

class MuslimSounds {
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

    this._startDrone();
    this.started = true;
    return true;
  }

  /** A slow Middle-Eastern modal drone (E + A, "Rast" feel). */
  _startDrone() {
    const ctx = this.ctx;
    const out = ctx.createGain();
    out.gain.value = 0.7;
    out.connect(this.master);

    const drone1 = ctx.createOscillator();
    drone1.type = 'sine'; drone1.frequency.value = 164.81; // E3
    const drone2 = ctx.createOscillator();
    drone2.type = 'sine'; drone2.frequency.value = 220.00; // A3

    const mix = ctx.createGain();
    mix.gain.value = 0.08;
    drone1.connect(mix); drone2.connect(mix); mix.connect(out);

    // LFO breath
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.14;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.025;
    lfo.connect(lfoGain); lfoGain.connect(mix.gain);

    drone1.start(); drone2.start(); lfo.start();
    this.nodes = { drone1, drone2, lfo, out };
  }

  /** Oud melodic phrase — pluck-style triangle wave with quick decay. */
  oudPhrase() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    // Maqam-like phrase
    const notes = [
      { f: 440.00, t: 0.00 }, // A
      { f: 392.00, t: 0.35 }, // G
      { f: 349.23, t: 0.70 }, // F
      { f: 415.30, t: 1.05 }, // G♯
      { f: 440.00, t: 1.45 }, // A
      { f: 523.25, t: 1.85 }, // C
      { f: 440.00, t: 2.30 }, // A (resolve)
    ];
    notes.forEach(({ f, t }) => {
      this._pluck(f, this.ctx.currentTime + t);
    });
  }

  _pluck(freq, when, dur = 1.4) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = freq;
    // Slight initial bend (gives plucked attack)
    o.frequency.setValueAtTime(freq * 1.04, when);
    o.frequency.exponentialRampToValueAtTime(freq, when + 0.08);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(0.22, when + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, when + dur);

    // Bandpass filter for body resonance
    const bp = ctx.createBiquadFilter();
    bp.type = 'lowpass';
    bp.frequency.value = 2400;
    bp.Q.value = 1.4;

    o.connect(bp); bp.connect(g); g.connect(this.master);
    o.start(when); o.stop(when + dur);
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

export const createMuslimSoundController = () => new MuslimSounds();
