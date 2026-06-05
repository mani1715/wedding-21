/**
 * MinimalCSSFallback — Reduced-motion / low-end opening.
 * Pure CSS — expanding circle outline, then names in elegant typography.
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward } from 'lucide-react';

const MinimalCSSFallback = ({
  brideName = 'Anika',
  groomName = 'Aarav',
  subtitle  = 'Modern Minimal',
  onComplete,
}) => {
  const reduce = useReducedMotion();
  const [tapped, setTapped] = useState(false);
  const [done,   setDone]   = useState(false);
  const TOTAL = reduce ? 600 : 5000;

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
          style={{ background: '#0F0F0F' }}
          data-testid="minimal-opening-fallback"
        >
          {!tapped && (
            <button
              onClick={() => setTapped(true)}
              className="text-center"
              data-testid="minimal-opening-start-fallback"
            >
              <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: '#C0C0C0' }}>
                ◇ {subtitle}
              </div>
              <div className="text-2xl md:text-3xl mb-6"
                style={{ color: '#F0F0F0', fontFamily: '"Cormorant Garamond", serif', fontWeight: 300, letterSpacing: '0.1em' }}>
                Open the Invitation
              </div>
              <span className="inline-block px-7 py-3 rounded-full border text-xs tracking-[0.3em] uppercase"
                style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#F0F0F0' }}>
                Begin
              </span>
            </button>
          )}

          {tapped && (
            <>
              {/* Expanding circle */}
              <motion.div
                className="absolute rounded-full"
                initial={{ scale: 0, opacity: 0.8 }}
                animate={{ scale: [0, 8, 8], opacity: [0.8, 0.3, 0] }}
                transition={{ duration: 3.5, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  width: 200, height: 200,
                  border: '1.5px solid rgba(255,255,255,0.5)',
                }}
              />
              {/* Couple names */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="absolute text-center"
                style={{ color: '#F0F0F0' }}
              >
                <div className="text-[10px] tracking-[0.5em] uppercase mb-4" style={{ color: '#C0C0C0' }}>
                  ◇ {subtitle}
                </div>
                <div className="text-[2.2rem] md:text-[4rem] leading-none"
                  style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 200, letterSpacing: '0.18em' }}>
                  {brideName}
                  <span style={{ color: '#D4AF37', fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', margin: '0 0.4em', fontWeight: 300 }}>&amp;</span>
                  {groomName}
                </div>
              </motion.div>
              <button onClick={finish}
                className="absolute top-6 right-6 flex items-center gap-2 px-4 h-9 rounded-full border text-xs tracking-[0.25em] uppercase"
                style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#C0C0C0' }}
                data-testid="minimal-opening-skip-fallback">
                <SkipForward className="w-3 h-3" /> Skip
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MinimalCSSFallback;
