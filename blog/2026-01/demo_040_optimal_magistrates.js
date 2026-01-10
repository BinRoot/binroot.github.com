// demo_040_optimal_magistrates.js
// Experiment 6:
// For each population size N, find the magistrate count m that yields the lowest-cost government.
// Uses the same cost model as demo_030:
//   C(M) = D(M)^2 + λ * Var(M)
// where D(M) = ||γ - ρ|| and γ is the optimal tug-of-war point between μ and σ.

(function () {
  const mount = document.getElementById("demo_040_optimal_magistrates");
  if (!mount) return;

  mount.innerHTML = "";

  // ------------------ CONFIG ------------------
  const N_MIN = 3;
  const N_MAX = 40;
  const N_EXHAUSTIVE_MAX = 9;
  const SAMPLES_PER_M = 150;

  const COLORS = {
    axis: "#e5e7eb",
    grid: "rgba(148,163,184,0.18)",
    label: "#6b7280",
    // Keep consistent with demo_030_optimal_government.js "global minimum" highlight
    line: "#22c55e",
    point: "#22c55e",
    pointStroke: "#166534",
    pointHover: "#ffffff",
  };

  // ------------------ STATE ------------------
  const state = {
    lambda: 1.0,
    // per N: { N, ms:number[], d2s:number[], varMs:number[] }
    samplesByN: [],
    // plotted series: [{N, mStar, minCost}]
    series: [],
    // inferred "two-mode" split for the current curve (depends on λ)
    split: null, // { rightStartIndex, rightStartN, midN, leftMeanPct, rightMeanPct }
    hoveredIndex: -1,
    width: 300,
    height: 320,
  };

  const ui = {
    lambdaSlider: null,
    lambdaValueLabel: null,
    plotHost: null,
    plotCanvas: null,
    plotCtx: null,
    tooltip: null,
  };

  // ------------------ UTILITIES ------------------
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

  // Small deterministic RNG for stable plots (so λ changes don't reshuffle the world)
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function randomNormal(rng, mean = 0, std = 1) {
    let u = 0,
      v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return mean + std * z;
  }

  function combinationsApprox(n, k) {
    if (k === 0 || k === n) return 1;
    k = Math.min(k, n - k);
    let num = 1;
    for (let i = 1; i <= k; i++) num *= (n - (i - 1)) / i;
    return num;
  }

  function randomSubsetOfSize(N, m, rng) {
    const indices = Array.from({ length: N }, (_, i) => i);
    for (let i = 0; i < m; i++) {
      const j = i + Math.floor(rng() * (N - i));
      const tmp = indices[i];
      indices[i] = indices[j];
      indices[j] = tmp;
    }
    return indices.slice(0, m); // order doesn't matter for our sums
  }

  // ------------------ CORE SIMULATION ------------------
  function generatePopulationArrays(N, rng) {
    const xs = new Array(N);
    const ys = new Array(N);
    const zs = new Array(N);
    const sqs = new Array(N);

    let sumX = 0,
      sumY = 0,
      sumZ = 0,
      sumSq = 0;

    for (let i = 0; i < N; i++) {
      const factionCenter = i < N / 2 ? -1 : 1;
      const x = factionCenter + randomNormal(rng, 0, 0.5);
      const y = randomNormal(rng, 0, 0.5);
      const z = randomNormal(rng, 0, 0.5);
      const sq = x * x + y * y + z * z;

      xs[i] = x;
      ys[i] = y;
      zs[i] = z;
      sqs[i] = sq;

      sumX += x;
      sumY += y;
      sumZ += z;
      sumSq += sq;
    }

    return { xs, ys, zs, sqs, sumX, sumY, sumZ, sumSq };
  }

  function pushSubsetSample(out, N, pop, m, sumMx, sumMy, sumMz, sumMSq) {
    const sCount = N - m;
    if (m <= 0 || sCount <= 0) return;

    const muX = sumMx / m;
    const muY = sumMy / m;
    const muZ = sumMz / m;
    const varM = Math.max(0, sumMSq / m - (muX * muX + muY * muY + muZ * muZ));

    const sumSx = pop.sumX - sumMx;
    const sumSy = pop.sumY - sumMy;
    const sumSz = pop.sumZ - sumMz;
    const sumSSq = pop.sumSq - sumMSq;

    const sigmaX = sumSx / sCount;
    const sigmaY = sumSy / sCount;
    const sigmaZ = sumSz / sCount;
    const varS = Math.max(
      0,
      sumSSq / sCount - (sigmaX * sigmaX + sigmaY * sigmaY + sigmaZ * sigmaZ)
    );

    const denom = varS + varM;
    const t = denom < 1e-12 ? 0.5 : varS / denom;

    const gammaX = t * muX + (1 - t) * sigmaX;
    const gammaY = t * muY + (1 - t) * sigmaY;
    const gammaZ = t * muZ + (1 - t) * sigmaZ;

    const rhoX = pop.sumX / N;
    const rhoY = pop.sumY / N;
    const rhoZ = pop.sumZ / N;

    const dx = gammaX - rhoX;
    const dy = gammaY - rhoY;
    const dz = gammaZ - rhoZ;
    const d2 = dx * dx + dy * dy + dz * dz;

    out.ms.push(m);
    out.d2s.push(d2);
    out.varMs.push(varM);
  }

  function computeSamplesForN(N, seedBase) {
    const rng = mulberry32((seedBase ^ (N * 0x9e3779b9)) >>> 0);
    const pop = generatePopulationArrays(N, rng);

    const out = { N, ms: [], d2s: [], varMs: [] };

    if (N <= N_EXHAUSTIVE_MAX) {
      const totalMasks = 1 << N;
      for (let mask = 1; mask < totalMasks - 1; mask++) {
        let m = 0;
        let sumMx = 0,
          sumMy = 0,
          sumMz = 0,
          sumMSq = 0;
        for (let i = 0; i < N; i++) {
          if (mask & (1 << i)) {
            m++;
            sumMx += pop.xs[i];
            sumMy += pop.ys[i];
            sumMz += pop.zs[i];
            sumMSq += pop.sqs[i];
          }
        }
        pushSubsetSample(out, N, pop, m, sumMx, sumMy, sumMz, sumMSq);
      }
    } else {
      for (let m = 1; m <= N - 1; m++) {
        const approxComb = combinationsApprox(N, m);
        const samples = Math.min(SAMPLES_PER_M, approxComb);
        for (let s = 0; s < samples; s++) {
          const M = randomSubsetOfSize(N, m, rng);
          let sumMx = 0,
            sumMy = 0,
            sumMz = 0,
            sumMSq = 0;
          for (let i = 0; i < M.length; i++) {
            const idx = M[i];
            sumMx += pop.xs[idx];
            sumMy += pop.ys[idx];
            sumMz += pop.zs[idx];
            sumMSq += pop.sqs[idx];
          }
          pushSubsetSample(out, N, pop, m, sumMx, sumMy, sumMz, sumMSq);
        }
      }
    }

    return out;
  }

  function computeSeries(lambda) {
    const series = [];
    for (const entry of state.samplesByN) {
      const N = entry.N;
      const bestByM = new Array(N + 1).fill(Infinity);

      const ms = entry.ms;
      const d2s = entry.d2s;
      const varMs = entry.varMs;

      for (let i = 0; i < ms.length; i++) {
        const m = ms[i];
        const cost = d2s[i] + lambda * varMs[i];
        if (cost < bestByM[m]) bestByM[m] = cost;
      }

      let bestM = 1;
      let bestCost = bestByM[1];
      for (let m = 2; m <= N - 1; m++) {
        if (bestByM[m] < bestCost) {
          bestCost = bestByM[m];
          bestM = m;
        }
      }

      const frac = bestM / N;
      series.push({
        N,
        mStar: bestM,
        frac,
        fracPct: frac * 100,
        minCost: bestCost,
      });
    }
    return series;
  }

  // ------------------ REGIME SPLIT (DATA-DRIVEN) ------------------
  // Find a single change-point that best partitions the curve into two "modes"
  // by minimizing within-segment squared error (piecewise-constant fit).
  function inferRegimeSplit(series, minSegSize = 5) {
    const K = series.length;
    if (K < minSegSize * 2) return null;

    const y = series.map((p) => p.fracPct);
    const pref = new Array(K + 1).fill(0);
    const pref2 = new Array(K + 1).fill(0);
    for (let i = 0; i < K; i++) {
      pref[i + 1] = pref[i] + y[i];
      pref2[i + 1] = pref2[i] + y[i] * y[i];
    }

    const segSSE = (a, bExclusive) => {
      const n = bExclusive - a;
      if (n <= 0) return 0;
      const sum = pref[bExclusive] - pref[a];
      const sum2 = pref2[bExclusive] - pref2[a];
      return sum2 - (sum * sum) / n;
    };

    let bestS = minSegSize; // right segment start index
    let bestTotal = Infinity;

    for (let s = minSegSize; s <= K - minSegSize; s++) {
      const total = segSSE(0, s) + segSSE(s, K);
      if (total < bestTotal) {
        bestTotal = total;
        bestS = s;
      }
    }

    const leftN = bestS;
    const rightN = K - bestS;
    const leftSum = pref[bestS];
    const rightSum = pref[K] - pref[bestS];
    const leftMeanPct = leftSum / Math.max(1, leftN);
    const rightMeanPct = rightSum / Math.max(1, rightN);

    const rightStartN = series[bestS].N;
    const midN = (series[bestS - 1].N + series[bestS].N) / 2;

    return {
      rightStartIndex: bestS,
      rightStartN,
      midN,
      leftMeanPct,
      rightMeanPct,
    };
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

  // ------------------ PLOT ------------------
  function drawPlot() {
    const ctx = ui.plotCtx;
    if (!ctx) return;

    const W = state.width;
    const H = state.height;
    ctx.clearRect(0, 0, W, H);

    const series = state.series;
    if (!series.length) return;

    // Give y-axis label + tick numbers more breathing room (avoid overlap on narrow screens)
    const plotLeft = 72;
    const plotRight = W - 18;
    const plotTop = 12;
    const plotBottom = H - 34;

    const xMin = N_MIN - 0.5;
    const xMax = N_MAX + 0.5;
    const yMin = 0;
    const yMax = 100; // percent scale (0..100)

    const mapX = (x) =>
      ((x - xMin) / (xMax - xMin)) * (plotRight - plotLeft) + plotLeft;
    const mapY = (y) =>
      plotBottom - ((y - yMin) / (yMax - yMin)) * (plotBottom - plotTop);

    // Regime shading (behind everything)
    const split = state.split;
    if (split) {
      const splitX = mapX(split.midN);
      ctx.save();
      ctx.fillStyle = "rgba(148,163,184,0.06)";
      ctx.fillRect(
        plotLeft,
        plotTop,
        Math.max(0, splitX - plotLeft),
        plotBottom - plotTop
      );
      ctx.fillStyle = "rgba(148,163,184,0.025)";
      ctx.fillRect(
        splitX,
        plotTop,
        Math.max(0, plotRight - splitX),
        plotBottom - plotTop
      );
      ctx.restore();
    }

    // Grid (subtle)
    ctx.save();
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    for (let n = 5; n <= N_MAX; n += 5) {
      const x = mapX(n);
      ctx.beginPath();
      ctx.moveTo(x, plotTop);
      ctx.lineTo(x, plotBottom);
      ctx.stroke();
    }
    for (let p = 20; p <= 100; p += 20) {
      const y = mapY(p);
      ctx.beginPath();
      ctx.moveTo(plotLeft, y);
      ctx.lineTo(plotRight, y);
      ctx.stroke();
    }
    ctx.restore();

    // Inferred split line + label (above grid, below the series)
    if (split) {
      const splitX = mapX(split.midN);
      ctx.save();
      ctx.setLineDash([5, 6]);
      ctx.strokeStyle = "rgba(229,231,235,0.35)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(splitX, plotTop);
      ctx.lineTo(splitX, plotBottom);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = COLORS.label;
      ctx.font = "10px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(
        `regime boundary (N≈${split.rightStartN})`,
        splitX + 4,
        plotTop + 2
      );
      ctx.restore();
    }

    // Axes
    ctx.save();
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(plotLeft, plotBottom);
    ctx.lineTo(plotRight, plotBottom);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(plotLeft, plotTop);
    ctx.lineTo(plotLeft, plotBottom);
    ctx.stroke();

    // Ticks + labels
    ctx.fillStyle = COLORS.label;
    ctx.font = "10px system-ui, sans-serif";

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let n = N_MIN; n <= N_MAX; n++) {
      if (n % 5 !== 0 && n !== N_MIN && n !== N_MAX) continue;
      const x = mapX(n);
      ctx.beginPath();
      ctx.moveTo(x, plotBottom);
      ctx.lineTo(x, plotBottom + 4);
      ctx.stroke();
      ctx.fillText(String(n), x, plotBottom + 5);
    }

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let p = 0; p <= 100; p += 20) {
      const y = mapY(p);
      ctx.beginPath();
      ctx.moveTo(plotLeft - 3, y);
      ctx.lineTo(plotLeft, y);
      ctx.stroke();
      ctx.fillText(`${p}%`, plotLeft - 8, y);
    }
    ctx.restore();

    // Axis titles
    ctx.save();
    ctx.fillStyle = COLORS.label;
    ctx.font = "11px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("Population size (N)", (plotLeft + plotRight) / 2, H - 16);

    ctx.translate(14, (plotTop + plotBottom) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("Magistrate share (m*/N)", 0, 0);
    ctx.restore();

    // Line
    ctx.save();
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 1.6;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    series.forEach((p, i) => {
      const x = mapX(p.N);
      const y = mapY(p.fracPct);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();

    // Points
    series.forEach((p, i) => {
      const x = mapX(p.N);
      const y = mapY(p.fracPct);
      const hovered = i === state.hoveredIndex;
      ctx.beginPath();
      ctx.arc(x, y, hovered ? 5.5 : 4.5, 0, Math.PI * 2);
      ctx.fillStyle = hovered ? COLORS.pointHover : COLORS.point;
      ctx.strokeStyle = COLORS.pointStroke;
      ctx.lineWidth = hovered ? 1.8 : 1.4;
      ctx.globalAlpha = hovered ? 0.98 : 0.92;
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
  }

  function pickClosestPoint(clientX, clientY) {
    const rect = ui.plotCanvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const W = state.width;
    const H = state.height;
    const plotLeft = 72;
    const plotRight = W - 18;
    const plotTop = 12;
    const plotBottom = H - 34;
    const xMin = N_MIN - 0.5;
    const xMax = N_MAX + 0.5;
    const yMin = 0;
    const yMax = 100;
    const mapX = (val) =>
      ((val - xMin) / (xMax - xMin)) * (plotRight - plotLeft) + plotLeft;
    const mapY = (val) =>
      plotBottom - ((val - yMin) / (yMax - yMin)) * (plotBottom - plotTop);

    let bestI = -1;
    let bestD2 = Infinity;
    for (let i = 0; i < state.series.length; i++) {
      const p = state.series[i];
      const px = mapX(p.N);
      const py = mapY(p.fracPct);
      const dx = x - px;
      const dy = y - py;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD2) {
        bestD2 = d2;
        bestI = i;
      }
    }

    // pick radius
    const r = 10;
    return bestD2 <= r * r ? bestI : -1;
  }

  // ------------------ LAYOUT + EVENTS ------------------
  function layout() {
    if (!ui.plotHost) return;
    const { width, height } = getContentBoxSize(ui.plotHost);
    state.width = Math.max(260, Math.floor(width));
    state.height = Math.max(240, Math.floor(height));
    ui.plotCtx = setupHiDPICanvas(ui.plotCanvas, state.width, state.height);
    drawPlot();
  }

  let _recomputeRAF = 0;
  function scheduleRecompute() {
    if (_recomputeRAF) return;
    _recomputeRAF = requestAnimationFrame(() => {
      _recomputeRAF = 0;
      state.series = computeSeries(state.lambda);
      state.split = inferRegimeSplit(state.series);
      state.hoveredIndex = -1;
      drawPlot();
    });
  }

  function onPlotMouseMove(evt) {
    const idx = pickClosestPoint(evt.clientX, evt.clientY);
    const changed = idx !== state.hoveredIndex;
    state.hoveredIndex = idx;
    if (changed) drawPlot();

    if (idx >= 0) {
      const p = state.series[idx];
      const html =
        `<div><strong>Optimal magistrates</strong></div>` +
        `<div>N = ${p.N}</div>` +
        `<div>m* = ${p.mStar}</div>` +
        `<div>m*/N = ${p.fracPct.toFixed(1)}%</div>` +
        `<div>min cost ≈ ${p.minCost.toFixed(3)}</div>` +
        `<div>λ = ${state.lambda.toFixed(2)}</div>`;
      showTooltip(evt.clientX, evt.clientY, html);
    } else {
      hideTooltip();
    }
  }

  // ------------------ UI ------------------
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
    lambdaSlider.style.width = "220px";
    lambdaControl.appendChild(lambdaSlider);

    // Plot panel
    const plotPanel = document.createElement("div");
    plotPanel.style.display = "flex";
    plotPanel.style.flexDirection = "column";
    plotPanel.style.gap = "0.35rem";
    plotPanel.style.width = "100%";
    plotPanel.style.height = "360px";
    root.appendChild(plotPanel);

    const title = document.createElement("div");
    title.textContent = "Optimal magistrates vs population size";
    title.style.fontSize = "0.85rem";
    title.style.color = "#9ca3af";
    title.style.fontWeight = "600";
    plotPanel.appendChild(title);

    const plotHost = document.createElement("div");
    plotHost.style.flex = "1";
    plotHost.style.borderRadius = "10px";
    plotHost.style.overflow = "hidden";
    plotHost.style.border = "1px solid rgba(229,231,235,0.18)";
    plotPanel.appendChild(plotHost);

    const canvas = document.createElement("canvas");
    canvas.style.display = "block";
    plotHost.appendChild(canvas);

    const tooltip = createTooltip();

    ui.lambdaSlider = lambdaSlider;
    ui.lambdaValueLabel = lambdaValue;
    ui.plotHost = plotHost;
    ui.plotCanvas = canvas;
    ui.tooltip = tooltip;

    lambdaSlider.addEventListener("input", () => {
      state.lambda = Number(lambdaSlider.value);
      ui.lambdaValueLabel.textContent = state.lambda.toFixed(2);
      scheduleRecompute();
    });

    canvas.addEventListener("mousemove", onPlotMouseMove);
    canvas.addEventListener("mouseleave", () => {
      hideTooltip();
      state.hoveredIndex = -1;
      drawPlot();
    });

    window.addEventListener("resize", () => {
      layout();
    });

    // First layout after DOM insertion
    requestAnimationFrame(layout);
  }

  // ------------------ BOOT ------------------
  // Precompute the (D^2, VarM) samples for each N once, then λ just re-scores them.
  // Seed is fixed so the curve is stable.
  const SEED_BASE = 0x4d325f2a;
  for (let N = N_MIN; N <= N_MAX; N++) {
    state.samplesByN.push(computeSamplesForN(N, SEED_BASE));
  }

  state.series = computeSeries(state.lambda);
  state.split = inferRegimeSplit(state.series);
  initUI();
})();
