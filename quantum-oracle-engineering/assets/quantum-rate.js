// quantum-rate.js -- slide 12's anchor: the rematch.
//
// Left, titled "classical": slide 11's outcome, ghosted: the same seeded
// 1,600-dart scatter with its 9px grouping circle.  The receipt.
// Right, titled "quantum": nothing lands during querying.  Translucent
// superposition layers drift over the board while the console counts to 40
// queries, and a DASHED bound circle centered on the board tightens as 1/m
// with the count: the precision being purchased, before any estimate exists.
// At 40 the shimmer collapses, one dart thunks in beside the bull, and the
// bound snaps onto it as a solid circle with a crosshair: M coherent
// queries, one measurement, delivered inside the purchased precision.
// Three payoff rows then fade in between the boards.  Presenter controlled;
// opens paused.  Deterministic; reduced motion renders the final frame.
(function () {
  const svg = document.getElementById('quantum-rate-fig');
  if (!svg) return;

  const ns = 'http://www.w3.org/2000/svg';
  const INK = '#2d3140';
  const DIM = '#888';
  const ACCENT = '#456AAD';
  const GLOW_EDGE = '#D95032';

  const LB = { x: 185, y: 148, r: 100 };    // the classical receipt
  const QB = { x: 575, y: 148, r: 100 };    // the quantum board
  const SIGMA = 47;
  const PANEL = { x: 305, y: 254, w: 150, h: 48 };
  const LAUNCH = { x: PANEL.x + PANEL.w - 16, y: PANEL.y + 4 };
  const HIT = { x: QB.x + 3, y: QB.y - 2 }; // the one measurement
  const QUERIES = 40;

  // Timeline: shimmer + count 0.5-5.5, collapse to 5.9, thunk at 6.05,
  // circle by 6.8, rows 7.0-8.2, hold, fade, loop.
  const T_SHIMMER0 = 0.5, T_SHIMMER1 = 5.5, T_THUNK = 6.05;
  const T_ROWS = 7.0, T_HOLD = 12.0, T = 12.5;

  const el = (name, attrs, parent) => {
    const node = document.createElementNS(ns, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    (parent || svg).appendChild(node);
    return node;
  };
  const text = (s, x, y, size, fill, anchor, weight) => {
    const t = el('text', {
      x, y, 'text-anchor': anchor || 'middle', fill: fill || DIM,
      'font-size': size, 'font-weight': weight || 400,
      'font-family': "'Ubuntu', sans-serif"
    });
    t.textContent = s;
    return t;
  };
  const lerp = (a, b, u) => a + (b - a) * u;
  const clamp01 = (u) => Math.max(0, Math.min(1, u));
  const ease = (u) => u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;

  const board = (b) => {
    [b.r, b.r * 0.75, b.r * 0.49, b.r * 0.24].forEach((r, i) => el('circle', {
      cx: b.x, cy: b.y, r,
      fill: i === 0 ? '#fafafa' : 'none',
      stroke: i === 0 ? '#999' : '#e2e2e2',
      'stroke-width': i === 0 ? 2 : 1.5
    }));
    el('circle', { cx: b.x, cy: b.y, r: 4, fill: GLOW_EDGE });
  };

  // ── Titles: which side is which ─────────────────────────────────────
  text('classical', LB.x, 28, 15, DIM, 'middle', 600);
  text('quantum', QB.x, 28, 15, DIM, 'middle', 600);

  // ── The receipt: 1,600 ghosted hits and their 9px grouping ─────────
  board(LB);
  let seed = 42;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const gauss = () => ((rnd() + rnd() + rnd() + rnd()) - 2) / 0.5774;
  const ghost = el('g', { opacity: 0.5 });
  let msx = 0, msy = 0;
  for (let j = 0; j < 1600; j++) {
    let dx = gauss() * SIGMA, dy = gauss() * SIGMA;
    const d = Math.hypot(dx, dy), max = LB.r - 9;
    if (d > max) { dx *= max / d; dy *= max / d; }
    msx += LB.x + dx; msy += LB.y + dy;
    el('circle', { cx: LB.x + dx, cy: LB.y + dy, r: 2,
      fill: INK, 'fill-opacity': 0.4 }, ghost);
  }
  const gx = msx / 1600, gy = msy / 1600;
  el('circle', { cx: gx, cy: gy, r: 9, fill: 'none', stroke: ACCENT,
    'stroke-width': 1.5, opacity: 0.85 });
  el('line', { x1: gx - 8, y1: gy, x2: gx + 8, y2: gy, stroke: ACCENT,
    'stroke-width': 1.5, opacity: 0.85 });
  el('line', { x1: gx, y1: gy - 8, x2: gx, y2: gy + 8, stroke: ACCENT,
    'stroke-width': 1.5, opacity: 0.85 });
  text('1,600 darts', LB.x, LB.y + LB.r + 26, 14, DIM, 'middle', 600);

  // ── The quantum board ───────────────────────────────────────────────
  board(QB);
  const layers = [0, 1, 2].map(() => el('circle', {
    cx: QB.x, cy: QB.y, r: QB.r - 4, fill: ACCENT, opacity: 0
  }));
  // The tightening bound: dashed, centered on the board, no estimate yet.
  const bound = el('circle', { cx: QB.x, cy: QB.y, r: QB.r - 6,
    fill: 'none', stroke: ACCENT, 'stroke-width': 1.5,
    'stroke-dasharray': '6,5', opacity: 0 });
  // The one measurement.
  const streak = el('line', { x1: 0, y1: 0, x2: 0, y2: 0, stroke: INK,
    'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0 });
  const hitDot = el('circle', { cx: HIT.x, cy: HIT.y, r: 3,
    fill: INK, opacity: 0 });
  const rings = [0, 1].map(() => el('circle', { cx: HIT.x, cy: HIT.y, r: 4,
    fill: 'none', stroke: GLOW_EDGE, 'stroke-width': 2, opacity: 0 }));
  const group = el('g', { opacity: 0 });
  el('circle', { cx: HIT.x, cy: HIT.y, r: 9, fill: ACCENT,
    'fill-opacity': 0.1, stroke: ACCENT, 'stroke-width': 1.5 }, group);
  el('line', { x1: HIT.x - 8, y1: HIT.y, x2: HIT.x + 8, y2: HIT.y,
    stroke: ACCENT, 'stroke-width': 1.5 }, group);
  el('line', { x1: HIT.x, y1: HIT.y - 8, x2: HIT.x, y2: HIT.y + 8,
    stroke: ACCENT, 'stroke-width': 1.5 }, group);
  const oneDart = text('one estimated win rate', QB.x, QB.y + QB.r + 26, 14, DIM,
    'middle', 600);
  oneDart.setAttribute('opacity', 0);

  // ── Payoff rows, between the boards ─────────────────────────────────
  const ROWS = [
    ['0.05:', '400 → 20'],
    ['10⁻³:', '10⁶ → 10³'],
    ['10⁻⁵:', '10¹⁰ → 10⁵']
  ];
  const rowEls = ROWS.map((r, i) => {
    const g = el('g', { opacity: 0 });
    const eps = el('text', { x: 345, y: 92 + i * 40, 'text-anchor': 'end',
      fill: DIM, 'font-size': 16, 'font-weight': 600,
      'font-family': "'Ubuntu', sans-serif" }, g);
    eps.textContent = r[0];
    const val = el('text', { x: 358, y: 92 + i * 40, 'text-anchor': 'start',
      fill: INK, 'font-size': 16, 'font-weight': 700,
      'font-family': "'Ubuntu', sans-serif" }, g);
    val.textContent = r[1];
    return g;
  });

  // ── Console: query counter and play control ─────────────────────────
  el('rect', { x: PANEL.x + 4, y: PANEL.y + 5, width: PANEL.w,
    height: PANEL.h, rx: 9, fill: '#000', opacity: 0.08 });
  el('rect', { x: PANEL.x, y: PANEL.y, width: PANEL.w, height: PANEL.h,
    rx: 9, fill: INK });
  const digits = text('0', PANEL.x + PANEL.w - 14, PANEL.y + 31, 20,
    '#f0f0f0', 'end', 700);
  digits.setAttribute('font-family',
    "'Ubuntu Mono', ui-monospace, Menlo, monospace");
  text('queries', PANEL.x + PANEL.w / 2 + 16, PANEL.y + PANEL.h + 18, 13);

  const CX = PANEL.x + 26, CY = PANEL.y + PANEL.h / 2;
  const control = el('g', { class: 'qr-play no-nav', cursor: 'pointer',
    role: 'button', 'aria-label': 'play' });
  el('circle', { cx: CX, cy: CY, r: 16, fill: '#fff', opacity: 0.14 }, control);
  el('circle', { cx: CX, cy: CY, r: 16, fill: 'none', stroke: '#fff',
    opacity: 0.4, 'stroke-width': 1.5 }, control);
  const glyph = el('g', { fill: '#f0f0f0' }, control);
  let playing = false;

  const setState = (t) => {
    // Queries tick while the shimmer runs; nothing lands.
    const qu = clamp01((t - T_SHIMMER0) / (T_SHIMMER1 - T_SHIMMER0));
    const m = QUERIES * ease(qu);
    digits.textContent = String(Math.round(m));

    // Shimmer layers drift, then collapse after the last query.
    const collapse = clamp01((t - T_SHIMMER1) / 0.4);
    layers.forEach((l, i) => {
      const on = t > T_SHIMMER0 && collapse < 1;
      const drift = (1 - collapse) * 9;
      const a = t * (0.9 + i * 0.35) + i * 2.1;
      l.setAttribute('cx', QB.x + drift * Math.cos(a));
      l.setAttribute('cy', QB.y + drift * Math.sin(a));
      l.setAttribute('opacity', on
        ? (0.1 + 0.05 * Math.sin(t * 2.2 + i)) * (1 - collapse) : 0);
    });

    // The bound tightens as 1/m while the queries run, then snaps onto the
    // measurement and goes solid (the group takes over).
    if (t > T_SHIMMER0 && t < T_THUNK) {
      const r = Math.min(QB.r - 6, 360 / Math.max(1, m));
      const snap = clamp01((t - T_SHIMMER1) / (T_THUNK - T_SHIMMER1));
      bound.setAttribute('cx', lerp(QB.x, HIT.x, snap));
      bound.setAttribute('cy', lerp(QB.y, HIT.y, snap));
      bound.setAttribute('r', Math.max(9, r));
      bound.setAttribute('opacity', 0.6);
    } else {
      bound.setAttribute('opacity', 0);
    }

    // The one dart: streak, thunk, rings, then the solid circle.
    const fu = clamp01((t - (T_THUNK - 0.15)) / 0.15);
    if (fu > 0 && fu < 1) {
      const ub = Math.max(0, fu - 0.12);
      streak.setAttribute('x1', lerp(LAUNCH.x, HIT.x, ub));
      streak.setAttribute('y1', lerp(LAUNCH.y, HIT.y, ub));
      streak.setAttribute('x2', lerp(LAUNCH.x, HIT.x, fu));
      streak.setAttribute('y2', lerp(LAUNCH.y, HIT.y, fu));
      streak.setAttribute('opacity', 0.9);
    } else {
      streak.setAttribute('opacity', 0);
    }
    hitDot.setAttribute('opacity', t >= T_THUNK ? 1 : 0);
    rings.forEach((r, i) => {
      const ru = clamp01((t - T_THUNK - i * 0.08) / 0.45);
      r.setAttribute('r', 4 + ru * 26);
      r.setAttribute('opacity', ru > 0 && ru < 1 ? 0.7 * (1 - ru) : 0);
    });
    group.setAttribute('opacity', clamp01((t - T_THUNK) / 0.3));
    oneDart.setAttribute('opacity', clamp01((t - T_THUNK - 0.3) / 0.4));

    // Payoff rows, one by one.
    rowEls.forEach((g, i) => {
      g.setAttribute('opacity', clamp01((t - T_ROWS - i * 0.4) / 0.4));
    });
  };

  // ── Static frame for reduced motion (also the print fallback) ──────
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setState(T_HOLD - 0.5);
    control.setAttribute('display', 'none');
    return;
  }

  const setIcon = () => {
    glyph.innerHTML = playing
      ? '<rect x="' + (CX - 6) + '" y="' + (CY - 8) +
        '" width="4.5" height="16" rx="1.5"/>' +
        '<rect x="' + (CX + 1.5) + '" y="' + (CY - 8) +
        '" width="4.5" height="16" rx="1.5"/>'
      : '<polygon points="' + (CX - 4.5) + ',' + (CY - 9) + ' ' +
        (CX + 10) + ',' + CY + ' ' + (CX - 4.5) + ',' + (CY + 9) + '"/>';
    control.setAttribute('aria-label', playing ? 'pause' : 'play');
    control.setAttribute('opacity', playing ? 0.55 : 1);
  };
  setIcon();
  control.addEventListener('click', () => {
    playing = !playing;
    setIcon();
  });

  let elapsed = 0;
  let last = performance.now();
  setState(0);
  const frame = (now) => {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (document.hidden || !playing) return;
    elapsed += dt;
    const tt = elapsed % T;
    svg.setAttribute('opacity', tt > T - 0.5 ? (T - tt) / 0.5 : 1);
    setState(Math.min(tt, T_HOLD - 0.5));
  };
  requestAnimationFrame(frame);
})();
