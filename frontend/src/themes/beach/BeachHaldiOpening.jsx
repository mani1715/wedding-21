/**
 * BeachHaldiOpening — Sunny tropical haldi
 * Tropical flower wreath floats on water → turmeric splashes → coconuts → names.
 */
import { createThemeOpening } from '../shared/createThemeOpening';
import { createBeachSoundController } from './beach.sounds';

const palette = {
  bg: '#FFE9B5',
  accent: '#FF9933',
  primary: '#FFD700',
  secondary: '#26A69A',
  text: '#5D2A00',
};

const BeachHaldiOpening = createThemeOpening({
  palette,
  intro: { title: 'Beach Haldi', cta: 'Tap to Begin', finalSubtitle: 'Sunshine & Joy', testid: 'beach-haldi' },
  ambient: 0xFFD580,
  ambientIntensity: 0.7,
  soundFactory: createBeachSoundController,
  audioVolume: 0.55,
  onStageChange: (stage, ctl) => {
    if (stage === 2 && ctl?.chime) ctl.chime();
  },
  setupScene: (scene, { THREE, particleCount }) => {
    const sun = new THREE.PointLight(palette.primary, 3.2, 25);
    sun.position.set(0, 6, 3); scene.add(sun);
    const accent = new THREE.PointLight(palette.accent, 1.6, 18);
    accent.position.set(-3, 2, 4); scene.add(accent);

    // Water surface with caustic effect
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 14, 60, 40),
      new THREE.MeshStandardMaterial({
        color: 0x67CCBC, metalness: 0.7, roughness: 0.15, emissive: 0x2E988A, emissiveIntensity: 0.4,
      })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = -2;
    scene.add(water);
    const wGeom = water.geometry;

    // Tropical flower wreath
    const wreath = new THREE.Group();
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2;
      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 12, 12),
        new THREE.MeshStandardMaterial({
          color: [palette.accent, palette.primary, palette.secondary, 0xFF6F61][i % 4],
          emissive: palette.accent, emissiveIntensity: 0.25,
        })
      );
      flower.position.set(Math.cos(a) * 1.8, 0, Math.sin(a) * 1.8);
      wreath.add(flower);
    }
    wreath.position.set(0, -1.7, 0);
    wreath.scale.set(0, 0, 0);
    scene.add(wreath);

    // Floating coconut halves
    const coconuts = [];
    for (let i = 0; i < 5; i++) {
      const half = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 14, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0x6B3410, roughness: 0.6 })
      );
      half.rotation.x = Math.PI;
      half.position.set((Math.random() - 0.5) * 6, -1.7, (Math.random() - 0.5) * 4);
      half.userData = { phase: Math.random() * Math.PI * 2 };
      half.scale.set(0, 0, 0);
      scene.add(half);
      coconuts.push(half);
    }

    // Turmeric splash particles
    const splashGeom = new THREE.BufferGeometry();
    // PHASE 7 (perf): floor lowered 350→140 so scaleParticles() can actually take effect on mobile.
    const cnt = Math.max(particleCount, 140);
    const arr = new Float32Array(cnt * 3);
    const vel = new Float32Array(cnt * 3);
    for (let i = 0; i < cnt; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 0.5;
      arr[i * 3 + 1] = -1.5 + (Math.random() - 0.5) * 0.3;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
      const dir = [(Math.random() - 0.5) * 2, Math.random() * 1.5, (Math.random() - 0.5) * 2];
      vel[i * 3] = dir[0] * 0.025;
      vel[i * 3 + 1] = dir[1] * 0.04;
      vel[i * 3 + 2] = dir[2] * 0.025;
    }
    splashGeom.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const splash = new THREE.Points(splashGeom, new THREE.PointsMaterial({
      color: palette.primary, size: 0.12, transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
    }));
    splash.userData = { vel, cnt };
    scene.add(splash);

    // Sun rays
    const rays = [];
    for (let i = 0; i < 10; i++) {
      const ray = new THREE.Mesh(
        new THREE.PlaneGeometry(0.15, 12),
        new THREE.MeshBasicMaterial({ color: palette.primary, transparent: true, opacity: 0, blending: THREE.AdditiveBlending })
      );
      const a = (i / 10) * Math.PI * 2;
      ray.rotation.z = a;
      ray.position.set(0, 0, -2);
      scene.add(ray);
      rays.push(ray);
    }

    return {
      animate: (elapsed, stage, stages) => {
        // Water ripple
        const pos = wGeom.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i), y = pos.getY(i);
          pos.setZ(i, Math.sin(x * 0.7 + elapsed * 0.002) * 0.18 + Math.cos(y * 0.6 + elapsed * 0.0015) * 0.14);
        }
        pos.needsUpdate = true;

        if (elapsed >= stages[0]) {
          const t = Math.min(elapsed / stages[1], 1);
          wreath.scale.setScalar(t);
          wreath.rotation.y = elapsed * 0.0008;
          wreath.position.y = -1.7 + Math.sin(elapsed * 0.0012) * 0.08;
        }
        if (elapsed >= stages[1]) {
          const t = Math.min((elapsed - stages[1]) / (stages[2] - stages[1]), 1);
          coconuts.forEach((c, i) => {
            const delay = (i / coconuts.length) * 0.5;
            if (t > delay) {
              c.scale.setScalar(Math.min((t - delay) / 0.5, 1));
              c.position.y = -1.7 + Math.sin(elapsed * 0.0015 + c.userData.phase) * 0.1;
              c.rotation.y = elapsed * 0.0008;
            }
          });
        }
        if (elapsed >= stages[2]) {
          const t = Math.min((elapsed - stages[2]) / (stages[4] - stages[2]), 1);
          splash.material.opacity = Math.min(t * 1.5, 0.9);
          rays.forEach((r, i) => {
            r.material.opacity = t * 0.18 * (0.5 + Math.sin(elapsed * 0.003 + i) * 0.5);
          });
          const ps = splash.geometry.attributes.position.array;
          for (let i = 0; i < splash.userData.cnt; i++) {
            ps[i * 3] += splash.userData.vel[i * 3];
            ps[i * 3 + 1] += splash.userData.vel[i * 3 + 1] - 0.001;
            ps[i * 3 + 2] += splash.userData.vel[i * 3 + 2];
          }
          splash.geometry.attributes.position.needsUpdate = true;
        }
      },
    };
  },
});

export default BeachHaldiOpening;
