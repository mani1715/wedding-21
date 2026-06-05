/**
 * Christian Elegant — Procedural Web Audio
 * Resonant church bell tone (fundamental + 5th overtone, long sustained decay).
 */

class ChristianSounds {
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

    this._startOrganPad();
    this.started = true;
    return true;
  }

  /** Sustained organ-like pad (reverent church ambience). */
  _startOrganPad() {
    const ctx = this.ctx;
    const out = ctx.createGain();
    out.gain.value = 0.8;
    out.connect(this.master);

    // Cathedral pad — C, G, E (open fifths + 3rd)
    const freqs = [261.6, 392.0, 329.6];
    const oscs = freqs.map((f) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = 0.07;
      o.connect(g); g.connect(out);
      o.start();
      return { osc: o, gain: g };
    });

    // Very slow LFO for breath
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.13;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.025;
    lfo.connect(lfoGain);
    oscs.forEach(({ gain }) => lfoGain.connect(gain.gain));
    lfo.start();

    this.nodes = { oscs, lfo, out };
  }

  /** Bell strike — fundamental + overtones with exponential decay. */
  bell() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const dur = 5.0;
    const partials = [
      { f: 523,  g: 0.55 },  // C5 fundamental
      { f: 1046, g: 0.30 },  // octave
      { f: 1318, g: 0.20 },  // major 3rd
      { f: 1956, g: 0.10 },  // bright shimmer
    ];
    partials.forEach(({ f, g }) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(g, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      o.connect(gain); gain.connect(this.master);
      o.start(t0); o.stop(t0 + dur);
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
      this.nodes.oscs.forEach(({ osc }) => {
        try { osc.stop(stopAt); } catch (_) {}
      });
      try { this.nodes.lfo.stop(stopAt); } catch (_) {}
    } catch (_) {}
    setTimeout(() => {
      try { this.ctx && this.ctx.close(); } catch (_) {}
      this.ctx = null; this.master = null; this.nodes = null; this.started = false;
    }, 900);
  }
}

export const createChristianSoundController = () => new ChristianSounds();
