/**
 * BengaliMarriageOpening — Sacred Bengali wedding ceremony
 * Conch shells sound → topor crown descends → sindoor splash → names.
 */
import { createThemeOpening } from '../shared/createThemeOpening';
import { createBengaliSoundController } from './bengali.sounds';

const palette = {
  bg: '#0D0505',
  accent: '#FFD700',
  primary: '#C00B0B',
  secondary: '#FFFFFF',
  text: '#FFE9C2',
};

const BengaliMarriageOpening = createThemeOpening({
  palette,
  intro: { title: 'Bengali Wedding', cta: 'Tap to Begin', finalSubtitle: 'Shubho Bibaho', testid: 'bengali-marriage' },
  ambient: 0xFFD7A0,
  ambientIntensity: 0.4,
  soundFactory: createBengaliSoundController,
  audioVolume: 0.55,
  onStageChange: (stage, ctl) => {
    if ((stage === 1 || stage === 3) && ctl?.shankha) ctl.shankha();
  },
  setupScene: (scene, { THREE, particleCount }) => {
    scene.add(new THREE.PointLight(palette.accent, 2, 18).clone());
    const l1 = new THREE.PointLight(palette.accent, 2, 18);
    l1.position.set(-3, 4, 4); scene.add(l1);
    const l2 = new THREE.PointLight(palette.primary, 1.6, 18);
    l2.position.set(3, 4, 4); scene.add(l2);

    // Conch shells (twin)
    const conchMat = new THREE.MeshStandardMaterial({
      color: palette.secondary, metalness: 0.4, roughness: 0.3,
      emissive: palette.accent, emissiveIntensity: 0.15,
    });
    const conchGroup = new THREE.Group();
    [-1, 1].forEach((sign) => {
      const conch = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.2, 12, 6, true), conchMat.clone());
      conch.position.x = sign * 1.5;
      conch.rotation.z = sign * Math.PI * 0.15;
      conch.position.y = 0.3;
      conchGroup.add(conch);
    });
    conchGroup.scale.set(0, 0, 0);
    scene.add(conchGroup);

    // Topor crown (cone with golden top)
    const toporGroup = new THREE.Group();
    const toporBase = new THREE.Mesh(
      new THREE.ConeGeometry(0.6, 1.2, 24),
      new THREE.MeshStandardMaterial({ color: palette.secondary, roughness: 0.6 })
    );
    toporGroup.add(toporBase);
    const toporTop = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 16),
      new THREE.MeshStandardMaterial({ color: palette.accent, metalness: 0.9, roughness: 0.1, emissive: palette.accent, emissiveIntensity: 0.5 })
    );
    toporTop.position.y = 0.7;
    toporGroup.add(toporTop);
    for (let i = 0; i < 8; i++) {
      const stripe = new THREE.Mesh(
        new THREE.TorusGeometry(0.6 - i * 0.07, 0.02, 8, 30),
        new THREE.MeshStandardMaterial({ color: palette.primary, emissive: palette.primary, emissiveIntensity: 0.3 })
      );
      stripe.position.y = -0.4 + i * 0.12;
      stripe.rotation.x = Math.PI / 2;
      toporGroup.add(stripe);
    }
    toporGroup.position.set(0, 5, 0);
    toporGroup.scale.set(0, 0, 0);
    scene.add(toporGroup);

    // Alpana motif (floor mandala)
    const alpana = new THREE.Group();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const petal = new THREE.Mesh(
        new THREE.PlaneGeometry(0.4, 1.2),
        new THREE.MeshStandardMaterial({ color: palette.secondary, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
      );
      petal.position.set(Math.cos(a) * 0.7, 0, Math.sin(a) * 0.7);
      petal.rotation.set(-Math.PI / 2, 0, -a);
      alpana.add(petal);
    }
    alpana.position.set(0, -2.2, 0);
    alpana.scale.set(0, 0, 0);
    scene.add(alpana);

    // Sindoor red particles
    const pGeom = new THREE.BufferGeometry();
    const pArr = new Float32Array(particleCount * 3);
    const pVel = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pArr[i * 3] = (Math.random() - 0.5) * 0.3;
      pArr[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
      pArr[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
      pVel[i * 3] = (Math.random() - 0.5) * 0.06;
      pVel[i * 3 + 1] = Math.random() * 0.03 + 0.01;
      pVel[i * 3 + 2] = (Math.random() - 0.5) * 0.06;
    }
    pGeom.setAttribute('position', new THREE.BufferAttribute(pArr, 3));
    const sindoor = new THREE.Points(pGeom, new THREE.PointsMaterial({
      color: palette.primary, size: 0.1, transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
    }));
    sindoor.userData = { vel: pVel };
    scene.add(sindoor);

    return {
      animate: (elapsed, stage, stages) => {
        if (elapsed >= stages[0]) {
          const t = Math.min(elapsed / stages[1], 1);
          conchGroup.scale.setScalar(t);
          conchGroup.rotation.y = elapsed * 0.0008;
        }
        if (elapsed >= stages[1]) {
          const t = Math.min((elapsed - stages[1]) / (stages[2] - stages[1]), 1);
          alpana.scale.setScalar(t);
          alpana.rotation.y = elapsed * 0.0006;
        }
        if (elapsed >= stages[2]) {
          const t = Math.min((elapsed - stages[2]) / (stages[3] - stages[2]), 1);
          toporGroup.scale.setScalar(t);
          toporGroup.position.y = 5 - t * 3.5;
          toporGroup.rotation.y = elapsed * 0.001;
        }
        if (elapsed >= stages[3]) {
          const t = Math.min((elapsed - stages[3]) / (stages[5] - stages[3]), 1);
          sindoor.material.opacity = Math.min(t * 1.4, 0.85);
          const pos = sindoor.geometry.attributes.position.array;
          for (let i = 0; i < particleCount; i++) {
            pos[i * 3] += sindoor.userData.vel[i * 3];
            pos[i * 3 + 1] += sindoor.userData.vel[i * 3 + 1];
            pos[i * 3 + 2] += sindoor.userData.vel[i * 3 + 2];
          }
          sindoor.geometry.attributes.position.needsUpdate = true;
        }
      },
    };
  },
});

export default BengaliMarriageOpening;
