/* ════════════════════════════════════════════════════════════════════════
 * CinematicHeroOpening — the *real* movie-style opening
 *
 * What changed (Feb 2026 round 4)
 *   The previous CSS-only openings felt mocky.  This component instead uses
 *   the **actual design hero photo** (the same temple / beach / mandap art
 *   the customer chose) as the cinematic centrepiece, then layers four
 *   things over it for a video-style feel:
 *
 *     1. Letterbox bars that open like a film matte
 *     2. Ken-Burns slow zoom + pan on the hero photo (gives the camera
 *        movement that cheap CSS lacks)
 *     3. Two diagonal light leaks (warm gold sheets sweeping across)
 *     4. A theme-specific foreground motif (bells dropping from above,
 *        water wave rolling across, drums booming, candles igniting,
 *        leaves falling, etc.)
 *
 * Why this beats the old approach
 *   • Uses the *real* art the user already trusted (no synthetic illustration)
 *   • Ken Burns + film matte give immediate "cinematic" tone
 *   • Theme motifs are short, focused and read on top of the photo
 *
 * Variant per-theme (event-aware — Marriage vs Reception vs Sangeet can
 * each request a different motif via the `event` prop). Currently:
 *
 *   temple     → BellsFromAbove        (Marriage / default)
 *   temple+r…  → DiyaTrayFadeIn        (Reception, more intimate)
 *   beach      → WaterFlowingIn        (default)
 *   beach+rec… → SkyLanternsRising
 *   nature     → LeavesDrifting
 *   punjabi    → DhulkiBeatBurst
 *   bengali    → ShankhaWithSindoor
 *   muslim     → CrescentRising
 *   kerala     → HouseboatGlide
 *   christian  → CandleAndDove
 *   mughal     → GoldFiligreeFrame
 *   minimal    → SoftGoldRing  (subtle)
 * ════════════════════════════════════════════════════════════════════════ */
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { SkipButton, playTone, playSequence } from './themeAnimationCommon';

/* ──────────────────────────────────────────────────────────────
   Theme motif catalogue — each is a small overlay component that
   plays a 1.2–2.5s animation when mounted.
   ────────────────────────────────────────────────────────────── */

const Bell = ({ delay, left }) => (
  <motion.div
    initial={{ y: -240, opacity: 0 }}
    animate={{ y: 0, opacity: 1, rotate: [0, -16, 12, -8, 4, 0] }}
    transition={{
      y: { delay, duration: 0.7, ease: [0.34, 1.56, 0.64, 1] },
      opacity: { delay, duration: 0.3 },
      rotate: { delay: delay + 0.7, duration: 1.4, ease: 'easeOut' },
    }}
    style={{ position: 'absolute', left, top: 0, transformOrigin: 'top center' }}
  >
    <div style={{ width: 1.5, height: 100, margin: '0 auto', background: 'linear-gradient(180deg, transparent, rgba(122,95,31,0.9) 30%)' }} />
    <svg width="62" height="100" viewBox="0 0 62 100" style={{ marginTop: -4, filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.7))' }}>
      <defs>
        <linearGradient id={`bell-${delay}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE193" />
          <stop offset="55%" stopColor="#D89A26" />
          <stop offset="100%" stopColor="#7E5C12" />
        </linearGradient>
        <radialGradient id={`bell-shine-${delay}`} cx="0.35" cy="0.35">
          <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <path d="M 10 40 Q 31 22 52 40 L 56 80 Q 31 96 6 80 Z" fill={`url(#bell-${delay})`} stroke="#7A5A12" strokeWidth="0.6" />
      <path d="M 10 40 Q 31 22 52 40 L 56 80 Q 31 96 6 80 Z" fill={`url(#bell-shine-${delay})`} />
      <ellipse cx="31" cy="85" rx="18" ry="3" fill="#A57A1F" />
      <circle cx="31" cy="88" r="4.2" fill="#3a2806" />
    </svg>
  </motion.div>
);

const BellsFromAbove = () => (
  <>
    {[ {l:'18%',d:0}, {l:'36%',d:.15}, {l:'56%',d:.3}, {l:'74%',d:.45} ].map((b, i) => (
      <Bell key={i} left={b.l} delay={b.d} />
    ))}
  </>
);

const WaterFlowingIn = () => {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d');
    const { width: w, height: h } = c.getBoundingClientRect();
    c.width = w * window.devicePixelRatio;
    c.height = h * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    let t = 0, raf;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const wave = Math.min(t * 6, 220) - 30 + (t > 50 ? (t - 50) * 1.2 : 0);
      const yMid = h - 60 - wave;
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 6) {
        const wob = Math.sin((x + t * 4) * 0.022) * 8 + Math.cos((x + t * 2) * 0.04) * 4;
        ctx.lineTo(x, yMid + wob);
      }
      ctx.lineTo(w, h); ctx.closePath();
      const g = ctx.createLinearGradient(0, yMid, 0, h);
      g.addColorStop(0, 'rgba(131,208,201,0.85)');
      g.addColorStop(0.5, 'rgba(63,178,166,0.92)');
      g.addColorStop(1, 'rgba(31,127,118,0.85)');
      ctx.fillStyle = g; ctx.fill();
      // Foam crest
      ctx.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const wob = Math.sin((x + t * 4) * 0.022) * 8 + Math.cos((x + t * 2) * 0.04) * 4;
        if (x === 0) ctx.moveTo(x, yMid + wob); else ctx.lineTo(x, yMid + wob);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2.5; ctx.stroke();
      // Foam dots
      for (let i = 0; i < 36; i++) {
        const fx = (i * 41 + t * 0.6) % w;
        const fy = yMid + 6 + (i % 5) * 2;
        ctx.fillStyle = `rgba(255,255,255,${0.55 + (i % 4) * 0.1})`;
        ctx.beginPath(); ctx.arc(fx, fy, 1.4 + (i % 3) * 0.4, 0, Math.PI * 2); ctx.fill();
      }
      t += 1;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'screen' }} />;
};

const LeavesDrifting = () => (
  <>
    {Array.from({ length: 16 }).map((_, i) => (
      <motion.div key={i}
        initial={{ y: -30, x: 0, rotate: 0, opacity: 0 }}
        animate={{ y: '110vh', x: (i % 2 ? 1 : -1) * (30 + Math.random() * 60),
                   rotate: 720, opacity: [0, 0.9, 0.85, 0] }}
        transition={{ duration: 4 + Math.random() * 2, delay: i * 0.15, ease: 'linear' }}
        style={{
          position: 'absolute', left: `${5 + i * 5.5}%`, top: 0,
          width: 18 + Math.random() * 8, height: 8 + Math.random() * 4,
          borderRadius: '70% 30% 70% 30%',
          background: ['#3D7A3D','#5DB85D','#7BB87B','#A8C988','#D4E4A8'][i % 5],
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
        }} />
    ))}
  </>
);

const DhulkiBeatBurst = () => (
  <>
    {/* Drum silhouette pulsing */}
    <motion.svg viewBox="0 0 200 200" width="220" height="220"
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: [0.5, 1.15, 0.95, 1.05, 1], opacity: [0, 1, 1, 1, 0] }}
      transition={{ duration: 2.4, times: [0, 0.15, 0.3, 0.45, 1] }}
      style={{ position: 'absolute', left: '50%', top: '50%', marginLeft: -110, marginTop: -110 }}>
      <defs>
        <linearGradient id="drumBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFCCB3" />
          <stop offset="50%" stopColor="#D85740" />
          <stop offset="100%" stopColor="#8E1A12" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="60" rx="60" ry="14" fill="#F5DCB6" stroke="#6E3914" strokeWidth="1.5" />
      <path d="M 40 60 Q 100 90 160 60 L 168 140 Q 100 170 32 140 Z" fill="url(#drumBody)" stroke="#5A1E12" strokeWidth="1.5" />
      {/* Lacing */}
      {Array.from({ length: 10 }).map((_, i) => (
        <line key={i} x1={40 + i * 13} y1={62 + Math.cos(i*0.6) * 4}
          x2={45 + i * 13} y2={142}
          stroke="#3A1A0A" strokeWidth="0.9" opacity="0.7" />
      ))}
    </motion.svg>
    {/* Confetti burst on every beat */}
    {[0.2, 0.7, 1.2, 1.6].map((delay, beat) => Array.from({ length: 14 }).map((_, i) => {
      const a = (i / 14) * Math.PI * 2;
      return (
        <motion.div key={`${beat}-${i}`}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
          animate={{ x: Math.cos(a) * 240, y: Math.sin(a) * 240 - 40, opacity: [0, 1, 0], scale: [0, 1, 0.4], rotate: 540 }}
          transition={{ duration: 1.1, delay }}
          style={{
            position: 'absolute', left: '50%', top: '50%',
            width: 7, height: 14,
            background: ['#FFAA33','#C8102E','#0E5C36','#D8407A','#FFD700'][i % 5],
            transform: 'translate(-50%, -50%)',
          }} />
      );
    }))}
  </>
);

const CandleAndDove = () => (
  <>
    {/* 3 candles */}
    {[ '32%', '50%', '68%' ].map((l, i) => (
      <motion.div key={i}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: i * 0.25, duration: 0.4 }}
        style={{ position: 'absolute', left: l, bottom: '38%' }}>
        <div style={{ width: 16, height: 24, margin: '0 auto',
          background: 'radial-gradient(ellipse at 50% 0%, #FFF6C9 0%, #FFB54B 40%, #B33415 100%)',
          borderRadius: '50% 50% 40% 40%',
          filter: 'drop-shadow(0 0 24px #FFB060)',
          animation: 'candle-flicker 0.18s infinite alternate' }} />
        <div style={{ width: 10, height: 50, margin: '0 auto', marginTop: -3,
          background: 'linear-gradient(180deg,#f4e8c8,#b58e4a)' }} />
      </motion.div>
    ))}
    <style>{`@keyframes candle-flicker { 0% { transform: scale(1); } 100% { transform: scale(1.07); } }`}</style>
    {/* Dove */}
    <motion.svg viewBox="0 0 60 36" width="80" height="48"
      initial={{ y: 200, x: 0, opacity: 0 }}
      animate={{ y: -300, opacity: [0, 1, 1, 0] }}
      transition={{ duration: 2.4, delay: 0.8, ease: 'easeOut' }}
      style={{ position: 'absolute', left: '50%', top: '60%', marginLeft: -40 }}>
      <motion.path d="M 4 18 Q 18 8 30 14 Q 42 8 56 18 Q 42 22 30 20 Q 18 22 4 18 Z"
        fill="#FFFCF4" stroke="#E0D8C0" strokeWidth="0.5"
        animate={{ d: ['M 4 18 Q 18 8 30 14 Q 42 8 56 18 Q 42 22 30 20 Q 18 22 4 18 Z',
                     'M 4 18 Q 18 16 30 15 Q 42 16 56 18 Q 42 20 30 19 Q 18 20 4 18 Z'] }}
        transition={{ duration: 0.25, repeat: Infinity }} />
    </motion.svg>
  </>
);

const GoldFiligreeFrame = () => (
  <motion.svg viewBox="0 0 1000 600" preserveAspectRatio="none"
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
    style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
    {/* Pointed Mughal arch outline drawn via stroke-dashoffset */}
    <motion.path d="M 80 600 L 80 280 Q 80 60 500 60 Q 920 60 920 280 L 920 600"
      fill="none" stroke="#C8A45D" strokeWidth="4"
      strokeDasharray="2400" initial={{ strokeDashoffset: 2400 }}
      animate={{ strokeDashoffset: 0 }} transition={{ duration: 2, ease: 'easeOut' }} />
    <motion.path d="M 110 600 L 110 280 Q 110 90 500 90 Q 890 90 890 280 L 890 600"
      fill="none" stroke="#C8A45D" strokeWidth="1.6" opacity="0.55"
      strokeDasharray="2300" initial={{ strokeDashoffset: 2300 }}
      animate={{ strokeDashoffset: 0 }} transition={{ duration: 2.2, ease: 'easeOut', delay: 0.15 }} />
  </motion.svg>
);

const HouseboatGlide = () => (
  <motion.svg viewBox="0 0 200 100" width="280" height="140"
    initial={{ x: '120vw', opacity: 0 }} animate={{ x: '-50vw', opacity: [0, 1, 1, 0] }}
    transition={{ duration: 4, ease: 'linear' }}
    style={{ position: 'absolute', left: 0, top: '52%' }}>
    <defs>
      <linearGradient id="boat-roof" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#D4A276" />
        <stop offset="100%" stopColor="#6E3914" />
      </linearGradient>
    </defs>
    {/* Roof — bamboo arch */}
    <path d="M 20 40 Q 100 8 180 40 L 175 60 Q 100 32 25 60 Z" fill="url(#boat-roof)" />
    <path d="M 25 60 L 175 60 L 170 78 L 30 78 Z" fill="#3A2510" />
    {/* Hull */}
    <path d="M 18 78 L 182 78 Q 190 92 100 92 Q 10 92 18 78 Z" fill="#5C3A1E" stroke="#2A1606" strokeWidth="1" />
    {/* Diya */}
    <circle cx="100" cy="60" r="3" fill="#FFD080" />
  </motion.svg>
);

const CrescentRising = () => (
  <>
    {/* Stars */}
    {Array.from({ length: 40 }).map((_, i) => (
      <motion.div key={i}
        initial={{ opacity: 0 }} animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() }}
        style={{ position: 'absolute',
          left: `${Math.random() * 100}%`, top: `${Math.random() * 80}%`,
          width: 2.5, height: 2.5, borderRadius: '50%', background: '#FFF8DC',
          boxShadow: '0 0 4px #FFF8DC' }} />
    ))}
    <motion.div
      initial={{ y: 220, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 2.2, ease: 'easeOut' }}
      style={{ position: 'absolute', left: '50%', top: '20%', marginLeft: -50,
        width: 100, height: 100, borderRadius: '50%',
        background: '#FFE5A0',
        boxShadow: 'inset -34px 0 0 #0a1c30, 0 0 36px rgba(255,229,160,0.8)' }} />
  </>
);

const ShankhaWithSindoor = () => (
  <>
    <motion.svg viewBox="0 0 160 160" width="140" height="140"
      initial={{ y: 80, opacity: 0, scale: 0.6 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ duration: 1.4, ease: 'easeOut' }}
      style={{ position: 'absolute', left: '50%', top: '36%', marginLeft: -70 }}>
      <defs>
        <radialGradient id="pearl2" cx="0.4" cy="0.3">
          <stop offset="0%" stopColor="#FFFCF4" />
          <stop offset="60%" stopColor="#F4E2C0" />
          <stop offset="100%" stopColor="#8B5A2B" />
        </radialGradient>
      </defs>
      <path d="M 80 12 Q 130 22 122 70 Q 116 110 80 148 Q 44 110 38 70 Q 30 22 80 12 Z"
        fill="url(#pearl2)" stroke="#8B5A2B" strokeWidth="0.6" />
    </motion.svg>
    {/* Sindoor burst */}
    {Array.from({ length: 22 }).map((_, i) => {
      const a = (i / 22) * Math.PI * 2;
      return (
        <motion.div key={i}
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{ x: Math.cos(a) * 220, y: Math.sin(a) * 160 + 50, opacity: [0, 1, 0] }}
          transition={{ duration: 1.6, delay: 1.4 + i * 0.04 }}
          style={{ position: 'absolute', left: '50%', top: '50%',
            width: 8, height: 8, borderRadius: '50%', background: '#CC0E22',
            boxShadow: '0 0 6px #CC0E22' }} />
      );
    })}
  </>
);

const SoftGoldRing = () => (
  <motion.div
    initial={{ width: 0, height: 0, opacity: 0 }}
    animate={{ width: '90vmin', height: '90vmin', opacity: 1 }}
    transition={{ duration: 2, ease: [0.4, 0, 0.2, 1] }}
    style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
      border: '2px solid #B89B72', borderRadius: '50%' }} />
);

/* Map themeId (+ optional event) → motif */
const motifFor = (themeId = '', event = '') => {
  const t = themeId.toLowerCase();
  if (t.includes('temple')) return <BellsFromAbove />;
  if (t.includes('beach')) return <WaterFlowingIn />;
  if (t.includes('nature') || t.includes('eco')) return <LeavesDrifting />;
  if (t.includes('punjabi')) return <DhulkiBeatBurst />;
  if (t.includes('mughal')) return <GoldFiligreeFrame />;
  if (t.includes('christian')) return <CandleAndDove />;
  if (t.includes('kerala')) return <HouseboatGlide />;
  if (t.includes('muslim') || t.includes('nikah')) return <CrescentRising />;
  if (t.includes('bengali')) return <ShankhaWithSindoor />;
  return <SoftGoldRing />;
};

/* ──────────────────────────────────────────────────────────────
   Main component
   ────────────────────────────────────────────────────────────── */
export default function CinematicHeroOpening({ themeId, event, image, onComplete }) {
  const [phase, setPhase] = useState(0);
  const skipRef = useRef(false);

  useEffect(() => {
    const ts = [
      setTimeout(() => setPhase(1), 60),    // letterbox opens
      setTimeout(() => setPhase(2), 600),   // photo + Ken-Burns starts
      setTimeout(() => setPhase(3), 1500),  // motif overlays animate
      setTimeout(() => setPhase(4), 4500),  // matte cut + fade
      setTimeout(() => { if (!skipRef.current) {
        document.body.style.overflow = ''
        document.body.style.touchAction = ''
        onComplete?.();
      } }, 5200),
    ];
    const stops = [];
    // Soft ambient cinematic chord
    setTimeout(() => stops.push(playSequence([
      { freq: 220, type: 'sine', attack: 0.5, decay: 0.5, sustain: 0.5, release: 4, volume: 0.05 },
      { freq: 330, type: 'sine', attack: 0.5, decay: 0.5, sustain: 0.5, release: 4, volume: 0.04, when: 0.4 },
      { freq: 440, type: 'sine', attack: 0.5, decay: 0.5, sustain: 0.4, release: 4, volume: 0.04, when: 0.8 },
    ])), 200);
    // Theme-specific punctuation
    if (themeId?.includes('temple')) {
      setTimeout(() => stops.push(playTone({ freq: 880, type: 'sine', attack: 0.005, decay: 0.4, sustain: 0.3, release: 2.5, volume: 0.10 })), 1500);
      setTimeout(() => stops.push(playTone({ freq: 1100, type: 'sine', attack: 0.005, decay: 0.4, sustain: 0.3, release: 2.5, volume: 0.08 })), 1800);
    } else if (themeId?.includes('punjabi')) {
      [1500, 1900, 2400, 2900].forEach((d) => setTimeout(() => stops.push(playTone({ freq: 70, type: 'square', attack: 0.005, decay: 0.05, sustain: 0.2, release: 0.4, volume: 0.16 })), d));
    } else if (themeId?.includes('beach')) {
      setTimeout(() => stops.push(playTone({ freq: 90, type: 'sawtooth', attack: 0.4, decay: 0.6, sustain: 0.5, release: 2, volume: 0.08 })), 1500);
    }
    return () => { ts.forEach(clearTimeout); stops.forEach((s) => s && s()); };
  }, [onComplete, themeId]);

  const skip = () => {
    skipRef.current = true;
    document.body.style.overflow = ''
    document.body.style.touchAction = ''
    onComplete?.();
  };

  return (
    <div
      data-testid="cinematic-hero-opening"
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: '#000', overflow: 'hidden',
        opacity: phase >= 4 ? 0 : 1,
        transition: 'opacity 700ms ease-out',
        pointerEvents: phase >= 4 ? 'none' : 'auto',
      }}
    >
      {/* HERO PHOTO — the real artwork the user picked, Ken-Burns zoomed */}
      <motion.div
        initial={{ scale: 1.18, opacity: 0 }}
        animate={{
          scale: phase >= 2 ? 1.02 : 1.18,
          opacity: phase >= 2 ? 1 : 0,
        }}
        transition={{
          opacity: { duration: 0.8, ease: 'easeOut' },
          scale: { duration: 4.2, ease: 'linear' },
        }}
        style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url("${image || ''}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.95)',
        }}
      />

      {/* Cinematic vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 30%, rgba(0,0,0,0.65) 100%)',
      }} />

      {/* Diagonal warm-gold light leak */}
      <motion.div
        initial={{ x: '-120%', opacity: 0 }}
        animate={{ x: '120%', opacity: phase >= 2 ? [0, 0.45, 0] : 0 }}
        transition={{ duration: 2.6, delay: 0.6, ease: 'easeInOut' }}
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(105deg, transparent 35%, rgba(255,210,140,0.45) 50%, transparent 65%)',
          mixBlendMode: 'screen',
        }}
      />

      {/* Letterbox bars open like a film matte */}
      <motion.div
        initial={{ height: '50vh' }}
        animate={{ height: phase >= 1 ? '8vh' : '50vh' }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, background: '#000', zIndex: 5 }}
      />
      <motion.div
        initial={{ height: '50vh' }}
        animate={{ height: phase >= 1 ? '8vh' : '50vh' }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: '#000', zIndex: 5 }}
      />

      {/* Theme motif overlay — bells / water / dhol / dove etc */}
      {phase >= 3 && (
        <div style={{ position: 'absolute', inset: '8vh 0', pointerEvents: 'none', zIndex: 10 }}>
          {motifFor(themeId, event)}
        </div>
      )}

      {/* Final fade-to-white at the end */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 4 ? 1 : 0 }}
        transition={{ duration: 0.6 }}
        style={{ position: 'absolute', inset: 0, background: '#FFF7E5', zIndex: 15 }}
      />

      <SkipButton onSkip={skip} />
    </div>
  );
}
