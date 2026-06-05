/**
 * BengaliReceptionOpening — Festive Bengali reception
 * Floating diya boats → shankha conch shells circle → fireworks → names.
 */
import { createThemeOpening } from '../shared/createThemeOpening';
import { createBengaliSoundController } from './bengali.sounds';

const palette = {
  bg: '#06070C',
  accent: '#FFD700',
  primary: '#FF6F00',
  secondary: '#FF1744',
  text: '#FFE7B5',
};

const BengaliReceptionOpening = createThemeOpening({
  palette,
  intro: { title: 'Bengali Reception', cta: 'Tap to Begin', finalSubtitle: 'Bou Bhaat · A New Beginning', testid: 'bengali-reception' },
  ambient: 0x402810,
  ambientIntensity: 0.35,
  soundFactory: createBengaliSoundController,
  audioVolume: 0.5,
  onStageChange: (stage, ctl) => {
    if ((stage === 2 || stage === 4) && ctl?.shankha) ctl.shankha();
  },
  setupScene: (scene, { THREE, particleCount }) => {
    const moon = new THREE.PointLight(palette.secondary, 1.6, 22);
    moon.position.set(0, 6, 3); scene.add(moon);
    const warm = new THREE.PointLight(palette.accent, 1.4, 18);
    warm.position.set(-3, 2, 4); scene.add(warm);

    // Reflective river plane
    const river = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 12, 40, 20),
      new THREE.MeshStandardMaterial({ color: 0x05151F, roughness: 0.2, metalness: 0.6 })
    );
    river.rotation.x = -Math.PI / 2;
    river.position.y = -2.5;
    scene.add(river);

    // Floating diya lamps
    const diyas = [];
    for (let i = 0; i < 18; i++) {
      const diya = new THREE.Group();
      const bowl = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0x6B2A0F, roughness: 0.7 })
      );
      bowl.rotation.x = Math.PI;
      diya.add(bowl);
      const flame = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 12, 12),
        new THREE.MeshStandardMaterial({
          color: palette.accent, emissive: palette.accent, emissiveIntensity: 1.5, transparent: true, opacity: 0.95,
        })
      );
      flame.position.y = 0.12;
      diya.add(flame);
      diya.position.set((Math.random() - 0.5) * 12, -2.4, (Math.random() - 0.5) * 6);
      diya.userData = { drift: 0.001 + Math.random() * 0.002, phase: Math.random() * Math.PI * 2, flame };
      diya.scale.set(0, 0, 0);
      scene.add(diya);
      diyas.push(diya);
    }

    // Shankha (conch) circle
    const conches = [];
    for (let i = 0; i < 6; i++) {
      const conch = new THREE.Mesh(
        new THREE.ConeGeometry(0.2, 0.7, 14, 4, true),
        new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: palette.accent, emissiveIntensity: 0.2, roughness: 0.4 })
      );
      const a = (i / 6) * Math.PI * 2;
      conch.position.set(Math.cos(a) * 2.2, 1.2, Math.sin(a) * 2.2);
      conch.rotation.z = Math.PI / 4;
      conch.userData = { angle: a };
      conch.scale.set(0, 0, 0);
      scene.add(conch);
      conches.push(conch);
    }

    // Firework bursts (point bursts emerging)
    const fwGeom = new THREE.BufferGeometry();
    // PHASE 7 (perf): floor lowered 320→128 so scaleParticles() can actually take effect on mobile.
    const cnt = Math.max(particleCount, 128);
    const arr = new Float32Array(cnt * 3);
    const vel = new Float32Array(cnt * 3);
    const cols = new Float32Array(cnt * 3);
    for (let i = 0; i < cnt; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 0.4;
      arr[i * 3 + 1] = 2 + (Math.random() - 0.5) * 0.4;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
      const dir = [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5];
      const n = Math.hypot(...dir);
      vel[i * 3] = (dir[0] / n) * (0.03 + Math.random() * 0.05);
      vel[i * 3 + 1] = (dir[1] / n) * (0.03 + Math.random() * 0.05);
      vel[i * 3 + 2] = (dir[2] / n) * (0.03 + Math.random() * 0.05);
      const pick = [[1, 0.84, 0], [1, 0.42, 0], [1, 0.09, 0.27]][i % 3];
      cols[i * 3] = pick[0]; cols[i * 3 + 1] = pick[1]; cols[i * 3 + 2] = pick[2];
    }
    fwGeom.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    fwGeom.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    const fireworks = new THREE.Points(fwGeom, new THREE.PointsMaterial({
      size: 0.12, vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
    }));
    fireworks.userData = { vel, cnt };
    scene.add(fireworks);

    return {
      animate: (elapsed, stage, stages) => {
        if (elapsed >= stages[0]) {
          const t = Math.min(elapsed / stages[1], 1);
          diyas.forEach((d, i) => {
            const delay = (i / diyas.length) * 0.7;
            if (t > delay) {
              const ts = Math.min((t - delay) / 0.4, 1);
              d.scale.setScalar(ts);
              d.position.y = -2.4 + Math.sin(elapsed * d.userData.drift + d.userData.phase) * 0.15;
              d.userData.flame.scale.y = 1 + Math.sin(elapsed * 0.01 + d.userData.phase) * 0.3;
            }
          });
        }
        if (elapsed >= stages[1]) {
          const t = Math.min((elapsed - stages[1]) / (stages[2] - stages[1]), 1);
          conches.forEach((c, i) => {
            const delay = i * 0.08;
            if (t > delay) {
              const ts = Math.min((t - delay) / 0.5, 1);
              c.scale.setScalar(ts);
              const a = c.userData.angle + elapsed * 0.0006;
              c.position.x = Math.cos(a) * 2.2;
              c.position.z = Math.sin(a) * 2.2;
              c.rotation.y = elapsed * 0.002;
            }
          });
        }
        if (elapsed >= stages[2]) {
          const t = Math.min((elapsed - stages[2]) / (stages[4] - stages[2]), 1);
          fireworks.material.opacity = Math.max(0, 0.9 - Math.pow(t, 2.5));
          const pos = fireworks.geometry.attributes.position.array;
          for (let i = 0; i < fireworks.userData.cnt; i++) {
            pos[i * 3] += fireworks.userData.vel[i * 3];
            pos[i * 3 + 1] += fireworks.userData.vel[i * 3 + 1] - 0.0008;
            pos[i * 3 + 2] += fireworks.userData.vel[i * 3 + 2];
          }
          fireworks.geometry.attributes.position.needsUpdate = true;
        }
      },
    };
  },
});

export default BengaliReceptionOpening;
