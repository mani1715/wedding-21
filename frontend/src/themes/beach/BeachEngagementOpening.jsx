/**
 * BeachEngagementOpening — Intimate beach engagement
 * Heart traced in sand → seashells gather → gentle waves → names.
 */
import { createThemeOpening } from '../shared/createThemeOpening';
import { createBeachSoundController } from './beach.sounds';

const palette = {
  bg: '#0A1525',
  accent: '#E9C46A',
  primary: '#F4A261',
  secondary: '#FFB6C1',
  text: '#FFF6E0',
};

const BeachEngagementOpening = createThemeOpening({
  palette,
  intro: { title: 'Beach Engagement', cta: 'Tap to Begin', finalSubtitle: 'Sealed by the Sea', testid: 'beach-engagement' },
  ambient: 0xBBD7E8,
  ambientIntensity: 0.5,
  soundFactory: createBeachSoundController,
  audioVolume: 0.55,
  onStageChange: (stage, ctl) => {
    if (stage === 3 && ctl?.chime) ctl.chime();
  },
  setupScene: (scene, { THREE, particleCount }) => {
    const l1 = new THREE.PointLight(palette.accent, 2, 18);
    l1.position.set(0, 4, 4); scene.add(l1);
    const l2 = new THREE.PointLight(palette.secondary, 1.5, 18);
    l2.position.set(-3, 2, 3); scene.add(l2);

    // Beach sand floor
    const sand = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 14, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0xE8D7A0, roughness: 0.9 })
    );
    sand.rotation.x = -Math.PI / 2;
    sand.position.y = -2;
    scene.add(sand);

    // Heart traced in sand
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0.3);
    heartShape.bezierCurveTo(0.3, 0.6, 0.6, 0.4, 0.6, 0.05);
    heartShape.bezierCurveTo(0.6, -0.25, 0.3, -0.5, 0, -0.85);
    heartShape.bezierCurveTo(-0.3, -0.5, -0.6, -0.25, -0.6, 0.05);
    heartShape.bezierCurveTo(-0.6, 0.4, -0.3, 0.6, 0, 0.3);
    const heartGeom = new THREE.ShapeGeometry(heartShape);
    const heart = new THREE.Mesh(
      heartGeom,
      new THREE.MeshStandardMaterial({ color: 0xC97A4A, side: THREE.DoubleSide, transparent: true, opacity: 0 })
    );
    heart.rotation.x = -Math.PI / 2;
    heart.position.set(0, -1.95, 0);
    heart.scale.setScalar(1.8);
    scene.add(heart);

    // Seashells around heart
    const shells = [];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const shell = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 14, 14, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({
          color: [0xFFE4E1, 0xFFFFFF, palette.secondary][i % 3],
          metalness: 0.2, roughness: 0.4,
        })
      );
      shell.position.set(Math.cos(a) * 2.2, -1.9, Math.sin(a) * 2.2);
      shell.rotation.x = Math.PI;
      shell.scale.set(0, 0, 0);
      scene.add(shell);
      shells.push(shell);
    }

    // Floating ring (engagement)
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.07, 24, 80),
      new THREE.MeshStandardMaterial({
        color: palette.accent, metalness: 0.95, roughness: 0.05, emissive: palette.accent, emissiveIntensity: 0.4,
      })
    );
    ring.position.set(0, 1.5, 0);
    ring.scale.set(0, 0, 0);
    scene.add(ring);

    // Diamond on ring
    const diamond = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.13, 0),
      new THREE.MeshStandardMaterial({
        color: 0xFFFFFF, metalness: 0.7, roughness: 0.1, emissive: 0xFFFFFF, emissiveIntensity: 0.5,
      })
    );
    ring.add(diamond);
    diamond.position.set(0, 0.5, 0);

    // Bubbles
    const bubbles = [];
    for (let i = 0; i < particleCount / 4; i++) {
      const bubble = new THREE.Mesh(
        new THREE.SphereGeometry(0.04 + Math.random() * 0.05, 8, 8),
        new THREE.MeshStandardMaterial({
          color: 0xCFE9FF, transparent: true, opacity: 0.4, emissive: 0xFFFFFF, emissiveIntensity: 0.2,
        })
      );
      bubble.position.set((Math.random() - 0.5) * 12, -2 + Math.random() * 4, (Math.random() - 0.5) * 6);
      bubble.userData = { vy: 0.005 + Math.random() * 0.015 };
      scene.add(bubble);
      bubbles.push(bubble);
    }

    return {
      animate: (elapsed, stage, stages) => {
        if (elapsed >= stages[0]) {
          const t = Math.min(elapsed / stages[1], 1);
          heart.material.opacity = t * 0.85;
        }
        if (elapsed >= stages[1]) {
          const t = Math.min((elapsed - stages[1]) / (stages[2] - stages[1]), 1);
          shells.forEach((s, i) => {
            const delay = (i / shells.length) * 0.6;
            if (t > delay) s.scale.setScalar(Math.min((t - delay) / 0.4, 1));
          });
        }
        if (elapsed >= stages[2]) {
          const t = Math.min((elapsed - stages[2]) / (stages[3] - stages[2]), 1);
          ring.scale.setScalar(t);
          ring.rotation.y = elapsed * 0.0015;
          ring.position.y = 1.5 + Math.sin(elapsed * 0.001) * 0.2;
          diamond.rotation.y = elapsed * 0.003;
        }
        bubbles.forEach((b) => {
          b.position.y += b.userData.vy;
          if (b.position.y > 4) b.position.y = -2;
        });
      },
    };
  },
});

export default BeachEngagementOpening;
