/**
 * MughalHaldiOpening - Vibrant Mughal Haldi/Sangeet/Mehendi celebration
 * 
 * Animation Flow:
 * Stage 1: Saffron powder clouds burst in patterns
 * Stage 2: Golden coins rain celebrating prosperity
 * Stage 3: Turmeric-stained hands form henna patterns
 * Stage 4: Marigold garlands swing and dance
 * Stage 5: Colorful celebration with couple names in ornate Mughal frame
 */
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { pixelRatioCap, shouldUseShadows } from '../shared/deviceCaps';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward, Volume2, VolumeX } from 'lucide-react';
import { createMughalSoundController } from './mughal.sounds';

const STAGE_BOUNDARIES = [0, 1600, 3800, 6000, 8000, 9500];
const TOTAL_MS = STAGE_BOUNDARIES[STAGE_BOUNDARIES.length - 1];

const HALDI_COLORS = {
  bg: '#1A0B00',
  saffron: '#F4C430',
  turmeric: '#FFBF00',
  gold: '#FFD700',
  orange: '#FF8C00',
  marigold: '#FFA500',
  crimson: '#DC143C'
};

const MughalHaldiOpening = ({
  brideName = 'Zara',
  groomName = 'Arjun',
  monogram = 'Z & A',
  subtitle = 'Haldi · Sangeet · Mehendi',
  particleCount = 350,
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
    scene.background = new THREE.Color(HALDI_COLORS.bg);
    
    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
    camera.position.set(0, 0, 7);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap()));
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    // Vibrant warm lighting
    scene.add(new THREE.AmbientLight(0xFFE6D5, 0.5));
    
    const lights = [];
    const lightColors = [HALDI_COLORS.saffron, HALDI_COLORS.gold, HALDI_COLORS.orange, HALDI_COLORS.marigold, HALDI_COLORS.crimson];
    for (let i = 0; i < 5; i++) {
      const light = new THREE.PointLight(new THREE.Color(lightColors[i]), 1.5, 12);
      const angle = (i / 5) * Math.PI * 2;
      light.position.set(Math.cos(angle) * 4, 2, Math.sin(angle) * 4);
      scene.add(light);
      lights.push(light);
    }

    // Stage 1: Saffron powder bursts
    const powderBursts = [];
    const powderColors = [HALDI_COLORS.saffron, HALDI_COLORS.turmeric, HALDI_COLORS.orange, HALDI_COLORS.marigold];
    
    powderColors.forEach((color, idx) => {
      const burstGeom = new THREE.BufferGeometry();
      const count = 70;
      const positions = new Float32Array(count * 3);
      const velocities = [];
      
      for (let i = 0; i < count; i++) {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;
        
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 0.04 + Math.random() * 0.03;
        
        velocities.push({
          x: speed * Math.sin(phi) * Math.cos(theta),
          y: speed * Math.sin(phi) * Math.sin(theta),
          z: speed * Math.cos(phi)
        });
      }
      
      burstGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const burstMat = new THREE.PointsMaterial({
        color: new THREE.Color(color),
        size: 0.25,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending
      });
      const burst = new THREE.Points(burstGeom, burstMat);
      scene.add(burst);
      powderBursts.push({ burst, velocities, delay: idx * 0.2 });
    });

    // Stage 2: Golden coins raining
    const coins = [];
    for (let i = 0; i < 50; i++) {
      const coinGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.03, 16);
      const coinMat = new THREE.MeshStandardMaterial({
        color: HALDI_COLORS.gold,
        metalness: 0.95,
        roughness: 0.1,
        emissive: HALDI_COLORS.gold,
        emissiveIntensity: 0.4
      });
      const coin = new THREE.Mesh(coinGeom, coinMat);
      coin.position.set(
        (Math.random() - 0.5) * 10,
        6 + Math.random() * 3,
        (Math.random() - 0.5) * 6
      );
      coin.rotation.x = Math.random() * Math.PI;
      coin.rotation.z = Math.random() * Math.PI;
      coin.userData = {
        spinX: (Math.random() - 0.5) * 0.1,
        spinZ: (Math.random() - 0.5) * 0.1,
        vy: -0.04 - Math.random() * 0.02
      };
      scene.add(coin);
      coins.push(coin);
    }

    // Stage 3: Henna hands with patterns
    const hennaHands = [];
    for (let side of [-1, 1]) {
      const handGroup = new THREE.Group();
      
      // Palm
      const palmGeom = new THREE.BoxGeometry(0.8, 1.2, 0.1);
      const palmMat = new THREE.MeshStandardMaterial({
        color: 0xD2B48C,
        roughness: 0.7
      });
      const palm = new THREE.Mesh(palmGeom, palmMat);
      handGroup.add(palm);
      
      // Henna patterns on palm
      for (let i = 0; i < 15; i++) {
        const patternGeom = new THREE.SphereGeometry(0.04, 8, 8);
        const patternMat = new THREE.MeshBasicMaterial({
          color: 0x8B4513,
          transparent: true,
          opacity: 0
        });
        const pattern = new THREE.Mesh(patternGeom, patternMat);
        pattern.position.set(
          (Math.random() - 0.5) * 0.7,
          (Math.random() - 0.5) * 1.1,
          0.06
        );
        handGroup.add(pattern);
      }
      
      // Fingers
      for (let f = 0; f < 5; f++) {
        const fingerGeom = new THREE.BoxGeometry(0.12, 0.5, 0.1);
        const finger = new THREE.Mesh(fingerGeom, palmMat.clone());
        finger.position.set(-0.32 + f * 0.16, 0.85, 0);
        handGroup.add(finger);
      }
      
      handGroup.position.set(side * 2, 0, 0);
      handGroup.rotation.z = side * 0.2;
      handGroup.scale.set(0, 0, 0);
      scene.add(handGroup);
      hennaHands.push(handGroup);
    }

    // Stage 4: Marigold garlands
    const garlands = [];
    for (let g = 0; g < 3; g++) {
      const garlandGroup = new THREE.Group();
      
      // String
      const stringGeom = new THREE.CylinderGeometry(0.02, 0.02, 4, 8);
      const stringMat = new THREE.MeshBasicMaterial({ color: 0x228B22 });
      const string = new THREE.Mesh(stringGeom, stringMat);
      string.rotation.z = Math.PI / 2;
      garlandGroup.add(string);
      
      // Flowers along the garland
      for (let i = 0; i < 20; i++) {
        const flowerGroup = new THREE.Group();
        
        // Petals
        for (let p = 0; p < 8; p++) {
          const angle = (p / 8) * Math.PI * 2;
          const petalGeom = new THREE.BoxGeometry(0.08, 0.12, 0.02);
          const petalMat = new THREE.MeshStandardMaterial({
            color: i % 2 === 0 ? HALDI_COLORS.marigold : HALDI_COLORS.saffron,
            emissive: i % 2 === 0 ? HALDI_COLORS.marigold : HALDI_COLORS.saffron,
            emissiveIntensity: 0.3
          });
          const petal = new THREE.Mesh(petalGeom, petalMat);
          petal.position.x = Math.cos(angle) * 0.1;
          petal.position.y = Math.sin(angle) * 0.1;
          petal.rotation.z = angle;
          flowerGroup.add(petal);
        }
        
        // Center
        const centerGeom = new THREE.SphereGeometry(0.05, 8, 8);
        const centerMat = new THREE.MeshStandardMaterial({
          color: HALDI_COLORS.gold,
          emissive: HALDI_COLORS.gold,
          emissiveIntensity: 0.5
        });
        const center = new THREE.Mesh(centerGeom, centerMat);
        flowerGroup.add(center);
        
        flowerGroup.position.set(-2 + (i / 19) * 4, 0, 0);
        garlandGroup.add(flowerGroup);
      }
      
      garlandGroup.position.set(0, 2.5 - g * 1.2, -1);
      garlandGroup.scale.set(0, 0, 0);
      scene.add(garlandGroup);
      garlands.push(garlandGroup);
    }

    // Floating particles
    const floatingGeom = new THREE.BufferGeometry();
    const floatingArr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      floatingArr[i * 3] = (Math.random() - 0.5) * 15;
      floatingArr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      floatingArr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    floatingGeom.setAttribute('position', new THREE.BufferAttribute(floatingArr, 3));
    const floatingMat = new THREE.PointsMaterial({
      color: HALDI_COLORS.turmeric,
      size: 0.08,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    const floating = new THREE.Points(floatingGeom, floatingMat);
    scene.add(floating);

    sceneObjsRef.current = {
      scene, camera, renderer, powderBursts, coins, hennaHands, garlands,
      floating, lights
    };
  };

  const animate = (elapsed) => {
    const objs = sceneObjsRef.current;
    if (!objs) return;

    const { scene, camera, renderer, powderBursts, coins, hennaHands, garlands,
            floating, lights } = objs;

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

    // Lights pulse
    lights.forEach((light, i) => {
      light.intensity = 1.5 + Math.sin(elapsed * 0.003 + i) * 0.3;
    });

    // Stage 1: Powder bursts
    if (elapsed >= 0) {
      const t1 = elapsed / STAGE_BOUNDARIES[1];
      
      powderBursts.forEach(({ burst, velocities, delay }) => {
        if (t1 > delay) {
          const burstT = Math.min((t1 - delay) / 0.8, 1);
          burst.material.opacity = burstT * (1 - burstT * 0.6);
          
          const positions = burst.geometry.attributes.position.array;
          for (let i = 0; i < velocities.length; i++) {
            positions[i * 3] += velocities[i].x;
            positions[i * 3 + 1] += velocities[i].y;
            positions[i * 3 + 2] += velocities[i].z;
          }
          burst.geometry.attributes.position.needsUpdate = true;
        }
      });
    }

    // Stage 2: Coins rain
    if (elapsed >= STAGE_BOUNDARIES[1]) {
      coins.forEach(coin => {
        coin.position.y += coin.userData.vy;
        coin.rotation.x += coin.userData.spinX;
        coin.rotation.z += coin.userData.spinZ;
        
        if (coin.position.y < -4) {
          coin.position.y = 6 + Math.random() * 3;
          coin.position.x = (Math.random() - 0.5) * 10;
          coin.position.z = (Math.random() - 0.5) * 6;
        }
      });
    }

    // Stage 3: Henna hands appear
    if (elapsed >= STAGE_BOUNDARIES[2]) {
      const t3 = Math.min((elapsed - STAGE_BOUNDARIES[2]) / (STAGE_BOUNDARIES[3] - STAGE_BOUNDARIES[2]), 1);
      
      hennaHands.forEach((hand, idx) => {
        const delay = idx * 0.3;
        if (t3 > delay) {
          const handT = Math.min((t3 - delay) / 0.7, 1);
          hand.scale.setScalar(handT);
          
          // Patterns appear
          hand.children.forEach(child => {
            if (child.material && child.material.transparent) {
              child.material.opacity = handT;
            }
          });
        }
      });
    }

    // Stage 4: Garlands swing
    if (elapsed >= STAGE_BOUNDARIES[3]) {
      const t4 = Math.min((elapsed - STAGE_BOUNDARIES[3]) / (STAGE_BOUNDARIES[4] - STAGE_BOUNDARIES[3]), 1);
      
      garlands.forEach((garland, i) => {
        const delay = (i / garlands.length) * 0.4;
        if (t4 > delay) {
          const garlandT = Math.min((t4 - delay) / 0.6, 1);
          garland.scale.setScalar(garlandT);
          
          // Swing motion
          garland.rotation.z = Math.sin(elapsed * 0.003 + i) * 0.2;
        }
      });
    }

    // Floating particles
    floating.rotation.y += 0.002;
    const floatingPos = floating.geometry.attributes.position.array;
    for (let i = 0; i < floatingPos.length; i += 3) {
      floatingPos[i + 1] += Math.sin(elapsed * 0.001 + i) * 0.01;
    }
    floating.geometry.attributes.position.needsUpdate = true;

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
    <div className="fixed inset-0 z-[100] overflow-hidden" style={{ background: HALDI_COLORS.bg }}>
      <div ref={containerRef} className="absolute inset-0" />
      
      {!tapped && (
        <motion.div className="absolute inset-0 grid place-items-center cursor-pointer" onClick={handleTap}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div className="text-center space-y-4" animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}>
            <div className="text-sm tracking-[0.3em] uppercase" style={{ color: HALDI_COLORS.gold }}>
              Vibrant Celebration
            </div>
            <div className="text-xs opacity-70" style={{ color: HALDI_COLORS.saffron }}>
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
                  style={{ color: HALDI_COLORS.saffron, textShadow: `0 0 40px ${HALDI_COLORS.gold}, 0 2px 4px rgba(0,0,0,0.8)` }}>
                  {brideName}
                </div>
                <div className="text-3xl md:text-4xl" style={{ color: HALDI_COLORS.marigold }}>
                  &
                </div>
                <div className="text-5xl md:text-6xl font-serif font-bold tracking-wide"
                  style={{ color: HALDI_COLORS.saffron, textShadow: `0 0 40px ${HALDI_COLORS.gold}, 0 2px 4px rgba(0,0,0,0.8)` }}>
                  {groomName}
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                className="text-sm tracking-[0.3em] uppercase" style={{ color: HALDI_COLORS.gold }}>
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
            style={{ color: HALDI_COLORS.gold }}>
            {audioOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          {showSkip && !done && (
            <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              onClick={handleSkip}
              className="px-4 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center gap-2 hover:bg-black/50 text-sm"
              style={{ color: HALDI_COLORS.gold }}>
              <span>Skip</span>
              <SkipForward size={16} />
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
};

export default MughalHaldiOpening;
