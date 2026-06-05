/**
 * BengaliOpening3D — Three.js cinematic 5-stage Bengali Traditional opening.
 *
 * Stage 1 (0–1.5s):   Deep red-black + tiny red sindoor particles drifting up
 * Stage 2 (1.5–4s):   Pearl-white shankha (conch) rises, glowing — shankha sound
 * Stage 3 (4–6s):     Shankha cracks → red sindoor powder bursts outward radially
 * Stage 4 (6–8s):     Alpana floor pattern (DOM SVG) draws itself line by line
 * Stage 5 (8–9.5s):   Couple names appear in gold above the alpana
 */
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward, Volume2, VolumeX } from 'lucide-react';
import { createBengaliSoundController } from './bengali.sounds';

const STAGE_BOUNDARIES = [0, 1500, 4000, 6000, 8000, 9500]; // ms
const TOTAL_MS = STAGE_BOUNDARIES[STAGE_BOUNDARIES.length - 1];

/**
 * Build a shankha (conch) geometry as a LatheGeometry — a spiraling profile.
 * Profile points sweep from a wide base up to a narrow opening, with subtle
 * undulations giving the conch its iconic look.
 */
const buildShankhaGeometry = () => {
  const points = [];
  const segments = 22;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    // Wide near the top, narrowing then flaring at the bottom (lip)
    const radius = 0.6 * Math.pow(1 - t, 0.65) + 0.04 * Math.sin(t * Math.PI * 4);
    const y = -t * 1.4 + 0.7;
    points.push(new THREE.Vector2(Math.max(radius, 0.02), y));
  }
  return new THREE.LatheGeometry(points, 32);
};

const BengaliOpening3D = ({
  brideName = 'Ria',
  groomName = 'Aditya',
  monogram  = 'R & A',
  subtitle  = 'Bengali Traditional',
  particleCount = 220,
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
    scene.background = new THREE.Color('#0D0505');
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 0, 5);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ? 1.5 : 2));
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    // Lights — warm spiritual glow
    scene.add(new THREE.AmbientLight(0xffffff, 0.2));
    const l1 = new THREE.PointLight(0xFFE6B5, 1.0); l1.position.set(-3, 2, 2); scene.add(l1);
    const l2 = new THREE.PointLight(0xFFE6B5, 1.0); l2.position.set( 3, 2, 2); scene.add(l2);
    const l3 = new THREE.PointLight(0xCC0000, 0.4); l3.position.set( 0, -1, -1); scene.add(l3);

    // ── Sindoor particles (ambient, slow upward drift) ──
    const dustGeom = new THREE.BufferGeometry();
    const dustArr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      dustArr[i * 3]     = (Math.random() - 0.5) * 14;
      dustArr[i * 3 + 1] = -4 + Math.random() * 8;
      dustArr[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    dustGeom.setAttribute('position', new THREE.BufferAttribute(dustArr, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xCC2020, size: 0.045, transparent: true, opacity: 0.45,
      sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const dust = new THREE.Points(dustGeom, dustMat);
    scene.add(dust);

    // ── Shankha (conch) ──
    const shankhaGeom = buildShankhaGeometry();
    const shankhaMat = new THREE.MeshPhysicalMaterial({
      color: 0xFFF8F0, roughness: 0.25, metalness: 0.0,
      clearcoat: 0.8, clearcoatRoughness: 0.2,
      emissive: 0xFFEFE5, emissiveIntensity: 0.1,
    });
    const shankha = new THREE.Mesh(shankhaGeom, shankhaMat);
    shankha.scale.set(0, 0, 0);
    shankha.position.y = -1.2;
    scene.add(shankha);

    // Inner warm glow ring around shankha
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xFFD700, transparent: true, opacity: 0, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const glow = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.6, 48), glowMat);
    glow.position.z = -0.5;
    scene.add(glow);

    // ── Sindoor burst particles (stage 3) ──
    const burstCount = 80;
    const burstArr = new Float32Array(burstCount * 3);
    const burstVel = [];
    for (let i = 0; i < burstCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 4 + Math.random() * 5;
      burstVel.push({
        vx: Math.cos(a) * r,
        vy: Math.random() * 1.5,
        vz: Math.sin(a) * r * 0.7,
      });
    }
    const burstGeom = new THREE.BufferGeometry();
    burstGeom.setAttribute('position', new THREE.BufferAttribute(burstArr, 3));
    const burstMat = new THREE.PointsMaterial({
      color: 0xCC0000, size: 0.15, transparent: true, opacity: 0.95,
      sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const burst = new THREE.Points(burstGeom, burstMat);
    burst.visible = false;
    scene.add(burst);

    // Brighter mid-ring expanding outward (the sindoor arc / mangalsutra symbolism)
    const arcMat = new THREE.MeshBasicMaterial({
      color: 0xCC0000, transparent: true, opacity: 0, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const arc = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.7, 64), arcMat);
    scene.add(arc);

    sceneObjsRef.current = {
      scene, camera, renderer,
      dust, dustGeom, dustMat,
      shankha, shankhaGeom, shankhaMat,
      glow, glowMat,
      burst, burstGeom, burstMat, burstVel, burstCount,
      arc, arcMat,
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

      // Ambient dust drift
      const dpos = objs.dustGeom.attributes.position;
      for (let i = 0; i < objs.particleCount; i++) {
        let y = dpos.array[i * 3 + 1];
        y += delta * (0.16 + (i % 5) * 0.04);
        if (y > 5) y = -5;
        dpos.array[i * 3 + 1] = y;
      }
      dpos.needsUpdate = true;

      // Shankha — appears stage 2, hides at stage 3 crack
      let shTarget = 0;
      if (stage === 2) shTarget = 1.4;
      else if (stage === 3 && !objs.cracked) shTarget = 1.4;
      // After crack, it shrinks to 0
      const sCur = objs.shankha.scale.x;
      const sNext = sCur + (shTarget - sCur) * Math.min(1, delta * 5);
      objs.shankha.scale.set(sNext, sNext, sNext);
      if (stage >= 2 && stage <= 3) {
        objs.shankha.rotation.y += delta * 0.5;
        objs.shankha.position.y += (0 - objs.shankha.position.y) * Math.min(1, delta * 1.5);
      }

      // Glow ring pulses while shankha is visible
      const glowTarget = stage === 2 ? 0.4 : stage === 3 && !objs.cracked ? 0.3 : 0;
      objs.glowMat.opacity += (glowTarget - objs.glowMat.opacity) * Math.min(1, delta * 3);
      objs.glow.rotation.z += delta * 0.6;

      // Burst — stage 3 after crack
      objs.burst.visible = stage >= 3 && objs.cracked;
      if (stage >= 3 && objs.cracked) {
        const bpos = objs.burstGeom.attributes.position;
        for (let i = 0; i < objs.burstCount; i++) {
          const v = objs.burstVel[i];
          bpos.array[i * 3]     += v.vx * delta;
          bpos.array[i * 3 + 1] += v.vy * delta;
          bpos.array[i * 3 + 2] += v.vz * delta;
          v.vy -= 4 * delta; // gentle gravity
        }
        bpos.needsUpdate = true;
        if (stage >= 4) {
          objs.burstMat.opacity = Math.max(0, objs.burstMat.opacity - delta * 0.5);
        }
      }

      // Expanding red arc (the vermillion line symbolism)
      if (stage === 3 && objs.cracked) {
        objs.arc.scale.x += delta * 4;
        objs.arc.scale.y += delta * 4;
        objs.arcMat.opacity = Math.max(0, 1 - objs.arc.scale.x * 0.15);
      } else if (stage >= 4) {
        objs.arcMat.opacity = Math.max(0, objs.arcMat.opacity - delta * 0.5);
      }

      // Camera breathing
      const t = clock.elapsedTime;
      objs.camera.position.y = Math.sin(t * 0.3) * 0.05;
      const camZTarget = stage === 3 ? 5.5 : stage >= 4 ? 5 : 5.5;
      objs.camera.position.z += (camZTarget - objs.camera.position.z) * 0.02;
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
    soundRef.current = createBengaliSoundController();
    if (audioOn) {
      await soundRef.current.start();
      soundRef.current.fadeTo(0.18, 1.0);
    }
    initScene();

    STAGE_BOUNDARIES.forEach((ms, i) => {
      if (i === 0) return;
      setTimeout(() => {
        stageRef.current = i;
        setStageUI(i);
        if (soundRef.current && audioOn) {
          if (i === 2) {
            soundRef.current.shankha();
          } else if (i === 3) {
            // Crack happens 600ms after stage 3 begins
            setTimeout(() => {
              if (sceneObjsRef.current) sceneObjsRef.current.cracked = true;
            }, 600);
            soundRef.current.fadeTo(0.30, 0.4);
          } else if (i === 5) {
            soundRef.current.fadeTo(0.12, 1.0);
          }
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
          style={{ background: '#0D0505' }}
          data-testid="bengali-opening-3d"
          data-stage={stageUI}
        >
          <div ref={containerRef} className="absolute inset-0" />

          {/* Stage 4 — Alpana pattern draws itself behind the names */}
          <AnimatePresence>
            {stageUI >= 4 && (
              <motion.svg
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 0.45, scale: 1 }}
                transition={{ duration: 2.0, ease: [0.22, 1, 0.36, 1] }}
                viewBox="0 0 400 400"
                className="absolute top-1/2 left-1/2 pointer-events-none"
                style={{
                  width: 'min(80vh, 540px)', height: 'min(80vh, 540px)',
                  transform: 'translate(-50%, -50%)',
                }}
                aria-hidden="true"
              >
                {/* Outer 16-petal lotus */}
                {Array.from({ length: 16 }).map((_, i) => (
                  <motion.g key={`p-${i}`}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    transform={`rotate(${i * 22.5} 200 200)`}>
                    <path
                      d="M 200 50 Q 213 120 200 150 Q 187 120 200 50 Z"
                      fill="none" stroke="#FFFFFF" strokeWidth="1.2"
                    />
                  </motion.g>
                ))}
                {/* Mid ring */}
                <motion.circle cx="200" cy="200" r="120"
                  fill="none" stroke="#FFFFFF" strokeWidth="1"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ delay: 0.7, duration: 1.0 }}
                />
                {/* Inner 8-petal lotus */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.g key={`i-${i}`}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 + i * 0.05, duration: 0.3 }}
                    transform={`rotate(${i * 45} 200 200)`}>
                    <path
                      d="M 200 140 Q 215 175 200 200 Q 185 175 200 140 Z"
                      fill="none" stroke="#FFFFFF" strokeWidth="1.2"
                    />
                  </motion.g>
                ))}
                {/* Center bindu */}
                <motion.circle cx="200" cy="200" r="6"
                  fill="#FFD700"
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ delay: 1.4, duration: 0.4 }}
                />
                {/* Dots around mid ring */}
                {Array.from({ length: 16 }).map((_, i) => {
                  const a = (i / 16) * Math.PI * 2;
                  return (
                    <motion.circle key={`d-${i}`}
                      cx={200 + Math.cos(a) * 120} cy={200 + Math.sin(a) * 120}
                      r="2" fill="#FFFFFF"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: 1.0 + i * 0.03, duration: 0.2 }}
                    />
                  );
                })}
              </motion.svg>
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
                  style={{ color: '#FFF8F0' }}
                >
                  <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: '#FFD700' }}>
                    ◆ {subtitle}
                  </div>
                  <div className="text-[2.5rem] md:text-[4.5rem] leading-none"
                    style={{
                      fontFamily: '"Cormorant Garamond", serif', fontWeight: 300, letterSpacing: '0.04em',
                      textShadow: '0 0 24px rgba(255,215,0,0.5)',
                    }}>
                    <RevealText text={brideName} delay={0} />
                    <span style={{ color: '#FFD700', fontFamily: '"Great Vibes", cursive', fontStyle: 'italic', margin: '0 0.4em' }}>&amp;</span>
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
                data-testid="bengali-opening-start"
              >
                <div className="text-center">
                  <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: '#FFD700' }}>
                    ◆ {subtitle}
                  </div>
                  <div className="text-2xl md:text-3xl mb-6"
                    style={{ color: '#FFF8F0', fontFamily: '"Cormorant Garamond", serif' }}>
                    Tap to Open the Invitation
                  </div>
                  <div className="inline-block px-7 py-3 rounded-full border text-xs tracking-[0.3em] uppercase"
                    style={{ borderColor: '#CC0000', color: '#FFD700' }}>
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
                style={{ borderColor: 'rgba(255,215,0,0.5)', color: '#FFD700' }}
                data-testid="bengali-opening-audio">
                {audioOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              {showSkip && (
                <button onClick={finish} aria-label="Skip"
                  className="flex items-center gap-2 px-4 h-9 rounded-full border text-xs tracking-[0.25em] uppercase"
                  style={{ borderColor: 'rgba(255,215,0,0.5)', color: '#FFD700' }}
                  data-testid="bengali-opening-skip">
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

export default BengaliOpening3D;
