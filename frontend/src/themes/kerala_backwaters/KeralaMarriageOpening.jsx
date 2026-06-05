/**
 * KeralaMarriageOpening — Kerala backwaters wedding
 * Brass lamp lighting → houseboat sails in → coconut palms sway → names.
 */
import { createThemeOpening } from '../shared/createThemeOpening';
import { createKeralaSoundController } from './kerala.sounds';

const palette = {
  bg: '#0B2A30',
  accent: '#D4A24C',
  primary: '#FFD700',
  secondary: '#1B5E20',
  text: '#FFE9C2',
};

const KeralaMarriageOpening = createThemeOpening({
  palette,
  intro: { title: 'Kerala Wedding', cta: 'Tap to Begin', finalSubtitle: 'Vivaham · Sacred Union', testid: 'kerala-marriage' },
  ambient: 0x2D4A55,
  ambientIntensity: 0.4,
  soundFactory: createKeralaSoundController,
  audioVolume: 0.55,
  onStageChange: (stage, ctl) => {
    if (stage === 1 && ctl?.swell) ctl.swell();
    if (stage === 3 && ctl?.ripple) ctl.ripple();
  },
  setupScene: (scene, { THREE, particleCount }) => {
    const l1 = new THREE.PointLight(palette.primary, 2.4, 22);
    l1.position.set(0, 4, 4); scene.add(l1);
    const l2 = new THREE.PointLight(palette.accent, 1.5, 18);
    l2.position.set(-3, 2, 3); scene.add(l2);

    // Backwater plane
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 14, 60, 40),
      new THREE.MeshStandardMaterial({
        color: 0x0E3F46, roughness: 0.15, metalness: 0.7, emissive: 0x062B30, emissiveIntensity: 0.3,
      })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = -2;
    scene.add(water);

    // Nilavilakku (brass lamp)
    const lampGroup = new THREE.Group();
    const lampMat = new THREE.MeshStandardMaterial({
      color: palette.accent, metalness: 0.95, roughness: 0.1, emissive: palette.accent, emissiveIntensity: 0.4,
    });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 1.4, 12), lampMat.clone());
    lampGroup.add(stem);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.15, 16), lampMat.clone());
    base.position.y = -0.7;
    lampGroup.add(base);
    const dish = new THREE.Mesh(new THREE.SphereGeometry(0.35, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), lampMat.clone());
    dish.position.y = 0.75;
    lampGroup.add(dish);
    const flames = [];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const flame = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 12, 12),
        new THREE.MeshStandardMaterial({
          color: palette.primary, emissive: palette.primary, emissiveIntensity: 1.5, transparent: true, opacity: 0,
        })
      );
      flame.position.set(Math.cos(a) * 0.28, 0.92, Math.sin(a) * 0.28);
      lampGroup.add(flame);
      flames.push(flame);
    }
    lampGroup.position.set(0, 0.2, 0);
    lampGroup.scale.set(0, 0, 0);
    scene.add(lampGroup);

    // Houseboat (kettuvallam)
    const boatGroup = new THREE.Group();
    const hull = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.25, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x4E342E, roughness: 0.6 })
    );
    boatGroup.add(hull);
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.06, 0.65),
      new THREE.MeshStandardMaterial({ color: 0xC97E3D, roughness: 0.7 })
    );
    roof.position.y = 0.5;
    boatGroup.add(roof);
    for (let i = 0; i < 5; i++) {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 0.5, 6),
        new THREE.MeshStandardMaterial({ color: 0x8B6F47 })
      );
      pole.position.set(-0.8 + i * 0.4, 0.2, 0.3);
      boatGroup.add(pole);
    }
    boatGroup.position.set(-7, -1.6, -1);
    boatGroup.scale.set(0, 0, 0);
    scene.add(boatGroup);

    // Coconut palm trees
    const palms = [];
    for (let i = 0; i < 4; i++) {
      const palm = new THREE.Group();
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.15, 3, 8),
        new THREE.MeshStandardMaterial({ color: 0x5D4037, roughness: 0.85 })
      );
      palm.add(trunk);
      // Fronds
      for (let f = 0; f < 6; f++) {
        const frond = new THREE.Mesh(
          new THREE.PlaneGeometry(0.18, 1.1),
          new THREE.MeshStandardMaterial({
            color: palette.secondary, side: THREE.DoubleSide, roughness: 0.7,
            emissive: 0x0F3320, emissiveIntensity: 0.2,
          })
        );
        const a = (f / 6) * Math.PI * 2;
        frond.position.set(Math.cos(a) * 0.3, 1.6, Math.sin(a) * 0.3);
        frond.rotation.set(0.4, a, Math.PI / 6);
        palm.add(frond);
      }
      palm.position.set(-6 + i * 4, -2, -3);
      palm.scale.y = 0;
      palm.userData = { phase: Math.random() * Math.PI * 2 };
      scene.add(palm);
      palms.push(palm);
    }

    // Drifting glow particles
    const dustGeom = new THREE.BufferGeometry();
    const arr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 16;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 8;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    dustGeom.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const dust = new THREE.Points(dustGeom, new THREE.PointsMaterial({
      color: palette.primary, size: 0.06, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending,
    }));
    scene.add(dust);

    return {
      animate: (elapsed, stage, stages) => {
        // Water ripple
        const pos = water.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i), y = pos.getY(i);
          pos.setZ(i, Math.sin(x * 0.5 + elapsed * 0.001) * 0.12 + Math.cos(y * 0.4 + elapsed * 0.0008) * 0.1);
        }
        pos.needsUpdate = true;

        if (elapsed >= stages[0]) {
          const t = Math.min(elapsed / stages[1], 1);
          lampGroup.scale.setScalar(t);
          flames.forEach((f, i) => {
            f.material.opacity = t * (0.7 + Math.sin(elapsed * 0.01 + i) * 0.3);
            f.scale.y = 1 + Math.sin(elapsed * 0.012 + i) * 0.35;
          });
        }
        if (elapsed >= stages[1]) {
          const t = Math.min((elapsed - stages[1]) / (stages[3] - stages[1]), 1);
          palms.forEach((p, i) => {
            const delay = i * 0.1;
            if (t > delay) {
              p.scale.y = Math.min((t - delay) / 0.5, 1);
              p.rotation.z = Math.sin(elapsed * 0.001 + p.userData.phase) * 0.05;
            }
          });
        }
        if (elapsed >= stages[2]) {
          const t = Math.min((elapsed - stages[2]) / (stages[4] - stages[2]), 1);
          boatGroup.scale.setScalar(t);
          boatGroup.position.x = -7 + t * 7;
          boatGroup.position.y = -1.6 + Math.sin(elapsed * 0.002) * 0.05;
        }
        dust.rotation.y += 0.0006;
      },
    };
  },
});

export default KeralaMarriageOpening;
