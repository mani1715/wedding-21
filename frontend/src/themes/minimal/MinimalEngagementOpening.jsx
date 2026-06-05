/**
 * MinimalEngagementOpening — Sleek minimal engagement
 * Concentric circles expand → single silver ring forms → soft glow → names.
 */
import { createThemeOpening } from '../shared/createThemeOpening';
import { createMinimalSoundController } from './minimal.sounds';

const palette = {
  bg: '#0F0F0F',
  accent: '#D4D4D4',
  primary: '#FFFFFF',
  secondary: '#B8B8B8',
  text: '#FFFFFF',
};

const MinimalEngagementOpening = createThemeOpening({
  palette,
  intro: { title: 'Minimal Engagement', cta: 'Tap to Begin', finalSubtitle: 'A Quiet Promise', testid: 'minimal-engagement' },
  ambient: 0x555555,
  ambientIntensity: 0.55,
  soundFactory: createMinimalSoundController,
  audioVolume: 0.5,
  onStageChange: (stage, ctl) => {
    if (stage > 0 && ctl?.pianoNote) ctl.pianoNote();
  },
  setupScene: (scene, { THREE, particleCount }) => {
    const l1 = new THREE.PointLight(0xFFFFFF, 2.5, 25);
    l1.position.set(0, 4, 5); scene.add(l1);
    const l2 = new THREE.PointLight(palette.accent, 1.5, 18);
    l2.position.set(-3, 2, 3); scene.add(l2);

    // Concentric ripple rings
    const rings = [];
    for (let i = 0; i < 6; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1, 0.015, 16, 80),
        new THREE.MeshBasicMaterial({ color: palette.primary, transparent: true, opacity: 0 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.userData = { delay: i * 0.18, scale: 0.6 + i * 0.4 };
      scene.add(ring);
      rings.push(ring);
    }

    // Single platinum ring
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.7, 0.07, 32, 100),
      new THREE.MeshPhysicalMaterial({
        color: palette.primary, metalness: 1, roughness: 0.05, emissive: palette.primary, emissiveIntensity: 0.35,
      })
    );
    ring.rotation.x = Math.PI / 4;
    ring.position.set(0, 0.2, 0);
    ring.scale.set(0, 0, 0);
    scene.add(ring);

    // Solitaire diamond
    const diamond = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.16, 0),
      new THREE.MeshPhysicalMaterial({
        color: 0xFFFFFF, metalness: 0.8, roughness: 0.05, transmission: 0.6, emissive: 0xFFFFFF, emissiveIntensity: 0.6,
      })
    );
    diamond.position.set(0, 0.6, 0);
    diamond.scale.set(0, 0, 0);
    scene.add(diamond);

    // Bokeh circle lights
    const bokeh = [];
    for (let i = 0; i < 14; i++) {
      const b = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 12, 12),
        new THREE.MeshStandardMaterial({
          color: palette.accent, emissive: palette.accent, emissiveIntensity: 1, transparent: true, opacity: 0.45,
        })
      );
      b.position.set((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 6, -2 - Math.random() * 3);
      b.userData = { phase: Math.random() * Math.PI * 2 };
      b.scale.set(0, 0, 0);
      scene.add(b);
      bokeh.push(b);
    }

    // Drifting dust
    const dustGeom = new THREE.BufferGeometry();
    const arr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 14;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 8;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    dustGeom.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const dust = new THREE.Points(dustGeom, new THREE.PointsMaterial({
      color: 0xFFFFFF, size: 0.04, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending,
    }));
    scene.add(dust);

    return {
      animate: (elapsed, stage, stages) => {
        if (elapsed >= stages[0]) {
          const t = elapsed / 1000;
          rings.forEach((r, i) => {
            const localT = (t - r.userData.delay) % 3;
            if (localT > 0 && localT < 2.5) {
              const s = r.userData.scale + localT * 1.2;
              r.scale.setScalar(s);
              r.material.opacity = Math.max(0, 0.6 - localT * 0.25);
            }
          });
        }
        if (elapsed >= stages[1]) {
          const t = Math.min((elapsed - stages[1]) / (stages[2] - stages[1]), 1);
          ring.scale.setScalar(t);
          ring.rotation.z = elapsed * 0.0008;
        }
        if (elapsed >= stages[2]) {
          const t = Math.min((elapsed - stages[2]) / (stages[3] - stages[2]), 1);
          diamond.scale.setScalar(t);
          diamond.rotation.y = elapsed * 0.003;
        }
        if (elapsed >= stages[3]) {
          const t = Math.min((elapsed - stages[3]) / (stages[5] - stages[3]), 1);
          bokeh.forEach((b, i) => {
            const delay = (i / bokeh.length) * 0.5;
            if (t > delay) {
              b.scale.setScalar(Math.min((t - delay) / 0.4, 1));
              b.material.opacity = 0.45 * (0.5 + Math.sin(elapsed * 0.002 + b.userData.phase) * 0.5);
            }
          });
        }
        dust.rotation.y += 0.0005;
      },
    };
  },
});

export default MinimalEngagementOpening;
