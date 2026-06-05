/**
 * PunjabiCSSFallback — Reduced-motion / low-end opening.
 * Simple beat-driven CSS sequence ending on the couple's names.
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward } from 'lucide-react';

const PunjabiCSSFallback = ({
  brideName = 'Simran',
  groomName = 'Arjun',
  subtitle  = 'Punjabi Sangeet',
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

  const confettiColors = ['#FFD700', '#FF6B00', '#D4008B', '#00C896'];

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.7 } }}
          className="fixed inset-0 z-[80] grid place-items-center overflow-hidden"
          style={{ background: '#1A0A00' }}
          data-testid="punjabi-opening-fallback"
        >
          {!tapped && (
            <button
              onClick={() => setTapped(true)}
              className="text-center"
              data-testid="punjabi-opening-start-fallback"
            >
              <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: '#FFD700' }}>
                ◆ {subtitle}
              </div>
              <div className="text-2xl md:text-3xl mb-6"
                style={{ color: '#FFF5E6', fontFamily: '"Cormorant Garamond", serif' }}>
                Tap to Open the Invitation
              </div>
              <span className="inline-block px-7 py-3 rounded-full border text-xs tracking-[0.3em] uppercase"
                style={{ borderColor: '#FF6B00', color: '#FF6B00' }}>
                Balle Balle!
              </span>
            </button>
          )}

          {tapped && (
            <>
              {/* Dhol pulse */}
              <motion.div
                className="absolute"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.05, 0.95, 1.08, 0] }}
                transition={{ delay: 0.2, duration: 2.6, times: [0, 0.3, 0.55, 0.8, 1], ease: 'easeOut' }}
                style={{
                  width: 220, height: 220, borderRadius: '50%',
                  background: 'radial-gradient(circle, #D4008B 0%, #8B0050 75%)',
                  boxShadow: '0 0 60px 10px rgba(212,0,139,0.55)',
                }}
              />

              {/* Confetti burst */}
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 40 }).map((_, i) => {
                  const c = confettiColors[i % confettiColors.length];
                  const a = (i / 40) * Math.PI * 2;
                  const r = 200 + (i % 4) * 60;
                  return (
                    <motion.span key={i}
                      initial={{ x: 0, y: 0, opacity: 0, rotate: 0 }}
                      animate={{
                        x: Math.cos(a) * r,
                        y: Math.sin(a) * r,
                        opacity: [0, 1, 1, 0],
                        rotate: 720,
                      }}
                      transition={{ delay: 2.0 + i * 0.01, duration: 1.8, ease: 'easeOut' }}
                      className="absolute top-1/2 left-1/2 block"
                      style={{
                        width: 8, height: 12,
                        background: c,
                        boxShadow: `0 0 6px ${c}`,
                      }}
                    />
                  );
                })}
              </div>

              {/* Couple names */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3.4, duration: 0.9 }}
                className="absolute bottom-[18%] text-center"
                style={{ color: '#FFF5E6' }}
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
                style={{ borderColor: 'rgba(255,107,0,0.5)', color: '#FFD700' }}
                data-testid="punjabi-opening-skip-fallback">
                <SkipForward className="w-3 h-3" /> Skip
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PunjabiCSSFallback;
