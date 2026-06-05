/**
 * MuslimOpening3D — Three.js cinematic 5-stage Muslim Nikah opening.
 *
 * Stage 1 (0–2s):   Deep navy. Stars appear one by one. Oud melody begins.
 * Stage 2 (2–4.5s): 3D Mashrabiya geometric lattice (instanced BoxGeometry star pattern) slides in from right
 * Stage 3 (4.5–6.5s): Mashrabiya slides away left → crescent moon (DOM) rises + fanous lantern glow
 * Stage 4 (6.5–8.5s): Islamic 8-fold tessellation pattern materializes (DOM SVG)
 * Stage 5 (8.5–10s): "بِسْمِ اللَّهِ" Bismillah Arabic calligraphy + couple names in gold
 */
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward, Volume2, VolumeX } from 'lucide-react';
import { createMuslimSoundController } from './muslim.sounds';

const STAGE_BOUNDARIES = [0, 2000, 4500, 6500, 8500, 10000]; // ms
const TOTAL_MS = STAGE_BOUNDARIES[STAGE_BOUNDARIES.length - 1];

const MuslimOpening3D = ({
  brideName = 'Ayesha',
  groomName = 'Zayn',
  monogram  = 'A ☾ Z',
  subtitle  = 'Muslim Nikah',
  particleCount = 60,
  onComplete,
}) => {
  const reduce = useReducedMotion();
  const containerRef = useRef(null);
  const stageRef = useRef(0);
  const sceneObjsRef = useRef(null);
  const soundRef = useRef(null);

  const [tapped, setTapped] = useState(false);
  const [stageUI, setStageUI] = useState(0);
  const [audioOn, setAudioOn] = useState(true);
  const [showSkip, setShowSkip] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (reduce) {
      setStageUI(5);
      setTimeout(() => finish(), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  const initScene = () => {
    const container = containerRef.current;
    if (!container || sceneObjsRef.current) return;

    const w = container.clientWidth;
    const h = container.clientHeight;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#060810');
    const camera = new THREE.PerspectiveCamera(48, w / h, 0.1, 100);
    camera.position.set(0, 0, 5);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ? 1.5 : 2));
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xB8C5DD, 0.30));
    const goldLight = new THREE.PointLight(0xC5A028, 1.2); goldLight.position.set(0, 1, 3); scene.add(goldLight);
    const backLight = new THREE.PointLight(0xE8D5A3, 0.6); backLight.position.set(0, -1, -2); scene.add(backLight);

    // ── Mashrabiya lattice — instanced grid of 8-pointed stars made from BoxGeometry pieces ──
    const mashGroup = new THREE.Group();
    const latticeMat = new THREE.MeshStandardMaterial({
      color: 0xC5A028, roughness: 0.45, metalness: 0.6,
      emissive: 0xC5A028, emissiveIntensity: 0.20,
    });

    // Build star/lattice cells (4 rotated rectangles per cell = 8-pointed star outline)
    const cellSize = 0.55;
    const gridX = 7, gridY = 5;
    const stripLen = 0.40, stripThick = 0.025;
    for (let i = 0; i < gridX; i++) {
      for (let j = 0; j < gridY; j++) {
        const cx = (i - (gridX - 1) / 2) * cellSize;
        const cy = (j - (gridY - 1) / 2) * cellSize;
        // 4 rotated strips per star
        for (let k = 0; k < 4; k++) {
          const strip = new THREE.Mesh(
            new THREE.BoxGeometry(stripLen, stripThick, stripThick),
            latticeMat,
          );
          strip.position.set(cx, cy, 0);
          strip.rotation.z = (k / 4) * Math.PI;
          mashGroup.add(strip);
        }
        // Small connector dot
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(stripThick * 1.3, 6, 6),
          latticeMat,
        );
        dot.position.set(cx, cy, 0);
        mashGroup.add(dot);
      }
    }
    mashGroup.position.set(6, 0, 0); // start off-screen right
    scene.add(mashGroup);

    // ── Twinkling stars (additive Points) ──
    const dustGeom = new THREE.BufferGeometry();
    const dustArr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      dustArr[i * 3]     = (Math.random() - 0.5) * 14;
      dustArr[i * 3 + 1] = (Math.random() - 0.5) * 7;
      dustArr[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    dustGeom.setAttribute('position', new THREE.BufferAttribute(dustArr, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xE8D5A3, size: 0.04, transparent: true, opacity: 0.6,
      sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const dust = new THREE.Points(dustGeom, dustMat);
    scene.add(dust);

    sceneObjsRef.current = {
      scene, camera, renderer,
      mashGroup, latticeMat,
      dust, dustGeom, dustMat,
      particleCount,
    };

    let rafId;
    const clock = new THREE.Clock();
    const tick = () => {
      const delta = clock.getDelta();
      const stage = stageRef.current;
      const objs = sceneObjsRef.current;
      if (!objs) return;

      // Stars twinkle
      objs.dustMat.opacity = 0.4 + 0.3 * Math.abs(Math.sin(clock.elapsedTime * 0.7));

      // Mashrabiya — slides in stage 2, out in stage 3
      let mashTargetX = 6;
      if (stage === 2) mashTargetX = 0;
      else if (stage === 3) mashTargetX = -8;
      objs.mashGroup.position.x += (mashTargetX - objs.mashGroup.position.x) * Math.min(1, delta * 1.4);

      // Camera breathing
      const t = clock.elapsedTime;
      objs.camera.position.x = Math.sin(t * 0.20) * 0.06;
      objs.camera.position.y = Math.cos(t * 0.25) * 0.04;
      objs.camera.lookAt(0, 0, 0);

      objs.renderer.render(objs.scene, objs.camera);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const onResize = () => {
      const objs = sceneObjsRef.current;
      if (!objs || !container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      objs.camera.aspect = w / h;
      objs.camera.updateProjectionMatrix();
      objs.renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    sceneObjsRef.current.cleanup = () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
    };
  };

  const start = async () => {
    if (tapped) return;
    setTapped(true);
    soundRef.current = createMuslimSoundController();
    if (audioOn) {
      await soundRef.current.start();
      soundRef.current.fadeTo(0.18, 1.2);
    }
    initScene();

    STAGE_BOUNDARIES.forEach((ms, i) => {
      if (i === 0) return;
      setTimeout(() => {
        stageRef.current = i;
        setStageUI(i);
        if (soundRef.current && audioOn) {
          if (i === 1) soundRef.current.oudPhrase();
          if (i === 5) soundRef.current.fadeTo(0.10, 1.0);
        }
      }, ms);
    });
    setTimeout(() => finish(), TOTAL_MS + 600);
    setTimeout(() => setShowSkip(true), 2000);
  };

  const finish = () => {
    if (done) return;
    setDone(true);
    if (soundRef.current) soundRef.current.stop();
    setTimeout(() => onComplete?.(), 800);
  };

  const toggleAudio = () => {
    setAudioOn((on) => {
      if (soundRef.current) soundRef.current.fadeTo(on ? 0 : 0.18, 0.4);
      return !on;
    });
  };

  useEffect(() => () => {
    const objs = sceneObjsRef.current;
    if (!objs) return;
    objs.cleanup?.();
    objs.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
    objs.renderer.dispose();
    objs.renderer.forceContextLoss?.();
    if (objs.renderer.domElement.parentNode) {
      objs.renderer.domElement.parentNode.removeChild(objs.renderer.domElement);
    }
    sceneObjsRef.current = null;
  }, []);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }}
          className="fixed inset-0 z-[80] overflow-hidden"
          style={{ background: '#060810' }}
          data-testid="muslim-opening-3d"
          data-stage={stageUI}
        >
          <div ref={containerRef} className="absolute inset-0" />

          {/* Stage 3 — Crescent moon rises + fanous lantern */}
          <AnimatePresence>
            {stageUI >= 3 && (
              <>
                <motion.svg
                  initial={{ y: 200, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
                  viewBox="0 0 100 100"
                  className="absolute pointer-events-none"
                  style={{ width: 180, height: 180, top: '12%', left: '50%', transform: 'translateX(-50%)' }}
                  aria-hidden="true"
                >
                  <defs>
                    <radialGradient id="moonGradOp" cx="50%" cy="50%" r="50%">
                      <stop offset="0%"  stopColor="#F5DEB3" />
                      <stop offset="100%" stopColor="#C5A028" stopOpacity="0.4" />
                    </radialGradient>
                  </defs>
                  <path d="M 70 50 A 28 28 0 1 1 70 49 A 20 20 0 1 0 70 50 Z" fill="url(#moonGradOp)" />
                </motion.svg>

                {/* Fanous lantern below */}
                <motion.svg
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 0.85, scale: 1 }}
                  transition={{ delay: 0.5, duration: 1.0 }}
                  viewBox="0 0 100 140"
                  className="absolute pointer-events-none"
                  style={{ width: 80, height: 112, bottom: '12%', left: '50%', transform: 'translateX(-50%)' }}
                  aria-hidden="true"
                >
                  <defs>
                    <radialGradient id="lampGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#FFEEAA" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#C5A028" stopOpacity="0.4" />
                    </radialGradient>
                  </defs>
                  <line x1="50" y1="0" x2="50" y2="22" stroke="#C5A028" strokeWidth="1.5" />
                  <ellipse cx="50" cy="22" rx="12" ry="3" fill="#C5A028" />
                  <path d="M 28 30 L 72 30 L 80 60 L 75 100 L 25 100 L 20 60 Z" fill="url(#lampGrad)" stroke="#C5A028" strokeWidth="1.5" />
                  {/* Lattice lines */}
                  <line x1="28" y1="30" x2="75" y2="100" stroke="#C5A028" strokeWidth="0.6" opacity="0.6" />
                  <line x1="72" y1="30" x2="25" y2="100" stroke="#C5A028" strokeWidth="0.6" opacity="0.6" />
                  <line x1="20" y1="60" x2="80" y2="60" stroke="#C5A028" strokeWidth="0.6" opacity="0.6" />
                  <ellipse cx="50" cy="110" rx="20" ry="4" fill="#C5A028" />
                  <line x1="50" y1="114" x2="50" y2="125" stroke="#C5A028" strokeWidth="1.5" />
                </motion.svg>
              </>
            )}
          </AnimatePresence>

          {/* Stage 4 — 8-fold tessellation appears subtly */}
          <AnimatePresence>
            {stageUI >= 4 && stageUI < 5 && (
              <motion.svg
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 0.4, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.4 }}
                viewBox="0 0 400 400"
                className="absolute top-1/2 left-1/2 pointer-events-none"
                style={{ width: 'min(80vh, 540px)', height: 'min(80vh, 540px)', transform: 'translate(-50%, -50%)' }}
                aria-hidden="true"
              >
                {/* Octagonal star pattern */}
                {[80, 130, 180].map((r, idx) => (
                  <g key={idx}>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <line key={i}
                        x1="200" y1="200"
                        x2={200 + Math.cos(i * Math.PI / 4) * r}
                        y2={200 + Math.sin(i * Math.PI / 4) * r}
                        stroke="#C5A028" strokeWidth="0.6"
                      />
                    ))}
                    <polygon
                      points={Array.from({ length: 16 }).map((_, i) => {
                        const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
                        const rad = i % 2 === 0 ? r : r * 0.55;
                        return `${200 + Math.cos(a) * rad},${200 + Math.sin(a) * rad}`;
                      }).join(' ')}
                      fill="none" stroke="#C5A028" strokeWidth="0.7"
                    />
                  </g>
                ))}
              </motion.svg>
            )}
          </AnimatePresence>

          {/* Stage 5 — Bismillah + couple names */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <AnimatePresence>
              {stageUI >= 5 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  className="text-center relative z-10"
                  style={{ color: '#F5F5F5' }}
                >
                  <div
                    className="mb-3 text-xl md:text-3xl"
                    style={{ color: '#C5A028', fontFamily: '"Noto Naskh Arabic", "Amiri", serif', direction: 'rtl' }}
                  >
                    بِسْمِ ٱللَّٰهِ
                  </div>
                  <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: '#C5A028' }}>
                    ☾ {subtitle}
                  </div>
                  <div className="text-[2.4rem] md:text-[4.2rem] leading-none"
                    style={{
                      fontFamily: '"Cormorant Garamond", serif', fontWeight: 400, letterSpacing: '0.04em',
                      textShadow: '0 0 24px rgba(197,160,40,0.45)',
                    }}>
                    <RevealText text={brideName} delay={0} />
                    <span style={{ color: '#C5A028', fontFamily: '"Great Vibes", cursive', fontStyle: 'italic', margin: '0 0.4em' }}>&amp;</span>
                    <RevealText text={groomName} delay={brideName.length * 0.05 + 0.3} />
                  </div>
                  <div className="text-[11px] tracking-[0.5em] uppercase mt-4 opacity-70">{monogram}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {!tapped && (
              <motion.button onClick={start}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 grid place-items-center"
                data-testid="muslim-opening-start"
              >
                <div className="text-center">
                  <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: '#C5A028' }}>
                    ☾ {subtitle}
                  </div>
                  <div className="text-2xl md:text-3xl mb-6"
                    style={{ color: '#F5F5F5', fontFamily: '"Cormorant Garamond", serif' }}>
                    Tap to Open the Invitation
                  </div>
                  <div className="inline-block px-7 py-3 rounded-full border text-xs tracking-[0.3em] uppercase"
                    style={{ borderColor: '#C5A028', color: '#C5A028' }}>
                    Begin
                  </div>
                </div>
              </motion.button>
            )}
          </AnimatePresence>

          {tapped && !done && (
            <div className="absolute top-6 right-6 z-10 flex items-center gap-2">
              <button onClick={toggleAudio} aria-label="Toggle audio"
                className="w-9 h-9 grid place-items-center rounded-full border"
                style={{ borderColor: 'rgba(197,160,40,0.45)', color: '#C5A028' }}
                data-testid="muslim-opening-audio">
                {audioOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              {showSkip && (
                <button onClick={finish} aria-label="Skip"
                  className="flex items-center gap-2 px-4 h-9 rounded-full border text-xs tracking-[0.25em] uppercase"
                  style={{ borderColor: 'rgba(197,160,40,0.45)', color: '#C5A028' }}
                  data-testid="muslim-opening-skip">
                  <SkipForward className="w-3 h-3" /> Skip
                </button>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const RevealText = ({ text, delay = 0 }) => (
  <span style={{ display: 'inline-block' }}>
    {Array.from(text).map((ch, i) => (
      <motion.span key={i}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + i * 0.05, duration: 0.5, ease: 'easeOut' }}
        style={{ display: 'inline-block' }}>
        {ch === ' ' ? '\u00A0' : ch}
      </motion.span>
    ))}
  </span>
);

export default MuslimOpening3D;
