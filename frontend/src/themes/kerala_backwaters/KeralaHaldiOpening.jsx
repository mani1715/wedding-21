/**
 * KeralaHaldiOpening — Kerala traditional haldi
 * Banana leaves unfurl → turmeric pot opens → jasmine garland → color burst → names.
 */
import { createThemeOpening } from '../shared/createThemeOpening';
import { createKeralaSoundController } from './kerala.sounds';

const palette = {
  bg: '#1F1A05',
  accent: '#FFD54F',
  primary: '#FFC107',
  secondary: '#2E7D32',
  text: '#FFF8DC',
};

const KeralaHaldiOpening = createThemeOpening({
  palette,
  intro: { title: 'Kerala Haldi', cta: 'Tap to Begin', finalSubtitle: 'Manjal · Golden Blessings', testid: 'kerala-haldi' },
  ambient: 0xFFD580,
  ambientIntensity: 0.6,
  soundFactory: createKeralaSoundController,
  audioVolume: 0.55,
  onStageChange: (stage, ctl) => {
    if (stage === 3 && ctl?.swell) ctl.swell();
  },
  setupScene: (scene, { THREE, particleCount }) => {
    const sun = new THREE.PointLight(palette.accent, 3, 22);
    sun.position.set(0, 5, 3); scene.add(sun);
    const warm = new THREE.PointLight(palette.primary, 1.5, 18);
    warm.position.set(-3, 2, 4); scene.add(warm);

    // Banana leaves unfurling
    const leaves = [];
    const leafMat = new THREE.MeshStandardMaterial({
      color: palette.secondary, side: THREE.DoubleSide, roughness: 0.6,
      emissive: 0x103820, emissiveIntensity: 0.2,
    });
    for (let i = 0; i < 5; i++) {
      const leaf = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 3.5, 1, 12), leafMat.clone());
      const a = ((i - 2) / 5) * Math.PI * 0.6;
      leaf.position.set(Math.sin(a) * 0.3, -0.6, -0.5);
      leaf.rotation.set(-Math.PI / 4, a, 0);
      leaf.scale.set(0, 0, 0);
      scene.add(leaf);
      leaves.push(leaf);
    }

    // Turmeric pot
    const pot = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 24, 24),
      new THREE.MeshStandardMaterial({ color: 0xC97E3D, metalness: 0.7, roughness: 0.3, emissive: 0x6E3A0E, emissiveIntensity: 0.4 })
    );
    body.scale.y = 0.85;
    pot.add(body);
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.05, 12, 32),
      new THREE.MeshStandardMaterial({ color: palette.accent, metalness: 0.95, roughness: 0.05 })
    );
    rim.position.y = 0.35;
    rim.rotation.x = Math.PI / 2;
    pot.add(rim);
    const turmericTop = new THREE.Mesh(
      new THREE.CircleGeometry(0.4, 24),
      new THREE.MeshStandardMaterial({ color: palette.primary, emissive: palette.primary, emissiveIntensity: 0.6 })
    );
    turmericTop.rotation.x = -Math.PI / 2;
    turmericTop.position.y = 0.34;
    pot.add(turmericTop);
    pot.position.set(0, -0.5, 0);
    pot.scale.set(0, 0, 0);
    scene.add(pot);

    // Jasmine garland (string of white spheres)
    const garland = new THREE.Group();
    for (let i = 0; i < 30; i++) {
      const t = i / 29;
      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: 0xFFEFC2, emissiveIntensity: 0.4 })
      );
      const a = Math.PI * (1 - t);
      flower.position.set(Math.cos(a) * 2, 1.5 + Math.sin(a) * 1.2, 0);
      garland.add(flower);
    }
    garland.scale.set(0, 0, 0);
    scene.add(garland);

    // Turmeric burst
    const burstGeom = new THREE.BufferGeometry();
    // PHASE 7 (perf): floor lowered 360→144 so scaleParticles() can actually take effect on mobile.
    const cnt = Math.max(particleCount, 144);
    const arr = new Float32Array(cnt * 3);
    const vel = new Float32Array(cnt * 3);
    for (let i = 0; i < cnt; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 0.4;
      arr[i * 3 + 1] = -0.2 + (Math.random() - 0.5) * 0.3;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
      const dir = [Math.random() - 0.5, Math.random() - 0.1, Math.random() - 0.5];
      const n = Math.hypot(...dir);
      vel[i * 3] = (dir[0] / n) * (0.04 + Math.random() * 0.05);
      vel[i * 3 + 1] = (dir[1] / n) * (0.04 + Math.random() * 0.06);
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
          leaves.forEach((l, i) => {
            const delay = i * 0.1;
            if (t > delay) {
              const ts = Math.min((t - delay) / 0.5, 1);
              l.scale.setScalar(ts);
              l.rotation.x = -Math.PI / 4 + Math.sin(elapsed * 0.001 + i) * 0.05;
            }
          });
        }
        if (elapsed >= stages[1]) {
          const t = Math.min((elapsed - stages[1]) / (stages[2] - stages[1]), 1);
          pot.scale.setScalar(t);
          pot.rotation.y = elapsed * 0.001;
        }
        if (elapsed >= stages[2]) {
          const t = Math.min((elapsed - stages[2]) / (stages[3] - stages[2]), 1);
          garland.scale.setScalar(t);
          garland.position.y = Math.sin(elapsed * 0.001) * 0.05;
        }
        if (elapsed >= stages[3]) {
          const t = Math.min((elapsed - stages[3]) / (stages[5] - stages[3]), 1);
          burst.material.opacity = Math.min(t * 1.5, 0.95);
          const ps = burst.geometry.attributes.position.array;
          for (let i = 0; i < burst.userData.cnt; i++) {
            ps[i * 3] += burst.userData.vel[i * 3];
            ps[i * 3 + 1] += burst.userData.vel[i * 3 + 1] - 0.001;
            ps[i * 3 + 2] += burst.userData.vel[i * 3 + 2];
          }
          burst.geometry.attributes.position.needsUpdate = true;
        }
      },
    };
  },
});

export default KeralaHaldiOpening;
