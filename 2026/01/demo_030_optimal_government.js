// demo_030_optimal_government.js
// Experiment 5 with combined government cost:
// C(M) = D(M)^2 + λ * Var(M)

import * as THREE from "https://unpkg.com/three@0.164.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.164.0/examples/jsm/controls/OrbitControls.js";

(function () {
  const mount = document.getElementById("demo_030_optimal_government");
  if (!mount) return;

  // Clear any server-side / previous content
  mount.innerHTML = "";

  // ------------------ CONFIG ------------------
  const N_MIN = 3;
  const N_MAX = 40;
  const N_EXHAUSTIVE_MAX = 9;
  const SAMPLES_PER_M = 150;

  const COLORS = {
    // Keep consistent with mathcolor.lua / rousseau.md
    magistrate: "#4878d0", // μ
    subject: "#d65f5f", // σ
    people: "#ee854a", // ρ / public
    rhoStroke: "#ee854a", // ρ
    gammaFill: "#956cb4", // γ
    gammaStroke: "#956cb4", // γ
    pointDefault: "#797979",
    pointBest: "#d5bb67",
    pointBestStroke: "#8c613c",
    pointMin: "#22c55e",
    pointMinStroke: "#166534",
  };

  // ------------------ STATE ------------------
  const state = {
    N: 6,
    lambda: 1.0, // friction weight
    population: [],
    rho: { x: 0, y: 0, z: 0 },
    results: [], // each r: {size, M, S, mu, sigma, varM, varS, t, gamma, rho, D, jitter, cost, screenX, screenY}
    globalBestResult: null, // lowest-cost point across all m for current N + λ
    bestPerMSet: null, // Set<Result> for the best point at each m
    mode: "nano", // 'nano' or 'macro'
    highlightedSubset: null,
    hoveredResult: null,
    costWidth: 300,
    costHeight: 320,
  };

  const ui = {
    popSlider: null,
    popValueLabel: null,
    lambdaSlider: null,
    lambdaValueLabel: null,
    threeHost: null,
    costHost: null,
    costCanvas: null,
    costCtx: null,
    tooltip: null,
  };

  const threeState = {
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    geoms: null,
    mats: null,
    peopleGroup: null,
    peopleMeshes: [],
    rhoMesh: null,
    muMesh: null,
    sigmaMesh: null,
    gammaMesh: null,
    baseLine: null,
    subjLine: null,
    magLine: null,
    overlay: null,
    labelRho: null,
    labelMu: null,
    labelSigma: null,
    labelGamma: null,
    viewWidth: 0,
    viewHeight: 0,
    running: false,
  };

  // ------------------ UTILITIES ------------------

  function randomNormal(mean = 0, std = 1) {
    let u = 0,
      v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return mean + std * z;
  }

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

  function setupHiDPICanvas(canvas, width, height) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  function v3(obj) {
    return new THREE.Vector3(obj.x, obj.y, obj.z);
  }

  function generatePopulation(N) {
    const people = [];
    for (let i = 0; i < N; i++) {
      const factionCenter = i < N / 2 ? -1 : 1;
      const x = factionCenter + randomNormal(0, 0.5);
      const y = randomNormal(0, 0.5);
      const z = randomNormal(0, 0.5);
      people.push({ id: i, x, y, z });
    }
    return people;
  }

  function meanVec(indices, people) {
    const n = indices.length;
    if (n === 0) return { x: 0, y: 0, z: 0 };
    let sx = 0,
      sy = 0,
      sz = 0;
    for (let i = 0; i < n; i++) {
      const p = people[indices[i]];
      sx += p.x;
      sy += p.y;
      sz += p.z;
    }
    return { x: sx / n, y: sy / n, z: sz / n };
  }

  function variance(indices, people, center) {
    const n = indices.length;
    if (n === 0) return 0;
    let s = 0;
    for (let i = 0; i < n; i++) {
      const p = people[indices[i]];
      const dx = p.x - center.x;
      const dy = p.y - center.y;
      const dz = p.z - center.z;
      s += dx * dx + dy * dy + dz * dz;
    }
    return s / n;
  }

  function distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function bitCount(n) {
    let c = 0;
    while (n) {
      n &= n - 1;
      c++;
    }
    return c;
  }

  function indicesFromMask(mask, N) {
    const arr = [];
    for (let i = 0; i < N; i++) {
      if (mask & (1 << i)) arr.push(i);
    }
    return arr;
  }

  function combinationsApprox(n, k) {
    if (k === 0 || k === n) return 1;
    let num = 1;
    for (let i = 1; i <= k; i++) num *= (n - (i - 1)) / i;
    return num;
  }

  function randomSubsetOfSize(N, m) {
    const indices = Array.from({ length: N }, (_, i) => i);
    for (let i = 0; i < m; i++) {
      const j = i + Math.floor(Math.random() * (N - i));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices.slice(0, m).sort((a, b) => a - b);
  }

  // ------------------ CORE COMPUTATION ------------------

  function computeSubsetResults(population) {
    const N = population.length;
    const allIndices = Array.from({ length: N }, (_, i) => i);
    const rho = meanVec(allIndices, population);
    state.rho = rho;

    const results = [];

    if (N <= N_EXHAUSTIVE_MAX) {
      const totalMasks = 1 << N;
      for (let mask = 1; mask < totalMasks - 1; mask++) {
        const m = bitCount(mask);
        const M = indicesFromMask(mask, N);
        const S = allIndices.filter((i) => !(mask & (1 << i)));

        const mu = meanVec(M, population);
        const sigma = meanVec(S, population);
        const varM = variance(M, population, mu);
        const varS = variance(S, population, sigma);
        const denom = varS + varM;
        const t = denom < 1e-9 ? 0.5 : varS / denom;

        const gamma = {
          x: t * mu.x + (1 - t) * sigma.x,
          y: t * mu.y + (1 - t) * sigma.y,
          z: t * mu.z + (1 - t) * sigma.z,
        };

        const D = distance(gamma, rho);

        results.push({
          size: m,
          M,
          S,
          mu,
          sigma,
          varM,
          varS,
          t,
          gamma,
          rho,
          D,
          jitter: undefined,
          cost: 0,
          screenX: 0,
          screenY: 0,
        });
      }
      state.mode = "nano";
    } else {
      const maxM = N - 1;
      for (let m = 1; m <= maxM; m++) {
        const approxComb = combinationsApprox(N, m);
        const samples = Math.min(SAMPLES_PER_M, approxComb);
        for (let s = 0; s < samples; s++) {
          const M = randomSubsetOfSize(N, m);
          const inM = new Array(N).fill(false);
          for (const idx of M) inM[idx] = true;
          const S = allIndices.filter((i) => !inM[i]);

          const mu = meanVec(M, population);
          const sigma = meanVec(S, population);
          const varM = variance(M, population, mu);
          const varS = variance(S, population, sigma);
          const denom = varS + varM;
          const t = denom < 1e-9 ? 0.5 : varS / denom;

          const gamma = {
            x: t * mu.x + (1 - t) * sigma.x,
            y: t * mu.y + (1 - t) * sigma.y,
            z: t * mu.z + (1 - t) * sigma.z,
          };

          const D = distance(gamma, rho);

          results.push({
            size: m,
            M,
            S,
            mu,
            sigma,
            varM,
            varS,
            t,
            gamma,
            rho,
            D,
            jitter: undefined,
            cost: 0,
            screenX: 0,
            screenY: 0,
          });
        }
      }
      state.mode = "macro";
    }

    state.results = results;
  }

  // ------------------ TOOLTIP ------------------

  function createTooltip() {
    const div = document.createElement("div");
    div.className = "nano-gov-tooltip";
    // Use fixed positioning so clientX/clientY works even when the page is scrolled.
    div.style.position = "fixed";
    div.style.pointerEvents = "none";
    div.style.padding = "6px 8px";
    div.style.borderRadius = "6px";
    div.style.fontSize = "11px";
    div.style.background = "rgba(15,23,42,0.96)";
    div.style.color = "#e5e7eb";
    div.style.border = "1px solid #4b5563";
    div.style.opacity = "0";
    div.style.transition = "opacity 0.12s ease-out";
    div.style.zIndex = "2147483647";
    document.body.appendChild(div);
    return div;
  }

  function showTooltip(x, y, html) {
    const tt = ui.tooltip;
    tt.style.opacity = "1";
    tt.style.left = x + 10 + "px";
    tt.style.top = y + 10 + "px";
    tt.innerHTML = html;
  }

  function hideTooltip() {
    ui.tooltip.style.opacity = "0";
  }

  // ------------------ THREE.JS (LEFT PANEL) ------------------

  function createThreeBadge(text, borderColor) {
    const el = document.createElement("div");
    el.textContent = text;
    el.style.position = "absolute";
    el.style.left = "0";
    el.style.top = "0";
    el.style.transform = "translate(-50%, -140%)";
    el.style.padding = "2px 6px";
    el.style.borderRadius = "999px";
    el.style.fontSize = "11px";
    el.style.fontWeight = "700";
    el.style.background = "rgba(15,23,42,0.92)";
    el.style.border = `1px solid ${borderColor}`;
    el.style.color = "#e5e7eb";
    el.style.whiteSpace = "nowrap";
    el.style.opacity = "0";
    el.style.transition = "opacity 0.12s ease-out";
    return el;
  }

  const _tmpProject = new THREE.Vector3();

  function positionBadgeOverMesh(mesh, badge) {
    if (!mesh || !badge || !mesh.visible || !threeState.camera) {
      if (badge) badge.style.opacity = "0";
      return;
    }

    const w = threeState.viewWidth || ui.threeHost?.clientWidth || 0;
    const h = threeState.viewHeight || ui.threeHost?.clientHeight || 0;
    if (w <= 1 || h <= 1) return;

    mesh.getWorldPosition(_tmpProject);
    _tmpProject.project(threeState.camera);

    // Outside clip space => off-screen / behind camera
    if (_tmpProject.z < -1 || _tmpProject.z > 1) {
      badge.style.opacity = "0";
      return;
    }

    const x = (_tmpProject.x * 0.5 + 0.5) * w;
    const y = (-_tmpProject.y * 0.5 + 0.5) * h;
    if (!isFinite(x) || !isFinite(y)) {
      badge.style.opacity = "0";
      return;
    }

    badge.style.left = `${x}px`;
    badge.style.top = `${y}px`;
    badge.style.opacity = "1";
  }

  function updateThreeBadges() {
    positionBadgeOverMesh(threeState.rhoMesh, threeState.labelRho);
    positionBadgeOverMesh(threeState.muMesh, threeState.labelMu);
    positionBadgeOverMesh(threeState.sigmaMesh, threeState.labelSigma);
    positionBadgeOverMesh(threeState.gammaMesh, threeState.labelGamma);
  }

  function makeLine(material) {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(6);
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return new THREE.Line(geom, material);
  }

  function updateLine(line, a, b) {
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

  function initThree() {
    const { width, height } = getContentBoxSize(ui.threeHost);
    threeState.viewWidth = width;
    threeState.viewHeight = height;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050508);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(4, 4, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.domElement.style.display = "block";
    ui.threeHost.style.position = "relative";
    ui.threeHost.appendChild(renderer.domElement);

    if (!threeState.overlay) {
      const overlay = document.createElement("div");
      overlay.style.position = "absolute";
      overlay.style.left = "0";
      overlay.style.top = "0";
      overlay.style.right = "0";
      overlay.style.bottom = "0";
      overlay.style.pointerEvents = "none";
      overlay.style.zIndex = "2";
      ui.threeHost.appendChild(overlay);

      const rhoBadge = createThreeBadge("ρ", COLORS.people);
      const muBadge = createThreeBadge("μ", COLORS.magistrate);
      const sigmaBadge = createThreeBadge("σ", COLORS.subject);
      const gammaBadge = createThreeBadge("γ", COLORS.gammaFill);
      overlay.appendChild(rhoBadge);
      overlay.appendChild(muBadge);
      overlay.appendChild(sigmaBadge);
      overlay.appendChild(gammaBadge);

      threeState.overlay = overlay;
      threeState.labelRho = rhoBadge;
      threeState.labelMu = muBadge;
      threeState.labelSigma = sigmaBadge;
      threeState.labelGamma = gammaBadge;
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    Object.assign(controls, {
      enableDamping: true,
      dampingFactor: 0.08,
      autoRotate: false,
    });

    const light = new THREE.PointLight(0xffffff, 1.2);
    light.position.set(5, 5, 5);
    scene.add(light, new THREE.AmbientLight(0x404040));

    // Subtle frame
    scene.add(
      new THREE.Mesh(
        new THREE.BoxGeometry(6, 6, 6),
        new THREE.MeshBasicMaterial({
          color: 0x8888ff,
          wireframe: true,
          transparent: true,
          opacity: 0.08,
        })
      )
    );

    const geoms = {
      person: new THREE.SphereGeometry(0.08, 10, 10),
      marker: new THREE.SphereGeometry(0.11, 12, 12),
      gamma: new THREE.OctahedronGeometry(0.13, 0),
    };

    const mats = {
      people: new THREE.MeshStandardMaterial({
        color: new THREE.Color(COLORS.people),
        emissive: new THREE.Color(COLORS.people),
        emissiveIntensity: 0.25,
        metalness: 0.1,
        roughness: 0.5,
        transparent: true,
        opacity: 0.75,
      }),
      magistrate: new THREE.MeshStandardMaterial({
        color: new THREE.Color(COLORS.magistrate),
        emissive: new THREE.Color(COLORS.magistrate),
        emissiveIntensity: 0.25,
        metalness: 0.15,
        roughness: 0.45,
        transparent: true,
        opacity: 0.95,
      }),
      subject: new THREE.MeshStandardMaterial({
        color: new THREE.Color(COLORS.subject),
        emissive: new THREE.Color(COLORS.subject),
        emissiveIntensity: 0.2,
        metalness: 0.12,
        roughness: 0.5,
        transparent: true,
        opacity: 0.9,
      }),
      rho: new THREE.MeshStandardMaterial({
        color: new THREE.Color(COLORS.people),
        emissive: new THREE.Color(COLORS.people),
        emissiveIntensity: 0.35,
        metalness: 0.2,
        roughness: 0.35,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
      mu: new THREE.MeshStandardMaterial({
        color: new THREE.Color(COLORS.magistrate),
        emissive: new THREE.Color(COLORS.magistrate),
        emissiveIntensity: 0.35,
        metalness: 0.2,
        roughness: 0.35,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
      sigma: new THREE.MeshStandardMaterial({
        color: new THREE.Color(COLORS.subject),
        emissive: new THREE.Color(COLORS.subject),
        emissiveIntensity: 0.35,
        metalness: 0.2,
        roughness: 0.35,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
      gamma: new THREE.MeshStandardMaterial({
        color: new THREE.Color(COLORS.gammaFill),
        emissive: new THREE.Color(COLORS.gammaFill),
        emissiveIntensity: 0.35,
        metalness: 0.25,
        roughness: 0.3,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
      lineBase: new THREE.LineBasicMaterial({
        color: 0x94a3b8,
        transparent: true,
        opacity: 0.35,
      }),
      lineMag: new THREE.LineBasicMaterial({
        color: new THREE.Color(COLORS.magistrate),
        transparent: true,
        opacity: 0.85,
      }),
      lineSubj: new THREE.LineBasicMaterial({
        color: new THREE.Color(COLORS.subject),
        transparent: true,
        opacity: 0.85,
      }),
    };

    const rhoMesh = new THREE.Mesh(geoms.marker, mats.rho);
    rhoMesh.renderOrder = -10;
    scene.add(rhoMesh);

    const muMesh = new THREE.Mesh(geoms.marker, mats.mu);
    muMesh.visible = false;
    muMesh.renderOrder = -10;
    scene.add(muMesh);

    const sigmaMesh = new THREE.Mesh(geoms.marker, mats.sigma);
    sigmaMesh.visible = false;
    sigmaMesh.renderOrder = -10;
    scene.add(sigmaMesh);

    const gammaMesh = new THREE.Mesh(geoms.gamma, mats.gamma);
    gammaMesh.visible = false;
    gammaMesh.renderOrder = -10;
    scene.add(gammaMesh);

    const baseLine = makeLine(mats.lineBase);
    const subjLine = makeLine(mats.lineSubj);
    const magLine = makeLine(mats.lineMag);
    baseLine.visible = false;
    subjLine.visible = false;
    magLine.visible = false;
    baseLine.renderOrder = -20;
    subjLine.renderOrder = -20;
    magLine.renderOrder = -20;
    scene.add(baseLine, subjLine, magLine);

    threeState.scene = scene;
    threeState.camera = camera;
    threeState.renderer = renderer;
    threeState.controls = controls;
    threeState.geoms = geoms;
    threeState.mats = mats;
    threeState.rhoMesh = rhoMesh;
    threeState.muMesh = muMesh;
    threeState.sigmaMesh = sigmaMesh;
    threeState.gammaMesh = gammaMesh;
    threeState.baseLine = baseLine;
    threeState.subjLine = subjLine;
    threeState.magLine = magLine;

    if (!threeState.running) {
      threeState.running = true;
      animateThree();
    }
  }

  function animateThree() {
    if (!document.body.contains(mount)) return;
    requestAnimationFrame(animateThree);
    if (!threeState.renderer) return;
    threeState.controls?.update();
    updateThreeBadges();
    threeState.renderer.render(threeState.scene, threeState.camera);
  }

  function frameCameraToPopulation() {
    if (!threeState.peopleGroup) return;
    const box = new THREE.Box3().setFromObject(threeState.peopleGroup);
    if (!isFinite(box.min.x) || !isFinite(box.max.x)) return;

    const center = new THREE.Vector3();
    box.getCenter(center);

    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);
    const radius = Math.max(0.25, sphere.radius || 0);

    const camera = threeState.camera;
    const controls = threeState.controls;
    if (!camera || !controls) return;

    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
    const fov = Math.min(vFov, hFov);

    // For a sphere, the silhouette half-angle is asin(r / d), so d >= r / sin(fov/2)
    let dist = radius / Math.sin(Math.max(0.0001, fov / 2));
    dist *= 1.06; // small padding, keep it tight

    const dir = new THREE.Vector3();
    if (camera.position.distanceTo(controls.target) > 1e-6) {
      dir.copy(camera.position).sub(controls.target).normalize();
    } else {
      dir.set(1, 1, 1).normalize();
    }

    controls.target.copy(center);
    camera.position.copy(center).addScaledVector(dir, dist);
    camera.near = Math.max(0.1, dist / 100);
    camera.far = Math.max(50, dist * 100);
    camera.updateProjectionMatrix();
    controls.update();
  }

  function rebuildThreePopulation() {
    if (!threeState.scene) return;

    if (threeState.peopleGroup) {
      threeState.scene.remove(threeState.peopleGroup);
    }

    const group = new THREE.Group();
    const meshes = [];

    for (const p of state.population) {
      const mesh = new THREE.Mesh(
        threeState.geoms.person,
        threeState.mats.people
      );
      mesh.position.set(p.x, p.y, p.z);
      meshes.push(mesh);
      group.add(mesh);
    }

    threeState.scene.add(group);
    threeState.peopleGroup = group;
    threeState.peopleMeshes = meshes;

    frameCameraToPopulation();
  }

  function applyHighlightToThree() {
    if (!threeState.scene) return;

    // Always show ρ
    threeState.rhoMesh.position.copy(v3(state.rho));

    const r = state.highlightedSubset;
    if (!r) {
      for (const mesh of threeState.peopleMeshes) {
        mesh.material = threeState.mats.people;
      }
      threeState.muMesh.visible = false;
      threeState.sigmaMesh.visible = false;
      threeState.gammaMesh.visible = false;
      threeState.baseLine.visible = false;
      threeState.subjLine.visible = false;
      threeState.magLine.visible = false;
      return;
    }

    const magSet = new Set(r.M);
    for (let i = 0; i < threeState.peopleMeshes.length; i++) {
      const mesh = threeState.peopleMeshes[i];
      mesh.material = magSet.has(i)
        ? threeState.mats.magistrate
        : threeState.mats.subject;
    }

    const mu = v3(r.mu);
    const sigma = v3(r.sigma);
    const gamma = v3(r.gamma);

    threeState.muMesh.position.copy(mu);
    threeState.sigmaMesh.position.copy(sigma);
    threeState.gammaMesh.position.copy(gamma);

    threeState.muMesh.visible = true;
    threeState.sigmaMesh.visible = true;
    threeState.gammaMesh.visible = true;

    updateLine(threeState.baseLine, sigma, mu);
    updateLine(threeState.subjLine, sigma, gamma);
    updateLine(threeState.magLine, gamma, mu);
    threeState.baseLine.visible = true;
    threeState.subjLine.visible = true;
    threeState.magLine.visible = true;
  }

  // ------------------ RIGHT PLOT (2D CANVAS) ------------------

  function drawCostPlot() {
    const ctx = ui.costCtx;
    if (!ctx) return;

    const W = state.costWidth;
    const H = state.costHeight;
    ctx.clearRect(0, 0, W, H);

    const results = state.results;
    if (!results.length) return;

    // 1) compute cost per result and max cost
    let maxC = 0;
    let minC = Infinity;
    let globalBest = null;
    const lambda = state.lambda;

    for (const r of results) {
      const cost = r.D * r.D + lambda * r.varM;
      r.cost = cost;
      if (cost > maxC) maxC = cost;
      if (cost < minC) {
        minC = cost;
        globalBest = r;
      }

      // stable jitter for nicer columns
      if (r.jitter === undefined) {
        const seedBase =
          r.size * 977 +
          (r.M[0] || 0) * 101 +
          (r.M[1] || 0) * 53 +
          (r.M[2] || 0) * 19;
        let seed = (seedBase >>> 0) % 233280;
        seed = (seed * 9301 + 49297) % 233280;
        const rand = seed / 233280; // [0,1)
        r.jitter = (rand * 2 - 1) * 0.3;
      }
    }

    if (maxC <= 0) maxC = 1;

    // 2) group by m for best-by-cost line
    const byM = new Map();
    for (const r of results) {
      const m = r.size;
      let entry = byM.get(m);
      if (!entry) {
        entry = { best: r };
        byM.set(m, entry);
      } else if (r.cost < entry.best.cost) {
        entry.best = r;
      }
    }
    const mValues = Array.from(byM.keys()).sort((a, b) => a - b);

    // 3) axes mapping
    const xMin = mValues[0] - 0.5;
    const xMax = mValues[mValues.length - 1] + 0.5;
    const yMin = 0;
    const yMax = maxC * 1.05;

    // Give y-axis label + tick numbers more breathing room (avoid overlap on narrow screens)
    const plotLeft = 72;
    const plotRight = W - 20;
    const plotTop = 10;
    const plotBottom = H - 30;

    const mapX = (m) =>
      ((m - xMin) / (xMax - xMin)) * (plotRight - plotLeft) + plotLeft;
    const mapY = (C) =>
      plotBottom - ((C - yMin) / (yMax - yMin)) * (plotBottom - plotTop);

    // 4) axes
    ctx.save();
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(plotLeft, plotBottom);
    ctx.lineTo(plotRight, plotBottom);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(plotLeft, plotTop);
    ctx.lineTo(plotLeft, plotBottom);
    ctx.stroke();

    ctx.fillStyle = "#6b7280";
    ctx.font = "10px system-ui, sans-serif";

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (const m of mValues) {
      const x = mapX(m);
      const y = plotBottom;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 4);
      ctx.stroke();
      ctx.fillText(String(m), x, y + 4);
    }

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    const yTicks = 4;
    for (let i = 0; i <= yTicks; i++) {
      const v = yMin + (i / yTicks) * (yMax - yMin);
      const y = mapY(v);
      ctx.beginPath();
      ctx.moveTo(plotLeft - 3, y);
      ctx.lineTo(plotLeft, y);
      ctx.stroke();
      ctx.fillText(v.toFixed(2), plotLeft - 8, y);
    }
    ctx.restore();

    // Axis labels
    ctx.save();
    ctx.fillStyle = "#6b7280";
    ctx.font = "11px system-ui, sans-serif";

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("Magistrates (m)", (plotLeft + plotRight) / 2, H - 14);

    ctx.translate(14, (plotTop + plotBottom) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("Loss", 0, 0);
    ctx.restore();

    // 5) scatter
    for (const r of results) {
      const x = mapX(r.size + r.jitter);
      const y = mapY(r.cost);
      r.screenX = x;
      r.screenY = y;

      const isHovered = state.hoveredResult === r;
      ctx.beginPath();
      ctx.arc(x, y, isHovered ? 4 : 3, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.pointDefault;
      ctx.globalAlpha = isHovered ? 0.95 : 0.5;
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 6) best-by-cost line + markers
    const bestPerM = mValues.map((m) => byM.get(m).best);
    state.globalBestResult = globalBest;
    state.bestPerMSet = new Set(bestPerM);

    if (bestPerM.length > 1) {
      ctx.beginPath();
      bestPerM.forEach((r, i) => {
        const x = mapX(r.size + r.jitter);
        const y = mapY(r.cost);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = COLORS.pointBest;
      ctx.lineWidth = 1.4;
      ctx.globalAlpha = 0.9;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    for (const r of bestPerM) {
      const x = mapX(r.size + r.jitter);
      const y = mapY(r.cost);
      const isHovered = state.hoveredResult === r;
      const isGlobalMin = r === globalBest;
      ctx.beginPath();
      ctx.arc(x, y, isHovered ? 6 : 5, 0, Math.PI * 2);
      ctx.fillStyle = isGlobalMin ? COLORS.pointMin : COLORS.pointBest;
      ctx.strokeStyle = isGlobalMin
        ? COLORS.pointMinStroke
        : COLORS.pointBestStroke;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.95;
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  // ------------------ INTERACTION (RIGHT PLOT) ------------------

  function onCostCanvasMouseMove(evt) {
    if (!state.results.length) return;

    const rect = ui.costCanvas.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;

    let closest = null;
    let closestDist = Infinity;
    for (const r of state.results) {
      const dx = x - r.screenX;
      const dy = y - r.screenY;
      const d2 = dx * dx + dy * dy;
      if (d2 < closestDist) {
        closestDist = d2;
        closest = r;
      }
    }

    const radius2 = 9 * 9;
    if (closest && closestDist <= radius2) {
      const same = closest === state.hoveredResult;

      state.highlightedSubset = closest;
      state.hoveredResult = closest;

      if (!same) {
        applyHighlightToThree();
        drawCostPlot();
      }

      const N = state.population.length;
      const m = closest.size;
      const D = closest.D;
      const varM = closest.varM;
      const varS = closest.varS;
      const t = closest.t;
      const C = closest.cost;
      const lambda = state.lambda;

      const isGlobal = closest === state.globalBestResult;
      const isLocal =
        !isGlobal && state.bestPerMSet && state.bestPerMSet.has(closest);
      const badge = isGlobal
        ? { text: "Globally optimal government", color: COLORS.pointMin }
        : isLocal
        ? {
            text: `Locally optimal government given m=${m}`,
            color: COLORS.pointBest,
          }
        : null;

      const html =
        (badge
          ? `<div><strong style="color:${badge.color}">${badge.text}</strong></div>`
          : `<div><strong>Subset (m = ${m})</strong></div>`) +
        `<div>N = ${N} people</div>` +
        `<div>Magistrates: ${m}, Subjects: ${N - m}</div>` +
        `<div>D = ‖γ − ρ‖ ≈ ${D.toFixed(3)}</div>` +
        `<div>Var(M) ≈ ${varM.toFixed(3)}, Var(S) ≈ ${varS.toFixed(3)}</div>` +
        `<div>t ≈ ${t.toFixed(3)}</div>` +
        `<div>C = D² + λ·Var(M) ≈ ${C.toFixed(3)} (λ = ${lambda.toFixed(
          2
        )})</div>`;

      showTooltip(evt.clientX, evt.clientY, html);
    } else {
      hideTooltip();
      if (state.highlightedSubset || state.hoveredResult) {
        state.highlightedSubset = null;
        state.hoveredResult = null;
        applyHighlightToThree();
        drawCostPlot();
      }
    }
  }

  // ------------------ LAYOUT ------------------

  function layout() {
    if (!ui.threeHost || !ui.costHost) return;

    // Right plot (2D canvas)
    const { width: cw, height: ch } = getContentBoxSize(ui.costHost);
    state.costWidth = Math.max(220, Math.floor(cw));
    state.costHeight = Math.max(220, Math.floor(ch));
    ui.costCtx = setupHiDPICanvas(
      ui.costCanvas,
      state.costWidth,
      state.costHeight
    );

    // Left plot (Three.js)
    if (threeState.renderer && threeState.camera) {
      const { width: tw, height: th } = getContentBoxSize(ui.threeHost);
      threeState.viewWidth = tw;
      threeState.viewHeight = th;
      threeState.renderer.setSize(tw, th);
      threeState.renderer.setPixelRatio(window.devicePixelRatio || 1);
      threeState.camera.aspect = tw / th;
      threeState.camera.updateProjectionMatrix();
    }

    drawCostPlot();
  }

  // ------------------ UI SETUP ------------------

  function initUI() {
    const root = document.createElement("div");
    root.style.display = "flex";
    root.style.flexDirection = "column";
    root.style.gap = "0.75rem";
    mount.appendChild(root);

    const controls = document.createElement("div");
    controls.style.display = "flex";
    controls.style.flexWrap = "wrap";
    controls.style.alignItems = "center";
    controls.style.gap = "0.75rem";
    root.appendChild(controls);

    // Population control
    const popControl = document.createElement("div");
    popControl.style.display = "flex";
    popControl.style.alignItems = "center";
    popControl.style.gap = "0.35rem";
    controls.appendChild(popControl);

    const popLabel = document.createElement("span");
    popLabel.textContent = "Population size N:";
    popLabel.style.fontSize = "0.85rem";
    popControl.appendChild(popLabel);

    const popValue = document.createElement("span");
    popValue.textContent = String(state.N);
    popValue.style.fontWeight = "600";
    popValue.style.fontSize = "0.9rem";
    popControl.appendChild(popValue);

    const popSlider = document.createElement("input");
    popSlider.type = "range";
    popSlider.min = String(N_MIN);
    popSlider.max = String(N_MAX);
    popSlider.value = String(state.N);
    popSlider.style.width = "160px";
    popControl.appendChild(popSlider);

    // Lambda control
    const lambdaControl = document.createElement("div");
    lambdaControl.style.display = "flex";
    lambdaControl.style.alignItems = "center";
    lambdaControl.style.gap = "0.35rem";
    controls.appendChild(lambdaControl);

    const lambdaLabel = document.createElement("span");
    lambdaLabel.textContent = "Friction weight λ:";
    lambdaLabel.style.fontSize = "0.85rem";
    lambdaControl.appendChild(lambdaLabel);

    const lambdaValue = document.createElement("span");
    lambdaValue.textContent = state.lambda.toFixed(2);
    lambdaValue.style.fontWeight = "600";
    lambdaValue.style.fontSize = "0.9rem";
    lambdaControl.appendChild(lambdaValue);

    const lambdaSlider = document.createElement("input");
    lambdaSlider.type = "range";
    lambdaSlider.min = "0";
    lambdaSlider.max = "3";
    lambdaSlider.step = "0.05";
    lambdaSlider.value = String(state.lambda);
    lambdaSlider.style.width = "160px";
    lambdaControl.appendChild(lambdaSlider);

    const randomBtn = document.createElement("button");
    randomBtn.textContent = "Randomize population";
    randomBtn.style.fontSize = "0.85rem";
    randomBtn.style.padding = "0.4rem 0.7rem";
    randomBtn.style.border = "none";
    randomBtn.style.borderRadius = "0.4rem";
    randomBtn.style.background = "#2563eb";
    randomBtn.style.color = "#ffffff";
    randomBtn.style.cursor = "pointer";
    randomBtn.onmouseenter = () => (randomBtn.style.background = "#1d4ed8");
    randomBtn.onmouseleave = () => (randomBtn.style.background = "#2563eb");
    controls.appendChild(randomBtn);

    // Plots row
    const plotsRow = document.createElement("div");
    plotsRow.style.display = "flex";
    plotsRow.style.gap = "0.85rem";
    plotsRow.style.alignItems = "stretch";
    plotsRow.style.width = "100%";
    plotsRow.style.height = "360px";
    root.appendChild(plotsRow);

    // Left panel: 2D canvas cost plot
    const costPanel = document.createElement("div");
    costPanel.style.flex = "1";
    costPanel.style.display = "flex";
    costPanel.style.flexDirection = "column";
    costPanel.style.gap = "0.35rem";
    plotsRow.appendChild(costPanel);

    const costTitle = document.createElement("div");
    costTitle.textContent = "Cost by magistrate count";
    costTitle.style.fontSize = "0.85rem";
    costTitle.style.color = "#9ca3af";
    costTitle.style.fontWeight = "600";
    costPanel.appendChild(costTitle);

    const costHost = document.createElement("div");
    costHost.style.flex = "1";
    costHost.style.borderRadius = "10px";
    costHost.style.overflow = "hidden";
    costHost.style.border = "1px solid rgba(229,231,235,0.18)";
    costPanel.appendChild(costHost);

    const costCanvas = document.createElement("canvas");
    costCanvas.style.display = "block";
    costHost.appendChild(costCanvas);

    // Right panel: Three.js
    const threePanel = document.createElement("div");
    threePanel.style.flex = "1";
    threePanel.style.display = "flex";
    threePanel.style.flexDirection = "column";
    threePanel.style.gap = "0.35rem";
    plotsRow.appendChild(threePanel);

    const threeTitle = document.createElement("div");
    threeTitle.textContent = "Population (3D)";
    threeTitle.style.fontSize = "0.85rem";
    threeTitle.style.color = "#9ca3af";
    threeTitle.style.fontWeight = "600";
    threePanel.appendChild(threeTitle);

    const threeHost = document.createElement("div");
    threeHost.style.flex = "1";
    threeHost.style.borderRadius = "10px";
    threeHost.style.overflow = "hidden";
    threeHost.style.border = "1px solid rgba(229,231,235,0.18)";
    threePanel.appendChild(threeHost);

    const tooltip = createTooltip();

    ui.popSlider = popSlider;
    ui.popValueLabel = popValue;
    ui.lambdaSlider = lambdaSlider;
    ui.lambdaValueLabel = lambdaValue;
    ui.threeHost = threeHost;
    ui.costHost = costHost;
    ui.costCanvas = costCanvas;
    ui.tooltip = tooltip;

    initThree();

    popSlider.addEventListener("input", () => {
      state.N = Number(popSlider.value);
      ui.popValueLabel.textContent = String(state.N);
      regenerate(true);
    });

    lambdaSlider.addEventListener("input", () => {
      state.lambda = Number(lambdaSlider.value);
      ui.lambdaValueLabel.textContent = state.lambda.toFixed(2);
      drawCostPlot();
    });

    randomBtn.addEventListener("click", () => {
      regenerate(true, { randomizePopulation: true });
    });

    costCanvas.addEventListener("mousemove", onCostCanvasMouseMove);
    costCanvas.addEventListener("mouseleave", () => {
      hideTooltip();
      state.highlightedSubset = null;
      state.hoveredResult = null;
      applyHighlightToThree();
      drawCostPlot();
    });

    window.addEventListener("resize", () => {
      layout();
    });

    // First layout after DOM insertion
    requestAnimationFrame(layout);
  }

  // ------------------ REGENERATE ------------------

  function regenerate(force, opts = {}) {
    const { randomizePopulation = false } = opts;

    if (randomizePopulation || !state.population.length || force) {
      state.population = generatePopulation(state.N);
    }

    computeSubsetResults(state.population);
    state.highlightedSubset = null;
    state.hoveredResult = null;

    rebuildThreePopulation();
    applyHighlightToThree();
    drawCostPlot();
  }

  // Kick off
  initUI();
  regenerate(true, { randomizePopulation: true });
})();
