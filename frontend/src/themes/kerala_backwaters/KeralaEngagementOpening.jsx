/**
 * KeralaEngagementOpening — Kerala traditional engagement
 * Lotus blooms on water → brass lamp lights → jasmine garland → names.
 */
import { createThemeOpening } from '../shared/createThemeOpening';
import { createKeralaSoundController } from './kerala.sounds';

const palette = {
  bg: '#0E2530',
  accent: '#D4A24C',
  primary: '#FFD700',
  secondary: '#FFFFFF',
  text: '#FFEAC2',
};

const KeralaEngagementOpening = createThemeOpening({
  palette,
  intro: { title: 'Kerala Engagement', cta: 'Tap to Begin', finalSubtitle: 'Nischayam · A Promise Made', testid: 'kerala-engagement' },
  ambient: 0x3A6878,
  ambientIntensity: 0.45,
  soundFactory: createKeralaSoundController,
  audioVolume: 0.55,
  onStageChange: (stage, ctl) => {
    if (stage === 1 && ctl?.swell) ctl.swell();
  },
  setupScene: (scene, { THREE, particleCount }) => {
    const l1 = new THREE.PointLight(palette.primary, 2.2, 22);
    l1.position.set(0, 4, 4); scene.add(l1);
    const l2 = new THREE.PointLight(palette.accent, 1.5, 18);
    l2.position.set(-3, 2, 3); scene.add(l2);

    // Water surface
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 12, 50, 30),
      new THREE.MeshStandardMaterial({
        color: 0x0F2D38, roughness: 0.2, metalness: 0.7, emissive: 0x082530, emissiveIntensity: 0.35,
      })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = -2;
    scene.add(water);

    // Central lotus
    const lotus = new THREE.Group();
    const petalMat = new THREE.MeshStandardMaterial({
      color: palette.secondary, emissive: palette.accent, emissiveIntensity: 0.3, roughness: 0.5, side: THREE.DoubleSide,
    });
    const petals = [];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12, 0, Math.PI), petalMat.clone());
      petal.position.set(Math.cos(a) * 0.35, 0, Math.sin(a) * 0.35);
      petal.rotation.y = -a;
      petal.rotation.x = -Math.PI / 4;
      petals.push(petal);
      lotus.add(petal);
    }
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 18, 18),
      new THREE.MeshStandardMaterial({ color: palette.primary, emissive: palette.primary, emissiveIntensity: 0.8 })
    );
    lotus.add(core);
    lotus.position.set(0, -1.6, 0);
    lotus.scale.set(0, 0, 0);
    scene.add(lotus);

    // Surrounding mini lotuses
    const miniLotuses = [];
    for (let i = 0; i < 6; i++) {
      const ml = new THREE.Group();
      for (let p = 0; p < 8; p++) {
        const pa = (p / 8) * Math.PI * 2;
        const petal = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 8, 8, 0, Math.PI),
          new THREE.MeshStandardMaterial({ color: 0xFFB6C1, roughness: 0.5, side: THREE.DoubleSide })
        );
        petal.position.set(Math.cos(pa) * 0.18, 0, Math.sin(pa) * 0.18);
        petal.rotation.y = -pa;
        petal.rotation.x = -Math.PI / 4;
        ml.add(petal);
      }
      const a = (i / 6) * Math.PI * 2;
      ml.position.set(Math.cos(a) * 2.5, -1.7, Math.sin(a) * 2.5);
      ml.scale.set(0, 0, 0);
      ml.userData = { phase: Math.random() * Math.PI * 2 };
      scene.add(ml);
      miniLotuses.push(ml);
    }

    // Brass lamps hanging
    const lamps = [];
    for (let i = 0; i < 5; i++) {
      const lamp = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 14, 14),
        new THREE.MeshStandardMaterial({
          color: palette.accent, emissive: palette.primary, emissiveIntensity: 1.2, metalness: 0.85, roughness: 0.2,
          transparent: true, opacity: 0.9,
        })
      );
      lamp.position.set(-3 + i * 1.5, 2.5, -0.5);
      lamp.userData = { phase: Math.random() * Math.PI * 2 };
      lamp.scale.set(0, 0, 0);
      scene.add(lamp);
      lamps.push(lamp);
    }

    // Jasmine petals drifting
    const pGeom = new THREE.BufferGeometry();
    const arr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 14;
      arr[i * 3 + 1] = Math.random() * 6 - 1;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    pGeom.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const petalsP = new THREE.Points(pGeom, new THREE.PointsMaterial({
      color: 0xFFFFFF, size: 0.06, transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending,
    }));
    scene.add(petalsP);

    return {
      animate: (elapsed, stage, stages) => {
        // Water ripple
        const pos = water.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i), y = pos.getY(i);
          pos.setZ(i, Math.sin(x * 0.5 + elapsed * 0.001) * 0.1 + Math.cos(y * 0.4 + elapsed * 0.0008) * 0.08);
        }
        pos.needsUpdate = true;

        if (elapsed >= stages[0]) {
          const t = Math.min(elapsed / stages[1], 1);
          lotus.scale.setScalar(t);
          lotus.rotation.y = elapsed * 0.0005;
          petals.forEach((p, i) => { p.rotation.x = -Math.PI / 4 + (1 - t) * 0.5; });
        }
        if (elapsed >= stages[1]) {
          const t = Math.min((elapsed - stages[1]) / (stages[2] - stages[1]), 1);
          miniLotuses.forEach((ml, i) => {
            const delay = (i / miniLotuses.length) * 0.5;
            if (t > delay) {
              ml.scale.setScalar(Math.min((t - delay) / 0.4, 1));
              ml.position.y = -1.7 + Math.sin(elapsed * 0.001 + ml.userData.phase) * 0.05;
            }
          });
        }
        if (elapsed >= stages[2]) {
          const t = Math.min((elapsed - stages[2]) / (stages[3] - stages[2]), 1);
          lamps.forEach((l, i) => {
            const delay = i * 0.08;
            if (t > delay) {
              l.scale.setScalar(Math.min((t - delay) / 0.4, 1));
              l.material.emissiveIntensity = 1.2 + Math.sin(elapsed * 0.004 + l.userData.phase) * 0.4;
            }
          });
        }
        // Drift petals
        const ps = petalsP.geometry.attributes.position.array;
        for (let i = 0; i < ps.length; i += 3) {
          ps[i + 1] -= 0.008;
          if (ps[i + 1] < -2) ps[i + 1] = 5;
        }
        petalsP.geometry.attributes.position.needsUpdate = true;
      },
    };
  },
});

export default KeralaEngagementOpening;
