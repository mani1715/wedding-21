import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { pixelRatioCap, shouldUseShadows } from '../shared/deviceCaps';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward, Volume2, VolumeX } from 'lucide-react';

const TOTAL_MS = 9000;
const HALDI_COLORS = { bg: '#1A1214', pastelPink: '#FFB6D1', lavender: '#E6E6FA', mint: '#98FF98', peach: '#FFDAB9', ivory: '#FFFFF0' };

const ChristianHaldiOpening = ({ brideName = 'Grace', groomName = 'John', subtitle = 'Garden Celebration', particleCount = 300, onComplete }) => {
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
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap()));
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xFFE6F5, 0.5));
    const lights = [];
    for (let i = 0; i < 4; i++) {
      const light = new THREE.PointLight([HALDI_COLORS.pastelPink, HALDI_COLORS.lavender, HALDI_COLORS.mint, HALDI_COLORS.peach][i], 1.5, 12);
      const angle = (i / 4) * Math.PI * 2;
      light.position.set(Math.cos(angle) * 4, 2, Math.sin(angle) * 4);
      scene.add(light);
      lights.push(light);
    }

    const gardenFlowers = [];
    for (let i = 0; i < 80; i++) {
      const flowerGroup = new THREE.Group();
      const colors = [HALDI_COLORS.pastelPink, HALDI_COLORS.lavender, HALDI_COLORS.peach];
      for (let p = 0; p < 6; p++) {
        const angle = (p / 6) * Math.PI * 2;
        const petalGeom = new THREE.BoxGeometry(0.08, 0.12, 0.02);
        const petal = new THREE.Mesh(petalGeom, new THREE.MeshStandardMaterial({ color: colors[i % 3] }));
        petal.position.x = Math.cos(angle) * 0.1;
        petal.position.y = Math.sin(angle) * 0.1;
        petal.rotation.z = angle;
        flowerGroup.add(petal);
      }
      flowerGroup.position.set((Math.random() - 0.5) * 14, 6 + Math.random() * 3, (Math.random() - 0.5) * 8);
      flowerGroup.userData = { vx: (Math.random() - 0.5) * 0.02, vy: -0.025 - Math.random() * 0.015, spin: (Math.random() - 0.5) * 0.08 };
      scene.add(flowerGroup);
      gardenFlowers.push(flowerGroup);
    }

    const ribbons = [];
    for (let i = 0; i < 12; i++) {
      const ribbonGeom = new THREE.PlaneGeometry(0.3, 2);
      const ribbon = new THREE.Mesh(ribbonGeom, new THREE.MeshStandardMaterial({ color: [HALDI_COLORS.pastelPink, HALDI_COLORS.lavender][i % 2], side: THREE.DoubleSide }));
      const angle = (i / 12) * Math.PI * 2;
      ribbon.position.set(Math.cos(angle) * 2.5, Math.sin(angle) * 2.5, 0);
      ribbon.rotation.z = angle;
      ribbon.userData = { baseAngle: angle };
      scene.add(ribbons);
      ribbons.push(ribbon);
    }

    const particlesGeom = new THREE.BufferGeometry();
    const particlesArr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlesArr[i * 3] = (Math.random() - 0.5) * 15;
      particlesArr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      particlesArr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    particlesGeom.setAttribute('position', new THREE.BufferAttribute(particlesArr, 3));
    const particlesMat = new THREE.PointsMaterial({ color: HALDI_COLORS.lavender, size: 0.08, transparent: true, opacity: 0.6 });
    const particles = new THREE.Points(particlesGeom, particlesMat);
    scene.add(particles);

    sceneObjsRef.current = { scene, camera, renderer, gardenFlowers, ribbons, particles, lights };
  };

  const animate = (elapsed) => {
    const objs = sceneObjsRef.current;
    if (!objs) return;
    const { scene, camera, renderer, gardenFlowers, ribbons, particles, lights } = objs;

    let stage = elapsed < 1600 ? 0 : elapsed < 3800 ? 1 : elapsed < 6000 ? 2 : elapsed < 7500 ? 3 : elapsed >= TOTAL_MS ? 5 : 4;
    if (stage !== stageRef.current) { stageRef.current = stage; setStageUI(stage); if (stage === 5) setTimeout(() => finish(), 600); }

    lights.forEach((light, i) => { light.intensity = 1.5 + Math.sin(elapsed * 0.003 + i) * 0.3; });

    if (elapsed >= 1600) {
      gardenFlowers.forEach(flower => {
        flower.position.x += flower.userData.vx;
        flower.position.y += flower.userData.vy;
        flower.rotation.x += flower.userData.spin;
        flower.rotation.y += flower.userData.spin * 1.2;
        if (flower.position.y < -5) { flower.position.y = 6; flower.position.x = (Math.random() - 0.5) * 14; }
      });
    }

    if (elapsed >= 3800) {
      ribbons.forEach((ribbon, i) => {
        ribbon.rotation.y = Math.sin(elapsed * 0.002 + i) * 0.3;
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
      {!tapped && (<motion.div className="absolute inset-0 grid place-items-center cursor-pointer" onClick={handleTap} initial={{ opacity: 0 }} animate={{ opacity: 1 }}><motion.div className="text-center space-y-4" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}><div className="text-sm tracking-[0.3em] uppercase" style={{ color: HALDI_COLORS.ivory }}>Garden Celebration</div><div className="text-xs opacity-70" style={{ color: HALDI_COLORS.pastelPink }}>Tap to Begin</div></motion.div></motion.div>)}
      <AnimatePresence>{stageUI === 5 && !done && (<motion.div className="absolute inset-0 grid place-items-center pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><div className="text-center space-y-6 px-8"><motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }} className="space-y-2"><div className="text-5xl md:text-6xl font-serif font-bold" style={{ color: HALDI_COLORS.lavender, textShadow: `0 0 30px ${HALDI_COLORS.pastelPink}` }}>{brideName}</div><div className="text-3xl" style={{ color: HALDI_COLORS.peach }}>&</div><div className="text-5xl md:text-6xl font-serif font-bold" style={{ color: HALDI_COLORS.lavender, textShadow: `0 0 30px ${HALDI_COLORS.pastelPink}` }}>{groomName}</div></motion.div><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-sm tracking-[0.3em] uppercase" style={{ color: HALDI_COLORS.ivory }}>{subtitle}</motion.div></div></motion.div>)}</AnimatePresence>
      {tapped && (<div className="absolute top-6 right-6 z-10 flex gap-3"><button onClick={() => setAudioOn(!audioOn)} className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm grid place-items-center hover:bg-black/50" style={{ color: HALDI_COLORS.ivory }}>{audioOn ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>{showSkip && !done && (<motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} onClick={finish} className="px-4 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center gap-2 hover:bg-black/50 text-sm" style={{ color: HALDI_COLORS.ivory }}><span>Skip</span><SkipForward size={16} /></motion.button>)}</div>)}
    </div>
  );
};

export default ChristianHaldiOpening;