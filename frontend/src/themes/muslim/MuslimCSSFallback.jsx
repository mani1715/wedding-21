/**
 * MuslimCSSFallback — Reduced-motion / low-end opening.
 * Crescent moon rises + Bismillah + couple names.
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward } from 'lucide-react';

const MuslimCSSFallback = ({
  brideName = 'Ayesha',
  groomName = 'Zayn',
  subtitle  = 'Muslim Nikah',
  onComplete,
}) => {
  const reduce = useReducedMotion();
  const [tapped, setTapped] = useState(false);
  const [done, setDone] = useState(false);
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
          style={{ background: '#060810' }}
          data-testid="muslim-opening-fallback"
        >
          {/* Twinkling stars */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.span key={i}
                className="absolute block rounded-full"
                style={{
                  width: 2, height: 2,
                  left: `${(i * 31) % 100}%`,
                  top:  `${(i * 47) % 60}%`,
                  background: '#FFFFFF',
                  boxShadow: '0 0 6px rgba(245,222,179,0.6)',
                }}
                animate={{ opacity: [0.2, 0.9, 0.2] }}
                transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
          </div>

          {!tapped && (
            <button
              onClick={() => setTapped(true)}
              className="text-center"
              data-testid="muslim-opening-start-fallback"
            >
              <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: '#C5A028' }}>
                ☾ {subtitle}
              </div>
              <div className="text-2xl md:text-3xl mb-6"
                style={{ color: '#F5F5F5', fontFamily: '"Cormorant Garamond", serif' }}>
                Tap to Open the Invitation
              </div>
              <span className="inline-block px-7 py-3 rounded-full border text-xs tracking-[0.3em] uppercase"
                style={{ borderColor: '#C5A028', color: '#C5A028' }}>
                Begin
              </span>
            </button>
          )}

          {tapped && (
            <>
              {/* Crescent moon rises */}
              <motion.svg
                initial={{ y: 200, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 2.0, ease: [0.22, 1, 0.36, 1] }}
                viewBox="0 0 100 100"
                className="absolute"
                style={{ width: 160, height: 160, top: '18%' }}
                aria-hidden="true"
              >
                <defs>
                  <radialGradient id="moonFb" cx="50%" cy="50%" r="50%">
                    <stop offset="0%"  stopColor="#F5DEB3" />
                    <stop offset="100%" stopColor="#C5A028" stopOpacity="0.5" />
                  </radialGradient>
                </defs>
                <path d="M 70 50 A 28 28 0 1 1 70 49 A 20 20 0 1 0 70 50 Z" fill="url(#moonFb)" />
              </motion.svg>

              {/* Couple names */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3.0, duration: 0.9 }}
                className="absolute bottom-[14%] text-center"
                style={{ color: '#F5F5F5' }}
              >
                <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: '#C5A028' }}>
                  ☾ {subtitle}
                </div>
                <div className="text-[2.2rem] md:text-[3.6rem] leading-none"
                  style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 400 }}>
                  {brideName}
                  <span style={{ color: '#C5A028', fontFamily: '"Great Vibes", cursive', fontStyle: 'italic', margin: '0 0.4em' }}>&amp;</span>
                  {groomName}
                </div>
              </motion.div>

              <button onClick={finish}
                className="absolute top-6 right-6 flex items-center gap-2 px-4 h-9 rounded-full border text-xs tracking-[0.25em] uppercase"
                style={{ borderColor: 'rgba(197,160,40,0.45)', color: '#C5A028' }}
                data-testid="muslim-opening-skip-fallback">
                <SkipForward className="w-3 h-3" /> Skip
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MuslimCSSFallback;
