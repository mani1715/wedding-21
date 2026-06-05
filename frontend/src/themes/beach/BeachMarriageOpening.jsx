/**
 * BeachMarriageOpening — Sunset destination wedding
 * Ocean horizon → bamboo arch rises → seabirds fly → names against sunset.
 */
import { createThemeOpening } from '../shared/createThemeOpening';
import { createBeachSoundController } from './beach.sounds';

const palette = {
  bg: '#030E1A',
  accent: '#E9C46A',
  primary: '#F4A261',
  secondary: '#E76F51',
  text: '#FFF6E0',
};

const BeachMarriageOpening = createThemeOpening({
  palette,
  intro: { title: 'Beach Wedding', cta: 'Tap to Begin', finalSubtitle: 'Where the Sea Meets Forever', testid: 'beach-marriage' },
  ambient: 0xFFCC88,
  ambientIntensity: 0.45,
  cameraConfig: { fov: 60, pos: [0, 0.5, 8] },
  soundFactory: createBeachSoundController,
  audioVolume: 0.6,
  onStageChange: (stage, ctl) => {
    if (stage === 1 && ctl?.chime) ctl.chime();
  },
  setupScene: (scene, { THREE, particleCount }) => {
    const sun = new THREE.PointLight(palette.primary, 3, 30);
    sun.position.set(0, 2, -5); scene.add(sun);
    const warm = new THREE.PointLight(palette.accent, 1.4, 18);
    warm.position.set(-3, 4, 3); scene.add(warm);

    // Sunset gradient disk (sun in horizon)
    const sunDisk = new THREE.Mesh(
      new THREE.CircleGeometry(1.6, 64),
      new THREE.MeshBasicMaterial({ color: palette.primary, transparent: true, opacity: 0.85 })
    );
    sunDisk.position.set(0, -0.5, -8);
    sunDisk.scale.set(0, 0, 0);
    scene.add(sunDisk);

    // Sky gradient (large sphere)
    const skyMat = new THREE.MeshBasicMaterial({
      color: palette.secondary, side: THREE.BackSide, transparent: true, opacity: 0.35,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(40, 32, 16), skyMat);
    scene.add(sky);

    // Ocean (animated plane)
    const oceanGeom = new THREE.PlaneGeometry(40, 24, 80, 50);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0B2C45, roughness: 0.2, metalness: 0.7, emissive: 0x041220, emissiveIntensity: 0.3,
    });
    const ocean = new THREE.Mesh(oceanGeom, oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -2;
    scene.add(ocean);
    const baseY = new Float32Array(oceanGeom.attributes.position.count);
    for (let i = 0; i < baseY.length; i++) baseY[i] = oceanGeom.attributes.position.getZ(i);

    // Bamboo arch
    const archGroup = new THREE.Group();
    const bambooMat = new THREE.MeshStandardMaterial({ color: 0xC9A678, roughness: 0.5 });
    const leftPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.5, 8), bambooMat);
    leftPole.position.set(-1.6, 0, 0); archGroup.add(leftPole);
    const rightPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.5, 8), bambooMat.clone());
    rightPole.position.set(1.6, 0, 0); archGroup.add(rightPole);
    const top = new THREE.Mesh(
      new THREE.TorusGeometry(1.6, 0.08, 8, 24, Math.PI),
      bambooMat.clone()
    );
    top.position.set(0, 1.75, 0);
    archGroup.add(top);

    // Flowers along arch
    for (let i = 0; i < 14; i++) {
      const t = i / 14;
      const a = Math.PI - t * Math.PI;
      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 12, 12),
        new THREE.MeshStandardMaterial({
          color: [palette.primary, palette.accent, palette.secondary][i % 3],
          emissive: palette.primary, emissiveIntensity: 0.15,
        })
      );
      flower.position.set(Math.cos(a) * 1.6, 1.75 + Math.sin(a) * 1.6, 0);
      archGroup.add(flower);
    }
    archGroup.position.set(0, -1.5, 0);
    archGroup.scale.set(0, 0, 0);
    scene.add(archGroup);

    // Seabirds (silhouettes)
    const birds = [];
    for (let i = 0; i < 8; i++) {
      const bird = new THREE.Mesh(
        new THREE.PlaneGeometry(0.3, 0.08),
        new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide, transparent: true, opacity: 0 })
      );
      bird.position.set(-8 + i * 2, 2 + Math.random() * 2, -3 - Math.random() * 3);
      bird.userData = { speed: 0.01 + Math.random() * 0.02, phase: Math.random() * Math.PI * 2 };
      scene.add(bird);
      birds.push(bird);
    }

    // Foam particles
    const foamGeom = new THREE.BufferGeometry();
    const arr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 18;
      arr[i * 3 + 1] = -2 + Math.random() * 0.5;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    foamGeom.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const foam = new THREE.Points(foamGeom, new THREE.PointsMaterial({
      color: 0xFFFFFF, size: 0.07, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending,
    }));
    scene.add(foam);

    return {
      animate: (elapsed, stage, stages) => {
        // Ocean ripple
        const pos = oceanGeom.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i), y = pos.getY(i);
          pos.setZ(i, Math.sin(x * 0.6 + elapsed * 0.0015) * 0.15 + Math.cos(y * 0.5 + elapsed * 0.001) * 0.12);
        }
        pos.needsUpdate = true;

        if (elapsed >= stages[0]) {
          const t = Math.min(elapsed / stages[1], 1);
          sunDisk.scale.setScalar(t);
          sunDisk.position.y = -0.5 + t * 0.8;
        }
        if (elapsed >= stages[1]) {
          const t = Math.min((elapsed - stages[1]) / (stages[2] - stages[1]), 1);
          archGroup.scale.setScalar(t);
        }
        if (elapsed >= stages[2]) {
          const t = Math.min((elapsed - stages[2]) / (stages[4] - stages[2]), 1);
          birds.forEach((b, i) => {
            b.material.opacity = t * 0.85;
            b.position.x += b.userData.speed * 30;
            if (b.position.x > 9) b.position.x = -9;
            b.position.y += Math.sin(elapsed * 0.003 + b.userData.phase) * 0.005;
          });
        }
        foam.rotation.y += 0.0004;
      },
    };
  },
});

export default BeachMarriageOpening;
