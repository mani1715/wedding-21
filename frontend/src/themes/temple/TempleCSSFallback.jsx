/**
 * TempleCSSFallback — CSS-only opening for low-end devices / reduced-motion.
 *
 * No WebGL. Mimics the temple-door-opening flow with CSS transforms.
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward } from 'lucide-react';

const TempleCSSFallback = ({
  brideName = 'Lakshmi',
  groomName = 'Karthik',
  subtitle  = 'South Indian Temple',
  onComplete,
}) => {
  const reduce = useReducedMotion();
  const [tapped, setTapped] = useState(false);
  const [done,   setDone]   = useState(false);
  const TOTAL = reduce ? 600 : 6000;

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
          style={{ background: '#0A0806' }}
          data-testid="temple-opening-fallback"
        >
          {/* Incense gold particles */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 26 }).map((_, i) => (
              <motion.span key={i}
                className="absolute block rounded-full"
                style={{
                  background: '#FFD700',
                  width: 2 + (i % 4), height: 2 + (i % 4),
                  left: `${(i * 41) % 100}%`,
                  bottom: '-20px',
                  boxShadow: '0 0 8px rgba(255,215,0,0.6)',
                }}
                animate={{ y: ['-20vh', '-120vh'], opacity: [0, 0.7, 0] }}
                transition={{ duration: 8 + (i % 5), repeat: Infinity, delay: i * 0.18, ease: 'linear' }}
              />
            ))}
          </div>

          {!tapped && (
            <button
              onClick={() => setTapped(true)}
              className="text-center"
              data-testid="temple-opening-start-fallback"
            >
              <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: '#FFD700' }}>
                ◆ {subtitle}
              </div>
              <div className="text-2xl md:text-3xl mb-6"
                style={{ color: '#FFF8DC', fontFamily: '"Cormorant Garamond", serif' }}>
                Tap to Open the Invitation
              </div>
              <span className="inline-block px-7 py-3 rounded-full border text-xs tracking-[0.3em] uppercase"
                style={{ borderColor: '#DAA520', color: '#DAA520' }}>
                Begin
              </span>
            </button>
          )}

          {tapped && (
            <>
              {/* Doors */}
              <div className="absolute inset-0 flex items-stretch justify-center">
                <motion.div
                  className="w-1/2 h-full origin-left"
                  initial={{ rotateY: 0 }}
                  animate={{ rotateY: -85 }}
                  transition={{ delay: 0.8, duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    background:
                      'linear-gradient(90deg, #2D1A0A 0%, #4A2D14 40%, #2D1A0A 100%)',
                    boxShadow: 'inset -6px 0 12px rgba(0,0,0,0.4)',
                    transformPerspective: 1200,
                  }}
                />
                <motion.div
                  className="w-1/2 h-full origin-right"
                  initial={{ rotateY: 0 }}
                  animate={{ rotateY: 85 }}
                  transition={{ delay: 0.8, duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    background:
                      'linear-gradient(270deg, #2D1A0A 0%, #4A2D14 40%, #2D1A0A 100%)',
                    boxShadow: 'inset 6px 0 12px rgba(0,0,0,0.4)',
                    transformPerspective: 1200,
                  }}
                />
              </div>

              {/* Light flood from behind */}
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6, duration: 1.4 }}
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(218,165,32,0.45) 0%, transparent 60%)',
                }}
              />

              {/* Couple names */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3.2, duration: 0.9 }}
                className="relative text-center"
                style={{ color: '#FFF8DC' }}
              >
                <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: '#FFD700' }}>
                  ◆ {subtitle}
                </div>
                <div className="text-[2.2rem] md:text-[3.6rem] leading-none"
                  style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 300 }}>
                  {brideName}
                  <span style={{ color: '#DAA520', fontFamily: '"Great Vibes", cursive', fontStyle: 'italic', margin: '0 0.4em' }}>&amp;</span>
                  {groomName}
                </div>
              </motion.div>

              <button onClick={finish}
                className="absolute top-6 right-6 flex items-center gap-2 px-4 h-9 rounded-full border text-xs tracking-[0.25em] uppercase"
                style={{ borderColor: 'rgba(218,165,32,0.4)', color: '#FFD700' }}
                data-testid="temple-opening-skip-fallback">
                <SkipForward className="w-3 h-3" /> Skip
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TempleCSSFallback;
