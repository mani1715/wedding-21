/**
 * MuslimMarriageOpening - Islamic Nikah ceremony with mosque and geometric patterns
 * 
 * Animation Flow:
 * Stage 1: Crescent moon rises with star
 * Stage 2: Mosque minarets emerge from mist
 * Stage 3: Islamic geometric patterns expand in sacred geometry
 * Stage 4: Green silk drapes part revealing nikah mandap
 * Stage 5: Arabic calligraphy frames couple names in gold
 */
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { pixelRatioCap, shouldUseShadows } from '../shared/deviceCaps';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SkipForward, Volume2, VolumeX } from 'lucide-react';

const STAGE_BOUNDARIES = [0, 2000, 4500, 6500, 8500, 10500];
const TOTAL_MS = STAGE_BOUNDARIES[STAGE_BOUNDARIES.length - 1];

const MARRIAGE_COLORS = {
  bg: '#F5EFE6',      // Warm cream background to match invitation
  green: '#355E3B',
  gold: '#D4AF37',
  white: '#2C2416',   // Dark text on light background
  emerald: '#50C878',
  star: '#FFD700'
};

const MuslimMarriageOpening = ({
  brideName = 'Aisha',
  groomName = 'Omar',
  monogram = 'A & O',
  subtitle = 'Islamic Nikah',
  particleCount = 250,
  onComplete,
}) => {
  const reduce = useReducedMotion();
  const containerRef = useRef(null);
  const stageRef = useRef(0);
  const sceneObjsRef = useRef(null);

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
    scene.fog = new THREE.Fog(MARRIAGE_COLORS.bg, 10, 25);
    
    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
    camera.position.set(0, 0, 8);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap()));
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = shouldUseShadows();
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xE8F5E9, 0.3));
    
    const l1 = new THREE.PointLight(MARRIAGE_COLORS.emerald, 1.8, 18);
    l1.position.set(-4, 5, 3);
    scene.add(l1);
    
    const l2 = new THREE.PointLight(MARRIAGE_COLORS.gold, 1.8, 18);
    l2.position.set(4, 5, 3);
    scene.add(l2);

    // Stage 1: Crescent moon and star
    const moonGroup = new THREE.Group();
    
    const crescentShape = new THREE.Shape();
    const radius = 0.6;
    crescentShape.absarc(0, 0, radius, 0, Math.PI * 2, false);
    const holePath = new THREE.Path();
    holePath.absarc(0.15, 0.1, radius * 0.8, 0, Math.PI * 2, false);
    crescentShape.holes.push(holePath);
    
    const crescentGeom = new THREE.ShapeGeometry(crescentShape);
    const crescentMat = new THREE.MeshStandardMaterial({
      color: MARRIAGE_COLORS.white,
      emissive: MARRIAGE_COLORS.white,
      emissiveIntensity: 0.6,
      side: THREE.DoubleSide
    });
    const crescent = new THREE.Mesh(crescentGeom, crescentMat);
    crescent.rotation.z = -Math.PI / 6;
    moonGroup.add(crescent);
    
    const starGeom = new THREE.SphereGeometry(0.12, 16, 16);
    const starMat = new THREE.MeshStandardMaterial({
      color: MARRIAGE_COLORS.star,
      emissive: MARRIAGE_COLORS.star,
      emissiveIntensity: 0.8
    });
    const star = new THREE.Mesh(starGeom, starMat);
    star.position.set(0.7, 0.5, 0);
    moonGroup.add(star);
    
    moonGroup.position.set(0, 3, 0);
    moonGroup.scale.set(0, 0, 0);
    scene.add(moonGroup);

    // Stage 2: Mosque minarets
    const minarets = [];
    for (let i = 0; i < 2; i++) {
      const minaretGroup = new THREE.Group();
      
      const baseGeom = new THREE.CylinderGeometry(0.2, 0.25, 3, 16);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0xF5F5DC,
        roughness: 0.7
      });
      const base = new THREE.Mesh(baseGeom, baseMat);
      minaretGroup.add(base);
      
      const domeGeom = new THREE.SphereGeometry(0.3, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const domeMat = new THREE.MeshStandardMaterial({
        color: MARRIAGE_COLORS.emerald,
        metalness: 0.5,
        roughness: 0.3
      });
      const dome = new THREE.Mesh(domeGeom, domeMat);
      dome.position.y = 1.5;
      minaretGroup.add(dome);
      
      const spireGeom = new THREE.ConeGeometry(0.1, 0.4, 8);
      const spire = new THREE.Mesh(spireGeom, new THREE.MeshStandardMaterial({ color: MARRIAGE_COLORS.gold, metalness: 0.9 }));
      spire.position.y = 1.9;
      minaretGroup.add(spire);
      
      minaretGroup.position.set(i === 0 ? -2.5 : 2.5, -5, -2);
      scene.add(minaretGroup);
      minarets.push(minaretGroup);
    }

    // Stage 3: Islamic geometric patterns
    const patterns = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const patternGeom = new THREE.TorusGeometry(0.3, 0.05, 16, 100);
      const patternMat = new THREE.MeshBasicMaterial({
        color: MARRIAGE_COLORS.gold,
        transparent: true,
        opacity: 0
      });
      const pattern = new THREE.Mesh(patternGeom, patternMat);
      pattern.position.set(Math.cos(angle) * 2, Math.sin(angle) * 2, 0);
      pattern.rotation.z = angle;
      scene.add(pattern);
      patterns.push(pattern);
    }

    // Stage 4: Green silk drapes
    const drapes = [];
    for (let side of [-1, 1]) {
      const drapeGeom = new THREE.PlaneGeometry(3, 6);
      const drapeMat = new THREE.MeshStandardMaterial({
        color: MARRIAGE_COLORS.green,
        side: THREE.DoubleSide,
        metalness: 0.7,
        roughness: 0.3
      });
      const drape = new THREE.Mesh(drapeGeom, drapeMat);
      drape.position.set(side * 0.1, 0, 1);
      drape.userData = { side };
      scene.add(drape);
      drapes.push(drape);
    }

    // Particles
    const particlesGeom = new THREE.BufferGeometry();
    const particlesArr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlesArr[i * 3] = (Math.random() - 0.5) * 15;
      particlesArr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      particlesArr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    particlesGeom.setAttribute('position', new THREE.BufferAttribute(particlesArr, 3));
    const particlesMat = new THREE.PointsMaterial({
      color: MARRIAGE_COLORS.emerald,
      size: 0.06,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particlesGeom, particlesMat);
    scene.add(particles);

    sceneObjsRef.current = {
      scene, camera, renderer, moonGroup, minarets, patterns, drapes, particles, star
    };
  };

  const animate = (elapsed) => {
    const objs = sceneObjsRef.current;
    if (!objs) return;

    const { scene, camera, renderer, moonGroup, minarets, patterns, drapes, particles, star } = objs;

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

    // Stage 1: Moon and star rise
    if (elapsed >= 0) {
      const t1 = Math.min(elapsed / STAGE_BOUNDARIES[1], 1);
      moonGroup.scale.setScalar(t1);
      moonGroup.rotation.z = -Math.PI / 6 + Math.sin(elapsed * 0.001) * 0.1;
      
      const starPulse = 1 + Math.sin(elapsed * 0.005) * 0.2;
      star.scale.setScalar(starPulse);
    }

    // Stage 2: Minarets rise
    if (elapsed >= STAGE_BOUNDARIES[1]) {
      const t2 = Math.min((elapsed - STAGE_BOUNDARIES[1]) / (STAGE_BOUNDARIES[2] - STAGE_BOUNDARIES[1]), 1);
      minarets.forEach((minaret, i) => {
        const delay = i * 0.2;
        if (t2 > delay) {
          const minaretT = Math.min((t2 - delay) / 0.8, 1);
          minaret.position.y = -5 + minaretT * 5;
        }
      });
    }

    // Stage 3: Patterns expand
    if (elapsed >= STAGE_BOUNDARIES[2]) {
      const t3 = Math.min((elapsed - STAGE_BOUNDARIES[2]) / (STAGE_BOUNDARIES[3] - STAGE_BOUNDARIES[2]), 1);
      patterns.forEach((pattern, i) => {
        const delay = (i / patterns.length) * 0.5;
        if (t3 > delay) {
          const patternT = Math.min((t3 - delay) / 0.5, 1);
          pattern.material.opacity = patternT * 0.8;
          pattern.scale.setScalar(0.5 + patternT * 0.5);
          pattern.rotation.y = patternT * Math.PI * 2;
        }
      });
    }

    // Stage 4: Drapes part
    if (elapsed >= STAGE_BOUNDARIES[3]) {
      const t4 = Math.min((elapsed - STAGE_BOUNDARIES[3]) / (STAGE_BOUNDARIES[4] - STAGE_BOUNDARIES[3]), 1);
      drapes.forEach(drape => {
        drape.position.x = drape.userData.side * (0.1 + t4 * 3.5);
      });
    }

    particles.rotation.y += 0.001;
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
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });
    if (objs.renderer.domElement?.parentNode) {
      objs.renderer.domElement.parentNode.removeChild(objs.renderer.domElement);
    }
    sceneObjsRef.current = null;
  };

  useEffect(() => () => cleanup(), []);

  const handleTap = () => {
    if (tapped) return;
    setTapped(true);
    initScene();
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

  if (reduce) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden" style={{ background: MARRIAGE_COLORS.bg }}>
      <div ref={containerRef} className="absolute inset-0" />
      
      {!tapped && (
        <motion.div className="absolute inset-0 grid place-items-center cursor-pointer" onClick={handleTap}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div className="text-center space-y-4" animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}>
            <div className="text-sm tracking-[0.3em] uppercase" style={{ color: MARRIAGE_COLORS.white }}>
              Islamic Nikah
            </div>
            <div className="text-xs opacity-70" style={{ color: MARRIAGE_COLORS.emerald }}>
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
                  style={{ color: MARRIAGE_COLORS.gold, textShadow: `0 0 40px ${MARRIAGE_COLORS.emerald}, 0 2px 4px rgba(0,0,0,0.8)` }}>
                  {brideName}
                </div>
                <div className="text-3xl md:text-4xl" style={{ color: MARRIAGE_COLORS.white }}>
                  &
                </div>
                <div className="text-5xl md:text-6xl font-serif font-bold tracking-wide"
                  style={{ color: MARRIAGE_COLORS.gold, textShadow: `0 0 40px ${MARRIAGE_COLORS.emerald}, 0 2px 4px rgba(0,0,0,0.8)` }}>
                  {groomName}
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                className="text-sm tracking-[0.3em] uppercase" style={{ color: MARRIAGE_COLORS.emerald }}>
                {subtitle}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {tapped && (
        <div className="absolute top-6 right-6 z-10 flex gap-3">
          <button onClick={() => setAudioOn(!audioOn)}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm grid place-items-center hover:bg-black/50"
            style={{ color: MARRIAGE_COLORS.white }}>
            {audioOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          {showSkip && !done && (
            <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              onClick={() => finish()}
              className="px-4 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center gap-2 hover:bg-black/50 text-sm"
              style={{ color: MARRIAGE_COLORS.white }}>
              <span>Skip</span>
              <SkipForward size={16} />
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
};

export default MuslimMarriageOpening;