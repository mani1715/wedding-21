/**
 * KeralaCSSFallback — Pure CSS/SVG cinematic opening for Kerala Backwaters.
 *
 * Used when GPU tier is 0 OR prefers-reduced-motion is set, OR explicitly
 * passed as the fallback to ThemeOrchestrator. Mirrors the BollywoodCSSFallback
 * contract.
 *
 * Sequence (≈3.5s):
 *   0.0–1.0s  Deep teal water fills screen, lotus pads bob on surface.
 *   1.0–2.5s  Kerala kettuvallam houseboat glides in from the right.
 *   2.5–3.5s  Boat reaches center. Invitation rises from water (clip-path
 *             reveal from bottom to top, like emerging from the backwaters).
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward } from 'lucide-react';
import { KERALA_COLORS } from './kerala.colors';

const TOTAL_MS = 3500;

const KeralaCSSFallback = ({
  brideName  = 'Anaya',
  groomName  = 'Vihaan',
  subtitle   = 'Kerala Backwaters',
  onComplete,
}) => {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState(0);
  const [showSkip, setShowSkip] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (reduce) { onComplete?.(); return; }
    const t1 = setTimeout(() => setStage(1), 0);
    const t2 = setTimeout(() => setStage(2), 1000);
    const t3 = setTimeout(() => setStage(3), 2500);
    const tSkip = setTimeout(() => setShowSkip(true), 1500);
    const tEnd  = setTimeout(() => finish(), TOTAL_MS + 600);
    return () => [t1, t2, t3, tSkip, tEnd].forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  const finish = () => {
    if (done) return;
    setDone(true);
    setTimeout(() => onComplete?.(), 600);
  };

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }}
          className="fixed inset-0 z-[80] overflow-hidden"
          style={{ background: KERALA_COLORS.background }}
          data-testid="kerala-opening-css"
          data-stage={stage}
        >
          {/* Water gradient base + animated caustics (CSS-only) */}
          <div
            className="absolute inset-0"
            style={{
              background:
                `radial-gradient(ellipse at 30% 40%, ${KERALA_COLORS.waterHighlight}55 0%, transparent 50%), ` +
                `radial-gradient(ellipse at 70% 70%, ${KERALA_COLORS.primary}33 0%, transparent 55%), ` +
                KERALA_COLORS.water,
              animation: 'kerala-bob 8s ease-in-out infinite',
            }}
          />

          <style>{`
            @keyframes kerala-bob {
              0%,100% { filter: brightness(1)    hue-rotate(0deg); }
              50%     { filter: brightness(1.06) hue-rotate(-3deg); }
            }
            @keyframes kerala-lilybob {
              0%,100% { transform: translateY(0) rotate(-2deg); }
              50%     { transform: translateY(-6px) rotate(2deg); }
            }
            @keyframes kerala-boat {
              0%   { transform: translate(100vw, 0) rotate(0deg); }
              100% { transform: translate(-30vw, 0) rotate(-1deg); }
            }
            @keyframes kerala-reveal {
              0%   { clip-path: inset(100% 0 0 0); opacity: 0; }
              100% { clip-path: inset(0 0 0 0);   opacity: 1; }
            }
            @keyframes kerala-text-rise {
              0%   { transform: translateY(40px); opacity: 0; filter: blur(8px); }
              100% { transform: translateY(0);    opacity: 1; filter: blur(0); }
            }
          `}</style>

          {/* Stage 1: Lotus pads bobbing on the surface */}
          <AnimatePresence>
            {stage >= 1 && (
              <>
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute"
                  style={{ left: '12%', top: '60%', animation: 'kerala-lilybob 5s ease-in-out infinite' }}
                >
                  <Lotus size={90} color={KERALA_COLORS.lotus} />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="absolute"
                  style={{ right: '14%', top: '64%', animation: 'kerala-lilybob 6s ease-in-out infinite' }}
                >
                  <Lotus size={70} color={KERALA_COLORS.lotusDeep} />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="absolute"
                  style={{ left: '46%', top: '78%', animation: 'kerala-lilybob 7s ease-in-out infinite' }}
                >
                  <LilyPad size={100} color={KERALA_COLORS.bananaLeaf} />
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Stage 2: Houseboat glides in */}
          {stage >= 2 && (
            <div
              className="absolute"
              style={{
                top: '38%',
                animation: 'kerala-boat 2.6s cubic-bezier(0.22,1,0.36,1) forwards',
              }}
              data-testid="kerala-opening-boat"
            >
              <Houseboat width={260} />
            </div>
          )}

          {/* Stage 3: Names rise from the water */}
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <AnimatePresence>
              {stage >= 3 && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-center px-6"
                  style={{
                    color: KERALA_COLORS.text,
                    animation: 'kerala-reveal 1.0s cubic-bezier(0.22,1,0.36,1) forwards',
                  }}
                >
                  <div
                    className="text-[10px] md:text-[11px] tracking-[0.5em] uppercase mb-3"
                    style={{ color: KERALA_COLORS.secondary }}
                  >
                    ◈ {subtitle}
                  </div>
                  <div
                    className="text-[2.4rem] md:text-[4.6rem] leading-none"
                    style={{
                      fontFamily: '"Cormorant Garamond", serif',
                      fontWeight: 500,
                      letterSpacing: '0.04em',
                      textShadow: '0 6px 28px rgba(0,0,0,0.55), 0 0 24px rgba(212,162,76,0.35)',
                      animation: 'kerala-text-rise 1.4s cubic-bezier(0.22,1,0.36,1) 0.2s both',
                    }}
                  >
                    {brideName}
                    <span
                      style={{
                        color: KERALA_COLORS.secondary,
                        fontFamily: '"Great Vibes", cursive',
                        fontStyle: 'italic',
                        margin: '0 0.4em',
                      }}
                    >&amp;</span>
                    {groomName}
                  </div>
                  <div
                    className="text-[11px] tracking-[0.4em] uppercase mt-5 opacity-70"
                    style={{ color: KERALA_COLORS.textMuted, animation: 'kerala-text-rise 1.4s cubic-bezier(0.22,1,0.36,1) 0.6s both' }}
                  >
                    Two souls · One Backwater
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Skip button */}
          {showSkip && !done && (
            <button
              onClick={finish}
              aria-label="Skip"
              className="absolute top-6 right-6 z-10 flex items-center gap-2 px-4 h-9 rounded-full border text-xs tracking-[0.25em] uppercase"
              style={{ borderColor: 'rgba(212,162,76,0.45)', color: KERALA_COLORS.secondary }}
              data-testid="kerala-opening-skip"
            >
              <SkipForward className="w-3 h-3" /> Skip
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ── Inline SVGs ─────────────────────────────────────────────────────── */

const Lotus = ({ size = 80, color = '#F4A6C0' }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
    {[...Array(8)].map((_, i) => (
      <ellipse
        key={i}
        cx="40" cy="22"
        rx="7" ry="18"
        fill={color}
        opacity={0.85 - (i % 2) * 0.2}
        transform={`rotate(${i * 22.5} 40 40)`}
      />
    ))}
    <circle cx="40" cy="40" r="5" fill="#D4A24C" />
  </svg>
);

const LilyPad = ({ size = 80, color = '#2F5D3A' }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
    <path d="M40 8 A30 30 0 1 1 8 40 L40 40 Z" fill={color} opacity={0.78} />
  </svg>
);

const Houseboat = ({ width = 240 }) => (
  <svg width={width} height={width * 0.42} viewBox="0 0 240 100" fill="none">
    {/* Arched bamboo roof */}
    <path d="M28 50 Q120 8 212 50 L212 60 L28 60 Z" fill="#3A2418" />
    <path d="M38 50 Q120 18 202 50" stroke="#7A4E2C" strokeWidth="1.5" fill="none" opacity="0.7" />
    {/* Roof slats */}
    {[...Array(8)].map((_, i) => (
      <line
        key={i}
        x1={50 + i * 18} y1="44"
        x2={50 + i * 18} y2="60"
        stroke="#2A1810" strokeWidth="0.8"
      />
    ))}
    {/* Hull */}
    <path d="M12 60 L228 60 L210 86 L30 86 Z" fill="#1F1108" />
    <path d="M30 60 L210 60" stroke="#D4A24C" strokeWidth="1" opacity="0.7" />
    {/* Door */}
    <rect x="108" y="50" width="24" height="10" fill="#0A0604" />
    {/* Reflection */}
    <path d="M12 90 L228 90 L210 100 L30 100 Z" fill="#1F1108" opacity="0.3" />
  </svg>
);

export default KeralaCSSFallback;
