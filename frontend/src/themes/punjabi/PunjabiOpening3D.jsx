/**
 * PunjabiOpening3D — Three.js cinematic 5-stage Punjabi Sangeet opening.
 *
 * Stage 1 (0–1s):    Warm dark brown + first dhol hit (silence → boom)
 * Stage 2 (1–3s):    3D dhol flies in spinning, beat starts pumping
 * Stage 3 (3–5s):    Dhol EXPLODES → big bass+slap hit + confetti burst
 * Stage 4 (5–7s):    Phulkari chunni unfurls across the screen (DOM SVG)
 * Stage 5 (7–9s):    "Balle Balle!" couple-name reveal with glowing border
 */
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward, Volume2, VolumeX } from 'lucide-react';
import { createPunjabiSoundController } from './punjabi.sounds';

const STAGE_BOUNDARIES = [0, 1000, 3000, 5000, 7000, 9000]; // ms
const TOTAL_MS = STAGE_BOUNDARIES[STAGE_BOUNDARIES.length - 1];

/* Dhol drumhead texture — alternating coloured rings */
const buildDholHeadTexture = (color1 = '#FFD700', color2 = '#D4008B') => {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 12, 128, 128, 124);
  g.addColorStop(0,   '#FFF5E6');
  g.addColorStop(0.6, color1);
  g.addColorStop(1,   color2);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  // Black center disc (the syahi)
  ctx.fillStyle = '#1A0A00';
  ctx.beginPath(); ctx.arc(128, 128, 36, 0, Math.PI * 2); ctx.fill();
  // Decorative ring border
  ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(128, 128, 118, 0, Math.PI * 2); ctx.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

const PunjabiOpening3D = ({
  brideName = 'Simran',
  groomName = 'Arjun',
  monogram  = 'S & A',
  subtitle  = 'Punjabi Sangeet',
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
    scene.background = new THREE.Color('#1A0A00');
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    camera.position.set(0, 0, 5);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ? 1.5 : 2));
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    // Lights — warm phulkari ambience
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));
    const l1 = new THREE.PointLight(0xFFD700, 1.2); l1.position.set(-3, 2, 2); scene.add(l1);
    const l2 = new THREE.PointLight(0xD4008B, 0.8); l2.position.set( 3, -1, 2); scene.add(l2);

    // ── Dhol (drum) — two cylinders for body + two textured discs for heads ──
    const dholGroup = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x6B3410, roughness: 0.7, metalness: 0.1 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.8, 32), bodyMat);
    body.rotation.z = Math.PI / 2;
    dholGroup.add(body);

    const headTex1 = buildDholHeadTexture('#FFD700', '#FF6B00');   // bass head
    const headTex2 = buildDholHeadTexture('#FF6B00', '#D4008B');   // treble head
    const headMat1 = new THREE.MeshStandardMaterial({ map: headTex1, roughness: 0.6 });
    const headMat2 = new THREE.MeshStandardMaterial({ map: headTex2, roughness: 0.6 });
    const head1 = new THREE.Mesh(new THREE.CircleGeometry(0.55, 48), headMat1);
    head1.rotation.y = Math.PI / 2;
    head1.position.set(-0.901, 0, 0);
    const head2 = new THREE.Mesh(new THREE.CircleGeometry(0.55, 48), headMat2);
    head2.rotation.y = -Math.PI / 2;
    head2.position.set(0.901, 0, 0);
    dholGroup.add(head1); dholGroup.add(head2);

    // Tension rope rings (thin coloured cylinders running along the body)
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.5, metalness: 0.3 });
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.8, 6), ropeMat);
      rope.rotation.z = Math.PI / 2;
      rope.position.set(0, Math.sin(angle) * 0.56, Math.cos(angle) * 0.56);
      dholGroup.add(rope);
    }
    dholGroup.position.set(0, 0, 0);
    dholGroup.scale.set(0, 0, 0);
    scene.add(dholGroup);

    // ── Confetti debris (instanced via Points) for the explosion ──
    const burstCount = 80;
    const burstArr = new Float32Array(burstCount * 3);
    const burstVel = [];
    const burstCol = new Float32Array(burstCount * 3);
    const colorPalette = [
      [1.0, 0.84, 0.0],   // gold
      [1.0, 0.42, 0.0],   // orange
      [0.83, 0.0, 0.55],  // magenta
      [0.0, 0.78, 0.59],  // parrot green
    ];
    for (let i = 0; i < burstCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 3 + Math.random() * 4;
      burstVel.push({
        vx: Math.cos(a) * r,
        vy: 1 + Math.random() * 4,
        vz: Math.sin(a) * r,
      });
      const c = colorPalette[i % colorPalette.length];
      burstCol[i * 3] = c[0]; burstCol[i * 3 + 1] = c[1]; burstCol[i * 3 + 2] = c[2];
    }
    const burstGeom = new THREE.BufferGeometry();
    burstGeom.setAttribute('position', new THREE.BufferAttribute(burstArr, 3));
    burstGeom.setAttribute('color',    new THREE.BufferAttribute(burstCol, 3));
    const burstMat = new THREE.PointsMaterial({
      size: 0.16, transparent: true, opacity: 0.95, vertexColors: true,
      sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const burst = new THREE.Points(burstGeom, burstMat);
    burst.visible = false;
    scene.add(burst);

    // Ambient gold confetti particles (always)
    const dustGeom = new THREE.BufferGeometry();
    const dustArr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      dustArr[i * 3]     = (Math.random() - 0.5) * 14;
      dustArr[i * 3 + 1] = -4 + Math.random() * 8;
      dustArr[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    dustGeom.setAttribute('position', new THREE.BufferAttribute(dustArr, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xFFD700, size: 0.05, transparent: true, opacity: 0.4,
      sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const dust = new THREE.Points(dustGeom, dustMat);
    scene.add(dust);

    sceneObjsRef.current = {
      scene, camera, renderer,
      dust, dustGeom, dustMat,
      dholGroup, body, bodyMat, head1, head2, headMat1, headMat2,
      headTex1, headTex2, ropeMat,
      burst, burstGeom, burstMat, burstVel, burstCount,
      particleCount,
      dholHidden: false,
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
        y += delta * (0.20 + (i % 5) * 0.05);
        if (y > 5) y = -5;
        dpos.array[i * 3 + 1] = y;
      }
      dpos.needsUpdate = true;

      // Dhol — appears in stage 2, peaks, then disappears in stage 3
      let dholTarget = 0;
      if (stage === 2) dholTarget = 1;
      else if (stage === 3) dholTarget = objs.dholHidden ? 0 : 1.5; // briefly grow before exploding
      const dCur = objs.dholGroup.scale.x;
      const dNext = dCur + (dholTarget - dCur) * Math.min(1, delta * 5);
      objs.dholGroup.scale.set(dNext, dNext, dNext);
      // Constant spinning while visible
      if (stage >= 2 && stage <= 3) {
        objs.dholGroup.rotation.y += delta * 1.8;
        objs.dholGroup.rotation.z += delta * 0.4;
      }

      // Burst burst
      objs.burst.visible = stage >= 3 && stage < 5;
      if (stage === 3 || stage === 4) {
        const bpos = objs.burstGeom.attributes.position;
        for (let i = 0; i < objs.burstCount; i++) {
          const v = objs.burstVel[i];
          bpos.array[i * 3]     += v.vx * delta;
          bpos.array[i * 3 + 1] += v.vy * delta;
          bpos.array[i * 3 + 2] += v.vz * delta;
          v.vy -= 6 * delta;
        }
        bpos.needsUpdate = true;
        objs.burstMat.opacity = stage === 4 ? Math.max(0, 0.95 - delta * 50) : 0.95;
      }

      // Camera breathing
      const t = clock.elapsedTime;
      objs.camera.position.x = Math.sin(t * 0.3) * 0.06;
      objs.camera.position.y = Math.cos(t * 0.4) * 0.04;
      const camZTarget = stage === 3 ? 6 : 5;
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
    soundRef.current = createPunjabiSoundController();
    if (audioOn) {
      await soundRef.current.start();
      soundRef.current.fadeTo(0.22, 1.0);
    }
    initScene();

    STAGE_BOUNDARIES.forEach((ms, i) => {
      if (i === 0) return;
      setTimeout(() => {
        stageRef.current = i;
        setStageUI(i);
        if (soundRef.current && audioOn) {
          if (i === 3) {
            soundRef.current.bigHit();
            soundRef.current.fadeTo(0.35, 0.3);
            // Hide dhol shortly after explosion
            setTimeout(() => {
              if (sceneObjsRef.current) sceneObjsRef.current.dholHidden = true;
            }, 250);
          } else if (i === 5) {
            soundRef.current.fadeTo(0.18, 1.0);
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
    [objs.headTex1, objs.headTex2].forEach((t) => t && t.dispose && t.dispose());
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
          style={{ background: '#1A0A00' }}
          data-testid="punjabi-opening-3d"
          data-stage={stageUI}
        >
          <div ref={containerRef} className="absolute inset-0" />

          {/* Stage 4 — phulkari chunni unfurls (DOM SVG) */}
          <AnimatePresence>
            {stageUI >= 4 && stageUI < 5 && (
              <motion.svg
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 0.9 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                viewBox="0 0 800 200"
                preserveAspectRatio="none"
                className="absolute left-0 right-0 top-1/2 -translate-y-1/2 pointer-events-none origin-center"
                style={{ width: '100%', height: '38vh' }}
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="phulkariGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%"   stopColor="#FF6B00" />
                    <stop offset="50%"  stopColor="#D4008B" />
                    <stop offset="100%" stopColor="#FFD700" />
                  </linearGradient>
                </defs>
                <rect x="0" y="20" width="800" height="160" fill="url(#phulkariGrad)" opacity="0.85" />
                {/* Geometric embroidery */}
                {Array.from({ length: 24 }).map((_, i) => (
                  <g key={i} transform={`translate(${i * 35 + 10}, 100)`}>
                    <polygon points="0,-20 18,0 0,20 -18,0" fill="none" stroke="#FFD700" strokeWidth="1.2" />
                    <polygon points="0,-10 9,0 0,10 -9,0" fill="#FFD700" opacity="0.6" />
                  </g>
                ))}
                <line x1="0" y1="22"  x2="800" y2="22"  stroke="#FFD700" strokeWidth="2" />
                <line x1="0" y1="178" x2="800" y2="178" stroke="#FFD700" strokeWidth="2" />
              </motion.svg>
            )}
          </AnimatePresence>

          {/* Stage 5 — couple names */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <AnimatePresence>
              {stageUI >= 5 && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  className="text-center"
                  style={{ color: '#FFF5E6' }}
                >
                  <div className="text-[10px] tracking-[0.45em] uppercase mb-3" style={{ color: '#FFD700' }}>
                    ◆ Balle Balle · {subtitle}
                  </div>
                  <div className="text-[2.6rem] md:text-[5rem] leading-none"
                    style={{
                      fontFamily: '"Cormorant Garamond", serif', fontWeight: 500, letterSpacing: '0.03em',
                      textShadow: '0 0 24px rgba(255,215,0,0.6), 0 0 48px rgba(212,0,139,0.5)',
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
                data-testid="punjabi-opening-start"
              >
                <div className="text-center">
                  <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: '#FFD700' }}>
                    ◆ {subtitle}
                  </div>
                  <div className="text-2xl md:text-3xl mb-6"
                    style={{ color: '#FFF5E6', fontFamily: '"Cormorant Garamond", serif' }}>
                    Tap to Open the Invitation
                  </div>
                  <div className="inline-block px-7 py-3 rounded-full border text-xs tracking-[0.3em] uppercase"
                    style={{ borderColor: '#FF6B00', color: '#FF6B00' }}>
                    Balle Balle!
                  </div>
                </div>
              </motion.button>
            )}
          </AnimatePresence>

          {tapped && !done && (
            <div className="absolute top-6 right-6 z-10 flex items-center gap-2">
              <button onClick={toggleAudio} aria-label="Toggle audio"
                className="w-9 h-9 grid place-items-center rounded-full border"
                style={{ borderColor: 'rgba(255,107,0,0.5)', color: '#FFD700' }}
                data-testid="punjabi-opening-audio">
                {audioOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              {showSkip && (
                <button onClick={finish} aria-label="Skip"
                  className="flex items-center gap-2 px-4 h-9 rounded-full border text-xs tracking-[0.25em] uppercase"
                  style={{ borderColor: 'rgba(255,107,0,0.5)', color: '#FFD700' }}
                  data-testid="punjabi-opening-skip">
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

export default PunjabiOpening3D;
