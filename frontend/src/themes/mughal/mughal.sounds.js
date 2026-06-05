/**
 * Royal Mughal — Procedural Web Audio (Shehnai drone + wax crack)
 *
 * No audio files. All sounds synthesised in-browser.
 * Returns a controller you can start/stop/fade per stage.
 */

class MughalSounds {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.shehnaiNodes = null;
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
    if (this.ctx.state !== 'running') return false; // autoplay blocked
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.0;
    this.master.connect(this.ctx.destination);
    this._startShehnai();
    this.started = true;
    return true;
  }

  /** Sustained shehnai drone — sawtooth + filtered overtone + slow tremolo */
  _startShehnai() {
    const ctx = this.ctx;
    const out = ctx.createGain();
    out.gain.value = 1;
    out.connect(this.master);

    // Fundamental — Indian classical Sa (~261 Hz)
    const fundamental = ctx.createOscillator();
    fundamental.type = 'sawtooth';
    fundamental.frequency.value = 261.6;

    // Quint above — Pa (~392 Hz) - the classical drone interval
    const fifth = ctx.createOscillator();
    fifth.type = 'sawtooth';
    fifth.frequency.value = 392.0;

    // Octave double for richness
    const octave = ctx.createOscillator();
    octave.type = 'sine';
    octave.frequency.value = 523.2;

    // Low-pass shaping to soften the sawtooth
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1400;
    lp.Q.value = 4;

    // Vibrato — gentle wave on the fundamental & fifth
    const vib = ctx.createOscillator();
    vib.frequency.value = 5.3; // 5.3 Hz vibrato
    const vibGain = ctx.createGain();
    vibGain.gain.value = 3.2;  // ± 3 Hz pitch wobble
    vib.connect(vibGain);
    vibGain.connect(fundamental.frequency);
    vibGain.connect(fifth.frequency);

    // Mix
    const mix = ctx.createGain();
    mix.gain.value = 0.18;
    fundamental.connect(mix);
    fifth.connect(mix);
    octave.connect(mix);

    mix.connect(lp);
    lp.connect(out);

    fundamental.start();
    fifth.start();
    octave.start();
    vib.start();

    this.shehnaiNodes = { fundamental, fifth, octave, vib, out };
  }

  /** Public alias for start() — used by opening components. */
  play() { return this.start(); }

  /** Fade volume to silent (without tearing down the audio graph). */
  mute() { this.fadeTo(0, 0.3); }

  /** Fade volume back to audible. */
  unmute() { this.fadeTo(0.8, 0.4); }

  /** Fade master gain to the given volume (0..1) over `dur` seconds. */
  fadeTo(volume, dur = 0.8) {
    if (!this.master || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(volume, now + dur);
  }

  /** Sharp crack — when the wax seal breaks in Stage 3. */
  crack() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const dur = 0.5;
    // Noise burst
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.08));
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1800;
    bp.Q.value = 2;
    const g = ctx.createGain();
    g.gain.value = 0.55;
    src.connect(bp); bp.connect(g); g.connect(ctx.destination);
    src.start();
    src.stop(ctx.currentTime + dur);
  }

  stop() {
    if (!this.shehnaiNodes) return;
    try {
      this.fadeTo(0, 0.6);
      const stopAt = (this.ctx?.currentTime || 0) + 0.7;
      Object.values(this.shehnaiNodes).forEach((n) => {
        try { n.stop && n.stop(stopAt); } catch (_) {}
      });
    } catch (_) {}
    setTimeout(() => {
      try { this.ctx && this.ctx.close(); } catch (_) {}
      this.ctx = null;
      this.master = null;
      this.shehnaiNodes = null;
      this.started = false;
    }, 900);
  }
}

export const createMughalSoundController = () => new MughalSounds();
