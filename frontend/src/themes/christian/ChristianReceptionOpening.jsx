import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { pixelRatioCap, shouldUseShadows } from '../shared/deviceCaps';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward, Volume2, VolumeX } from 'lucide-react';

const TOTAL_MS = 10000;
const RECEPTION_COLORS = { bg: '#0A0A14', white: '#FFFFFF', gold: '#FFD700', champagne: '#F7E7CE', silver: '#C0C0C0' };

const ChristianReceptionOpening = ({ brideName = 'Grace', groomName = 'John', subtitle = 'Grand Reception', particleCount = 280, onComplete }) => {
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
    scene.background = new THREE.Color(RECEPTION_COLORS.bg);
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
    camera.position.set(0, 0, 8);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap()));
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xFFFFFF, 0.3));
    const lights = [];
    for (let i = 0; i < 5; i++) {
      const light = new THREE.PointLight([0xFFFFFF, 0xFFD700, 0xC0C0C0, 0xF7E7CE, 0xFFFFFF][i], 1.5, 15);
      const angle = (i / 5) * Math.PI * 2;
      light.position.set(Math.cos(angle) * 5, 3, Math.sin(angle) * 5);
      scene.add(light);
      lights.push(light);
    }

    const champagneGlasses = [];
    for (let i = 0; i < 12; i++) {
      const glassGroup = new THREE.Group();
      const stemGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8);
      const stem = new THREE.Mesh(stemGeom, new THREE.MeshStandardMaterial({ color: RECEPTION_COLORS.silver, metalness: 0.9 }));
      glassGroup.add(stem);
      const bowlGeom = new THREE.ConeGeometry(0.15, 0.3, 16);
      const bowl = new THREE.Mesh(bowlGeom, new THREE.MeshPhysicalMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.3, transmission: 0.9 }));
      bowl.position.y = 0.35;
      glassGroup.add(bowl);
      const angle = (i / 12) * Math.PI * 2;
      glassGroup.position.set(Math.cos(angle) * 3, -2, Math.sin(angle) * 3);
      glassGroup.scale.set(0, 0, 0);
      scene.add(glassGroup);
      champagneGlasses.push(glassGroup);
    }

    const bubbles = [];
    for (let i = 0; i < 60; i++) {
      const bubbleGeom = new THREE.SphereGeometry(0.06, 8, 8);
      const bubble = new THREE.Mesh(bubbleGeom, new THREE.MeshPhysicalMaterial({ color: RECEPTION_COLORS.champagne, transparent: true, opacity: 0.6 }));
      bubble.position.set((Math.random() - 0.5) * 10, -5, (Math.random() - 0.5) * 6);
      bubble.userData = { vy: 0.03 + Math.random() * 0.02 };
      scene.add(bubble);
      bubbles.push(bubble);
    }

    const whiteRoses = [];
    for (let i = 0; i < 50; i++) {
      const roseGroup = new THREE.Group();
      for (let p = 0; p < 6; p++) {
        const angle = (p / 6) * Math.PI * 2;
        const petalGeom = new THREE.SphereGeometry(0.06, 8, 8);
        const petal = new THREE.Mesh(petalGeom, new THREE.MeshStandardMaterial({ color: RECEPTION_COLORS.white }));
        petal.position.x = Math.cos(angle) * 0.1;
        petal.position.y = Math.sin(angle) * 0.1;
        roseGroup.add(petal);
      }
      roseGroup.position.set((Math.random() - 0.5) * 12, 6 + Math.random() * 2, (Math.random() - 0.5) * 8);
      roseGroup.userData = { vy: -0.02 - Math.random() * 0.01, spin: (Math.random() - 0.5) * 0.05 };
      scene.add(roseGroup);
      whiteRoses.push(roseGroup);
    }

    const particlesGeom = new THREE.BufferGeometry();
    const particlesArr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlesArr[i * 3] = (Math.random() - 0.5) * 15;
      particlesArr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      particlesArr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    particlesGeom.setAttribute('position', new THREE.BufferAttribute(particlesArr, 3));
    const particlesMat = new THREE.PointsMaterial({ color: RECEPTION_COLORS.gold, size: 0.06, transparent: true, opacity: 0.6 });
    const particles = new THREE.Points(particlesGeom, particlesMat);
    scene.add(particles);

    sceneObjsRef.current = { scene, camera, renderer, champagneGlasses, bubbles, whiteRoses, particles, lights };
  };

  const animate = (elapsed) => {
    const objs = sceneObjsRef.current;
    if (!objs) return;
    const { scene, camera, renderer, champagneGlasses, bubbles, whiteRoses, particles, lights } = objs;

    let stage = elapsed < 1800 ? 0 : elapsed < 4000 ? 1 : elapsed < 6200 ? 2 : elapsed < 8000 ? 3 : elapsed >= TOTAL_MS ? 5 : 4;
    if (stage !== stageRef.current) { stageRef.current = stage; setStageUI(stage); if (stage === 5) setTimeout(() => finish(), 600); }

    lights.forEach((light, i) => {
      const angle = elapsed * 0.0005 + (i / lights.length) * Math.PI * 2;
      light.position.x = Math.cos(angle) * 5;
      light.position.z = Math.sin(angle) * 5;
    });

    if (elapsed >= 1800) {
      const t2 = Math.min((elapsed - 1800) / 2200, 1);
      champagneGlasses.forEach((glass, i) => {
        const delay = (i / champagneGlasses.length) * 0.6;
        if (t2 > delay) {
          glass.scale.setScalar(Math.min((t2 - delay) / 0.4, 1));
        }
      });
    }

    if (elapsed >= 4000) {
      bubbles.forEach(bubble => {
        bubble.position.y += bubble.userData.vy;
        if (bubble.position.y > 6) { bubble.position.y = -5; bubble.position.x = (Math.random() - 0.5) * 10; }
      });
    }

    if (elapsed >= 6200) {
      whiteRoses.forEach(rose => {
        rose.position.y += rose.userData.vy;
        rose.rotation.x += rose.userData.spin;
        rose.rotation.y += rose.userData.spin * 1.5;
        if (rose.position.y < -5) { rose.position.y = 6; rose.position.x = (Math.random() - 0.5) * 12; }
      });
    }

    particles.rotation.y += 0.001;
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
    <div className="fixed inset-0 z-[100] overflow-hidden" style={{ background: RECEPTION_COLORS.bg }}>
      <div ref={containerRef} className="absolute inset-0" />
      {!tapped && (<motion.div className="absolute inset-0 grid place-items-center cursor-pointer" onClick={handleTap} initial={{ opacity: 0 }} animate={{ opacity: 1 }}><motion.div className="text-center space-y-4" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}><div className="text-sm tracking-[0.3em] uppercase" style={{ color: RECEPTION_COLORS.champagne }}>Elegant Celebration</div><div className="text-xs opacity-70" style={{ color: RECEPTION_COLORS.gold }}>Tap to Begin</div></motion.div></motion.div>)}
      <AnimatePresence>{stageUI === 5 && !done && (<motion.div className="absolute inset-0 grid place-items-center pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><div className="text-center space-y-6 px-8"><motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }} className="space-y-2"><div className="text-5xl md:text-6xl font-serif font-bold" style={{ color: RECEPTION_COLORS.white, textShadow: `0 0 40px ${RECEPTION_COLORS.gold}` }}>{brideName}</div><div className="text-3xl" style={{ color: RECEPTION_COLORS.champagne }}>&</div><div className="text-5xl md:text-6xl font-serif font-bold" style={{ color: RECEPTION_COLORS.white, textShadow: `0 0 40px ${RECEPTION_COLORS.gold}` }}>{groomName}</div></motion.div><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-sm tracking-[0.3em] uppercase" style={{ color: RECEPTION_COLORS.champagne }}>{subtitle}</motion.div></div></motion.div>)}</AnimatePresence>
      {tapped && (<div className="absolute top-6 right-6 z-10 flex gap-3"><button onClick={() => setAudioOn(!audioOn)} className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm grid place-items-center hover:bg-black/50" style={{ color: RECEPTION_COLORS.white }}>{audioOn ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>{showSkip && !done && (<motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} onClick={finish} className="px-4 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center gap-2 hover:bg-black/50 text-sm" style={{ color: RECEPTION_COLORS.white }}><span>Skip</span><SkipForward size={16} /></motion.button>)}</div>)}
    </div>
  );
};

export default ChristianReceptionOpening;