/**
 * MughalReceptionOpening - Grand Mughal celebration with fireworks and festivities
 * 
 * Animation Flow:
 * Stage 1: Golden fountain of sparks erupts
 * Stage 2: Floating lanterns rise into the night sky
 * Stage 3: Peacock feather fan unfolds
 * Stage 4: Fireworks burst in royal colors
 * Stage 5: Grand celebration with couple names in ornate frame
 */
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { pixelRatioCap, shouldUseShadows } from '../shared/deviceCaps';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward, Volume2, VolumeX } from 'lucide-react';
import { createMughalSoundController } from './mughal.sounds';

const STAGE_BOUNDARIES = [0, 1800, 4000, 6200, 8200, 10000];
const TOTAL_MS = STAGE_BOUNDARIES[STAGE_BOUNDARIES.length - 1];

const RECEPTION_COLORS = {
  bg: '#0A0514',
  gold: '#D4AF37',
  crimson: '#8B0000',
  peacock: '#1B4D3E',
  firework1: '#FF6B9D',
  firework2: '#00CED1',
  firework3: '#FFD700'
};

const MughalReceptionOpening = ({
  brideName = 'Anaya',
  groomName = 'Rohan',
  monogram = 'A & R',
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
    
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
    camera.position.set(0, 0, 8);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap()));
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    // Dynamic celebration lighting
    scene.add(new THREE.AmbientLight(0xFFE6F5, 0.3));
    
    const lights = [];
    for (let i = 0; i < 5; i++) {
      const light = new THREE.PointLight([0xFF6B9D, 0x00CED1, 0xFFD700, 0x8B0000, 0xD4AF37][i], 1.5, 15);
      const angle = (i / 5) * Math.PI * 2;
      light.position.set(Math.cos(angle) * 5, 3, Math.sin(angle) * 5);
      scene.add(light);
      lights.push(light);
    }

    // Stage 1: Golden fountain
    const fountainParticles = [];
    for (let i = 0; i < 80; i++) {
      const geom = new THREE.SphereGeometry(0.08, 8, 8);
      const mat = new THREE.MeshStandardMaterial({
        color: RECEPTION_COLORS.gold,
        emissive: RECEPTION_COLORS.gold,
        emissiveIntensity: 0.8,
        metalness: 0.8,
        roughness: 0.2
      });
      const particle = new THREE.Mesh(geom, mat);
      particle.position.set(0, -3, 0);
      particle.userData = {
        vx: (Math.random() - 0.5) * 0.1,
        vy: 0.15 + Math.random() * 0.1,
        vz: (Math.random() - 0.5) * 0.1,
        active: false
      };
      scene.add(particle);
      fountainParticles.push(particle);
    }

    // Stage 2: Floating lanterns
    const lanterns = [];
    for (let i = 0; i < 12; i++) {
      const lanternGroup = new THREE.Group();
      
      // Lantern body
      const bodyGeom = new THREE.CylinderGeometry(0.2, 0.2, 0.4, 8);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? RECEPTION_COLORS.crimson : RECEPTION_COLORS.gold,
        emissive: i % 2 === 0 ? RECEPTION_COLORS.crimson : RECEPTION_COLORS.gold,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.9
      });
      const body = new THREE.Mesh(bodyGeom, bodyMat);
      lanternGroup.add(body);
      
      // Lantern top
      const topGeom = new THREE.ConeGeometry(0.25, 0.15, 8);
      const topMat = new THREE.MeshStandardMaterial({ color: RECEPTION_COLORS.gold, metalness: 0.8 });
      const top = new THREE.Mesh(topGeom, topMat);
      top.position.y = 0.275;
      lanternGroup.add(top);
      
      // Light inside
      const innerLight = new THREE.PointLight(0xFFAA00, 0.8, 2);
      lanternGroup.add(innerLight);
      
      lanternGroup.position.set(
        (Math.random() - 0.5) * 8,
        -5,
        (Math.random() - 0.5) * 4
      );
      lanternGroup.scale.set(0, 0, 0);
      scene.add(lanternGroup);
      lanterns.push(lanternGroup);
    }

    // Stage 3: Peacock feather fan
    const feathers = [];
    for (let i = 0; i < 15; i++) {
      const featherGroup = new THREE.Group();
      
      // Feather stem
      const stemGeom = new THREE.CylinderGeometry(0.02, 0.02, 1.5, 8);
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
      const stem = new THREE.Mesh(stemGeom, stemMat);
      stem.position.y = 0.75;
      featherGroup.add(stem);
      
      // Feather eye
      const eyeGeom = new THREE.CircleGeometry(0.2, 32);
      const eyeMat = new THREE.MeshStandardMaterial({
        color: RECEPTION_COLORS.peacock,
        emissive: 0x00CED1,
        emissiveIntensity: 0.3
      });
      const eye = new THREE.Mesh(eyeGeom, eyeMat);
      eye.position.y = 1.5;
      featherGroup.add(eye);
      
      // Inner eye detail
      const innerEyeGeom = new THREE.CircleGeometry(0.08, 32);
      const innerEyeMat = new THREE.MeshBasicMaterial({ color: 0x4169E1 });
      const innerEye = new THREE.Mesh(innerEyeGeom, innerEyeMat);
      innerEye.position.set(0, 1.5, 0.01);
      featherGroup.add(innerEye);
      
      const angle = ((i - 7) / 15) * Math.PI * 0.8;
      featherGroup.rotation.z = angle;
      featherGroup.position.y = -2;
      featherGroup.scale.set(0, 0, 0);
      scene.add(featherGroup);
      feathers.push(featherGroup);
    }

    // Stage 4: Fireworks
    const fireworkSystems = [];
    const colors = [RECEPTION_COLORS.firework1, RECEPTION_COLORS.firework2, RECEPTION_COLORS.firework3];
    const positions = [
      { x: -3, y: 2, z: -2 },
      { x: 3, y: 2.5, z: -2 },
      { x: 0, y: 3, z: -3 },
      { x: -2, y: 1.5, z: -1 },
      { x: 2, y: 2.8, z: -1.5 }
    ];
    
    positions.forEach((pos, idx) => {
      const fwGeom = new THREE.BufferGeometry();
      const count = 60;
      const posArr = new Float32Array(count * 3);
      const velocities = [];
      
      for (let i = 0; i < count; i++) {
        posArr[i * 3] = pos.x;
        posArr[i * 3 + 1] = pos.y;
        posArr[i * 3 + 2] = pos.z;
        
        const angle = (i / count) * Math.PI * 2;
        const speed = 0.05 + Math.random() * 0.03;
        velocities.push({
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed * 0.5,
          z: Math.sin(angle * 2) * speed
        });
      }
      
      fwGeom.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
      const fwMat = new THREE.PointsMaterial({
        color: new THREE.Color(colors[idx % colors.length]),
        size: 0.12,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending
      });
      const fw = new THREE.Points(fwGeom, fwMat);
      scene.add(fw);
      fireworkSystems.push({ fw, velocities, life: 0 });
    });

    // Celebration confetti
    const confetti = [];
    for (let i = 0; i < 100; i++) {
      const geom = new THREE.PlaneGeometry(0.08, 0.12);
      const mat = new THREE.MeshBasicMaterial({
        color: [0xFF6B9D, 0x00CED1, 0xFFD700, 0x8B0000][i % 4],
        side: THREE.DoubleSide
      });
      const piece = new THREE.Mesh(geom, mat);
      piece.position.set(
        (Math.random() - 0.5) * 12,
        8 + Math.random() * 2,
        (Math.random() - 0.5) * 6
      );
      piece.userData = {
        vx: (Math.random() - 0.5) * 0.02,
        vy: -0.03 - Math.random() * 0.02,
        spin: (Math.random() - 0.5) * 0.1
      };
      scene.add(piece);
      confetti.push(piece);
    }

    sceneObjsRef.current = {
      scene, camera, renderer, fountainParticles, lanterns, feathers,
      fireworkSystems, confetti, lights
    };
  };

  const animate = (elapsed) => {
    const objs = sceneObjsRef.current;
    if (!objs) return;

    const { scene, camera, renderer, fountainParticles, lanterns, feathers,
            fireworkSystems, confetti, lights } = objs;

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

    // Lights rotate
    lights.forEach((light, i) => {
      const angle = elapsed * 0.0005 + (i / lights.length) * Math.PI * 2;
      light.position.x = Math.cos(angle) * 5;
      light.position.z = Math.sin(angle) * 5;
    });

    // Stage 1: Fountain erupts
    if (elapsed >= 0) {
      const t1 = elapsed / STAGE_BOUNDARIES[1];
      
      fountainParticles.forEach((particle, i) => {
        if (t1 > (i / fountainParticles.length) * 0.5) {
          particle.userData.active = true;
        }
        
        if (particle.userData.active) {
          particle.position.x += particle.userData.vx;
          particle.position.y += particle.userData.vy;
          particle.position.z += particle.userData.vz;
          particle.userData.vy -= 0.002; // Gravity
          
          if (particle.position.y < -3) {
            particle.position.set(0, -3, 0);
            particle.userData.vy = 0.15 + Math.random() * 0.1;
          }
        }
      });
    }

    // Stage 2: Lanterns rise
    if (elapsed >= STAGE_BOUNDARIES[1]) {
      const t2 = Math.min((elapsed - STAGE_BOUNDARIES[1]) / (STAGE_BOUNDARIES[2] - STAGE_BOUNDARIES[1]), 1);
      
      lanterns.forEach((lantern, i) => {
        const delay = (i / lanterns.length) * 0.6;
        if (t2 > delay) {
          const lanternT = Math.min((t2 - delay) / 0.4, 1);
          lantern.scale.setScalar(lanternT);
          lantern.position.y = -5 + lanternT * 7 + Math.sin(elapsed * 0.002 + i) * 0.3;
          lantern.rotation.y = elapsed * 0.001 + i;
        }
      });
    }

    // Stage 3: Feathers unfold
    if (elapsed >= STAGE_BOUNDARIES[2]) {
      const t3 = Math.min((elapsed - STAGE_BOUNDARIES[2]) / (STAGE_BOUNDARIES[3] - STAGE_BOUNDARIES[2]), 1);
      
      feathers.forEach((feather, i) => {
        const delay = (i / feathers.length) * 0.4;
        if (t3 > delay) {
          const featherT = Math.min((t3 - delay) / 0.6, 1);
          feather.scale.setScalar(featherT);
        }
      });
    }

    // Stage 4: Fireworks
    if (elapsed >= STAGE_BOUNDARIES[3]) {
      const t4 = (elapsed - STAGE_BOUNDARIES[3]) / (STAGE_BOUNDARIES[4] - STAGE_BOUNDARIES[3]);
      
      fireworkSystems.forEach((system, i) => {
        const delay = (i / fireworkSystems.length) * 0.5;
        if (t4 > delay && system.life < 1) {
          system.life = Math.min((t4 - delay) / 0.5, 1);
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

    // Confetti falls
    confetti.forEach(piece => {
      piece.position.x += piece.userData.vx;
      piece.position.y += piece.userData.vy;
      piece.rotation.x += piece.userData.spin;
      piece.rotation.y += piece.userData.spin * 1.2;
      
      if (piece.position.y < -5) {
        piece.position.y = 8 + Math.random() * 2;
        piece.position.x = (Math.random() - 0.5) * 12;
      }
    });

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
    <div className="fixed inset-0 z-[100] overflow-hidden" style={{ background: RECEPTION_COLORS.bg }}>
      <div ref={containerRef} className="absolute inset-0" />
      
      {!tapped && (
        <motion.div className="absolute inset-0 grid place-items-center cursor-pointer" onClick={handleTap}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div className="text-center space-y-4" animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}>
            <div className="text-sm tracking-[0.3em] uppercase" style={{ color: RECEPTION_COLORS.gold }}>
              Grand Celebration
            </div>
            <div className="text-xs opacity-70" style={{ color: RECEPTION_COLORS.firework1 }}>
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
                  style={{ color: RECEPTION_COLORS.gold, textShadow: `0 0 40px ${RECEPTION_COLORS.firework1}, 0 2px 4px rgba(0,0,0,0.8)` }}>
                  {brideName}
                </div>
                <div className="text-3xl md:text-4xl" style={{ color: RECEPTION_COLORS.firework2 }}>
                  &
                </div>
                <div className="text-5xl md:text-6xl font-serif font-bold tracking-wide"
                  style={{ color: RECEPTION_COLORS.gold, textShadow: `0 0 40px ${RECEPTION_COLORS.firework1}, 0 2px 4px rgba(0,0,0,0.8)` }}>
                  {groomName}
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                className="text-sm tracking-[0.3em] uppercase" style={{ color: RECEPTION_COLORS.gold }}>
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
            style={{ color: RECEPTION_COLORS.gold }}>
            {audioOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          {showSkip && !done && (
            <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              onClick={handleSkip}
              className="px-4 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center gap-2 hover:bg-black/50 text-sm"
              style={{ color: RECEPTION_COLORS.gold }}>
              <span>Skip</span>
              <SkipForward size={16} />
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
};

export default MughalReceptionOpening;
