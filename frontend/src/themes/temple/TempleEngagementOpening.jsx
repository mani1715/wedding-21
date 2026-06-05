/**
 * TempleEngagementOpening - Romantic temple engagement ceremony
 * 
 * Animation Flow:
 * Stage 1: Soft lotus flowers blooming
 * Stage 2: Two interlocking rings appear with shimmer
 * Stage 3: Heart-shaped rangoli pattern forms
 * Stage 4: Temple bells chime softly
 * Stage 5: Couple names appear with romantic glow
 */
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { pixelRatioCap, shouldUseShadows } from '../shared/deviceCaps';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward, Volume2, VolumeX } from 'lucide-react';
import { createTempleSoundController } from './temple.sounds';

const STAGE_BOUNDARIES = [0, 1500, 3500, 5500, 7000, 8500];
const TOTAL_MS = STAGE_BOUNDARIES[STAGE_BOUNDARIES.length - 1];

// Engagement colors: Soft pink, gold, cream
const ENGAGEMENT_COLORS = {
  bg: '#1A0F14',
  primary: '#FFB6C1',
  accent: '#D4AF37',
  light: '#FFF0F5',
  glow: '#FF69B4'
};

const TempleEngagementOpening = ({
  brideName = 'Priya',
  groomName = 'Rahul',
  monogram = 'P & R',
  subtitle = 'Temple Engagement',
  particleCount = 180,
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
    camera.position.set(0, 0, 6);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap()));
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    // Soft romantic lighting
    scene.add(new THREE.AmbientLight(0xFFE6F0, 0.4));
    const l1 = new THREE.PointLight(ENGAGEMENT_COLORS.primary, 1.2, 15);
    l1.position.set(-3, 2, 2);
    scene.add(l1);
    const l2 = new THREE.PointLight(ENGAGEMENT_COLORS.accent, 1.2, 15);
    l2.position.set(3, 2, 2);
    scene.add(l2);

    // Lotus flowers (stage 1)
    const lotusFlowers = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const radius = 2.5;
      
      const lotusGroup = new THREE.Group();
      
      // Petals
      for (let p = 0; p < 8; p++) {
        const petalAngle = (p / 8) * Math.PI * 2;
        const petalGeom = new THREE.BoxGeometry(0.3, 0.6, 0.02);
        const petalMat = new THREE.MeshStandardMaterial({
          color: i % 2 === 0 ? 0xFFB6C1 : 0xFFC0CB,
          metalness: 0.3,
          roughness: 0.6
        });
        const petal = new THREE.Mesh(petalGeom, petalMat);
        petal.position.x = Math.cos(petalAngle) * 0.4;
        petal.position.z = Math.sin(petalAngle) * 0.4;
        petal.rotation.y = petalAngle;
        petal.rotation.x = -0.3;
        lotusGroup.add(petal);
      }
      
      // Center
      const centerGeom = new THREE.SphereGeometry(0.15, 16, 16);
      const centerMat = new THREE.MeshStandardMaterial({
        color: ENGAGEMENT_COLORS.accent,
        emissive: ENGAGEMENT_COLORS.accent,
        emissiveIntensity: 0.5
      });
      const center = new THREE.Mesh(centerGeom, centerMat);
      lotusGroup.add(center);
      
      lotusGroup.position.set(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius - 2
      );
      lotusGroup.scale.set(0, 0, 0);
      scene.add(lotusGroup);
      lotusFlowers.push(lotusGroup);
    }

    // Engagement rings (stage 2)
    const ringGroup = new THREE.Group();
    
    // Left ring
    const ring1Geom = new THREE.TorusGeometry(0.5, 0.08, 16, 100);
    const ringMat = new THREE.MeshStandardMaterial({
      color: ENGAGEMENT_COLORS.accent,
      metalness: 0.95,
      roughness: 0.05,
      emissive: ENGAGEMENT_COLORS.accent,
      emissiveIntensity: 0.3
    });
    const ring1 = new THREE.Mesh(ring1Geom, ringMat);
    ring1.position.x = -0.4;
    ring1.rotation.y = Math.PI / 6;
    ringGroup.add(ring1);
    
    // Diamond on left ring
    const diamondGeom = new THREE.OctahedronGeometry(0.15, 0);
    const diamondMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      metalness: 1,
      roughness: 0,
      emissive: 0xFFFFFF,
      emissiveIntensity: 0.5
    });
    const diamond1 = new THREE.Mesh(diamondGeom, diamondMat);
    diamond1.position.set(-0.4, 0.5, 0);
    ringGroup.add(diamond1);
    
    // Right ring
    const ring2 = new THREE.Mesh(ring1Geom, ringMat.clone());
    ring2.position.x = 0.4;
    ring2.rotation.y = -Math.PI / 6;
    ringGroup.add(ring2);
    
    const diamond2 = diamond1.clone();
    diamond2.position.set(0.4, 0.5, 0);
    ringGroup.add(diamond2);
    
    ringGroup.scale.set(0, 0, 0);
    scene.add(ringGroup);

    // Heart rangoli (stage 3)
    const heartPoints = [];
    for (let i = 0; i <= 100; i++) {
      const t = (i / 100) * Math.PI * 2;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      heartPoints.push(new THREE.Vector3(x * 0.08, y * 0.08, 0));
    }
    
    const heartCurve = new THREE.CatmullRomCurve3(heartPoints, true);
    const heartGeom = new THREE.TubeGeometry(heartCurve, 100, 0.04, 8, true);
    const heartMat = new THREE.MeshBasicMaterial({
      color: ENGAGEMENT_COLORS.glow,
      transparent: true,
      opacity: 0
    });
    const heart = new THREE.Mesh(heartGeom, heartMat);
    heart.position.z = -1;
    scene.add(heart);

    // Sparkle particles
    const sparkleGeom = new THREE.BufferGeometry();
    const sparkleArr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      sparkleArr[i * 3] = (Math.random() - 0.5) * 12;
      sparkleArr[i * 3 + 1] = (Math.random() - 0.5) * 8;
      sparkleArr[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    sparkleGeom.setAttribute('position', new THREE.BufferAttribute(sparkleArr, 3));
    const sparkleMat = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 0.06,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    const sparkles = new THREE.Points(sparkleGeom, sparkleMat);
    scene.add(sparkles);

    sceneObjsRef.current = {
      scene, camera, renderer, lotusFlowers, ringGroup, heart, sparkles,
      ring1, ring2, diamond1, diamond2
    };
  };

  const animate = (elapsed) => {
    const objs = sceneObjsRef.current;
    if (!objs) return;

    const { scene, camera, renderer, lotusFlowers, ringGroup, heart, sparkles,
            ring1, ring2, diamond1, diamond2 } = objs;

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

    // Stage 1: Lotus flowers bloom
    if (elapsed >= 0) {
      const t1 = Math.min(elapsed / 1500, 1);
      lotusFlowers.forEach((lotus, i) => {
        const delay = (i / lotusFlowers.length) * 0.5;
        if (t1 > delay) {
          const lotusT = Math.min((t1 - delay) / 0.5, 1);
          const eased = 1 - Math.pow(1 - lotusT, 3);
          lotus.scale.setScalar(eased);
          lotus.rotation.y = eased * Math.PI * 0.5;
        }
      });
    }

    // Stage 2: Rings appear and interlock
    if (elapsed >= STAGE_BOUNDARIES[1]) {
      const t2 = Math.min((elapsed - STAGE_BOUNDARIES[1]) / (STAGE_BOUNDARIES[2] - STAGE_BOUNDARIES[1]), 1);
      ringGroup.scale.setScalar(t2);
      
      // Rings rotate toward each other
      ring1.rotation.y = Math.PI / 6 + t2 * (Math.PI / 12);
      ring2.rotation.y = -Math.PI / 6 - t2 * (Math.PI / 12);
      
      // Diamonds sparkle
      const sparkle = 1 + Math.sin(elapsed * 0.01) * 0.2;
      diamond1.scale.setScalar(sparkle);
      diamond2.scale.setScalar(sparkle);
    }

    // Stage 3: Heart rangoli forms
    if (elapsed >= STAGE_BOUNDARIES[2]) {
      const t3 = Math.min((elapsed - STAGE_BOUNDARIES[2]) / (STAGE_BOUNDARIES[3] - STAGE_BOUNDARIES[2]), 1);
      heart.material.opacity = t3 * 0.9;
      heart.rotation.z = t3 * Math.PI * 0.1;
      
      // Gentle pulse
      const pulse = 1 + Math.sin(elapsed * 0.005) * 0.05;
      heart.scale.setScalar(pulse);
    }

    // Continuous sparkle animation
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
    <div className="fixed inset-0 z-[100] overflow-hidden" style={{ background: ENGAGEMENT_COLORS.bg }}>
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
            <div className="text-sm tracking-[0.3em] uppercase" style={{ color: ENGAGEMENT_COLORS.light }}>
              Sacred Engagement
            </div>
            <div className="text-xs opacity-70" style={{ color: ENGAGEMENT_COLORS.primary }}>
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
                  style={{ color: ENGAGEMENT_COLORS.primary, textShadow: `0 0 30px ${ENGAGEMENT_COLORS.glow}, 0 2px 4px rgba(0,0,0,0.8)` }}>
                  {brideName}
                </div>
                <div className="text-3xl md:text-4xl" style={{ color: ENGAGEMENT_COLORS.accent, textShadow: `0 0 20px ${ENGAGEMENT_COLORS.light}` }}>
                  &
                </div>
                <div className="text-5xl md:text-6xl font-serif font-bold tracking-wide"
                  style={{ color: ENGAGEMENT_COLORS.primary, textShadow: `0 0 30px ${ENGAGEMENT_COLORS.glow}, 0 2px 4px rgba(0,0,0,0.8)` }}>
                  {groomName}
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-sm tracking-[0.3em] uppercase"
                style={{ color: ENGAGEMENT_COLORS.light, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
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
            style={{ color: ENGAGEMENT_COLORS.light }}>
            {audioOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          {showSkip && !done && (
            <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              onClick={handleSkip}
              className="px-4 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center gap-2 hover:bg-black/50 text-sm"
              style={{ color: ENGAGEMENT_COLORS.light }}>
              <span>Skip</span>
              <SkipForward size={16} />
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
};

export default TempleEngagementOpening;