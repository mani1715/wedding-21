import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { pixelRatioCap, shouldUseShadows } from '../shared/deviceCaps';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward, Volume2, VolumeX } from 'lucide-react';

const STAGE_BOUNDARIES = [0, 1600, 3800, 6000, 7500, 9000];
const TOTAL_MS = 9000;

const HALDI_COLORS = { bg: '#1A0F0A', turmeric: '#FFBF00', orange: '#FF8800', gold: '#FFD700', green: '#90EE90', rose: '#FF69B4' };

const MuslimHaldiOpening = ({ brideName = 'Fatima', groomName = 'Ali', subtitle = 'Haldi · Sangeet · Mehendi', particleCount = 350, onComplete }) => {
  const reduce = useReducedMotion();
  const containerRef = useRef(null);
  const stageRef = useRef(0);
  const sceneObjsRef = useRef(null);
  const [tapped, setTapped] = useState(false);
  const [stageUI, setStageUI] = useState(0);
  const [audioOn, setAudioOn] = useState(true);
  const [showSkip, setShowSkip] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => { if (reduce) { setStageUI(5); setTimeout(() => finish(), 300); } }, [reduce]);

  const initScene = () => {
    const container = containerRef.current;
    if (!container || sceneObjsRef.current) return;
    const w = container.clientWidth, h = container.clientHeight;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(HALDI_COLORS.bg);
    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
    camera.position.set(0, 0, 7);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap()));
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xFFE6D5, 0.5));
    const lights = [];
    for (let i = 0; i < 5; i++) {
      const light = new THREE.PointLight([HALDI_COLORS.turmeric, HALDI_COLORS.gold, HALDI_COLORS.orange, HALDI_COLORS.rose, HALDI_COLORS.green][i], 1.5, 12);
      const angle = (i / 5) * Math.PI * 2;
      light.position.set(Math.cos(angle) * 4, 2, Math.sin(angle) * 4);
      scene.add(light);
      lights.push(light);
    }

    const powderBursts = [];
    [HALDI_COLORS.turmeric, HALDI_COLORS.orange, HALDI_COLORS.gold, HALDI_COLORS.rose].forEach((color, idx) => {
      const burstGeom = new THREE.BufferGeometry();
      const count = 60;
      const positions = new Float32Array(count * 3);
      const velocities = [];
      for (let i = 0; i < count; i++) {
        positions[i * 3] = 0; positions[i * 3 + 1] = 0; positions[i * 3 + 2] = 0;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 0.04 + Math.random() * 0.03;
        velocities.push({ x: speed * Math.sin(phi) * Math.cos(theta), y: speed * Math.sin(phi) * Math.sin(theta), z: speed * Math.cos(phi) });
      }
      burstGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const burstMat = new THREE.PointsMaterial({ color: new THREE.Color(color), size: 0.22, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
      const burst = new THREE.Points(burstGeom, burstMat);
      scene.add(burst);
      powderBursts.push({ burst, velocities, delay: idx * 0.2 });
    });

    const marigolds = [];
    for (let i = 0; i < 80; i++) {
      const marigoldGroup = new THREE.Group();
      for (let p = 0; p < 8; p++) {
        const angle = (p / 8) * Math.PI * 2;
        const petalGeom = new THREE.BoxGeometry(0.08, 0.12, 0.02);
        const petalMat = new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? HALDI_COLORS.turmeric : HALDI_COLORS.orange, emissive: i % 2 === 0 ? HALDI_COLORS.turmeric : HALDI_COLORS.orange, emissiveIntensity: 0.3 });
        const petal = new THREE.Mesh(petalGeom, petalMat);
        petal.position.x = Math.cos(angle) * 0.1;
        petal.position.y = Math.sin(angle) * 0.1;
        petal.rotation.z = angle;
        marigoldGroup.add(petal);
      }
      marigoldGroup.position.set((Math.random() - 0.5) * 14, 6 + Math.random() * 3, (Math.random() - 0.5) * 8);
      marigoldGroup.userData = { vx: (Math.random() - 0.5) * 0.02, vy: -0.025 - Math.random() * 0.015, spin: (Math.random() - 0.5) * 0.08 };
      scene.add(marigoldGroup);
      marigolds.push(marigoldGroup);
    }

    const patterns = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const patternGeom = new THREE.TorusGeometry(0.2, 0.04, 16, 100);
      const patternMat = new THREE.MeshBasicMaterial({ color: HALDI_COLORS.gold, transparent: true, opacity: 0 });
      const pattern = new THREE.Mesh(patternGeom, patternMat);
      pattern.position.set(Math.cos(angle) * 2.5, Math.sin(angle) * 2.5, 0);
      pattern.rotation.z = angle;
      scene.add(pattern);
      patterns.push(pattern);
    }

    const particlesGeom = new THREE.BufferGeometry();
    const particlesArr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlesArr[i * 3] = (Math.random() - 0.5) * 15;
      particlesArr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      particlesArr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    particlesGeom.setAttribute('position', new THREE.BufferAttribute(particlesArr, 3));
    const particlesMat = new THREE.PointsMaterial({ color: HALDI_COLORS.turmeric, size: 0.08, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
    const particles = new THREE.Points(particlesGeom, particlesMat);
    scene.add(particles);

    sceneObjsRef.current = { scene, camera, renderer, powderBursts, marigolds, patterns, particles, lights };
  };

  const animate = (elapsed) => {
    const objs = sceneObjsRef.current;
    if (!objs) return;
    const { scene, camera, renderer, powderBursts, marigolds, patterns, particles, lights } = objs;

    let stage = 0;
    for (let i = 0; i < STAGE_BOUNDARIES.length - 1; i++) {
      if (elapsed >= STAGE_BOUNDARIES[i] && elapsed < STAGE_BOUNDARIES[i + 1]) { stage = i; break; }
    }
    if (elapsed >= TOTAL_MS) stage = 5;
    if (stage !== stageRef.current) { stageRef.current = stage; setStageUI(stage); if (stage === 5) setTimeout(() => finish(), 600); }

    lights.forEach((light, i) => { light.intensity = 1.5 + Math.sin(elapsed * 0.003 + i) * 0.3; });

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

    if (elapsed >= STAGE_BOUNDARIES[1]) {
      marigolds.forEach(marigold => {
        marigold.position.x += marigold.userData.vx;
        marigold.position.y += marigold.userData.vy;
        marigold.rotation.x += marigold.userData.spin;
        marigold.rotation.y += marigold.userData.spin * 1.2;
        if (marigold.position.y < -5) { marigold.position.y = 6; marigold.position.x = (Math.random() - 0.5) * 14; }
      });
    }

    if (elapsed >= STAGE_BOUNDARIES[2]) {
      const t3 = Math.min((elapsed - STAGE_BOUNDARIES[2]) / (STAGE_BOUNDARIES[3] - STAGE_BOUNDARIES[2]), 1);
      patterns.forEach((pattern, i) => {
        const delay = (i / patterns.length) * 0.5;
        if (t3 > delay) {
          const patternT = Math.min((t3 - delay) / 0.5, 1);
          pattern.material.opacity = patternT * 0.7;
          pattern.scale.setScalar(0.6 + patternT * 0.4);
          pattern.rotation.y = patternT * Math.PI * 2;
        }
      });
    }

    particles.rotation.y += 0.002;
    renderer.render(scene, camera);
  };

  const finish = () => { setDone(true); setTimeout(() => { cleanup(); onComplete?.(); }, 600); };
  const cleanup = () => {
    const objs = sceneObjsRef.current;
    if (!objs) return;
    objs.renderer.dispose();
    objs.scene.traverse((obj) => { if (obj.geometry) obj.geometry.dispose(); if (obj.material) { if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose()); else obj.material.dispose(); } });
    if (objs.renderer.domElement?.parentNode) objs.renderer.domElement.parentNode.removeChild(objs.renderer.domElement);
    sceneObjsRef.current = null;
  };
  useEffect(() => () => cleanup(), []);

  const handleTap = () => {
    if (tapped) return; setTapped(true); initScene();
    const startTime = Date.now();
    const loop = () => { if (!sceneObjsRef.current) return; const elapsed = Date.now() - startTime; if (elapsed < TOTAL_MS) { animate(elapsed); requestAnimationFrame(loop); } else { animate(TOTAL_MS); finish(); } };
    requestAnimationFrame(loop); setTimeout(() => setShowSkip(true), 1500);
  };

  if (reduce) return null;
  return (
    <div className="fixed inset-0 z-[100] overflow-hidden" style={{ background: HALDI_COLORS.bg }}>
      <div ref={containerRef} className="absolute inset-0" />
      {!tapped && (<motion.div className="absolute inset-0 grid place-items-center cursor-pointer" onClick={handleTap} initial={{ opacity: 0 }} animate={{ opacity: 1 }}><motion.div className="text-center space-y-4" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}><div className="text-sm tracking-[0.3em] uppercase" style={{ color: HALDI_COLORS.gold }}>Vibrant Celebration</div><div className="text-xs opacity-70" style={{ color: HALDI_COLORS.turmeric }}>Tap to Begin</div></motion.div></motion.div>)}
      <AnimatePresence>{stageUI === 5 && !done && (<motion.div className="absolute inset-0 grid place-items-center pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><div className="text-center space-y-6 px-8"><motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }} className="space-y-2"><div className="text-5xl md:text-6xl font-serif font-bold" style={{ color: HALDI_COLORS.turmeric, textShadow: `0 0 40px ${HALDI_COLORS.gold}` }}>{brideName}</div><div className="text-3xl" style={{ color: HALDI_COLORS.orange }}>&</div><div className="text-5xl md:text-6xl font-serif font-bold" style={{ color: HALDI_COLORS.turmeric, textShadow: `0 0 40px ${HALDI_COLORS.gold}` }}>{groomName}</div></motion.div><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-sm tracking-[0.3em] uppercase" style={{ color: HALDI_COLORS.gold }}>{subtitle}</motion.div></div></motion.div>)}</AnimatePresence>
      {tapped && (<div className="absolute top-6 right-6 z-10 flex gap-3"><button onClick={() => setAudioOn(!audioOn)} className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm grid place-items-center hover:bg-black/50" style={{ color: HALDI_COLORS.gold }}>{audioOn ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>{showSkip && !done && (<motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} onClick={finish} className="px-4 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center gap-2 hover:bg-black/50 text-sm" style={{ color: HALDI_COLORS.gold }}><span>Skip</span><SkipForward size={16} /></motion.button>)}</div>)}
    </div>
  );
};

export default MuslimHaldiOpening;