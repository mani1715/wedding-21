/**
 * NatureMarriageOpening — Lush garden wedding
 * Tree of life grows → flower canopy blooms → butterflies emerge → names.
 */
import { createThemeOpening } from '../shared/createThemeOpening';
import { createNatureSoundController } from './nature.sounds';

const palette = {
  bg: '#030D03',
  accent: '#CDDC39',
  primary: '#2E7D32',
  secondary: '#FFEB3B',
  text: '#F2FFE6',
};

const NatureMarriageOpening = createThemeOpening({
  palette,
  intro: { title: 'Garden Wedding', cta: 'Tap to Begin', finalSubtitle: 'A Union in Nature', testid: 'nature-marriage' },
  ambient: 0x6BAE5F,
  ambientIntensity: 0.45,
  soundFactory: createNatureSoundController,
  audioVolume: 0.55,
  onStageChange: (stage, ctl) => {
    if ((stage === 2 || stage === 3) && ctl?.chirp) ctl.chirp();
  },
  setupScene: (scene, { THREE, particleCount }) => {
    const l1 = new THREE.PointLight(palette.secondary, 2, 22);
    l1.position.set(0, 6, 4); scene.add(l1);
    const l2 = new THREE.PointLight(palette.accent, 1.4, 18);
    l2.position.set(-3, 3, 3); scene.add(l2);

    // Tree trunk
    const trunkGroup = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.3, 3, 12),
      new THREE.MeshStandardMaterial({ color: 0x3E2723, roughness: 0.9 })
    );
    trunkGroup.add(trunk);

    // Branches
    const branches = [];
    for (let i = 0; i < 6; i++) {
      const branch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.08, 1.4, 8),
        new THREE.MeshStandardMaterial({ color: 0x4E342E, roughness: 0.85 })
      );
      const a = (i / 6) * Math.PI * 2;
      branch.position.set(Math.cos(a) * 0.4, 0.8 + Math.sin(a) * 0.3, Math.sin(a) * 0.4);
      branch.rotation.z = -a;
      branch.rotation.x = Math.PI / 3;
      branch.scale.y = 0;
      trunkGroup.add(branch);
      branches.push(branch);
    }
    trunkGroup.position.set(0, -1.5, 0);
    trunkGroup.scale.y = 0;
    scene.add(trunkGroup);

    // Flower canopy (sphere of petals)
    const canopy = new THREE.Group();
    for (let i = 0; i < 60; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 10, 10),
        new THREE.MeshStandardMaterial({
          color: [palette.secondary, palette.accent, 0xFFB6C1, 0xFFFFFF][i % 4],
          emissive: palette.secondary, emissiveIntensity: 0.2,
        })
      );
      flower.position.set(
        Math.sin(phi) * Math.cos(theta) * 1.6,
        Math.cos(phi) * 1.6 + 2,
        Math.sin(phi) * Math.sin(theta) * 1.6
      );
      canopy.add(flower);
    }
    canopy.scale.set(0, 0, 0);
    scene.add(canopy);

    // Butterflies
    const butterflies = [];
    for (let i = 0; i < 10; i++) {
      const bf = new THREE.Group();
      const wingMat = new THREE.MeshStandardMaterial({
        color: [palette.secondary, palette.accent, 0xFFB6C1][i % 3],
        side: THREE.DoubleSide, transparent: true, opacity: 0.9, emissive: palette.secondary, emissiveIntensity: 0.15,
      });
      const leftWing = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.18), wingMat);
      leftWing.position.x = -0.13;
      bf.add(leftWing);
      const rightWing = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.18), wingMat.clone());
      rightWing.position.x = 0.13;
      bf.add(rightWing);
      bf.userData = {
        angle: Math.random() * Math.PI * 2,
        radius: 2 + Math.random() * 2,
        ySpeed: 0.0008 + Math.random() * 0.001,
        yBase: 1 + Math.random() * 2,
        leftWing, rightWing,
      };
      bf.scale.set(0, 0, 0);
      scene.add(bf);
      butterflies.push(bf);
    }

    // Pollen dust
    const dustGeom = new THREE.BufferGeometry();
    const arr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 15;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    dustGeom.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const dust = new THREE.Points(dustGeom, new THREE.PointsMaterial({
      color: palette.secondary, size: 0.05, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending,
    }));
    scene.add(dust);

    return {
      animate: (elapsed, stage, stages) => {
        if (elapsed >= stages[0]) {
          const t = Math.min(elapsed / stages[1], 1);
          trunkGroup.scale.y = t;
          branches.forEach((br) => { br.scale.y = t; });
        }
        if (elapsed >= stages[1]) {
          const t = Math.min((elapsed - stages[1]) / (stages[2] - stages[1]), 1);
          canopy.scale.setScalar(t);
          canopy.rotation.y = elapsed * 0.0005;
        }
        if (elapsed >= stages[2]) {
          const t = Math.min((elapsed - stages[2]) / (stages[4] - stages[2]), 1);
          butterflies.forEach((bf, i) => {
            const delay = (i / butterflies.length) * 0.5;
            if (t > delay) {
              const ts = Math.min((t - delay) / 0.5, 1);
              bf.scale.setScalar(ts);
              const a = bf.userData.angle + elapsed * 0.0008;
              bf.position.x = Math.cos(a) * bf.userData.radius;
              bf.position.z = Math.sin(a) * bf.userData.radius;
              bf.position.y = bf.userData.yBase + Math.sin(elapsed * bf.userData.ySpeed) * 0.5;
              const flap = Math.sin(elapsed * 0.02) * 0.6;
              bf.userData.leftWing.rotation.y = flap;
              bf.userData.rightWing.rotation.y = -flap;
              bf.lookAt(0, bf.position.y, 0);
            }
          });
        }
        dust.rotation.y += 0.0008;
      },
    };
  },
});

export default NatureMarriageOpening;
