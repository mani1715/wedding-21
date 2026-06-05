/**
 * ChristianCSSFallback — Reduced-motion / low-end opening.
 * CSS-only candles light up + names with gold cross divider.
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward } from 'lucide-react';

const ChristianCSSFallback = ({
  brideName = 'Emily',
  groomName = 'Daniel',
  subtitle  = 'Christian Elegant',
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
          style={{ background: '#08080F' }}
          data-testid="christian-opening-fallback"
        >
          {!tapped && (
            <button
              onClick={() => setTapped(true)}
              className="text-center"
              data-testid="christian-opening-start-fallback"
            >
              <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: '#FFD700' }}>
                ✟ {subtitle}
              </div>
              <div className="text-2xl md:text-3xl mb-6"
                style={{ color: '#F8F8FF', fontFamily: '"Cormorant Garamond", serif' }}>
                Tap to Open the Invitation
              </div>
              <span className="inline-block px-7 py-3 rounded-full border text-xs tracking-[0.3em] uppercase"
                style={{ borderColor: '#FFD700', color: '#FFD700' }}>
                Begin
              </span>
            </button>
          )}

          {tapped && (
            <>
              {/* Candles row */}
              <div className="absolute" style={{ top: '32%' }}>
                <div className="flex gap-12">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 + i * 0.25, duration: 0.4 }}
                      style={{ width: 24, height: 90, position: 'relative' }}
                    >
                      <div style={{
                        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                        width: 12, height: 70, background: 'linear-gradient(180deg, #F5F5DC, #B0A678)',
                        borderRadius: 2,
                      }} />
                      <div style={{
                        position: 'absolute', bottom: 70, left: '50%', transform: 'translateX(-50%)',
                        width: 10, height: 18,
                        background: 'radial-gradient(circle at 50% 70%, #FFEB3B 0%, #FF9800 50%, transparent 75%)',
                        borderRadius: '50% 50% 30% 30% / 60% 60% 40% 40%',
                        animation: 'christian-flame-css 1.4s ease-in-out infinite alternate',
                      }} />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Couple names with cross */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3.0, duration: 0.9 }}
                className="absolute bottom-[14%] text-center"
                style={{ color: '#F8F8FF' }}
              >
                <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: '#FFD700' }}>
                  ✟ {subtitle}
                </div>
                <div className="text-[2.2rem] md:text-[3.6rem] leading-none"
                  style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 400 }}>
                  {brideName}
                  <span style={{ color: '#FFD700', margin: '0 0.5em' }}>✟</span>
                  {groomName}
                </div>
              </motion.div>

              <button onClick={finish}
                className="absolute top-6 right-6 flex items-center gap-2 px-4 h-9 rounded-full border text-xs tracking-[0.25em] uppercase"
                style={{ borderColor: 'rgba(255,215,0,0.45)', color: '#FFD700' }}
                data-testid="christian-opening-skip-fallback">
                <SkipForward className="w-3 h-3" /> Skip
              </button>

              <style>{`
                @keyframes christian-flame-css {
                  0%   { transform: translateX(-50%) scale(1)   rotate(-2deg); }
                  100% { transform: translateX(-50%) scale(1.1) rotate( 2deg); }
                }
              `}</style>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChristianCSSFallback;
