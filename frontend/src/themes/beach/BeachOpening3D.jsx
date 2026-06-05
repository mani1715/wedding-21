/**
 * BeachOpening3D — Three.js cinematic 5-stage Beach Destination opening.
 *
 * Stage 1 (0–2s):   Deep ocean blue. Sand-gold sparkles drift. Cyan wave ripple at bottom.
 * Stage 2 (2–4s):   3D conch shell (custom LatheGeometry) rotates into view, iridescent pearl
 * Stage 3 (4–6s):   Conch opens — sunset light rays burst from it (PointLight + DOM rays)
 * Stage 4 (6–8s):   Sun rises from the horizon (DOM gradient) + palm leaf silhouettes slide in
 * Stage 5 (8–9.5s): Couple names in warm golden text over the sunrise
 */
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward, Volume2, VolumeX } from 'lucide-react';
import { createBeachSoundController } from './beach.sounds';

const STAGE_BOUNDARIES = [0, 2000, 4000, 6000, 8000, 9500]; // ms
const TOTAL_MS = STAGE_BOUNDARIES[STAGE_BOUNDARIES.length - 1];

/** Build a conch shell profile — wider base spiraling up. */
const buildConchGeometry = () => {
  const points = [];
  const segments = 26;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    // Wide spiral mouth at bottom, narrow tip at top
    const radius = 0.55 * Math.pow(1 - t, 0.5) + 0.05 * Math.sin(t * Math.PI * 5);
    const y = -t * 1.6 + 0.8;
    points.push(new THREE.Vector2(Math.max(radius, 0.03), y));
  }
  return new THREE.LatheGeometry(points, 36);
};

const BeachOpening3D = ({
  brideName = 'Mira',
  groomName = 'Ishaan',
  monogram  = 'M & I',
  subtitle  = 'Beach Destination',
  particleCount = 200,
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
    scene.background = new THREE.Color('#030D1A');
    const camera = new THREE.PerspectiveCamera(46, w / h, 0.1, 100);
    camera.position.set(0, 0, 5);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ? 1.5 : 2));
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    // Cool ocean ambience + warm rim
    scene.add(new THREE.AmbientLight(0xB0D0F0, 0.30));
    const l1 = new THREE.PointLight(0x99DDF8, 0.6); l1.position.set(-2.5, 1, 3); scene.add(l1);
    const l2 = new THREE.PointLight(0x99DDF8, 0.5); l2.position.set( 2.5, 1, 3); scene.add(l2);
    // Sunset back-light (intensity ramps in stage 3)
    const sunsetLight = new THREE.PointLight(0xFF9F45, 0.0, 10);
    sunsetLight.position.set(0, -0.6, -1);
    scene.add(sunsetLight);

    // ── Sand-gold sparkles ──
    const dustGeom = new THREE.BufferGeometry();
    const dustArr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      dustArr[i * 3]     = (Math.random() - 0.5) * 14;
      dustArr[i * 3 + 1] = (Math.random() - 0.5) * 8;
      dustArr[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    dustGeom.setAttribute('position', new THREE.BufferAttribute(dustArr, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xE9C46A, size: 0.04, transparent: true, opacity: 0.40,
      sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const dust = new THREE.Points(dustGeom, dustMat);
    scene.add(dust);

    // ── Conch shell ──
    const conchGeom = buildConchGeometry();
    const conchMat = new THREE.MeshPhysicalMaterial({
      color: 0xFFF5E8, roughness: 0.25, metalness: 0.0,
      clearcoat: 1.0, clearcoatRoughness: 0.12,
      emissive: 0xFFE2C8, emissiveIntensity: 0.10,
      iridescence: 0.6, iridescenceIOR: 1.3,
    });
    const conch = new THREE.Mesh(conchGeom, conchMat);
    conch.scale.set(0, 0, 0);
    conch.position.y = -0.2;
    scene.add(conch);

    // ── Ray-burst plane behind conch (stage 3) ──
    const rayMat = new THREE.MeshBasicMaterial({
      color: 0xFFB347, transparent: true, opacity: 0, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const rayDisc = new THREE.Mesh(new THREE.CircleGeometry(2.2, 48), rayMat);
    rayDisc.position.z = -1.5;
    scene.add(rayDisc);

    sceneObjsRef.current = {
      scene, camera, renderer,
      dust, dustGeom, dustMat,
      conchGeom, conchMat, conch,
      rayDisc, rayMat,
      sunsetLight,
      particleCount,
      cracked: false,
    };

    let rafId;
    const clock = new THREE.Clock();
    const tick = () => {
      const delta = clock.getDelta();
      const stage = stageRef.current;
      const objs = sceneObjsRef.current;
      if (!objs) return;

      // Sparkle drift
      const dpos = objs.dustGeom.attributes.position;
      for (let i = 0; i < objs.particleCount; i++) {
        dpos.array[i * 3]     += delta * 0.04 * Math.sin(i);
        dpos.array[i * 3 + 1] += delta * 0.10 + delta * 0.04 * Math.sin(i * 0.5);
        if (dpos.array[i * 3 + 1] > 5) dpos.array[i * 3 + 1] = -5;
      }
      dpos.needsUpdate = true;

      // Conch — visible stages 2–3
      const cTarget = stage >= 2 && stage <= 3 ? 1 : (stage >= 4 ? 0 : 0);
      const cCur = objs.conch.scale.x;
      const cNext = cCur + (cTarget - cCur) * Math.min(1, delta * 4);
      objs.conch.scale.set(cNext, cNext, cNext);
      if (stage >= 2) {
        objs.conch.rotation.y += delta * 0.55;
        objs.conch.rotation.z = Math.sin(clock.elapsedTime * 0.4) * 0.08;
      }

      // Rays — only during stage 3, then fade out
      if (stage === 3) {
        objs.rayMat.opacity = Math.min(0.55, objs.rayMat.opacity + delta * 0.8);
        objs.rayDisc.rotation.z += delta * 0.3;
        objs.sunsetLight.intensity = Math.min(2.5, objs.sunsetLight.intensity + delta * 1.6);
      } else if (stage >= 4) {
        objs.rayMat.opacity = Math.max(0, objs.rayMat.opacity - delta * 0.8);
        objs.sunsetLight.intensity = Math.max(0, objs.sunsetLight.intensity - delta * 0.8);
      }

      // Camera breathing
      const t = clock.elapsedTime;
      objs.camera.position.x = Math.sin(t * 0.25) * 0.05;
      objs.camera.position.y = Math.cos(t * 0.30) * 0.05;
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
    soundRef.current = createBeachSoundController();
    if (audioOn) {
      await soundRef.current.start();
      soundRef.current.fadeTo(0.22, 1.5);
    }
    initScene();

    STAGE_BOUNDARIES.forEach((ms, i) => {
      if (i === 0) return;
      setTimeout(() => {
        stageRef.current = i;
        setStageUI(i);
        if (soundRef.current && audioOn) {
          if (i === 4) soundRef.current.chime();
          if (i === 5) soundRef.current.fadeTo(0.14, 1.0);
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
      if (soundRef.current) soundRef.current.fadeTo(on ? 0 : 0.22, 0.4);
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
          style={{ background: '#030D1A' }}
          data-testid="beach-opening-3d"
          data-stage={stageUI}
        >
          <div ref={containerRef} className="absolute inset-0" />

          {/* Stage 4 — Sun rises from horizon (DOM) */}
          <AnimatePresence>
            {stageUI >= 4 && (
              <>
                {/* Horizon line */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  transition={{ duration: 0.8 }}
                  className="absolute left-0 right-0 pointer-events-none"
                  style={{
                    top: '58%', height: 1,
                    background: 'linear-gradient(90deg, transparent 0%, rgba(244,162,97,0.6) 35%, rgba(255,107,107,0.7) 50%, rgba(244,162,97,0.6) 65%, transparent 100%)',
                  }}
                  aria-hidden="true"
                />
                {/* Sun */}
                <motion.div
                  initial={{ y: 220, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 2.0, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
                  style={{
                    width: 200, height: 200,
                    top: 'calc(58% - 100px)',
                    background: 'radial-gradient(circle, #FFF4D6 0%, #FFB347 45%, #FF6B6B 80%, transparent 100%)',
                    boxShadow: '0 0 100px 40px rgba(244,162,97,0.40), 0 0 200px 60px rgba(255,107,107,0.20)',
                  }}
                  aria-hidden="true"
                />
                {/* Palm leaves */}
                <motion.svg
                  initial={{ x: -120, opacity: 0 }}
                  animate={{ x: 0, opacity: 0.85 }}
                  transition={{ delay: 0.4, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                  viewBox="0 0 220 400"
                  className="absolute left-0 pointer-events-none"
                  style={{ top: '20%', height: '60vh', maxHeight: 520 }}
                  aria-hidden="true"
                >
                  <g stroke="#0E3540" strokeWidth="2.5" fill="#0E3540" opacity="0.85">
                    <path d="M 30 400 Q 50 300 70 200 Q 90 110 130 60" strokeLinecap="round" fill="none" />
                    {/* Leaves */}
                    {[60, 110, 160, 210, 260].map((y, i) => {
                      const xBase = 30 + (400 - y) * 0.16;
                      return (
                        <g key={i}>
                          <path d={`M ${xBase} ${y} Q ${xBase + 70} ${y - 12} ${xBase + 110} ${y - 18}`} fill="none" />
                          <path d={`M ${xBase} ${y} Q ${xBase + 70} ${y + 16} ${xBase + 110} ${y + 28}`} fill="none" />
                          <path d={`M ${xBase} ${y} Q ${xBase - 30} ${y + 18} ${xBase - 70} ${y + 32}`} fill="none" />
                        </g>
                      );
                    })}
                  </g>
                </motion.svg>
                <motion.svg
                  initial={{ x: 120, opacity: 0 }}
                  animate={{ x: 0, opacity: 0.85 }}
                  transition={{ delay: 0.4, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                  viewBox="0 0 220 400"
                  className="absolute right-0 pointer-events-none scale-x-[-1]"
                  style={{ top: '20%', height: '60vh', maxHeight: 520 }}
                  aria-hidden="true"
                >
                  <g stroke="#0E3540" strokeWidth="2.5" fill="#0E3540" opacity="0.85">
                    <path d="M 30 400 Q 50 300 70 200 Q 90 110 130 60" strokeLinecap="round" fill="none" />
                    {[60, 110, 160, 210, 260].map((y, i) => {
                      const xBase = 30 + (400 - y) * 0.16;
                      return (
                        <g key={i}>
                          <path d={`M ${xBase} ${y} Q ${xBase + 70} ${y - 12} ${xBase + 110} ${y - 18}`} fill="none" />
                          <path d={`M ${xBase} ${y} Q ${xBase + 70} ${y + 16} ${xBase + 110} ${y + 28}`} fill="none" />
                          <path d={`M ${xBase} ${y} Q ${xBase - 30} ${y + 18} ${xBase - 70} ${y + 32}`} fill="none" />
                        </g>
                      );
                    })}
                  </g>
                </motion.svg>
              </>
            )}
          </AnimatePresence>

          {/* Stage 5 — couple names */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <AnimatePresence>
              {stageUI >= 5 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  className="text-center relative z-10"
                  style={{ color: '#F8F9FA', marginTop: '4%' }}
                >
                  <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: '#E9C46A' }}>
                    ◊ {subtitle}
                  </div>
                  <div className="text-[2.5rem] md:text-[4.5rem] leading-none"
                    style={{
                      fontFamily: '"Cormorant Garamond", serif', fontWeight: 400, letterSpacing: '0.04em',
                      textShadow: '0 0 30px rgba(244,162,97,0.5)',
                    }}>
                    <RevealText text={brideName} delay={0} />
                    <span style={{ color: '#E9C46A', fontFamily: '"Great Vibes", cursive', fontStyle: 'italic', margin: '0 0.4em' }}>&amp;</span>
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
                data-testid="beach-opening-start"
              >
                <div className="text-center">
                  <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: '#E9C46A' }}>
                    ◊ {subtitle}
                  </div>
                  <div className="text-2xl md:text-3xl mb-6"
                    style={{ color: '#F8F9FA', fontFamily: '"Cormorant Garamond", serif' }}>
                    Tap to Open the Invitation
                  </div>
                  <div className="inline-block px-7 py-3 rounded-full border text-xs tracking-[0.3em] uppercase"
                    style={{ borderColor: '#00B4D8', color: '#00B4D8' }}>
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
                style={{ borderColor: 'rgba(0,180,216,0.5)', color: '#E9C46A' }}
                data-testid="beach-opening-audio">
                {audioOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              {showSkip && (
                <button onClick={finish} aria-label="Skip"
                  className="flex items-center gap-2 px-4 h-9 rounded-full border text-xs tracking-[0.25em] uppercase"
                  style={{ borderColor: 'rgba(0,180,216,0.5)', color: '#E9C46A' }}
                  data-testid="beach-opening-skip">
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

export default BeachOpening3D;
