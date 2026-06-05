/**
 * /test/layout-scroll
 *
 * Route 2 — same App shell, same global CSS, but no wedding/animation components.
 *
 * Difference from Route 1:
 *   - Uses Tailwind classes (so global CSS, mobile-fixes.css, luxury.css all apply)
 *   - Uses the same wrapper structure as LandingPage (div.luxe-relative > section.min-h-screen)
 *   - Does NOT import any Framer Motion, modals, canvases, or theme components
 *
 * Difference from Route 3:
 *   - No invitation-page-specific structure
 *
 * If this route scrolls fine but Route 1 also scrolls fine and Route 3 fails,
 * the bug is invitation-specific. If THIS route fails while Route 1 succeeds,
 * the bug is in global CSS or the App shell.
 */
import React, { useEffect, useRef, useState } from 'react';

const ScrollHUD = ({ touchCount, touchLog }) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 250);
    return () => clearInterval(id);
  }, []);
  return (
    <div
      data-testid="scroll-hud"
      style={{
        position: 'fixed', top: 8, left: 8, right: 8, zIndex: 9999,
        background: 'rgba(0,0,0,0.85)', color: '#0f0',
        font: '12px/1.4 monospace', padding: '8px 10px',
        borderRadius: 6, border: '1px solid #0f0', pointerEvents: 'none',
      }}
    >
      <div>scrollY: {Math.round(window.scrollY)}</div>
      <div>doc.scrollHeight: {document.documentElement.scrollHeight}</div>
      <div>innerHeight: {window.innerHeight}</div>
      <div>touch events: {touchCount}</div>
      <div style={{ marginTop: 4, color: '#ff0' }}>{touchLog}</div>
    </div>
  );
};

export default function TestLayoutScroll() {
  const touchCountRef = useRef(0);
  const [touchCount, setTouchCount] = useState(0);
  const [touchLog, setTouchLog] = useState('(no touches yet)');

  useEffect(() => {
    const bump = (label) => (e) => {
      touchCountRef.current += 1;
      setTouchCount(touchCountRef.current);
      const y = e.touches && e.touches[0] ? Math.round(e.touches[0].clientY) : '-';
      setTouchLog(`${label} y=${y} sY=${Math.round(window.scrollY)}`);
    };
    const a = bump('touchstart');
    const b = bump('touchmove ');
    const c = bump('touchend  ');
    window.addEventListener('touchstart', a, { passive: true });
    window.addEventListener('touchmove', b, { passive: true });
    window.addEventListener('touchend', c, { passive: true });
    return () => {
      window.removeEventListener('touchstart', a);
      window.removeEventListener('touchmove', b);
      window.removeEventListener('touchend', c);
    };
  }, []);

  return (
    <>
      <ScrollHUD touchCount={touchCount} touchLog={touchLog} />
      <div className="luxe relative" data-testid="layout-scroll-root">
        <section className="relative min-h-screen flex flex-col justify-center pt-24 md:pt-32 pb-16 md:pb-24 overflow-hidden">
          <div className="relative z-10 max-w-6xl px-6">
            <h1 className="text-4xl md:text-6xl font-serif text-yellow-200 mb-4">
              Route 2 — /test/layout-scroll
            </h1>
            <p className="text-base md:text-lg text-white/80">
              Same App shell + global CSS as LandingPage, but no animations or wedding components.
            </p>
          </div>
        </section>

        {Array.from({ length: 25 }, (_, i) => (
          <section
            key={i}
            data-testid={`layout-section-${i}`}
            className="relative px-6 py-12 border-t border-white/10"
            style={{ background: i % 2 === 0 ? '#1a1a1f' : '#0f0f12' }}
          >
            <div className="max-w-6xl">
              <h2 className="text-xl md:text-2xl text-yellow-200 mb-3">Section {i + 1}</h2>
              <p className="text-white/70 text-base">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua. Try scrolling with one finger.
              </p>
              <div style={{ height: 80 }} />
            </div>
          </section>
        ))}

        <div className="px-6 py-12 text-center text-white/50">— end of layout-scroll page —</div>
      </div>
    </>
  );
}
