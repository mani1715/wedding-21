/**
 * MinimalHaldiOpening — Modern minimalist haldi
 * Gold gradient sphere expands → geometric color burst → names.
 */
import { createThemeOpening } from '../shared/createThemeOpening';
import { createMinimalSoundController } from './minimal.sounds';

const palette = {
  bg: '#1F1505',
  accent: '#FFD54F',
  primary: '#FFC107',
  secondary: '#FF9800',
  text: '#FFF8DC',
};

const MinimalHaldiOpening = createThemeOpening({
  palette,
  intro: { title: 'Haldi Ceremony', cta: 'Tap to Begin', finalSubtitle: 'A Golden Touch', testid: 'minimal-haldi' },
  ambient: 0xFFE6B5,
  ambientIntensity: 0.6,
  soundFactory: createMinimalSoundController,
  audioVolume: 0.55,
  onStageChange: (stage, ctl) => {
    if (stage > 0 && ctl?.pianoNote) ctl.pianoNote();
  },
  setupScene: (scene, { THREE, particleCount }) => {
    const l1 = new THREE.PointLight(palette.accent, 3, 22);
    l1.position.set(0, 5, 4); scene.add(l1);
    const l2 = new THREE.PointLight(palette.primary, 1.6, 18);
    l2.position.set(-3, 2, 3); scene.add(l2);

    // Central gradient sphere
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 48, 48),
      new THREE.MeshPhysicalMaterial({
        color: palette.primary, metalness: 0.6, roughness: 0.2, emissive: palette.accent, emissiveIntensity: 0.45,
        transmission: 0.3, transparent: true, opacity: 0.95,
      })
    );
    sphere.position.set(0, 0, 0);
    sphere.scale.set(0, 0, 0);
    scene.add(sphere);

    // Geometric rings around sphere
    const rings = [];
    for (let i = 0; i < 5; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.3 + i * 0.3, 0.03, 12, 64),
        new THREE.MeshStandardMaterial({
          color: i % 2 ? palette.accent : palette.primary,
          emissive: palette.accent, emissiveIntensity: 0.3, transparent: true, opacity: 0,
        })
      );
      ring.rotation.x = Math.random() * Math.PI;
      ring.rotation.y = Math.random() * Math.PI;
      scene.add(ring);
      rings.push(ring);
    }

    // Geometric shapes (cubes, tetrahedrons) orbiting
    const shapes = [];
    const shapeGeoms = [
      new THREE.BoxGeometry(0.18, 0.18, 0.18),
      new THREE.TetrahedronGeometry(0.18),
      new THREE.OctahedronGeometry(0.16),
    ];
    for (let i = 0; i < 18; i++) {
      const sh = new THREE.Mesh(
        shapeGeoms[i % 3],
        new THREE.MeshStandardMaterial({
          color: [palette.accent, palette.primary, palette.secondary][i % 3],
          metalness: 0.6, roughness: 0.2, emissive: palette.accent, emissiveIntensity: 0.3,
        })
      );
      sh.userData = {
        angle: (i / 18) * Math.PI * 2,
        radius: 2.5 + Math.random() * 1.5,
        ySpeed: 0.0008 + Math.random() * 0.0012,
        spin: 0.02 + Math.random() * 0.04,
      };
      sh.scale.set(0, 0, 0);
      scene.add(sh);
      shapes.push(sh);
    }

    // Powder particles
    const powderGeom = new THREE.BufferGeometry();
    // PHASE 7 (perf): floor lowered 320→128 so scaleParticles() can actually take effect on mobile.
    const cnt = Math.max(particleCount, 128);
    const arr = new Float32Array(cnt * 3);
    const vel = new Float32Array(cnt * 3);
    for (let i = 0; i < cnt; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 0.5;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
      const dir = [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5];
      const n = Math.hypot(...dir);
      vel[i * 3] = (dir[0] / n) * (0.04 + Math.random() * 0.05);
      vel[i * 3 + 1] = (dir[1] / n) * (0.04 + Math.random() * 0.05);
      vel[i * 3 + 2] = (dir[2] / n) * (0.04 + Math.random() * 0.05);
    }
    powderGeom.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const powder = new THREE.Points(powderGeom, new THREE.PointsMaterial({
      color: palette.accent, size: 0.12, transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
    }));
    powder.userData = { vel, cnt };
    scene.add(powder);

    return {
      animate: (elapsed, stage, stages) => {
        if (elapsed >= stages[0]) {
          const t = Math.min(elapsed / stages[1], 1);
          sphere.scale.setScalar(t);
          sphere.rotation.y = elapsed * 0.0008;
        }
        if (elapsed >= stages[1]) {
          const t = Math.min((elapsed - stages[1]) / (stages[2] - stages[1]), 1);
          rings.forEach((r, i) => {
            const delay = i * 0.12;
            if (t > delay) {
              r.material.opacity = Math.min((t - delay) / 0.4, 1) * 0.8;
              r.rotation.x += 0.005;
              r.rotation.y += 0.003;
            }
          });
        }
        if (elapsed >= stages[2]) {
          const t = Math.min((elapsed - stages[2]) / (stages[3] - stages[2]), 1);
          shapes.forEach((s, i) => {
            const delay = (i / shapes.length) * 0.5;
            if (t > delay) {
              s.scale.setScalar(Math.min((t - delay) / 0.4, 1));
              const a = s.userData.angle + elapsed * 0.0008;
              s.position.x = Math.cos(a) * s.userData.radius;
              s.position.z = Math.sin(a) * s.userData.radius;
              s.position.y = Math.sin(elapsed * s.userData.ySpeed + i) * 1.2;
              s.rotation.x += s.userData.spin;
              s.rotation.y += s.userData.spin;
            }
          });
        }
        if (elapsed >= stages[3]) {
          const t = Math.min((elapsed - stages[3]) / (stages[5] - stages[3]), 1);
          powder.material.opacity = Math.min(t * 1.4, 0.9);
          const ps = powder.geometry.attributes.position.array;
          for (let i = 0; i < powder.userData.cnt; i++) {
            ps[i * 3] += powder.userData.vel[i * 3];
            ps[i * 3 + 1] += powder.userData.vel[i * 3 + 1];
            ps[i * 3 + 2] += powder.userData.vel[i * 3 + 2];
          }
          powder.geometry.attributes.position.needsUpdate = true;
        }
      },
    };
  },
});

export default MinimalHaldiOpening;
