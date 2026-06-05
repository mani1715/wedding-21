/**
 * Kerala Backwaters — Sound Controller (visual-only iteration)
 *
 * Audio is intentionally stubbed for this build. Music hooks remain wired
 * so we can drop in veena / nadaswaram / temple-festival WAVs later without
 * touching the opening-sequence logic.
 *
 * Drop-in replacement contract used by the opening:
 *   const ctl = createKeralaSoundController();
 *   await ctl.start();          // user gesture
 *   ctl.fadeTo(volume, durationS);
 *   ctl.swell();                // sacred build
 *   ctl.ripple();               // water/boat moment
 *   ctl.stop();
 */
export const createKeralaSoundController = () => {
  // Silent stub — returns the same shape, no-ops everywhere.
  return {
    start:   async () => Promise.resolve(),
    fadeTo:  (_v, _d) => undefined,
    swell:   () => undefined,
    ripple:  () => undefined,
    stop:    () => undefined,
  };
};
