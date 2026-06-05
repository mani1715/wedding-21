/**
 * TempleMarriageOpening - Grand temple wedding ceremony opening
 * 
 * Animation Flow:
 * Stage 1: Temple bells ringing with sound waves
 * Stage 2: Massive gopuram (temple tower) rises from ground with intricate details
 * Stage 3: Temple doors open revealing divine golden light
 * Stage 4: Oil lamps (diyas) light up in a circle formation
 * Stage 5: Sacred fire appears with couple names in traditional frame
 */
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { pixelRatioCap, shouldUseShadows } from '../shared/deviceCaps';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward, Volume2, VolumeX } from 'lucide-react';
import { createTempleSoundController } from './temple.sounds';

const STAGE_BOUNDARIES = [0, 1800, 4500, 6500, 8500, 10500];
const TOTAL_MS = STAGE_BOUNDARIES[STAGE_BOUNDARIES.length - 1];

// Marriage-specific colors: Deep maroon, gold, saffron
const MARRIAGE_COLORS = {
  bg: '#2D0A08',
  primary: '#D4AF37',
  accent: '#8B0000',
  light: '#FFD700',
  divine: '#FFA500'
};

const buildGopuramTexture = () => {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 1024;
  const ctx = c.getContext('2d');
  
  // Base stone texture
  const grad = ctx.createLinearGradient(0, 0, 0, 1024);
  grad.addColorStop(0, '#8B7355');
  grad.addColorStop(0.5, '#6B5344');
  grad.addColorStop(1, '#4A3828');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 1024);
  
  // Stone texture details
  for (let i = 0; i < 800; i++) {
    ctx.fillStyle = `rgba(${100 + Math.random() * 50}, ${70 + Math.random() * 30}, ${40 + Math.random() * 20}, ${Math.random() * 0.3})`;
    ctx.fillRect(Math.random() * 512, Math.random() * 1024, Math.random() * 3, Math.random() * 3);
  }
  
  // Carved deity patterns
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 2;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 4; col++) {
      const x = 60 + col * 120;
      const y = 80 + row * 120;
      // Simple deity outline
      ctx.beginPath();
      ctx.arc(x, y, 25, 0, Math.PI * 2);
      ctx.stroke();
      // Crown
      ctx.beginPath();
      ctx.moveTo(x - 20, y - 25);
      ctx.lineTo(x, y - 45);
      ctx.lineTo(x + 20, y - 25);
      ctx.stroke();
    }
  }
  
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

const buildDoorTexture = () => {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 1024;
  const ctx = c.getContext('2d');
  
  // Teak wood base
  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0, '#3D2817');
  grad.addColorStop(0.5, '#5D3A1A');
  grad.addColorStop(1, '#3D2817');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 1024);
  
  // Wood grain
  for (let i = 0; i < 700; i++) {
    ctx.strokeStyle = `rgba(${30 + Math.random() * 20}, ${15 + Math.random() * 10}, 5, ${Math.random() * 0.4})`;
    ctx.lineWidth = 0.5 + Math.random();
    const x = Math.random() * 512;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (Math.random() - 0.5) * 40, 1024);
    ctx.stroke();
  }
  
  // Gold decorative patterns
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 3;
  
  // Border
  ctx.strokeRect(20, 20, 472, 984);
  
  // Decorative medallions
  for (let i = 0; i < 5; i++) {
    const y = 150 + i * 180;
    ctx.beginPath();
    ctx.arc(256, y, 40, 0, Math.PI * 2);
    ctx.stroke();
    // Inner star
    for (let j = 0; j < 8; j++) {
      const angle = (j * Math.PI) / 4;
      const x1 = 256 + Math.cos(angle) * 20;
      const y1 = y + Math.sin(angle) * 20;
      const x2 = 256 + Math.cos(angle) * 35;
      const y2 = y + Math.sin(angle) * 35;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }
  
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

const TempleMarriageOpening = ({
  brideName = 'Lakshmi',
  groomName = 'Karthik',
  monogram = 'L & K',
  subtitle = 'Temple Marriage',
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
    // eslint-disable-next-line
  }, [reduce]);

  const initScene = () => {
    const container = containerRef.current;
    if (!container || sceneObjsRef.current) return;

    const w = container.clientWidth;
    const h = container.clientHeight;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(MARRIAGE_COLORS.bg);
    
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    camera.position.set(0, 0, 8);
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: false, 
      powerPreference: 'high-performance' 
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap()));
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = shouldUseShadows();
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Enhanced lighting for marriage ceremony
    scene.add(new THREE.AmbientLight(0xFFE6CC, 0.3));
    
    // Main temple lights (warm golden)
    const l1 = new THREE.PointLight(MARRIAGE_COLORS.light, 1.5, 20);
    l1.position.set(-4, 4, 3);
    l1.castShadow = true;
    scene.add(l1);
    
    const l2 = new THREE.PointLight(MARRIAGE_COLORS.light, 1.5, 20);
    l2.position.set(4, 4, 3);
    l2.castShadow = true;
    scene.add(l2);
    
    // Divine light (from doors)
    const divineLight = new THREE.PointLight(MARRIAGE_COLORS.divine, 0, 25);
    divineLight.position.set(0, 0, -2);
    scene.add(divineLight);
    
    // Sacred fire light (will intensify later)
    const fireLight = new THREE.PointLight(0xFF6B00, 0, 15);
    fireLight.position.set(0, -1.5, 2);
    scene.add(fireLight);

    // Stage 1: Bell and sound wave particles
    const bellGeom = new THREE.SphereGeometry(0.3, 32, 32);
    const bellMat = new THREE.MeshStandardMaterial({
      color: MARRIAGE_COLORS.primary,
      metalness: 0.9,
      roughness: 0.2,
      emissive: MARRIAGE_COLORS.primary,
      emissiveIntensity: 0.3
    });
    const bell = new THREE.Mesh(bellGeom, bellMat);
    bell.position.set(0, 3, 0);
    bell.castShadow = true;
    bell.scale.set(0, 0, 0);
    scene.add(bell);
    
    // Bell clapper
    const clapperGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 16);
    const clapperMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const clapper = new THREE.Mesh(clapperGeom, clapperMat);
    clapper.position.y = -0.2;
    bell.add(clapper);
    
    // Sound wave rings
    const waveRings = [];
    for (let i = 0; i < 5; i++) {
      const ringGeom = new THREE.TorusGeometry(0.5 + i * 0.3, 0.02, 16, 100);
      const ringMat = new THREE.MeshBasicMaterial({
        color: MARRIAGE_COLORS.light,
        transparent: true,
        opacity: 0
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.position.copy(bell.position);
      ring.rotation.x = Math.PI / 2;
      scene.add(ring);
      waveRings.push(ring);
    }

    // Stage 2: Gopuram (temple tower)
    const gopuramTex = buildGopuramTexture();
    const gopuramGroup = new THREE.Group();
    
    // Main tower structure
    const towerGeom = new THREE.BoxGeometry(3, 6, 1);
    const towerMat = new THREE.MeshStandardMaterial({
      map: gopuramTex,
      roughness: 0.8,
      metalness: 0.1
    });
    const tower = new THREE.Mesh(towerGeom, towerMat);
    tower.castShadow = true;
    tower.receiveShadow = true;
    gopuramGroup.add(tower);
    
    // Gold kalasam (pinnacle)
    const kalGeom = new THREE.ConeGeometry(0.4, 1.2, 32);
    const kalMat = new THREE.MeshStandardMaterial({
      color: MARRIAGE_COLORS.primary,
      metalness: 0.9,
      roughness: 0.1,
      emissive: MARRIAGE_COLORS.primary,
      emissiveIntensity: 0.2
    });
    const kalasam = new THREE.Mesh(kalGeom, kalMat);
    kalasam.position.y = 3.6;
    kalasam.castShadow = true;
    gopuramGroup.add(kalasam);
    
    // Decorative flags on sides
    for (let side of [-1.5, 1.5]) {
      const flagPoleGeom = new THREE.CylinderGeometry(0.03, 0.03, 1.5, 8);
      const flagPoleMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
      const flagPole = new THREE.Mesh(flagPoleGeom, flagPoleMat);
      flagPole.position.set(side, 3.75, 0.5);
      gopuramGroup.add(flagPole);
      
      const flagGeom = new THREE.PlaneGeometry(0.4, 0.6);
      const flagMat = new THREE.MeshStandardMaterial({
        color: side < 0 ? 0xFF6B00 : 0x8B0000,
        side: THREE.DoubleSide
      });
      const flag = new THREE.Mesh(flagGeom, flagMat);
      flag.position.set(side + (side > 0 ? -0.2 : 0.2), 4.2, 0.5);
      gopuramGroup.add(flag);
    }
    
    gopuramGroup.position.y = -10;
    scene.add(gopuramGroup);

    // Stage 3: Temple doors
    const doorTex = buildDoorTexture();
    const doorMat = new THREE.MeshStandardMaterial({
      map: doorTex,
      roughness: 0.7,
      metalness: 0.2,
      side: THREE.DoubleSide
    });
    
    // Left door with hinge
    const leftHinge = new THREE.Group();
    leftHinge.position.set(-2, 0, 0);
    const leftDoor = new THREE.Mesh(new THREE.PlaneGeometry(2, 5), doorMat);
    leftDoor.position.x = 1;
    leftDoor.castShadow = true;
    leftDoor.receiveShadow = true;
    leftHinge.add(leftDoor);
    leftHinge.scale.set(0, 0, 0);
    scene.add(leftHinge);
    
    // Right door with hinge
    const rightHinge = new THREE.Group();
    rightHinge.position.set(2, 0, 0);
    const rightDoor = new THREE.Mesh(new THREE.PlaneGeometry(2, 5), doorMat);
    rightDoor.position.x = -1;
    rightDoor.castShadow = true;
    rightDoor.receiveShadow = true;
    rightHinge.add(rightDoor);
    rightHinge.scale.set(0, 0, 0);
    scene.add(rightHinge);

    // Stage 4: Oil lamps (diyas) in circle
    const diyas = [];
    const diyaCount = 12;
    for (let i = 0; i < diyaCount; i++) {
      const angle = (i / diyaCount) * Math.PI * 2;
      const radius = 3;
      
      const diyaGroup = new THREE.Group();
      
      // Diya base
      const baseGeom = new THREE.CylinderGeometry(0.12, 0.08, 0.08, 16);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0xCD7F32,
        metalness: 0.6,
        roughness: 0.4
      });
      const base = new THREE.Mesh(baseGeom, baseMat);
      diyaGroup.add(base);
      
      // Flame
      const flameGeom = new THREE.ConeGeometry(0.06, 0.25, 8);
      const flameMat = new THREE.MeshBasicMaterial({
        color: 0xFF6B00,
        transparent: true,
        opacity: 0
      });
      const flame = new THREE.Mesh(flameGeom, flameMat);
      flame.position.y = 0.16;
      diyaGroup.add(flame);
      
      // Flame light
      const flameLight = new THREE.PointLight(0xFF6B00, 0, 1);
      flameLight.position.y = 0.2;
      diyaGroup.add(flameLight);
      
      diyaGroup.position.set(
        Math.cos(angle) * radius,
        -2,
        Math.sin(angle) * radius + 1
      );
      diyaGroup.scale.set(0, 0, 0);
      scene.add(diyaGroup);
      diyas.push({ group: diyaGroup, flame, light: flameLight });
    }

    // Stage 5: Sacred fire (central)
    const fireParticles = [];
    const fireGeom = new THREE.BufferGeometry();
    const fireCount = 60;
    const fireArr = new Float32Array(fireCount * 3);
    for (let i = 0; i < fireCount; i++) {
      fireArr[i * 3] = (Math.random() - 0.5) * 0.6;
      fireArr[i * 3 + 1] = Math.random() * 1.5;
      fireArr[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
    }
    fireGeom.setAttribute('position', new THREE.BufferAttribute(fireArr, 3));
    const fireMat = new THREE.PointsMaterial({
      color: 0xFF4500,
      size: 0.15,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });
    const fire = new THREE.Points(fireGeom, fireMat);
    fire.position.set(0, -1, 2);
    scene.add(fire);

    // Floating flower particles
    const flowerGeom = new THREE.BufferGeometry();
    const flowerArr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      flowerArr[i * 3] = (Math.random() - 0.5) * 15;
      flowerArr[i * 3 + 1] = -3 + Math.random() * 10;
      flowerArr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    flowerGeom.setAttribute('position', new THREE.BufferAttribute(flowerArr, 3));
    const flowerMat = new THREE.PointsMaterial({
      color: MARRIAGE_COLORS.divine,
      size: 0.08,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true
    });
    const flowers = new THREE.Points(flowerGeom, flowerMat);
    scene.add(flowers);

    // Store references
    sceneObjsRef.current = {
      scene, camera, renderer, bell, waveRings, gopuramGroup, 
      leftHinge, rightHinge, divineLight, fireLight, diyas, fire, 
      flowers, l1, l2
    };
  };

  const animate = (elapsed) => {
    const objs = sceneObjsRef.current;
    if (!objs) return;

    const { 
      scene, camera, renderer, bell, waveRings, gopuramGroup,
      leftHinge, rightHinge, divineLight, fireLight, diyas, fire,
      flowers
    } = objs;

    // Determine stage
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
      if (stage === 5) setTimeout(() => finish(), 800);
    }

    // Stage 1: Bell appears and rings (0-1.8s)
    if (elapsed >= 0 && elapsed < STAGE_BOUNDARIES[2]) {
      const t1 = Math.min(elapsed / 1800, 1);
      bell.scale.setScalar(t1);
      
      // Bell swing
      if (t1 > 0.3) {
        bell.rotation.z = Math.sin(elapsed * 0.01) * 0.3;
      }
      
      // Sound wave rings
      waveRings.forEach((ring, i) => {
        const delay = i * 200;
        if (elapsed > delay) {
          const rt = Math.min((elapsed - delay) / 1000, 1);
          ring.scale.setScalar(1 + rt * 3);
          ring.material.opacity = (1 - rt) * 0.6;
        }
      });
    }

    // Stage 2: Gopuram rises (1.8-4.5s)
    if (elapsed >= STAGE_BOUNDARIES[1]) {
      const t2 = Math.min((elapsed - STAGE_BOUNDARIES[1]) / (STAGE_BOUNDARIES[2] - STAGE_BOUNDARIES[1]), 1);
      const eased = 1 - Math.pow(1 - t2, 3); // ease out cubic
      gopuramGroup.position.y = -10 + eased * 10;
      
      // Gopuram slightly scales up for emphasis
      gopuramGroup.scale.setScalar(0.8 + eased * 0.2);
    }

    // Stage 3: Doors appear and open (4.5-6.5s)
    if (elapsed >= STAGE_BOUNDARIES[2]) {
      const t3 = Math.min((elapsed - STAGE_BOUNDARIES[2]) / (STAGE_BOUNDARIES[3] - STAGE_BOUNDARIES[2]), 1);
      
      if (t3 < 0.4) {
        // Doors scale in
        const scaleT = t3 / 0.4;
        leftHinge.scale.setScalar(scaleT);
        rightHinge.scale.setScalar(scaleT);
      } else {
        // Doors open
        const openT = (t3 - 0.4) / 0.6;
        const angle = openT * Math.PI * 0.6; // 108 degrees
        leftHinge.rotation.y = -angle;
        rightHinge.rotation.y = angle;
        
        // Divine light increases
        divineLight.intensity = openT * 4;
      }
    }

    // Stage 4: Diyas light up in sequence (6.5-8.5s)
    if (elapsed >= STAGE_BOUNDARIES[3]) {
      const t4 = Math.min((elapsed - STAGE_BOUNDARIES[3]) / (STAGE_BOUNDARIES[4] - STAGE_BOUNDARIES[3]), 1);
      
      diyas.forEach((diya, i) => {
        const diyaDelay = (i / diyas.length) * 0.7;
        if (t4 > diyaDelay) {
          const diyaT = Math.min((t4 - diyaDelay) / 0.3, 1);
          diya.group.scale.setScalar(diyaT);
          diya.flame.material.opacity = diyaT;
          diya.light.intensity = diyaT * 0.8;
          
          // Flame flicker
          if (diyaT === 1) {
            diya.flame.scale.y = 1 + Math.sin(elapsed * 0.015 + i) * 0.2;
          }
        }
      });
    }

    // Stage 5: Sacred fire and finale (8.5-10.5s)
    if (elapsed >= STAGE_BOUNDARIES[4]) {
      const t5 = Math.min((elapsed - STAGE_BOUNDARIES[4]) / (STAGE_BOUNDARIES[5] - STAGE_BOUNDARIES[4]), 1);
      
      // Fire appears
      fire.material.opacity = t5 * 0.9;
      fireLight.intensity = t5 * 3;
      
      // Fire animation
      const positions = fire.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += 0.02; // Rise
        if (positions[i + 1] > 1.5) positions[i + 1] = 0;
      }
      fire.geometry.attributes.position.needsUpdate = true;
      fire.rotation.y += 0.01;
    }

    // Continuous flower petals falling
    const flowerPos = flowers.geometry.attributes.position.array;
    for (let i = 0; i < flowerPos.length; i += 3) {
      flowerPos[i + 1] -= 0.015;
      if (flowerPos[i + 1] < -5) {
        flowerPos[i + 1] = 5;
        flowerPos[i] = (Math.random() - 0.5) * 15;
        flowerPos[i + 2] = (Math.random() - 0.5) * 8;
      }
    }
    flowers.geometry.attributes.position.needsUpdate = true;
    flowers.rotation.y += 0.002;

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
    
    soundRef.current = createTempleSoundController();
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

  const handleSkip = () => {
    finish();
  };

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
      
      {/* Tap to begin */}
      {!tapped && (
        <motion.div
          className="absolute inset-0 grid place-items-center cursor-pointer"
          onClick={handleTap}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="text-center space-y-4"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="text-sm tracking-[0.3em] uppercase" style={{ color: MARRIAGE_COLORS.light }}>
              Sacred Temple Wedding
            </div>
            <div className="text-xs opacity-70" style={{ color: MARRIAGE_COLORS.primary }}>
              Tap to Begin
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Names overlay */}
      <AnimatePresence>
        {stageUI === 5 && !done && (
          <motion.div
            className="absolute inset-0 grid place-items-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <div className="text-center space-y-6 px-8">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="space-y-2"
              >
                <div 
                  className="text-5xl md:text-6xl font-serif font-bold tracking-wide"
                  style={{ 
                    color: MARRIAGE_COLORS.light,
                    textShadow: `0 0 30px ${MARRIAGE_COLORS.divine}, 0 0 60px ${MARRIAGE_COLORS.accent}, 0 2px 4px rgba(0,0,0,0.8)`
                  }}
                >
                  {brideName}
                </div>
                <div 
                  className="text-3xl md:text-4xl"
                  style={{ 
                    color: MARRIAGE_COLORS.primary,
                    textShadow: `0 0 20px ${MARRIAGE_COLORS.light}, 0 2px 4px rgba(0,0,0,0.6)`
                  }}
                >
                  &
                </div>
                <div 
                  className="text-5xl md:text-6xl font-serif font-bold tracking-wide"
                  style={{ 
                    color: MARRIAGE_COLORS.light,
                    textShadow: `0 0 30px ${MARRIAGE_COLORS.divine}, 0 0 60px ${MARRIAGE_COLORS.accent}, 0 2px 4px rgba(0,0,0,0.8)`
                  }}
                >
                  {groomName}
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="text-sm tracking-[0.3em] uppercase"
                style={{ 
                  color: MARRIAGE_COLORS.primary,
                  textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                }}
              >
                {subtitle}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      {tapped && (
        <div className="absolute top-6 right-6 z-10 flex gap-3">
          <button
            onClick={toggleAudio}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm grid place-items-center hover:bg-black/50 transition-colors"
            style={{ color: MARRIAGE_COLORS.light }}
          >
            {audioOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          
          {showSkip && !done && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleSkip}
              className="px-4 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center gap-2 hover:bg-black/50 transition-colors text-sm"
              style={{ color: MARRIAGE_COLORS.light }}
            >
              <span>Skip</span>
              <SkipForward size={16} />
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
};

export default TempleMarriageOpening;
