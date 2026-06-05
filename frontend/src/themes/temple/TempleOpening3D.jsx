/**
 * TempleOpening3D — Vanilla Three.js cinematic 5-stage temple opening.
 *
 * Stage 1 (0–1.5s):   Deep warm black + drifting incense particles
 * Stage 2 (1.5–4s):   Two huge teak temple doors fill the screen + nadaswaram
 * Stage 3 (4–6s):     Doors swing open + warm amber light floods + brass bell rings
 * Stage 4 (6–8s):     Gopuram tower silhouette rises from the bottom (DOM SVG)
 * Stage 5 (8–9.5s):   Marigold petals fall + couple names appear in gold frame
 */
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward, Volume2, VolumeX } from 'lucide-react';
import { createTempleSoundController } from './temple.sounds';

const STAGE_BOUNDARIES = [0, 1500, 4000, 6000, 8000, 9500]; // ms
const TOTAL_MS = STAGE_BOUNDARIES[STAGE_BOUNDARIES.length - 1];

/* ─── Texture builders ─────────────────────────────────────────────── */
const buildTeakTexture = () => {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 1024;
  const ctx = c.getContext('2d');
  // Base wood
  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0,   '#2D1A0A');
  grad.addColorStop(0.5, '#4A2D14');
  grad.addColorStop(1,   '#2D1A0A');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 512, 1024);
  // Vertical wood grain
  for (let i = 0; i < 600; i++) {
    ctx.strokeStyle = `rgba(${20 + Math.random() * 30}, ${10 + Math.random() * 15}, 5, ${Math.random() * 0.5})`;
    ctx.lineWidth = 0.5 + Math.random() * 1.5;
    ctx.beginPath();
    const x = Math.random() * 512;
    ctx.moveTo(x, 0); ctx.lineTo(x + (Math.random() - 0.5) * 30, 1024); ctx.stroke();
  }
  // Brass nail studs
  for (let row = 0; row < 12; row++) {
    for (let col = 0; col < 5; col++) {
      const x = 40 + col * 110 + (row % 2) * 20;
      const y = 50 + row * 85;
      const r = 8;
      const ng = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, r);
      ng.addColorStop(0, '#FFE6A6');
      ng.addColorStop(0.4, '#B8860B');
      ng.addColorStop(1, '#5A4308');
      ctx.fillStyle = ng;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

/* ─── Component ────────────────────────────────────────────────────── */
const TempleOpening3D = ({
  brideName = 'Lakshmi',
  groomName = 'Karthik',
  monogram  = 'L & K',
  subtitle  = 'South Indian Temple',
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
    scene.background = new THREE.Color('#0A0806');
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    camera.position.set(0, 0, 5);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ? 1.5 : 2));
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.15));
    const l1 = new THREE.PointLight(0xFFD580, 0.6); l1.position.set(-3, 2, 2); scene.add(l1);
    const l2 = new THREE.PointLight(0xFFD580, 0.6); l2.position.set( 3, 2, 2); scene.add(l2);
    // Door-back amber flood (intensity ramps from 0)
    const floodLight = new THREE.PointLight(0xFFA947, 0.0, 12);
    floodLight.position.set(0, 0, -1.5);
    scene.add(floodLight);

    // ── Incense particles ──
    const dustGeom = new THREE.BufferGeometry();
    const dustArr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      dustArr[i * 3]     = (Math.random() - 0.5) * 14;
      dustArr[i * 3 + 1] = -4 + Math.random() * 8;
      dustArr[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    dustGeom.setAttribute('position', new THREE.BufferAttribute(dustArr, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xFFD700, size: 0.05, transparent: true, opacity: 0.5,
      sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const dust = new THREE.Points(dustGeom, dustMat);
    scene.add(dust);

    // ── Temple doors ──
    const teakTex = buildTeakTexture();
    const doorMat = new THREE.MeshStandardMaterial({ map: teakTex, roughness: 0.85, metalness: 0.05, side: THREE.DoubleSide });

    // Left door — pivots around its outer (left) edge
    const leftHinge = new THREE.Group();
    leftHinge.position.set(-2.2, 0, 0);
    const leftDoor = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 5), doorMat);
    leftDoor.position.set(1.1, 0, 0); // center of door 1.1 units right of hinge
    leftHinge.add(leftDoor);
    leftHinge.scale.set(0, 0, 0);
    scene.add(leftHinge);

    // Right door — pivots around its outer (right) edge
    const rightHinge = new THREE.Group();
    rightHinge.position.set(2.2, 0, 0);
    const rightDoor = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 5), doorMat);
    rightDoor.position.set(-1.1, 0, 0);
    rightHinge.add(rightDoor);
    rightHinge.scale.set(0, 0, 0);
    scene.add(rightHinge);

    // ── Brass bell (TorusGeometry) ──
    const bellMat = new THREE.MeshStandardMaterial({ color: 0xB8860B, roughness: 0.35, metalness: 0.85 });
    const bell = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.06, 12, 24), bellMat);
    bell.position.set(0, 0.4, 0.5);
    bell.visible = false;
    scene.add(bell);
    // Bell rope (thin cylinder)
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0x3C2A14, roughness: 0.9 });
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.6, 6), ropeMat);
    rope.position.set(0, 0.75, 0.5);
    rope.visible = false;
    scene.add(rope);

    sceneObjsRef.current = {
      scene, camera, renderer,
      dust, dustGeom, dustMat,
      teakTex, doorMat,
      leftHinge, leftDoor, rightHinge, rightDoor,
      bell, bellMat, rope, ropeMat,
      floodLight,
      particleCount,
    };

    let rafId;
    const clock = new THREE.Clock();
    const tick = () => {
      const delta = clock.getDelta();
      const stage = stageRef.current;
      const objs = sceneObjsRef.current;
      if (!objs) return;

      // Incense particles drift up
      const dpos = objs.dustGeom.attributes.position;
      for (let i = 0; i < objs.particleCount; i++) {
        let y = dpos.array[i * 3 + 1];
        y += delta * (0.18 + (i % 5) * 0.04);
        if (y > 5) y = -5;
        dpos.array[i * 3 + 1] = y;
      }
      dpos.needsUpdate = true;

      // Doors grow visible at stage 2
      const doorTarget = stage >= 2 ? 1 : 0;
      const dCur = objs.leftHinge.scale.x;
      const dNext = dCur + (doorTarget - dCur) * Math.min(1, delta * 4);
      objs.leftHinge.scale.set(dNext, dNext, dNext);
      objs.rightHinge.scale.set(dNext, dNext, dNext);

      // Doors swing open at stage 3
      const swingTarget = stage >= 3 ? Math.PI * 0.55 : 0;
      objs.leftHinge.rotation.y  += (-swingTarget - objs.leftHinge.rotation.y)  * Math.min(1, delta * 1.4);
      objs.rightHinge.rotation.y += ( swingTarget - objs.rightHinge.rotation.y) * Math.min(1, delta * 1.4);

      // Amber light flood ramps with door angle
      const floodTarget = stage >= 3 ? 3.0 : 0;
      objs.floodLight.intensity += (floodTarget - objs.floodLight.intensity) * Math.min(1, delta * 1.5);

      // Bell appears + swings at stage 3
      if (stage >= 3) {
        objs.bell.visible = true; objs.rope.visible = true;
        const t = clock.elapsedTime;
        const swing = Math.sin(t * 4) * 0.35;
        objs.bell.rotation.z = swing;
        objs.rope.rotation.z = swing * 0.5;
      }

      // Doors hide at stage 4 (we're inside the temple now)
      if (stage >= 4) {
        const fadeTarget = 0;
        objs.leftHinge.scale.x += (fadeTarget - objs.leftHinge.scale.x) * Math.min(1, delta * 2);
        objs.leftHinge.scale.y = objs.leftHinge.scale.x;
        objs.rightHinge.scale.x = objs.leftHinge.scale.x;
        objs.rightHinge.scale.y = objs.leftHinge.scale.x;
        if (objs.bell) {
          objs.bellMat.opacity = objs.leftHinge.scale.x;
          objs.bellMat.transparent = true;
          objs.bell.visible = objs.leftHinge.scale.x > 0.05;
          objs.rope.visible = objs.bell.visible;
        }
      }

      // Camera dolly forward as doors open
      const camZTarget = stage >= 4 ? 3.2 : stage >= 3 ? 4 : 5;
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
    soundRef.current = createTempleSoundController();
    if (audioOn) {
      await soundRef.current.start();
      soundRef.current.fadeTo(0.20, 1.5);
    }
    initScene();

    STAGE_BOUNDARIES.forEach((ms, i) => {
      if (i === 0) return;
      setTimeout(() => {
        stageRef.current = i;
        setStageUI(i);
        if (soundRef.current && audioOn) {
          if (i === 3) { soundRef.current.bell(); soundRef.current.fadeTo(0.30, 0.4); }
          else if (i === 5) { soundRef.current.fadeTo(0.14, 1.0); }
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
    [objs.teakTex].forEach((t) => t && t.dispose && t.dispose());
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
          style={{ background: '#0A0806' }}
          data-testid="temple-opening-3d"
          data-stage={stageUI}
        >
          <div ref={containerRef} className="absolute inset-0" />

          {/* Gopuram silhouette — DOM SVG, rises from bottom in stage 4 */}
          <AnimatePresence>
            {stageUI >= 4 && (
              <motion.svg
                initial={{ y: 200, opacity: 0 }}
                animate={{ y: 0, opacity: 0.85 }}
                transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
                viewBox="0 0 600 400"
                className="absolute left-1/2 -translate-x-1/2 bottom-0 pointer-events-none"
                style={{ width: 'min(90vw, 700px)', height: 'auto' }}
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="gopuramGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"  stopColor="#FFD700" stopOpacity="0.95" />
                    <stop offset="60%" stopColor="#DAA520" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#8B6914" stopOpacity="0.55" />
                  </linearGradient>
                </defs>
                {/* Stacked tiers (a stylised gopuram) */}
                {/* Base */}
                <rect x="60" y="320" width="480" height="80" fill="url(#gopuramGrad)" />
                {/* Tier 1 */}
                <polygon points="80,320 520,320 480,260 120,260" fill="url(#gopuramGrad)" />
                {/* Tier 2 */}
                <polygon points="130,260 470,260 430,210 170,210" fill="url(#gopuramGrad)" />
                {/* Tier 3 */}
                <polygon points="180,210 420,210 385,165 215,165" fill="url(#gopuramGrad)" />
                {/* Tier 4 */}
                <polygon points="225,165 375,165 345,125 255,125" fill="url(#gopuramGrad)" />
                {/* Tier 5 */}
                <polygon points="263,125 337,125 315,90 285,90" fill="url(#gopuramGrad)" />
                {/* Kalasha (finial) */}
                <circle cx="300" cy="80" r="6" fill="url(#gopuramGrad)" />
                <line x1="300" y1="80" x2="300" y2="55" stroke="url(#gopuramGrad)" strokeWidth="2" />
                {/* Doorway */}
                <rect x="270" y="340" width="60" height="60" fill="#0A0806" />
                <path d="M 270 340 Q 300 320 330 340 L 330 400 L 270 400 Z" fill="#0A0806" />
                {/* Carved detail lines */}
                {[260, 210, 165, 125].map((y) => (
                  <line key={y} x1="40" y1={y} x2="560" y2={y} stroke="url(#gopuramGrad)" strokeWidth="0.7" opacity="0.5" />
                ))}
              </motion.svg>
            )}
          </AnimatePresence>

          {/* Marigold petals — fall from top during stage 5 */}
          <AnimatePresence>
            {stageUI >= 5 && (
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 20 }).map((_, i) => {
                  const colors = ['#FF9B3F', '#FFC845', '#FFD700', '#FF7028'];
                  const c = colors[i % colors.length];
                  return (
                    <motion.span key={i}
                      initial={{ y: -40, x: 0, opacity: 0, rotate: 0 }}
                      animate={{ y: '110vh', x: (i % 2 ? 1 : -1) * (20 + i * 4), opacity: [0, 1, 1, 0], rotate: 360 }}
                      transition={{ delay: i * 0.08, duration: 4.5 + (i % 3), ease: 'linear' }}
                      className="absolute block"
                      style={{
                        top: 0,
                        left: `${(i * 53) % 100}%`,
                        width: 10, height: 10,
                        background: c,
                        borderRadius: '50% 0 50% 50%',
                        boxShadow: `0 0 8px ${c}`,
                      }}
                    />
                  );
                })}
              </div>
            )}
          </AnimatePresence>

          {/* Couple names — stage 5 */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <AnimatePresence>
              {stageUI >= 5 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  className="text-center"
                  style={{ color: '#FFF8DC' }}
                >
                  <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: '#FFD700' }}>
                    ◆ {subtitle}
                  </div>
                  <div className="inline-block px-8 py-6 border"
                    style={{
                      borderColor: '#DAA520',
                      background: 'rgba(10,8,6,0.55)',
                      boxShadow: '0 0 28px rgba(218,165,32,0.35)',
                    }}>
                    <div className="text-[2.4rem] md:text-[4.2rem] leading-none"
                      style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 300, letterSpacing: '0.04em' }}>
                      <RevealText text={brideName} delay={0} />
                      <span style={{ color: '#DAA520', fontFamily: '"Great Vibes", cursive', fontStyle: 'italic', margin: '0 0.4em' }}>&amp;</span>
                      <RevealText text={groomName} delay={brideName.length * 0.05 + 0.3} />
                    </div>
                  </div>
                  <div className="text-[11px] tracking-[0.5em] uppercase mt-4 opacity-70">{monogram}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Tap to start */}
          <AnimatePresence>
            {!tapped && (
              <motion.button onClick={start}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 grid place-items-center"
                data-testid="temple-opening-start"
              >
                <div className="text-center">
                  <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: '#FFD700' }}>
                    ◆ {subtitle}
                  </div>
                  <div className="text-2xl md:text-3xl mb-6"
                    style={{ color: '#FFF8DC', fontFamily: '"Cormorant Garamond", serif' }}>
                    Tap to Open the Invitation
                  </div>
                  <div className="inline-block px-7 py-3 rounded-full border text-xs tracking-[0.3em] uppercase"
                    style={{ borderColor: '#DAA520', color: '#DAA520' }}>
                    Begin
                  </div>
                </div>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Controls */}
          {tapped && !done && (
            <div className="absolute top-6 right-6 z-10 flex items-center gap-2">
              <button onClick={toggleAudio} aria-label="Toggle audio"
                className="w-9 h-9 grid place-items-center rounded-full border"
                style={{ borderColor: 'rgba(218,165,32,0.4)', color: '#FFD700' }}
                data-testid="temple-opening-audio">
                {audioOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              {showSkip && (
                <button onClick={finish} aria-label="Skip"
                  className="flex items-center gap-2 px-4 h-9 rounded-full border text-xs tracking-[0.25em] uppercase"
                  style={{ borderColor: 'rgba(218,165,32,0.4)', color: '#FFD700' }}
                  data-testid="temple-opening-skip">
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

export default TempleOpening3D;
