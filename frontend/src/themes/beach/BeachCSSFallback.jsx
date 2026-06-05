/**
 * BeachCSSFallback — Reduced-motion / low-end opening.
 * CSS-only: sun rises + horizon line + names.
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward } from 'lucide-react';

const BeachCSSFallback = ({
  brideName = 'Mira',
  groomName = 'Ishaan',
  subtitle  = 'Beach Destination',
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
          style={{ background: 'linear-gradient(180deg, #030D1A 0%, #051826 60%, #0E3540 100%)' }}
          data-testid="beach-opening-fallback"
        >
          {!tapped && (
            <button
              onClick={() => setTapped(true)}
              className="text-center"
              data-testid="beach-opening-start-fallback"
            >
              <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: '#E9C46A' }}>
                ◊ {subtitle}
              </div>
              <div className="text-2xl md:text-3xl mb-6"
                style={{ color: '#F8F9FA', fontFamily: '"Cormorant Garamond", serif' }}>
                Tap to Open the Invitation
              </div>
              <span className="inline-block px-7 py-3 rounded-full border text-xs tracking-[0.3em] uppercase"
                style={{ borderColor: '#00B4D8', color: '#00B4D8' }}>
                Begin
              </span>
            </button>
          )}

          {tapped && (
            <>
              {/* Horizon line */}
              <motion.div
                className="absolute left-0 right-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0, duration: 1.2 }}
                style={{
                  top: '60%', height: 1,
                  background: 'linear-gradient(90deg, transparent 0%, rgba(244,162,97,0.6) 40%, rgba(244,162,97,0.6) 60%, transparent 100%)',
                }}
              />
              {/* Sun */}
              <motion.div
                className="absolute rounded-full"
                initial={{ y: 280, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.5, duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  width: 180, height: 180,
                  top: 'calc(60% - 90px)',
                  background: 'radial-gradient(circle, #FFEEAA 0%, #F4A261 50%, #FF6B6B 90%, transparent 100%)',
                  boxShadow: '0 0 80px 30px rgba(244,162,97,0.35)',
                  filter: 'blur(0.3px)',
                }}
              />

              {/* Couple names */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3.6, duration: 0.9 }}
                className="absolute bottom-[14%] text-center"
                style={{ color: '#F8F9FA' }}
              >
                <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: '#E9C46A' }}>
                  ◊ {subtitle}
                </div>
                <div className="text-[2.2rem] md:text-[3.6rem] leading-none"
                  style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 400 }}>
                  {brideName}
                  <span style={{ color: '#E9C46A', fontFamily: '"Great Vibes", cursive', fontStyle: 'italic', margin: '0 0.4em' }}>&amp;</span>
                  {groomName}
                </div>
              </motion.div>

              <button onClick={finish}
                className="absolute top-6 right-6 flex items-center gap-2 px-4 h-9 rounded-full border text-xs tracking-[0.25em] uppercase"
                style={{ borderColor: 'rgba(0,180,216,0.5)', color: '#E9C46A' }}
                data-testid="beach-opening-skip-fallback">
                <SkipForward className="w-3 h-3" /> Skip
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BeachCSSFallback;
