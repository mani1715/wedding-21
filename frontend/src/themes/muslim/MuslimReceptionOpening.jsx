import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { pixelRatioCap, shouldUseShadows } from '../shared/deviceCaps';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward, Volume2, VolumeX } from 'lucide-react';

const STAGE_BOUNDARIES = [0, 1800, 4000, 6200, 8000, 10000];
const TOTAL_MS = 10000;

const RECEPTION_COLORS = { bg: '#0A0F14', gold: '#FFD700', green: '#228B22', turquoise: '#40E0D0', white: '#FFFAFA' };

const MuslimReceptionOpening = ({ brideName = 'Aisha', groomName = 'Omar', subtitle = 'Grand Reception', particleCount = 300, onComplete }) => {
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
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap()));
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xE8F5E9, 0.3));
    const lights = [];
    for (let i = 0; i < 5; i++) {
      const light = new THREE.PointLight([0xFFD700, 0x228B22, 0x40E0D0, 0xFFFFFF, 0x90EE90][i], 1.5, 15);
      const angle = (i / 5) * Math.PI * 2;
      light.position.set(Math.cos(angle) * 5, 3, Math.sin(angle) * 5);
      scene.add(light);
      lights.push(light);
    }

    const lanterns = [];
    for (let i = 0; i < 12; i++) {
      const lanternGroup = new THREE.Group();
      const bodyGeom = new THREE.CylinderGeometry(0.2, 0.2, 0.4, 8);
      const bodyMat = new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? RECEPTION_COLORS.green : RECEPTION_COLORS.gold, emissive: i % 2 === 0 ? RECEPTION_COLORS.green : RECEPTION_COLORS.gold, emissiveIntensity: 0.5, transparent: true, opacity: 0.9 });
      const body = new THREE.Mesh(bodyGeom, bodyMat);
      lanternGroup.add(body);
      const topGeom = new THREE.ConeGeometry(0.25, 0.15, 8);
      const top = new THREE.Mesh(topGeom, new THREE.MeshStandardMaterial({ color: RECEPTION_COLORS.gold, metalness: 0.8 }));
      top.position.y = 0.275;
      lanternGroup.add(top);
      lanternGroup.position.set((Math.random() - 0.5) * 8, -5, (Math.random() - 0.5) * 4);
      lanternGroup.scale.set(0, 0, 0);
      scene.add(lanternGroup);
      lanterns.push(lanternGroup);
    }

    const fountainParticles = [];
    for (let i = 0; i < 60; i++) {
      const geom = new THREE.SphereGeometry(0.08, 8, 8);
      const mat = new THREE.MeshStandardMaterial({ color: RECEPTION_COLORS.turquoise, emissive: RECEPTION_COLORS.turquoise, emissiveIntensity: 0.7 });
      const particle = new THREE.Mesh(geom, mat);
      particle.position.set(0, -3, 0);
      particle.userData = { vx: (Math.random() - 0.5) * 0.08, vy: 0.12 + Math.random() * 0.08, vz: (Math.random() - 0.5) * 0.08 };
      scene.add(particle);
      fountainParticles.push(particle);
    }

    const fireworkSystems = [];
    const positions = [{ x: -3, y: 2, z: -2 }, { x: 3, y: 2.5, z: -2 }, { x: 0, y: 3, z: -3 }];
    positions.forEach((pos, idx) => {
      const fwGeom = new THREE.BufferGeometry();
      const count = 50;
      const posArr = new Float32Array(count * 3);
      const velocities = [];
      for (let i = 0; i < count; i++) {
        posArr[i * 3] = pos.x; posArr[i * 3 + 1] = pos.y; posArr[i * 3 + 2] = pos.z;
        const angle = (i / count) * Math.PI * 2;
        const speed = 0.04 + Math.random() * 0.02;
        velocities.push({ x: Math.cos(angle) * speed, y: Math.sin(angle) * speed * 0.5, z: Math.sin(angle * 2) * speed });
      }
      fwGeom.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
      const fwMat = new THREE.PointsMaterial({ color: [0xFFD700, 0x228B22, 0x40E0D0][idx], size: 0.12, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
      const fw = new THREE.Points(fwGeom, fwMat);
      scene.add(fw);
      fireworkSystems.push({ fw, velocities, life: 0 });
    });

    const particlesGeom = new THREE.BufferGeometry();
    const particlesArr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlesArr[i * 3] = (Math.random() - 0.5) * 15;
      particlesArr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      particlesArr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    particlesGeom.setAttribute('position', new THREE.BufferAttribute(particlesArr, 3));
    const particlesMat = new THREE.PointsMaterial({ color: RECEPTION_COLORS.gold, size: 0.06, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
    const particles = new THREE.Points(particlesGeom, particlesMat);
    scene.add(particles);

    sceneObjsRef.current = { scene, camera, renderer, lanterns, fountainParticles, fireworkSystems, particles, lights };
  };

  const animate = (elapsed) => {
    const objs = sceneObjsRef.current;
    if (!objs) return;
    const { scene, camera, renderer, lanterns, fountainParticles, fireworkSystems, particles, lights } = objs;

    let stage = 0;
    for (let i = 0; i < STAGE_BOUNDARIES.length - 1; i++) {
      if (elapsed >= STAGE_BOUNDARIES[i] && elapsed < STAGE_BOUNDARIES[i + 1]) { stage = i; break; }
    }
    if (elapsed >= TOTAL_MS) stage = 5;
    if (stage !== stageRef.current) { stageRef.current = stage; setStageUI(stage); if (stage === 5) setTimeout(() => finish(), 600); }

    lights.forEach((light, i) => {
      const angle = elapsed * 0.0005 + (i / lights.length) * Math.PI * 2;
      light.position.x = Math.cos(angle) * 5;
      light.position.z = Math.sin(angle) * 5;
    });

    if (elapsed >= 0) {
      const t1 = elapsed / STAGE_BOUNDARIES[1];
      fountainParticles.forEach(particle => {
        particle.position.x += particle.userData.vx;
        particle.position.y += particle.userData.vy;
        particle.position.z += particle.userData.vz;
        particle.userData.vy -= 0.002;
        if (particle.position.y < -3) { particle.position.set(0, -3, 0); particle.userData.vy = 0.12 + Math.random() * 0.08; }
      });
    }

    if (elapsed >= STAGE_BOUNDARIES[1]) {
      const t2 = Math.min((elapsed - STAGE_BOUNDARIES[1]) / (STAGE_BOUNDARIES[2] - STAGE_BOUNDARIES[1]), 1);
      lanterns.forEach((lantern, i) => {
        const delay = (i / lanterns.length) * 0.6;
        if (t2 > delay) {
          const lanternT = Math.min((t2 - delay) / 0.4, 1);
          lantern.scale.setScalar(lanternT);
          lantern.position.y = -5 + lanternT * 7;
          lantern.rotation.y = elapsed * 0.001 + i;
        }
      });
    }

    if (elapsed >= STAGE_BOUNDARIES[2]) {
      const t3 = (elapsed - STAGE_BOUNDARIES[2]) / (STAGE_BOUNDARIES[3] - STAGE_BOUNDARIES[2]);
      fireworkSystems.forEach((system, i) => {
        const delay = (i / fireworkSystems.length) * 0.5;
        if (t3 > delay && system.life < 1) {
          system.life = Math.min((t3 - delay) / 0.5, 1);
          system.fw.material.opacity = system.life * (1 - system.life * 0.7);
          const positions = system.fw.geometry.attributes.position.array;
          for (let j = 0; j < system.velocities.length; j++) {
            positions[j * 3] += system.velocities[j].x;
            positions[j * 3 + 1] += system.velocities[j].y;
            positions[j * 3 + 2] += system.velocities[j].z;
            system.velocities[j].y -= 0.001;
          }
          system.fw.geometry.attributes.position.needsUpdate = true;
        }
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
      {!tapped && (<motion.div className="absolute inset-0 grid place-items-center cursor-pointer" onClick={handleTap} initial={{ opacity: 0 }} animate={{ opacity: 1 }}><motion.div className="text-center space-y-4" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}><div className="text-sm tracking-[0.3em] uppercase" style={{ color: RECEPTION_COLORS.gold }}>Grand Celebration</div><div className="text-xs opacity-70" style={{ color: RECEPTION_COLORS.turquoise }}>Tap to Begin</div></motion.div></motion.div>)}
      <AnimatePresence>{stageUI === 5 && !done && (<motion.div className="absolute inset-0 grid place-items-center pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><div className="text-center space-y-6 px-8"><motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }} className="space-y-2"><div className="text-5xl md:text-6xl font-serif font-bold" style={{ color: RECEPTION_COLORS.gold, textShadow: `0 0 40px ${RECEPTION_COLORS.green}` }}>{brideName}</div><div className="text-3xl" style={{ color: RECEPTION_COLORS.turquoise }}>&</div><div className="text-5xl md:text-6xl font-serif font-bold" style={{ color: RECEPTION_COLORS.gold, textShadow: `0 0 40px ${RECEPTION_COLORS.green}` }}>{groomName}</div></motion.div><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-sm tracking-[0.3em] uppercase" style={{ color: RECEPTION_COLORS.white }}>{subtitle}</motion.div></div></motion.div>)}</AnimatePresence>
      {tapped && (<div className="absolute top-6 right-6 z-10 flex gap-3"><button onClick={() => setAudioOn(!audioOn)} className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm grid place-items-center hover:bg-black/50" style={{ color: RECEPTION_COLORS.white }}>{audioOn ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>{showSkip && !done && (<motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} onClick={finish} className="px-4 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center gap-2 hover:bg-black/50 text-sm" style={{ color: RECEPTION_COLORS.white }}><span>Skip</span><SkipForward size={16} /></motion.button>)}</div>)}
    </div>
  );
};

export default MuslimReceptionOpening;