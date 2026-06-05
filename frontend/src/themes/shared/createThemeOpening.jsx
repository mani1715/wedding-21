/**
 * createThemeOpening — Higher-order helper that builds an opening animation component.
 *
 * Eliminates repeated boilerplate (tap-to-begin, audio toggle, skip button, cleanup,
 * couple-name reveal) so individual theme files only specify:
 *   • colors palette
 *   • setupScene(scene, params)  → returns { animateFrame(elapsed, stage), objects }
 *   • stage boundaries (default 5)
 *   • title / cta text
 *
 * Each animation still ends with a Stage-5 couple-name reveal using the configured palette.
 */
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward, Volume2, VolumeX } from 'lucide-react';
import {
  pixelRatioCap,
  scaleParticles,
  shouldUseShadows,
  shouldUseAntialias,
  onVisibilityChange,
  isMobile,
  requestIdle,
} from './deviceCaps';

const DEFAULT_STAGES = [0, 2000, 4500, 6500, 8500, 10500];

export const createThemeOpening = ({
  palette,            // { bg, accent, primary, secondary, text }
  intro,              // { title, cta, finalSubtitle }
  stages = DEFAULT_STAGES,
  setupScene,         // (scene, params) => { animate: (elapsed, stage) => void }
  cameraConfig = { fov: 55, pos: [0, 0, 8] },
  ambient = 0xFFFFFF,
  ambientIntensity = 0.45,
  soundFactory = null, // () => SoundController with { start, fadeTo, stop, ... }
  audioVolume = 0.7,   // fade-in target volume when audio is on
  onStageChange = null,// (stage, soundController, stages) => void — fire theme-specific cues
}) => {
  const TOTAL_MS = stages[stages.length - 1];

  return function ThemeOpening({
    brideName = 'Bride',
    groomName = 'Groom',
    monogram,
    subtitle = intro.finalSubtitle,
    particleCount = 220,
    onComplete,
  }) {
    const reduce = useReducedMotion();
    const containerRef = useRef(null);
    const stageRef = useRef(0);
    const sceneObjsRef = useRef(null);
    const rafRef = useRef(null);
    const soundRef = useRef(null);
    const pausedRef = useRef(false);
    const [tapped, setTapped] = useState(false);
    const [stageUI, setStageUI] = useState(0);
    const [audioOn, setAudioOn] = useState(true);
    const [showSkip, setShowSkip] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => {
      if (reduce) {
        setStageUI(5);
        setTimeout(() => finishNow(), 300);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reduce]);

    const initScene = () => {
      const container = containerRef.current;
      if (!container || sceneObjsRef.current) return;
      const w = container.clientWidth, h = container.clientHeight;
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(palette.bg);
      scene.fog = new THREE.Fog(palette.bg, 12, 28);
      const camera = new THREE.PerspectiveCamera(cameraConfig.fov, w / h, 0.1, 100);
      camera.position.set(...cameraConfig.pos);
      // PHASE 5: device-aware renderer — cheaper on mobile/low-end
      const useAA = shouldUseAntialias();
      const renderer = new THREE.WebGLRenderer({
        antialias: useAA,
        alpha: false,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap()));
      renderer.setSize(w, h);
      renderer.shadowMap.enabled = shouldUseShadows();
      container.appendChild(renderer.domElement);
      scene.add(new THREE.AmbientLight(ambient, ambientIntensity));

      // Scale particle count down on mobile/low-end
      const scaledParticles = scaleParticles(particleCount);
      const sceneCtx = setupScene(scene, { THREE, palette, particleCount: scaledParticles, w, h });
      sceneObjsRef.current = { scene, camera, renderer, sceneCtx };

      const onResize = () => {
        const nw = container.clientWidth, nh = container.clientHeight;
        renderer.setSize(nw, nh);
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
      };
      window.addEventListener('resize', onResize);
      sceneObjsRef.current.onResize = onResize;

      // PHASE 5: pause RAF when tab hidden
      const visUnsub = onVisibilityChange((visible) => {
        pausedRef.current = !visible;
      });
      sceneObjsRef.current.visUnsub = visUnsub;
    };

    const computeStage = (elapsed) => {
      for (let i = 0; i < stages.length - 1; i++) {
        if (elapsed >= stages[i] && elapsed < stages[i + 1]) return i;
      }
      return stages.length - 1;
    };

    const tick = (elapsed) => {
      const objs = sceneObjsRef.current;
      if (!objs) return;
      const { scene, camera, renderer, sceneCtx } = objs;
      const stage = computeStage(elapsed);
      if (stage !== stageRef.current) {
        stageRef.current = stage;
        setStageUI(stage);
        if (onStageChange && soundRef.current) {
          try { onStageChange(stage, soundRef.current, stages); } catch (_) {}
        }
        if (stage === stages.length - 1) setTimeout(() => finishNow(), 700);
      }
      sceneCtx.animate(elapsed, stage, stages);
      renderer.render(scene, camera);
    };

    const finishNow = () => {
      setDone(true);
      // Fade audio out before unmount
      if (soundRef.current) {
        try { soundRef.current.fadeTo?.(0, 0.5); } catch (_) {}
      }
      setTimeout(() => {
        cleanup();
        document.body.style.overflow = ''
        document.body.style.touchAction = ''
        onComplete?.();
      }, 700);
    };

    const cleanup = () => {
      const objs = sceneObjsRef.current;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      if (soundRef.current) {
        try { soundRef.current.stop?.(); } catch (_) {}
        soundRef.current = null;
      }
      if (!objs) return;
      if (objs.onResize) window.removeEventListener('resize', objs.onResize);
      if (objs.visUnsub) try { objs.visUnsub(); } catch (_) {}
      // PHASE 5: full WebGL teardown — geometry/material/texture dispose + force context loss
      objs.scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => {
            // Dispose any textures attached to the material
            for (const k in m) {
              const v = m[k];
              if (v && typeof v === 'object' && typeof v.dispose === 'function' && v.isTexture) {
                try { v.dispose(); } catch (_) {}
              }
            }
            try { m.dispose(); } catch (_) {}
          });
        }
      });
      try { objs.renderer.dispose(); } catch (_) {}
      try { objs.renderer.forceContextLoss?.(); } catch (_) {}
      // PHASE 7 (perf): drop all scene refs so GC can reclaim immediately.
      try { objs.scene.clear?.(); } catch (_) {}
      if (objs.renderer.domElement?.parentNode) {
        objs.renderer.domElement.parentNode.removeChild(objs.renderer.domElement);
      }
      sceneObjsRef.current = null;
    };

    useEffect(() => () => cleanup(), []);

    const handleTap = () => {
      if (tapped) return;
      setTapped(true);

      // PHASE 7 (perf): defer the WebGL+scene setup to a browser-idle slot so
      // the tap-to-begin overlay can finish its exit transition smoothly. We
      // cap the wait so on busy main threads the show still starts promptly.
      requestIdle(() => {
        if (!containerRef.current) return;
        initScene();

        // Start procedural audio (no-op if no factory provided)
        if (soundFactory && !soundRef.current) {
          try {
            const ctl = soundFactory();
            soundRef.current = ctl;
            Promise.resolve(ctl.start?.()).then(() => {
              if (audioOn) ctl.fadeTo?.(audioVolume, 1.2);
            }).catch(() => {});
          } catch (_) { /* silent */ }
        }

        const start = Date.now();
        let pausedElapsed = 0;
        let pauseStart = 0;
        const loop = () => {
          if (!sceneObjsRef.current) return;
          if (pausedRef.current) {
            if (!pauseStart) pauseStart = Date.now();
            rafRef.current = requestAnimationFrame(loop);
            return;
          }
          if (pauseStart) {
            pausedElapsed += Date.now() - pauseStart;
            pauseStart = 0;
          }
          const elapsed = Date.now() - start - pausedElapsed;
          if (elapsed < TOTAL_MS) {
            tick(elapsed);
            rafRef.current = requestAnimationFrame(loop);
          } else {
            tick(TOTAL_MS);
            finishNow();
          }
        };
        rafRef.current = requestAnimationFrame(loop);
        setTimeout(() => setShowSkip(true), 1500);
      }, { timeout: 120 });
    };

    const toggleAudio = () => {
      const next = !audioOn;
      setAudioOn(next);
      if (soundRef.current) {
        try { soundRef.current.fadeTo?.(next ? audioVolume : 0, 0.4); } catch (_) {}
      }
    };

    if (reduce) return null;

    const finalStage = stages.length - 1;

    return (
      <div
        className="fixed inset-0 z-[100] overflow-hidden"
        style={{ background: palette.bg }}
        data-testid={`opening-${intro.testid || 'theme'}`}
      >
        <div ref={containerRef} className="absolute inset-0" />

        {!tapped && (
          <motion.div
            className="absolute inset-0 grid place-items-center cursor-pointer"
            onClick={handleTap}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            data-testid="opening-tap-to-begin"
          >
            <motion.div
              className="text-center space-y-4"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div
                className="text-sm tracking-[0.4em] uppercase"
                style={{ color: palette.text || palette.accent }}
              >
                {intro.title}
              </div>
              <div className="text-xs opacity-70" style={{ color: palette.accent }}>
                {intro.cta || 'Tap to Begin'}
              </div>
            </motion.div>
          </motion.div>
        )}

        <AnimatePresence>
          {stageUI === finalStage && !done && (
            <motion.div
              className="absolute inset-0 grid place-items-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center space-y-6 px-8">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="space-y-2"
                >
                  <div
                    className="text-5xl md:text-6xl font-serif font-bold tracking-wide"
                    style={{
                      color: palette.text || palette.accent,
                      textShadow: `0 0 40px ${palette.accent}, 0 2px 4px rgba(0,0,0,0.8)`,
                    }}
                  >
                    {brideName}
                  </div>
                  <div
                    className="text-3xl md:text-4xl italic"
                    style={{ color: palette.accent }}
                  >
                    &amp;
                  </div>
                  <div
                    className="text-5xl md:text-6xl font-serif font-bold tracking-wide"
                    style={{
                      color: palette.text || palette.accent,
                      textShadow: `0 0 40px ${palette.accent}, 0 2px 4px rgba(0,0,0,0.8)`,
                    }}
                  >
                    {groomName}
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-sm tracking-[0.3em] uppercase"
                  style={{ color: palette.accent }}
                >
                  {subtitle}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {tapped && (
          <div className="absolute top-6 right-6 z-10 flex gap-3">
            <button
              onClick={() => setAudioOn(!audioOn)}
              className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm grid place-items-center hover:bg-black/50"
              style={{ color: palette.text || palette.accent }}
              data-testid="opening-audio-toggle"
            >
              {audioOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            {showSkip && !done && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={finishNow}
                className="px-4 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center gap-2 hover:bg-black/50 text-sm"
                style={{ color: palette.text || palette.accent }}
                data-testid="opening-skip"
              >
                <span>Skip</span>
                <SkipForward size={16} />
              </motion.button>
            )}
          </div>
        )}
      </div>
    );
  };
};

export default createThemeOpening;
