/**
 * MughalEngagementOpening - Romantic Mughal engagement with roses and rings
 * 
 * Animation Flow:
 * Stage 1: Rose petals spiral inward forming a heart
 * Stage 2: Two ornate rings appear with ruby gemstones
 * Stage 3: Silk curtains part revealing romantic setting
 * Stage 4: Persian love poetry patterns form in gold
 * Stage 5: Couple names in romantic Mughal frame
 */
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { pixelRatioCap, shouldUseShadows } from '../shared/deviceCaps';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward, Volume2, VolumeX } from 'lucide-react';
import { createMughalSoundController } from './mughal.sounds';

const STAGE_BOUNDARIES = [0, 1800, 4000, 6000, 7500, 9000];
const TOTAL_MS = STAGE_BOUNDARIES[STAGE_BOUNDARIES.length - 1];

const ENGAGEMENT_COLORS = {
  bg: '#1A0A14',
  rose: '#FF1493',
  gold: '#D4AF37',
  ruby: '#E0115F',
  ivory: '#FFFFF0',
  romantic: '#FFB6C1'
};

const MughalEngagementOpening = ({
  brideName = 'Zara',
  groomName = 'Arjun',
  monogram = 'Z & A',
  subtitle = 'Mughal Engagement',
  particleCount = 200,
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
    scene.background = new THREE.Color(ENGAGEMENT_COLORS.bg);
    
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    camera.position.set(0, 0, 7);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap()));
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    // Romantic lighting
    scene.add(new THREE.AmbientLight(0xFFE6F5, 0.4));
    const l1 = new THREE.PointLight(ENGAGEMENT_COLORS.rose, 1.5, 15);
    l1.position.set(-3, 2, 2);
    scene.add(l1);
    const l2 = new THREE.PointLight(ENGAGEMENT_COLORS.gold, 1.5, 15);
    l2.position.set(3, 2, 2);
    scene.add(l2);

    // Stage 1: Rose petals in heart spiral
    const rosePetals = [];
    for (let i = 0; i < 60; i++) {
      const petalGeom = new THREE.SphereGeometry(0.15, 8, 8);
      const petalMat = new THREE.MeshStandardMaterial({
        color: i % 3 === 0 ? ENGAGEMENT_COLORS.rose : (i % 3 === 1 ? 0xFF69B4 : 0xFFC0CB),
        emissive: ENGAGEMENT_COLORS.rose,
        emissiveIntensity: 0.3
      });
      const petal = new THREE.Mesh(petalGeom, petalMat);
      
      const angle = (i / 60) * Math.PI * 4;
      const radius = 5 + (i / 60) * 3;
      petal.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius * 0.6,
        (Math.random() - 0.5) * 4
      );
      petal.userData = { angle, radius, targetAngle: angle, targetRadius: 1.5 + (i / 60) * 1 };
      scene.add(petal);
      rosePetals.push(petal);
    }

    // Stage 2: Engagement rings
    const ringGroup = new THREE.Group();
    
    // Ring 1
    const ring1Geom = new THREE.TorusGeometry(0.5, 0.08, 16, 100);
    const ringMat = new THREE.MeshStandardMaterial({
      color: ENGAGEMENT_COLORS.gold,
      metalness: 0.95,
      roughness: 0.05,
      emissive: ENGAGEMENT_COLORS.gold,
      emissiveIntensity: 0.3
    });
    const ring1 = new THREE.Mesh(ring1Geom, ringMat);
    ring1.position.x = -0.5;
    ring1.rotation.y = Math.PI / 6;
    ringGroup.add(ring1);
    
    // Ruby on ring 1
    const ruby1Geom = new THREE.OctahedronGeometry(0.18, 0);
    const rubyMat = new THREE.MeshStandardMaterial({
      color: ENGAGEMENT_COLORS.ruby,
      metalness: 0.8,
      roughness: 0.1,
      emissive: ENGAGEMENT_COLORS.ruby,
      emissiveIntensity: 0.6
    });
    const ruby1 = new THREE.Mesh(ruby1Geom, rubyMat);
    ruby1.position.set(-0.5, 0.5, 0);
    ringGroup.add(ruby1);
    
    // Ring 2
    const ring2 = new THREE.Mesh(ring1Geom, ringMat.clone());
    ring2.position.x = 0.5;
    ring2.rotation.y = -Math.PI / 6;
    ringGroup.add(ring2);
    
    // Diamond on ring 2
    const diamond = new THREE.Mesh(ruby1Geom, new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      metalness: 1,
      roughness: 0,
      emissive: 0xFFFFFF,
      emissiveIntensity: 0.5
    }));
    diamond.position.set(0.5, 0.5, 0);
    ringGroup.add(diamond);
    
    ringGroup.scale.set(0, 0, 0);
    scene.add(ringGroup);

    // Stage 3: Silk curtains
    const curtains = [];
    for (let side of [-1, 1]) {
      const curtainGeom = new THREE.PlaneGeometry(3, 6);
      const curtainMat = new THREE.MeshStandardMaterial({
        color: side < 0 ? 0x8B0000 : 0xD4AF37,
        side: THREE.DoubleSide,
        metalness: 0.6,
        roughness: 0.4
      });
      const curtain = new THREE.Mesh(curtainGeom, curtainMat);
      curtain.position.set(side * 0.1, 0, -1);
      curtain.userData = { side };
      scene.add(curtain);
      curtains.push(curtain);
    }

    // Stage 4: Persian poetry patterns
    const poetryLines = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const lineGeom = new THREE.BoxGeometry(1.5, 0.08, 0.02);
      const lineMat = new THREE.MeshBasicMaterial({
        color: ENGAGEMENT_COLORS.gold,
        transparent: true,
        opacity: 0
      });
      const line = new THREE.Mesh(lineGeom, lineMat);
      line.position.set(
        Math.cos(angle) * 2,
        Math.sin(angle) * 2,
        0
      );
      line.rotation.z = angle;
      scene.add(line);
      poetryLines.push(line);
    }

    // Sparkles
    const sparkleGeom = new THREE.BufferGeometry();
    const sparkleArr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      sparkleArr[i * 3] = (Math.random() - 0.5) * 12;
      sparkleArr[i * 3 + 1] = (Math.random() - 0.5) * 8;
      sparkleArr[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    sparkleGeom.setAttribute('position', new THREE.BufferAttribute(sparkleArr, 3));
    const sparkleMat = new THREE.PointsMaterial({
      color: ENGAGEMENT_COLORS.romantic,
      size: 0.06,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    const sparkles = new THREE.Points(sparkleGeom, sparkleMat);
    scene.add(sparkles);

    sceneObjsRef.current = {
      scene, camera, renderer, rosePetals, ringGroup, ring1, ring2, ruby1, diamond,
      curtains, poetryLines, sparkles
    };
  };

  const animate = (elapsed) => {
    const objs = sceneObjsRef.current;
    if (!objs) return;

    const { scene, camera, renderer, rosePetals, ringGroup, ring1, ring2, ruby1, diamond,
            curtains, poetryLines, sparkles } = objs;

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

    // Stage 1: Petals spiral into heart
    if (elapsed >= 0) {
      const t1 = Math.min(elapsed / STAGE_BOUNDARIES[1], 1);
      
      rosePetals.forEach((petal, i) => {
        const progress = t1;
        const currentAngle = petal.userData.angle + (petal.userData.targetAngle - petal.userData.angle) * progress;
        const currentRadius = petal.userData.radius + (petal.userData.targetRadius - petal.userData.radius) * progress;
        
        // Heart shape
        const t = (i / rosePetals.length) * Math.PI * 2;
        const x = 16 * Math.pow(Math.sin(t), 3) * 0.1;
        const y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 0.1;
        
        petal.position.x = x * progress + Math.cos(currentAngle) * currentRadius * (1 - progress);
        petal.position.y = y * progress + Math.sin(currentAngle) * currentRadius * 0.6 * (1 - progress);
        petal.rotation.x = progress * Math.PI * 2;
        petal.rotation.y = progress * Math.PI * 3;
      });
    }

    // Stage 2: Rings appear
    if (elapsed >= STAGE_BOUNDARIES[1]) {
      const t2 = Math.min((elapsed - STAGE_BOUNDARIES[1]) / (STAGE_BOUNDARIES[2] - STAGE_BOUNDARIES[1]), 1);
      ringGroup.scale.setScalar(t2);
      
      ring1.rotation.y = Math.PI / 6 + Math.sin(elapsed * 0.002) * 0.2;
      ring2.rotation.y = -Math.PI / 6 - Math.sin(elapsed * 0.002) * 0.2;
      
      const sparkle = 1 + Math.sin(elapsed * 0.01) * 0.3;
      ruby1.scale.setScalar(sparkle);
      diamond.scale.setScalar(sparkle);
    }

    // Stage 3: Curtains part
    if (elapsed >= STAGE_BOUNDARIES[2]) {
      const t3 = Math.min((elapsed - STAGE_BOUNDARIES[2]) / (STAGE_BOUNDARIES[3] - STAGE_BOUNDARIES[2]), 1);
      
      curtains.forEach(curtain => {
        curtain.position.x = curtain.userData.side * (0.1 + t3 * 3);
      });
    }

    // Stage 4: Poetry lines appear
    if (elapsed >= STAGE_BOUNDARIES[3]) {
      const t4 = Math.min((elapsed - STAGE_BOUNDARIES[3]) / (STAGE_BOUNDARIES[4] - STAGE_BOUNDARIES[3]), 1);
      
      poetryLines.forEach((line, i) => {
        const delay = (i / poetryLines.length) * 0.5;
        if (t4 > delay) {
          const lineT = Math.min((t4 - delay) / 0.5, 1);
          line.material.opacity = lineT * 0.8;
          line.scale.x = lineT;
        }
      });
    }

    // Sparkles
    sparkles.rotation.y += 0.002;
    const sparklePos = sparkles.geometry.attributes.position.array;
    for (let i = 0; i < sparklePos.length; i += 3) {
      sparklePos[i + 1] += Math.sin(elapsed * 0.001 + i) * 0.01;
    }
    sparkles.geometry.attributes.position.needsUpdate = true;

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
    <div className="fixed inset-0 z-[100] overflow-hidden" style={{ background: ENGAGEMENT_COLORS.bg }}>
      <div ref={containerRef} className="absolute inset-0" />
      
      {!tapped && (
        <motion.div className="absolute inset-0 grid place-items-center cursor-pointer" onClick={handleTap}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div className="text-center space-y-4" animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}>
            <div className="text-sm tracking-[0.3em] uppercase" style={{ color: ENGAGEMENT_COLORS.ivory }}>
              Romantic Engagement
            </div>
            <div className="text-xs opacity-70" style={{ color: ENGAGEMENT_COLORS.rose }}>
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
                  style={{ color: ENGAGEMENT_COLORS.rose, textShadow: `0 0 30px ${ENGAGEMENT_COLORS.gold}, 0 2px 4px rgba(0,0,0,0.8)` }}>
                  {brideName}
                </div>
                <div className="text-3xl md:text-4xl" style={{ color: ENGAGEMENT_COLORS.gold }}>
                  &
                </div>
                <div className="text-5xl md:text-6xl font-serif font-bold tracking-wide"
                  style={{ color: ENGAGEMENT_COLORS.rose, textShadow: `0 0 30px ${ENGAGEMENT_COLORS.gold}, 0 2px 4px rgba(0,0,0,0.8)` }}>
                  {groomName}
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                className="text-sm tracking-[0.3em] uppercase" style={{ color: ENGAGEMENT_COLORS.ivory }}>
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
            style={{ color: ENGAGEMENT_COLORS.ivory }}>
            {audioOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          {showSkip && !done && (
            <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              onClick={handleSkip}
              className="px-4 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center gap-2 hover:bg-black/50 text-sm"
              style={{ color: ENGAGEMENT_COLORS.ivory }}>
              <span>Skip</span>
              <SkipForward size={16} />
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
};

export default MughalEngagementOpening;
