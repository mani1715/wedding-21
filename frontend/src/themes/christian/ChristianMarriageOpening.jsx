import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { pixelRatioCap, shouldUseShadows } from '../shared/deviceCaps';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward, Volume2, VolumeX } from 'lucide-react';

const STAGE_BOUNDARIES = [0, 2000, 4500, 6500, 8500, 10500];
const TOTAL_MS = 10500;
const MARRIAGE_COLORS = { bg: '#08080F', white: '#FFFFFF', gold: '#D4AF37', ivory: '#FFFFF0', cross: '#FFD700' };

const ChristianMarriageOpening = ({ brideName = 'Grace', groomName = 'John', subtitle = 'Christian Wedding', particleCount = 250, onComplete }) => {
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
    scene.fog = new THREE.Fog(MARRIAGE_COLORS.bg, 10, 25);
    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
    camera.position.set(0, 0, 8);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap()));
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = shouldUseShadows();
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xFFFFFF, 0.4));
    const l1 = new THREE.PointLight(MARRIAGE_COLORS.ivory, 2, 20);
    l1.position.set(0, 5, 5); l1.castShadow = true; scene.add(l1);
    const l2 = new THREE.PointLight(MARRIAGE_COLORS.gold, 1.5, 18);
    l2.position.set(-4, 4, 3); scene.add(l2);
    const l3 = new THREE.PointLight(MARRIAGE_COLORS.gold, 1.5, 18);
    l3.position.set(4, 4, 3); scene.add(l3);

    const doorGroup = new THREE.Group();
    const leftDoorGeom = new THREE.BoxGeometry(2, 5, 0.2);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });
    const leftDoor = new THREE.Mesh(leftDoorGeom, doorMat);
    leftDoor.position.set(-1, 0, 0); leftDoor.castShadow = true;
    doorGroup.add(leftDoor);
    const rightDoor = leftDoor.clone();
    rightDoor.position.set(1, 0, 0);
    doorGroup.add(rightDoor);
    doorGroup.userData = { leftDoor, rightDoor };
    doorGroup.position.z = -1;
    scene.add(doorGroup);

    const crossGroup = new THREE.Group();
    const verticalGeom = new THREE.BoxGeometry(0.15, 1.5, 0.1);
    const crossMat = new THREE.MeshStandardMaterial({ color: MARRIAGE_COLORS.gold, metalness: 0.9, roughness: 0.1, emissive: MARRIAGE_COLORS.cross, emissiveIntensity: 0.4 });
    const vertical = new THREE.Mesh(verticalGeom, crossMat);
    crossGroup.add(vertical);
    const horizontal = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 0.1), crossMat.clone());
    horizontal.position.y = 0.3;
    crossGroup.add(horizontal);
    crossGroup.position.set(0, 2.5, 1);
    crossGroup.scale.set(0, 0, 0);
    scene.add(crossGroup);

    const doves = [];
    for (let i = 0; i < 6; i++) {
      const doveGroup = new THREE.Group();
      const bodyGeom = new THREE.SphereGeometry(0.12, 16, 16);
      const doveMat = new THREE.MeshStandardMaterial({ color: MARRIAGE_COLORS.white });
      const body = new THREE.Mesh(bodyGeom, doveMat);
      doveGroup.add(body);
      const wingGeom = new THREE.BoxGeometry(0.25, 0.08, 0.02);
      const leftWing = new THREE.Mesh(wingGeom, doveMat.clone());
      leftWing.position.set(-0.15, 0, 0);
      doveGroup.add(leftWing);
      const rightWing = leftWing.clone();
      rightWing.position.set(0.15, 0, 0);
      doveGroup.add(rightWing);
      doveGroup.userData = { leftWing, rightWing, angle: (i / 6) * Math.PI * 2, radius: 3 };
      doveGroup.position.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6, -5);
      doveGroup.scale.set(0, 0, 0);
      scene.add(doveGroup);
      doves.push(doveGroup);
    }

    const lightBeams = [];
    for (let i = 0; i < 5; i++) {
      const beamGeom = new THREE.CylinderGeometry(0.3, 0.5, 8, 16, 1, true);
      const beamMat = new THREE.MeshBasicMaterial({ color: MARRIAGE_COLORS.ivory, transparent: true, opacity: 0, side: THREE.DoubleSide });
      const beam = new THREE.Mesh(beamGeom, beamMat);
      beam.position.set((i - 2) * 1.2, 4, -2);
      beam.rotation.x = Math.PI;
      scene.add(beam);
      lightBeams.push(beam);
    }

    const particlesGeom = new THREE.BufferGeometry();
    const particlesArr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlesArr[i * 3] = (Math.random() - 0.5) * 15;
      particlesArr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      particlesArr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    particlesGeom.setAttribute('position', new THREE.BufferAttribute(particlesArr, 3));
    const particlesMat = new THREE.PointsMaterial({ color: MARRIAGE_COLORS.white, size: 0.05, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
    const particles = new THREE.Points(particlesGeom, particlesMat);
    scene.add(particles);

    sceneObjsRef.current = { scene, camera, renderer, doorGroup, crossGroup, doves, lightBeams, particles };
  };

  const animate = (elapsed) => {
    const objs = sceneObjsRef.current;
    if (!objs) return;
    const { scene, camera, renderer, doorGroup, crossGroup, doves, lightBeams, particles } = objs;

    let stage = 0;
    for (let i = 0; i < STAGE_BOUNDARIES.length - 1; i++) {
      if (elapsed >= STAGE_BOUNDARIES[i] && elapsed < STAGE_BOUNDARIES[i + 1]) { stage = i; break; }
    }
    if (elapsed >= TOTAL_MS) stage = 5;
    if (stage !== stageRef.current) { stageRef.current = stage; setStageUI(stage); if (stage === 5) setTimeout(() => finish(), 600); }

    if (elapsed >= STAGE_BOUNDARIES[1]) {
      const t2 = Math.min((elapsed - STAGE_BOUNDARIES[1]) / (STAGE_BOUNDARIES[2] - STAGE_BOUNDARIES[1]), 1);
      if (t2 < 0.5) {
        const openT = t2 / 0.5;
        doorGroup.userData.leftDoor.position.x = -1 - openT * 1.5;
        doorGroup.userData.rightDoor.position.x = 1 + openT * 1.5;
      }
    }

    if (elapsed >= STAGE_BOUNDARIES[2]) {
      const t3 = Math.min((elapsed - STAGE_BOUNDARIES[2]) / (STAGE_BOUNDARIES[3] - STAGE_BOUNDARIES[2]), 1);
      crossGroup.scale.setScalar(t3);
      crossGroup.rotation.y = Math.sin(elapsed * 0.001) * 0.1;
    }

    if (elapsed >= STAGE_BOUNDARIES[3]) {
      const t4 = Math.min((elapsed - STAGE_BOUNDARIES[3]) / (STAGE_BOUNDARIES[4] - STAGE_BOUNDARIES[3]), 1);
      doves.forEach((dove, i) => {
        const delay = (i / doves.length) * 0.6;
        if (t4 > delay) {
          const doveT = Math.min((t4 - delay) / 0.4, 1);
          dove.scale.setScalar(doveT);
          const angle = dove.userData.angle + elapsed * 0.001;
          dove.position.x = Math.cos(angle) * dove.userData.radius;
          dove.position.y = Math.sin(angle) * dove.userData.radius * 0.5;
          dove.position.z = -5 + doveT * 6;
          const wingFlap = Math.sin(elapsed * 0.01 + i) * 0.3;
          dove.userData.leftWing.rotation.z = wingFlap;
          dove.userData.rightWing.rotation.z = -wingFlap;
        }
      });
    }

    if (elapsed >= STAGE_BOUNDARIES[4]) {
      const t5 = Math.min((elapsed - STAGE_BOUNDARIES[4]) / (STAGE_BOUNDARIES[5] - STAGE_BOUNDARIES[4]), 1);
      lightBeams.forEach((beam, i) => {
        const delay = (i / lightBeams.length) * 0.3;
        if (t5 > delay) {
          beam.material.opacity = Math.min((t5 - delay) / 0.7, 1) * 0.3;
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
    <div className="fixed inset-0 z-[100] overflow-hidden" style={{ background: MARRIAGE_COLORS.bg }}>
      <div ref={containerRef} className="absolute inset-0" />
      {!tapped && (<motion.div className="absolute inset-0 grid place-items-center cursor-pointer" onClick={handleTap} initial={{ opacity: 0 }} animate={{ opacity: 1 }}><motion.div className="text-center space-y-4" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}><div className="text-sm tracking-[0.3em] uppercase" style={{ color: MARRIAGE_COLORS.ivory }}>Sacred Union</div><div className="text-xs opacity-70" style={{ color: MARRIAGE_COLORS.gold }}>Tap to Begin</div></motion.div></motion.div>)}
      <AnimatePresence>{stageUI === 5 && !done && (<motion.div className="absolute inset-0 grid place-items-center pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><div className="text-center space-y-6 px-8"><motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }} className="space-y-2"><div className="text-5xl md:text-6xl font-serif font-bold" style={{ color: MARRIAGE_COLORS.white, textShadow: `0 0 40px ${MARRIAGE_COLORS.gold}` }}>{brideName}</div><div className="text-3xl" style={{ color: MARRIAGE_COLORS.gold }}>&</div><div className="text-5xl md:text-6xl font-serif font-bold" style={{ color: MARRIAGE_COLORS.white, textShadow: `0 0 40px ${MARRIAGE_COLORS.gold}` }}>{groomName}</div></motion.div><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-sm tracking-[0.3em] uppercase" style={{ color: MARRIAGE_COLORS.ivory }}>{subtitle}</motion.div></div></motion.div>)}</AnimatePresence>
      {tapped && (<div className="absolute top-6 right-6 z-10 flex gap-3"><button onClick={() => setAudioOn(!audioOn)} className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm grid place-items-center hover:bg-black/50" style={{ color: MARRIAGE_COLORS.white }}>{audioOn ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>{showSkip && !done && (<motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} onClick={finish} className="px-4 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center gap-2 hover:bg-black/50 text-sm" style={{ color: MARRIAGE_COLORS.white }}><span>Skip</span><SkipForward size={16} /></motion.button>)}</div>)}
    </div>
  );
};

export default ChristianMarriageOpening;