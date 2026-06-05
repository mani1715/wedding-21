/**
 * ChristianOpening3D — Three.js cinematic 5-stage Christian Elegant opening.
 *
 * Stage 1 (0–2s):   Deep blue-black. A single candle flame appears center.
 * Stage 2 (2–4s):   More candles light one by one (left→right). Bell tone begins.
 * Stage 3 (4–6.5s): 3D church doors (BoxGeometry, dark oak) swing open. Warm golden flood.
 * Stage 4 (6.5–8.5s): Stained-glass light patches sweep + dove SVG flies across.
 * Stage 5 (8.5–10s): Couple names in cream with thin gold cross divider.
 */
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward, Volume2, VolumeX } from 'lucide-react';
import { createChristianSoundController } from './christian.sounds';

const STAGE_BOUNDARIES = [0, 2000, 4000, 6500, 8500, 10000]; // ms
const TOTAL_MS = STAGE_BOUNDARIES[STAGE_BOUNDARIES.length - 1];

/** Build dark oak door texture with iron hinge studs */
const buildOakTexture = () => {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 1024;
  const ctx = c.getContext('2d');
  // Dark oak base
  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0,   '#1A1008');
  grad.addColorStop(0.5, '#3A2510');
  grad.addColorStop(1,   '#1A1008');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 512, 1024);
  // Wood grain
  for (let i = 0; i < 500; i++) {
    ctx.strokeStyle = `rgba(${15 + Math.random() * 20}, ${10 + Math.random() * 12}, 6, ${Math.random() * 0.5})`;
    ctx.lineWidth = 0.5 + Math.random();
    ctx.beginPath();
    const x = Math.random() * 512;
    ctx.moveTo(x, 0); ctx.lineTo(x + (Math.random() - 0.5) * 25, 1024); ctx.stroke();
  }
  // Iron hinge bands (top + bottom)
  ctx.fillStyle = '#1A1A1A';
  ctx.fillRect(20, 80, 472, 24);
  ctx.fillRect(20, 920, 472, 24);
  // Iron rivet studs
  for (const y of [92, 932]) {
    for (let i = 0; i < 8; i++) {
      const x = 50 + i * 60;
      const ng = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, 7);
      ng.addColorStop(0, '#6A6A6A'); ng.addColorStop(0.5, '#2A2A2A'); ng.addColorStop(1, '#0A0A0A');
      ctx.fillStyle = ng;
      ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
    }
  }
  // Decorative cross-shaped iron at center
  ctx.fillStyle = '#2A2A2A';
  ctx.fillRect(220, 460, 72, 18);
  ctx.fillRect(247, 420, 18, 100);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

const ChristianOpening3D = ({
  brideName = 'Emily',
  groomName = 'Daniel',
  monogram  = 'E ✟ D',
  subtitle  = 'Christian Elegant',
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
  const [candlesLit, setCandlesLit] = useState(0);

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
    scene.background = new THREE.Color('#08080F');
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    camera.position.set(0, 0, 5);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ? 1.5 : 2));
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x99AABB, 0.20));
    const ambientFlame = new THREE.PointLight(0xFFB347, 0.5); ambientFlame.position.set(0, 0, 3); scene.add(ambientFlame);
    // Behind-doors warm flood (ramps up in stage 3)
    const flood = new THREE.PointLight(0xFFE9A8, 0.0, 12); flood.position.set(0, 0, -2); scene.add(flood);

    // ── Doors (BoxGeometry) — hinge groups for swinging ──
    const oakTex = buildOakTexture();
    const doorMat = new THREE.MeshStandardMaterial({ map: oakTex, roughness: 0.9, metalness: 0.05, side: THREE.DoubleSide });

    const leftHinge = new THREE.Group();
    leftHinge.position.set(-1.6, 0, 0);
    const leftDoor = new THREE.Mesh(new THREE.BoxGeometry(1.6, 4.4, 0.08), doorMat);
    leftDoor.position.set(0.8, 0, 0);
    leftHinge.add(leftDoor);
    leftHinge.scale.set(0, 0, 0);
    scene.add(leftHinge);

    const rightHinge = new THREE.Group();
    rightHinge.position.set(1.6, 0, 0);
    const rightDoor = new THREE.Mesh(new THREE.BoxGeometry(1.6, 4.4, 0.08), doorMat);
    rightDoor.position.set(-0.8, 0, 0);
    rightHinge.add(rightDoor);
    rightHinge.scale.set(0, 0, 0);
    scene.add(rightHinge);

    // ── White dust motes ──
    const dustGeom = new THREE.BufferGeometry();
    const dustArr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      dustArr[i * 3]     = (Math.random() - 0.5) * 12;
      dustArr[i * 3 + 1] = (Math.random() - 0.5) * 7;
      dustArr[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    dustGeom.setAttribute('position', new THREE.BufferAttribute(dustArr, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xFFFFFF, size: 0.025, transparent: true, opacity: 0.30,
      sizeAttenuation: true, depthWrite: false,
    });
    const dust = new THREE.Points(dustGeom, dustMat);
    scene.add(dust);

    sceneObjsRef.current = {
      scene, camera, renderer,
      dust, dustGeom, dustMat,
      oakTex, doorMat,
      leftHinge, rightHinge,
      flood,
      particleCount,
    };

    let rafId;
    const clock = new THREE.Clock();
    const tick = () => {
      const delta = clock.getDelta();
      const stage = stageRef.current;
      const objs = sceneObjsRef.current;
      if (!objs) return;

      // Dust drift
      const dpos = objs.dustGeom.attributes.position;
      for (let i = 0; i < objs.particleCount; i++) {
        dpos.array[i * 3]     += delta * 0.05 * Math.sin(i);
        dpos.array[i * 3 + 1] += delta * 0.10;
        if (dpos.array[i * 3 + 1] > 4) dpos.array[i * 3 + 1] = -4;
      }
      dpos.needsUpdate = true;

      // Doors appear in stage 3, hidden in stage 4+
      let doorTarget = 0;
      if (stage === 3) doorTarget = 1;
      const dCur = objs.leftHinge.scale.x;
      const dNext = dCur + (doorTarget - dCur) * Math.min(1, delta * 4);
      objs.leftHinge.scale.set(dNext, dNext, dNext);
      objs.rightHinge.scale.set(dNext, dNext, dNext);

      // Doors swing open during stage 3
      const swingTarget = stage >= 3 ? Math.PI * 0.5 : 0;
      objs.leftHinge.rotation.y  += (-swingTarget - objs.leftHinge.rotation.y)  * Math.min(1, delta * 1.0);
      objs.rightHinge.rotation.y += ( swingTarget - objs.rightHinge.rotation.y) * Math.min(1, delta * 1.0);

      // Warm flood ramps during stage 3+
      const floodTarget = stage >= 3 && stage < 5 ? 3.0 : 0;
      objs.flood.intensity += (floodTarget - objs.flood.intensity) * Math.min(1, delta * 1.5);

      // Hide doors after stage 4
      if (stage >= 4) {
        objs.leftHinge.scale.x *= (1 - delta * 1.5);
        objs.leftHinge.scale.y = objs.leftHinge.scale.x;
        objs.rightHinge.scale.x = objs.leftHinge.scale.x;
        objs.rightHinge.scale.y = objs.leftHinge.scale.x;
      }

      // Camera dolly
      const camZTarget = stage >= 4 ? 3.5 : stage >= 3 ? 4.5 : 5;
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
    soundRef.current = createChristianSoundController();
    if (audioOn) {
      await soundRef.current.start();
      soundRef.current.fadeTo(0.16, 1.5);
    }
    initScene();

    // Light candles one by one in stage 1-2
    [0, 1, 2, 3, 4].forEach((i) => {
      setTimeout(() => setCandlesLit((c) => Math.max(c, i + 1)), 400 + i * 380);
    });

    STAGE_BOUNDARIES.forEach((ms, i) => {
      if (i === 0) return;
      setTimeout(() => {
        stageRef.current = i;
        setStageUI(i);
        if (soundRef.current && audioOn) {
          if (i === 2) soundRef.current.bell();
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
      if (soundRef.current) soundRef.current.fadeTo(on ? 0 : 0.16, 0.4);
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
    [objs.oakTex].forEach((t) => t && t.dispose && t.dispose());
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
          style={{ background: '#08080F' }}
          data-testid="christian-opening-3d"
          data-stage={stageUI}
        >
          <div ref={containerRef} className="absolute inset-0" />

          {/* Candles row (stages 1-2) */}
          <AnimatePresence>
            {stageUI <= 2 && tapped && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.6 } }}
                className="absolute pointer-events-none"
                style={{ top: '34%', left: '50%', transform: 'translateX(-50%)' }}
              >
                <div className="flex gap-10 md:gap-14">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} style={{ width: 24, height: 100, position: 'relative' }}>
                      <div style={{
                        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                        width: 12, height: 78, background: 'linear-gradient(180deg, #F5F5DC, #B0A678)',
                        borderRadius: 2,
                        boxShadow: '0 0 6px rgba(245,245,220,0.4)',
                      }} />
                      {i < candlesLit && (
                        <motion.div
                          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.4 }}
                          style={{
                            position: 'absolute', bottom: 78, left: '50%', transform: 'translateX(-50%)',
                            width: 12, height: 22,
                            background: 'radial-gradient(circle at 50% 70%, #FFEB3B 0%, #FF9800 50%, transparent 75%)',
                            borderRadius: '50% 50% 30% 30% / 60% 60% 40% 40%',
                            animation: 'christian-flame 1.4s ease-in-out infinite alternate',
                            boxShadow: '0 0 18px rgba(255,165,0,0.55)',
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stage 4 — stained-glass colored sweep + dove */}
          <AnimatePresence>
            {stageUI >= 4 && stageUI < 5 && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(circle at 18% 30%, rgba(230,57,70,0.30) 0%, transparent 35%), ' +
                      'radial-gradient(circle at 78% 28%, rgba(69,123,157,0.30) 0%, transparent 35%), ' +
                      'radial-gradient(circle at 50% 65%, rgba(45,198,83,0.20) 0%, transparent 40%)',
                  }}
                  aria-hidden="true"
                />
                {/* Dove */}
                <motion.svg
                  initial={{ x: -200, y: 60, opacity: 0 }}
                  animate={{ x: ['-100px', '50vw', '110vw'], y: [60, -20, -80], opacity: [0, 1, 0.85] }}
                  transition={{ duration: 1.8, ease: 'easeOut' }}
                  viewBox="0 0 80 40"
                  className="absolute left-0 top-1/2 pointer-events-none"
                  style={{ width: 80, height: 40 }}
                  aria-hidden="true"
                >
                  <g fill="#FFFFFF" opacity="0.95">
                    <ellipse cx="40" cy="22" rx="12" ry="6" />
                    <ellipse cx="50" cy="18" rx="4" ry="3" />
                    {/* Wings */}
                    <path d="M 30 22 Q 18 8 10 12 Q 20 18 28 22 Z" />
                    <path d="M 30 22 Q 18 36 10 32 Q 20 26 28 22 Z" />
                    {/* Beak */}
                    <polygon points="54,18 60,19 54,20" fill="#FFD700" />
                  </g>
                </motion.svg>
              </>
            )}
          </AnimatePresence>

          {/* Stage 5 — couple names with gold cross */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <AnimatePresence>
              {stageUI >= 5 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  className="text-center relative z-10"
                  style={{ color: '#F8F8FF' }}
                >
                  <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: '#FFD700' }}>
                    ✟ {subtitle}
                  </div>
                  <div className="text-[2.4rem] md:text-[4.2rem] leading-none"
                    style={{
                      fontFamily: '"Cormorant Garamond", serif', fontWeight: 300, letterSpacing: '0.05em',
                      textShadow: '0 0 24px rgba(255,215,0,0.45)',
                    }}>
                    <RevealText text={brideName} delay={0} />
                    <span style={{ color: '#FFD700', margin: '0 0.5em', fontSize: '0.7em', verticalAlign: 'middle' }}>✟</span>
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
                data-testid="christian-opening-start"
              >
                <div className="text-center">
                  <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: '#FFD700' }}>
                    ✟ {subtitle}
                  </div>
                  <div className="text-2xl md:text-3xl mb-6"
                    style={{ color: '#F8F8FF', fontFamily: '"Cormorant Garamond", serif' }}>
                    Tap to Open the Invitation
                  </div>
                  <div className="inline-block px-7 py-3 rounded-full border text-xs tracking-[0.3em] uppercase"
                    style={{ borderColor: '#FFD700', color: '#FFD700' }}>
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
                style={{ borderColor: 'rgba(255,215,0,0.45)', color: '#FFD700' }}
                data-testid="christian-opening-audio">
                {audioOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              {showSkip && (
                <button onClick={finish} aria-label="Skip"
                  className="flex items-center gap-2 px-4 h-9 rounded-full border text-xs tracking-[0.25em] uppercase"
                  style={{ borderColor: 'rgba(255,215,0,0.45)', color: '#FFD700' }}
                  data-testid="christian-opening-skip">
                  <SkipForward className="w-3 h-3" /> Skip
                </button>
              )}
            </div>
          )}

          <style>{`
            @keyframes christian-flame {
              0%   { transform: translateX(-50%) scale(1)   rotate(-2deg); opacity: 0.9; }
              50%  { transform: translateX(-50%) scale(1.1) rotate( 2deg); opacity: 1;   }
              100% { transform: translateX(-50%) scale(0.95) rotate(-1deg); opacity: 0.85; }
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

export default ChristianOpening3D;
