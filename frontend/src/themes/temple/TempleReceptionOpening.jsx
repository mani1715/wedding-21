/**
 * TempleReceptionOpening - Grand celebratory reception with fireworks and lights
 * 
 * Animation Flow:
 * Stage 1: Champagne sparkles and celebration confetti
 * Stage 2: Grand chandelier descends with crystal reflections
 * Stage 3: Fireworks burst in multiple colors
 * Stage 4: Illuminated rangoli floor pattern with 3D depth
 * Stage 5: Grand reveal with couple names in golden spotlight
 */
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { pixelRatioCap, shouldUseShadows } from '../shared/deviceCaps';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward, Volume2, VolumeX } from 'lucide-react';
import { createTempleSoundController } from './temple.sounds';

const STAGE_BOUNDARIES = [0, 1800, 4000, 6200, 8000, 10000];
const TOTAL_MS = STAGE_BOUNDARIES[STAGE_BOUNDARIES.length - 1];

// Reception colors: Rich purple, gold, champagne, vibrant lights
const RECEPTION_COLORS = {
  bg: '#0A0514',
  primary: '#D4AF37',
  accent: '#9B59B6',
  light: '#FFD700',
  champagne: '#F7E7CE',
  firework1: '#FF6B9D',
  firework2: '#4ECDC4',
  firework3: '#FFE66D'
};

const buildCrystalTexture = () => {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  
  const grad = ctx.createRadialGradient(128, 128, 30, 128, 128, 128);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.5, '#E8D7FF');
  grad.addColorStop(1, '#C0A0D0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  
  // Diamond facets
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.4})`;
    ctx.beginPath();
    ctx.moveTo(128, 128);
    const angle1 = Math.random() * Math.PI * 2;
    const angle2 = angle1 + Math.PI / 6;
    ctx.lineTo(128 + Math.cos(angle1) * 100, 128 + Math.sin(angle1) * 100);
    ctx.lineTo(128 + Math.cos(angle2) * 100, 128 + Math.sin(angle2) * 100);
    ctx.fill();
  }
  
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

const buildRangoliTexture = () => {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  
  // Base
  ctx.fillStyle = '#1A0A2E';
  ctx.fillRect(0, 0, 512, 512);
  
  // Concentric rangoli patterns
  const colors = ['#FF6B9D', '#FFE66D', '#4ECDC4', '#D4AF37', '#9B59B6'];
  
  for (let ring = 0; ring < 5; ring++) {
    const radius = 50 + ring * 70;
    const petals = 12;
    
    ctx.fillStyle = colors[ring % colors.length];
    ctx.strokeStyle = colors[(ring + 1) % colors.length];
    ctx.lineWidth = 3;
    
    for (let i = 0; i < petals; i++) {
      const angle = (i / petals) * Math.PI * 2;
      const x = 256 + Math.cos(angle) * radius;
      const y = 256 + Math.sin(angle) * radius;
      
      ctx.beginPath();
      ctx.arc(x, y, 20 - ring * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
  
  // Center mandala
  ctx.fillStyle = '#FFD700';
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 4;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(256, 256);
    ctx.lineTo(256 + Math.cos(angle) * 40, 256 + Math.sin(angle) * 40);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(256, 256, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

const TempleReceptionOpening = ({
  brideName = 'Lakshmi',
  groomName = 'Karthik',
  monogram = 'L & K',
  subtitle = 'Grand Reception',
  particleCount = 300,
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
    scene.background = new THREE.Color(RECEPTION_COLORS.bg);
    scene.fog = new THREE.Fog(RECEPTION_COLORS.bg, 8, 20);
    
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
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

    // Dynamic party lighting
    scene.add(new THREE.AmbientLight(0xFFE6F5, 0.3));
    
    // Spotlights (will move)
    const spotlights = [];
    for (let i = 0; i < 4; i++) {
      const color = [0xFF6B9D, 0x4ECDC4, 0xFFE66D, 0x9B59B6][i];
      const spot = new THREE.SpotLight(color, 2, 20, Math.PI / 6, 0.5, 2);
      const angle = (i / 4) * Math.PI * 2;
      spot.position.set(Math.cos(angle) * 5, 6, Math.sin(angle) * 5);
      spot.target.position.set(0, 0, 0);
      scene.add(spot);
      scene.add(spot.target);
      spotlights.push(spot);
    }
    
    // Golden key light
    const keyLight = new THREE.PointLight(RECEPTION_COLORS.light, 1.5, 15);
    keyLight.position.set(0, 5, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    // Stage 1: Champagne sparkles and confetti
    const confettiPieces = [];
    for (let i = 0; i < 100; i++) {
      const geom = new THREE.PlaneGeometry(0.1, 0.15);
      const mat = new THREE.MeshBasicMaterial({
        color: [0xFF6B9D, 0x4ECDC4, 0xFFE66D, 0xD4AF37, 0x9B59B6][i % 5],
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
      });
      const piece = new THREE.Mesh(geom, mat);
      piece.position.set(
        (Math.random() - 0.5) * 12,
        8 + Math.random() * 4,
        (Math.random() - 0.5) * 8
      );
      piece.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      piece.userData = {
        vx: (Math.random() - 0.5) * 0.02,
        vy: -0.03 - Math.random() * 0.02,
        vz: (Math.random() - 0.5) * 0.02,
        spin: (Math.random() - 0.5) * 0.1
      };
      scene.add(piece);
      confettiPieces.push(piece);
    }
    
    // Champagne bubbles
    const bubbleGeom = new THREE.BufferGeometry();
    const bubbleArr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      bubbleArr[i * 3] = (Math.random() - 0.5) * 10;
      bubbleArr[i * 3 + 1] = -5 + Math.random() * 3;
      bubbleArr[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    bubbleGeom.setAttribute('position', new THREE.BufferAttribute(bubbleArr, 3));
    const bubbleMat = new THREE.PointsMaterial({
      color: RECEPTION_COLORS.champagne,
      size: 0.08,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    const bubbles = new THREE.Points(bubbleGeom, bubbleMat);
    scene.add(bubbles);

    // Stage 2: Grand chandelier
    const chandelierGroup = new THREE.Group();
    
    // Central sphere
    const centerGeom = new THREE.SphereGeometry(0.5, 32, 32);
    const centerMat = new THREE.MeshStandardMaterial({
      color: RECEPTION_COLORS.primary,
      metalness: 0.95,
      roughness: 0.05,
      emissive: RECEPTION_COLORS.primary,
      emissiveIntensity: 0.5
    });
    const center = new THREE.Mesh(centerGeom, centerMat);
    chandelierGroup.add(center);
    
    // Crystal drops in tiers
    const crystalTex = buildCrystalTexture();
    const tiers = [{ count: 12, radius: 1.2, height: -0.8 }, 
                   { count: 18, radius: 1.8, height: -1.6 },
                   { count: 24, radius: 2.4, height: -2.4 }];
    
    const crystals = [];
    tiers.forEach(tier => {
      for (let i = 0; i < tier.count; i++) {
        const angle = (i / tier.count) * Math.PI * 2;
        
        // Crystal drop
        const crystalGeom = new THREE.ConeGeometry(0.08, 0.4, 8);
        const crystalMat = new THREE.MeshPhysicalMaterial({
          map: crystalTex,
          metalness: 0.1,
          roughness: 0.1,
          transparent: true,
          opacity: 0.9,
          transmission: 0.9,
          thickness: 0.5,
          envMapIntensity: 2
        });
        const crystal = new THREE.Mesh(crystalGeom, crystalMat);
        crystal.position.set(
          Math.cos(angle) * tier.radius,
          tier.height,
          Math.sin(angle) * tier.radius
        );
        chandelierGroup.add(crystal);
        crystals.push(crystal);
        
        // Light point at each crystal
        const crystalLight = new THREE.PointLight(0xFFFFFF, 0.3, 2);
        crystalLight.position.copy(crystal.position);
        chandelierGroup.add(crystalLight);
      }
    });
    
    chandelierGroup.position.y = 10;
    chandelierGroup.scale.set(0, 0, 0);
    scene.add(chandelierGroup);

    // Stage 3: Fireworks
    const fireworkSystems = [];
    const createFirework = (color, startPos) => {
      const particleCount = 60;
      const geom = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const velocities = [];
      
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = startPos.x;
        positions[i * 3 + 1] = startPos.y;
        positions[i * 3 + 2] = startPos.z;
        
        const angle = (i / particleCount) * Math.PI * 2;
        const speed = 0.05 + Math.random() * 0.03;
        velocities.push({
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed * 0.5,
          z: Math.sin(angle * 2) * speed
        });
      }
      
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({
        color: color,
        size: 0.12,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending
      });
      const particles = new THREE.Points(geom, mat);
      scene.add(particles);
      
      return { particles, velocities, life: 0 };
    };
    
    // Create 6 fireworks at different positions
    const fireworkPositions = [
      { x: -3, y: 3, z: -2 },
      { x: 3, y: 3.5, z: -2 },
      { x: 0, y: 4, z: -3 },
      { x: -2, y: 2.5, z: -1 },
      { x: 2, y: 3.8, z: -1.5 },
      { x: 0, y: 2.8, z: -2.5 }
    ];
    
    fireworkPositions.forEach((pos, i) => {
      const color = [RECEPTION_COLORS.firework1, RECEPTION_COLORS.firework2, 
                     RECEPTION_COLORS.firework3][i % 3];
      fireworkSystems.push(createFirework(new THREE.Color(color), pos));
    });

    // Stage 4: Rangoli floor
    const rangoliTex = buildRangoliTexture();
    const rangoliGeom = new THREE.CircleGeometry(4, 64);
    const rangoliMat = new THREE.MeshStandardMaterial({
      map: rangoliTex,
      emissive: 0xFFFFFF,
      emissiveIntensity: 0,
      emissiveMap: rangoliTex,
      transparent: true,
      opacity: 0
    });
    const rangoli = new THREE.Mesh(rangoliGeom, rangoliMat);
    rangoli.rotation.x = -Math.PI / 2;
    rangoli.position.y = -3;
    rangoli.receiveShadow = true;
    scene.add(rangoli);
    
    // Rangoli 3D raised patterns
    const rangoliPetals = [];
    for (let ring = 0; ring < 3; ring++) {
      const petalCount = 8 + ring * 4;
      const radius = 1 + ring * 0.8;
      
      for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2;
        const petalGeom = new THREE.CylinderGeometry(0.15, 0.1, 0.1, 6);
        const petalMat = new THREE.MeshStandardMaterial({
          color: [0xFF6B9D, 0xFFE66D, 0x4ECDC4][ring],
          emissive: [0xFF6B9D, 0xFFE66D, 0x4ECDC4][ring],
          emissiveIntensity: 0,
          metalness: 0.3,
          roughness: 0.4
        });
        const petal = new THREE.Mesh(petalGeom, petalMat);
        petal.position.set(
          Math.cos(angle) * radius,
          -2.95,
          Math.sin(angle) * radius
        );
        scene.add(petal);
        rangoliPetals.push(petal);
      }
    }

    sceneObjsRef.current = {
      scene, camera, renderer, confettiPieces, bubbles, chandelierGroup,
      fireworkSystems, rangoli, rangoliPetals, spotlights, keyLight, crystals
    };
  };

  const animate = (elapsed) => {
    const objs = sceneObjsRef.current;
    if (!objs) return;

    const { scene, camera, renderer, confettiPieces, bubbles, chandelierGroup,
            fireworkSystems, rangoli, rangoliPetals, spotlights, crystals } = objs;

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
      if (stage === 5) setTimeout(() => finish(), 600);
    }

    // Spotlights rotate
    spotlights.forEach((spot, i) => {
      const angle = (elapsed * 0.0005 + (i / spotlights.length) * Math.PI * 2);
      spot.position.x = Math.cos(angle) * 5;
      spot.position.z = Math.sin(angle) * 5;
    });

    // Stage 1: Confetti falls and bubbles rise
    if (elapsed >= 0) {
      confettiPieces.forEach(piece => {
        piece.position.x += piece.userData.vx;
        piece.position.y += piece.userData.vy;
        piece.position.z += piece.userData.vz;
        piece.rotation.x += piece.userData.spin;
        piece.rotation.y += piece.userData.spin * 0.7;
        
        if (piece.position.y < -5) {
          piece.position.y = 8;
          piece.position.x = (Math.random() - 0.5) * 12;
          piece.position.z = (Math.random() - 0.5) * 8;
        }
      });
      
      const bubblePos = bubbles.geometry.attributes.position.array;
      for (let i = 0; i < bubblePos.length; i += 3) {
        bubblePos[i + 1] += 0.02;
        bubblePos[i] += Math.sin(elapsed * 0.001 + i) * 0.005;
        if (bubblePos[i + 1] > 5) {
          bubblePos[i + 1] = -5;
          bubblePos[i] = (Math.random() - 0.5) * 10;
          bubblePos[i + 2] = (Math.random() - 0.5) * 6;
        }
      }
      bubbles.geometry.attributes.position.needsUpdate = true;
    }

    // Stage 2: Chandelier descends
    if (elapsed >= STAGE_BOUNDARIES[1]) {
      const t2 = Math.min((elapsed - STAGE_BOUNDARIES[1]) / (STAGE_BOUNDARIES[2] - STAGE_BOUNDARIES[1]), 1);
      const eased = 1 - Math.pow(1 - t2, 3);
      chandelierGroup.scale.setScalar(eased);
      chandelierGroup.position.y = 10 - eased * 7;
      chandelierGroup.rotation.y = elapsed * 0.0003;
      
      // Crystals shimmer
      crystals.forEach((crystal, i) => {
        crystal.rotation.y = elapsed * 0.002 + i;
      });
    }

    // Stage 3: Fireworks burst
    if (elapsed >= STAGE_BOUNDARIES[2]) {
      const t3 = (elapsed - STAGE_BOUNDARIES[2]) / (STAGE_BOUNDARIES[3] - STAGE_BOUNDARIES[2]);
      
      fireworkSystems.forEach((fw, i) => {
        const delay = (i / fireworkSystems.length) * 0.5;
        if (t3 > delay && fw.life < 1) {
          fw.life = Math.min((t3 - delay) / 0.5, 1);
          fw.particles.material.opacity = fw.life * (1 - fw.life * 0.7);
          
          const positions = fw.particles.geometry.attributes.position.array;
          for (let j = 0; j < fw.velocities.length; j++) {
            positions[j * 3] += fw.velocities[j].x;
            positions[j * 3 + 1] += fw.velocities[j].y;
            positions[j * 3 + 2] += fw.velocities[j].z;
            fw.velocities[j].y -= 0.001; // Gravity
          }
          fw.particles.geometry.attributes.position.needsUpdate = true;
        }
      });
    }

    // Stage 4: Rangoli floor lights up
    if (elapsed >= STAGE_BOUNDARIES[3]) {
      const t4 = Math.min((elapsed - STAGE_BOUNDARIES[3]) / (STAGE_BOUNDARIES[4] - STAGE_BOUNDARIES[3]), 1);
      rangoli.material.opacity = t4;
      rangoli.material.emissiveIntensity = t4 * 0.6;
      rangoli.rotation.z = t4 * Math.PI * 0.2;
      
      // 3D petals rise
      rangoliPetals.forEach((petal, i) => {
        const delay = (i / rangoliPetals.length) * 0.5;
        if (t4 > delay) {
          const petalT = Math.min((t4 - delay) / 0.5, 1);
          petal.position.y = -2.95 + petalT * 0.2;
          petal.material.emissiveIntensity = petalT * 0.7;
          petal.rotation.y = petalT * Math.PI;
        }
      });
    }

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

  const handleSkip = () => finish();
  const toggleAudio = () => {
    setAudioOn(!audioOn);
    if (soundRef.current) {
      audioOn ? soundRef.current.mute() : soundRef.current.unmute();
    }
  };

  if (reduce) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden" style={{ background: RECEPTION_COLORS.bg }}>
      <div ref={containerRef} className="absolute inset-0" />
      
      {!tapped && (
        <motion.div
          className="absolute inset-0 grid place-items-center cursor-pointer"
          onClick={handleTap}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="text-center space-y-4"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="text-sm tracking-[0.3em] uppercase" style={{ color: RECEPTION_COLORS.champagne }}>
              Grand Celebration
            </div>
            <div className="text-xs opacity-70" style={{ color: RECEPTION_COLORS.primary }}>
              Tap to Begin
            </div>
          </motion.div>
        </motion.div>
      )}

      <AnimatePresence>
        {stageUI === 5 && !done && (
          <motion.div
            className="absolute inset-0 grid place-items-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center space-y-6 px-8">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="space-y-2"
              >
                <div className="text-5xl md:text-6xl font-serif font-bold tracking-wide"
                  style={{ color: RECEPTION_COLORS.light, textShadow: `0 0 40px ${RECEPTION_COLORS.accent}, 0 0 80px ${RECEPTION_COLORS.firework1}, 0 2px 4px rgba(0,0,0,0.8)` }}>
                  {brideName}
                </div>
                <div className="text-3xl md:text-4xl" style={{ color: RECEPTION_COLORS.champagne, textShadow: `0 0 30px ${RECEPTION_COLORS.light}` }}>
                  &
                </div>
                <div className="text-5xl md:text-6xl font-serif font-bold tracking-wide"
                  style={{ color: RECEPTION_COLORS.light, textShadow: `0 0 40px ${RECEPTION_COLORS.accent}, 0 0 80px ${RECEPTION_COLORS.firework1}, 0 2px 4px rgba(0,0,0,0.8)` }}>
                  {groomName}
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-sm tracking-[0.3em] uppercase"
                style={{ color: RECEPTION_COLORS.champagne, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
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
            style={{ color: RECEPTION_COLORS.champagne }}>
            {audioOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          {showSkip && !done && (
            <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              onClick={handleSkip}
              className="px-4 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center gap-2 hover:bg-black/50 text-sm"
              style={{ color: RECEPTION_COLORS.champagne }}>
              <span>Skip</span>
              <SkipForward size={16} />
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
};

export default TempleReceptionOpening;