import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { pixelRatioCap, shouldUseShadows } from '../shared/deviceCaps';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward, Volume2, VolumeX } from 'lucide-react';

const STAGE_BOUNDARIES = [0, 1800, 4000, 6000, 7500, 9000];
const TOTAL_MS = 9000;

const ENGAGEMENT_COLORS = { bg: '#0F1419', emerald: '#50C878', gold: '#D4AF37', pearl: '#F0EAD6', mint: '#98FF98' };

const MuslimEngagementOpening = ({ brideName = 'Fatima', groomName = 'Ali', subtitle = 'Islamic Engagement', particleCount = 200, onComplete }) => {
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
    scene.background = new THREE.Color(ENGAGEMENT_COLORS.bg);
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    camera.position.set(0, 0, 7);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap()));
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xE8F5E9, 0.4));
    const l1 = new THREE.PointLight(ENGAGEMENT_COLORS.emerald, 1.5, 15);
    l1.position.set(-3, 2, 2); scene.add(l1);
    const l2 = new THREE.PointLight(ENGAGEMENT_COLORS.gold, 1.5, 15);
    l2.position.set(3, 2, 2); scene.add(l2);

    const pearls = [];
    for (let i = 0; i < 40; i++) {
      const pearlGeom = new THREE.SphereGeometry(0.08, 16, 16);
      const pearlMat = new THREE.MeshStandardMaterial({ color: ENGAGEMENT_COLORS.pearl, metalness: 0.8, roughness: 0.2 });
      const pearl = new THREE.Mesh(pearlGeom, pearlMat);
      const angle = (i / 40) * Math.PI * 2;
      pearl.position.set(Math.cos(angle) * 3, Math.sin(angle) * 3, 0);
      pearl.userData = { angle, targetRadius: 1.5 };
      scene.add(pearl);
      pearls.push(pearl);
    }

    const ringGroup = new THREE.Group();
    const ring1Geom = new THREE.TorusGeometry(0.5, 0.08, 16, 100);
    const ringMat = new THREE.MeshStandardMaterial({ color: ENGAGEMENT_COLORS.gold, metalness: 0.95, roughness: 0.05 });
    const ring1 = new THREE.Mesh(ring1Geom, ringMat);
    ring1.position.x = -0.5;
    ringGroup.add(ring1);
    const emeraldGeom = new THREE.OctahedronGeometry(0.18, 0);
    const emeraldMat = new THREE.MeshStandardMaterial({ color: ENGAGEMENT_COLORS.emerald, metalness: 0.8, roughness: 0.1, emissive: ENGAGEMENT_COLORS.emerald, emissiveIntensity: 0.6 });
    const emerald = new THREE.Mesh(emeraldGeom, emeraldMat);
    emerald.position.set(-0.5, 0.5, 0);
    ringGroup.add(emerald);
    const ring2 = ring1.clone();
    ring2.position.x = 0.5;
    ringGroup.add(ring2);
    ringGroup.scale.set(0, 0, 0);
    scene.add(ringGroup);

    const jasmines = [];
    for (let i = 0; i < 30; i++) {
      const jasmineGroup = new THREE.Group();
      for (let p = 0; p < 6; p++) {
        const angle = (p / 6) * Math.PI * 2;
        const petalGeom = new THREE.BoxGeometry(0.06, 0.1, 0.02);
        const petalMat = new THREE.MeshStandardMaterial({ color: 0xFFFFF0 });
        const petal = new THREE.Mesh(petalGeom, petalMat);
        petal.position.x = Math.cos(angle) * 0.08;
        petal.position.y = Math.sin(angle) * 0.08;
        petal.rotation.z = angle;
        jasmineGroup.add(petal);
      }
      jasmineGroup.position.set((Math.random() - 0.5) * 12, 6 + Math.random() * 2, (Math.random() - 0.5) * 6);
      jasmineGroup.userData = { vy: -0.02 - Math.random() * 0.01 };
      scene.add(jasmineGroup);
      jasmines.push(jasmineGroup);
    }

    const particlesGeom = new THREE.BufferGeometry();
    const particlesArr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlesArr[i * 3] = (Math.random() - 0.5) * 12;
      particlesArr[i * 3 + 1] = (Math.random() - 0.5) * 8;
      particlesArr[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    particlesGeom.setAttribute('position', new THREE.BufferAttribute(particlesArr, 3));
    const particlesMat = new THREE.PointsMaterial({ color: ENGAGEMENT_COLORS.mint, size: 0.06, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending });
    const particles = new THREE.Points(particlesGeom, particlesMat);
    scene.add(particles);

    sceneObjsRef.current = { scene, camera, renderer, pearls, ringGroup, emerald, jasmines, particles };
  };

  const animate = (elapsed) => {
    const objs = sceneObjsRef.current;
    if (!objs) return;
    const { scene, camera, renderer, pearls, ringGroup, emerald, jasmines, particles } = objs;

    let stage = 0;
    for (let i = 0; i < STAGE_BOUNDARIES.length - 1; i++) {
      if (elapsed >= STAGE_BOUNDARIES[i] && elapsed < STAGE_BOUNDARIES[i + 1]) { stage = i; break; }
    }
    if (elapsed >= TOTAL_MS) stage = 5;
    if (stage !== stageRef.current) { stageRef.current = stage; setStageUI(stage); if (stage === 5) setTimeout(() => finish(), 600); }

    if (elapsed >= 0) {
      const t1 = Math.min(elapsed / STAGE_BOUNDARIES[1], 1);
      pearls.forEach((pearl, i) => {
        const progress = t1;
        const currentRadius = 3 + (pearl.userData.targetRadius - 3) * progress;
        const angle = pearl.userData.angle;
        pearl.position.x = Math.cos(angle) * currentRadius;
        pearl.position.y = Math.sin(angle) * currentRadius;
      });
    }

    if (elapsed >= STAGE_BOUNDARIES[1]) {
      const t2 = Math.min((elapsed - STAGE_BOUNDARIES[1]) / (STAGE_BOUNDARIES[2] - STAGE_BOUNDARIES[1]), 1);
      ringGroup.scale.setScalar(t2);
      const sparkle = 1 + Math.sin(elapsed * 0.01) * 0.3;
      emerald.scale.setScalar(sparkle);
    }

    if (elapsed >= STAGE_BOUNDARIES[2]) {
      jasmines.forEach(jasmine => {
        jasmine.position.y += jasmine.userData.vy;
        jasmine.rotation.x += 0.02;
        jasmine.rotation.y += 0.03;
        if (jasmine.position.y < -4) { jasmine.position.y = 6; jasmine.position.x = (Math.random() - 0.5) * 12; }
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
    <div className="fixed inset-0 z-[100] overflow-hidden" style={{ background: ENGAGEMENT_COLORS.bg }}>
      <div ref={containerRef} className="absolute inset-0" />
      {!tapped && (<motion.div className="absolute inset-0 grid place-items-center cursor-pointer" onClick={handleTap} initial={{ opacity: 0 }} animate={{ opacity: 1 }}><motion.div className="text-center space-y-4" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}><div className="text-sm tracking-[0.3em] uppercase" style={{ color: ENGAGEMENT_COLORS.pearl }}>Islamic Engagement</div><div className="text-xs opacity-70" style={{ color: ENGAGEMENT_COLORS.emerald }}>Tap to Begin</div></motion.div></motion.div>)}
      <AnimatePresence>{stageUI === 5 && !done && (<motion.div className="absolute inset-0 grid place-items-center pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><div className="text-center space-y-6 px-8"><motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }} className="space-y-2"><div className="text-5xl md:text-6xl font-serif font-bold" style={{ color: ENGAGEMENT_COLORS.emerald, textShadow: `0 0 30px ${ENGAGEMENT_COLORS.gold}` }}>{brideName}</div><div className="text-3xl" style={{ color: ENGAGEMENT_COLORS.gold }}>&</div><div className="text-5xl md:text-6xl font-serif font-bold" style={{ color: ENGAGEMENT_COLORS.emerald, textShadow: `0 0 30px ${ENGAGEMENT_COLORS.gold}` }}>{groomName}</div></motion.div><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-sm tracking-[0.3em] uppercase" style={{ color: ENGAGEMENT_COLORS.pearl }}>{subtitle}</motion.div></div></motion.div>)}</AnimatePresence>
      {tapped && (<div className="absolute top-6 right-6 z-10 flex gap-3"><button onClick={() => setAudioOn(!audioOn)} className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm grid place-items-center hover:bg-black/50" style={{ color: ENGAGEMENT_COLORS.pearl }}>{audioOn ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>{showSkip && !done && (<motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} onClick={finish} className="px-4 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center gap-2 hover:bg-black/50 text-sm" style={{ color: ENGAGEMENT_COLORS.pearl }}><span>Skip</span><SkipForward size={16} /></motion.button>)}</div>)}
    </div>
  );
};

export default MuslimEngagementOpening;