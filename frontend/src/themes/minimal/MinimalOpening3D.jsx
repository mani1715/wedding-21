/**
 * MinimalOpening3D — Vanilla Three.js cinematic 4-stage minimal opening.
 *
 * Stage 1 (0–2s):   Pure black. Thin white circle outline expands from center
 * Stage 2 (2–4s):   3D platinum wedding band (Torus) rotates inside the circle, single piano note
 * Stage 3 (4–6s):   Ring "dissolves" — scatters into white particles outward
 * Stage 4 (6–8s):   Couple names appear in thin Cormorant Garamond, ultra-wide letter spacing
 */
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward, Volume2, VolumeX } from 'lucide-react';
import { createMinimalSoundController } from './minimal.sounds';

const STAGE_BOUNDARIES = [0, 2000, 4000, 6000, 8000]; // ms
const TOTAL_MS = STAGE_BOUNDARIES[STAGE_BOUNDARIES.length - 1];

const MinimalOpening3D = ({
  brideName = 'Anika',
  groomName = 'Aarav',
  monogram  = 'A & A',
  subtitle  = 'Modern Minimal',
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
      setStageUI(4);
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
    scene.background = new THREE.Color('#0F0F0F');
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 0, 5);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ? 1.5 : 2));
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    // Refined studio lighting for platinum reflection
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const key  = new THREE.DirectionalLight(0xffffff, 0.9); key.position.set(2, 3, 4); scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.4); fill.position.set(-3, -1, 2); scene.add(fill);
    const rim  = new THREE.DirectionalLight(0xffffff, 0.3); rim.position.set(0, -2, -3); scene.add(rim);

    // ── Expanding circle (Stage 1) — DOM/CSS handles this. Just a 2D plane border. ──
    const circleMat = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF, transparent: true, opacity: 0, side: THREE.DoubleSide,
    });
    const circle = new THREE.Mesh(new THREE.RingGeometry(0.99, 1.005, 96), circleMat);
    circle.position.z = -0.5;
    circle.scale.set(0.001, 0.001, 0.001);
    scene.add(circle);

    // ── Platinum wedding band (Stage 2) ──
    const ringMat = new THREE.MeshPhysicalMaterial({
      color: 0xE8E8E8, roughness: 0.18, metalness: 1.0,
      clearcoat: 1.0, clearcoatRoughness: 0.06,
      reflectivity: 1.0,
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.08, 24, 96), ringMat);
    ring.scale.set(0, 0, 0);
    ring.rotation.x = Math.PI / 6;
    scene.add(ring);

    // ── Dissolve particles (Stage 3 — ring scatters) ──
    const dissolveCount = particleCount;
    const dissolveArr = new Float32Array(dissolveCount * 3);
    const dissolveVel = [];
    for (let i = 0; i < dissolveCount; i++) {
      // Start positions on the torus circumference (approximation)
      const a = Math.random() * Math.PI * 2;
      dissolveArr[i * 3]     = Math.cos(a) * 0.7;
      dissolveArr[i * 3 + 1] = Math.sin(a) * 0.7;
      dissolveArr[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
      const va = a + (Math.random() - 0.5) * 0.5;
      const speed = 0.5 + Math.random() * 1.5;
      dissolveVel.push({
        vx: Math.cos(va) * speed,
        vy: Math.sin(va) * speed,
        vz: (Math.random() - 0.5) * speed,
      });
    }
    const dissolveGeom = new THREE.BufferGeometry();
    dissolveGeom.setAttribute('position', new THREE.BufferAttribute(dissolveArr, 3));
    const dissolveMat = new THREE.PointsMaterial({
      color: 0xFFFFFF, size: 0.025, transparent: true, opacity: 0,
      sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const dissolve = new THREE.Points(dissolveGeom, dissolveMat);
    scene.add(dissolve);

    // ── Subtle ambient particles ──
    const dustGeom = new THREE.BufferGeometry();
    const dustArr = new Float32Array(60 * 3);
    for (let i = 0; i < 60; i++) {
      dustArr[i * 3]     = (Math.random() - 0.5) * 10;
      dustArr[i * 3 + 1] = (Math.random() - 0.5) * 7;
      dustArr[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    dustGeom.setAttribute('position', new THREE.BufferAttribute(dustArr, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xFFFFFF, size: 0.018, transparent: true, opacity: 0.20,
      sizeAttenuation: true, depthWrite: false,
    });
    const dust = new THREE.Points(dustGeom, dustMat);
    scene.add(dust);

    sceneObjsRef.current = {
      scene, camera, renderer,
      circle, circleMat,
      ring, ringMat,
      dissolve, dissolveGeom, dissolveMat, dissolveVel, dissolveCount,
      dust, dustGeom, dustMat,
      dissolved: false,
    };

    let rafId;
    const clock = new THREE.Clock();
    const tick = () => {
      const delta = clock.getDelta();
      const stage = stageRef.current;
      const objs = sceneObjsRef.current;
      if (!objs) return;

      // Slow ambient dust drift
      const dpos = objs.dustGeom.attributes.position;
      for (let i = 0; i < 60; i++) {
        dpos.array[i * 3]     += delta * 0.04 * Math.sin(i);
        dpos.array[i * 3 + 1] += delta * 0.05;
        if (dpos.array[i * 3 + 1] > 4) dpos.array[i * 3 + 1] = -4;
      }
      dpos.needsUpdate = true;

      // Stage 1 — circle expand
      if (stage >= 1) {
        const target = stage === 1 ? 1 : (stage >= 2 ? 1.5 : 0);
        const opTarget = stage === 1 ? 0.55 : 0.25;
        const curScale = objs.circle.scale.x;
        const nextScale = curScale + (target - curScale) * Math.min(1, delta * 1.6);
        objs.circle.scale.set(nextScale, nextScale, nextScale);
        objs.circleMat.opacity += (opTarget - objs.circleMat.opacity) * Math.min(1, delta * 2);
      }

      // Stage 2 — ring appears, slowly rotates
      const ringTarget = (stage === 2 || (stage === 3 && !objs.dissolved)) ? 1 : 0;
      const rCur = objs.ring.scale.x;
      const rNext = rCur + (ringTarget - rCur) * Math.min(1, delta * 4);
      objs.ring.scale.set(rNext, rNext, rNext);
      if (stage >= 2) {
        objs.ring.rotation.y += delta * 0.6;
        objs.ring.rotation.z += delta * 0.15;
      }

      // Stage 3 — dissolve
      if (stage >= 3 && objs.dissolved) {
        objs.dissolveMat.opacity = Math.min(1, objs.dissolveMat.opacity + delta * 2);
        const dpos2 = objs.dissolveGeom.attributes.position;
        for (let i = 0; i < objs.dissolveCount; i++) {
          const v = objs.dissolveVel[i];
          dpos2.array[i * 3]     += v.vx * delta;
          dpos2.array[i * 3 + 1] += v.vy * delta;
          dpos2.array[i * 3 + 2] += v.vz * delta;
        }
        dpos2.needsUpdate = true;
        if (stage >= 4) {
          objs.dissolveMat.opacity = Math.max(0, objs.dissolveMat.opacity - delta * 0.5);
        }
      }

      // Camera breathing — barely any
      const t = clock.elapsedTime;
      objs.camera.position.x = Math.sin(t * 0.2) * 0.04;
      objs.camera.position.y = Math.cos(t * 0.25) * 0.03;
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
    soundRef.current = createMinimalSoundController();
    if (audioOn) {
      await soundRef.current.start();
      soundRef.current.fadeTo(0.20, 1.2);
    }
    initScene();

    STAGE_BOUNDARIES.forEach((ms, i) => {
      if (i === 0) return;
      setTimeout(() => {
        stageRef.current = i;
        setStageUI(i);
        if (soundRef.current && audioOn) {
          if (i === 2) soundRef.current.pianoNote();
          if (i === 3) {
            // Trigger dissolve a moment after stage 3 begins
            setTimeout(() => {
              if (sceneObjsRef.current) sceneObjsRef.current.dissolved = true;
            }, 350);
          }
          if (i === 4) soundRef.current.fadeTo(0.12, 1.0);
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
      if (soundRef.current) soundRef.current.fadeTo(on ? 0 : 0.20, 0.4);
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
          style={{ background: '#0F0F0F' }}
          data-testid="minimal-opening-3d"
          data-stage={stageUI}
        >
          <div ref={containerRef} className="absolute inset-0" />

          {/* Stage 4 — couple names */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <AnimatePresence>
              {stageUI >= 4 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  className="text-center"
                  style={{ color: '#F0F0F0' }}
                >
                  <div className="text-[10px] tracking-[0.6em] uppercase mb-5" style={{ color: '#C0C0C0' }}>
                    ◇ {subtitle}
                  </div>
                  <div className="text-[2.2rem] md:text-[4.2rem] leading-none"
                    style={{
                      fontFamily: '"Cormorant Garamond", serif',
                      fontWeight: 200,
                      letterSpacing: '0.22em',
                    }}>
                    <RevealText text={brideName} delay={0} />
                    <span style={{ color: '#D4AF37', fontStyle: 'italic', margin: '0 0.5em', fontWeight: 300, letterSpacing: '0' }}>&amp;</span>
                    <RevealText text={groomName} delay={brideName.length * 0.06 + 0.3} />
                  </div>
                  <div className="text-[11px] tracking-[0.6em] uppercase mt-6 opacity-60">{monogram}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {!tapped && (
              <motion.button onClick={start}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 grid place-items-center"
                data-testid="minimal-opening-start"
              >
                <div className="text-center">
                  <div className="text-[10px] tracking-[0.5em] uppercase mb-4" style={{ color: '#C0C0C0' }}>
                    ◇ {subtitle}
                  </div>
                  <div className="text-2xl md:text-3xl mb-6"
                    style={{ color: '#F0F0F0', fontFamily: '"Cormorant Garamond", serif', fontWeight: 200, letterSpacing: '0.18em' }}>
                    Open the Invitation
                  </div>
                  <div className="inline-block px-7 py-3 rounded-full border text-xs tracking-[0.3em] uppercase"
                    style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#F0F0F0' }}>
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
                style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#C0C0C0' }}
                data-testid="minimal-opening-audio">
                {audioOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              {showSkip && (
                <button onClick={finish} aria-label="Skip"
                  className="flex items-center gap-2 px-4 h-9 rounded-full border text-xs tracking-[0.25em] uppercase"
                  style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#C0C0C0' }}
                  data-testid="minimal-opening-skip">
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
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: delay + i * 0.06, duration: 0.7, ease: 'easeOut' }}
        style={{ display: 'inline-block' }}>
        {ch === ' ' ? '\u00A0' : ch}
      </motion.span>
    ))}
  </span>
);

export default MinimalOpening3D;
