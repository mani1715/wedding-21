/**
 * KeralaOpening3D — Three.js cinematic Kerala Backwaters opening.
 *
 * Sequence (≈4s):
 *   Stage 1 (0–1.0s):   Deep teal water surface. Plane geometry with vertical
 *                       sine displacement = subtle wave motion. Camera looks
 *                       down ~20° onto the surface. Lotus + lily pads scatter.
 *   Stage 2 (1.0–2.5s): A traditional kettuvallam houseboat (BoxGeometry hull
 *                       + arched roof) glides in from screen-right toward
 *                       center. Lotus pads gently part. Water ripples expand
 *                       from the bow (expanding ring meshes, fade out).
 *   Stage 3 (2.5–3.5s): Boat reaches center, anchors. The invitation rises
 *                       from the water (DOM overlay clip-path reveal, lit by
 *                       a warm PointLight that fades in from above).
 *   Stage 4 (3.5–4.0s): Lotus flowers bloom around the invitation edges
 *                       (DOM Framer Motion). Boat slowly drifts left.
 *
 * Cleanup: All Three.js resources disposed on unmount.
 */
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward } from 'lucide-react';
import { KERALA_COLORS } from './kerala.colors';
import { createKeralaSoundController } from './kerala.sounds';

const STAGE_BOUNDARIES = [0, 1000, 2500, 3500, 4000]; // ms
const TOTAL_MS = STAGE_BOUNDARIES[STAGE_BOUNDARIES.length - 1];

/* Build a water surface with vertical sine displacement. */
const buildWaterMesh = () => {
  const geom = new THREE.PlaneGeometry(20, 12, 64, 36);
  const mat  = new THREE.MeshStandardMaterial({
    color: new THREE.Color(KERALA_COLORS.water),
    roughness: 0.35,
    metalness: 0.6,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.rotation.x = -Math.PI / 2.1;
  mesh.position.y = -0.4;
  return mesh;
};

/* Lotus = group of thin elongated boxes radiating from center. */
const buildLotus = (size = 0.3, color = KERALA_COLORS.lotus) => {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.65 });
  for (let i = 0; i < 8; i++) {
    const petal = new THREE.Mesh(new THREE.BoxGeometry(size * 0.25, size, size * 0.12), mat);
    petal.position.set(
      Math.cos((i / 8) * Math.PI * 2) * size * 0.45,
      0,
      Math.sin((i / 8) * Math.PI * 2) * size * 0.45,
    );
    petal.rotation.y = (i / 8) * Math.PI * 2;
    g.add(petal);
  }
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(size * 0.15, 12, 12),
    new THREE.MeshStandardMaterial({ color: KERALA_COLORS.secondary, roughness: 0.4, metalness: 0.7 }),
  );
  g.add(core);
  return g;
};

/* Kettuvallam houseboat (low-poly). */
const buildHouseboat = () => {
  const g = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({ color: 0x1F1108, roughness: 0.7 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x3A2418, roughness: 0.85 });
  const goldMat = new THREE.MeshStandardMaterial({ color: KERALA_COLORS.secondary, roughness: 0.4, metalness: 0.7 });
  // Hull
  const hull = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.4, 0.9), hullMat);
  g.add(hull);
  // Arched roof — a half-cylinder
  const roofGeom = new THREE.CylinderGeometry(0.55, 0.55, 2.2, 16, 1, true, 0, Math.PI);
  const roof = new THREE.Mesh(roofGeom, roofMat);
  roof.rotation.z = Math.PI / 2;
  roof.position.y = 0.35;
  g.add(roof);
  // Gold trim
  const trim = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.04, 0.92), goldMat);
  trim.position.y = 0.15;
  g.add(trim);
  return g;
};

const KeralaOpening3D = ({
  brideName  = 'Anaya',
  groomName  = 'Vihaan',
  monogram   = 'A ❋ V',
  subtitle   = 'Kerala Backwaters',
  particleCount = 220,
  onComplete,
}) => {
  const reduce = useReducedMotion();
  const containerRef = useRef(null);
  const stageRef     = useRef(0);
  const sceneObjsRef = useRef(null);
  const soundRef     = useRef(null);

  const [tapped, setTapped]     = useState(false);
  const [stageUI, setStageUI]   = useState(0);
  const [showSkip, setShowSkip] = useState(false);
  const [done, setDone]         = useState(false);

  useEffect(() => {
    if (reduce) {
      setStageUI(4);
      setTimeout(finish, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  const initScene = () => {
    const container = containerRef.current;
    if (!container || sceneObjsRef.current) return;

    const w = container.clientWidth;
    const h = container.clientHeight;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(KERALA_COLORS.background);
    scene.fog = new THREE.Fog(KERALA_COLORS.background, 6, 20);

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    camera.position.set(0, 2.6, 5.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ? 1.5 : 2));
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const moon = new THREE.DirectionalLight(0xB0D6E6, 0.9);
    moon.position.set(-4, 6, 2);
    scene.add(moon);
    const warm = new THREE.PointLight(KERALA_COLORS.secondary, 0.0, 8);
    warm.position.set(0, 2.2, 1.5);
    scene.add(warm);

    // Water
    const water = buildWaterMesh();
    const waterPos = water.geometry.attributes.position;
    const baseZ = new Float32Array(waterPos.count);
    for (let i = 0; i < waterPos.count; i++) baseZ[i] = waterPos.getZ(i);
    scene.add(water);

    // Lotus + lily pads scattered on surface
    const flora = new THREE.Group();
    const lotusPositions = [
      { x: -2.4, z: -0.4, color: KERALA_COLORS.lotus,     s: 0.42 },
      { x:  2.6, z:  0.6, color: KERALA_COLORS.lotusDeep, s: 0.50 },
      { x: -1.0, z:  1.4, color: KERALA_COLORS.lotus,     s: 0.36 },
      { x:  1.4, z: -1.0, color: KERALA_COLORS.lily,      s: 0.38 },
    ];
    const lotusObjs = lotusPositions.map((L) => {
      const lotus = buildLotus(L.s, L.color);
      lotus.position.set(L.x, -0.3, L.z);
      flora.add(lotus);
      return { mesh: lotus, base: L.x, phase: Math.random() * Math.PI * 2 };
    });
    scene.add(flora);

    // Houseboat (start off-screen right)
    const boat = buildHouseboat();
    boat.position.set(6.5, 0.1, 0);
    boat.rotation.y = 0;
    scene.add(boat);

    // Ripple rings from boat (expanding circle meshes)
    const ringMat = new THREE.MeshBasicMaterial({
      color: KERALA_COLORS.waterHighlight,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
    });
    const rings = [];
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.45, 32), ringMat.clone());
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(0, -0.35, 0);
      scene.add(ring);
      rings.push({ mesh: ring, delay: i * 0.5, t: 0 });
    }

    // Gold sparkle particles on water
    const fwCount = Math.max(80, Math.floor(particleCount * 0.6));
    const fwArr   = new Float32Array(fwCount * 3);
    const fwPhase = new Float32Array(fwCount);
    for (let i = 0; i < fwCount; i++) {
      fwArr[i * 3]     = (Math.random() - 0.5) * 16;
      fwArr[i * 3 + 1] = -0.32 + Math.random() * 0.08;
      fwArr[i * 3 + 2] = (Math.random() - 0.5) * 9;
      fwPhase[i] = Math.random() * Math.PI * 2;
    }
    const fwGeom = new THREE.BufferGeometry();
    fwGeom.setAttribute('position', new THREE.BufferAttribute(fwArr, 3));
    const fwMat = new THREE.PointsMaterial({
      color: KERALA_COLORS.particle,
      size: 0.07,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const fw = new THREE.Points(fwGeom, fwMat);
    scene.add(fw);

    sceneObjsRef.current = {
      scene, camera, renderer,
      water, waterPos, baseZ,
      flora, lotusObjs,
      boat, rings, warm,
      fw, fwGeom, fwMat, fwPhase, fwCount,
    };

    let rafId;
    const clock = new THREE.Clock();
    const tick = () => {
      const delta = clock.getDelta();
      const t = clock.elapsedTime;
      const stage = stageRef.current;
      const objs = sceneObjsRef.current;
      if (!objs) return;

      // Water wave displacement
      for (let i = 0; i < objs.waterPos.count; i++) {
        const x = objs.waterPos.getX(i);
        const y = objs.waterPos.getY(i);
        const z = objs.baseZ[i] + Math.sin(t * 1.2 + x * 0.6 + y * 0.4) * 0.06;
        objs.waterPos.setZ(i, z);
      }
      objs.waterPos.needsUpdate = true;

      // Lotus gentle bob
      objs.lotusObjs.forEach((L) => {
        L.mesh.position.y = -0.3 + Math.sin(t * 0.9 + L.phase) * 0.04;
        L.mesh.rotation.y += delta * 0.05;
      });

      // Boat slide-in
      if (stage >= 2 && stage < 4) {
        const boatTarget = 0;
        objs.boat.position.x += (boatTarget - objs.boat.position.x) * Math.min(1, delta * 0.9);
        objs.boat.position.y = 0.1 + Math.sin(t * 0.7) * 0.04;
        objs.boat.rotation.z = Math.sin(t * 0.5) * 0.025;
      } else if (stage >= 4) {
        // Drift left away
        objs.boat.position.x -= delta * 0.5;
        objs.boat.position.y = 0.1 + Math.sin(t * 0.7) * 0.04;
      }

      // Ripples from boat bow when boat is at center
      if (stage >= 2 && Math.abs(objs.boat.position.x) < 2) {
        objs.rings.forEach((R) => {
          R.t += delta;
          if (R.t > 2 + R.delay) R.t = R.delay;
          const localT = Math.max(0, R.t - R.delay);
          const scale = 1 + localT * 2.2;
          R.mesh.scale.set(scale, scale, 1);
          R.mesh.material.opacity = Math.max(0, 0.45 - localT * 0.25);
          R.mesh.position.x = objs.boat.position.x - 1.5;
        });
      }

      // Warm light fade-in stage 3+
      const warmTarget = stage >= 3 ? 1.4 : 0;
      objs.warm.intensity += (warmTarget - objs.warm.intensity) * Math.min(1, delta * 1.5);

      // Sparkle pulse
      const colors = objs.fwGeom.attributes.position;
      for (let i = 0; i < objs.fwCount; i++) {
        // Stationary, just pulse opacity through material — particle-level alpha needs shader,
        // so we simulate via tiny vertical jitter
        colors.array[i * 3 + 1] = -0.32 + Math.sin(t * 1.4 + objs.fwPhase[i]) * 0.04;
      }
      colors.needsUpdate = true;
      objs.fwMat.opacity = 0.5 + Math.sin(t * 1.7) * 0.2;

      // Camera gentle drift
      objs.camera.position.x = Math.sin(t * 0.2) * 0.15;
      objs.camera.position.z = 5.5 + Math.cos(t * 0.15) * 0.1;
      objs.camera.lookAt(0, 0, 0);

      objs.renderer.render(objs.scene, objs.camera);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const onResize = () => {
      const objs = sceneObjsRef.current;
      if (!objs || !container) return;
      const ww = container.clientWidth, hh = container.clientHeight;
      objs.camera.aspect = ww / hh;
      objs.camera.updateProjectionMatrix();
      objs.renderer.setSize(ww, hh);
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
    soundRef.current = createKeralaSoundController();
    await soundRef.current.start();
    soundRef.current.fadeTo(0.14, 0.6);
    initScene();

    STAGE_BOUNDARIES.forEach((ms, i) => {
      if (i === 0) return;
      setTimeout(() => {
        stageRef.current = i;
        setStageUI(i);
        if (soundRef.current) {
          if (i === 2) soundRef.current.ripple();
          if (i === 3) soundRef.current.swell();
        }
      }, ms);
    });
    setTimeout(() => finish(), TOTAL_MS + 700);
    setTimeout(() => setShowSkip(true), 1500);
  };

  const finish = () => {
    if (done) return;
    setDone(true);
    if (soundRef.current) soundRef.current.stop();
    setTimeout(() => onComplete?.(), 800);
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
          style={{ background: KERALA_COLORS.background }}
          data-testid="kerala-opening-3d"
          data-stage={stageUI}
        >
          <div ref={containerRef} className="absolute inset-0" />

          {/* Stage 4 — couple names rising from the water */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <AnimatePresence>
              {stageUI >= 4 && (
                <motion.div
                  initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                  className="text-center"
                  style={{ color: KERALA_COLORS.text }}
                >
                  <div
                    className="text-[10px] md:text-[11px] tracking-[0.5em] uppercase mb-3"
                    style={{ color: KERALA_COLORS.secondary }}
                  >
                    ◈ {subtitle}
                  </div>
                  <div
                    className="text-[2.6rem] md:text-[5rem] leading-none"
                    style={{
                      fontFamily: '"Cormorant Garamond", serif',
                      fontWeight: 500, letterSpacing: '0.04em',
                      textShadow:
                        '0 6px 30px rgba(0,0,0,0.55), 0 0 30px rgba(212,162,76,0.35)',
                    }}
                  >
                    <RevealText text={brideName} delay={0} />
                    <span
                      style={{
                        color: KERALA_COLORS.secondary,
                        fontFamily: '"Great Vibes", cursive',
                        fontStyle: 'italic',
                        margin: '0 0.4em',
                      }}
                    >&amp;</span>
                    <RevealText text={groomName} delay={brideName.length * 0.05 + 0.3} />
                  </div>
                  <div
                    className="text-[11px] tracking-[0.4em] uppercase mt-4 opacity-70"
                    style={{ color: KERALA_COLORS.textMuted }}
                  >
                    {monogram}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {!tapped && (
              <motion.button
                onClick={start}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 grid place-items-center"
                data-testid="kerala-opening-start"
              >
                <div className="text-center">
                  <div className="text-[10px] tracking-[0.5em] uppercase mb-3" style={{ color: KERALA_COLORS.secondary }}>
                    ◈ {subtitle}
                  </div>
                  <div
                    className="text-2xl md:text-3xl mb-6"
                    style={{ color: KERALA_COLORS.text, fontFamily: '"Cormorant Garamond", serif' }}
                  >
                    Tap to set sail
                  </div>
                  <div
                    className="inline-block px-7 py-3 rounded-full border text-xs tracking-[0.3em] uppercase"
                    style={{ borderColor: KERALA_COLORS.secondary, color: KERALA_COLORS.secondary }}
                  >
                    Board the kettuvallam
                  </div>
                </div>
              </motion.button>
            )}
          </AnimatePresence>

          {tapped && !done && showSkip && (
            <button
              onClick={finish}
              aria-label="Skip"
              className="absolute top-6 right-6 z-10 flex items-center gap-2 px-4 h-9 rounded-full border text-xs tracking-[0.25em] uppercase"
              style={{ borderColor: 'rgba(212,162,76,0.45)', color: KERALA_COLORS.secondary }}
              data-testid="kerala-opening-skip"
            >
              <SkipForward className="w-3 h-3" /> Skip
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const RevealText = ({ text, delay = 0 }) => (
  <span style={{ display: 'inline-block' }}>
    {Array.from(text).map((ch, i) => (
      <motion.span
        key={i}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + i * 0.05, duration: 0.5, ease: 'easeOut' }}
        style={{ display: 'inline-block' }}
      >
        {ch === ' ' ? '\u00A0' : ch}
      </motion.span>
    ))}
  </span>
);

export default KeralaOpening3D;
