/**
 * NatureEngagementOpening — Garden engagement under blooming arch
 * Rose buds open → garden swing → fireflies emerge → names.
 */
import { createThemeOpening } from '../shared/createThemeOpening';
import { createNatureSoundController } from './nature.sounds';

const palette = {
  bg: '#0A1A0A',
  accent: '#FFB6C1',
  primary: '#E91E63',
  secondary: '#CDDC39',
  text: '#FFE9F0',
};

const NatureEngagementOpening = createThemeOpening({
  palette,
  intro: { title: 'Garden Engagement', cta: 'Tap to Begin', finalSubtitle: 'A Promise in Bloom', testid: 'nature-engagement' },
  ambient: 0x88AA55,
  ambientIntensity: 0.45,
  soundFactory: createNatureSoundController,
  audioVolume: 0.5,
  onStageChange: (stage, ctl) => {
    if (stage === 2 && ctl?.chirp) ctl.chirp();
  },
  setupScene: (scene, { THREE, particleCount }) => {
    const l1 = new THREE.PointLight(palette.accent, 2, 20);
    l1.position.set(0, 5, 4); scene.add(l1);
    const l2 = new THREE.PointLight(palette.primary, 1.4, 18);
    l2.position.set(-3, 2, 3); scene.add(l2);

    // Floral arch made of vines + roses
    const archGroup = new THREE.Group();
    const vineMat = new THREE.MeshStandardMaterial({ color: 0x2E5D2E, roughness: 0.7 });
    for (let s = -1; s <= 1; s += 2) {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 3.5, 8), vineMat.clone());
      stem.position.set(s * 1.8, 0, 0);
      archGroup.add(stem);
    }
    const archTop = new THREE.Mesh(
      new THREE.TorusGeometry(1.8, 0.07, 10, 32, Math.PI),
      vineMat.clone()
    );
    archTop.position.set(0, 1.75, 0);
    archGroup.add(archTop);

    const roses = [];
    for (let i = 0; i < 22; i++) {
      const t = i / 22;
      const a = Math.PI - t * Math.PI;
      const rose = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 12, 12),
        new THREE.MeshStandardMaterial({
          color: [palette.primary, palette.accent, 0xFFFFFF][i % 3],
          emissive: palette.primary, emissiveIntensity: 0.2,
        })
      );
      rose.position.set(Math.cos(a) * 1.8, 1.75 + Math.sin(a) * 1.8, 0);
      rose.userData = { baseScale: 0.5 + Math.random() * 0.6 };
      rose.scale.setScalar(0);
      archGroup.add(rose);
      roses.push(rose);
    }
    archGroup.position.set(0, -1.5, 0);
    archGroup.scale.set(0, 0, 0);
    scene.add(archGroup);

    // Garden swing (hanging)
    const swingGroup = new THREE.Group();
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.05, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x6B3410, roughness: 0.7 })
    );
    swingGroup.add(seat);
    for (let s = -1; s <= 1; s += 2) {
      const rope = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 2, 6),
        new THREE.MeshStandardMaterial({ color: 0x8B6F47 })
      );
      rope.position.set(s * 0.5, 1, 0);
      swingGroup.add(rope);
    }
    swingGroup.position.set(0, -0.5, 0);
    swingGroup.scale.set(0, 0, 0);
    scene.add(swingGroup);

    // Fireflies
    const fireflies = [];
    for (let i = 0; i < 22; i++) {
      const ff = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 8),
        new THREE.MeshStandardMaterial({
          color: palette.secondary, emissive: palette.secondary, emissiveIntensity: 1.5, transparent: true, opacity: 0,
        })
      );
      ff.position.set((Math.random() - 0.5) * 10, Math.random() * 4 - 1, (Math.random() - 0.5) * 6);
      ff.userData = { phase: Math.random() * Math.PI * 2, speed: 0.001 + Math.random() * 0.002 };
      scene.add(ff);
      fireflies.push(ff);
    }

    // Petals drifting
    const petalGeom = new THREE.BufferGeometry();
    const arr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 14;
      arr[i * 3 + 1] = Math.random() * 8;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    petalGeom.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const petals = new THREE.Points(petalGeom, new THREE.PointsMaterial({
      color: palette.accent, size: 0.08, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending,
    }));
    scene.add(petals);

    return {
      animate: (elapsed, stage, stages) => {
        if (elapsed >= stages[0]) {
          const t = Math.min(elapsed / stages[1], 1);
          archGroup.scale.setScalar(t);
        }
        if (elapsed >= stages[1]) {
          const t = Math.min((elapsed - stages[1]) / (stages[2] - stages[1]), 1);
          roses.forEach((r, i) => {
            const delay = (i / roses.length) * 0.6;
            if (t > delay) r.scale.setScalar(Math.min((t - delay) / 0.4, 1) * r.userData.baseScale);
          });
        }
        if (elapsed >= stages[2]) {
          const t = Math.min((elapsed - stages[2]) / (stages[3] - stages[2]), 1);
          swingGroup.scale.setScalar(t);
          swingGroup.rotation.z = Math.sin(elapsed * 0.002) * 0.15;
        }
        if (elapsed >= stages[3]) {
          const t = Math.min((elapsed - stages[3]) / (stages[5] - stages[3]), 1);
          fireflies.forEach((ff) => {
            ff.material.opacity = t * (0.5 + Math.sin(elapsed * 0.005 + ff.userData.phase) * 0.5);
            ff.position.y += Math.sin(elapsed * ff.userData.speed + ff.userData.phase) * 0.01;
            ff.position.x += Math.cos(elapsed * ff.userData.speed + ff.userData.phase) * 0.005;
          });
        }
        // Petals fall
        const ps = petals.geometry.attributes.position.array;
        for (let i = 0; i < ps.length; i += 3) {
          ps[i + 1] -= 0.012;
          if (ps[i + 1] < -3) ps[i + 1] = 7;
        }
        petals.geometry.attributes.position.needsUpdate = true;
      },
    };
  },
});

export default NatureEngagementOpening;
