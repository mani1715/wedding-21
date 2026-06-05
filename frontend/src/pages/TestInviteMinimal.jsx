/**
 * /test/invite-minimal
 *
 * Route 3 — same TOP-LEVEL structure as LuxuryPublicInvitation but stripped to bare minimum.
 *
 * Replicates from LuxuryPublicInvitation.jsx:
 *   - Same useEffect on mount that sets body.classList ('luxe'), removes 'luxe-grain'/'luxe-vignette',
 *     and sets document.body.style.background = light gradient.
 *   - Same import of '@/styles/luxury.css'
 *   - Same outer wrapper className pattern
 *
 * Removed:
 *   - Framer Motion <motion.*> usage (no animations)
 *   - ThemeAnimatedBackground (no canvas)
 *   - PetalConfetti / WaxSealOpening / OpeningOrchestrator (no openings)
 *   - All modals (FindMyPhotos, LivePhotoWallTeaser, PreWedding, etc.)
 *   - AmbientMusicPlayer (no audio)
 *   - GuestUploadButton, WatermarkOverlay (no fixed overlays)
 *   - Gallery, UniversalDesignRenderer
 *
 * Renders: hero title + couple names + 20 filler sections.
 */
import React, { useEffect, useRef, useState } from 'react';
import '@/styles/luxury.css';

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

export default function TestInviteMinimal() {
  const touchCountRef = useRef(0);
  const [touchCount, setTouchCount] = useState(0);
  const [touchLog, setTouchLog] = useState('(no touches yet)');

  // Exact same body-class & background side effect as LuxuryPublicInvitation
  useEffect(() => {
    document.body.classList.add('luxe');
    document.body.classList.remove('luxe-grain', 'luxe-vignette');
    document.body.style.background = 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)';
    return () => {
      document.body.classList.remove('luxe');
      document.body.style.background = '';
    };
  }, []);

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
      <div className="min-h-screen" data-testid="invite-minimal-root" style={{ paddingTop: 110, color: '#1a1a1a' }}>
        <section className="text-center px-6 py-16" data-testid="invite-hero">
          <p className="uppercase tracking-[0.3em] text-sm" style={{ color: '#9c7e3a' }}>
            Save the date
          </p>
          <h1 className="font-serif text-5xl md:text-7xl mt-3 mb-2" style={{ color: '#2a2a2a' }}>
            Maneesh <span style={{ fontStyle: 'italic', color: '#9c7e3a' }}>&amp;</span> Arya
          </h1>
          <p className="text-lg" style={{ color: '#555' }}>
            12 · February · 2026 — Bangalore
          </p>
          <p className="mt-4 text-base" style={{ color: '#777' }}>
            Route 3 — invite-minimal. Try scrolling with one finger.
          </p>
        </section>

        {Array.from({ length: 20 }, (_, i) => (
          <section
            key={i}
            data-testid={`invite-section-${i}`}
            className="px-6 py-12"
            style={{
              borderTop: '1px solid rgba(0,0,0,0.08)',
              background: i % 2 === 0 ? 'rgba(255,255,255,0.65)' : 'rgba(245,247,250,0.85)',
            }}
          >
            <div className="max-w-3xl mx-auto">
              <h2 className="font-serif text-2xl md:text-3xl mb-3" style={{ color: '#3a2a1a' }}>
                Section {i + 1}
              </h2>
              <p className="text-base" style={{ color: '#444', lineHeight: 1.7 }}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
                nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
              <div style={{ height: 60 }} />
            </div>
          </section>
        ))}

        <footer className="text-center py-12 text-sm" style={{ color: '#888' }}>
          — end of invite-minimal page —
        </footer>
      </div>
    </>
  );
}
