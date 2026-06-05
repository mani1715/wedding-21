/**
 * NatureHaldiOpening — Sunflower-field haldi
 * Sunflower field bloom → dewdrops glisten → turmeric burst → names.
 */
import { createThemeOpening } from '../shared/createThemeOpening';
import { createNatureSoundController } from './nature.sounds';

const palette = {
  bg: '#2A1F00',
  accent: '#FFD54F',
  primary: '#FFC107',
  secondary: '#558B2F',
  text: '#FFF8DC',
};

const NatureHaldiOpening = createThemeOpening({
  palette,
  intro: { title: 'Sunflower Haldi', cta: 'Tap to Begin', finalSubtitle: 'Golden Beginnings', testid: 'nature-haldi' },
  ambient: 0xFFD580,
  ambientIntensity: 0.6,
  soundFactory: createNatureSoundController,
  audioVolume: 0.55,
  onStageChange: (stage, ctl) => {
    if (stage === 1 && ctl?.chirp) ctl.chirp();
  },
  setupScene: (scene, { THREE, particleCount }) => {
    const sun = new THREE.PointLight(palette.accent, 3.2, 22);
    sun.position.set(0, 6, 3); scene.add(sun);
    const warm = new THREE.PointLight(palette.primary, 1.6, 18);
    warm.position.set(-3, 2, 4); scene.add(warm);

    // Field plane
    const field = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 10),
      new THREE.MeshStandardMaterial({ color: 0x3A5410, roughness: 0.85 })
    );
    field.rotation.x = -Math.PI / 2;
    field.position.y = -1.8;
    scene.add(field);

    // Sunflowers (rows)
    const sunflowers = [];
    for (let i = 0; i < 22; i++) {
      const sf = new THREE.Group();
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.06, 1.5, 8),
        new THREE.MeshStandardMaterial({ color: palette.secondary, roughness: 0.8 })
      );
      stem.position.y = -0.75;
      sf.add(stem);
      const head = new THREE.Mesh(
        new THREE.CircleGeometry(0.25, 16),
        new THREE.MeshStandardMaterial({
          color: palette.accent, emissive: palette.accent, emissiveIntensity: 0.4, side: THREE.DoubleSide,
        })
      );
      sf.add(head);
      const center = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 14, 14),
        new THREE.MeshStandardMaterial({ color: 0x6E3A0E, roughness: 0.85 })
      );
      sf.add(center);
      sf.position.set(-7 + (i % 11) * 1.4, -1, -1.5 - Math.floor(i / 11) * 1.2);
      sf.userData = { phase: Math.random() * Math.PI * 2, head };
      sf.scale.set(0, 0, 0);
      scene.add(sf);
      sunflowers.push(sf);
    }

    // Dewdrops (small glistening spheres)
    const drops = [];
    for (let i = 0; i < 24; i++) {
      const drop = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 12, 12),
        new THREE.MeshPhysicalMaterial({
          color: 0xFFFFFF, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.7,
          transmission: 0.8, emissive: 0xFFFFFF, emissiveIntensity: 0.3,
        })
      );
      drop.position.set((Math.random() - 0.5) * 10, -0.8 + Math.random() * 2, (Math.random() - 0.5) * 4);
      drop.userData = { phase: Math.random() * Math.PI * 2 };
      drop.scale.set(0, 0, 0);
      scene.add(drop);
      drops.push(drop);
    }

    // Turmeric burst
    const burstGeom = new THREE.BufferGeometry();
    // PHASE 7 (perf): floor lowered 380→152 so scaleParticles() can actually take effect on mobile.
    const cnt = Math.max(particleCount, 152);
    const arr = new Float32Array(cnt * 3);
    const vel = new Float32Array(cnt * 3);
    for (let i = 0; i < cnt; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 0.4;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 0.4;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
      const dir = [Math.random() - 0.5, Math.random() - 0.2, Math.random() - 0.5];
      const n = Math.hypot(...dir);
      vel[i * 3] = (dir[0] / n) * (0.04 + Math.random() * 0.05);
      vel[i * 3 + 1] = (dir[1] / n) * (0.04 + Math.random() * 0.05);
      vel[i * 3 + 2] = (dir[2] / n) * (0.04 + Math.random() * 0.05);
    }
    burstGeom.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const burst = new THREE.Points(burstGeom, new THREE.PointsMaterial({
      color: palette.primary, size: 0.13, transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
    }));
    burst.userData = { vel, cnt };
    scene.add(burst);

    return {
      animate: (elapsed, stage, stages) => {
        if (elapsed >= stages[0]) {
          const t = Math.min(elapsed / stages[1], 1);
          sunflowers.forEach((sf, i) => {
            const delay = (i / sunflowers.length) * 0.5;
            if (t > delay) {
              const ts = Math.min((t - delay) / 0.4, 1);
              sf.scale.setScalar(ts);
              sf.userData.head.rotation.z = Math.sin(elapsed * 0.002 + sf.userData.phase) * 0.15;
            }
          });
        }
        if (elapsed >= stages[1]) {
          const t = Math.min((elapsed - stages[1]) / (stages[2] - stages[1]), 1);
          drops.forEach((d, i) => {
            const delay = (i / drops.length) * 0.5;
            if (t > delay) {
              d.scale.setScalar(Math.min((t - delay) / 0.4, 1));
              d.position.y += Math.sin(elapsed * 0.002 + d.userData.phase) * 0.003;
            }
          });
        }
        if (elapsed >= stages[2]) {
          const t = Math.min((elapsed - stages[2]) / (stages[4] - stages[2]), 1);
          burst.material.opacity = Math.min(t * 1.5, 0.9);
          const pos = burst.geometry.attributes.position.array;
          for (let i = 0; i < burst.userData.cnt; i++) {
            pos[i * 3] += burst.userData.vel[i * 3];
            pos[i * 3 + 1] += burst.userData.vel[i * 3 + 1] - 0.001;
            pos[i * 3 + 2] += burst.userData.vel[i * 3 + 2];
          }
          burst.geometry.attributes.position.needsUpdate = true;
        }
      },
    };
  },
});

export default NatureHaldiOpening;
