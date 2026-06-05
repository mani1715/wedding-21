/**
 * MughalOpening3D — Vanilla Three.js cinematic 5-stage opening.
 *
 * Uses Three.js directly (no react-three-fiber) for maximum reliability with
 * React 19. The scene is built imperatively in a useEffect, and EVERYTHING
 * is disposed on unmount.
 *
 * Stage 1 (0–1.5s):   Warm black + drifting gold dust + thin horizontal gold line
 * Stage 2 (1.5–3.5s): 3D wax seal rises (crimson cylinder w/ embossed Rub el Hizb)
 * Stage 3 (3.5–5.5s): Seal cracks — splits in 2 + radial particle burst + crack
 * Stage 4 (5.5–7.5s): Parchment envelope unfolds with a gold light sweep
 * Stage 5 (7.5–9s):   Mughal arch rises, names reveal letter-by-letter (DOM)
 */
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward, Volume2, VolumeX } from 'lucide-react';
import { createMughalSoundController } from './mughal.sounds';

const STAGE_BOUNDARIES = [0, 1500, 3500, 5500, 7500, 9000]; // ms
const TOTAL_MS = STAGE_BOUNDARIES[STAGE_BOUNDARIES.length - 1];

/* ─── Texture builders (canvas → THREE.CanvasTexture) ──────────────── */
const buildParchmentTexture = () => {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(256, 256, 60, 256, 256, 360);
  grad.addColorStop(0, '#F8EFCF'); grad.addColorStop(1, '#D9BC78');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1800; i++) {
    ctx.fillStyle = `rgba(80,50,20,${Math.random() * 0.07})`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 1, 1);
  }
  const v = ctx.createRadialGradient(256, 256, 220, 256, 256, 380);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(60,40,15,0.45)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, 512, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

const buildSealTopTexture = () => {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 130);
  grad.addColorStop(0, '#B22424'); grad.addColorStop(1, '#5A0F0F');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(128, 128, 124, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#E8C97A'; ctx.lineWidth = 3;
  const drawSquare = (rot) => {
    ctx.save(); ctx.translate(128, 128); ctx.rotate(rot);
    ctx.beginPath();
    ctx.moveTo(0, -64); ctx.lineTo(64, 0); ctx.lineTo(0, 64); ctx.lineTo(-64, 0);
    ctx.closePath(); ctx.stroke();
    ctx.restore();
  };
  drawSquare(0); drawSquare(Math.PI / 4);
  ctx.fillStyle = '#E8C97A';
  ctx.beginPath(); ctx.arc(128, 128, 8, 0, Math.PI * 2); ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

/* ─── Main component ──────────────────────────────────────────────── */
const MughalOpening3D = ({
  brideName = 'Anaya',
  groomName = 'Rohan',
  monogram  = 'A & R',
  subtitle  = 'Royal Mughal · North Indian',
  particleCount = 220,
  onComplete,
}) => {
  const reduce = useReducedMotion();
  const containerRef = useRef(null);
  const stageRef = useRef(0);            // mutable stage (avoids re-renders)
  const startTimeRef = useRef(null);
  const sceneObjsRef = useRef(null);     // holds disposables
  const soundRef = useRef(null);

  const [tapped, setTapped]   = useState(false);
  const [stageUI, setStageUI] = useState(0);
  const [audioOn, setAudioOn] = useState(true);
  const [showSkip, setShowSkip] = useState(false);
  const [done, setDone]       = useState(false);

  // ── Reduce-motion bypass ───────────────────────────────────────
  useEffect(() => {
    if (reduce) {
      setStageUI(5);
      setTimeout(() => finish(), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  // ── Build Three.js scene once on tap ──────────────────────────
  const initScene = () => {
    const container = containerRef.current;
    if (!container || sceneObjsRef.current) return;

    const w = container.clientWidth;
    const h = container.clientHeight;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0D0806');
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 0, 5);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ? 1.5 : 2));
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.18));
    const l1 = new THREE.PointLight(0xFFE6A6, 1.0); l1.position.set(-3, 2, 2); scene.add(l1);
    const l2 = new THREE.PointLight(0xFFE6A6, 1.0); l2.position.set( 3, 2, 2); scene.add(l2);
    const l3 = new THREE.PointLight(0xFF8B6B, 0.4); l3.position.set( 0, -1, -1); scene.add(l3);

    // ── Stage 1: gold dust ──
    const dustGeom = new THREE.BufferGeometry();
    const dustArr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      dustArr[i * 3]     = (Math.random() - 0.5) * 14;
      dustArr[i * 3 + 1] = -4 + Math.random() * 8;
      dustArr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    dustGeom.setAttribute('position', new THREE.BufferAttribute(dustArr, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xE8C97A, size: 0.045, transparent: true, opacity: 0.55,
      sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const dust = new THREE.Points(dustGeom, dustMat);
    scene.add(dust);

    // ── Stage 1b: gold line ──
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xD4AF37, transparent: true, opacity: 0.9 });
    const lineGeom = new THREE.PlaneGeometry(6, 0.006);
    const line = new THREE.Mesh(lineGeom, lineMat);
    line.position.z = -0.5; line.scale.x = 0;
    scene.add(line);

    // ── Stage 2: wax seal (whole) ──
    const sealTex = buildSealTopTexture();
    const sealWhole = new THREE.Group();
    const sealCylGeom = new THREE.CylinderGeometry(0.9, 0.9, 0.32, 64);
    const sealMat = new THREE.MeshStandardMaterial({ color: 0x5A0F0F, roughness: 0.5, metalness: 0.15 });
    sealWhole.add(new THREE.Mesh(sealCylGeom, sealMat));
    const sealTopGeom = new THREE.CircleGeometry(0.9, 64);
    const sealTopMat = new THREE.MeshStandardMaterial({ map: sealTex, roughness: 0.4, metalness: 0.3 });
    const sealTop = new THREE.Mesh(sealTopGeom, sealTopMat);
    sealTop.rotation.x = -Math.PI / 2; sealTop.position.y = 0.17;
    sealWhole.add(sealTop);
    sealWhole.scale.set(0, 0, 0);
    scene.add(sealWhole);

    // ── Stage 3: split halves ──
    const halfGeomLeft  = new THREE.CylinderGeometry(0.9, 0.9, 0.32, 32, 1, false,  Math.PI / 2, Math.PI);
    const halfGeomRight = new THREE.CylinderGeometry(0.9, 0.9, 0.32, 32, 1, false, -Math.PI / 2, Math.PI);
    const halfMatL = new THREE.MeshStandardMaterial({ color: 0x5A0F0F, roughness: 0.5, metalness: 0.15, side: THREE.DoubleSide });
    const halfMatR = halfMatL.clone();
    const halfL = new THREE.Mesh(halfGeomLeft,  halfMatL);
    const halfR = new THREE.Mesh(halfGeomRight, halfMatR);
    halfL.position.x = -0.45; halfR.position.x = 0.45;
    halfL.scale.set(0, 0, 0); halfR.scale.set(0, 0, 0);
    scene.add(halfL); scene.add(halfR);

    // ── Stage 3b: red wax burst ──
    const burstCount = 50;
    const burstArr = new Float32Array(burstCount * 3);
    const burstVel = [];
    for (let i = 0; i < burstCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 4 + Math.random() * 4;
      burstVel.push({ vx: Math.cos(a) * r, vy: 1 + Math.random() * 3, vz: Math.sin(a) * r });
    }
    const burstGeom = new THREE.BufferGeometry();
    burstGeom.setAttribute('position', new THREE.BufferAttribute(burstArr, 3));
    const burstMat = new THREE.PointsMaterial({
      color: 0xB22424, size: 0.12, transparent: true, opacity: 0.9,
      sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const burst = new THREE.Points(burstGeom, burstMat);
    burst.visible = false;
    scene.add(burst);

    // ── Stage 4: envelope ──
    const parchTex = buildParchmentTexture();
    const envGroup = new THREE.Group();
    envGroup.position.set(0, -0.2, 0);
    envGroup.scale.set(0, 0, 0);
    const envBodyMat  = new THREE.MeshStandardMaterial({ map: parchTex, roughness: 0.9, metalness: 0, side: THREE.DoubleSide });
    const envBody     = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.2), envBodyMat);
    envBody.position.z = -0.01;
    envGroup.add(envBody);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xD4AF37, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
    const ringMesh = new THREE.Mesh(new THREE.RingGeometry(1.55, 1.62, 4, 1), ringMat);
    ringMesh.position.z = 0.001;
    envGroup.add(ringMesh);
    // Flap (triangle)
    const flapGeom = new THREE.BufferGeometry();
    flapGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
      -1.7, 1.1, 0,  1.7, 1.1, 0,  0, -0.4, 0,
    ]), 3));
    flapGeom.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 1, 1, 1, 0.5, 0]), 2));
    flapGeom.computeVertexNormals();
    const flapMat = new THREE.MeshStandardMaterial({ map: parchTex, roughness: 0.85, side: THREE.DoubleSide });
    const flap = new THREE.Mesh(flapGeom, flapMat);
    const flapHinge = new THREE.Group();
    flapHinge.position.y = 1.1;
    flap.position.y = -1.1;
    flapHinge.add(flap);
    envGroup.add(flapHinge);
    // Light sweep
    const sweepMat = new THREE.MeshBasicMaterial({ color: 0xFFE6A6, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
    const sweep = new THREE.Mesh(new THREE.PlaneGeometry(1, 2.6), sweepMat);
    sweep.position.set(-3, 0, 0.05);
    envGroup.add(sweep);
    scene.add(envGroup);

    // ── Stage 5: Mughal arch ──
    const archShape = new THREE.Shape();
    archShape.moveTo(-1.5, 0);
    archShape.lineTo(-1.5, 1.2);
    archShape.bezierCurveTo(-1.5, 1.9, -0.9, 2.4,  0, 2.4);
    archShape.bezierCurveTo( 0.9, 2.4,  1.5, 1.9,  1.5, 1.2);
    archShape.lineTo(1.5, 0);
    const archGeom1 = new THREE.ExtrudeGeometry(archShape, { depth: 0.04, bevelEnabled: false });
    const archGeom2 = new THREE.ExtrudeGeometry(archShape, { depth: 0.02, bevelEnabled: false });
    const archMat1 = new THREE.MeshBasicMaterial({ color: 0xD4AF37, transparent: true, opacity: 0 });
    const archMat2 = new THREE.MeshBasicMaterial({ color: 0x8B6914, transparent: true, opacity: 0 });
    const archGroup = new THREE.Group();
    archGroup.position.set(0, -3.2, -0.2);
    const arch1 = new THREE.Mesh(archGeom1, archMat1);
    const arch2 = new THREE.Mesh(archGeom2, archMat2);
    arch2.position.z = 0.06;
    archGroup.add(arch1); archGroup.add(arch2);
    scene.add(archGroup);

    // Save all disposables
    sceneObjsRef.current = {
      scene, camera, renderer,
      dust, dustGeom, dustMat,
      line, lineGeom, lineMat,
      sealWhole, sealCylGeom, sealMat, sealTopGeom, sealTopMat, sealTex,
      halfL, halfR, halfGeomLeft, halfGeomRight, halfMatL, halfMatR,
      burst, burstGeom, burstMat, burstVel, burstCount,
      envGroup, envBody, envBodyMat, parchTex, ringMesh, ringMat,
      flap, flapHinge, flapGeom, flapMat, sweep, sweepMat,
      archGroup, arch1, arch2, archGeom1, archGeom2, archMat1, archMat2,
      particleCount,
    };

    // ── Animate ──
    let rafId;
    const clock = new THREE.Clock();
    const tick = () => {
      const delta = clock.getDelta();
      const stage = stageRef.current;
      const objs  = sceneObjsRef.current;
      if (!objs) return;

      // Dust drifts up always
      const dpos = objs.dustGeom.attributes.position;
      for (let i = 0; i < objs.particleCount; i++) {
        let y = dpos.array[i * 3 + 1];
        y += delta * (0.18 + (i % 5) * 0.04);
        if (y > 5) y = -5;
        dpos.array[i * 3 + 1] = y;
      }
      dpos.needsUpdate = true;
      objs.dustMat.opacity = stage >= 3 ? 0.25 : 0.55;

      // Gold line scale-x grows during stages 1–2
      const lineTarget = stage >= 1 && stage < 3 ? 1 : 0;
      objs.line.scale.x += (lineTarget - objs.line.scale.x) * Math.min(1, delta * 3);

      // Seal whole — visible during stage 2
      const sealTarget = stage === 2 ? 1 : 0;
      const sealCur = objs.sealWhole.scale.x;
      const sealNext = sealCur + (sealTarget - sealCur) * Math.min(1, delta * 5);
      objs.sealWhole.scale.set(sealNext, sealNext, sealNext);
      if (sealTarget) objs.sealWhole.rotation.y += delta * 0.4;

      // Split halves — only animate during stage 3
      const halfTarget = stage === 3 ? 1 : 0;
      const halfCur = objs.halfL.scale.x;
      const halfNext = halfCur + (halfTarget - halfCur) * Math.min(1, delta * 5);
      objs.halfL.scale.set(halfNext, halfNext, halfNext);
      objs.halfR.scale.set(halfNext, halfNext, halfNext);
      if (stage === 3) {
        objs.halfL.position.x -= delta * 1.4;
        objs.halfR.position.x += delta * 1.4;
        objs.halfL.rotation.z -= delta * 0.9;
        objs.halfR.rotation.z += delta * 0.9;
        objs.halfL.position.y -= delta * 0.5;
        objs.halfR.position.y -= delta * 0.5;
      }

      // Burst — only during stage 3
      objs.burst.visible = stage === 3;
      if (stage === 3) {
        const bpos = objs.burstGeom.attributes.position;
        for (let i = 0; i < objs.burstCount; i++) {
          const v = objs.burstVel[i];
          bpos.array[i * 3]     += v.vx * delta;
          bpos.array[i * 3 + 1] += v.vy * delta;
          bpos.array[i * 3 + 2] += v.vz * delta;
          v.vy -= 6 * delta;
        }
        bpos.needsUpdate = true;
      }

      // Envelope — visible from stage 4
      const envTarget = stage >= 4 ? 1 : 0;
      const envCur = objs.envGroup.scale.x;
      const envNext = envCur + (envTarget - envCur) * Math.min(1, delta * 4);
      objs.envGroup.scale.set(envNext, envNext, envNext);
      if (stage >= 4) {
        const flapTargetRot = -Math.PI * 0.65;
        objs.flapHinge.rotation.x += (flapTargetRot - objs.flapHinge.rotation.x) * Math.min(1, delta * 1.6);
      }
      if (stage === 4) {
        objs.sweep.position.x += delta * 2.5;
        if (objs.sweep.position.x > 3) objs.sweep.position.x = -3;
        objs.sweepMat.opacity = Math.max(0, 0.6 - Math.abs(objs.sweep.position.x) / 3);
      } else {
        objs.sweepMat.opacity = 0;
      }

      // Arch — stage 5
      const archYTarget = stage >= 5 ? -0.5 : -3.2;
      objs.archGroup.position.y += (archYTarget - objs.archGroup.position.y) * Math.min(1, delta * 1.4);
      const archOpTarget = stage >= 5 ? 0.95 : 0;
      objs.archMat1.opacity += (archOpTarget - objs.archMat1.opacity) * Math.min(1, delta * 2);
      objs.archMat2.opacity += (archOpTarget * 0.6 - objs.archMat2.opacity) * Math.min(1, delta * 2);

      // Camera breathing
      const t = clock.elapsedTime;
      const camZTarget = stage === 3 ? 6.5 : stage >= 4 ? 6.0 : 5.0;
      objs.camera.position.z += (camZTarget - objs.camera.position.z) * 0.02;
      objs.camera.position.y = Math.sin(t * 0.4) * 0.05;
      objs.camera.lookAt(0, 0, 0);

      objs.renderer.render(objs.scene, objs.camera);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    // Resize
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

    // Cleanup hook
    sceneObjsRef.current.cleanup = () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
    };
  };

  // ── Tap-to-start ──────────────────────────────────────────────
  const start = async () => {
    if (tapped) return;
    setTapped(true);
    soundRef.current = createMughalSoundController();
    if (audioOn) {
      await soundRef.current.start();
      soundRef.current.fadeTo(0.18, 1.5);
    }
    // Init the scene now that user has tapped
    initScene();
    startTimeRef.current = Date.now();

    // Stage scheduler
    STAGE_BOUNDARIES.forEach((ms, i) => {
      if (i === 0) return;
      setTimeout(() => {
        stageRef.current = i;
        setStageUI(i);
        if (soundRef.current && audioOn) {
          if (i === 3) { soundRef.current.fadeTo(0.36, 0.4); soundRef.current.crack(); }
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
      if (soundRef.current) soundRef.current.fadeTo(on ? 0 : 0.18, 0.4);
      return !on;
    });
  };

  // ── Cleanup on unmount ────────────────────────────────────────
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
    [objs.sealTex, objs.parchTex].forEach((t) => t && t.dispose && t.dispose());
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
          style={{ background: '#0D0806' }}
          data-testid="mughal-opening-3d"
          data-stage={stageUI}
        >
          <div ref={containerRef} className="absolute inset-0" />

          {/* CSS overlay — names in stage 5 */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <AnimatePresence>
              {stageUI >= 5 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  className="text-center"
                  style={{ color: '#F5ECD7' }}
                >
                  <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: '#E8C97A' }}>
                    ◆ {subtitle}
                  </div>
                  <div className="text-[2.5rem] md:text-[4.5rem] leading-none"
                    style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 300, letterSpacing: '0.04em' }}>
                    <RevealText text={brideName} delay={0} />
                    <span style={{ color: '#D4AF37', fontFamily: '"Great Vibes", cursive', fontStyle: 'italic', margin: '0 0.4em' }}>&amp;</span>
                    <RevealText text={groomName} delay={brideName.length * 0.05 + 0.3} />
                  </div>
                  <div className="text-[11px] tracking-[0.5em] uppercase mt-4 opacity-70">{monogram}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Tap-to-start */}
          <AnimatePresence>
            {!tapped && (
              <motion.button onClick={start}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 grid place-items-center"
                data-testid="mughal-opening-start"
              >
                <div className="text-center">
                  <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: '#E8C97A' }}>
                    ◆ {subtitle}
                  </div>
                  <div className="text-2xl md:text-3xl mb-6"
                    style={{ color: '#F5ECD7', fontFamily: '"Cormorant Garamond", serif' }}>
                    Tap to Open the Invitation
                  </div>
                  <div className="inline-block px-7 py-3 rounded-full border text-xs tracking-[0.3em] uppercase"
                    style={{ borderColor: '#D4AF37', color: '#D4AF37' }}>
                    Begin
                  </div>
                </div>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Top-right controls */}
          {tapped && !done && (
            <div className="absolute top-6 right-6 z-10 flex items-center gap-2">
              <button onClick={toggleAudio} aria-label="Toggle audio"
                className="w-9 h-9 grid place-items-center rounded-full border"
                style={{ borderColor: 'rgba(232,201,122,0.4)', color: '#E8C97A' }}
                data-testid="mughal-opening-audio">
                {audioOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              {showSkip && (
                <button onClick={finish} aria-label="Skip"
                  className="flex items-center gap-2 px-4 h-9 rounded-full border text-xs tracking-[0.25em] uppercase"
                  style={{ borderColor: 'rgba(232,201,122,0.4)', color: '#E8C97A' }}
                  data-testid="mughal-opening-skip">
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

export default MughalOpening3D;
