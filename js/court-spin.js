import * as THREE from "three";
import { GLTFLoader } from "./vendor/GLTFLoader.js";

const frame = document.querySelector("[data-court]");
if (frame) {
  const canvas = frame.querySelector("canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, premultipliedAlpha: false });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(22, 1, 0.05, 40);

  scene.add(new THREE.AmbientLight(0xfff1e2, 0.38));

  const key = new THREE.DirectionalLight(0xfff6ee, 2.4);
  key.position.set(1.4, 2.6, 2.4);
  scene.add(key);

  const rimL = new THREE.DirectionalLight(0xff8a32, 4.2);
  rimL.position.set(-2.6, 1.5, -0.4);
  scene.add(rimL);

  const rimR = new THREE.DirectionalLight(0xffb15a, 3.4);
  rimR.position.set(2.4, 1.1, -1.2);
  scene.add(rimR);

  const back = new THREE.PointLight(0xe07a2f, 28, 8, 2);
  back.position.set(0, 0.4, -1.6);
  scene.add(back);

  const MODEL_H = 1.78;
  const FEET = -MODEL_H / 2;
  const pivot = new THREE.Group();
  scene.add(pivot);

  const gymTex = new THREE.TextureLoader().load("assets/gym-court.jpg?v=1");
  gymTex.colorSpace = THREE.SRGBColorSpace;
  gymTex.anisotropy = 8;

  const court = new THREE.Mesh(
    new THREE.PlaneGeometry(8.4, 4.72),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { map: { value: gymTex } },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        varying vec2 vUv;
        void main() {
          vec2 center = vec2(0.5, 0.764);
          vec2 delta = vUv - center;
          vec2 box = vec2(0.075, 0.1);
          float outside = max(abs(delta.x) / box.x, abs(delta.y) / box.y);
          float zoom = 1.0 - smoothstep(1.0, 1.65, outside);
          float scale = mix(1.0, 1.2, zoom);
          vec2 uv = center + delta / scale;
          vec4 color = texture2D(map, uv);
          float side = smoothstep(0.0, 0.07, vUv.x) * smoothstep(1.0, 0.93, vUv.x);
          float top = smoothstep(1.0, 0.96, vUv.y);
          float bot = smoothstep(0.0, 0.05, vUv.y);
          gl_FragColor = vec4(color.rgb, side * top * bot);
        }
      `
    })
  );
  court.position.set(0, -0.12, -2.7);
  scene.add(court);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(0.85, 64),
    new THREE.MeshBasicMaterial({ color: 0xe07a2f, transparent: true, opacity: 0.14, depthWrite: false })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = FEET + 0.02;
  scene.add(floor);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.46, 0.62, 72),
    new THREE.MeshBasicMaterial({ color: 0xffc48a, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = FEET + 0.03;
  scene.add(ring);

  const trophyGlows = [];
  const trophySpots = [];
  const trophyVert = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  function placeTrophy(url, x) {
    const tex = new THREE.TextureLoader().load(url);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const h = 0.86;
    const w = h * (864 / 1152);
    const y = FEET + h * 0.5 + 0.5;
    const glowMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { map: { value: tex }, strength: { value: 0.35 } },
      vertexShader: trophyVert,
      fragmentShader: `
        uniform sampler2D map;
        uniform float strength;
        varying vec2 vUv;
        void main() {
          float ink = 0.0;
          for (int i = -4; i <= 4; i++) {
            for (int j = -4; j <= 4; j++) {
              vec2 off = vec2(float(i), float(j)) * 0.014;
              vec4 sampleColor = texture2D(map, vUv + off);
              ink += smoothstep(0.05, 0.22, max(sampleColor.r, max(sampleColor.g, sampleColor.b)));
            }
          }
          ink /= 81.0;
          gl_FragColor = vec4(vec3(1.0, 0.62, 0.28), ink * strength);
        }
      `
    });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.45, h * 1.28), glowMat);
    glow.position.set(x, y, 0.02);
    scene.add(glow);
    trophyGlows.push(glowMat);

    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { map: { value: tex } },
        vertexShader: trophyVert,
        fragmentShader: `
          uniform sampler2D map;
          varying vec2 vUv;
          void main() {
            vec4 color = texture2D(map, vUv);
            float ink = smoothstep(0.03, 0.14, max(color.r, max(color.g, color.b)));
            float foot = smoothstep(0.0, 0.05, vUv.y);
            gl_FragColor = vec4(color.rgb, ink * foot);
          }
        `
      })
    );
    mesh.position.set(x, y, 0.2);
    scene.add(mesh);

    const spot = new THREE.Mesh(
      new THREE.CircleGeometry(0.24, 56),
      new THREE.MeshBasicMaterial({ color: 0xffc48a, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide })
    );
    spot.rotation.x = -Math.PI / 2;
    spot.position.set(x, y - h * 0.46, 0.2);
    scene.add(spot);
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.16, 0.25, 56),
      new THREE.MeshBasicMaterial({ color: 0xffc48a, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide })
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.set(x, y - h * 0.46, 0.2);
    scene.add(halo);
    trophySpots.push(spot.material, halo.material);
  }
  placeTrophy("assets/trophy-left.jpg?v=1", -0.9);
  placeTrophy("assets/trophy-right.jpg?v=1", 0.9);

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) pivot.rotation.y = 0.4;

  function fitCamera() {
    const fov = THREE.MathUtils.degToRad(camera.fov);
    const dist = (MODEL_H * 0.68) / Math.tan(fov / 2);
    camera.position.set(0, 0.04, dist);
    camera.lookAt(0, 0.06, 0);
  }

  new GLTFLoader().load(frame.dataset.court, (gltf) => {
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    model.scale.setScalar(MODEL_H / Math.max(size.y, 0.001));
    pivot.add(model);
    frame.classList.add("is-ready");
  });

  function resize() {
    const w = frame.clientWidth;
    const h = frame.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    fitCamera();
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  const turn = (Math.PI * 2) / 26;
  let last = performance.now();
  function tick(now) {
    const t = now / 1000;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!reduce) pivot.rotation.y += turn * dt;
    const pulse = 0.82 + Math.sin(t * 1.15) * 0.18;
    rimL.intensity = 4.2 * pulse;
    rimR.intensity = 3.4 * pulse;
    back.intensity = 28 * pulse;
    floor.material.opacity = 0.2 + pulse * 0.14;
    trophyGlows.forEach((material) => { material.uniforms.strength.value = 0.22 + pulse * 0.28; });
    trophySpots.forEach((material, i) => { material.opacity = (i % 2 === 0 ? 0.16 : 0.22) + pulse * 0.16; });
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
