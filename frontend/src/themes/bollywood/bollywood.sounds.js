/**
 * Bollywood Luxury — Procedural Web Audio
 * Dramatic orchestral string swell — ascending C major arpeggio that peaks
 * for cinematic theatrical glamour.
 */

class BollywoodSounds {
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

  /** Subtle background suspense pad (low strings). */
  _startPad() {
    const ctx = this.ctx;
    const out = ctx.createGain();
    out.gain.value = 0.6;
    out.connect(this.master);

    // Low strings — A minor feel
    const freqs = [110, 165, 220];
    const oscs = freqs.map((f) => {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 700; lp.Q.value = 1;
      const g = ctx.createGain();
      g.gain.value = 0.05;
      o.connect(lp); lp.connect(g); g.connect(out);
      o.start();
      return { osc: o, gain: g };
    });

    this.nodes = { oscs, out };
  }

  /** Dramatic string swell — ascending C major notes peaking at the climax. */
  swell() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const notes = [
      { f: 261.63, t: 0.00, d: 2.2 }, // C
      { f: 329.63, t: 0.15, d: 2.1 }, // E
      { f: 392.00, t: 0.30, d: 2.0 }, // G
      { f: 523.25, t: 0.45, d: 1.9 }, // C
      { f: 659.25, t: 0.60, d: 1.8 }, // E
      { f: 783.99, t: 0.75, d: 1.6 }, // G
    ];
    notes.forEach(({ f, t, d }) => {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(800, t0 + t);
      lp.frequency.linearRampToValueAtTime(3000, t0 + t + 0.6);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t0 + t);
      g.gain.linearRampToValueAtTime(0.13, t0 + t + 0.1);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + t + d);
      o.connect(lp); lp.connect(g); g.connect(this.master);
      o.start(t0 + t); o.stop(t0 + t + d);
    });
  }

  /** Firework boom — short bass thump + bright crackle. */
  firework() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    // Bass thump
    const dur = 0.5;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 280;
    const g = ctx.createGain();
    g.gain.value = 0.5;
    src.connect(filter); filter.connect(g); g.connect(this.master);
    src.start(t0); src.stop(t0 + dur);

    // Bright crackle (high noise tail)
    setTimeout(() => {
      const t1 = this.ctx.currentTime;
      const cb = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
      const cd = cb.getChannelData(0);
      for (let i = 0; i < cd.length; i++) {
        cd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.18));
      }
      const cs = ctx.createBufferSource(); cs.buffer = cb;
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2800;
      const cg = ctx.createGain(); cg.gain.value = 0.25;
      cs.connect(hp); hp.connect(cg); cg.connect(this.master);
      cs.start(t1); cs.stop(t1 + 0.6);
    }, 80);
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
    } catch (_) {}
    setTimeout(() => {
      try { this.ctx && this.ctx.close(); } catch (_) {}
      this.ctx = null; this.master = null; this.nodes = null; this.started = false;
    }, 900);
  }
}

export const createBollywoodSoundController = () => new BollywoodSounds();
