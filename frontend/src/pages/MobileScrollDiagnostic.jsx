/**
 * MobileScrollDiagnostic — open this on your real Android phone at
 *   /diag/scroll
 * It runs in the browser and shows ON-SCREEN exactly what's happening:
 *   • body/html overflow values
 *   • scrollHeight vs viewport
 *   • whether touch events fire
 *   • whether actual scroll occurs after swipe
 *   • timestamps of last 5 touchstart/touchmove events
 *   • a button to scroll programmatically (proves DOM scroll works)
 *
 * Long page (2× viewport) so user can actually try to swipe.
 */
import React, { useEffect, useState, useRef } from 'react';

const fmt = (k, v) => `${k.padEnd(28, ' ')} : ${v}`;

export default function MobileScrollDiagnostic() {
  const [state, setState] = useState({});
  const [touches, setTouches] = useState([]);
  const touchesRef = useRef([]);

  useEffect(() => {
    const collect = () => {
      const cs = (el, k) => getComputedStyle(el)[k];
      const html = document.documentElement, body = document.body;
      setState({
        userAgent: navigator.userAgent.slice(0, 90),
        viewport: `${window.innerWidth} × ${window.innerHeight}`,
        bodyScrollHeight: body.scrollHeight,
        htmlScrollHeight: html.scrollHeight,
        bodyOverflow: cs(body, 'overflow'),
        bodyOverflowY: cs(body, 'overflowY'),
        htmlOverflow: cs(html, 'overflow'),
        htmlOverflowY: cs(html, 'overflowY'),
        bodyTouchAction: cs(body, 'touchAction'),
        htmlTouchAction: cs(html, 'touchAction'),
        bodyStyleInline: body.style.overflow || '(empty)',
        bodyStyleHeight: body.style.height || '(empty)',
        htmlStyleInline: html.style.overflow || '(empty)',
        scrollY: window.scrollY,
        canScrollBy: (body.scrollHeight - window.innerHeight),
      });
    };
    collect();
    const id = setInterval(collect, 500);

    const log = (type, e) => {
      const entry = `${new Date().toISOString().slice(11, 23)} ${type} y=${e.touches?.[0]?.clientY ?? '-'}`;
      touchesRef.current = [entry, ...touchesRef.current].slice(0, 8);
      setTouches([...touchesRef.current]);
    };
    const onStart = (e) => log('touchstart', e);
    const onMove  = (e) => log('touchmove ', e);
    const onEnd   = (e) => log('touchend  ', e);
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove',  onMove,  { passive: true });
    window.addEventListener('touchend',   onEnd,   { passive: true });

    return () => {
      clearInterval(id);
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove',  onMove);
      window.removeEventListener('touchend',   onEnd);
    };
  }, []);

  const tryScroll = () => window.scrollBy({ top: 600, behavior: 'smooth' });

  return (
    <div style={{
      minHeight: '300vh',
      padding: 20,
      fontFamily: 'monospace',
      background: '#0a0a0a',
      color: '#FFF8DC',
      fontSize: 13,
      lineHeight: 1.55,
    }} data-testid="scroll-diag-page">
      <div style={{
        position: 'sticky', top: 0, background: '#0a0a0a',
        padding: '10px 0', borderBottom: '1px solid #444', marginBottom: 12,
      }}>
        <div style={{ fontSize: 16, color: '#D4AF37', marginBottom: 6 }}>
          📱 Mobile Scroll Diagnostic
        </div>
        <button
          onClick={tryScroll}
          data-testid="diag-scroll-btn"
          style={{
            padding: '10px 18px', background: '#D4AF37',
            color: '#000', border: 0, borderRadius: 8, marginTop: 4,
          }}>
          Tap to scroll 600px programmatically
        </button>
      </div>

      <pre style={{ whiteSpace: 'pre-wrap', margin: 0, color: '#9FE3C0' }}>
{`=== DOM STATE (refreshes every 500ms) ===
${Object.entries(state).map(([k, v]) => fmt(k, v)).join('\n')}

=== LAST TOUCH EVENTS (try swiping up and watch this list) ===
${touches.length === 0 ? '(no touch events received yet — try swiping)' : touches.join('\n')}

=== INTERPRETATION ===
1. canScrollBy must be > 0   ← if it's 0, page isn't tall enough
2. bodyOverflow should be    "hidden auto"
3. bodyStyleInline should be "(empty)"
4. bodyTouchAction should be "pan-y pinch-zoom"  or "auto"
5. After a swipe, scrollY must change AND you must see touchmove events above
`}
      </pre>

      <div style={{ marginTop: 80, color: '#888' }}>
        ↓ Long padding below so the page is taller than 3 viewports ↓
      </div>
      {Array.from({ length: 30 }, (_, i) => (
        <div key={i} style={{
          padding: '20px 12px', margin: '14px 0',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid #2a2a2a', borderRadius: 8,
        }}>
          Block #{i + 1} — if you can see this when you swipe, scrolling works.
        </div>
      ))}
    </div>
  );
}
