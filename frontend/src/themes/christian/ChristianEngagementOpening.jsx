import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { pixelRatioCap, shouldUseShadows } from '../shared/deviceCaps';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward, Volume2, VolumeX } from 'lucide-react';

const TOTAL_MS = 9000;
const ENGAGEMENT_COLORS = { bg: '#0F0A14', rose: '#FFB6D1', gold: '#D4AF37', white: '#FFFAFA', candle: '#FFA500' };

const ChristianEngagementOpening = ({ brideName = 'Grace', groomName = 'John', subtitle = 'Engagement', particleCount = 180, onComplete }) => {
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
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap()));
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xFFE6F5, 0.4));
    const l1 = new THREE.PointLight(ENGAGEMENT_COLORS.rose, 1.5, 15);
    l1.position.set(-3, 2, 2); scene.add(l1);
    const l2 = new THREE.PointLight(ENGAGEMENT_COLORS.gold, 1.5, 15);
    l2.position.set(3, 2, 2); scene.add(l2);

    const roses = [];
    for (let i = 0; i < 40; i++) {
      const roseGroup = new THREE.Group();
      for (let p = 0; p < 8; p++) {
        const angle = (p / 8) * Math.PI * 2;
        const petalGeom = new THREE.SphereGeometry(0.08, 8, 8);
        const petalMat = new THREE.MeshStandardMaterial({ color: i % 3 === 0 ? ENGAGEMENT_COLORS.rose : 0xFF69B4 });
        const petal = new THREE.Mesh(petalGeom, petalMat);
        petal.position.x = Math.cos(angle) * 0.15;
        petal.position.y = Math.sin(angle) * 0.15;
        roseGroup.add(petal);
      }
      const angle = (i / 40) * Math.PI * 2;
      roseGroup.position.set(Math.cos(angle) * 3.5, Math.sin(angle) * 3.5, 0);
      roseGroup.userData = { targetRadius: 2 };
      scene.add(roseGroup);
      roses.push(roseGroup);
    }

    const ringGroup = new THREE.Group();
    const ringGeom = new THREE.TorusGeometry(0.5, 0.08, 16, 100);
    const ringMat = new THREE.MeshStandardMaterial({ color: ENGAGEMENT_COLORS.gold, metalness: 0.95, roughness: 0.05 });
    const ring1 = new THREE.Mesh(ringGeom, ringMat);
    ring1.position.x = -0.5;
    ringGroup.add(ring1);
    const diamondGeom = new THREE.OctahedronGeometry(0.18, 0);
    const diamond = new THREE.Mesh(diamondGeom, new THREE.MeshStandardMaterial({ color: ENGAGEMENT_COLORS.white, metalness: 1, roughness: 0 }));
    diamond.position.set(-0.5, 0.5, 0);
    ringGroup.add(diamond);
    const ring2 = ring1.clone();
    ring2.position.x = 0.5;
    ringGroup.add(ring2);
    ringGroup.scale.set(0, 0, 0);
    scene.add(ringGroup);

    const candles = [];
    for (let i = 0; i < 8; i++) {
      const candleGroup = new THREE.Group();
      const bodyGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 16);
      const body = new THREE.Mesh(bodyGeom, new THREE.MeshStandardMaterial({ color: 0xFFFFF0 }));
      candleGroup.add(body);
      const flameGeom = new THREE.ConeGeometry(0.04, 0.15, 8);
      const flame = new THREE.Mesh(flameGeom, new THREE.MeshBasicMaterial({ color: ENGAGEMENT_COLORS.candle, transparent: true, opacity: 0 }));
      flame.position.y = 0.32;
      candleGroup.add(flame);
      const angle = (i / 8) * Math.PI * 2;
      candleGroup.position.set(Math.cos(angle) * 2.5, -1.5, Math.sin(angle) * 2.5);
      candleGroup.userData = { flame };
      candleGroup.scale.set(0, 0, 0);
      scene.add(candleGroup);
      candles.push(candleGroup);
    }

    const particlesGeom = new THREE.BufferGeometry();
    const particlesArr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlesArr[i * 3] = (Math.random() - 0.5) * 12;
      particlesArr[i * 3 + 1] = (Math.random() - 0.5) * 8;
      particlesArr[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    particlesGeom.setAttribute('position', new THREE.BufferAttribute(particlesArr, 3));
    const particlesMat = new THREE.PointsMaterial({ color: ENGAGEMENT_COLORS.rose, size: 0.06, transparent: true, opacity: 0.7 });
    const particles = new THREE.Points(particlesGeom, particlesMat);
    scene.add(particles);

    sceneObjsRef.current = { scene, camera, renderer, roses, ringGroup, diamond, candles, particles };
  };

  const animate = (elapsed) => {
    const objs = sceneObjsRef.current;
    if (!objs) return;
    const { scene, camera, renderer, roses, ringGroup, diamond, candles, particles } = objs;

    let stage = elapsed < 1800 ? 0 : elapsed < 4000 ? 1 : elapsed < 6000 ? 2 : elapsed < 7500 ? 3 : elapsed >= TOTAL_MS ? 5 : 4;
    if (stage !== stageRef.current) { stageRef.current = stage; setStageUI(stage); if (stage === 5) setTimeout(() => finish(), 600); }

    if (elapsed >= 0) {
      const t1 = Math.min(elapsed / 1800, 1);
      roses.forEach((rose, i) => {
        const angle = (i / roses.length) * Math.PI * 2;
        const currentRadius = 3.5 + (rose.userData.targetRadius - 3.5) * t1;
        rose.position.x = Math.cos(angle) * currentRadius;
        rose.position.y = Math.sin(angle) * currentRadius;
      });
    }

    if (elapsed >= 1800) {
      const t2 = Math.min((elapsed - 1800) / 2200, 1);
      ringGroup.scale.setScalar(t2);
      diamond.scale.setScalar(1 + Math.sin(elapsed * 0.01) * 0.3);
    }

    if (elapsed >= 4000) {
      const t3 = Math.min((elapsed - 4000) / 2000, 1);
      candles.forEach((candle, i) => {
        const delay = (i / candles.length) * 0.5;
        if (t3 > delay) {
          const candleT = Math.min((t3 - delay) / 0.5, 1);
          candle.scale.setScalar(candleT);
          candle.userData.flame.material.opacity = candleT;
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
    <div className="fixed inset-0 z-[100] overflow-hidden" style={{ background: ENGAGEMENT_COLORS.bg }}>
      <div ref={containerRef} className="absolute inset-0" />
      {!tapped && (<motion.div className="absolute inset-0 grid place-items-center cursor-pointer" onClick={handleTap} initial={{ opacity: 0 }} animate={{ opacity: 1 }}><motion.div className="text-center space-y-4" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}><div className="text-sm tracking-[0.3em] uppercase" style={{ color: ENGAGEMENT_COLORS.white }}>Romantic Engagement</div><div className="text-xs opacity-70" style={{ color: ENGAGEMENT_COLORS.rose }}>Tap to Begin</div></motion.div></motion.div>)}
      <AnimatePresence>{stageUI === 5 && !done && (<motion.div className="absolute inset-0 grid place-items-center pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><div className="text-center space-y-6 px-8"><motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }} className="space-y-2"><div className="text-5xl md:text-6xl font-serif font-bold" style={{ color: ENGAGEMENT_COLORS.rose, textShadow: `0 0 30px ${ENGAGEMENT_COLORS.gold}` }}>{brideName}</div><div className="text-3xl" style={{ color: ENGAGEMENT_COLORS.gold }}>&</div><div className="text-5xl md:text-6xl font-serif font-bold" style={{ color: ENGAGEMENT_COLORS.rose, textShadow: `0 0 30px ${ENGAGEMENT_COLORS.gold}` }}>{groomName}</div></motion.div><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-sm tracking-[0.3em] uppercase" style={{ color: ENGAGEMENT_COLORS.white }}>{subtitle}</motion.div></div></motion.div>)}</AnimatePresence>
      {tapped && (<div className="absolute top-6 right-6 z-10 flex gap-3"><button onClick={() => setAudioOn(!audioOn)} className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm grid place-items-center hover:bg-black/50" style={{ color: ENGAGEMENT_COLORS.white }}>{audioOn ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>{showSkip && !done && (<motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} onClick={finish} className="px-4 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center gap-2 hover:bg-black/50 text-sm" style={{ color: ENGAGEMENT_COLORS.white }}><span>Skip</span><SkipForward size={16} /></motion.button>)}</div>)}
    </div>
  );
};

export default ChristianEngagementOpening;