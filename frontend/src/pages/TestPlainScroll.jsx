/**
 * /test/plain-scroll
 *
 * Route 1 — barest possible scrollable page.
 *
 * - NO Tailwind classes (inline styles only)
 * - NO Framer Motion
 * - NO global CSS reliance beyond browser defaults
 * - NO React effects (besides one passive touch counter)
 * - NO canvas / no overlays / no fixed elements
 *
 * The page IS still rendered inside <App>'s shell because React Router
 * mounts it there. That's intentional: any scroll difference between this
 * route and the next two routes isolates whether the App shell wrapper is
 * the culprit.
 */
import React, { useEffect, useRef, useState } from 'react';

const BLOCK_COUNT = 30;

const ScrollHUD = ({ touchCount, touchLog }) => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 250);
    return () => clearInterval(id);
  }, []);
  // tick is read so React re-renders; suppress unused-var
  void tick;
  return (
    <div
      data-testid="scroll-hud"
      style={{
        position: 'fixed',
        top: 8,
        left: 8,
        right: 8,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.85)',
        color: '#0f0',
        font: '12px/1.4 monospace',
        padding: '8px 10px',
        borderRadius: 6,
        border: '1px solid #0f0',
        pointerEvents: 'none',
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

export default function TestPlainScroll() {
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

  const colors = ['#2d4a8a', '#8a2d4a', '#4a8a2d', '#8a6a2d', '#2d8a8a', '#6a2d8a'];

  return (
    <>
      <ScrollHUD touchCount={touchCount} touchLog={touchLog} />
      <div
        data-testid="plain-scroll-root"
        style={{
          margin: 0,
          padding: '120px 16px 60px',
          background: '#111',
          color: '#fff',
          font: '15px/1.55 system-ui, sans-serif',
        }}
      >
        <h1 style={{ fontSize: 22, margin: '0 0 6px' }}>Route 1 — /test/plain-scroll</h1>
        <p style={{ margin: 0, opacity: 0.8 }}>
          Plain inline-styled blocks only. Try to scroll with ONE finger.
        </p>
        {Array.from({ length: BLOCK_COUNT }, (_, i) => (
          <div
            key={i}
            data-testid={`plain-block-${i}`}
            style={{
              background: colors[i % colors.length],
              padding: '40px 18px',
              margin: '14px 0',
              borderRadius: 8,
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            Block {i + 1} of {BLOCK_COUNT}
          </div>
        ))}
        <div style={{ padding: 30, textAlign: 'center', opacity: 0.7 }}>
          — end of plain-scroll page —
        </div>
      </div>
    </>
  );
}
