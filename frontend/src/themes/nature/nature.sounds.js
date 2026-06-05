/**
 * Nature / Eco — Procedural Web Audio
 * Forest ambience: layered high-frequency oscillators with amplitude modulation
 * simulating cicada/cricket chirping at dusk.
 */

class NatureSounds {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.layers = [];
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

    this._startForest();
    this.started = true;
    return true;
  }

  /** 5 layers of high-pitched oscillators, each AM-modulated at different rates. */
  _startForest() {
    const ctx = this.ctx;
    const out = ctx.createGain();
    out.gain.value = 0.9;
    out.connect(this.master);

    for (let i = 0; i < 5; i++) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 2800 + Math.random() * 2200;

      const gain = ctx.createGain();
      gain.gain.value = 0.022;

      // Amplitude modulation — gives chirping rhythm
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 7 + Math.random() * 5;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.022;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);

      // Slight pitch wobble for organic feel
      const pitchLfo = ctx.createOscillator();
      pitchLfo.frequency.value = 0.1 + Math.random() * 0.2;
      const pitchLfoGain = ctx.createGain();
      pitchLfoGain.gain.value = 12;
      pitchLfo.connect(pitchLfoGain);
      pitchLfoGain.connect(osc.frequency);

      osc.connect(gain);
      gain.connect(out);
      osc.start(); lfo.start(); pitchLfo.start();
      this.layers.push({ osc, lfo, pitchLfo });
    }

    // A low warm pad below the cicadas
    const pad = ctx.createOscillator();
    pad.type = 'sine';
    pad.frequency.value = 110;
    const padGain = ctx.createGain();
    padGain.gain.value = 0.04;
    pad.connect(padGain); padGain.connect(out);
    pad.start();
    this.layers.push({ pad });
  }

  /** A single bird-chirp moment (stage 4). */
  chirp() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(2400, t0);
    o.frequency.exponentialRampToValueAtTime(3600, t0 + 0.10);
    o.frequency.exponentialRampToValueAtTime(2200, t0 + 0.22);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.18, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.45);
    o.connect(g); g.connect(this.master);
    o.start(t0); o.stop(t0 + 0.5);
  }

  fadeTo(volume, dur = 0.8) {
    if (!this.master || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(volume, now + dur);
  }

  stop() {
    try {
      this.fadeTo(0, 0.6);
      const stopAt = (this.ctx?.currentTime || 0) + 0.7;
      this.layers.forEach((layer) => {
        Object.values(layer).forEach((n) => {
          try { n.stop && n.stop(stopAt); } catch (_) {}
        });
      });
    } catch (_) {}
    setTimeout(() => {
      try { this.ctx && this.ctx.close(); } catch (_) {}
      this.ctx = null; this.master = null; this.layers = []; this.started = false;
    }, 900);
  }
}

export const createNatureSoundController = () => new NatureSounds();
