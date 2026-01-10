// demo_025_partitions.js
// Fixed N=4: hover a partition to highlight μ and σ in a 3D population view.

import * as THREE from "https://unpkg.com/three@0.164.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.164.0/examples/jsm/controls/OrbitControls.js";

(() => {
  const mount = document.getElementById("demo_025_partitions");
  if (!mount) return;
  mount.innerHTML = "";

  const N = 4;
  const COLORS = {
    magistrate: "#4878d0", // μ
    subject: "#d65f5f", // σ
    people: "#ee854a",
    frame: "rgba(229,231,235,0.18)",
    card: "rgba(15,23,42,0.35)",
    cardHover: "rgba(15,23,42,0.6)",
    accent: "rgba(213,187,103,0.6)",
  };

  const style = document.createElement("style");
  style.textContent = `
    #demo_025_partitions .p25-row {
      display: flex;
      gap: .85rem;
      align-items: stretch;
      width: 100%;
      height: 360px;
      min-width: 0;
    }
    #demo_025_partitions .p25-panel {
      display: flex;
      flex-direction: column;
      gap: .35rem;
      min-width: 0;
    }
    #demo_025_partitions .p25-panel--grid {
      flex: 0 1 280px;
    }
    #demo_025_partitions .p25-panel--three {
      flex: 1 1 0;
    }
    #demo_025_partitions .p25-title {
      font-size: .85rem;
      color: #9ca3af;
      font-weight: 600;
    }
    #demo_025_partitions .p25-gridHost {
      flex: 1;
      overflow: hidden;
      min-width: 0;
      border-radius: 10px;
      background: rgba(0, 0, 0, .12);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #demo_025_partitions .p25-grid {
      display: grid;
      gap: 10px;
      align-content: start;
      padding: 10px;
      box-sizing: border-box;
      will-change: transform;
    }
    #demo_025_partitions .p25-cell {
      border-radius: 10px;
      border: 1px solid ${COLORS.frame};
      background: ${COLORS.card};
      padding: 8px;
      user-select: none;
      transition: transform .08s, border-color .08s, background .08s;
    }
    #demo_025_partitions .p25-cell:hover {
      border-color: ${COLORS.accent};
      background: ${COLORS.cardHover};
      transform: translateY(-1px);
    }
    #demo_025_partitions .p25-cellTitle {
      font-size: 12px;
      font-weight: 700;
      color: #e5e7eb;
      margin: 0 0 6px;
    }
    #demo_025_partitions .p25-dots {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      justify-items: center;
      gap: 6px;
    }
    #demo_025_partitions .p25-dot {
      width: 22px;
      height: 22px;
      border-radius: 999px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 11px;
      color: #0b1220;
      border: 1px solid ${COLORS.frame};
    }
    #demo_025_partitions .p25-threeHost {
      flex: 1;
      border-radius: 10px;
      overflow: hidden;
      position: relative;
      min-width: 0;
    }
    #demo_025_partitions .p25-overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 2;
    }
    #demo_025_partitions .p25-badge {
      position: absolute;
      left: 0;
      top: 0;
      transform: translate(-50%, -50%);
      padding: 2px 6px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      background: rgba(15, 23, 42, .92);
      color: #e5e7eb;
      white-space: nowrap;
      opacity: 0;
      transition: opacity .12s ease-out;
    }
    #demo_025_partitions .p25-badge--mu {
      border: 1px solid ${COLORS.magistrate};
    }
    #demo_025_partitions .p25-badge--sigma {
      border: 1px solid ${COLORS.subject};
    }
  `;
  mount.appendChild(style);

  const randn = (mean = 0, std = 1) => {
    let u = 0,
      v = 0;
    while (!u) u = Math.random();
    while (!v) v = Math.random();
    return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  const contentBox = (el) => {
    const s = window.getComputedStyle(el);
    const px =
      (parseFloat(s.paddingLeft) || 0) + (parseFloat(s.paddingRight) || 0);
    const py =
      (parseFloat(s.paddingTop) || 0) + (parseFloat(s.paddingBottom) || 0);
    return {
      w: Math.max(1, el.clientWidth - px),
      h: Math.max(1, el.clientHeight - py),
    };
  };

  const el = (tag, className, text) => {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  };

  const population = Array.from({ length: N }, (_, i) => {
    const fc = i < N / 2 ? -1 : 1;
    return {
      id: i,
      x: fc + randn(0, 0.45),
      y: randn(0, 0.45),
      z: randn(0, 0.45),
    };
  });

  const meanForMask = (mask, invert = false) => {
    let sx = 0,
      sy = 0,
      sz = 0,
      n = 0;
    for (let i = 0; i < N; i++) {
      const inM = (mask >> i) & 1;
      if (invert ? !inM : inM) {
        const p = population[i];
        sx += p.x;
        sy += p.y;
        sz += p.z;
        n++;
      }
    }
    return n
      ? { x: sx / n, y: sy / n, z: sz / n, n }
      : { x: 0, y: 0, z: 0, n: 0 };
  };

  const partitions = [];
  for (let mask = 1; mask < 1 << N; mask++) {
    const mu = meanForMask(mask, false);
    const sigma = meanForMask(mask, true);
    partitions.push({ mask, m: mu.n, mu, sigma });
  }
  partitions.sort((a, b) => a.m - b.m || a.mask - b.mask);

  const row = el("div", "p25-row");
  mount.appendChild(row);

  const leftPanel = el("div", "p25-panel p25-panel--grid");
  const rightPanel = el("div", "p25-panel p25-panel--three");
  row.append(leftPanel, rightPanel);

  leftPanel.appendChild(el("div", "p25-title", "Partitions (hover)"));
  rightPanel.appendChild(el("div", "p25-title", "Population"));

  const gridHost = el("div", "p25-gridHost");
  const grid = el("div", "p25-grid");
  gridHost.appendChild(grid);
  leftPanel.appendChild(gridHost);

  const threeHost = el("div", "p25-threeHost");
  rightPanel.appendChild(threeHost);

  // ------------------ grid ------------------
  let hovered = null;
  let fitRaf = 0;

  const requestFitGrid = () => {
    cancelAnimationFrame(fitRaf);
    fitRaf = requestAnimationFrame(fitGrid);
  };

  function fitGrid() {
    const w = gridHost.clientWidth;
    const h = gridHost.clientHeight;
    if (w <= 2 || h <= 2) return;

    let bestCols = 3;
    let bestScale = 0;

    for (let cols = 1; cols <= 4; cols++) {
      grid.style.gridTemplateColumns = `repeat(${cols}, auto)`;
      grid.style.transform = "scale(1)";
      const sw = grid.scrollWidth || 1;
      const sh = grid.scrollHeight || 1;
      const scale = Math.min(w / sw, h / sh);
      if (scale > bestScale) {
        bestScale = scale;
        bestCols = cols;
      }
    }

    grid.style.gridTemplateColumns = `repeat(${bestCols}, auto)`;
    grid.style.transform = `scale(${Math.min(1.2, bestScale)})`;
  }

  function buildGrid() {
    grid.innerHTML = "";

    for (const p of partitions) {
      const cell = el("div", "p25-cell");
      cell.appendChild(el("div", "p25-cellTitle", `m = ${p.m}`));

      const dots = el("div", "p25-dots");
      for (let i = 0; i < N; i++) {
        const dot = el("div", "p25-dot", String(i + 1));
        dot.style.background =
          p.mask & (1 << i) ? COLORS.magistrate : COLORS.subject;
        dots.appendChild(dot);
      }
      cell.appendChild(dots);

      cell.addEventListener("mouseenter", () => {
        hovered = p;
        applyHighlight();
      });

      grid.appendChild(cell);
    }

    grid.addEventListener("mouseleave", () => {
      hovered = null;
      applyHighlight();
    });

    requestFitGrid();
  }

  // ------------------ three ------------------
  const three = {
    scene: new THREE.Scene(),
    camera: null,
    renderer: null,
    controls: null,
    w: 0,
    h: 0,
    peopleMeshes: [],
    muMesh: null,
    sigmaMesh: null,
    segLine: null,
    badgeMu: null,
    badgeSigma: null,
  };

  const tmpV = new THREE.Vector3();

  function mkLine(colorCss, opacity = 0.35) {
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color(colorCss),
      transparent: true,
      opacity,
    });
    const geom = new THREE.BufferGeometry();
    geom.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(6), 3)
    );
    return new THREE.Line(geom, mat);
  }

  function setLine(line, a, b) {
    const pos = line.geometry.attributes.position.array;
    pos[0] = a.x;
    pos[1] = a.y;
    pos[2] = a.z;
    pos[3] = b.x;
    pos[4] = b.y;
    pos[5] = b.z;
    line.geometry.attributes.position.needsUpdate = true;
    line.geometry.computeBoundingSphere();
  }

  function badgeTo(mesh, badge) {
    if (!mesh.visible) {
      badge.style.opacity = "0";
      return;
    }
    mesh.getWorldPosition(tmpV);
    tmpV.project(three.camera);
    if (tmpV.z < -1 || tmpV.z > 1) {
      badge.style.opacity = "0";
      return;
    }
    const x = (tmpV.x * 0.5 + 0.5) * three.w;
    const y = (-tmpV.y * 0.5 + 0.5) * three.h;
    if (!isFinite(x) || !isFinite(y)) {
      badge.style.opacity = "0";
      return;
    }
    badge.style.left = `${x}px`;
    badge.style.top = `${y}px`;
    badge.style.opacity = "1";
  }

  function renderThree() {
    if (!three.renderer) return;
    badgeTo(three.muMesh, three.badgeMu);
    badgeTo(three.sigmaMesh, three.badgeSigma);
    three.renderer.render(three.scene, three.camera);
  }

  function frameCameraToPoints() {
    if (!three.camera || !three.controls) return;
    const box = new THREE.Box3();
    for (const m of three.peopleMeshes) box.expandByPoint(m.position);
    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);
    const center = sphere.center.clone();
    const radius = Math.max(0.25, sphere.radius || 0);

    const cam = three.camera;
    const vFov = THREE.MathUtils.degToRad(cam.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * cam.aspect);
    const fov = Math.min(vFov, hFov);
    let dist = radius / Math.sin(Math.max(0.0001, fov / 2));
    dist *= 1.06;

    const dir = new THREE.Vector3();
    const t = three.controls.target;
    if (cam.position.distanceTo(t) > 1e-6)
      dir.copy(cam.position).sub(t).normalize();
    else dir.set(1, 1, 1).normalize();

    three.controls.target.copy(center);
    cam.position.copy(center).addScaledVector(dir, dist);
    cam.near = Math.max(0.1, dist / 100);
    cam.far = Math.max(50, dist * 100);
    cam.updateProjectionMatrix();
    three.controls.update();
  }

  function initThree() {
    const { w, h } = contentBox(threeHost);
    three.w = w;
    three.h = h;

    three.scene.background = new THREE.Color(0x050508);

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 200);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.cursor = "grab";
    threeHost.appendChild(renderer.domElement);

    const overlay = el("div", "p25-overlay");
    const badgeMu = el("div", "p25-badge p25-badge--mu", "μ");
    const badgeSigma = el("div", "p25-badge p25-badge--sigma", "σ");
    overlay.append(badgeMu, badgeSigma);
    threeHost.appendChild(overlay);

    const light = new THREE.PointLight(0xffffff, 1.2);
    light.position.set(5, 5, 5);
    three.scene.add(light, new THREE.AmbientLight(0x404040));

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(6, 6, 6),
      new THREE.MeshBasicMaterial({
        color: 0x8888ff,
        wireframe: true,
        transparent: true,
        opacity: 0.08,
      })
    );
    three.scene.add(frame);

    const geoPerson = new THREE.SphereGeometry(0.09, 12, 12);

    const mkMat = (hex, opts) =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(hex),
        emissive: new THREE.Color(hex),
        ...opts,
      });
    const matPeople = mkMat(COLORS.people, {
      emissiveIntensity: 0.25,
      metalness: 0.1,
      roughness: 0.5,
      transparent: true,
      opacity: 0.8,
    });
    const matMag = mkMat(COLORS.magistrate, {
      emissiveIntensity: 0.25,
      metalness: 0.15,
      roughness: 0.45,
      transparent: true,
      opacity: 0.95,
    });
    const matSub = mkMat(COLORS.subject, {
      emissiveIntensity: 0.2,
      metalness: 0.12,
      roughness: 0.5,
      transparent: true,
      opacity: 0.9,
    });

    const peopleMeshes = population.map((p) => {
      const m = new THREE.Mesh(geoPerson, matPeople);
      m.position.set(p.x, p.y, p.z);
      three.scene.add(m);
      return m;
    });

    const muMesh = new THREE.Object3D();
    const sigmaMesh = new THREE.Object3D();
    muMesh.visible = false;
    sigmaMesh.visible = false;
    three.scene.add(muMesh, sigmaMesh);

    const segLine = mkLine("#94a3b8", 0.35);
    segLine.visible = false;
    segLine.renderOrder = -20;
    three.scene.add(segLine);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.autoRotate = false;
    controls.addEventListener("change", renderThree);
    renderer.domElement.addEventListener(
      "pointerdown",
      () => (renderer.domElement.style.cursor = "grabbing")
    );
    window.addEventListener(
      "pointerup",
      () => (renderer.domElement.style.cursor = "grab")
    );

    Object.assign(three, {
      camera,
      renderer,
      controls,
      peopleMeshes,
      muMesh,
      sigmaMesh,
      segLine,
      badgeMu,
      badgeSigma,
      _matPeople: matPeople,
      _matMag: matMag,
      _matSub: matSub,
    });
    frameCameraToPoints();
    renderThree();
  }

  function applyHighlight() {
    const p = hovered;
    if (!three.renderer) return;

    if (!p) {
      for (const m of three.peopleMeshes) m.material = three._matPeople;
      three.muMesh.visible = false;
      three.sigmaMesh.visible = false;
      three.segLine.visible = false;
      renderThree();
      return;
    }

    for (let i = 0; i < N; i++) {
      const mesh = three.peopleMeshes[i];
      mesh.material = p.mask & (1 << i) ? three._matMag : three._matSub;
    }

    three.muMesh.position.set(p.mu.x, p.mu.y, p.mu.z);
    three.muMesh.visible = true;

    if (p.m === N) {
      three.sigmaMesh.visible = false;
      three.segLine.visible = false;
    } else {
      three.sigmaMesh.position.set(p.sigma.x, p.sigma.y, p.sigma.z);
      three.sigmaMesh.visible = true;
      setLine(three.segLine, p.sigma, p.mu);
      three.segLine.visible = true;
    }

    renderThree();
  }

  function onResize() {
    // grid
    requestFitGrid();

    // three
    if (!three.renderer || !three.camera) return;
    const { w, h } = contentBox(threeHost);
    three.w = w;
    three.h = h;
    three.renderer.setSize(w, h);
    three.renderer.setPixelRatio(window.devicePixelRatio || 1);
    three.camera.aspect = w / h;
    frameCameraToPoints();
    renderThree();
  }

  // ------------------ boot ------------------
  initThree();
  buildGrid();
  window.addEventListener("resize", onResize);
  requestFitGrid();
})();
