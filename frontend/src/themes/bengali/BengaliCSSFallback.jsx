/**
 * BengaliCSSFallback — Reduced-motion / low-end opening.
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward } from 'lucide-react';

const BengaliCSSFallback = ({
  brideName = 'Ria',
  groomName = 'Aditya',
  subtitle  = 'Bengali Traditional',
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
          style={{ background: '#0D0505' }}
          data-testid="bengali-opening-fallback"
        >
          {/* Red sindoor particles rising */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 28 }).map((_, i) => (
              <motion.span key={i}
                className="absolute block rounded-full"
                style={{
                  background: '#CC0000',
                  width: 2 + (i % 4), height: 2 + (i % 4),
                  left: `${(i * 39) % 100}%`,
                  bottom: '-20px',
                  boxShadow: '0 0 8px rgba(204,0,0,0.6)',
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
              data-testid="bengali-opening-start-fallback"
            >
              <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: '#FFD700' }}>
                ◆ {subtitle}
              </div>
              <div className="text-2xl md:text-3xl mb-6"
                style={{ color: '#FFF8F0', fontFamily: '"Cormorant Garamond", serif' }}>
                Tap to Open the Invitation
              </div>
              <span className="inline-block px-7 py-3 rounded-full border text-xs tracking-[0.3em] uppercase"
                style={{ borderColor: '#CC0000', color: '#FFD700' }}>
                Begin
              </span>
            </button>
          )}

          {tapped && (
            <>
              {/* Shankha glow */}
              <motion.div
                className="absolute"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1, 0.95, 1.05], opacity: [0, 1, 1, 0.6] }}
                transition={{ delay: 0.2, duration: 2.5, ease: 'easeOut' }}
                style={{
                  width: 200, height: 200, borderRadius: '50%',
                  background: 'radial-gradient(circle, #FFFFFF 0%, #FFEFE5 40%, transparent 75%)',
                  boxShadow: '0 0 80px 20px rgba(255,215,0,0.45)',
                }}
              />

              {/* Sindoor burst */}
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 40 }).map((_, i) => {
                  const a = (i / 40) * Math.PI * 2;
                  const r = 240 + (i % 4) * 60;
                  return (
                    <motion.span key={i}
                      initial={{ x: 0, y: 0, opacity: 0 }}
                      animate={{
                        x: Math.cos(a) * r,
                        y: Math.sin(a) * r,
                        opacity: [0, 1, 1, 0],
                      }}
                      transition={{ delay: 2.4 + i * 0.005, duration: 1.6, ease: 'easeOut' }}
                      className="absolute top-1/2 left-1/2 block rounded-full"
                      style={{
                        width: 6, height: 6,
                        background: '#CC0000',
                        boxShadow: '0 0 6px #CC0000',
                      }}
                    />
                  );
                })}
              </div>

              {/* Couple names */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3.6, duration: 0.9 }}
                className="absolute bottom-[18%] text-center"
                style={{ color: '#FFF8F0' }}
              >
                <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: '#FFD700' }}>
                  ◆ {subtitle}
                </div>
                <div className="text-[2.2rem] md:text-[3.6rem] leading-none"
                  style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 400 }}>
                  {brideName}
                  <span style={{ color: '#FFD700', fontFamily: '"Great Vibes", cursive', fontStyle: 'italic', margin: '0 0.4em' }}>&amp;</span>
                  {groomName}
                </div>
              </motion.div>

              <button onClick={finish}
                className="absolute top-6 right-6 flex items-center gap-2 px-4 h-9 rounded-full border text-xs tracking-[0.25em] uppercase"
                style={{ borderColor: 'rgba(255,215,0,0.5)', color: '#FFD700' }}
                data-testid="bengali-opening-skip-fallback">
                <SkipForward className="w-3 h-3" /> Skip
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BengaliCSSFallback;
