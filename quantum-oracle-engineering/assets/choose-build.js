// choose-build.js -- the sieve and the compiler, slide 3's ambient loop.
//
// Left panel: the three course contenders fall toward a screening lens; Go
// and the two-arm bandit deflect to the stop sign, while the close-calls game
// (the grid with the blue die) passes.  The passing tile
// crosses the seam and COMPILES: wires draw themselves out of it, a sequence
// of gates populates them left to right, and the payoff qubit lights.  One
// problem, one whole oracle; building is compilation, not appending a gate.
// The choreography is a fixed timeline over performance.now(), so the loop
// is deterministic.  Under prefers-reduced-motion the scene renders one
// static frame instead: the finished circuit beside a mid-screening reject.
(function () {
  const svg = document.getElementById('choose-build');
  if (!svg) return;

  const ns = 'http://www.w3.org/2000/svg';
  const INK = '#2d3140';
  const WIRE = '#8a90a0';
  const DIM = '#888';
  const RULE = '#bbb';
  const STOPRED = '#c0392b';
  const ACCENT = '#456AAD';
  const GLOW_FILL = '#F2BF80';
  const GLOW_EDGE = '#D95032';

  const LENS = { x: 170, y: 150 };
  const SIGN = { x: 62, y: 252 };
  const WIRE_X0 = 430, WIRE_X1 = 700;
  const WIRE_Y = [110, 150, 190];
  const GATE_X = [472, 520, 568, 616, 660];
  const PAYOFF = { x: 714, y: 150 };

  const el = (name, attrs, parent) => {
    const node = document.createElementNS(ns, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    (parent || svg).appendChild(node);
    return node;
  };
  const text = (s, x, y, size) => {
    const t = el('text', {
      x, y, 'text-anchor': 'middle', fill: DIM,
      'font-size': size, 'font-family': "'Ubuntu', sans-serif"
    });
    t.textContent = s;
    return t;
  };

  // ── Scenery ─────────────────────────────────────────────────────────
  el('line', { x1: 380, y1: 24, x2: 380, y2: 268,
    stroke: '#ddd', 'stroke-width': 1.5, 'stroke-dasharray': '4,7' });
  text('choose the problem', LENS.x, 290, 13);
  text('build its oracle', 565, 290, 13);
  text('three contenders · one survivor', 380, 18, 12);

  el('circle', { cx: LENS.x, cy: LENS.y, r: 36,
    fill: '#ffffff', 'fill-opacity': 0.35, stroke: '#4a4a4a', 'stroke-width': 2.5 });
  el('line', { x1: LENS.x + 26, y1: LENS.y + 26, x2: LENS.x + 50, y2: LENS.y + 50,
    stroke: '#4a4a4a', 'stroke-width': 5, 'stroke-linecap': 'round' });

  const oct = [];
  for (let i = 0; i < 8; i++) {
    const a = Math.PI / 8 + i * Math.PI / 4;
    oct.push((SIGN.x + 14 * Math.cos(a)).toFixed(1) + ',' +
             (SIGN.y + 14 * Math.sin(a)).toFixed(1));
  }
  el('polygon', { points: oct.join(' '), fill: STOPRED, opacity: 0.85 });
  el('rect', { x: SIGN.x - 8, y: SIGN.y - 1.5, width: 16, height: 3,
    fill: '#fff', opacity: 0.9 });

  // ── The circuit, one group so the whole oracle fades and resets as one ──
  const circuit = el('g', {});
  const wires = WIRE_Y.map((y) => el('line', {
    x1: WIRE_X0, y1: y, x2: WIRE_X0, y2: y, stroke: WIRE, 'stroke-width': 1.5
  }, circuit));
  const halo = el('circle', { cx: PAYOFF.x, cy: PAYOFF.y, r: 12,
    fill: GLOW_FILL, opacity: 0 }, circuit);
  const payoff = el('circle', { cx: PAYOFF.x, cy: PAYOFF.y, r: 7,
    fill: '#f0f0f0', stroke: WIRE, 'stroke-width': 1.5, opacity: 0 }, circuit);

  // Five gates in the qcircuit style: control dot, target circle-plus,
  // vertical tie.  [control wire, target wire] per slot.
  const gatePairs = [[0, 1], [2, 1], [0, 2], [1, 0], [2, 0]];
  const gates = gatePairs.map(([c, t], k) => {
    const g = el('g', { opacity: 0 }, circuit);
    const x = GATE_X[k];
    el('line', { x1: x, y1: WIRE_Y[c], x2: x, y2: WIRE_Y[t],
      stroke: INK, 'stroke-width': 1.8 }, g);
    el('circle', { cx: x, cy: WIRE_Y[c], r: 4.5, fill: INK }, g);
    el('circle', { cx: x, cy: WIRE_Y[t], r: 9,
      fill: 'none', stroke: INK, 'stroke-width': 1.8 }, g);
    el('line', { x1: x - 9, y1: WIRE_Y[t], x2: x + 9, y2: WIRE_Y[t],
      stroke: INK, 'stroke-width': 1.8 }, g);
    el('line', { x1: x, y1: WIRE_Y[t] - 9, x2: x, y2: WIRE_Y[t] + 9,
      stroke: INK, 'stroke-width': 1.8 }, g);
    return g;
  });

  // ── Tiles ───────────────────────────────────────────────────────────
  const makeTile = (kind) => {
    const g = el('g', { opacity: 0 });
    if (kind === 'accept') {
      el('rect', { x: -12, y: -12, width: 24, height: 24, rx: 3,
        fill: '#fff', stroke: '#4a4a4a', 'stroke-width': 1.5 }, g);
      [-4, 4].forEach((d) => {
        el('line', { x1: d, y1: -12, x2: d, y2: 12, stroke: RULE }, g);
        el('line', { x1: -12, y1: d, x2: 12, y2: d, stroke: RULE }, g);
      });
      el('rect', { x: 2, y: 2, width: 10, height: 10, rx: 2, fill: ACCENT }, g);
      el('circle', { cx: 7, cy: 7, r: 1.6, fill: '#fff' }, g);
    } else if (kind === 'go') {
      el('rect', { x: -12, y: -12, width: 24, height: 24, rx: 3,
        fill: '#fff', stroke: '#4a4a4a', 'stroke-width': 1.5 }, g);
      [-4, 4].forEach((d) => {
        el('line', { x1: d, y1: -12, x2: d, y2: 12, stroke: RULE }, g);
        el('line', { x1: -12, y1: d, x2: 12, y2: d, stroke: RULE }, g);
      });
      el('circle', { cx: -4, cy: -4, r: 3.2, fill: INK }, g);
      el('circle', { cx: 4, cy: 4, r: 3.2, fill: '#fff',
        stroke: INK, 'stroke-width': 1.2 }, g);
    } else if (kind === 'slot') {
      el('rect', { x: -12, y: -10, width: 21, height: 20, rx: 3,
        fill: '#fff', stroke: '#4a4a4a', 'stroke-width': 1.5 }, g);
      [-8.5, -2, 4.5].forEach((x) => el('rect', {
        x, y: -4, width: 4.5, height: 8, fill: RULE }, g));
      el('line', { x1: 9, y1: -2, x2: 14, y2: -9,
        stroke: '#4a4a4a', 'stroke-width': 1.8 }, g);
      el('circle', { cx: 14, cy: -10, r: 2.4, fill: STOPRED }, g);
    } else {
      el('path', { d: 'M -11 6 C -6 -10, 2 -12, 4 -4 C 6 4, -8 2, -2 8 ' +
        'C 3 13, 10 4, 11 -6', fill: 'none',
        stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round' }, g);
    }
    const names = { accept: 'close calls', go: 'Go', slot: 'bandit' };
    if (names[kind]) {
      const name = el('text', {
        x: 0, y: 23, 'text-anchor': 'middle', fill: DIM,
        'font-size': 8.5, 'font-weight': 600,
        'font-family': "'Ubuntu', sans-serif"
      }, g);
      name.textContent = names[kind];
    }
    return g;
  };

  const rejectTiles = ['go', 'slot'].map(makeTile);
  const acceptTile = makeTile('accept');

  const lerp = (a, b, u) => a + (b - a) * u;
  const clamp01 = (u) => Math.max(0, Math.min(1, u));
  const ease = (u) => u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  const place = (g, x, y, opacity, rot, scale) => {
    g.setAttribute('transform',
      'translate(' + x + ',' + y + ') rotate(' + (rot || 0) + ')' +
      (scale ? ' scale(' + scale + ')' : ''));
    g.setAttribute('opacity', opacity);
  };

  const setWireProgress = (u) => {
    const x2 = lerp(WIRE_X0, WIRE_X1, u);
    wires.forEach((w) => w.setAttribute('x2', x2));
  };

  // ── Static frame for reduced motion (also the print fallback) ──────
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setWireProgress(1);
    gates.forEach((g) => g.setAttribute('opacity', 1));
    payoff.setAttribute('opacity', 1);
    payoff.setAttribute('fill', GLOW_FILL);
    payoff.setAttribute('stroke', GLOW_EDGE);
    halo.setAttribute('opacity', 0.4);
    place(rejectTiles[0], 96, 218, 0.58, -24);
    place(rejectTiles[1], 130, 234, 0.58, 18);
    place(acceptTile, WIRE_X0 - 22, LENS.y, 1, 0, 0.78);
    return;
  }

  // ── Timeline: one cycle tells the whole story ───────────────────────
  // Go and the bandit fall at t0 = 0 and 2.4; close calls arrives at 4.8,
  // lands in the right panel at 6.9, then compiles.  The payoff glows before
  // the scene fades and loops.
  const T = 10.4, FALL = 1.1, EXIT = 1.0;
  const ACCEPT_T0 = 4.8, LAND = ACCEPT_T0 + FALL + EXIT;

  const tilePath = (g, tt, accepted) => {
    if (tt < 0 || tt > FALL + EXIT) { g.setAttribute('opacity', 0); return; }
    if (tt <= FALL) {
      const u = ease(tt / FALL);
      place(g, LENS.x, lerp(-16, LENS.y, u), Math.min(1, tt * 4), 0);
      return;
    }
    const u = ease((tt - FALL) / EXIT);
    if (accepted) {
      place(g, lerp(LENS.x, WIRE_X0 + 8, u), LENS.y,
        1 - Math.max(0, u - 0.85) / 0.15, 0, lerp(1, 0.7, u));
    } else {
      place(g, lerp(LENS.x, SIGN.x + 10, u), lerp(LENS.y, SIGN.y - 18, u),
        1 - u, -70 * u);
    }
  };

  const start = performance.now();
  const frame = (now) => {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    const tt = ((now - start) / 1000) % T;

    rejectTiles.forEach((g, i) => tilePath(g, tt - i * 2.4, false));
    tilePath(acceptTile, tt - ACCEPT_T0, true);

    const fade = tt > T - 0.5 ? (T - tt) / 0.5 : 1;
    circuit.setAttribute('opacity', fade);

    setWireProgress(ease(clamp01((tt - LAND) / 0.75)));
    payoff.setAttribute('opacity', clamp01((tt - (LAND + 0.75)) / 0.2));
    gates.forEach((g, k) => {
      g.setAttribute('opacity', tt > LAND + 0.85 + k * 0.24 ? 1 : 0);
    });

    if (tt > LAND + 2.15) {
      const pulse = 0.5 + 0.5 * Math.sin((tt - LAND - 2.15) * 3);
      halo.setAttribute('opacity', 0.25 + 0.45 * pulse);
      halo.setAttribute('r', 11 + 4 * pulse);
      payoff.setAttribute('fill', GLOW_FILL);
      payoff.setAttribute('stroke', GLOW_EDGE);
    } else {
      halo.setAttribute('opacity', 0);
      payoff.setAttribute('fill', '#f0f0f0');
      payoff.setAttribute('stroke', WIRE);
    }
  };
  requestAnimationFrame(frame);
})();
