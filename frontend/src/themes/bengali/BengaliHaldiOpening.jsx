/**
 * BengaliHaldiOpening — Vibrant gaye holud (turmeric) ritual
 * Coconut leaf canopy → turmeric burst → alpana spirals → names.
 */
import { createThemeOpening } from '../shared/createThemeOpening';
import { createBengaliSoundController } from './bengali.sounds';

const palette = {
  bg: '#1F1006',
  accent: '#FFD700',
  primary: '#FF9800',
  secondary: '#FFEB3B',
  text: '#FFF8DC',
};

const BengaliHaldiOpening = createThemeOpening({
  palette,
  intro: { title: 'Gaye Holud', cta: 'Tap to Begin', finalSubtitle: 'A Golden Blessing', testid: 'bengali-haldi' },
  ambient: 0xFFE6B5,
  ambientIntensity: 0.55,
  soundFactory: createBengaliSoundController,
  audioVolume: 0.5,
  onStageChange: (stage, ctl) => {
    if (stage === 3 && ctl?.shankha) ctl.shankha();
  },
  setupScene: (scene, { THREE, particleCount }) => {
    const l1 = new THREE.PointLight(palette.accent, 2.5, 20);
    l1.position.set(0, 5, 3); scene.add(l1);
    const l2 = new THREE.PointLight(palette.primary, 1.6, 18);
    l2.position.set(-3, 2, 3); scene.add(l2);

    // Coconut leaf arch
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2E7D32, side: THREE.DoubleSide, roughness: 0.6 });
    const leaves = [];
    for (let i = 0; i < 14; i++) {
      const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 1.6), leafMat.clone());
      const a = (i / 14) * Math.PI - Math.PI / 2;
      leaf.position.set(Math.cos(a) * 3, Math.sin(a) * 2.5 + 1, -1);
      leaf.rotation.z = -a + Math.PI / 2;
      leaf.scale.set(0, 0, 0);
      scene.add(leaf);
      leaves.push(leaf);
    }

    // Central turmeric pot (kalash)
    const potGroup = new THREE.Group();
    const pot = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 20, 20),
      new THREE.MeshStandardMaterial({ color: 0xCE8B26, metalness: 0.7, roughness: 0.25, emissive: 0x553300, emissiveIntensity: 0.3 })
    );
    pot.scale.y = 0.85;
    potGroup.add(pot);
    const lid = new THREE.Mesh(
      new THREE.ConeGeometry(0.25, 0.4, 16),
      new THREE.MeshStandardMaterial({ color: palette.accent, metalness: 0.9, roughness: 0.05, emissive: palette.accent, emissiveIntensity: 0.4 })
    );
    lid.position.y = 0.55;
    potGroup.add(lid);
    potGroup.position.set(0, -0.5, 0);
    potGroup.scale.set(0, 0, 0);
    scene.add(potGroup);

    // Turmeric powder burst
    const burstGeom = new THREE.BufferGeometry();
    // PHASE 7 (perf): floor lowered 380→152 so scaleParticles() can actually take effect on mobile.
    const cnt = Math.max(particleCount, 152);
    const arr = new Float32Array(cnt * 3);
    const vel = new Float32Array(cnt * 3);
    const cols = new Float32Array(cnt * 3);
    for (let i = 0; i < cnt; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 0.4;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 0.4;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
      const dir = [Math.random() - 0.5, Math.random() - 0.2, Math.random() - 0.5];
      const n = Math.hypot(...dir);
      vel[i * 3] = (dir[0] / n) * (0.04 + Math.random() * 0.05);
      vel[i * 3 + 1] = (dir[1] / n) * (0.05 + Math.random() * 0.06);
      vel[i * 3 + 2] = (dir[2] / n) * (0.04 + Math.random() * 0.05);
      const pick = [[1, 0.84, 0], [1, 0.6, 0], [1, 0.92, 0.23]][i % 3];
      cols[i * 3] = pick[0]; cols[i * 3 + 1] = pick[1]; cols[i * 3 + 2] = pick[2];
    }
    burstGeom.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    burstGeom.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    const burst = new THREE.Points(burstGeom, new THREE.PointsMaterial({
      size: 0.14, vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
    }));
    burst.userData = { vel, cnt };
    scene.add(burst);

    // Alpana spirals (flat curves)
    const spiralCurves = [];
    for (let s = 0; s < 4; s++) {
      const points = [];
      for (let p = 0; p <= 60; p++) {
        const a = (p / 60) * Math.PI * 4 + (s * Math.PI) / 2;
        const r = (p / 60) * 2.5;
        points.push(new THREE.Vector3(Math.cos(a) * r, -2.1, Math.sin(a) * r));
      }
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(
        geom,
        new THREE.LineBasicMaterial({ color: palette.secondary, transparent: true, opacity: 0 })
      );
      scene.add(line);
      spiralCurves.push(line);
    }

    return {
      animate: (elapsed, stage, stages) => {
        if (elapsed >= stages[0]) {
          const t = Math.min(elapsed / stages[1], 1);
          leaves.forEach((lf, i) => {
            const delay = i * 0.04;
            if (t > delay) {
              const ts = Math.min((t - delay) / 0.6, 1);
              lf.scale.setScalar(ts);
              lf.rotation.y = Math.sin(elapsed * 0.001 + i) * 0.12;
            }
          });
        }
        if (elapsed >= stages[1]) {
          const t = Math.min((elapsed - stages[1]) / (stages[2] - stages[1]), 1);
          potGroup.scale.setScalar(t);
          potGroup.rotation.y = elapsed * 0.0012;
        }
        if (elapsed >= stages[2]) {
          const t = Math.min((elapsed - stages[2]) / (stages[3] - stages[2]), 1);
          spiralCurves.forEach((sp) => { sp.material.opacity = t * 0.9; });
        }
        if (elapsed >= stages[2]) {
          const t = Math.min((elapsed - stages[2]) / (stages[4] - stages[2]), 1);
          burst.material.opacity = Math.min(t * 1.5, 0.95);
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

export default BengaliHaldiOpening;
