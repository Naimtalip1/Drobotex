/* global THREE — loaded via plain <script src="vendor/three.min.js"> so the
   scene also works when index.html is opened directly (file://) */
(() => {
const canvas = document.getElementById('webgl');
const hero = document.getElementById('hero');
if (typeof THREE === 'undefined') {
  canvas?.remove();
  hero?.classList.add('webgl-fallback');
  throw new Error('three.min.js failed to load');
}
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.matchMedia('(max-width: 768px)').matches;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x04070d, 0.055);

const camera = new THREE.PerspectiveCamera(55, hero.clientWidth / hero.clientHeight, 0.1, 100);
camera.position.set(0, 0.4, 11);

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
} catch (e) {
  // WebGL unavailable — fall back to a static CSS backdrop
  canvas.remove();
  hero.classList.add('webgl-fallback');
  throw e;
}
renderer.setSize(hero.clientWidth, hero.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
canvas.dataset.booted = '1';

const BLUE = 0x2f7ff0, CYAN = 0x38e8ff, RED = 0xff2e4d;

/* ---------- particle swarm (drone cloud) ---------- */
const COUNT = isMobile ? 900 : 2600;
const pos = new Float32Array(COUNT * 3);
const seed = new Float32Array(COUNT);
for (let i = 0; i < COUNT; i++) {
  // shell-ish distribution, denser toward center
  const r = 4 + Math.pow(Math.random(), 1.6) * 10;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
  pos[i * 3 + 1] = (r * Math.cos(phi)) * 0.55;
  pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  seed[i] = Math.random() * Math.PI * 2;
}
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
const pMat = new THREE.PointsMaterial({
  color: CYAN, size: 0.045, transparent: true, opacity: 0.75,
  blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
});
const swarm = new THREE.Points(pGeo, pMat);
scene.add(swarm);

/* a few red "hostile" particles */
const R_COUNT = isMobile ? 40 : 120;
const rPos = new Float32Array(R_COUNT * 3);
for (let i = 0; i < R_COUNT; i++) {
  rPos[i * 3]     = (Math.random() - 0.5) * 24;
  rPos[i * 3 + 1] = (Math.random() - 0.5) * 10;
  rPos[i * 3 + 2] = (Math.random() - 0.5) * 24;
}
const rGeo = new THREE.BufferGeometry();
rGeo.setAttribute('position', new THREE.BufferAttribute(rPos, 3));
const hostiles = new THREE.Points(rGeo, new THREE.PointsMaterial({
  color: RED, size: 0.09, transparent: true, opacity: 0.9,
  blending: THREE.AdditiveBlending, depthWrite: false
}));
scene.add(hostiles);

/* ---------- wireframe core (the "mothership") ---------- */
const core = new THREE.Mesh(
  new THREE.IcosahedronGeometry(2.1, 1),
  new THREE.MeshBasicMaterial({ color: BLUE, wireframe: true, transparent: true, opacity: 0.35 })
);
core.position.set(2.4, 0.4, 0);
scene.add(core);

const coreInner = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.15, 0),
  new THREE.MeshBasicMaterial({ color: CYAN, wireframe: true, transparent: true, opacity: 0.5 })
);
core.add(coreInner);

/* orbit rings */
const ring1 = new THREE.Mesh(
  new THREE.TorusGeometry(3.4, 0.012, 8, 140),
  new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.45 })
);
ring1.rotation.x = Math.PI / 2.3;
core.add(ring1);

const ring2 = new THREE.Mesh(
  new THREE.TorusGeometry(4.1, 0.01, 8, 140),
  new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0.4 })
);
ring2.rotation.x = Math.PI / 1.8;
ring2.rotation.y = 0.5;
core.add(ring2);

/* ---------- grid floor ---------- */
const grid = new THREE.GridHelper(80, 60, 0x16223a, 0x0d1830);
grid.position.y = -5.2;
grid.material.transparent = true;
grid.material.opacity = 0.55;
scene.add(grid);

/* ---------- interaction state ---------- */
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
window.addEventListener('pointermove', (e) => {
  mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
  mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
}, { passive: true });

let scrollP = 0; // 0 → 1 as hero leaves viewport
window.addEventListener('scroll', () => {
  const h = hero.clientHeight;
  scrollP = Math.min(1, Math.max(0, window.scrollY / h));
}, { passive: true });

/* ---------- resize ---------- */
window.addEventListener('resize', () => {
  camera.aspect = hero.clientWidth / hero.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(hero.clientWidth, hero.clientHeight);
});

/* ---------- loop ---------- */
const clock = new THREE.Clock();
let visible = true;
new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 }).observe(hero);

function tick() {
  requestAnimationFrame(tick);
  if (!visible) return;
  const t = clock.getElapsedTime();

  // lerp mouse
  mouse.x += (mouse.tx - mouse.x) * 0.05;
  mouse.y += (mouse.ty - mouse.y) * 0.05;

  if (!reduced) {
    // swarm drift + breathing
    swarm.rotation.y = t * 0.045;
    const s = 1 + Math.sin(t * 0.6) * 0.02;
    swarm.scale.setScalar(s);

    hostiles.rotation.y = -t * 0.07;
    hostiles.rotation.x = Math.sin(t * 0.2) * 0.15;

    // core
    core.rotation.y = t * 0.25;
    core.rotation.x = Math.sin(t * 0.3) * 0.25;
    coreInner.rotation.y = -t * 0.6;
    coreInner.rotation.z = t * 0.4;
    ring1.rotation.z = t * 0.3;
    ring2.rotation.z = -t * 0.22;

    // grid scroll toward camera
    grid.position.z = (t * 0.8) % 1.35;
  }

  // camera: mouse parallax + scroll dolly/dive
  const targetZ = 11 - scrollP * 5.5;
  const targetY = 0.4 + mouse.y * -0.6 + scrollP * 3.2;
  const targetX = mouse.x * 0.9 + scrollP * -2.2;
  camera.position.x += (targetX - camera.position.x) * 0.06;
  camera.position.y += (targetY - camera.position.y) * 0.06;
  camera.position.z += (targetZ - camera.position.z) * 0.08;
  camera.lookAt(0, 0, 0);

  // fade scene out as hero leaves
  const fade = 1 - scrollP * 0.85;
  pMat.opacity = 0.75 * fade;
  core.material.opacity = 0.35 * fade;
  grid.material.opacity = 0.55 * fade;

  renderer.render(scene, camera);
}
tick();
})();
