/**
 * BengaliEngagementOpening — Romantic Bengali engagement
 * Alpana mandala blooms → lotus opens → golden light → names.
 */
import { createThemeOpening } from '../shared/createThemeOpening';
import { createBengaliSoundController } from './bengali.sounds';

const palette = {
  bg: '#0D0707',
  accent: '#FFD700',
  primary: '#FF1744',
  secondary: '#FFE0B2',
  text: '#FFEFC2',
};

const BengaliEngagementOpening = createThemeOpening({
  palette,
  intro: { title: 'Bengali Engagement', cta: 'Tap to Begin', finalSubtitle: 'Aashirbaad · Blessings', testid: 'bengali-engagement' },
  ambient: 0xFFEFD5,
  ambientIntensity: 0.5,
  soundFactory: createBengaliSoundController,
  audioVolume: 0.45,
  onStageChange: (stage, ctl) => {
    if (stage === 2 && ctl?.shankha) ctl.shankha();
  },
  setupScene: (scene, { THREE, particleCount }) => {
    const l1 = new THREE.PointLight(palette.accent, 2, 18);
    l1.position.set(0, 4, 4); scene.add(l1);
    const l2 = new THREE.PointLight(palette.primary, 1.3, 18);
    l2.position.set(-3, 2, 3); scene.add(l2);

    // Lotus flower (petals open)
    const lotus = new THREE.Group();
    const petalMat = new THREE.MeshStandardMaterial({
      color: palette.secondary,
      emissive: palette.primary,
      emissiveIntensity: 0.25,
      roughness: 0.5,
      side: THREE.DoubleSide,
    });
    const petals = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 12, 0, Math.PI), petalMat.clone());
      petal.position.set(Math.cos(a) * 0.4, 0, Math.sin(a) * 0.4);
      petal.rotation.y = -a;
      petal.userData = { baseAngle: a };
      lotus.add(petal);
      petals.push(petal);
    }
    const lotusCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 16, 16),
      new THREE.MeshStandardMaterial({ color: palette.accent, emissive: palette.accent, emissiveIntensity: 0.6 })
    );
    lotus.add(lotusCore);
    lotus.position.set(0, 0, 0);
    lotus.scale.set(0, 0, 0);
    scene.add(lotus);

    // Concentric alpana rings on the floor
    const rings = [];
    for (let r = 0; r < 5; r++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.9 + r * 0.6, 0.03, 16, 60),
        new THREE.MeshStandardMaterial({
          color: r % 2 ? palette.secondary : palette.accent,
          transparent: true,
          opacity: 0,
        })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -2;
      scene.add(ring);
      rings.push(ring);
    }

    // Floating golden lamps
    const lamps = [];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const lamp = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 12, 12),
        new THREE.MeshStandardMaterial({ color: palette.accent, emissive: palette.accent, emissiveIntensity: 0.8 })
      );
      lamp.position.set(Math.cos(a) * 4, 0, Math.sin(a) * 4);
      lamp.userData = { angle: a, phase: Math.random() * Math.PI * 2 };
      lamp.scale.set(0, 0, 0);
      scene.add(lamp);
      lamps.push(lamp);
    }

    // Drifting motes
    const motesGeom = new THREE.BufferGeometry();
    const arr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 15;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    motesGeom.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const motes = new THREE.Points(motesGeom, new THREE.PointsMaterial({
      color: palette.accent, size: 0.05, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending,
    }));
    scene.add(motes);

    return {
      animate: (elapsed, stage, stages) => {
        if (elapsed >= stages[0]) {
          const t = Math.min(elapsed / stages[2], 1);
          rings.forEach((r, i) => {
            const delay = i * 0.12;
            if (t > delay) r.material.opacity = Math.min((t - delay) / 0.5, 1) * 0.7;
          });
        }
        if (elapsed >= stages[1]) {
          const t = Math.min((elapsed - stages[1]) / (stages[2] - stages[1]), 1);
          lotus.scale.setScalar(t);
          lotus.rotation.y = elapsed * 0.0006;
          petals.forEach((p) => {
            p.rotation.x = -t * Math.PI * 0.35;
          });
        }
        if (elapsed >= stages[2]) {
          const t = Math.min((elapsed - stages[2]) / (stages[4] - stages[2]), 1);
          lamps.forEach((lp, i) => {
            const delay = (i / lamps.length) * 0.6;
            if (t > delay) {
              const ts = Math.min((t - delay) / 0.4, 1);
              lp.scale.setScalar(ts);
              lp.position.y = Math.sin(elapsed * 0.0015 + lp.userData.phase) * 1.5;
            }
          });
        }
        motes.rotation.y += 0.0008;
      },
    };
  },
});

export default BengaliEngagementOpening;
