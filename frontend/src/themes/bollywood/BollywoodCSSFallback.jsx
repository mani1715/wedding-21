/**
 * BollywoodCSSFallback — Reduced-motion / low-end opening.
 * CSS-only curtain pull + fireworks burst + marquee names.
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward } from 'lucide-react';

const BollywoodCSSFallback = ({
  brideName = 'Anaya',
  groomName = 'Vihaan',
  subtitle  = 'Bollywood Luxury',
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
          style={{ background: '#0A0005' }}
          data-testid="bollywood-opening-fallback"
        >
          {!tapped && (
            <button
              onClick={() => setTapped(true)}
              className="text-center"
              data-testid="bollywood-opening-start-fallback"
            >
              <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: '#FFD700' }}>
                ★ {subtitle}
              </div>
              <div className="text-2xl md:text-3xl mb-6"
                style={{ color: '#FFFFFF', fontFamily: '"Cormorant Garamond", serif' }}>
                Tap to Roll the Credits
              </div>
              <span className="inline-block px-7 py-3 rounded-full border text-xs tracking-[0.3em] uppercase"
                style={{ borderColor: '#FF0080', color: '#FFD700' }}>
                Lights, Camera, Action
              </span>
            </button>
          )}

          {tapped && (
            <>
              {/* Curtains */}
              <motion.div initial={{ x: 0 }} animate={{ x: '-50%' }}
                transition={{ delay: 0.5, duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
                className="absolute top-0 bottom-0 left-0"
                style={{
                  width: '50%',
                  background: 'linear-gradient(90deg, #800020 0%, #5A0015 50%, #800020 100%)',
                  boxShadow: 'inset -10px 0 30px rgba(0,0,0,0.5)',
                }}
              />
              <motion.div initial={{ x: 0 }} animate={{ x: '50%' }}
                transition={{ delay: 0.5, duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
                className="absolute top-0 bottom-0 right-0"
                style={{
                  width: '50%',
                  background: 'linear-gradient(90deg, #800020 0%, #5A0015 50%, #800020 100%)',
                  boxShadow: 'inset 10px 0 30px rgba(0,0,0,0.5)',
                }}
              />

              {/* Firework bursts */}
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 50 }).map((_, i) => {
                  const colors = ['#FFD700', '#FF0080', '#FF6B00', '#FFFFFF'];
                  const c = colors[i % colors.length];
                  const a = (i / 50) * Math.PI * 2;
                  const r = 220 + (i % 5) * 50;
                  return (
                    <motion.span key={i}
                      initial={{ x: 0, y: 0, opacity: 0 }}
                      animate={{
                        x: Math.cos(a) * r,
                        y: Math.sin(a) * r,
                        opacity: [0, 1, 1, 0],
                      }}
                      transition={{ delay: 2.8 + (i % 8) * 0.05, duration: 1.8, ease: 'easeOut' }}
                      className="absolute top-1/2 left-1/2 block"
                      style={{
                        width: 6, height: 6,
                        background: c,
                        borderRadius: '50%',
                        boxShadow: `0 0 12px ${c}`,
                      }}
                    />
                  );
                })}
              </div>

              {/* Couple names */}
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 3.6, duration: 0.9 }}
                className="absolute text-center"
                style={{ color: '#FFFFFF' }}
              >
                <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: '#FFD700' }}>
                  ★ {subtitle}
                </div>
                <div className="text-[2.4rem] md:text-[4.4rem] leading-none"
                  style={{
                    fontFamily: '"Cormorant Garamond", serif', fontWeight: 600,
                    textShadow: '0 0 30px rgba(255,0,128,0.7), 0 0 60px rgba(255,215,0,0.4)',
                  }}>
                  {brideName}
                  <span style={{ color: '#FFD700', fontFamily: '"Great Vibes", cursive', fontStyle: 'italic', margin: '0 0.4em' }}>&amp;</span>
                  {groomName}
                </div>
              </motion.div>

              <button onClick={finish}
                className="absolute top-6 right-6 flex items-center gap-2 px-4 h-9 rounded-full border text-xs tracking-[0.25em] uppercase"
                style={{ borderColor: 'rgba(255,0,128,0.5)', color: '#FFD700' }}
                data-testid="bollywood-opening-skip-fallback">
                <SkipForward className="w-3 h-3" /> Skip
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BollywoodCSSFallback;
