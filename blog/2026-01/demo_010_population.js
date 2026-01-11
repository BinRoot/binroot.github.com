import * as THREE from "https://unpkg.com/three@0.164.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.164.0/examples/jsm/controls/OrbitControls.js";

const numPoints = 4;

const container = document.getElementById("demo_010_population");
const tooltip = document.getElementById("demo_010_tooltip");
if (!container || !tooltip) {
  throw new Error("demo_010_population: missing container or tooltip element");
}
container.style.position = "relative";

function getContentBoxSize(el) {
  const s = window.getComputedStyle(el);
  const paddingX =
    (parseFloat(s.paddingLeft) || 0) + (parseFloat(s.paddingRight) || 0);
  const paddingY =
    (parseFloat(s.paddingTop) || 0) + (parseFloat(s.paddingBottom) || 0);
  return {
    width: Math.max(1, el.clientWidth - paddingX),
    height: Math.max(1, el.clientHeight - paddingY),
  };
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050508);

const { width: initW, height: initH } = getContentBoxSize(container);
const camera = new THREE.PerspectiveCamera(45, initW / initH, 0.1, 100);
camera.position.set(4, 4, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(initW, initH);
renderer.setPixelRatio(window.devicePixelRatio || 1);
renderer.domElement.style.display = "block";
container.appendChild(renderer.domElement);

const raycaster = new THREE.Raycaster(),
  pointer = new THREE.Vector2(),
  points = [];
let hoveredPoint = null;

const moveTooltip = (e) => {
  const r = container.getBoundingClientRect();
  tooltip.style.left = `${e.clientX - r.left}px`;
  tooltip.style.top = `${e.clientY - r.top - 10}px`;
};
const hideTooltip = () => (tooltip.style.display = "none");
const showTooltip = (e, text) => {
  tooltip.innerHTML = text;
  tooltip.style.display = "block";
  moveTooltip(e);
  if (window.MathJax) {
    if (MathJax.typesetPromise)
      MathJax.typesetPromise([tooltip]).catch((err) =>
        console.error(err.message)
      );
    else if (MathJax.typeset) MathJax.typeset([tooltip]);
  }
};

const onPointerMove = (e) => {
  const r = renderer.domElement.getBoundingClientRect();
  pointer.set(
    ((e.clientX - r.left) / r.width) * 2 - 1,
    -((e.clientY - r.top) / r.height) * 2 + 1
  );
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(points)[0]?.object;
  if (hit) {
    if (hoveredPoint !== hit) {
      hoveredPoint = hit;
      showTooltip(e, hit.userData.label);
    } else moveTooltip(e);
  } else {
    hoveredPoint = null;
    hideTooltip();
  }
};

renderer.domElement.addEventListener("pointermove", onPointerMove);
renderer.domElement.addEventListener("pointerleave", () => {
  hoveredPoint = null;
  hideTooltip();
});

const light = new THREE.PointLight(0xffffff, 1.2);
light.position.set(5, 5, 5);
scene.add(light, new THREE.AmbientLight(0x404040), new THREE.AxesHelper(3));

const pointGeometry = new THREE.SphereGeometry(0.12, 6, 6);
const color = new THREE.Color().setHSL(0, 0.7, 0.5);
const pointMaterial = new THREE.MeshStandardMaterial({
  color,
  emissive: color.clone(),
  emissiveIntensity: 0.3,
  metalness: 0.2,
  roughness: 0.3,
});

for (let i = 0; i < numPoints; i++) {
  const point = new THREE.Mesh(pointGeometry, pointMaterial);
  point.position.set(
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
    Math.random() * 2 - 1
  );
  point.userData.label = `\\( \\vec{p}_{${i + 1}} \\)`;
  scene.add(point);
  points.push(point);
}

const controls = new OrbitControls(camera, renderer.domElement);
Object.assign(controls, {
  enableDamping: true,
  dampingFactor: 0.08,
  autoRotate: false,
});

let lastW = 0;
let lastH = 0;
const onResize = () => {
  const { width, height } = getContentBoxSize(container);
  if (!width || !height) return;
  if (width === lastW && height === lastH) return;
  lastW = width;
  lastH = height;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
};
window.addEventListener("resize", onResize);

// Some mobile browsers change layout without firing a window resize (address bar,
// late-applied CSS, etc.). Observe the container so the renderer always matches it.
if ("ResizeObserver" in window) {
  const ro = new ResizeObserver(() => onResize());
  ro.observe(container);
}

// Ensure first frame uses final layout metrics.
requestAnimationFrame(onResize);

(function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
})();
