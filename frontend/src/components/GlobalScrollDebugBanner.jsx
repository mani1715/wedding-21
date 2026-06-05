/**
 * GlobalScrollDebugBanner
 *
 * Always-on top banner showing live scroll/touch state. Visible on EVERY page.
 * Logs to window.__scrollDebug every second for inspection.
 *
 * Activated whenever the URL contains  ?debug=scroll  or localStorage has
 * `scroll_debug` set to '1'. Turn off by removing the query param + key.
 *
 * Note: This is a diagnostic component. Will be removed once the bug is found.
 */
import React, { useEffect, useRef, useState } from 'react';

const isActive = () => {
  try {
    if (typeof window === 'undefined') return false;
    if (window.location.search.includes('debug=scroll')) {
      localStorage.setItem('scroll_debug', '1');
      return true;
    }
    return localStorage.getItem('scroll_debug') === '1';
  } catch {
    return false;
  }
};

export default function GlobalScrollDebugBanner() {
  const [active] = useState(() => isActive());
  const [tick, setTick] = useState(0);
  const touchCountRef = useRef({ start: 0, move: 0, end: 0 });
  const lastTouchRef = useRef('(none)');
  const lockMatchRef = useRef({
    modalZ100: false,
    dialogOpen: false,
    openingZ100: false,
    lastChange: null,
  });

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      // Re-evaluate matches every tick
      try {
        const a = !!document.querySelector('.modal-overlay.z-\\[100\\]');
        const b = !!document.querySelector('[role="dialog"][data-state="open"]');
        const c = !!document.querySelector('.opening-overlay.z-\\[100\\]');
        const prev = lockMatchRef.current;
        if (prev.modalZ100 !== a || prev.dialogOpen !== b || prev.openingZ100 !== c) {
          lockMatchRef.current = {
            modalZ100: a, dialogOpen: b, openingZ100: c,
            lastChange: new Date().toISOString().slice(11, 23),
          };
        }
      } catch (e) { /* ignore selector errors */ }
      setTick((t) => t + 1);
    }, 500);

    const onStart = (e) => {
      touchCountRef.current.start += 1;
      const t = e.touches && e.touches[0];
      lastTouchRef.current = `touchstart fingers=${e.touches.length} y=${t ? Math.round(t.clientY) : '-'}`;
    };
    const onMove = (e) => {
      touchCountRef.current.move += 1;
      const t = e.touches && e.touches[0];
      lastTouchRef.current = `touchmove  fingers=${e.touches.length} y=${t ? Math.round(t.clientY) : '-'} sY=${Math.round(window.scrollY)}`;
    };
    const onEnd = () => {
      touchCountRef.current.end += 1;
      lastTouchRef.current = `touchend  sY=${Math.round(window.scrollY)}`;
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });

    // Expose snapshot on window
    window.__scrollDebug = () => ({
      bodyOverflow: getComputedStyle(document.body).overflow,
      bodyOverflowY: getComputedStyle(document.body).overflowY,
      bodyTouchAction: getComputedStyle(document.body).touchAction,
      htmlOverflowY: getComputedStyle(document.documentElement).overflowY,
      htmlTouchAction: getComputedStyle(document.documentElement).touchAction,
      bodyClass: document.body.className,
      bodyInlineStyle: document.body.getAttribute('style') || '(empty)',
      scrollY: window.scrollY,
      docHeight: document.documentElement.scrollHeight,
      innerHeight: window.innerHeight,
      touchCounts: touchCountRef.current,
      lockSelectors: lockMatchRef.current,
    });

    return () => {
      clearInterval(id);
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [active]);

  if (!active) return null;
  // tick is read so React re-renders; suppress unused-var
  void tick;

  const bodyOverflow = getComputedStyle(document.body).overflow;
  const bodyTA = getComputedStyle(document.body).touchAction;
  const bodyCls = document.body.className.slice(0, 60);
  const sY = Math.round(window.scrollY);
  const counts = touchCountRef.current;
  const lock = lockMatchRef.current;
  const anyLockMatch = lock.modalZ100 || lock.dialogOpen || lock.openingZ100;

  return (
    <div
      data-testid="global-scroll-debug-banner"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2147483647,
        background: anyLockMatch ? 'rgba(180,0,0,0.95)' : 'rgba(0,0,0,0.92)',
        color: anyLockMatch ? '#fff' : '#0f0',
        font: '11px/1.35 monospace',
        padding: '6px 8px',
        pointerEvents: 'none',
        borderBottom: anyLockMatch ? '2px solid #fff' : '1px solid #0f0',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
      }}
    >
      <div>body.overflow={bodyOverflow} touch-action={bodyTA}</div>
      <div>body.class=[{bodyCls}]</div>
      <div>scrollY={sY} touches s={counts.start}/m={counts.move}/e={counts.end}</div>
      <div>last: {lastTouchRef.current}</div>
      <div>
        :has() matches modal={String(lock.modalZ100)} dialog={String(lock.dialogOpen)} opening={String(lock.openingZ100)}
        {anyLockMatch ? '   ⚠ LOCK RULE ACTIVE' : ''}
      </div>
    </div>
  );
}
