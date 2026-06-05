/**
 * Bengali Traditional — Procedural Web Audio
 * Shankha (conch) blow — high-pitched, sustained, spiritual.
 * The most authentic Bengali wedding sound.
 */

class BengaliSounds {
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

    this._startShankhaDrone();
    this.started = true;
    return true;
  }

  /** A soft sustained drone (between conch blows) — low atmospheric tone. */
  _startShankhaDrone() {
    const ctx = this.ctx;
    const out = ctx.createGain();
    out.gain.value = 0.7;
    out.connect(this.master);

    const drone1 = ctx.createOscillator();
    drone1.type = 'sine';
    drone1.frequency.value = 130; // low foundation

    const drone2 = ctx.createOscillator();
    drone2.type = 'sine';
    drone2.frequency.value = 195; // perfect 5th

    // Slow tremolo
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.25;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.06;
    lfo.connect(lfoGain);

    const droneMix = ctx.createGain();
    droneMix.gain.value = 0.10;
    lfoGain.connect(droneMix.gain);

    drone1.connect(droneMix);
    drone2.connect(droneMix);
    droneMix.connect(out);

    drone1.start();
    drone2.start();
    lfo.start();

    this.nodes = { drone1, drone2, lfo, out };
  }

  /** Shankha blow — the sweeping conch tone. */
  shankha() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const dur = 4.0;
    const t0 = ctx.currentTime;

    const out = ctx.createGain();
    out.connect(this.master);
    out.gain.setValueAtTime(0.0, t0);
    out.gain.linearRampToValueAtTime(0.55, t0 + 0.4);
    out.gain.setValueAtTime(0.55, t0 + 2.5);
    out.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

    // Fundamental — slides up then settles
    const fund = ctx.createOscillator();
    fund.type = 'sine';
    fund.frequency.setValueAtTime(280, t0);
    fund.frequency.exponentialRampToValueAtTime(720, t0 + 0.6);
    fund.frequency.exponentialRampToValueAtTime(600, t0 + 1.8);

    // Bright overtone (gives conch its piercing quality)
    const over = ctx.createOscillator();
    over.type = 'triangle';
    over.frequency.setValueAtTime(560, t0);
    over.frequency.exponentialRampToValueAtTime(1440, t0 + 0.6);
    over.frequency.exponentialRampToValueAtTime(1200, t0 + 1.8);

    // Breath noise (filtered noise — gives the "blowing" character)
    const breathBuf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const bd = breathBuf.getChannelData(0);
    for (let i = 0; i < bd.length; i++) bd[i] = (Math.random() * 2 - 1) * 0.4;
    const breath = ctx.createBufferSource();
    breath.buffer = breathBuf;
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 2000;
    bandpass.Q.value = 1.5;
    const breathGain = ctx.createGain();
    breathGain.gain.value = 0.15;

    const fundGain = ctx.createGain();
    fundGain.gain.value = 0.7;
    const overGain = ctx.createGain();
    overGain.gain.value = 0.25;

    fund.connect(fundGain); fundGain.connect(out);
    over.connect(overGain); overGain.connect(out);
    breath.connect(bandpass); bandpass.connect(breathGain); breathGain.connect(out);

    fund.start(t0); fund.stop(t0 + dur);
    over.start(t0); over.stop(t0 + dur);
    breath.start(t0);
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
      this.ctx = null;
      this.master = null;
      this.nodes = null;
      this.started = false;
    }, 900);
  }
}

export const createBengaliSoundController = () => new BengaliSounds();
