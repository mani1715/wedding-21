/**
 * PunjabiReceptionOpening — Lively bhangra reception
 * Dhol drums spin → garlands sway → confetti burst → names.
 */
import { createThemeOpening } from '../shared/createThemeOpening';
import { createPunjabiSoundController } from './punjabi.sounds';

const palette = {
  bg: '#1A0500',
  accent: '#FFD700',
  primary: '#DC143C',
  secondary: '#FF9933',
  text: '#FFF6D5',
};

const PunjabiReceptionOpening = createThemeOpening({
  palette,
  intro: { title: 'Punjabi Reception', cta: 'Tap to Begin', finalSubtitle: 'A Night of Bhangra & Joy', testid: 'punjabi-reception' },
  ambient: 0xFFE6D5,
  ambientIntensity: 0.55,
  soundFactory: createPunjabiSoundController,
  audioVolume: 0.6,
  onStageChange: (stage, ctl, stages) => {
    // Big bhangra burst when confetti drops (stage 3)
    if (stage === 3 && ctl?.bigHit) ctl.bigHit();
  },
  setupScene: (scene, { THREE, particleCount }) => {
    const pl1 = new THREE.PointLight(palette.accent, 2, 18);
    pl1.position.set(-3, 4, 4);
    scene.add(pl1);
    const pl2 = new THREE.PointLight(palette.primary, 2, 18);
    pl2.position.set(3, 4, 4);
    scene.add(pl2);
    const stageLight = new THREE.SpotLight(0xFFFFFF, 2.5, 25, Math.PI / 5);
    stageLight.position.set(0, 8, 4);
    stageLight.target.position.set(0, 0, 0);
    scene.add(stageLight, stageLight.target);

    // Dhol drum
    const dholGroup = new THREE.Group();
    const dholBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 1, 1.4, 24),
      new THREE.MeshStandardMaterial({ color: 0x6B2A0F, roughness: 0.6, metalness: 0.2 })
    );
    dholBody.rotation.z = Math.PI / 2;
    dholGroup.add(dholBody);
    for (let i = 0; i < 12; i++) {
      const stud = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 12, 12),
        new THREE.MeshStandardMaterial({ color: palette.accent, metalness: 0.9, roughness: 0.1 })
      );
      const a = (i / 12) * Math.PI * 2;
      stud.position.set(0.71, Math.sin(a) * 0.55, Math.cos(a) * 0.55);
      dholGroup.add(stud);
      const studR = stud.clone();
      studR.position.x = -0.71;
      dholGroup.add(studR);
    }
    dholGroup.position.set(0, -0.5, 0);
    dholGroup.scale.set(0, 0, 0);
    scene.add(dholGroup);

    // Hanging garlands (marigold strings)
    const garlands = [];
    for (let g = 0; g < 4; g++) {
      const garland = new THREE.Group();
      for (let i = 0; i < 18; i++) {
        const flower = new THREE.Mesh(
          new THREE.SphereGeometry(0.1, 10, 10),
          new THREE.MeshStandardMaterial({
            color: i % 2 ? palette.secondary : palette.accent,
            emissive: palette.secondary,
            emissiveIntensity: 0.2,
          })
        );
        flower.position.y = -i * 0.3;
        garland.add(flower);
      }
      garland.position.set(-3 + g * 2, 4, -1);
      garland.scale.set(0, 0, 0);
      scene.add(garland);
      garlands.push(garland);
    }

    // Confetti
    const confetti = [];
    for (let i = 0; i < 80; i++) {
      const c = new THREE.Mesh(
        new THREE.PlaneGeometry(0.12, 0.18),
        new THREE.MeshBasicMaterial({
          color: [palette.accent, palette.primary, palette.secondary, 0x00FF88, 0x0088FF][i % 5],
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0,
        })
      );
      c.position.set((Math.random() - 0.5) * 12, 8 + Math.random() * 4, (Math.random() - 0.5) * 6);
      c.userData = { vy: -0.02 - Math.random() * 0.04, vr: (Math.random() - 0.5) * 0.1 };
      scene.add(c);
      confetti.push(c);
    }

    // Sparkle particles
    const sparkGeom = new THREE.BufferGeometry();
    const sparkArr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      sparkArr[i * 3] = (Math.random() - 0.5) * 15;
      sparkArr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      sparkArr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    sparkGeom.setAttribute('position', new THREE.BufferAttribute(sparkArr, 3));
    const sparks = new THREE.Points(sparkGeom, new THREE.PointsMaterial({
      color: palette.accent, size: 0.08, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending,
    }));
    scene.add(sparks);

    return {
      animate: (elapsed, stage, stages) => {
        if (elapsed >= stages[0]) {
          const t = Math.min(elapsed / stages[1], 1);
          dholGroup.scale.setScalar(t);
          dholGroup.rotation.x = elapsed * 0.0025;
        }
        if (elapsed >= stages[1]) {
          const t = Math.min((elapsed - stages[1]) / (stages[2] - stages[1]), 1);
          garlands.forEach((g, i) => {
            const delay = i * 0.15;
            if (t > delay) {
              const ts = Math.min((t - delay) / 0.6, 1);
              g.scale.setScalar(ts);
              g.rotation.z = Math.sin(elapsed * 0.001 + i) * 0.12;
            }
          });
        }
        if (elapsed >= stages[2]) {
          confetti.forEach((c) => {
            c.material.opacity = 1;
            c.position.y += c.userData.vy;
            c.rotation.z += c.userData.vr;
            if (c.position.y < -5) c.position.y = 8;
          });
        }
        sparks.rotation.y += 0.0018;
      },
    };
  },
});

export default PunjabiReceptionOpening;
