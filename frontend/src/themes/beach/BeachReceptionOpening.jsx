/**
 * BeachReceptionOpening — Tropical reception under stars
 * Tiki torches light up → lanterns rise → fairy lights twinkle → names.
 */
import { createThemeOpening } from '../shared/createThemeOpening';
import { createBeachSoundController } from './beach.sounds';

const palette = {
  bg: '#040917',
  accent: '#E9C46A',
  primary: '#F4A261',
  secondary: '#E76F51',
  text: '#FFF1B5',
};

const BeachReceptionOpening = createThemeOpening({
  palette,
  intro: { title: 'Beach Reception', cta: 'Tap to Begin', finalSubtitle: 'A Night Beneath the Stars', testid: 'beach-reception' },
  ambient: 0x223040,
  ambientIntensity: 0.3,
  soundFactory: createBeachSoundController,
  audioVolume: 0.55,
  onStageChange: (stage, ctl) => {
    if (stage === 2 && ctl?.chime) ctl.chime();
  },
  setupScene: (scene, { THREE, particleCount }) => {
    const moonLight = new THREE.PointLight(0xB8C5D4, 1.6, 25);
    moonLight.position.set(0, 6, -3); scene.add(moonLight);
    const fire = new THREE.PointLight(palette.primary, 2, 12);
    fire.position.set(-3, 0, 2); scene.add(fire);

    // Stars
    const starGeom = new THREE.BufferGeometry();
    const starArr = new Float32Array(400 * 3);
    for (let i = 0; i < 400; i++) {
      const phi = Math.random() * Math.PI;
      const theta = Math.random() * Math.PI * 2;
      starArr[i * 3] = Math.sin(phi) * Math.cos(theta) * 25;
      starArr[i * 3 + 1] = Math.cos(phi) * 25 * 0.5 + 3;
      starArr[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * 25 - 5;
    }
    starGeom.setAttribute('position', new THREE.BufferAttribute(starArr, 3));
    const stars = new THREE.Points(starGeom, new THREE.PointsMaterial({
      color: 0xFFFFFF, size: 0.08, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending,
    }));
    scene.add(stars);

    // Tiki torches
    const torches = [];
    for (let i = 0; i < 4; i++) {
      const torch = new THREE.Group();
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 1.8, 8),
        new THREE.MeshStandardMaterial({ color: 0x4A3018, roughness: 0.8 })
      );
      torch.add(pole);
      const flame = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 12, 12),
        new THREE.MeshStandardMaterial({
          color: palette.primary, emissive: palette.primary, emissiveIntensity: 1.5, transparent: true, opacity: 0.9,
        })
      );
      flame.position.y = 1;
      torch.add(flame);
      torch.userData = { flame };
      torch.position.set(-3 + i * 2, -1.5, 1);
      torch.scale.set(0, 0, 0);
      scene.add(torch);
      torches.push(torch);
    }

    // Floating sky lanterns
    const lanterns = [];
    for (let i = 0; i < 12; i++) {
      const lantern = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 12, 12),
        new THREE.MeshStandardMaterial({
          color: palette.accent, emissive: palette.accent, emissiveIntensity: 0.9,
          transparent: true, opacity: 0.85,
        })
      );
      lantern.add(body);
      lantern.position.set((Math.random() - 0.5) * 10, -1, (Math.random() - 0.5) * 5);
      lantern.userData = { rise: 0.005 + Math.random() * 0.01, drift: Math.random() * Math.PI * 2 };
      lantern.scale.set(0, 0, 0);
      scene.add(lantern);
      lanterns.push(lantern);
    }

    // Fairy light string
    const fairyLights = [];
    for (let i = 0; i < 36; i++) {
      const t = (i / 36) * Math.PI;
      const light = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 8),
        new THREE.MeshStandardMaterial({
          color: palette.accent, emissive: palette.accent, emissiveIntensity: 1, transparent: true, opacity: 0,
        })
      );
      light.position.set(-5 + Math.cos(t) * 5, 3 - Math.sin(t) * 0.5, 0);
      light.userData = { phase: Math.random() * Math.PI * 2 };
      scene.add(light);
      fairyLights.push(light);
    }

    // Sparkle drift
    const sparkGeom = new THREE.BufferGeometry();
    const sparkArr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      sparkArr[i * 3] = (Math.random() - 0.5) * 15;
      sparkArr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      sparkArr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    sparkGeom.setAttribute('position', new THREE.BufferAttribute(sparkArr, 3));
    const sparks = new THREE.Points(sparkGeom, new THREE.PointsMaterial({
      color: palette.accent, size: 0.06, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending,
    }));
    scene.add(sparks);

    return {
      animate: (elapsed, stage, stages) => {
        if (elapsed >= stages[0]) {
          const t = Math.min(elapsed / stages[1], 1);
          torches.forEach((tk, i) => {
            const delay = i * 0.1;
            if (t > delay) {
              const ts = Math.min((t - delay) / 0.5, 1);
              tk.scale.setScalar(ts);
              tk.userData.flame.scale.y = 1 + Math.sin(elapsed * 0.01 + i) * 0.4;
            }
          });
        }
        if (elapsed >= stages[1]) {
          const t = Math.min((elapsed - stages[1]) / (stages[3] - stages[1]), 1);
          lanterns.forEach((l, i) => {
            const delay = (i / lanterns.length) * 0.5;
            if (t > delay) {
              const ts = Math.min((t - delay) / 0.4, 1);
              l.scale.setScalar(ts);
              l.position.y += l.userData.rise;
              l.position.x += Math.sin(elapsed * 0.001 + l.userData.drift) * 0.003;
            }
          });
        }
        if (elapsed >= stages[2]) {
          const t = Math.min((elapsed - stages[2]) / (stages[4] - stages[2]), 1);
          fairyLights.forEach((fl, i) => {
            const delay = (i / fairyLights.length) * 0.5;
            if (t > delay) {
              const ts = Math.min((t - delay) / 0.3, 1);
              fl.material.opacity = ts * (0.6 + Math.sin(elapsed * 0.005 + fl.userData.phase) * 0.4);
            }
          });
        }
        stars.material.opacity = 0.6 + Math.sin(elapsed * 0.003) * 0.3;
        sparks.rotation.y += 0.0006;
      },
    };
  },
});

export default BeachReceptionOpening;
