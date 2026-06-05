/**
 * MughalCSSFallback — CSS-only opening for low-end devices and reduced-motion users.
 *
 * No Three.js, no WebGL. Pure CSS transforms + Framer Motion.
 * Mimics the 5-stage flow at a much lower cost: gold-dust → seal-glow → split → reveal.
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward } from 'lucide-react';

const MughalCSSFallback = ({
  brideName = 'Anaya',
  groomName = 'Rohan',
  subtitle  = 'Royal Mughal · North Indian',
  onComplete,
}) => {
  const reduce = useReducedMotion();
  const [tapped, setTapped] = useState(false);
  const [done,   setDone]   = useState(false);
  const TOTAL = reduce ? 600 : 5500;

  useEffect(() => {
    if (!tapped) return;
    const t = setTimeout(() => finish(), TOTAL);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tapped]);

  const finish = () => {
    if (done) return;
    setDone(true);
    setTimeout(() => onComplete?.(), 700);
  };

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.7 } }}
          className="fixed inset-0 z-[80] grid place-items-center overflow-hidden"
          style={{ background: '#0D0806' }}
          data-testid="mughal-opening-fallback"
        >
          {/* Gold dust particles */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.span key={i}
                className="absolute block rounded-full"
                style={{
                  background: '#E8C97A',
                  width: 2 + (i % 4), height: 2 + (i % 4),
                  left: `${(i * 37) % 100}%`,
                  bottom: '-20px',
                  boxShadow: '0 0 8px rgba(232,201,122,0.6)',
                }}
                animate={{ y: ['-20vh', '-120vh'], opacity: [0, 0.7, 0] }}
                transition={{ duration: 8 + (i % 5), repeat: Infinity, delay: i * 0.18, ease: 'linear' }}
              />
            ))}
          </div>

          {/* Tap to begin */}
          {!tapped && (
            <button
              onClick={() => setTapped(true)}
              className="text-center"
              data-testid="mughal-opening-start-fallback"
            >
              <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: '#E8C97A' }}>
                ◆ {subtitle}
              </div>
              <div className="text-2xl md:text-3xl mb-6"
                style={{ color: '#F5ECD7', fontFamily: '"Cormorant Garamond", serif' }}>
                Tap to Open the Invitation
              </div>
              <span className="inline-block px-7 py-3 rounded-full border text-xs tracking-[0.3em] uppercase"
                style={{ borderColor: '#D4AF37', color: '#D4AF37' }}>
                Begin
              </span>
            </button>
          )}

          {tapped && (
            <>
              {/* Seal glow → crack split */}
              <motion.div
                className="relative w-44 h-44 rounded-full grid place-items-center"
                initial={{ scale: 0 }} animate={{ scale: [0, 1.05, 1] }}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  background: 'radial-gradient(circle, #B22424 0%, #5A0F0F 70%)',
                  boxShadow: '0 0 60px 10px rgba(178,36,36,0.45)',
                }}
              >
                {/* 8-pointed star */}
                <div className="w-20 h-20 relative">
                  {[0, 45].map((rot) => (
                    <div key={rot} className="absolute inset-0"
                      style={{
                        border: '2px solid #E8C97A',
                        transform: `rotate(${rot}deg) rotate(45deg)`,
                      }}
                    />
                  ))}
                  <div className="absolute inset-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ background: '#E8C97A' }} />
                </div>

                {/* Crack — left half flies out */}
                <motion.div
                  className="absolute top-0 left-0 w-1/2 h-full rounded-l-full"
                  initial={{ x: 0, opacity: 0 }}
                  animate={{ x: '-90vw', rotate: -160, opacity: [0, 1, 0] }}
                  transition={{ delay: 2.2, duration: 1.6, ease: 'easeIn' }}
                  style={{ background: 'linear-gradient(90deg, #5A0F0F, transparent)' }}
                />
                <motion.div
                  className="absolute top-0 right-0 w-1/2 h-full rounded-r-full"
                  initial={{ x: 0, opacity: 0 }}
                  animate={{ x: '90vw', rotate: 160, opacity: [0, 1, 0] }}
                  transition={{ delay: 2.2, duration: 1.6, ease: 'easeIn' }}
                  style={{ background: 'linear-gradient(270deg, #5A0F0F, transparent)' }}
                />
              </motion.div>

              {/* Couple name reveal */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3.5, duration: 0.9 }}
                className="absolute bottom-[18%] text-center"
                style={{ color: '#F5ECD7' }}
              >
                <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: '#E8C97A' }}>
                  ◆ {subtitle}
                </div>
                <div className="text-[2.2rem] md:text-[3.6rem] leading-none"
                  style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 300 }}>
                  {brideName}
                  <span style={{ color: '#D4AF37', fontFamily: '"Great Vibes", cursive', fontStyle: 'italic', margin: '0 0.4em' }}>&amp;</span>
                  {groomName}
                </div>
              </motion.div>

              {/* Skip */}
              <button onClick={finish}
                className="absolute top-6 right-6 flex items-center gap-2 px-4 h-9 rounded-full border text-xs tracking-[0.25em] uppercase"
                style={{ borderColor: 'rgba(232,201,122,0.4)', color: '#E8C97A' }}
                data-testid="mughal-opening-skip-fallback">
                <SkipForward className="w-3 h-3" /> Skip
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MughalCSSFallback;
