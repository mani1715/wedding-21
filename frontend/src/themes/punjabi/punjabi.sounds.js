/**
 * Punjabi Sangeet — Procedural Web Audio
 * Repeating dhol beat pattern + sharp bass hit on cue.
 */

class PunjabiSounds {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.beatTimer = null;
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

    this._startBeatLoop();
    this.started = true;
    return true;
  }

  /** Single dhol hit — noise burst → low-pass filter → exponential decay. */
  _hit(when, { type = 'bass' } = {}) {
    const ctx = this.ctx;
    const dur = type === 'bass' ? 0.45 : 0.20;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    const decay = type === 'bass' ? 0.08 : 0.03;
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * decay));
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = type === 'bass' ? 220 : 1200;
    filter.Q.value = type === 'bass' ? 2 : 4;
    const g = ctx.createGain();
    g.gain.value = type === 'bass' ? 0.55 : 0.30;
    src.connect(filter); filter.connect(g); g.connect(this.master);
    src.start(when);
    src.stop(when + dur);
  }

  /** Loop the bhangra-style dhol pattern using setInterval. */
  _startBeatLoop() {
    // BHANGRA pattern (in 8): BASS . SLAP BASS . SLAP . SLAP
    const bpm = 110;
    const beatMs = (60 / bpm) * 1000 / 2; // 8th-note grid
    const pattern = ['bass', null, 'slap', 'bass', null, 'slap', null, 'slap'];
    let i = 0;
    this.beatTimer = setInterval(() => {
      const cell = pattern[i % pattern.length];
      if (cell) this._hit(this.ctx.currentTime, { type: cell });
      i++;
    }, beatMs);
  }

  /** Big celebratory burst on Stage 3 (the EXPLOSION moment). */
  bigHit() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this._hit(t,         { type: 'bass' });
    this._hit(t + 0.06,  { type: 'slap' });
    this._hit(t + 0.14,  { type: 'bass' });
    this._hit(t + 0.22,  { type: 'slap' });
  }

  fadeTo(volume, dur = 0.8) {
    if (!this.master || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(volume, now + dur);
  }

  stop() {
    if (this.beatTimer) { clearInterval(this.beatTimer); this.beatTimer = null; }
    try { this.fadeTo(0, 0.6); } catch (_) {}
    setTimeout(() => {
      try { this.ctx && this.ctx.close(); } catch (_) {}
      this.ctx = null;
      this.master = null;
      this.started = false;
    }, 800);
  }
}

export const createPunjabiSoundController = () => new PunjabiSounds();
