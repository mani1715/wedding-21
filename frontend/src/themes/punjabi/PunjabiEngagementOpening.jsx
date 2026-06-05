/**
 * PunjabiEngagementOpening — Romantic Sikh engagement
 * Phulkari embroidery cloth unfurls → gold rings descend → rose petals swirl → names.
 */
import { createThemeOpening } from '../shared/createThemeOpening';
import { createPunjabiSoundController } from './punjabi.sounds';

const palette = {
  bg: '#1A0500',
  accent: '#FFD700',
  primary: '#DC143C',
  secondary: '#FF9933',
  text: '#FFF6D5',
};

const PunjabiEngagementOpening = createThemeOpening({
  palette,
  intro: { title: 'Punjabi Engagement', cta: 'Tap to Begin', finalSubtitle: 'Engagement Ceremony', testid: 'punjabi-engagement' },
  ambient: 0xFFE6D5,
  ambientIntensity: 0.45,
  soundFactory: createPunjabiSoundController,
  audioVolume: 0.55,
  setupScene: (scene, { THREE, particleCount }) => {
    const pl1 = new THREE.PointLight(palette.accent, 2, 18);
    pl1.position.set(-4, 4, 4);
    scene.add(pl1);
    const pl2 = new THREE.PointLight(palette.primary, 1.5, 18);
    pl2.position.set(4, 4, 4);
    scene.add(pl2);

    // Phulkari cloth (animated plane)
    const phulkari = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 4, 30, 15),
      new THREE.MeshStandardMaterial({
        color: palette.primary,
        emissive: palette.secondary,
        emissiveIntensity: 0.2,
        roughness: 0.7,
        side: THREE.DoubleSide,
      })
    );
    phulkari.position.set(0, -1.5, -2);
    phulkari.rotation.x = -Math.PI / 6;
    phulkari.scale.set(0, 0, 0);
    scene.add(phulkari);

    // Two interlocking gold rings
    const ringMat = new THREE.MeshStandardMaterial({
      color: palette.accent,
      metalness: 0.95,
      roughness: 0.05,
      emissive: palette.accent,
      emissiveIntensity: 0.45,
    });
    const ringA = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.08, 24, 80), ringMat);
    const ringB = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.08, 24, 80), ringMat.clone());
    ringA.position.set(-0.4, 1, 0);
    ringB.position.set(0.4, 1, 0);
    ringA.rotation.y = Math.PI / 6;
    ringB.rotation.y = -Math.PI / 6;
    ringA.scale.set(0, 0, 0);
    ringB.scale.set(0, 0, 0);
    scene.add(ringA, ringB);

    // Rose petals
    const petals = [];
    for (let i = 0; i < 40; i++) {
      const petal = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 8, 0, Math.PI),
        new THREE.MeshStandardMaterial({ color: i % 2 ? palette.primary : palette.secondary, transparent: true, opacity: 0 })
      );
      petal.userData = {
        angle: (i / 40) * Math.PI * 2,
        radius: 1.5 + Math.random() * 2,
        speed: 0.5 + Math.random() * 0.5,
        yOffset: Math.random() * 4,
      };
      scene.add(petal);
      petals.push(petal);
    }

    // Sparkles
    const sparkGeom = new THREE.BufferGeometry();
    const sparkArr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      sparkArr[i * 3] = (Math.random() - 0.5) * 15;
      sparkArr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      sparkArr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    sparkGeom.setAttribute('position', new THREE.BufferAttribute(sparkArr, 3));
    const sparks = new THREE.Points(sparkGeom, new THREE.PointsMaterial({
      color: palette.accent, size: 0.06, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending,
    }));
    scene.add(sparks);

    return {
      animate: (elapsed, stage, stages) => {
        // Stage 1: Phulkari unfurls
        if (elapsed >= stages[0]) {
          const t = Math.min(elapsed / stages[1], 1);
          phulkari.scale.set(t, t, t);
          phulkari.position.y = -1.5 + Math.sin(elapsed * 0.001) * 0.1;
        }
        // Stage 2: Rings descend & rotate
        if (elapsed >= stages[1]) {
          const t = Math.min((elapsed - stages[1]) / (stages[2] - stages[1]), 1);
          ringA.scale.setScalar(t);
          ringB.scale.setScalar(t);
          ringA.rotation.z = elapsed * 0.001;
          ringB.rotation.z = -elapsed * 0.001;
        }
        // Stage 3+: Petals swirl
        if (elapsed >= stages[2]) {
          petals.forEach((p, i) => {
            const t = Math.min((elapsed - stages[2]) / (stages[4] - stages[2]), 1);
            p.material.opacity = t * 0.95;
            const a = p.userData.angle + elapsed * 0.0008 * p.userData.speed;
            p.position.x = Math.cos(a) * p.userData.radius;
            p.position.z = Math.sin(a) * p.userData.radius;
            p.position.y = -2 + ((elapsed * 0.001 + p.userData.yOffset) % 5);
            p.rotation.x = a * 2;
          });
        }
        sparks.rotation.y += 0.0015;
      },
    };
  },
});

export default PunjabiEngagementOpening;
