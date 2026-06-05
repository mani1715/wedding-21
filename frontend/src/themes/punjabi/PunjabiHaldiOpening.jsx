/**
 * PunjabiHaldiOpening — Vibrant haldi/sangeet/mehendi
 * Turmeric splash → marigold bloom → color explosion → names.
 */
import { createThemeOpening } from '../shared/createThemeOpening';
import { createPunjabiSoundController } from './punjabi.sounds';

const palette = {
  bg: '#1F0F00',
  accent: '#FFD700',
  primary: '#FF9933',
  secondary: '#FFEB3B',
  text: '#FFF8DC',
};

const PunjabiHaldiOpening = createThemeOpening({
  palette,
  intro: { title: 'Haldi · Sangeet · Mehendi', cta: 'Tap to Begin', finalSubtitle: 'A Burst of Colour & Joy', testid: 'punjabi-haldi' },
  ambient: 0xFFE6B5,
  ambientIntensity: 0.6,
  soundFactory: createPunjabiSoundController,
  audioVolume: 0.65,
  onStageChange: (stage, ctl) => {
    if (stage === 3 && ctl?.bigHit) ctl.bigHit();
  },
  setupScene: (scene, { THREE, particleCount }) => {
    const sun = new THREE.PointLight(palette.accent, 3, 20);
    sun.position.set(0, 6, 4);
    scene.add(sun);
    const warm = new THREE.PointLight(palette.primary, 1.6, 18);
    warm.position.set(-3, 2, 3);
    scene.add(warm);

    // Big turmeric mandala (rotating disk)
    const mandala = new THREE.Group();
    for (let r = 0; r < 4; r++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.5 + r * 0.5, 0.04, 16, 60),
        new THREE.MeshStandardMaterial({
          color: r % 2 ? palette.accent : palette.primary,
          emissive: palette.primary,
          emissiveIntensity: 0.4,
          metalness: 0.4,
          roughness: 0.4,
        })
      );
      mandala.add(ring);
    }
    mandala.position.set(0, 0, -1);
    mandala.scale.set(0, 0, 0);
    scene.add(mandala);

    // Marigold blossoms (instanced spheres)
    const blossoms = [];
    for (let i = 0; i < 28; i++) {
      const blossom = new THREE.Group();
      const center = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 14, 14),
        new THREE.MeshStandardMaterial({ color: palette.accent, emissive: palette.accent, emissiveIntensity: 0.3 })
      );
      blossom.add(center);
      for (let p = 0; p < 8; p++) {
        const petal = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 10, 10),
          new THREE.MeshStandardMaterial({ color: palette.primary })
        );
        const a = (p / 8) * Math.PI * 2;
        petal.position.set(Math.cos(a) * 0.16, Math.sin(a) * 0.16, 0);
        blossom.add(petal);
      }
      blossom.userData = {
        angle: Math.random() * Math.PI * 2,
        radius: 2 + Math.random() * 2.5,
        ySpeed: 0.0006 + Math.random() * 0.001,
        yBase: -2 + Math.random() * 4,
        spin: 0.5 + Math.random() * 1.5,
      };
      blossom.scale.set(0, 0, 0);
      scene.add(blossom);
      blossoms.push(blossom);
    }

    // Powder burst particles (high count)
    const burstGeom = new THREE.BufferGeometry();
    // PHASE 7 (perf): floor lowered 350→140 so scaleParticles() can actually take effect on mobile.
    const cnt = Math.max(particleCount, 140);
    const arr = new Float32Array(cnt * 3);
    const vel = new Float32Array(cnt * 3);
    const cols = new Float32Array(cnt * 3);
    for (let i = 0; i < cnt; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 0.4;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 0.4;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
      const dir = [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5];
      const n = Math.hypot(...dir);
      vel[i * 3] = (dir[0] / n) * (0.04 + Math.random() * 0.06);
      vel[i * 3 + 1] = (dir[1] / n) * (0.04 + Math.random() * 0.06);
      vel[i * 3 + 2] = (dir[2] / n) * (0.04 + Math.random() * 0.06);
      const pick = [
        [1, 0.84, 0],   // gold
        [1, 0.6, 0.2],  // saffron
        [1, 0.92, 0.23],// yellow
      ][i % 3];
      cols[i * 3] = pick[0]; cols[i * 3 + 1] = pick[1]; cols[i * 3 + 2] = pick[2];
    }
    burstGeom.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    burstGeom.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    const burst = new THREE.Points(
      burstGeom,
      new THREE.PointsMaterial({ size: 0.13, vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending })
    );
    burst.userData = { vel, cnt };
    scene.add(burst);

    return {
      animate: (elapsed, stage, stages) => {
        if (elapsed >= stages[0]) {
          const t = Math.min(elapsed / stages[1], 1);
          mandala.scale.setScalar(t);
          mandala.rotation.z = elapsed * 0.0008;
          mandala.children.forEach((ring, i) => {
            ring.rotation.x = elapsed * 0.0005 * (i + 1);
          });
        }
        if (elapsed >= stages[1]) {
          const t = Math.min((elapsed - stages[1]) / (stages[3] - stages[1]), 1);
          blossoms.forEach((b, i) => {
            const delay = (i / blossoms.length) * 0.5;
            if (t > delay) {
              const ts = Math.min((t - delay) / 0.5, 1);
              b.scale.setScalar(ts);
              const a = b.userData.angle + elapsed * 0.0006 * b.userData.spin;
              b.position.x = Math.cos(a) * b.userData.radius;
              b.position.z = Math.sin(a) * b.userData.radius;
              b.position.y = b.userData.yBase + Math.sin(elapsed * b.userData.ySpeed) * 0.6;
              b.rotation.z = elapsed * 0.001;
            }
          });
        }
        if (elapsed >= stages[2]) {
          const t = Math.min((elapsed - stages[2]) / (stages[4] - stages[2]), 1);
          burst.material.opacity = Math.min(t * 1.5, 0.9);
          const pos = burst.geometry.attributes.position.array;
          for (let i = 0; i < burst.userData.cnt; i++) {
            pos[i * 3] += burst.userData.vel[i * 3];
            pos[i * 3 + 1] += burst.userData.vel[i * 3 + 1];
            pos[i * 3 + 2] += burst.userData.vel[i * 3 + 2];
          }
          burst.geometry.attributes.position.needsUpdate = true;
        }
      },
    };
  },
});

export default PunjabiHaldiOpening;
