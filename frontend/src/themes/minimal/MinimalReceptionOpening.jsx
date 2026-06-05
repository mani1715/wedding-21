/**
 * MinimalReceptionOpening — Cool minimalist reception
 * Spinning torus → dance floor light grid → confetti → names.
 */
import { createThemeOpening } from '../shared/createThemeOpening';
import { createMinimalSoundController } from './minimal.sounds';

const palette = {
  bg: '#0A0A14',
  accent: '#9FCBFF',
  primary: '#FFFFFF',
  secondary: '#FF66CC',
  text: '#FFFFFF',
};

const MinimalReceptionOpening = createThemeOpening({
  palette,
  intro: { title: 'Reception', cta: 'Tap to Begin', finalSubtitle: 'Celebrate Together', testid: 'minimal-reception' },
  ambient: 0x223044,
  ambientIntensity: 0.35,
  soundFactory: createMinimalSoundController,
  audioVolume: 0.55,
  onStageChange: (stage, ctl) => {
    if (stage > 0 && ctl?.pianoNote) ctl.pianoNote();
  },
  setupScene: (scene, { THREE, particleCount }) => {
    const l1 = new THREE.PointLight(palette.accent, 2.5, 22);
    l1.position.set(0, 5, 4); scene.add(l1);
    const l2 = new THREE.PointLight(palette.secondary, 2, 18);
    l2.position.set(-3, 3, 3); scene.add(l2);
    const l3 = new THREE.PointLight(palette.primary, 1.4, 18);
    l3.position.set(3, 3, 3); scene.add(l3);

    // Dance floor grid (illuminated tiles)
    const tiles = [];
    const gridSize = 6;
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const tile = new THREE.Mesh(
          new THREE.PlaneGeometry(0.7, 0.7),
          new THREE.MeshStandardMaterial({
            color: (i + j) % 2 ? palette.accent : palette.secondary,
            emissive: (i + j) % 2 ? palette.accent : palette.secondary,
            emissiveIntensity: 0.4,
            transparent: true, opacity: 0,
          })
        );
        tile.rotation.x = -Math.PI / 2;
        tile.position.set(-2 + i * 0.8, -2, -2 + j * 0.8);
        tile.userData = { phase: (i + j) * 0.4 };
        scene.add(tile);
        tiles.push(tile);
      }
    }

    // Spinning torus / disco ring
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(1.2, 0.05, 24, 100),
      new THREE.MeshPhysicalMaterial({
        color: palette.primary, metalness: 0.9, roughness: 0.1, emissive: palette.primary, emissiveIntensity: 0.5,
      })
    );
    torus.position.set(0, 0.8, 0);
    torus.scale.set(0, 0, 0);
    scene.add(torus);

    // Disco ball
    const ball = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.4, 1),
      new THREE.MeshStandardMaterial({
        color: 0xFFFFFF, metalness: 0.95, roughness: 0.05, emissive: 0xFFFFFF, emissiveIntensity: 0.3, flatShading: true,
      })
    );
    ball.position.set(0, 2.5, 0);
    ball.scale.set(0, 0, 0);
    scene.add(ball);

    // Confetti
    const confetti = [];
    for (let i = 0; i < 80; i++) {
      const c = new THREE.Mesh(
        new THREE.PlaneGeometry(0.1, 0.16),
        new THREE.MeshBasicMaterial({
          color: [palette.accent, palette.secondary, palette.primary, 0xFFD700][i % 4],
          side: THREE.DoubleSide, transparent: true, opacity: 0,
        })
      );
      c.position.set((Math.random() - 0.5) * 12, 5 + Math.random() * 4, (Math.random() - 0.5) * 6);
      c.userData = { vy: -0.025 - Math.random() * 0.04, vr: (Math.random() - 0.5) * 0.12 };
      scene.add(c);
      confetti.push(c);
    }

    // Light beams from above
    const beams = [];
    for (let i = 0; i < 6; i++) {
      const beam = new THREE.Mesh(
        new THREE.ConeGeometry(0.4, 4, 16, 1, true),
        new THREE.MeshBasicMaterial({
          color: [palette.accent, palette.secondary][i % 2],
          transparent: true, opacity: 0, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        })
      );
      beam.position.set(-2.5 + i, 4, 0);
      beam.userData = { phase: i * 0.5 };
      scene.add(beam);
      beams.push(beam);
    }

    return {
      animate: (elapsed, stage, stages) => {
        if (elapsed >= stages[0]) {
          const t = Math.min(elapsed / stages[1], 1);
          tiles.forEach((tile) => {
            tile.material.opacity = t * (0.6 + Math.sin(elapsed * 0.003 + tile.userData.phase) * 0.4);
          });
        }
        if (elapsed >= stages[1]) {
          const t = Math.min((elapsed - stages[1]) / (stages[2] - stages[1]), 1);
          torus.scale.setScalar(t);
          torus.rotation.x = elapsed * 0.001;
          torus.rotation.y = elapsed * 0.0015;
        }
        if (elapsed >= stages[2]) {
          const t = Math.min((elapsed - stages[2]) / (stages[3] - stages[2]), 1);
          ball.scale.setScalar(t);
          ball.rotation.y = elapsed * 0.003;
          beams.forEach((b, i) => {
            b.material.opacity = t * 0.35;
            b.rotation.z = Math.sin(elapsed * 0.002 + b.userData.phase) * 0.4;
          });
        }
        if (elapsed >= stages[3]) {
          confetti.forEach((c) => {
            c.material.opacity = 1;
            c.position.y += c.userData.vy;
            c.rotation.z += c.userData.vr;
            if (c.position.y < -3) c.position.y = 8;
          });
        }
      },
    };
  },
});

export default MinimalReceptionOpening;
