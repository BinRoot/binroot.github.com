import * as THREE from "https://unpkg.com/three@0.164.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.164.0/examples/jsm/controls/OrbitControls.js";

const container = document.getElementById("demo_020_division");
const tooltip = document.getElementById("demo_020_tooltip");
const populationCount = 21;
const initNumMagistrate = 1;
let numMagistrate = initNumMagistrate;

// === Layout: split container into left UI panel and right 3D panel ===
container.style.position = "relative";
container.style.display = "flex";
container.style.flexDirection = "row";
container.style.alignItems = "stretch";

const uiPanel = document.createElement("div");
Object.assign(uiPanel.style, {
  flex: "0 1 280px",
  minWidth: "200px",
  padding: "10px",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  color: "#eee",
  fontFamily: "system-ui, sans-serif",
});
container.appendChild(uiPanel);

const threePanel = document.createElement("div");
Object.assign(threePanel.style, {
  flex: "1",
  position: "relative",
  minHeight: "260px",
  minWidth: "0",
  overflow: "hidden",
});
container.appendChild(threePanel);

// === Buttons ===
const incBtn = document.createElement("button");
incBtn.textContent = "Add Magistrate";
Object.assign(incBtn.style, {
  padding: "4px 8px",
  cursor: "pointer",
});
uiPanel.appendChild(incBtn);

const resetBtn = document.createElement("button");
resetBtn.textContent = "Reset";
Object.assign(resetBtn.style, {
  padding: "4px 8px",
  cursor: "pointer",
});
uiPanel.appendChild(resetBtn);

// === Three.js setup ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050508);

const camera = new THREE.PerspectiveCamera(
  45,
  threePanel.clientWidth / threePanel.clientHeight,
  0.1,
  100
);
camera.position.set(2, 2, 3);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(threePanel.clientWidth, threePanel.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
threePanel.appendChild(renderer.domElement);

const raycaster = new THREE.Raycaster(),
  pointer = new THREE.Vector2(),
  points = []; // first populationCount: individuals, then 2 avg points
const pointPositions = []; // raw [x,y,z] for individuals
const lines = []; // store line objects so we can rebuild them
let hoveredPoint = null;

// === Tooltip stuff ===
const moveTooltip = (e) => {
  const r = container.getBoundingClientRect();
  tooltip.style.position = "absolute";
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

// === Lights ===
const light = new THREE.PointLight(0xffffff, 1.2);
light.position.set(5, 5, 5);
scene.add(light, new THREE.AmbientLight(0x404040));

// === Materials & geometries ===
const pointGeometry = new THREE.SphereGeometry(0.06, 6, 6);
const pointGeometryAvg = new THREE.SphereGeometry(0.18, 6, 6);

const colorS = new THREE.Color().setHSL(0, 0.7, 0.5);
const pointMaterialS = new THREE.MeshStandardMaterial({
  color: colorS,
  emissive: colorS.clone(),
  emissiveIntensity: 0.3,
  metalness: 0.2,
  roughness: 0.3,
});

const colorM = new THREE.Color().setHSL(0.6, 0.7, 0.5);
const pointMaterialM = new THREE.MeshStandardMaterial({
  color: colorM,
  emissive: colorM.clone(),
  emissiveIntensity: 0.3,
  metalness: 0.2,
  roughness: 0.3,
});

const avgMaterialS = new THREE.MeshStandardMaterial({
  color: colorS,
  emissive: colorS.clone(),
  emissiveIntensity: 0.2,
  metalness: 0.1,
  roughness: 0.4,
  transparent: true,
  opacity: 0.35,
  depthWrite: false,
});

const avgMaterialM = new THREE.MeshStandardMaterial({
  color: colorM,
  emissive: colorM.clone(),
  emissiveIntensity: 0.2,
  metalness: 0.1,
  roughness: 0.4,
  transparent: true,
  opacity: 0.35,
  depthWrite: false,
});

const lineMaterialS = new THREE.LineBasicMaterial({
  color: colorS,
  transparent: true,
  opacity: 0.4,
});

const lineMaterialM = new THREE.LineBasicMaterial({
  color: colorM,
  transparent: true,
  opacity: 0.4,
});

// === Plot canvas for variance vs. #magistrates ===
const plotCanvas = document.createElement("canvas");
Object.assign(plotCanvas.style, {
  borderRadius: "4px",
  width: "100%",
  height: "120px",
});
uiPanel.appendChild(plotCanvas);

// === Plot canvas for Legitimacy ===
const legCanvas = document.createElement("canvas");
Object.assign(legCanvas.style, {
  borderRadius: "4px",
  width: "100%",
  height: "120px",
});
uiPanel.appendChild(legCanvas);

// === Canvas resize helper for HiDPI ===
function resizeCanvas(canvas, height = 120) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function resizeCanvases() {
  resizeCanvas(plotCanvas, 120);
  resizeCanvas(legCanvas, 120);
  drawPlot();
  drawLegPlot();
}

// history arrays
const magCounts = []; // x values = number of magistrates
const magVarianceHistory = []; // y for magistrates
const subjVarianceHistory = []; // y for subjects
const legitimacyHistory = []; // y for legitimacy

// === Averages ===
const avgSovereign = [0, 0, 0];
const avgMagistrate = [0, 0, 0];

let avgPointS, avgPointM;

// === Create individual points ===
for (let i = 0; i < populationCount; i++) {
  const isMagistrate = i < numMagistrate;
  const point = new THREE.Mesh(
    pointGeometry,
    isMagistrate ? pointMaterialM : pointMaterialS
  );
  point.userData.label = `\\( \\vec{p}_{${i + 1}} \\)`;

  const randomPoint = [
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
  ];
  point.position.set(...randomPoint);

  scene.add(point);
  points.push(point);
  pointPositions.push(randomPoint);
}

// === Create average points ===
avgPointS = new THREE.Mesh(pointGeometryAvg, avgMaterialS);
avgPointS.userData.label = `\\( \\vec{\\sigma} \\)`;
scene.add(avgPointS);
points.push(avgPointS);

avgPointM = new THREE.Mesh(pointGeometryAvg, avgMaterialM);
avgPointM.userData.label = `\\( \\vec{\\mu} \\)`;
scene.add(avgPointM);
points.push(avgPointM);

// === Plot helpers (variance) ===
function drawPlot() {
  const ctx = plotCanvas.getContext("2d");
  const rect = plotCanvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

  ctx.clearRect(0, 0, w, h);

  // background
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, w, h);

  // title
  ctx.fillStyle = "#ccc";
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("Variance within a group ", w / 2, 4);

  const paddingLeft = 40;
  const paddingRight = 10;
  const paddingTop = 20;
  const paddingBottom = 30;

  const xMin = 0;
  const xMax = populationCount - 1;

  // max variance across both series
  let maxVar = 0;
  for (const v of magVarianceHistory) if (v > maxVar) maxVar = v;
  for (const v of subjVarianceHistory) if (v > maxVar) maxVar = v;
  if (maxVar === 0) maxVar = 1; // avoid div by zero

  // axes
  ctx.strokeStyle = "#ccc";
  ctx.lineWidth = 1;
  ctx.beginPath();
  // x-axis
  ctx.moveTo(paddingLeft, h - paddingBottom);
  ctx.lineTo(w - paddingRight, h - paddingBottom);
  // y-axis
  ctx.moveTo(paddingLeft, h - paddingBottom);
  ctx.lineTo(paddingLeft, paddingTop);
  ctx.stroke();

  // labels
  ctx.fillStyle = "#ccc";
  ctx.font = "12px monospace";

  // x-axis labels (0 and max)
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("0", paddingLeft, h - paddingBottom + 4);
  ctx.fillText(String(xMax), w - paddingRight, h - paddingBottom + 4);

  // axis titles
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("# magistrates", (paddingLeft + w - paddingRight) / 2, h - 2);

  ctx.save();
  ctx.translate(10, (paddingTop + h - paddingBottom) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("variance", 0, 0);
  ctx.restore();

  const plotX = (x) => {
    const t = (x - xMin) / (xMax - xMin || 1);
    return paddingLeft + t * (w - paddingLeft - paddingRight);
  };

  const plotY = (y) => {
    const t = y / maxVar;
    return h - paddingBottom - t * (h - paddingTop - paddingBottom);
  };

  function drawSeries(xs, ys, colorCss) {
    if (!xs.length) return;
    const ctx2 = ctx;
    ctx2.strokeStyle = colorCss;
    ctx2.lineWidth = 1.5;
    ctx2.beginPath();
    let started = false;

    for (let i = 0; i < xs.length; i++) {
      const x = xs[i];
      const y = ys[i];
      if (typeof y !== "number") continue;
      const px = plotX(x);
      const py = plotY(y);
      if (!started) {
        ctx2.moveTo(px, py);
        started = true;
      } else {
        ctx2.lineTo(px, py);
      }
    }
    ctx2.stroke();

    // markers
    ctx2.fillStyle = colorCss;
    for (let i = 0; i < xs.length; i++) {
      const x = xs[i];
      const y = ys[i];
      if (typeof y !== "number") continue;
      const px = plotX(x);
      const py = plotY(y);
      ctx2.beginPath();
      ctx2.arc(px, py, 3, 0, Math.PI * 2);
      ctx2.fill();
    }
  }

  // Subject = colorS, Magistrate = colorM
  drawSeries(magCounts, subjVarianceHistory, colorS.getStyle());
  drawSeries(magCounts, magVarianceHistory, colorM.getStyle());
}

// === Plot helpers (Legitimacy) ===
function drawLegPlot() {
  const ctx = legCanvas.getContext("2d");
  const rect = legCanvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

  ctx.clearRect(0, 0, w, h);

  // background
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, w, h);

  // title
  ctx.fillStyle = "#ccc";
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("Distance between groups", w / 2, 4);

  const paddingLeft = 40;
  const paddingRight = 10;
  const paddingTop = 20;
  const paddingBottom = 30;

  const xMin = 0;
  const xMax = populationCount - 1;

  // max legitimacy
  let maxLeg = 0;
  for (const v of legitimacyHistory) if (v > maxLeg) maxLeg = v;
  if (maxLeg === 0) maxLeg = 1;

  // axes
  ctx.strokeStyle = "#ccc";
  ctx.lineWidth = 1;
  ctx.beginPath();
  // x-axis
  ctx.moveTo(paddingLeft, h - paddingBottom);
  ctx.lineTo(w - paddingRight, h - paddingBottom);
  // y-axis
  ctx.moveTo(paddingLeft, h - paddingBottom);
  ctx.lineTo(paddingLeft, paddingTop);
  ctx.stroke();

  // labels
  ctx.fillStyle = "#ccc";
  ctx.font = "12px monospace";

  // x-axis labels
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("0", paddingLeft, h - paddingBottom + 4);
  ctx.fillText(String(xMax), w - paddingRight, h - paddingBottom + 4);

  // axis titles
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("# magistrates", (paddingLeft + w - paddingRight) / 2, h - 2);

  ctx.save();
  ctx.translate(10, (paddingTop + h - paddingBottom) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("distance", 0, 0);
  ctx.restore();

  const plotX = (x) => {
    const t = (x - xMin) / (xMax - xMin || 1);
    return paddingLeft + t * (w - paddingLeft - paddingRight);
  };

  const plotY = (y) => {
    const t = y / maxLeg;
    return h - paddingBottom - t * (h - paddingTop - paddingBottom);
  };

  if (!magCounts.length) return;

  // single series: legitimacy
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  let started = false;

  for (let i = 0; i < magCounts.length; i++) {
    const x = magCounts[i];
    const y = legitimacyHistory[i];
    if (typeof y !== "number") continue;
    const px = plotX(x);
    const py = plotY(y);
    if (!started) {
      ctx.moveTo(px, py);
      started = true;
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.stroke();

  // markers
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < magCounts.length; i++) {
    const x = magCounts[i];
    const y = legitimacyHistory[i];
    if (typeof y !== "number") continue;
    const px = plotX(x);
    const py = plotY(y);
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function recordDataPoint(countM, varMag, varSubj, legitimacy) {
  magCounts.push(countM);
  magVarianceHistory.push(varMag);
  subjVarianceHistory.push(varSubj);
  legitimacyHistory.push(legitimacy);
  drawPlot();
  drawLegPlot();
}

// === Update function ===
function updateMagistratesAndAverages(recordPoint = false) {
  // reset sums
  avgSovereign[0] = avgSovereign[1] = avgSovereign[2] = 0;
  avgMagistrate[0] = avgMagistrate[1] = avgMagistrate[2] = 0;

  let countS = 0;
  let countM = 0;

  // recolor points + recompute averages + update labels
  for (let i = 0; i < populationCount; i++) {
    const isMagistrate = i < numMagistrate;
    const pos = pointPositions[i];
    const point = points[i];

    // material
    point.material = isMagistrate ? pointMaterialM : pointMaterialS;

    // label
    point.userData.label = `\\( \\vec{p}_{${i + 1}} \\)`;

    if (isMagistrate) {
      avgMagistrate[0] += pos[0];
      avgMagistrate[1] += pos[1];
      avgMagistrate[2] += pos[2];
      countM++;
    } else {
      avgSovereign[0] += pos[0];
      avgSovereign[1] += pos[1];
      avgSovereign[2] += pos[2];
      countS++;
    }
  }

  if (countM > 0) {
    avgMagistrate[0] /= countM;
    avgMagistrate[1] /= countM;
    avgMagistrate[2] /= countM;
  }
  if (countS > 0) {
    avgSovereign[0] /= countS;
    avgSovereign[1] /= countS;
    avgSovereign[2] /= countS;
  }

  // move the average points
  avgPointM.position.set(...avgMagistrate);
  avgPointS.position.set(...avgSovereign);

  // update avg point labels
  avgPointM.userData.label = `\\( \\vec{\\mu} \\)`;
  avgPointS.userData.label = `\\( \\vec{\\sigma} \\)`;

  // --- compute variances (average squared distance to respective mean) ---
  let sumSqMag = 0;
  let sumSqSubj = 0;

  for (let i = 0; i < populationCount; i++) {
    const pos = pointPositions[i];
    const isMagistrate = i < numMagistrate;

    if (isMagistrate && countM > 0) {
      const dx = pos[0] - avgMagistrate[0];
      const dy = pos[1] - avgMagistrate[1];
      const dz = pos[2] - avgMagistrate[2];
      sumSqMag += dx * dx + dy * dy + dz * dz;
    } else if (!isMagistrate && countS > 0) {
      const dx = pos[0] - avgSovereign[0];
      const dy = pos[1] - avgSovereign[1];
      const dz = pos[2] - avgSovereign[2];
      sumSqSubj += dx * dx + dy * dy + dz * dz;
    }
  }

  const varMag = countM > 0 ? sumSqMag / countM : 0;
  const varSubj = countS > 0 ? sumSqSubj / countS : 0;

  // --- compute Legitimacy: 1 / (||σ - μ|| + 0.001) ---
  let legitimacy = 0;
  if (countM > 0 && countS > 0) {
    const dx = avgMagistrate[0] - avgSovereign[0];
    const dy = avgMagistrate[1] - avgSovereign[1];
    const dz = avgMagistrate[2] - avgSovereign[2];
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    legitimacy = dist;
  }

  // record point for plots if requested
  if (recordPoint) {
    recordDataPoint(numMagistrate, varMag, varSubj, legitimacy);
  }

  // rebuild lines
  for (const line of lines) scene.remove(line);
  lines.length = 0;

  for (let i = 0; i < populationCount; i++) {
    const point = points[i];
    const isMagistrate = i < numMagistrate;
    const avgPoint = isMagistrate ? avgPointM : avgPointS;

    const geom = new THREE.BufferGeometry().setFromPoints([
      point.position.clone(),
      avgPoint.position.clone(),
    ]);

    const line = new THREE.Line(
      geom,
      isMagistrate ? lineMaterialM : lineMaterialS
    );

    lines.push(line);
    scene.add(line);
  }
}

// initial compute (and record first point)
updateMagistratesAndAverages(true);

// === Box ===
scene.add(
  new THREE.Mesh(
    new THREE.BoxGeometry(3, 3, 3),
    new THREE.MeshBasicMaterial({
      color: 0x8888ff,
      wireframe: true,
      transparent: true,
      opacity: 0.1,
    })
  )
);

// === Controls & resize ===
const controls = new OrbitControls(camera, renderer.domElement);
Object.assign(controls, {
  enableDamping: true,
  dampingFactor: 0.08,
  autoRotate: true,
});

const onResize = () => {
  const { clientWidth, clientHeight } = threePanel;
  if (!clientWidth || !clientHeight) return;
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(clientWidth, clientHeight);
  resizeCanvases();
};
window.addEventListener("resize", onResize);
// Initial sizing after layout settles
requestAnimationFrame(() => {
  resizeCanvases();
  onResize();
});

// === Buttons logic ===
incBtn.addEventListener("click", () => {
  if (numMagistrate < populationCount - 1) {
    numMagistrate++;
    updateMagistratesAndAverages(true); // record new point
  }
});

resetBtn.addEventListener("click", () => {
  // reset histories
  magCounts.length = 0;
  magVarianceHistory.length = 0;
  subjVarianceHistory.length = 0;
  legitimacyHistory.length = 0;
  drawPlot();
  drawLegPlot();

  // re-randomize all point positions
  for (let i = 0; i < populationCount; i++) {
    const newPos = [
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
    ];
    pointPositions[i] = newPos;
    points[i].position.set(...newPos);
  }

  numMagistrate = initNumMagistrate;
  updateMagistratesAndAverages(true); // new starting point
});

// === Render loop ===
(function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
})();
