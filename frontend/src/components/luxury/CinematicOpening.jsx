/**
 * Prompt 02 — Cinematic Wedding Invitation Opening (5 stages)
 *
 * Stage 1 (0 → 2.5 s)  Black + gold dust particles rising
 * Stage 2 (2.5 → 5 s)  3D wax seal rises and rotates (burgundy + gold)
 * Stage 3 (5 → 7.5 s)  Seal cracks + 50 particles burst outward with gravity
 * Stage 4 (7.5 → 10 s) 3D envelope unfolds (ivory plane), gold light sweep
 * Stage 5 (10 → 13.5s) Card rises + couple names letter-by-letter reveal
 *
 * Built entirely with CSS 3D transforms + Framer Motion (no Three.js dependency)
 * for maximum reliability across browsers.
 *
 * Music: procedurally-synthesized shehnai-like drone via Web Audio API.
 *   Stage 1 → volume 0.20 (gentle)
 *   Stage 3 → swell to 0.42 (seal break drama)
 *   Stage 5 → settle to 0.18 (ambient)
 * Autoplay-blocked fallback → "Enable Sound" button before Stage 1.
 *
 * Plays every visit. Skip button appears after 2 s.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SkipForward, Volume2, VolumeX } from 'lucide-react';

const STAGE_TIMES = [0, 2500, 5000, 7500, 10000, 13500]; // ms boundaries
const TOTAL = STAGE_TIMES[STAGE_TIMES.length - 1];

// ────────────────────────────────────────────────────────────────────────────
//  WEB AUDIO — procedural shehnai drone
// ────────────────────────────────────────────────────────────────────────────
class ShehnaiDrone {
  constructor() { this.ctx = null; this.master = null; this.started = false; }
  async start() {
    if (this.started) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    if (this.ctx.state === 'suspended') { try { await this.ctx.resume(); } catch (_) {} }
    if (this.ctx.state !== 'running') return; // Autoplay blocked

    this.master = this.ctx.createGain();
    this.master.gain.value = 0.0001;
    this.master.connect(this.ctx.destination);

    const delay = this.ctx.createDelay();
    delay.delayTime.value = 0.32;
    const fb = this.ctx.createGain();
    fb.gain.value = 0.28;
    delay.connect(fb).connect(delay);
    delay.connect(this.master);

    const layers = [
      { type: 'sawtooth', freq: 196,    gain: 0.06,  detune: 0 },
      { type: 'sine',     freq: 293.66, gain: 0.05,  detune: 0 },
      { type: 'triangle', freq: 392,    gain: 0.035, detune: 6 },
      { type: 'sine',     freq: 587.33, gain: 0.025, detune: -4 },
    ];
    layers.forEach((l) => {
      const o = this.ctx.createOscillator();
      o.type = l.type; o.frequency.value = l.freq; o.detune.value = l.detune;
      const g = this.ctx.createGain();
      g.gain.value = l.gain;
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.18 + Math.random() * 0.12;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 0.015;
      lfo.connect(lfoGain).connect(g.gain);
      lfo.start();
      o.connect(g).connect(this.master);
      o.connect(g).connect(delay);
      o.start();
    });
    this.started = true;
    this.setVolume(0.2);
  }
  setVolume(v) {
    if (!this.master || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.linearRampToValueAtTime(Math.max(0.0001, v), now + 0.6);
  }
  swell()  { this.setVolume(0.42); }
  settle() { this.setVolume(0.18); }
  stop() {
    if (!this.ctx || !this.master) return;
    try {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.linearRampToValueAtTime(0.0001, now + 1.0);
      setTimeout(() => { try { this.ctx.close(); } catch (_) {} }, 1100);
    } catch (_) {}
  }
}

// ────────────────────────────────────────────────────────────────────────────
//  WAX SEAL (CSS 3D) — Stage 2 & 3
// ────────────────────────────────────────────────────────────────────────────
const WaxSeal3D = ({ stage, monogram = 'A&R' }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center"
         style={{ perspective: 1200, perspectiveOrigin: '50% 50%' }}>
      <AnimatePresence>
        {(stage === 2 || stage === 3) && (
          <motion.div
            key="seal"
            initial={{ y: 280, opacity: 0, rotateX: 35, scale: 0.6 }}
            animate={
              stage === 2
                ? { y: 0, opacity: 1, rotateX: 0, scale: 1, rotateY: [0, 360] }
                : { y: 0, opacity: [1, 1, 0], scale: [1, 1.08, 0.7], rotateZ: [0, -3, 4, -2, 0] }
            }
            exit={{ opacity: 0, scale: 0 }}
            transition={
              stage === 2
                ? { duration: 2.2, rotateY: { duration: 2.4, ease: 'linear' }, ease: [0.22, 1, 0.36, 1] }
                : { duration: 2.0, times: [0, 0.6, 1], ease: [0.4, 0, 0.6, 1] }
            }
            className="relative"
            style={{ transformStyle: 'preserve-3d', width: 180, height: 180 }}
          >
            {/* Outer wax disc — burgundy with gold rim */}
            <div className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #6B1438 0%, #4A0E2A 55%, #2A0414 100%)',
                border: '4px solid transparent',
                backgroundClip: 'padding-box, border-box',
                backgroundImage: `
                  radial-gradient(circle at 30% 30%, #6B1438 0%, #4A0E2A 55%, #2A0414 100%),
                  linear-gradient(135deg, #F0D67E 0%, #D4AF37 50%, #8C6A1A 100%)
                `,
                backgroundOrigin: 'border-box',
                boxShadow: `
                  0 30px 80px rgba(74,14,42,0.6),
                  inset -8px -10px 30px rgba(0,0,0,0.55),
                  inset 6px 6px 20px rgba(255,180,180,0.18),
                  0 0 60px rgba(212,175,55,0.45)
                `,
              }}
            />
            {/* Gold outer ring decorative */}
            <div className="absolute inset-2 rounded-full pointer-events-none"
              style={{ border: '1.5px solid rgba(212,175,55,0.55)', boxShadow: 'inset 0 0 20px rgba(212,175,55,0.25)' }}
            />
            {/* Engraved monogram */}
            <div className="absolute inset-0 flex items-center justify-center font-display italic"
              style={{
                fontSize: 56,
                color: 'transparent',
                background: 'linear-gradient(180deg, #F0D67E 0%, #D4AF37 60%, #8C6A1A 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                textShadow: '0 2px 6px rgba(0,0,0,0.5)',
                letterSpacing: '0.05em',
              }}
            >
              {monogram}
            </div>

            {/* Crack lines appear in stage 3 */}
            {stage === 3 && (
              <>
                {[0, 60, 120, 180, 240, 300].map((rot, i) => (
                  <motion.span
                    key={rot}
                    initial={{ scaleY: 0, opacity: 0 }}
                    animate={{ scaleY: 1, opacity: [0, 0.9, 0.4] }}
                    transition={{ delay: i * 0.05, duration: 0.6 }}
                    className="absolute left-1/2 top-1/2 origin-top"
                    style={{
                      width: 2,
                      height: 80,
                      background: 'linear-gradient(180deg, transparent, #2A0414 35%, #2A0414 100%)',
                      transform: `translateX(-50%) translateY(0) rotate(${rot}deg)`,
                      filter: 'blur(0.5px)',
                    }}
                  />
                ))}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage 3: particle burst (50 shards) */}
      <AnimatePresence>
        {stage === 3 && <ShardBurst />}
      </AnimatePresence>
    </div>
  );
};

const ShardBurst = () => {
  const shards = useMemo(() =>
    Array.from({ length: 50 }, (_, i) => ({
      angle: (i / 50) * 360 + Math.random() * 20,
      distance: 220 + Math.random() * 360,
      size: 6 + Math.random() * 12,
      gold: i % 3 === 0,
      duration: 1.6 + Math.random() * 0.8,
      delay: Math.random() * 0.25,
    })), []);

  return (
    <>
      {shards.map((s, i) => {
        const rad = (s.angle * Math.PI) / 180;
        const dx = Math.cos(rad) * s.distance;
        const dy = Math.sin(rad) * s.distance - 150; // initial up + then gravity
        return (
          <motion.span
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
            animate={{
              x: dx,
              y: dy + 480,                     // gravity pulls down
              rotate: Math.random() * 720,
              opacity: [1, 1, 0],
              scale: [1, 1, 0.4],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: s.duration, delay: s.delay, ease: [0.2, 0.5, 0.4, 1] }}
            className="absolute pointer-events-none"
            style={{
              width: s.size,
              height: s.size,
              background: s.gold
                ? 'linear-gradient(135deg, #F0D67E, #D4AF37, #8C6A1A)'
                : 'linear-gradient(135deg, #6B1438, #4A0E2A, #1A0410)',
              clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
              boxShadow: s.gold ? '0 0 12px rgba(212,175,55,0.7)' : '0 0 8px rgba(74,14,42,0.6)',
            }}
          />
        );
      })}
    </>
  );
};

// ────────────────────────────────────────────────────────────────────────────
//  GOLD-DUST particles (stage 1, persistent through later stages)
// ────────────────────────────────────────────────────────────────────────────
function GoldDust() {
  const dust = useMemo(() =>
    Array.from({ length: 60 }, () => ({
      left: Math.random() * 100,
      duration: 6 + Math.random() * 6,
      delay: Math.random() * 4,
      size: 1.5 + Math.random() * 3,
    })), []);
  return (
    <>
      {dust.map((d, i) => (
        <motion.span
          key={i}
          initial={{ y: '110vh', opacity: 0 }}
          animate={{ y: '-12vh', opacity: [0, 0.85, 0] }}
          transition={{ duration: d.duration, delay: d.delay, repeat: Infinity, ease: 'linear' }}
          className="absolute pointer-events-none"
          style={{
            left: `${d.left}%`,
            width: d.size,
            height: d.size,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #F0D67E, transparent 70%)',
            boxShadow: '0 0 8px rgba(212,175,55,0.7)',
            filter: 'blur(0.4px)',
          }}
        />
      ))}
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
//  ENVELOPE UNFOLD — Stage 4
// ────────────────────────────────────────────────────────────────────────────
function EnvelopeUnfold({ active }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="relative" style={{ width: 480, height: 320, perspective: 1400 }}>
            <div className="absolute inset-0 rounded-md"
              style={{
                background: 'linear-gradient(135deg, #F5F0E8 0%, #ECE2C9 100%)',
                boxShadow: '0 30px 80px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(212,175,55,0.4)',
              }} />
            <motion.div
              initial={{ rotateX: 0 }}
              animate={{ rotateX: -180 }}
              transition={{ duration: 1.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-0 right-0 origin-top"
              style={{
                top: 0,
                height: '55%',
                background: 'linear-gradient(180deg, #F5F0E8, #E8DFC8)',
                clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                boxShadow: 'inset 0 -8px 14px rgba(0,0,0,0.06)',
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
              }} />
            <motion.div
              initial={{ x: '-120%', opacity: 0 }}
              animate={{ x: '120%', opacity: [0, 0.9, 0] }}
              transition={{ duration: 1.8, delay: 0.7 }}
              className="absolute inset-0 overflow-hidden rounded-md pointer-events-none">
              <div style={{
                position: 'absolute', top: 0, bottom: 0, left: 0, width: '40%',
                background: 'linear-gradient(90deg, transparent, rgba(255,235,180,0.85), transparent)',
                transform: 'skewX(-12deg)', filter: 'blur(8px)',
              }} />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ────────────────────────────────────────────────────────────────────────────
//  CARD REVEAL — Stage 5 (couple names letter by letter)
// ────────────────────────────────────────────────────────────────────────────
function CardReveal({ active, bride, groom, date }) {
  const fullName = `${bride || ''} & ${groom || ''}`;
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ y: 80, opacity: 0, filter: 'blur(8px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 flex items-center justify-center px-6"
        >
          <div className="relative max-w-xl w-full text-center">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.2, delay: 0.2 }}
              className="mx-auto mb-7 h-px origin-center"
              style={{ width: 220, background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)' }} />
            <motion.p
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="text-[0.7rem] tracking-[0.55em] uppercase"
              style={{ color: 'rgba(255,248,220,0.7)' }}>
              You are warmly invited
            </motion.p>
            <h1 className="font-display text-[2.4rem] md:text-[4.5rem] leading-[1.05] my-4" style={{ color: '#FFF8DC' }}>
              {fullName.split('').map((ch, i) => (
                <motion.span key={i}
                  initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ delay: 0.8 + i * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  style={{ display: 'inline-block' }}>
                  {ch === ' ' ? '\u00A0' : ch === '&' ? <span className="font-script italic text-gold mx-2">&amp;</span> : ch}
                </motion.span>
              ))}
            </h1>
            {date && (
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: 0.8 }}
                className="font-heading text-base md:text-lg tracking-[0.3em] uppercase"
                style={{ color: 'rgba(255,248,220,0.75)' }}>
                {date}
              </motion.p>
            )}
            <motion.div
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.2, delay: 1.6 }}
              className="mx-auto mt-7 h-px origin-center"
              style={{ width: 220, background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)' }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ────────────────────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ────────────────────────────────────────────────────────────────────────────
const CinematicOpening = ({ bride = '', groom = '', date = '', monogram = 'A&R', onComplete }) => {
  const [stage, setStage] = useState(1);
  const [showSkip, setShowSkip] = useState(false);
  const [done, setDone] = useState(false);
  const [needSound, setNeedSound] = useState(true);
  const [muted, setMuted] = useState(false);
  const drone = useMemo(() => new ShehnaiDrone(), []);
  const skipTimer = useRef(null);

  useEffect(() => {
    const timers = STAGE_TIMES.slice(1).map((ms, idx) =>
      setTimeout(() => {
        const s = idx + 2;
        setStage(s);
        if (s === 3) drone.swell();
        else if (s === 5) drone.settle();
      }, ms)
    );
    const finish = setTimeout(() => {
      setDone(true);
      drone.stop();
      onComplete?.();
    }, TOTAL + 500);
    skipTimer.current = setTimeout(() => setShowSkip(true), 2000);

    // Try silent autoplay
    drone.start().then(() => setNeedSound(false)).catch(() => {});

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(finish);
      clearTimeout(skipTimer.current);
      drone.stop();
    };
    // eslint-disable-next-line
  }, []);

  const enableSound = async () => {
    setNeedSound(false);
    await drone.start();
  };

  const skip = () => {
    setDone(true);
    drone.stop();
    onComplete?.();
  };

  const toggleMute = () => {
    setMuted((m) => {
      const nm = !m;
      drone.setVolume(nm ? 0.0001 : 0.22);
      return nm;
    });
  };

  if (done) return null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9 }}
      className="fixed inset-0 z-[120] overflow-hidden"
      style={{ background: '#06040A' }}
      data-testid="cinematic-opening"
    >
      <GoldDust />

      <WaxSeal3D stage={stage} monogram={monogram} />
      <EnvelopeUnfold active={stage === 4} />
      <CardReveal active={stage === 5} bride={bride} groom={groom} date={date} />

      {/* Subtle vignette */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 50% 55%, transparent 50%, rgba(0,0,0,0.65) 100%)' }} />

      {/* Stage progress dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {[1, 2, 3, 4, 5].map((s) => (
          <motion.div key={s}
            animate={{
              width: stage === s ? 26 : 8,
              background: stage >= s ? '#D4AF37' : 'rgba(255,255,255,0.18)',
            }}
            transition={{ duration: 0.6 }}
            className="h-1 rounded-full" />
        ))}
      </div>

      {!needSound && (
        <button onClick={toggleMute}
          className="absolute bottom-6 right-6 z-10 w-11 h-11 rounded-full grid place-items-center transition-all hover:scale-110"
          style={{ background: 'rgba(14,10,6,0.6)', border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37', backdropFilter: 'blur(6px)' }}
          data-testid="opening-mute"
          aria-label="Toggle sound">
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      )}

      <AnimatePresence>
        {needSound && (
          <motion.button
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            onClick={enableSound}
            className="absolute bottom-6 right-6 z-10 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs tracking-[0.18em] uppercase"
            style={{
              background: 'linear-gradient(135deg, rgba(212,175,55,0.18), rgba(139,0,0,0.22))',
              border: '1px solid rgba(212,175,55,0.55)',
              color: '#FFE6A8',
              backdropFilter: 'blur(6px)',
            }}
            data-testid="opening-enable-sound">
            <Volume2 className="w-3.5 h-3.5" /> Enable Sound
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSkip && (
          <motion.button
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            onClick={skip}
            className="absolute top-6 right-6 z-10 inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] tracking-[0.3em] uppercase"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: 'rgba(255,248,220,0.78)',
              backdropFilter: 'blur(8px)',
            }}
            data-testid="opening-skip">
            <SkipForward className="w-3 h-3" /> Skip
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CinematicOpening;
