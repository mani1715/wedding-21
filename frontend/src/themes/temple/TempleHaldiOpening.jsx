/**
 * TempleHaldiOpening - Vibrant Haldi/Sangeet/Mehendi celebration
 * Shared animation for colorful pre-wedding ceremonies
 * 
 * Animation Flow:
 * Stage 1: Colorful powder (gulal) bursts from center
 * Stage 2: Marigold and rose petals rain from above
 * Stage 3: Traditional music notes and dancing elements
 * Stage 4: Henna patterns form in background
 * Stage 5: Flower frame around couple names with vibrant colors
 */
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { pixelRatioCap, shouldUseShadows, shouldUseAntialias, requestIdle } from '../shared/deviceCaps';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward, Volume2, VolumeX } from 'lucide-react';
import { createTempleSoundController } from './temple.sounds';

const STAGE_BOUNDARIES = [0, 1600, 3800, 6000, 8000, 9500];
const TOTAL_MS = STAGE_BOUNDARIES[STAGE_BOUNDARIES.length - 1];

// Haldi/Sangeet/Mehendi colors: Bright yellow, orange, pink, green, purple
const HALDI_COLORS = {
  bg: '#1A0B00',
  yellow: '#FFD700',
  orange: '#FF8C00',
  pink: '#FF69B4',
  green: '#32CD32',
  purple: '#9B59B6',
  marigold: '#FFA500',
  rose: '#FF1493'
};

const buildHennaTexture = () => {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  
  // Transparent base
  ctx.fillStyle = 'rgba(26, 11, 0, 0.3)';
  ctx.fillRect(0, 0, 512, 512);
  
  // Henna patterns - intricate mehndi design
  ctx.strokeStyle = '#8B4513';
  ctx.fillStyle = '#8B4513';
  ctx.lineWidth = 2;
  
  // Central mandala
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(
      256 + Math.cos(angle) * 100,
      256 + Math.sin(angle) * 100,
      30,
      0,
      Math.PI * 2
    );
    ctx.stroke();
    
    // Inner flower
    for (let j = 0; j < 8; j++) {
      const a2 = (j / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(
        256 + Math.cos(angle) * 100,
        256 + Math.sin(angle) * 100
      );
      ctx.lineTo(
        256 + Math.cos(angle) * 100 + Math.cos(a2) * 15,
        256 + Math.sin(angle) * 100 + Math.sin(a2) * 15
      );
      ctx.stroke();
    }
  }
  
  // Paisley patterns
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x = 256 + Math.cos(angle) * 180;
    const y = 256 + Math.sin(angle) * 180;
    
    ctx.beginPath();
    ctx.ellipse(x, y, 25, 40, angle, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  // Vine patterns
  ctx.beginPath();
  for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
    const r = 150 + Math.sin(angle * 4) * 20;
    ctx.lineTo(
      256 + Math.cos(angle) * r,
      256 + Math.sin(angle) * r
    );
  }
  ctx.closePath();
  ctx.stroke();
  
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

const TempleHaldiOpening = ({
  brideName = 'Meera',
  groomName = 'Arjun',
  monogram = 'M & A',
  subtitle = 'Haldi · Sangeet · Mehendi',
  // PHASE 7 (perf): default 400→160 (-60%) to cut fragment work on mobile.
  particleCount = 160,
  onComplete,
}) => {
  const reduce = useReducedMotion();
  const containerRef = useRef(null);
  const stageRef = useRef(0);
  const sceneObjsRef = useRef(null);
  const soundRef = useRef(null);
  const rafRef = useRef(null);

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
  }, [reduce]);

  const initScene = () => {
    const container = containerRef.current;
    if (!container || sceneObjsRef.current) return;

    const w = container.clientWidth;
    const h = container.clientHeight;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(HALDI_COLORS.bg);
    
    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
    camera.position.set(0, 0, 7);
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: false,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap()));
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    // Vibrant colorful lighting
    scene.add(new THREE.AmbientLight(0xFFFFFF, 0.5));
    
    // Multi-colored lights
    const colorLights = [
      { color: HALDI_COLORS.yellow, pos: [-4, 3, 2] },
      { color: HALDI_COLORS.pink, pos: [4, 3, 2] },
      { color: HALDI_COLORS.orange, pos: [0, 4, 3] },
      { color: HALDI_COLORS.green, pos: [-3, -2, 2] },
      { color: HALDI_COLORS.purple, pos: [3, -2, 2] }
    ];
    
    colorLights.forEach(({ color, pos }) => {
      const light = new THREE.PointLight(new THREE.Color(color), 1.2, 12);
      light.position.set(...pos);
      scene.add(light);
    });

    // Stage 1: Colorful powder burst (gulal explosion)
    const powderBursts = [];
    const colors = [HALDI_COLORS.yellow, HALDI_COLORS.orange, HALDI_COLORS.pink, 
                    HALDI_COLORS.green, HALDI_COLORS.purple];
    
    colors.forEach((color, colorIdx) => {
      const burstGeom = new THREE.BufferGeometry();
      const count = 80;
      const positions = new Float32Array(count * 3);
      const velocities = [];
      
      for (let i = 0; i < count; i++) {
        // Start at center
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;
        
        // Random spherical velocities
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 0.04 + Math.random() * 0.03;
        
        velocities.push({
          x: speed * Math.sin(phi) * Math.cos(theta),
          y: speed * Math.sin(phi) * Math.sin(theta),
          z: speed * Math.cos(phi)
        });
      }
      
      burstGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const burstMat = new THREE.PointsMaterial({
        color: new THREE.Color(color),
        size: 0.25,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending
      });
      const burst = new THREE.Points(burstGeom, burstMat);
      scene.add(burst);
      powderBursts.push({ burst, velocities, delay: colorIdx * 0.2 });
    });

    // Stage 2: Flower petals (marigolds and roses)
    const petals = [];
    for (let i = 0; i < 120; i++) {
      const isMarigold = i % 2 === 0;
      const petalGeom = new THREE.SphereGeometry(0.12, 8, 8);
      const petalMat = new THREE.MeshStandardMaterial({
        color: isMarigold ? HALDI_COLORS.marigold : HALDI_COLORS.rose,
        emissive: isMarigold ? HALDI_COLORS.marigold : HALDI_COLORS.rose,
        emissiveIntensity: 0.3,
        flatShading: true
      });
      const petal = new THREE.Mesh(petalGeom, petalMat);
      petal.position.set(
        (Math.random() - 0.5) * 14,
        6 + Math.random() * 3,
        (Math.random() - 0.5) * 8
      );
      petal.userData = {
        vx: (Math.random() - 0.5) * 0.02,
        vy: -0.025 - Math.random() * 0.015,
        vz: (Math.random() - 0.5) * 0.02,
        spin: (Math.random() - 0.5) * 0.08
      };
      scene.add(petal);
      petals.push(petal);
    }

    // Stage 3: Musical notes
    const musicNotes = [];
    const noteShapes = ['♪', '♫', '♬'];
    for (let i = 0; i < 15; i++) {
      // Create note as a group of spheres forming the shape
      const noteGroup = new THREE.Group();
      
      // Note head
      const headGeom = new THREE.SphereGeometry(0.15, 16, 16);
      const noteMat = new THREE.MeshStandardMaterial({
        color: [HALDI_COLORS.pink, HALDI_COLORS.purple, HALDI_COLORS.yellow][i % 3],
        emissive: [HALDI_COLORS.pink, HALDI_COLORS.purple, HALDI_COLORS.yellow][i % 3],
        emissiveIntensity: 0.5
      });
      const head = new THREE.Mesh(headGeom, noteMat);
      noteGroup.add(head);
      
      // Note stem
      const stemGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8);
      const stem = new THREE.Mesh(stemGeom, noteMat.clone());
      stem.position.set(0.12, 0.25, 0);
      noteGroup.add(stem);
      
      noteGroup.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 5
      );
      noteGroup.scale.set(0, 0, 0);
      scene.add(noteGroup);
      musicNotes.push(noteGroup);
    }

    // Stage 4: Henna pattern background
    const hennaTex = buildHennaTexture();
    const hennaGeom = new THREE.PlaneGeometry(8, 8);
    const hennaMat = new THREE.MeshBasicMaterial({
      map: hennaTex,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    const henna = new THREE.Mesh(hennaGeom, hennaMat);
    henna.position.z = -2;
    scene.add(henna);

    // Stage 5: Flower frame
    const frameFlowers = [];
    const framePositions = [
      // Top
      ...Array.from({ length: 12 }, (_, i) => ({ x: -3 + i * 0.5, y: 2.5, z: 1 })),
      // Bottom
      ...Array.from({ length: 12 }, (_, i) => ({ x: -3 + i * 0.5, y: -2.5, z: 1 })),
      // Left
      ...Array.from({ length: 10 }, (_, i) => ({ x: -3, y: -2 + i * 0.5, z: 1 })),
      // Right
      ...Array.from({ length: 10 }, (_, i) => ({ x: 3, y: -2 + i * 0.5, z: 1 }))
    ];
    
    framePositions.forEach((pos, i) => {
      const flowerGroup = new THREE.Group();
      
      // Petals
      for (let p = 0; p < 6; p++) {
        const angle = (p / 6) * Math.PI * 2;
        const petalGeom = new THREE.BoxGeometry(0.08, 0.15, 0.02);
        const color = [HALDI_COLORS.marigold, HALDI_COLORS.rose, HALDI_COLORS.yellow][i % 3];
        const petalMat = new THREE.MeshStandardMaterial({
          color: color,
          emissive: color,
          emissiveIntensity: 0.4
        });
        const petal = new THREE.Mesh(petalGeom, petalMat);
        petal.position.x = Math.cos(angle) * 0.1;
        petal.position.y = Math.sin(angle) * 0.1;
        petal.rotation.z = angle;
        flowerGroup.add(petal);
      }
      
      // Center
      const centerGeom = new THREE.SphereGeometry(0.05, 8, 8);
      const centerMat = new THREE.MeshStandardMaterial({
        color: HALDI_COLORS.yellow,
        emissive: HALDI_COLORS.yellow,
        emissiveIntensity: 0.6
      });
      const center = new THREE.Mesh(centerGeom, centerMat);
      flowerGroup.add(center);
      
      flowerGroup.position.set(pos.x, pos.y, pos.z);
      flowerGroup.scale.set(0, 0, 0);
      scene.add(flowerGroup);
      frameFlowers.push(flowerGroup);
    });

    sceneObjsRef.current = {
      scene, camera, renderer, powderBursts, petals, musicNotes,
      henna, frameFlowers
    };
  };

  const animate = (elapsed) => {
    const objs = sceneObjsRef.current;
    if (!objs) return;

    const { scene, camera, renderer, powderBursts, petals, musicNotes,
            henna, frameFlowers } = objs;

    let stage = 0;
    for (let i = 0; i < STAGE_BOUNDARIES.length - 1; i++) {
      if (elapsed >= STAGE_BOUNDARIES[i] && elapsed < STAGE_BOUNDARIES[i + 1]) {
        stage = i;
        break;
      }
    }
    if (elapsed >= STAGE_BOUNDARIES[STAGE_BOUNDARIES.length - 1]) stage = STAGE_BOUNDARIES.length - 1;

    if (stage !== stageRef.current) {
      stageRef.current = stage;
      setStageUI(stage);
      if (stage === 5) setTimeout(() => finish(), 600);
    }

    // Stage 1: Powder bursts
    if (elapsed >= 0) {
      const t1 = elapsed / STAGE_BOUNDARIES[1];
      
      powderBursts.forEach(({ burst, velocities, delay }) => {
        if (t1 > delay) {
          const burstT = Math.min((t1 - delay) / 0.8, 1);
          burst.material.opacity = burstT * (1 - burstT * 0.6);
          
          const positions = burst.geometry.attributes.position.array;
          for (let i = 0; i < velocities.length; i++) {
            positions[i * 3] += velocities[i].x;
            positions[i * 3 + 1] += velocities[i].y;
            positions[i * 3 + 2] += velocities[i].z;
          }
          burst.geometry.attributes.position.needsUpdate = true;
        }
      });
    }

    // Stage 2: Petals fall
    if (elapsed >= STAGE_BOUNDARIES[1]) {
      petals.forEach(petal => {
        petal.position.x += petal.userData.vx;
        petal.position.y += petal.userData.vy;
        petal.position.z += petal.userData.vz;
        petal.rotation.x += petal.userData.spin;
        petal.rotation.y += petal.userData.spin * 1.2;
        petal.rotation.z += petal.userData.spin * 0.8;
        
        if (petal.position.y < -5) {
          petal.position.y = 6 + Math.random() * 3;
          petal.position.x = (Math.random() - 0.5) * 14;
          petal.position.z = (Math.random() - 0.5) * 8;
        }
      });
    }

    // Stage 3: Music notes appear and dance
    if (elapsed >= STAGE_BOUNDARIES[2]) {
      const t3 = Math.min((elapsed - STAGE_BOUNDARIES[2]) / (STAGE_BOUNDARIES[3] - STAGE_BOUNDARIES[2]), 1);
      
      musicNotes.forEach((note, i) => {
        const delay = (i / musicNotes.length) * 0.6;
        if (t3 > delay) {
          const noteT = Math.min((t3 - delay) / 0.4, 1);
          note.scale.setScalar(noteT);
          
          // Bounce animation
          note.position.y += Math.sin(elapsed * 0.005 + i) * 0.03;
          note.rotation.z = Math.sin(elapsed * 0.003 + i) * 0.3;
        }
      });
    }

    // Stage 4: Henna pattern fades in
    if (elapsed >= STAGE_BOUNDARIES[3]) {
      const t4 = Math.min((elapsed - STAGE_BOUNDARIES[3]) / (STAGE_BOUNDARIES[4] - STAGE_BOUNDARIES[3]), 1);
      henna.material.opacity = t4 * 0.4;
      henna.rotation.z = Math.sin(elapsed * 0.0005) * 0.1;
    }

    // Stage 5: Flower frame forms
    if (elapsed >= STAGE_BOUNDARIES[4]) {
      const t5 = Math.min((elapsed - STAGE_BOUNDARIES[4]) / (STAGE_BOUNDARIES[5] - STAGE_BOUNDARIES[4]), 1);
      
      frameFlowers.forEach((flower, i) => {
        const delay = (i / frameFlowers.length) * 0.7;
        if (t5 > delay) {
          const flowerT = Math.min((t5 - delay) / 0.3, 1);
          flower.scale.setScalar(flowerT);
          flower.rotation.z = flowerT * Math.PI * 2;
        }
      });
    }

    renderer.render(scene, camera);
  };

  const finish = () => {
    setDone(true);
    setTimeout(() => {
      cleanup();
      onComplete?.();
    }, 600);
  };

  const cleanup = () => {
    const objs = sceneObjsRef.current;
    // PHASE 7 (perf): cancel RAF first so no in-flight frame touches disposed buffers.
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (!objs) return;
    objs.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    try { objs.scene.clear?.(); } catch (_) {}
    try { objs.renderer.dispose(); } catch (_) {}
    try { objs.renderer.forceContextLoss?.(); } catch (_) {}
    if (objs.renderer.domElement?.parentNode) {
      objs.renderer.domElement.parentNode.removeChild(objs.renderer.domElement);
    }
    sceneObjsRef.current = null;
  };

  useEffect(() => {
    return () => cleanup();
  }, []);

  const handleTap = () => {
    if (tapped) return;
    setTapped(true);

    // PHASE 7 (perf): defer heavy WebGL init to a browser-idle slot so the
    // tap overlay can exit cleanly. Capped timeout keeps the show prompt.
    requestIdle(() => {
      if (!containerRef.current) return;
      initScene();

      soundRef.current = createTempleSoundController();
      if (audioOn) soundRef.current?.play();

      const startTime = Date.now();
      const loop = () => {
        if (!sceneObjsRef.current) return;
        const elapsed = Date.now() - startTime;
        if (elapsed < TOTAL_MS) {
          animate(elapsed);
          rafRef.current = requestAnimationFrame(loop);
        } else {
          animate(TOTAL_MS);
          finish();
        }
      };
      rafRef.current = requestAnimationFrame(loop);
      setTimeout(() => setShowSkip(true), 1500);
    }, { timeout: 120 });
  };

  const handleSkip = () => finish();
  const toggleAudio = () => {
    setAudioOn(!audioOn);
    if (soundRef.current) {
      audioOn ? soundRef.current.mute() : soundRef.current.unmute();
    }
  };

  if (reduce) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden" style={{ background: HALDI_COLORS.bg }}>
      <div ref={containerRef} className="absolute inset-0" />
      
      {!tapped && (
        <motion.div
          className="absolute inset-0 grid place-items-center cursor-pointer"
          onClick={handleTap}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="text-center space-y-4"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="text-sm tracking-[0.3em] uppercase" style={{ color: HALDI_COLORS.yellow }}>
              Colorful Celebration
            </div>
            <div className="text-xs opacity-70" style={{ color: HALDI_COLORS.marigold }}>
              Tap to Begin
            </div>
          </motion.div>
        </motion.div>
      )}

      <AnimatePresence>
        {stageUI === 5 && !done && (
          <motion.div
            className="absolute inset-0 grid place-items-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center space-y-6 px-8">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="space-y-2"
              >
                <div className="text-5xl md:text-6xl font-serif font-bold tracking-wide"
                  style={{ 
                    color: HALDI_COLORS.yellow, 
                    textShadow: `0 0 30px ${HALDI_COLORS.orange}, 0 0 50px ${HALDI_COLORS.pink}, 0 2px 4px rgba(0,0,0,0.8)` 
                  }}>
                  {brideName}
                </div>
                <div className="text-3xl md:text-4xl" 
                  style={{ 
                    color: HALDI_COLORS.marigold, 
                    textShadow: `0 0 25px ${HALDI_COLORS.rose}` 
                  }}>
                  &
                </div>
                <div className="text-5xl md:text-6xl font-serif font-bold tracking-wide"
                  style={{ 
                    color: HALDI_COLORS.yellow, 
                    textShadow: `0 0 30px ${HALDI_COLORS.orange}, 0 0 50px ${HALDI_COLORS.pink}, 0 2px 4px rgba(0,0,0,0.8)` 
                  }}>
                  {groomName}
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-sm tracking-[0.3em] uppercase"
                style={{ 
                  color: HALDI_COLORS.marigold, 
                  textShadow: '0 2px 4px rgba(0,0,0,0.8)' 
                }}>
                {subtitle}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {tapped && (
        <div className="absolute top-6 right-6 z-10 flex gap-3">
          <button onClick={toggleAudio}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm grid place-items-center hover:bg-black/50"
            style={{ color: HALDI_COLORS.yellow }}>
            {audioOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          {showSkip && !done && (
            <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              onClick={handleSkip}
              className="px-4 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center gap-2 hover:bg-black/50 text-sm"
              style={{ color: HALDI_COLORS.yellow }}>
              <span>Skip</span>
              <SkipForward size={16} />
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
};

export default TempleHaldiOpening;