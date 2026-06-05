/**
 * MinimalMarriageOpening — Modern minimalist wedding
 * Geometric arch forms → crystal cube rotates → light rays → names.
 */
import { createThemeOpening } from '../shared/createThemeOpening';
import { createMinimalSoundController } from './minimal.sounds';

const palette = {
  bg: '#0A0A0A',
  accent: '#C0C0C0',
  primary: '#FFFFFF',
  secondary: '#E0E0E0',
  text: '#FFFFFF',
};

const MinimalMarriageOpening = createThemeOpening({
  palette,
  intro: { title: 'Modern Wedding', cta: 'Tap to Begin', finalSubtitle: 'Refined Forever', testid: 'minimal-marriage' },
  ambient: 0x404040,
  ambientIntensity: 0.5,
  soundFactory: createMinimalSoundController,
  audioVolume: 0.5,
  onStageChange: (stage, ctl) => {
    if (stage > 0 && ctl?.pianoNote) ctl.pianoNote();
  },
  setupScene: (scene, { THREE, particleCount }) => {
    const l1 = new THREE.PointLight(0xFFFFFF, 2.4, 25);
    l1.position.set(0, 5, 5); scene.add(l1);
    const l2 = new THREE.PointLight(0xFFFFFF, 1.6, 18);
    l2.position.set(-5, 2, 3); scene.add(l2);
    const l3 = new THREE.PointLight(0xFFFFFF, 1.6, 18);
    l3.position.set(5, 2, 3); scene.add(l3);

    // Geometric arch (two pillars + top beam)
    const archGroup = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: palette.primary, metalness: 0.85, roughness: 0.15, emissive: palette.secondary, emissiveIntensity: 0.2,
    });
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.5, 0.12), mat.clone());
    left.position.set(-1.5, 0, 0);
    archGroup.add(left);
    const right = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.5, 0.12), mat.clone());
    right.position.set(1.5, 0, 0);
    archGroup.add(right);
    const top = new THREE.Mesh(new THREE.BoxGeometry(3.12, 0.12, 0.12), mat.clone());
    top.position.set(0, 1.75, 0);
    archGroup.add(top);
    archGroup.position.set(0, -1, 0);
    archGroup.scale.set(0, 0, 0);
    scene.add(archGroup);

    // Crystal cube
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.8, 0.8),
      new THREE.MeshPhysicalMaterial({
        color: 0xFFFFFF, metalness: 0.1, roughness: 0.05, transmission: 0.85, transparent: true,
        opacity: 0.7, emissive: 0xFFFFFF, emissiveIntensity: 0.3,
      })
    );
    cube.position.set(0, 0.5, 0);
    cube.scale.set(0, 0, 0);
    scene.add(cube);

    // Edges of cube highlight
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(0.8, 0.8, 0.8)),
      new THREE.LineBasicMaterial({ color: palette.accent, transparent: true, opacity: 0 })
    );
    cube.add(edges);

    // Light rays (vertical thin planes)
    const rays = [];
    for (let i = 0; i < 8; i++) {
      const ray = new THREE.Mesh(
        new THREE.PlaneGeometry(0.04, 6),
        new THREE.MeshBasicMaterial({
          color: palette.primary, transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
        })
      );
      const a = (i / 8) * Math.PI * 2;
      ray.position.set(Math.cos(a) * 2.5, 0, Math.sin(a) * 2.5);
      ray.lookAt(0, 0, 0);
      scene.add(ray);
      rays.push(ray);
    }

    // Floating geometric shards
    const shards = [];
    for (let i = 0; i < 16; i++) {
      const shard = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.1, 0),
        new THREE.MeshStandardMaterial({
          color: palette.accent, metalness: 0.9, roughness: 0.1, emissive: palette.accent, emissiveIntensity: 0.4,
        })
      );
      shard.userData = {
        angle: Math.random() * Math.PI * 2,
        radius: 1.5 + Math.random() * 3,
        ySpeed: 0.0008 + Math.random() * 0.002,
        spin: Math.random() * 0.05,
      };
      shard.scale.set(0, 0, 0);
      scene.add(shard);
      shards.push(shard);
    }

    // Particle field
    const pGeom = new THREE.BufferGeometry();
    const arr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 18;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    pGeom.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const dust = new THREE.Points(pGeom, new THREE.PointsMaterial({
      color: 0xFFFFFF, size: 0.04, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending,
    }));
    scene.add(dust);

    return {
      animate: (elapsed, stage, stages) => {
        if (elapsed >= stages[0]) {
          const t = Math.min(elapsed / stages[1], 1);
          archGroup.scale.setScalar(t);
        }
        if (elapsed >= stages[1]) {
          const t = Math.min((elapsed - stages[1]) / (stages[2] - stages[1]), 1);
          cube.scale.setScalar(t);
          cube.rotation.x = elapsed * 0.001;
          cube.rotation.y = elapsed * 0.0015;
          edges.material.opacity = t;
        }
        if (elapsed >= stages[2]) {
          const t = Math.min((elapsed - stages[2]) / (stages[3] - stages[2]), 1);
          rays.forEach((r, i) => {
            const delay = i * 0.1;
            if (t > delay) r.material.opacity = Math.min((t - delay) / 0.5, 1) * 0.4;
          });
        }
        if (elapsed >= stages[3]) {
          const t = Math.min((elapsed - stages[3]) / (stages[5] - stages[3]), 1);
          shards.forEach((s, i) => {
            const delay = (i / shards.length) * 0.5;
            if (t > delay) {
              s.scale.setScalar(Math.min((t - delay) / 0.4, 1));
              const a = s.userData.angle + elapsed * 0.0008;
              s.position.x = Math.cos(a) * s.userData.radius;
              s.position.z = Math.sin(a) * s.userData.radius;
              s.position.y = Math.sin(elapsed * s.userData.ySpeed + i) * 1.5;
              s.rotation.x += s.userData.spin;
              s.rotation.y += s.userData.spin;
            }
          });
        }
        dust.rotation.y += 0.0005;
      },
    };
  },
});

export default MinimalMarriageOpening;
