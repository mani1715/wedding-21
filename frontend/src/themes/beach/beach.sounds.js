/**
 * Beach Destination — Procedural Web Audio
 * Ocean wave ambience — multiple filtered noise sources with slow amplitude
 * modulation (sounds like waves rolling in and breaking).
 */

class BeachSounds {
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

    this._startWaves();
    this.started = true;
    return true;
  }

  /** Layered ocean waves — pink-ish noise band-passed and slowly modulated. */
  _startWaves() {
    const ctx = this.ctx;
    const out = ctx.createGain();
    out.gain.value = 0.8;
    out.connect(this.master);

    // Long noise buffer
    const dur = 8;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buf.getChannelData(0);
    // Pink-ish noise generation (simple approximation)
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.0990460;
      b1 = 0.96300 * b1 + white * 0.2965164;
      b2 = 0.57000 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.18;
    }

    // Layer 1 — low rumble (deep waves)
    const src1 = ctx.createBufferSource();
    src1.buffer = buf; src1.loop = true;
    const filt1 = ctx.createBiquadFilter();
    filt1.type = 'lowpass'; filt1.frequency.value = 600; filt1.Q.value = 0.5;
    const g1 = ctx.createGain(); g1.gain.value = 0.5;
    const lfo1 = ctx.createOscillator(); lfo1.frequency.value = 0.12;
    const lfo1Gain = ctx.createGain(); lfo1Gain.gain.value = 0.35;
    lfo1.connect(lfo1Gain); lfo1Gain.connect(g1.gain);
    src1.connect(filt1); filt1.connect(g1); g1.connect(out);

    // Layer 2 — mid hiss (wave crests)
    const src2 = ctx.createBufferSource();
    src2.buffer = buf; src2.loop = true;
    const filt2 = ctx.createBiquadFilter();
    filt2.type = 'bandpass'; filt2.frequency.value = 1800; filt2.Q.value = 0.7;
    const g2 = ctx.createGain(); g2.gain.value = 0.18;
    const lfo2 = ctx.createOscillator(); lfo2.frequency.value = 0.22;
    const lfo2Gain = ctx.createGain(); lfo2Gain.gain.value = 0.15;
    lfo2.connect(lfo2Gain); lfo2Gain.connect(g2.gain);
    src2.connect(filt2); filt2.connect(g2); g2.connect(out);

    src1.start(); src2.start(); lfo1.start(); lfo2.start();
    this.nodes = { src1, src2, lfo1, lfo2, out };
  }

  /** Sunrise chime — soft bell when the sun rises in stage 4. */
  chime() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const partials = [
      { f: 880, g: 0.20, d: 3.0 },
      { f: 1320, g: 0.10, d: 2.5 },
      { f: 1760, g: 0.06, d: 2.0 },
    ];
    partials.forEach(({ f, g, d }) => {
      const o = ctx.createOscillator();
      o.type = 'sine'; o.frequency.value = f;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(g, t0 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + d);
      o.connect(gain); gain.connect(this.master);
      o.start(t0); o.stop(t0 + d);
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

export const createBeachSoundController = () => new BeachSounds();
