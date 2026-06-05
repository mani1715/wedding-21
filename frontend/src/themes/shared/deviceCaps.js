/**
 * deviceCaps — Lightweight runtime detection used by 3D animations to scale themselves
 * down on phones / low-end devices so the experience stays smooth.
 *
 * No detect-gpu dependency for the hot path; we use a fast heuristic:
 *   • Touch device + narrow viewport → mobile
 *   • Low devicePixelRatio cap (1.5 on mobile vs 2 on desktop)
 *   • Hardware concurrency hints
 */

export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua)) return true;
  // Tablet-with-touch heuristic
  if ('ontouchstart' in window && window.innerWidth < 900) return true;
  return false;
};

export const isLowEnd = () => {
  if (typeof window === 'undefined') return false;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  if (cores <= 4 && mem <= 4) return true;
  return false;
};

/**
 * pixelRatioCap — Sensible upper-bound for renderer.setPixelRatio.
 * PHASE 7 (perf): mobile capped at 1.3 (down from 1.5) to cut fragment work
 * on high-DPR phones; desktop stays at 2 for Retina sharpness.
 */
export const pixelRatioCap = () => (isMobile() ? 1.3 : 2);

/**
 * scaleParticles — Reduce particle count on mobile / low-end.
 */
export const scaleParticles = (count) => {
  if (isLowEnd()) return Math.floor(count * 0.4);
  if (isMobile()) return Math.floor(count * 0.6);
  return count;
};

/**
 * shouldUseShadows — Shadow maps are expensive; off on mobile.
 */
export const shouldUseShadows = () => !isMobile() && !isLowEnd();

/**
 * shouldUseAntialias — MSAA hurts perf on weak GPUs.
 * PHASE 7 (perf): also disabled on mobile so phones don't pay the MSAA tax.
 */
export const shouldUseAntialias = () => !isMobile() && !isLowEnd();

/**
 * createVisibilityPauser — Returns { addPauseable(rafLoop), remove() } helpers
 * to pause RAF loops when the tab is hidden (saves battery + prevents
 * frame-skip stutter when the user returns).
 */
export const onVisibilityChange = (handler) => {
  if (typeof document === 'undefined') return () => {};
  const fn = () => handler(document.visibilityState !== 'hidden');
  document.addEventListener('visibilitychange', fn);
  return () => document.removeEventListener('visibilitychange', fn);
};

/**
 * PHASE 7 (perf): defer heavy work (Three.js init, large allocations) to a
 * browser-idle slot so it doesn't compete with the user's tap/scroll/paint.
 * Falls back to a small setTimeout where requestIdleCallback isn't available
 * (Safari < 17, older WebViews). `timeout` caps the deferral so the work
 * still happens promptly when the browser is busy.
 */
export const requestIdle = (cb, { timeout = 200 } = {}) => {
  if (typeof window === 'undefined') return cb();
  if (typeof window.requestIdleCallback === 'function') {
    return window.requestIdleCallback(cb, { timeout });
  }
  return setTimeout(cb, 1);
};
