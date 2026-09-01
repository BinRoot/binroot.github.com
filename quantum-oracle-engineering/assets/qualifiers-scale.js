// qualifiers-scale.js -- slide 13's beam balance, count against count.
//
// Left pan: 1,600 samples pour in as a heap of tiny grains, each cheap.
// Right pan: 40 circuit chips stack up, each one a whole coherent rollout on
// error-corrected hardware.  The beam tips left under the heap, then
// recovers chip by chip and settles hovering near level under a "?":
// fewer-but-heavier against many-but-light, and the per-chip weight is
// unknown until the wall-clock test.  The counts speak for themselves; the
// fault-tolerant scoping is a static asterisk footnote under the query
// count.  Fixed timeline; reduced motion renders the settled frame.
(function () {
  const svg = document.getElementById('qualifiers-fig');
  if (!svg) return;

  const ns = 'http://www.w3.org/2000/svg';
  const INK = '#2d3140';
  const RULE = '#bbb';
  const DIM = '#888';
  const WIRE = '#8a90a0';
  const ACCENT = '#456AAD';
  const GRAY = '#9aa0a8';

  const PIVOT = { x: 380, y: 84 };
  const L = 170;              // beam half-length
  const DROP = 66;            // chain length from beam end to pan
  const T = 11.0;
  const POUR0 = 0.8, POUR1 = 2.4;     // grains pour
  const STACK0 = 3.0, STACK1 = 6.4;   // chips stack
  const T_HOLD = 10.3;

  const el = (name, attrs, parent) => {
    const node = document.createElementNS(ns, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    (parent || svg).appendChild(node);
    return node;
  };
  const text = (s, x, y, size, fill, anchor, weight, parent) => {
    const t = el('text', {
      x, y, 'text-anchor': anchor || 'middle', fill: fill || DIM,
      'font-size': size, 'font-weight': weight || 400,
      'font-family': "'Ubuntu', sans-serif"
    }, parent);
    t.textContent = s;
    return t;
  };
  const lerp = (a, b, u) => a + (b - a) * u;
  const clamp01 = (u) => Math.max(0, Math.min(1, u));
  const ease = (u) => u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;

  // ── The stand ───────────────────────────────────────────────────────
  el('path', { d: `M ${PIVOT.x - 44} 288 h 88 l -14 -14 h -60 z`,
    fill: '#e2e4e8', stroke: RULE, 'stroke-width': 1.5 });
  el('rect', { x: PIVOT.x - 5, y: PIVOT.y, width: 10, height: 190,
    fill: '#d5d8dd', stroke: RULE, 'stroke-width': 1.2 });

  // ── The pans ────────────────────────────────────────────────────────
  const mkPan = () => {
    const g = el('g', {});
    el('line', { x1: 0, y1: 0, x2: -26, y2: DROP, stroke: WIRE,
      'stroke-width': 1.5 }, g);
    el('line', { x1: 0, y1: 0, x2: 26, y2: DROP, stroke: WIRE,
      'stroke-width': 1.5 }, g);
    el('path', { d: `M -32 ${DROP} Q 0 ${DROP + 18} 32 ${DROP}`,
      fill: '#f0f0f0', stroke: GRAY, 'stroke-width': 2 }, g);
    return g;
  };
  const panL = mkPan();
  const panR = mkPan();

  // The heap: a mound of tiny grains in the left pan (a heap standing in
  // for 1,600; the caption carries the true count).
  const GRAINS = 72;
  const grainEls = [];
  (() => {
    const rows = [14, 13, 12, 10, 8, 6, 4, 3, 2];
    let k = 0;
    rows.forEach((count, row) => {
      for (let i = 0; i < count && k < GRAINS; i++, k++) {
        const x = (i - (count - 1) / 2) * 4.6;
        const y = DROP + 6 - row * 4.2;
        grainEls.push(el('circle', { cx: x, cy: y, r: 2.2,
          fill: GRAY, opacity: 0 }, panL));
      }
    });
  })();

  // The chips: 40 stacked circuit tiles in the right pan.
  const CHIPS = 40, PER_ROW = 5;
  const chipEls = [];
  for (let k = 0; k < CHIPS; k++) {
    const row = Math.floor(k / PER_ROW), col = k % PER_ROW;
    const x = (col - (PER_ROW - 1) / 2) * 12.4;
    const y = DROP + 2 - row * 7.6;
    const g = el('g', { opacity: 0 }, panR);
    el('rect', { x: x - 5.5, y: y - 6.4, width: 11, height: 6.4, rx: 1.5,
      fill: '#fff', stroke: INK, 'stroke-width': 1 }, g);
    el('line', { x1: x - 3, y1: y - 3.2, x2: x + 3, y2: y - 3.2,
      stroke: ACCENT, 'stroke-width': 1 }, g);
    chipEls.push(g);
  }

  // ── The beam and pointer ────────────────────────────────────────────
  const beam = el('g', {});
  el('rect', { x: PIVOT.x - L - 8, y: PIVOT.y - 4, width: 2 * L + 16,
    height: 8, rx: 4, fill: INK }, beam);
  el('path', { d: `M ${PIVOT.x - 7} ${PIVOT.y - 6} L ${PIVOT.x} ` +
    `${PIVOT.y - 26} L ${PIVOT.x + 7} ${PIVOT.y - 6} z`,
    fill: ACCENT }, beam);
  el('circle', { cx: PIVOT.x, cy: PIVOT.y, r: 7, fill: '#f0f0f0',
    stroke: INK, 'stroke-width': 2 });

  // Falling sprites: grains streaming, chips flying in.
  const fallGrains = [0, 1, 2, 3].map(() => el('circle', {
    cx: 0, cy: 0, r: 2.2, fill: GRAY, opacity: 0 }));
  const fallChip = el('rect', { x: 0, y: 0, width: 11, height: 6.4,
    rx: 1.5, fill: '#fff', stroke: INK, 'stroke-width': 1, opacity: 0 });

  const mark = text('?', PIVOT.x, 44, 26, DIM, 'middle', 700);
  mark.setAttribute('opacity', 0);

  // Captions.
  text('1,600 samples', PIVOT.x - L, 302, 13, DIM, 'middle', 600);
  text('40 queries*', PIVOT.x + L, 302, 13, DIM, 'middle', 600);
  text('* fault-tolerant era', PIVOT.x + L, 318, 11, DIM, 'middle', 400);

  // Beam angle: tips left as the heap pours, recovers chip by chip toward
  // a hover, with small decaying wobbles at each phase boundary.
  const theta = (t) => {
    const pour = ease(clamp01((t - POUR0) / (POUR1 - POUR0)));
    const stack = ease(clamp01((t - STACK0) / (STACK1 - STACK0)));
    let th = lerp(0, -0.2, pour) + lerp(0, 0.23, stack);
    const wob = (t0, amp) => t > t0
      ? amp * Math.exp(-2.2 * (t - t0)) * Math.cos(7 * (t - t0)) : 0;
    th += wob(POUR1, -0.04) + wob(STACK1, 0.035);
    const swayIn = clamp01((t - STACK1 - 1.0) / 1.0);
    return th + swayIn * 0.012 * Math.sin(0.9 * t * Math.PI);
  };

  const setState = (t) => {
    const th = theta(t);
    beam.setAttribute('transform',
      'rotate(' + (th * 180 / Math.PI) + ' ' + PIVOT.x + ' ' + PIVOT.y + ')');
    const ex = L * Math.cos(th), ey = L * Math.sin(th);
    const lx = PIVOT.x - ex, ly = PIVOT.y - ey;
    const rx = PIVOT.x + ex, ry = PIVOT.y + ey;
    panL.setAttribute('transform', 'translate(' + lx + ',' + ly + ')');
    panR.setAttribute('transform', 'translate(' + rx + ',' + ry + ')');

    // Grains reveal with the pour; a thin falling stream sells it.
    const pour = clamp01((t - POUR0) / (POUR1 - POUR0));
    grainEls.forEach((g, k) => {
      g.setAttribute('opacity', k < pour * GRAINS ? 1 : 0);
    });
    fallGrains.forEach((f, i) => {
      const on = t > POUR0 && pour < 1;
      if (!on) { f.setAttribute('opacity', 0); return; }
      const u = ((t * 2.1 + i * 0.25) % 0.5) / 0.5;
      f.setAttribute('cx', lx + (i - 1.5) * 3);
      f.setAttribute('cy', lerp(-20, ly + DROP - 12, u * u));
      f.setAttribute('opacity', 0.8);
    });

    // Chips stack one at a time; one sprite flies each arrival.
    const stack = clamp01((t - STACK0) / (STACK1 - STACK0));
    const nChips = Math.floor(stack * CHIPS);
    chipEls.forEach((c, k) => c.setAttribute('opacity', k < nChips ? 1 : 0));
    if (t > STACK0 && stack < 1) {
      const u = (stack * CHIPS) % 1;
      const row = Math.floor(nChips / PER_ROW);
      fallChip.setAttribute('opacity', 0.9);
      fallChip.setAttribute('x', lerp(740, rx - 5.5, ease(u)));
      fallChip.setAttribute('y',
        lerp(30, ry + DROP - 4 - row * 7.6, ease(u)));
    } else {
      fallChip.setAttribute('opacity', 0);
    }

    mark.setAttribute('opacity', clamp01((t - STACK1 - 1.4) / 0.5));
  };

  // ── Static frame for reduced motion (also the print fallback) ──────
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setState(T_HOLD - 0.5);
    return;
  }

  const start = performance.now();
  const frame = (now) => {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    const tt = ((now - start) / 1000) % T;
    svg.setAttribute('opacity', tt > T - 0.5 ? (T - tt) / 0.5 : 1);
    setState(Math.min(tt, T_HOLD));
  };
  requestAnimationFrame(frame);
})();
