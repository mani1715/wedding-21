/**
 * KeralaReceptionOpening — Kerala backwater reception at dusk
 * Floating lanterns on water → kathakali masks emerge → fireworks → names.
 */
import { createThemeOpening } from '../shared/createThemeOpening';
import { createKeralaSoundController } from './kerala.sounds';

const palette = {
  bg: '#04161E',
  accent: '#D4A24C',
  primary: '#FF6F00',
  secondary: '#FFEB3B',
  text: '#FFE9C2',
};

const KeralaReceptionOpening = createThemeOpening({
  palette,
  intro: { title: 'Kerala Reception', cta: 'Tap to Begin', finalSubtitle: 'An Evening on the Backwaters', testid: 'kerala-reception' },
  ambient: 0x152838,
  ambientIntensity: 0.3,
  soundFactory: createKeralaSoundController,
  audioVolume: 0.55,
  onStageChange: (stage, ctl) => {
    if (stage === 2 && ctl?.ripple) ctl.ripple();
  },
  setupScene: (scene, { THREE, particleCount }) => {
    const l1 = new THREE.PointLight(palette.accent, 2.4, 22);
    l1.position.set(0, 4, 4); scene.add(l1);
    const l2 = new THREE.PointLight(palette.primary, 1.5, 18);
    l2.position.set(-3, 2, 3); scene.add(l2);

    // Dark water
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 14, 50, 30),
      new THREE.MeshStandardMaterial({
        color: 0x041218, roughness: 0.15, metalness: 0.8, emissive: 0x010A12, emissiveIntensity: 0.5,
      })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = -2;
    scene.add(water);

    // Floating diya lamps on water
    const diyas = [];
    for (let i = 0; i < 18; i++) {
      const diya = new THREE.Group();
      const bowl = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0x6B2A0F, roughness: 0.7 })
      );
      bowl.rotation.x = Math.PI;
      diya.add(bowl);
      const flame = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 12, 12),
        new THREE.MeshStandardMaterial({
          color: palette.secondary, emissive: palette.primary, emissiveIntensity: 1.5, transparent: true, opacity: 0.95,
        })
      );
      flame.position.y = 0.12;
      diya.add(flame);
      diya.position.set((Math.random() - 0.5) * 14, -1.9, (Math.random() - 0.5) * 6);
      diya.userData = { phase: Math.random() * Math.PI * 2, flame, drift: 0.0008 + Math.random() * 0.0015 };
      diya.scale.set(0, 0, 0);
      scene.add(diya);
      diyas.push(diya);
    }

    // Kathakali mask (stylized)
    const maskGroup = new THREE.Group();
    const face = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 24, 24),
      new THREE.MeshStandardMaterial({ color: palette.secondary, roughness: 0.4, emissive: palette.primary, emissiveIntensity: 0.15 })
    );
    face.scale.set(0.85, 1, 0.7);
    maskGroup.add(face);
    // Red ornate trim (eyebrows etc)
    const trim = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.05, 8, 24, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0xC62828, emissive: 0xC62828, emissiveIntensity: 0.6 })
    );
    trim.position.y = 0.15;
    maskGroup.add(trim);
    // Crown spikes
    for (let i = 0; i < 7; i++) {
      const a = ((i - 3) / 6) * Math.PI;
      const spike = new THREE.Mesh(
        new THREE.ConeGeometry(0.08, 0.4, 6),
        new THREE.MeshStandardMaterial({ color: palette.accent, metalness: 0.8, roughness: 0.2, emissive: palette.accent, emissiveIntensity: 0.4 })
      );
      spike.position.set(Math.cos(a) * 0.5, 0.55 + Math.sin(a) * 0.1, 0);
      spike.rotation.z = -a + Math.PI / 2;
      maskGroup.add(spike);
    }
    maskGroup.position.set(0, 0.8, 0);
    maskGroup.scale.set(0, 0, 0);
    scene.add(maskGroup);

    // Firework particles (delayed)
    const fwGeom = new THREE.BufferGeometry();
    // PHASE 7 (perf): floor lowered 320→128 so scaleParticles() can actually take effect on mobile.
    const cnt = Math.max(particleCount, 128);
    const arr = new Float32Array(cnt * 3);
    const vel = new Float32Array(cnt * 3);
    const cols = new Float32Array(cnt * 3);
    for (let i = 0; i < cnt; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 0.4;
      arr[i * 3 + 1] = 3 + (Math.random() - 0.5) * 0.4;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
      const dir = [Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5];
      const n = Math.hypot(...dir);
      vel[i * 3] = (dir[0] / n) * (0.04 + Math.random() * 0.05);
      vel[i * 3 + 1] = (dir[1] / n) * (0.04 + Math.random() * 0.05);
      vel[i * 3 + 2] = (dir[2] / n) * (0.04 + Math.random() * 0.05);
      const pick = [[1, 0.42, 0], [1, 0.92, 0.23], [0.83, 0.63, 0.30]][i % 3];
      cols[i * 3] = pick[0]; cols[i * 3 + 1] = pick[1]; cols[i * 3 + 2] = pick[2];
    }
    fwGeom.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    fwGeom.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    const fireworks = new THREE.Points(fwGeom, new THREE.PointsMaterial({
      size: 0.13, vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
    }));
    fireworks.userData = { vel, cnt };
    scene.add(fireworks);

    return {
      animate: (elapsed, stage, stages) => {
        // Water ripple
        const pos = water.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i), y = pos.getY(i);
          pos.setZ(i, Math.sin(x * 0.5 + elapsed * 0.001) * 0.1 + Math.cos(y * 0.4 + elapsed * 0.0008) * 0.08);
        }
        pos.needsUpdate = true;

        if (elapsed >= stages[0]) {
          const t = Math.min(elapsed / stages[1], 1);
          diyas.forEach((d, i) => {
            const delay = (i / diyas.length) * 0.7;
            if (t > delay) {
              d.scale.setScalar(Math.min((t - delay) / 0.4, 1));
              d.position.y = -1.9 + Math.sin(elapsed * d.userData.drift + d.userData.phase) * 0.06;
              d.userData.flame.scale.y = 1 + Math.sin(elapsed * 0.01 + d.userData.phase) * 0.3;
            }
          });
        }
        if (elapsed >= stages[1]) {
          const t = Math.min((elapsed - stages[1]) / (stages[3] - stages[1]), 1);
          maskGroup.scale.setScalar(t);
          maskGroup.rotation.y = Math.sin(elapsed * 0.0008) * 0.2;
        }
        if (elapsed >= stages[2]) {
          const t = Math.min((elapsed - stages[2]) / (stages[4] - stages[2]), 1);
          fireworks.material.opacity = Math.max(0, 0.95 - Math.pow(t, 2.5));
          const ps = fireworks.geometry.attributes.position.array;
          for (let i = 0; i < fireworks.userData.cnt; i++) {
            ps[i * 3] += fireworks.userData.vel[i * 3];
            ps[i * 3 + 1] += fireworks.userData.vel[i * 3 + 1] - 0.0008;
            ps[i * 3 + 2] += fireworks.userData.vel[i * 3 + 2];
          }
          fireworks.geometry.attributes.position.needsUpdate = true;
        }
      },
    };
  },
});

export default KeralaReceptionOpening;
