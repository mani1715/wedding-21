/**
 * NatureReceptionOpening — Forest reception with lanterns
 * Tree silhouettes → mason jar lanterns light up → leaves spiral → names.
 */
import { createThemeOpening } from '../shared/createThemeOpening';
import { createNatureSoundController } from './nature.sounds';

const palette = {
  bg: '#020A05',
  accent: '#FFD54F',
  primary: '#FF9800',
  secondary: '#7CB342',
  text: '#FFF6D5',
};

const NatureReceptionOpening = createThemeOpening({
  palette,
  intro: { title: 'Forest Reception', cta: 'Tap to Begin', finalSubtitle: 'An Enchanted Evening', testid: 'nature-reception' },
  ambient: 0x1A2A1A,
  ambientIntensity: 0.3,
  soundFactory: createNatureSoundController,
  audioVolume: 0.5,
  onStageChange: (stage, ctl) => {
    if ((stage === 2 || stage === 3) && ctl?.chirp) ctl.chirp();
  },
  setupScene: (scene, { THREE, particleCount }) => {
    const l1 = new THREE.PointLight(palette.accent, 2.5, 22);
    l1.position.set(0, 4, 4); scene.add(l1);
    const l2 = new THREE.PointLight(palette.primary, 1.6, 16);
    l2.position.set(-3, 2, 3); scene.add(l2);

    // Tree silhouettes (background)
    const trees = [];
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x0E1F0E, roughness: 0.95 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x1B3A1B, roughness: 0.9, emissive: 0x051705, emissiveIntensity: 0.4 });
    for (let i = 0; i < 7; i++) {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 2.5, 8), trunkMat.clone());
      tree.add(trunk);
      const crown = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 12), leafMat.clone());
      crown.position.y = 1.8;
      tree.add(crown);
      tree.position.set(-6 + i * 2, -1, -3 - Math.random() * 2);
      tree.scale.y = 0;
      scene.add(tree);
      trees.push(tree);
    }

    // Hanging mason jar lanterns
    const lanterns = [];
    for (let i = 0; i < 9; i++) {
      const jar = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.16, 0.32, 14),
        new THREE.MeshPhysicalMaterial({
          color: 0xFFE6A0, metalness: 0.1, roughness: 0.1, transparent: true, opacity: 0.45,
          transmission: 0.6, emissive: palette.accent, emissiveIntensity: 0.6,
        })
      );
      jar.add(body);
      const lid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 0.06, 14),
        new THREE.MeshStandardMaterial({ color: 0x7E7E7E, metalness: 0.6, roughness: 0.5 })
      );
      lid.position.y = 0.19;
      jar.add(lid);
      // String
      const string = new THREE.Mesh(
        new THREE.CylinderGeometry(0.005, 0.005, 2, 4),
        new THREE.MeshStandardMaterial({ color: 0x2D2D2D })
      );
      string.position.y = 1.2;
      jar.add(string);
      jar.position.set(-4 + i, 2 + Math.random(), 0);
      jar.userData = { phase: Math.random() * Math.PI * 2, body };
      jar.scale.set(0, 0, 0);
      scene.add(jar);
      lanterns.push(jar);
    }

    // Spiraling leaves
    const leaves = [];
    for (let i = 0; i < 28; i++) {
      const leaf = new THREE.Mesh(
        new THREE.PlaneGeometry(0.15, 0.08),
        new THREE.MeshStandardMaterial({
          color: [palette.primary, palette.accent, 0xC97E3D, palette.secondary][i % 4],
          side: THREE.DoubleSide, transparent: true, opacity: 0,
        })
      );
      leaf.userData = {
        angle: Math.random() * Math.PI * 2,
        radius: 1 + Math.random() * 3,
        fall: 0.005 + Math.random() * 0.015,
        spin: (Math.random() - 0.5) * 0.06,
        y: 4 + Math.random() * 3,
      };
      scene.add(leaf);
      leaves.push(leaf);
    }

    // Fireflies / sparks
    const sparkGeom = new THREE.BufferGeometry();
    const sparkArr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      sparkArr[i * 3] = (Math.random() - 0.5) * 14;
      sparkArr[i * 3 + 1] = (Math.random() - 0.5) * 8;
      sparkArr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    sparkGeom.setAttribute('position', new THREE.BufferAttribute(sparkArr, 3));
    const sparks = new THREE.Points(sparkGeom, new THREE.PointsMaterial({
      color: palette.accent, size: 0.06, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending,
    }));
    scene.add(sparks);

    return {
      animate: (elapsed, stage, stages) => {
        if (elapsed >= stages[0]) {
          const t = Math.min(elapsed / stages[1], 1);
          trees.forEach((tr, i) => {
            const delay = i * 0.08;
            if (t > delay) tr.scale.y = Math.min((t - delay) / 0.5, 1);
          });
        }
        if (elapsed >= stages[1]) {
          const t = Math.min((elapsed - stages[1]) / (stages[2] - stages[1]), 1);
          lanterns.forEach((l, i) => {
            const delay = (i / lanterns.length) * 0.5;
            if (t > delay) {
              const ts = Math.min((t - delay) / 0.4, 1);
              l.scale.setScalar(ts);
              l.position.y += Math.sin(elapsed * 0.001 + l.userData.phase) * 0.005;
              l.userData.body.material.emissiveIntensity = 0.6 + Math.sin(elapsed * 0.003 + l.userData.phase) * 0.3;
            }
          });
        }
        if (elapsed >= stages[2]) {
          const t = Math.min((elapsed - stages[2]) / (stages[4] - stages[2]), 1);
          leaves.forEach((lf) => {
            lf.material.opacity = t * 0.9;
            const a = lf.userData.angle + elapsed * 0.001;
            lf.position.x = Math.cos(a) * lf.userData.radius;
            lf.position.z = Math.sin(a) * lf.userData.radius;
            lf.userData.y -= lf.userData.fall;
            if (lf.userData.y < -2) lf.userData.y = 5;
            lf.position.y = lf.userData.y;
            lf.rotation.z += lf.userData.spin;
          });
        }
        sparks.rotation.y += 0.0007;
      },
    };
  },
});

export default NatureReceptionOpening;
