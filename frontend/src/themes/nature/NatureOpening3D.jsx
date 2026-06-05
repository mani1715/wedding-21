/**
 * NatureOpening3D — Three.js cinematic 5-stage Nature/Eco opening.
 *
 * Stage 1 (0–2s):   Deep forest black + cicada ambience + earthy seed at center
 * Stage 2 (2–4s):   Seed sprouts — vine grows upward (Three.js cylinder extruding)
 * Stage 3 (4–6.5s): Vine branches; leaves unfurl + god-rays pierce through canopy
 * Stage 4 (6.5–8s): Butterfly emerges (DOM SVG, wing-flap), god-rays peak
 * Stage 5 (8–9.5s): Couple names framed by leaf wreath
 */
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward, Volume2, VolumeX } from 'lucide-react';
import { createNatureSoundController } from './nature.sounds';

const STAGE_BOUNDARIES = [0, 2000, 4000, 6500, 8000, 9500]; // ms
const TOTAL_MS = STAGE_BOUNDARIES[STAGE_BOUNDARIES.length - 1];

const NatureOpening3D = ({
  brideName = 'Tara',
  groomName = 'Kabir',
  monogram  = 'T & K',
  subtitle  = 'Nature · Eco',
  particleCount = 180,
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
    scene.background = new THREE.Color('#030A03');
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 0, 5);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ? 1.5 : 2));
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    // Soft green ambient + warm sunray light
    scene.add(new THREE.AmbientLight(0x88AA88, 0.4));
    const sunray = new THREE.DirectionalLight(0xFFE680, 0.4); sunray.position.set(2, 4, 3); scene.add(sunray);
    const fill = new THREE.PointLight(0x88CC88, 0.5); fill.position.set(-2, -1, 3); scene.add(fill);

    // ── Pollen / firefly particles ──
    const dustGeom = new THREE.BufferGeometry();
    const dustArr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      dustArr[i * 3]     = (Math.random() - 0.5) * 14;
      dustArr[i * 3 + 1] = (Math.random() - 0.5) * 8;
      dustArr[i * 3 + 2] = (Math.random() - 0.5) * 5;
    }
    dustGeom.setAttribute('position', new THREE.BufferAttribute(dustArr, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xA5D6A7, size: 0.045, transparent: true, opacity: 0.35,
      sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const dust = new THREE.Points(dustGeom, dustMat);
    scene.add(dust);

    // ── Seed (stage 1) ──
    const seedMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, roughness: 0.7, metalness: 0.1 });
    const seed = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 16), seedMat);
    seed.position.y = -1.4;
    scene.add(seed);

    // ── Vine (stage 2) — a tall cylinder that grows in scale.y ──
    const vineMat = new THREE.MeshStandardMaterial({ color: 0x4CAF50, roughness: 0.6 });
    const vineGroup = new THREE.Group();
    vineGroup.position.y = -1.4;
    const vineStem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.6, 12), vineMat);
    vineStem.position.y = 1.3;
    vineStem.scale.y = 0.0;
    vineGroup.add(vineStem);
    scene.add(vineGroup);

    // ── Leaves (stage 3) — small meshes that fade/scale in along the vine ──
    const leafGeom = new THREE.SphereGeometry(0.22, 8, 6);
    leafGeom.scale(1.6, 0.6, 0.4);
    const leaves = [];
    const leafColors = [0x4CAF50, 0x8BC34A, 0xA5D6A7, 0x66BB6A];
    for (let i = 0; i < 8; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: leafColors[i % leafColors.length], roughness: 0.7,
        transparent: true, opacity: 0,
      });
      const leaf = new THREE.Mesh(leafGeom, mat);
      const yOff = 0.4 + (i * 0.28);
      leaf.position.set((i % 2 === 0 ? 1 : -1) * 0.30, yOff, 0);
      leaf.rotation.z = (i % 2 === 0 ? 1 : -1) * (0.3 + i * 0.05);
      leaf.scale.set(0.001, 0.001, 0.001);
      vineGroup.add(leaf);
      leaves.push({ leaf, mat, delay: i * 0.18, spawnY: yOff });
    }

    // ── God-ray cone (stage 3+) ──
    const rayMat = new THREE.MeshBasicMaterial({
      color: 0xFFEB3B, transparent: true, opacity: 0, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const ray = new THREE.Mesh(new THREE.ConeGeometry(0.9, 4.5, 24, 1, true), rayMat);
    ray.position.set(2.6, 2.2, -2);
    ray.rotation.z = -0.45;
    ray.rotation.x = 0.15;
    scene.add(ray);

    sceneObjsRef.current = {
      scene, camera, renderer,
      dust, dustGeom, dustMat,
      seed, seedMat,
      vineGroup, vineStem, vineMat,
      leaves, leafGeom,
      ray, rayMat,
      particleCount,
      sproutStartTime: 0,
    };

    let rafId;
    const clock = new THREE.Clock();
    const tick = () => {
      const delta = clock.getDelta();
      const stage = stageRef.current;
      const objs = sceneObjsRef.current;
      if (!objs) return;

      // Floating pollen
      const dpos = objs.dustGeom.attributes.position;
      for (let i = 0; i < objs.particleCount; i++) {
        dpos.array[i * 3]     += delta * 0.06 * Math.sin(i * 0.3);
        dpos.array[i * 3 + 1] += delta * 0.10;
        if (dpos.array[i * 3 + 1] > 5) dpos.array[i * 3 + 1] = -5;
      }
      dpos.needsUpdate = true;

      // Stage 2 — vine grows
      if (stage >= 2) {
        const target = 1.0;
        objs.vineStem.scale.y += (target - objs.vineStem.scale.y) * Math.min(1, delta * 1.2);
      }

      // Stage 3 — leaves unfurl
      if (stage >= 3) {
        const tNow = clock.elapsedTime;
        objs.leaves.forEach(({ leaf, mat, delay }) => {
          const localT = Math.max(0, tNow - (objs.sproutStartTime + delay + 1));
          const scale = Math.min(1, localT * 1.5);
          leaf.scale.set(scale, scale, scale);
          mat.opacity = scale;
          // Slight sway
          leaf.rotation.z += Math.sin(tNow * 0.6 + leaf.position.y) * delta * 0.08;
        });
      }

      // God-ray opacity: ramp up in stage 3-4, fade out in stage 5
      if (stage === 3) {
        objs.rayMat.opacity = Math.min(0.16, objs.rayMat.opacity + delta * 0.15);
      } else if (stage === 4) {
        objs.rayMat.opacity = Math.min(0.22, objs.rayMat.opacity + delta * 0.12);
      } else if (stage >= 5) {
        objs.rayMat.opacity = Math.max(0, objs.rayMat.opacity - delta * 0.4);
      }

      // Camera breathing
      const t = clock.elapsedTime;
      objs.camera.position.x = Math.sin(t * 0.20) * 0.05;
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
    soundRef.current = createNatureSoundController();
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
        if (sceneObjsRef.current && i === 3) {
          // mark sprout start time for leaves
          sceneObjsRef.current.sproutStartTime = performance.now() / 1000;
        }
        if (soundRef.current && audioOn) {
          if (i === 4) soundRef.current.chirp();
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
          style={{ background: '#030A03' }}
          data-testid="nature-opening-3d"
          data-stage={stageUI}
        >
          <div ref={containerRef} className="absolute inset-0" />

          {/* Stage 4 — Butterfly emerges */}
          <AnimatePresence>
            {stageUI >= 4 && stageUI < 5 && (
              <motion.svg
                initial={{ x: -10, y: 60, opacity: 0, scale: 0.4 }}
                animate={{
                  x: [-10, 100, 60, 140],
                  y: [60, 20, -30, -80],
                  opacity: [0, 1, 1, 0.8],
                  scale: [0.4, 1, 1, 1],
                }}
                transition={{ duration: 1.4, ease: 'easeOut' }}
                viewBox="0 0 60 50"
                className="absolute left-1/2 top-1/2 pointer-events-none"
                style={{ width: 60, height: 50, marginLeft: -30, marginTop: -25 }}
                aria-hidden="true"
              >
                <g className="butterfly-flap" style={{ transformOrigin: '50% 50%' }}>
                  <ellipse cx="20" cy="20" rx="14" ry="11" fill="#CDDC39" opacity="0.85" />
                  <ellipse cx="40" cy="20" rx="14" ry="11" fill="#CDDC39" opacity="0.85" />
                  <ellipse cx="20" cy="33" rx="9" ry="7"  fill="#8BC34A" opacity="0.85" />
                  <ellipse cx="40" cy="33" rx="9" ry="7"  fill="#8BC34A" opacity="0.85" />
                  <ellipse cx="30" cy="25" rx="2" ry="11" fill="#4CAF50" />
                </g>
              </motion.svg>
            )}
          </AnimatePresence>

          {/* Stage 5 — couple names with leaf wreath */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <AnimatePresence>
              {stageUI >= 5 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  className="text-center relative z-10"
                  style={{ color: '#F1F8E9' }}
                >
                  {/* Leaf wreath */}
                  <svg viewBox="0 0 400 80" className="mx-auto mb-2" style={{ width: 360, height: 60, opacity: 0.85 }} aria-hidden="true">
                    {[0,1,2,3,4,5,6,7].map(i => (
                      <g key={`l-${i}`} transform={`translate(${40 + i * 18}, ${40 + Math.sin(i * 0.8) * 6}) rotate(${-25 + i * 6})`}>
                        <path d="M 0 0 Q 12 -5 14 7 Q 8 9 0 0 Z" fill={i % 2 ? '#8BC34A' : '#4CAF50'} />
                      </g>
                    ))}
                    {[0,1,2,3,4,5,6,7].map(i => (
                      <g key={`r-${i}`} transform={`translate(${400 - 40 - i * 18}, ${40 + Math.sin(i * 0.8) * 6}) rotate(${25 - i * 6}) scale(-1, 1)`}>
                        <path d="M 0 0 Q 12 -5 14 7 Q 8 9 0 0 Z" fill={i % 2 ? '#8BC34A' : '#4CAF50'} />
                      </g>
                    ))}
                  </svg>
                  <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: '#CDDC39' }}>
                    ❀ {subtitle}
                  </div>
                  <div className="text-[2.5rem] md:text-[4.5rem] leading-none"
                    style={{
                      fontFamily: '"Cormorant Garamond", serif', fontWeight: 400, letterSpacing: '0.04em',
                      textShadow: '0 0 24px rgba(139,195,74,0.4)',
                    }}>
                    <RevealText text={brideName} delay={0} />
                    <span style={{ color: '#CDDC39', fontFamily: '"Great Vibes", cursive', fontStyle: 'italic', margin: '0 0.4em' }}>&amp;</span>
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
                data-testid="nature-opening-start"
              >
                <div className="text-center">
                  <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: '#CDDC39' }}>
                    ❀ {subtitle}
                  </div>
                  <div className="text-2xl md:text-3xl mb-6"
                    style={{ color: '#F1F8E9', fontFamily: '"Cormorant Garamond", serif' }}>
                    Open the Invitation
                  </div>
                  <div className="inline-block px-7 py-3 rounded-full border text-xs tracking-[0.3em] uppercase"
                    style={{ borderColor: '#8BC34A', color: '#8BC34A' }}>
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
                style={{ borderColor: 'rgba(139,195,74,0.5)', color: '#CDDC39' }}
                data-testid="nature-opening-audio">
                {audioOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              {showSkip && (
                <button onClick={finish} aria-label="Skip"
                  className="flex items-center gap-2 px-4 h-9 rounded-full border text-xs tracking-[0.25em] uppercase"
                  style={{ borderColor: 'rgba(139,195,74,0.5)', color: '#CDDC39' }}
                  data-testid="nature-opening-skip">
                  <SkipForward className="w-3 h-3" /> Skip
                </button>
              )}
            </div>
          )}

          <style>{`
            .butterfly-flap { animation: butterfly-flap 0.18s ease-in-out infinite alternate; }
            @keyframes butterfly-flap {
              from { transform: scaleX(1); }
              to   { transform: scaleX(0.6); }
            }
          `}</style>
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

export default NatureOpening3D;
