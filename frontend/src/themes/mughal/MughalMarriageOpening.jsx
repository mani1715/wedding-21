/**
 * MughalMarriageOpening - Royal Mughal wedding ceremony
 * 
 * Animation Flow:
 * Stage 1: Royal carpet unfurls with golden patterns
 * Stage 2: Massive palace doors open revealing throne room
 * Stage 3: Chandeliers descend with crystal lights
 * Stage 4: Royal Rub el Hizb symbol forms with gold particles
 * Stage 5: Crown appears above couple names in crimson & gold
 */
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { pixelRatioCap, shouldUseShadows } from '../shared/deviceCaps';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward, Volume2, VolumeX } from 'lucide-react';
import { createMughalSoundController } from './mughal.sounds';

const STAGE_BOUNDARIES = [0, 2000, 4500, 6500, 8500, 10500];
const TOTAL_MS = STAGE_BOUNDARIES[STAGE_BOUNDARIES.length - 1];

const MARRIAGE_COLORS = {
  bg: '#0D0806',
  crimson: '#8B0000',
  gold: '#D4AF37',
  champagne: '#F5DEB3',
  ivory: '#FFFFF0'
};

const buildPalaceDoorTexture = () => {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 1024;
  const ctx = c.getContext('2d');
  
  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0, '#3D1810');
  grad.addColorStop(0.5, '#5D2815');
  grad.addColorStop(1, '#3D1810');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 1024);
  
  // Ornate Mughal arch patterns
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 3;
  
  for (let i = 0; i < 6; i++) {
    const y = 120 + i * 150;
    ctx.beginPath();
    ctx.arc(256, y, 60, 0, Math.PI, true);
    ctx.stroke();
    
    // Inner patterns
    for (let j = 0; j < 8; j++) {
      const angle = (j / 8) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(256, y);
      ctx.lineTo(256 + Math.cos(angle + Math.PI) * 50, y + Math.sin(angle + Math.PI) * 50);
      ctx.stroke();
    }
  }
  
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

const buildCarpetTexture = () => {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  
  ctx.fillStyle = '#8B0000';
  ctx.fillRect(0, 0, 512, 512);
  
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 2;
  
  // Persian carpet patterns
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const x = 32 + i * 64;
      const y = 32 + j * 64;
      
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.stroke();
      
      for (let k = 0; k < 4; k++) {
        const angle = (k / 4) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * 15, y + Math.sin(angle) * 15);
        ctx.stroke();
      }
    }
  }
  
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

const MughalMarriageOpening = ({
  brideName = 'Anaya',
  groomName = 'Rohan',
  monogram = 'A & R',
  subtitle = 'Royal Mughal Wedding',
  particleCount = 250,
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
  }, [reduce]);

  const initScene = () => {
    const container = containerRef.current;
    if (!container || sceneObjsRef.current) return;

    const w = container.clientWidth;
    const h = container.clientHeight;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(MARRIAGE_COLORS.bg);
    scene.fog = new THREE.Fog(MARRIAGE_COLORS.bg, 10, 20);
    
    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
    camera.position.set(0, 1, 8);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap()));
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = shouldUseShadows();
    container.appendChild(renderer.domElement);

    // Warm royal lighting
    scene.add(new THREE.AmbientLight(0xFFE6D5, 0.3));
    
    const l1 = new THREE.PointLight(MARRIAGE_COLORS.gold, 1.8, 18);
    l1.position.set(-4, 5, 3);
    l1.castShadow = true;
    scene.add(l1);
    
    const l2 = new THREE.PointLight(MARRIAGE_COLORS.gold, 1.8, 18);
    l2.position.set(4, 5, 3);
    l2.castShadow = true;
    scene.add(l2);

    // Stage 1: Royal carpet
    const carpetTex = buildCarpetTexture();
    const carpetGeom = new THREE.PlaneGeometry(6, 12);
    const carpetMat = new THREE.MeshStandardMaterial({
      map: carpetTex,
      roughness: 0.8,
      metalness: 0.1
    });
    const carpet = new THREE.Mesh(carpetGeom, carpetMat);
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.y = -2;
    carpet.position.z = 2;
    carpet.scale.y = 0;
    carpet.receiveShadow = true;
    scene.add(carpet);

    // Stage 2: Palace doors
    const doorTex = buildPalaceDoorTexture();
    const doorMat = new THREE.MeshStandardMaterial({
      map: doorTex,
      roughness: 0.7,
      metalness: 0.2
    });
    
    const leftHinge = new THREE.Group();
    leftHinge.position.set(-2.5, 0, -1);
    const leftDoor = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 6), doorMat);
    leftDoor.position.x = 1.25;
    leftDoor.castShadow = true;
    leftHinge.add(leftDoor);
    leftHinge.scale.set(0, 0, 0);
    scene.add(leftHinge);
    
    const rightHinge = new THREE.Group();
    rightHinge.position.set(2.5, 0, -1);
    const rightDoor = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 6), doorMat.clone());
    rightDoor.position.x = -1.25;
    rightDoor.castShadow = true;
    rightHinge.add(rightDoor);
    rightHinge.scale.set(0, 0, 0);
    scene.add(rightHinge);
    
    // Door light
    const doorLight = new THREE.PointLight(MARRIAGE_COLORS.champagne, 0, 15);
    doorLight.position.set(0, 0, -3);
    scene.add(doorLight);

    // Stage 3: Chandeliers
    const chandeliers = [];
    for (let i = 0; i < 3; i++) {
      const chandGroup = new THREE.Group();
      
      const centerGeom = new THREE.SphereGeometry(0.3, 16, 16);
      const centerMat = new THREE.MeshStandardMaterial({
        color: MARRIAGE_COLORS.gold,
        metalness: 0.9,
        roughness: 0.1,
        emissive: MARRIAGE_COLORS.gold,
        emissiveIntensity: 0.5
      });
      const center = new THREE.Mesh(centerGeom, centerMat);
      chandGroup.add(center);
      
      for (let j = 0; j < 8; j++) {
        const angle = (j / 8) * Math.PI * 2;
        const crystalGeom = new THREE.ConeGeometry(0.06, 0.3, 6);
        const crystalMat = new THREE.MeshPhysicalMaterial({
          color: 0xFFFFFF,
          metalness: 0.1,
          roughness: 0.1,
          transparent: true,
          opacity: 0.9,
          transmission: 0.9
        });
        const crystal = new THREE.Mesh(crystalGeom, crystalMat);
        crystal.position.set(
          Math.cos(angle) * 0.6,
          -0.4,
          Math.sin(angle) * 0.6
        );
        chandGroup.add(crystal);
      }
      
      chandGroup.position.set(
        (i - 1) * 2.5,
        8,
        0
      );
      chandGroup.scale.set(0, 0, 0);
      scene.add(chandGroup);
      chandeliers.push(chandGroup);
    }

    // Stage 4: Rub el Hizb symbol
    const symbolParts = [];
    const symbolGroup = new THREE.Group();
    
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const petalGeom = new THREE.BoxGeometry(0.4, 1.2, 0.05);
      const petalMat = new THREE.MeshStandardMaterial({
        color: MARRIAGE_COLORS.gold,
        metalness: 0.8,
        roughness: 0.2,
        emissive: MARRIAGE_COLORS.gold,
        emissiveIntensity: 0.3
      });
      const petal = new THREE.Mesh(petalGeom, petalMat);
      petal.position.set(
        Math.cos(angle) * 0.8,
        Math.sin(angle) * 0.8,
        0
      );
      petal.rotation.z = angle;
      symbolGroup.add(petal);
      symbolParts.push(petal);
    }
    
    const circleGeom = new THREE.TorusGeometry(0.5, 0.08, 16, 100);
    const circleMat = new THREE.MeshStandardMaterial({
      color: MARRIAGE_COLORS.crimson,
      metalness: 0.7,
      roughness: 0.3
    });
    const circle = new THREE.Mesh(circleGeom, circleMat);
    symbolGroup.add(circle);
    
    symbolGroup.position.z = 2;
    symbolGroup.scale.set(0, 0, 0);
    scene.add(symbolGroup);

    // Stage 5: Crown
    const crownGroup = new THREE.Group();
    
    const baseGeom = new THREE.CylinderGeometry(0.5, 0.6, 0.3, 32);
    const crownMat = new THREE.MeshStandardMaterial({
      color: MARRIAGE_COLORS.gold,
      metalness: 0.95,
      roughness: 0.05,
      emissive: MARRIAGE_COLORS.gold,
      emissiveIntensity: 0.4
    });
    const base = new THREE.Mesh(baseGeom, crownMat);
    crownGroup.add(base);
    
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const spikeGeom = new THREE.ConeGeometry(0.08, 0.5, 6);
      const spike = new THREE.Mesh(spikeGeom, crownMat.clone());
      spike.position.set(
        Math.cos(angle) * 0.55,
        0.4,
        Math.sin(angle) * 0.55
      );
      crownGroup.add(spike);
      
      const gemGeom = new THREE.SphereGeometry(0.06, 16, 16);
      const gemMat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0xFF0000 : 0x00FF00,
        metalness: 0.5,
        roughness: 0.1,
        emissive: i % 2 === 0 ? 0xFF0000 : 0x00FF00,
        emissiveIntensity: 0.6
      });
      const gem = new THREE.Mesh(gemGeom, gemMat);
      gem.position.set(
        Math.cos(angle) * 0.55,
        0.15,
        Math.sin(angle) * 0.55
      );
      crownGroup.add(gem);
    }
    
    crownGroup.position.set(0, 4, 2);
    crownGroup.scale.set(0, 0, 0);
    scene.add(crownGroup);

    // Gold particles
    const goldGeom = new THREE.BufferGeometry();
    const goldArr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      goldArr[i * 3] = (Math.random() - 0.5) * 15;
      goldArr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      goldArr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    goldGeom.setAttribute('position', new THREE.BufferAttribute(goldArr, 3));
    const goldMat = new THREE.PointsMaterial({
      color: MARRIAGE_COLORS.gold,
      size: 0.08,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    const goldParticles = new THREE.Points(goldGeom, goldMat);
    scene.add(goldParticles);

    sceneObjsRef.current = {
      scene, camera, renderer, carpet, leftHinge, rightHinge, doorLight,
      chandeliers, symbolGroup, crownGroup, goldParticles
    };
  };

  const animate = (elapsed) => {
    const objs = sceneObjsRef.current;
    if (!objs) return;

    const { scene, camera, renderer, carpet, leftHinge, rightHinge, doorLight,
            chandeliers, symbolGroup, crownGroup, goldParticles } = objs;

    let stage = 0;
    for (let i = 0; i < STAGE_BOUNDARIES.length - 1; i++) {
      if (elapsed >= STAGE_BOUNDARIES[i] && elapsed < STAGE_BOUNDARIES[i + 1]) {
        stage = i;
        break;
      }
    }
    if (elapsed >= STAGE_BOUNDARIES[STAGE_BOUNDARIES.length - 1]) stage = 5;

    if (stage !== stageRef.current) {
      stageRef.current = stage;
      setStageUI(stage);
      if (stage === 5) setTimeout(() => finish(), 600);
    }

    // Stage 1: Carpet unfurls
    if (elapsed >= 0) {
      const t1 = Math.min(elapsed / STAGE_BOUNDARIES[1], 1);
      carpet.scale.y = t1;
    }

    // Stage 2: Doors open
    if (elapsed >= STAGE_BOUNDARIES[1]) {
      const t2 = Math.min((elapsed - STAGE_BOUNDARIES[1]) / (STAGE_BOUNDARIES[2] - STAGE_BOUNDARIES[1]), 1);
      
      if (t2 < 0.3) {
        const scaleT = t2 / 0.3;
        leftHinge.scale.setScalar(scaleT);
        rightHinge.scale.setScalar(scaleT);
      } else {
        const openT = (t2 - 0.3) / 0.7;
        const angle = openT * Math.PI * 0.7;
        leftHinge.rotation.y = -angle;
        rightHinge.rotation.y = angle;
        doorLight.intensity = openT * 3;
      }
    }

    // Stage 3: Chandeliers descend
    if (elapsed >= STAGE_BOUNDARIES[2]) {
      const t3 = Math.min((elapsed - STAGE_BOUNDARIES[2]) / (STAGE_BOUNDARIES[3] - STAGE_BOUNDARIES[2]), 1);
      
      chandeliers.forEach((chand, i) => {
        const delay = i * 0.2;
        if (t3 > delay) {
          const chandT = Math.min((t3 - delay) / 0.8, 1);
          chand.scale.setScalar(chandT);
          chand.position.y = 8 - chandT * 5;
          chand.rotation.y = chandT * Math.PI * 2;
        }
      });
    }

    // Stage 4: Symbol forms
    if (elapsed >= STAGE_BOUNDARIES[3]) {
      const t4 = Math.min((elapsed - STAGE_BOUNDARIES[3]) / (STAGE_BOUNDARIES[4] - STAGE_BOUNDARIES[3]), 1);
      symbolGroup.scale.setScalar(t4);
      symbolGroup.rotation.z = t4 * Math.PI * 2;
    }

    // Stage 5: Crown appears
    if (elapsed >= STAGE_BOUNDARIES[4]) {
      const t5 = Math.min((elapsed - STAGE_BOUNDARIES[4]) / (STAGE_BOUNDARIES[5] - STAGE_BOUNDARIES[4]), 1);
      crownGroup.scale.setScalar(t5);
      crownGroup.rotation.y = elapsed * 0.001;
    }

    // Gold particles drift
    goldParticles.rotation.y += 0.001;
    const goldPos = goldParticles.geometry.attributes.position.array;
    for (let i = 0; i < goldPos.length; i += 3) {
      goldPos[i + 1] += Math.sin(elapsed * 0.001 + i) * 0.01;
    }
    goldParticles.geometry.attributes.position.needsUpdate = true;

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
    if (!objs) return;
    objs.renderer.dispose();
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
    initScene();
    
    soundRef.current = createMughalSoundController();
    if (audioOn) soundRef.current?.play();
    
    const startTime = Date.now();
    const loop = () => {
      if (!sceneObjsRef.current) return;
      const elapsed = Date.now() - startTime;
      if (elapsed < TOTAL_MS) {
        animate(elapsed);
        requestAnimationFrame(loop);
      } else {
        animate(TOTAL_MS);
        finish();
      }
    };
    requestAnimationFrame(loop);
    setTimeout(() => setShowSkip(true), 1500);
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
    <div className="fixed inset-0 z-[100] overflow-hidden" style={{ background: MARRIAGE_COLORS.bg }}>
      <div ref={containerRef} className="absolute inset-0" />
      
      {!tapped && (
        <motion.div className="absolute inset-0 grid place-items-center cursor-pointer" onClick={handleTap}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div className="text-center space-y-4" animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}>
            <div className="text-sm tracking-[0.3em] uppercase" style={{ color: MARRIAGE_COLORS.champagne }}>
              Royal Mughal Wedding
            </div>
            <div className="text-xs opacity-70" style={{ color: MARRIAGE_COLORS.gold }}>
              Tap to Begin
            </div>
          </motion.div>
        </motion.div>
      )}

      <AnimatePresence>
        {stageUI === 5 && !done && (
          <motion.div className="absolute inset-0 grid place-items-center pointer-events-none"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="text-center space-y-6 px-8">
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }} className="space-y-2">
                <div className="text-5xl md:text-6xl font-serif font-bold tracking-wide"
                  style={{ color: MARRIAGE_COLORS.gold, textShadow: `0 0 40px ${MARRIAGE_COLORS.crimson}, 0 2px 4px rgba(0,0,0,0.8)` }}>
                  {brideName}
                </div>
                <div className="text-3xl md:text-4xl" style={{ color: MARRIAGE_COLORS.champagne }}>
                  &
                </div>
                <div className="text-5xl md:text-6xl font-serif font-bold tracking-wide"
                  style={{ color: MARRIAGE_COLORS.gold, textShadow: `0 0 40px ${MARRIAGE_COLORS.crimson}, 0 2px 4px rgba(0,0,0,0.8)` }}>
                  {groomName}
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                className="text-sm tracking-[0.3em] uppercase" style={{ color: MARRIAGE_COLORS.gold }}>
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
            style={{ color: MARRIAGE_COLORS.champagne }}>
            {audioOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          {showSkip && !done && (
            <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              onClick={handleSkip}
              className="px-4 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center gap-2 hover:bg-black/50 text-sm"
              style={{ color: MARRIAGE_COLORS.champagne }}>
              <span>Skip</span>
              <SkipForward size={16} />
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
};

export default MughalMarriageOpening;