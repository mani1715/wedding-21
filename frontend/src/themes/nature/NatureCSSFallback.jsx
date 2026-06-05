/**
 * NatureCSSFallback — Reduced-motion / low-end opening.
 * CSS-only sprouting vine + leaf wreath + couple names.
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward } from 'lucide-react';

const NatureCSSFallback = ({
  brideName = 'Tara',
  groomName = 'Kabir',
  subtitle  = 'Nature / Eco',
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
          style={{ background: '#030A03' }}
          data-testid="nature-opening-fallback"
        >
          {!tapped && (
            <button
              onClick={() => setTapped(true)}
              className="text-center"
              data-testid="nature-opening-start-fallback"
            >
              <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: '#CDDC39' }}>
                ❀ {subtitle}
              </div>
              <div className="text-2xl md:text-3xl mb-6"
                style={{ color: '#F1F8E9', fontFamily: '"Cormorant Garamond", serif' }}>
                Open the Invitation
              </div>
              <span className="inline-block px-7 py-3 rounded-full border text-xs tracking-[0.3em] uppercase"
                style={{ borderColor: '#8BC34A', color: '#8BC34A' }}>
                Begin
              </span>
            </button>
          )}

          {tapped && (
            <>
              {/* God-rays */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 1.5 }}
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(ellipse 50% 100% at 70% 0%, rgba(255,235,59,0.18) 0%, transparent 70%)',
                }}
              />
              {/* Sprouting vine */}
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 origin-bottom"
                style={{
                  width: 4, height: '40vh',
                  background: 'linear-gradient(180deg, #CDDC39 0%, #4CAF50 60%, #2E7D32 100%)',
                  boxShadow: '0 0 16px rgba(139,195,74,0.5)',
                  borderRadius: 2,
                }}
              />
              {/* Leaves */}
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.span key={i}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1.0 + i * 0.25, duration: 0.5, ease: 'easeOut' }}
                  className="absolute"
                  style={{
                    bottom: `${10 + i * 7}vh`,
                    left: `calc(50% + ${(i % 2 === 0 ? 1 : -1) * (16 + i * 3)}px)`,
                    width: 22 + i * 3, height: 22 + i * 3,
                    background: i % 2 ? '#8BC34A' : '#4CAF50',
                    transform: `rotate(${i % 2 ? 25 : -25}deg)`,
                    borderRadius: '50% 0 50% 0',
                    boxShadow: '0 0 8px rgba(76,175,80,0.55)',
                  }}
                />
              ))}

              {/* Couple names */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3.4, duration: 0.9 }}
                className="absolute top-[14%] text-center"
                style={{ color: '#F1F8E9' }}
              >
                <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: '#CDDC39' }}>
                  ❀ {subtitle}
                </div>
                <div className="text-[2.2rem] md:text-[3.6rem] leading-none"
                  style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 400 }}>
                  {brideName}
                  <span style={{ color: '#CDDC39', fontFamily: '"Great Vibes", cursive', fontStyle: 'italic', margin: '0 0.4em' }}>&amp;</span>
                  {groomName}
                </div>
              </motion.div>

              <button onClick={finish}
                className="absolute top-6 right-6 flex items-center gap-2 px-4 h-9 rounded-full border text-xs tracking-[0.25em] uppercase"
                style={{ borderColor: 'rgba(139,195,74,0.5)', color: '#CDDC39' }}
                data-testid="nature-opening-skip-fallback">
                <SkipForward className="w-3 h-3" /> Skip
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NatureCSSFallback;
