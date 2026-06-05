import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward, Volume2, VolumeX } from 'lucide-react';

const TOTAL_MS = 10000;
const MARRIAGE_COLORS = { bg: '#1A0A00', gold: '#FFD700', red: '#DC143C', saffron: '#FF9933', white: '#FFFFFF' };

const PunjabiMarriageOpening = ({ brideName = 'Simran', groomName = 'Harpreet', subtitle = 'Punjabi Wedding', particleCount = 260, onComplete }) => {
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
    scene.background = new THREE.Color(MARRIAGE_COLORS.bg);
    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
    camera.position.set(0, 0, 8);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ? 1.5 : 2));
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xFFE6D5, 0.4));
    const l1 = new THREE.PointLight(MARRIAGE_COLORS.gold, 1.8, 18);
    l1.position.set(-4, 5, 3); scene.add(l1);
    const l2 = new THREE.PointLight(MARRIAGE_COLORS.red, 1.8, 18);
    l2.position.set(4, 5, 3); scene.add(l2);

    const khandaGroup = new THREE.Group();
    const swordGeom = new THREE.BoxGeometry(0.1, 2, 0.1);
    const metalMat = new THREE.MeshStandardMaterial({ color: MARRIAGE_COLORS.gold, metalness: 0.9, roughness: 0.1 });
    const centralSword = new THREE.Mesh(swordGeom, metalMat);
    khandaGroup.add(centralSword);
    const leftSword = centralSword.clone();
    leftSword.position.x = -0.3; leftSword.rotation.z = Math.PI / 6;
    khandaGroup.add(leftSword);
    const rightSword = centralSword.clone();
    rightSword.position.x = 0.3; rightSword.rotation.z = -Math.PI / 6;
    khandaGroup.add(rightSword);
    const circleGeom = new THREE.TorusGeometry(0.6, 0.05, 16, 100);
    const circle = new THREE.Mesh(circleGeom, metalMat.clone());
    khandaGroup.add(circle);
    khandaGroup.position.set(0, 2, 0);
    khandaGroup.scale.set(0, 0, 0);
    scene.add(khandaGroup);

    const phulkariPatterns = [];
    for (let i = 0; i < 20; i++) {
      const patternGeom = new THREE.BoxGeometry(0.3, 0.3, 0.05);
      const colors = [MARRIAGE_COLORS.red, MARRIAGE_COLORS.saffron, MARRIAGE_COLORS.gold];
      const pattern = new THREE.Mesh(patternGeom, new THREE.MeshStandardMaterial({ color: colors[i % 3], emissive: colors[i % 3], emissiveIntensity: 0.3 }));
      const angle = (i / 20) * Math.PI * 2;
      pattern.position.set(Math.cos(angle) * 3, Math.sin(angle) * 3, -1);
      pattern.rotation.z = angle;
      scene.add(pattern);
      phulkariPatterns.push(pattern);
    }

    const dholDrums = [];
    for (let i = 0; i < 2; i++) {
      const drumGroup = new THREE.Group();
      const bodyGeom = new THREE.CylinderGeometry(0.4, 0.4, 0.8, 16);
      const body = new THREE.Mesh(bodyGeom, new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
      drumGroup.add(body);
      const topGeom = new THREE.CircleGeometry(0.4, 32);
      const top = new THREE.Mesh(topGeom, new THREE.MeshStandardMaterial({ color: MARRIAGE_COLORS.white }));
      top.position.y = 0.4; top.rotation.x = -Math.PI / 2;
      drumGroup.add(top);
      drumGroup.position.set(i === 0 ? -2 : 2, -1.5, 1);
      drumGroup.rotation.z = Math.PI / 2;
      drumGroup.scale.set(0, 0, 0);
      scene.add(drumGroup);
      dholDrums.push(drumGroup);
    }

    const marigolds = [];
    for (let i = 0; i < 60; i++) {
      const marigoldGroup = new THREE.Group();
      for (let p = 0; p < 8; p++) {
        const angle = (p / 8) * Math.PI * 2;
        const petal = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? MARRIAGE_COLORS.saffron : MARRIAGE_COLORS.gold }));
        petal.position.x = Math.cos(angle) * 0.12;
        petal.position.y = Math.sin(angle) * 0.12;
        marigoldGroup.add(petal);
      }
      marigoldGroup.position.set((Math.random() - 0.5) * 12, 6 + Math.random() * 2, (Math.random() - 0.5) * 8);
      marigoldGroup.userData = { vy: -0.03 - Math.random() * 0.02, spin: (Math.random() - 0.5) * 0.1 };
      scene.add(marigoldGroup);
      marigolds.push(marigoldGroup);
    }

    const particlesGeom = new THREE.BufferGeometry();
    const particlesArr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlesArr[i * 3] = (Math.random() - 0.5) * 15;
      particlesArr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      particlesArr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    particlesGeom.setAttribute('position', new THREE.BufferAttribute(particlesArr, 3));
    const particlesMat = new THREE.PointsMaterial({ color: MARRIAGE_COLORS.gold, size: 0.07, transparent: true, opacity: 0.7 });
    const particles = new THREE.Points(particlesGeom, particlesMat);
    scene.add(particles);

    sceneObjsRef.current = { scene, camera, renderer, khandaGroup, phulkariPatterns, dholDrums, marigolds, particles };
  };

  const animate = (elapsed) => {
    const objs = sceneObjsRef.current;
    if (!objs) return;
    const { scene, camera, renderer, khandaGroup, phulkariPatterns, dholDrums, marigolds, particles } = objs;

    let stage = elapsed < 2000 ? 0 : elapsed < 4500 ? 1 : elapsed < 6500 ? 2 : elapsed < 8500 ? 3 : elapsed >= TOTAL_MS ? 5 : 4;
    if (stage !== stageRef.current) { stageRef.current = stage; setStageUI(stage); if (stage === 5) setTimeout(() => finish(), 600); }

    if (elapsed >= 2000) {
      const t2 = Math.min((elapsed - 2000) / 2500, 1);
      khandaGroup.scale.setScalar(t2);
      khandaGroup.rotation.z = Math.sin(elapsed * 0.001) * 0.1;
    }

    if (elapsed >= 4500) {
      const t3 = Math.min((elapsed - 4500) / 2000, 1);
      phulkariPatterns.forEach((pattern, i) => {
        const delay = (i / phulkariPatterns.length) * 0.5;
        if (t3 > delay) {
          const patternT = Math.min((t3 - delay) / 0.5, 1);
          pattern.scale.setScalar(0.5 + patternT * 0.5);
          pattern.rotation.z += 0.01;
        }
      });
    }

    if (elapsed >= 6500) {
      const t4 = Math.min((elapsed - 6500) / 2000, 1);
      dholDrums.forEach((drum, i) => {
        const delay = i * 0.3;
        if (t4 > delay) {
          drum.scale.setScalar(Math.min((t4 - delay) / 0.7, 1));
          drum.rotation.y = elapsed * 0.002;
        }
      });
    }

    marigolds.forEach(marigold => {
      marigold.position.y += marigold.userData.vy;
      marigold.rotation.x += marigold.userData.spin;
      marigold.rotation.y += marigold.userData.spin * 1.5;
      if (marigold.position.y < -5) { marigold.position.y = 6; marigold.position.x = (Math.random() - 0.5) * 12; }
    });

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
    <div className="fixed inset-0 z-[100] overflow-hidden" style={{ background: MARRIAGE_COLORS.bg }}>
      <div ref={containerRef} className="absolute inset-0" />
      {!tapped && (<motion.div className="absolute inset-0 grid place-items-center cursor-pointer" onClick={handleTap} initial={{ opacity: 0 }} animate={{ opacity: 1 }}><motion.div className="text-center space-y-4" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}><div className="text-sm tracking-[0.3em] uppercase" style={{ color: MARRIAGE_COLORS.white }}>Punjabi Wedding</div><div className="text-xs opacity-70" style={{ color: MARRIAGE_COLORS.gold }}>Tap to Begin</div></motion.div></motion.div>)}
      <AnimatePresence>{stageUI === 5 && !done && (<motion.div className="absolute inset-0 grid place-items-center pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><div className="text-center space-y-6 px-8"><motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }} className="space-y-2"><div className="text-5xl md:text-6xl font-serif font-bold" style={{ color: MARRIAGE_COLORS.gold, textShadow: `0 0 40px ${MARRIAGE_COLORS.red}` }}>{brideName}</div><div className="text-3xl" style={{ color: MARRIAGE_COLORS.saffron }}>&</div><div className="text-5xl md:text-6xl font-serif font-bold" style={{ color: MARRIAGE_COLORS.gold, textShadow: `0 0 40px ${MARRIAGE_COLORS.red}` }}>{groomName}</div></motion.div><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-sm tracking-[0.3em] uppercase" style={{ color: MARRIAGE_COLORS.white }}>{subtitle}</motion.div></div></motion.div>)}</AnimatePresence>
      {tapped && (<div className="absolute top-6 right-6 z-10 flex gap-3"><button onClick={() => setAudioOn(!audioOn)} className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm grid place-items-center hover:bg-black/50" style={{ color: MARRIAGE_COLORS.white }}>{audioOn ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>{showSkip && !done && (<motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} onClick={finish} className="px-4 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center gap-2 hover:bg-black/50 text-sm" style={{ color: MARRIAGE_COLORS.white }}><span>Skip</span><SkipForward size={16} /></motion.button>)}</div>)}
    </div>
  );
};

export default PunjabiMarriageOpening;