// classical-rate.js -- slide 11's anchor: the dartboard rounds.
//
// Darts thwack into a board in three rounds: 100, then 300 more (total 400),
// then 1,200 more (total 1,600), the fire rate visibly ramping each round.
// Every dart scatters around the bull with the same spread; what shrinks is
// the GROUPING: the crosshair at the centroid of all hits steadies, and the
// circle around it (proportional to the standard error of the mean, scaled
// for visibility) halves per round while the dart count quadruples.  "x4"
// and "1/2" pop together during each between-rounds rest.  Presenter
// controlled from the console panel, which is also the launcher; the deck
// opens paused with an empty board.  Deterministic seeded scatter, no
// runtime randomness; reduced motion renders the final frame.
(function () {
  const svg = document.getElementById('classical-rate-fig');
  if (!svg) return;

  const ns = 'http://www.w3.org/2000/svg';
  const INK = '#2d3140';
  const RULE = '#bbb';
  const DIM = '#888';
  const ACCENT = '#456AAD';
  const GLOW_EDGE = '#D95032';
  const PAPER = '#faf8f4';        // the deck's --bg, for haloing text over darts

  const BOARD = { x: 490, y: 150, r: 118 };
  const SIGMA = 55;                  // scatter of a single dart, px
  const GROUP_C = 360;               // grouping radius = GROUP_C / sqrt(n)
  const PANEL = { x: 60, y: 254, w: 190, h: 52 };
  const LAUNCH = { x: PANEL.x + PANEL.w - 10, y: PANEL.y + 10 };
  const FLIGHT = 0.18;

  // Rounds: start, duration, cumulative darts at end.
  const T0 = 0.8;
  const ROUNDS = [
    { t: T0, dur: 6.0, upto: 100 },
    { t: T0 + 7.5, dur: 7.0, upto: 400 },
    { t: T0 + 16.0, dur: 8.0, upto: 1600 }
  ];
  const T_DONE = ROUNDS[2].t + ROUNDS[2].dur;
  const T = T_DONE + 3.0;
  const N = 1600;

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

  // ── Deterministic scatter: seeded LCG, gaussian-ish via sum of four ──
  let seed = 42;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const gauss = () => ((rnd() + rnd() + rnd() + rnd()) - 2) / 0.5774;
  const HITS = [];
  for (let j = 0; j < N; j++) {
    let dx = gauss() * SIGMA, dy = gauss() * SIGMA;
    const d = Math.hypot(dx, dy), max = BOARD.r - 10;
    if (d > max) { dx *= max / d; dy *= max / d; }
    HITS.push({ x: BOARD.x + dx, y: BOARD.y + dy });
  }
  // Prefix means for the honest centroid, and each dart's landing time.
  const MEANX = [], MEANY = [], LANDT = [];
  let sx = 0, sy = 0;
  HITS.forEach((h, j) => {
    sx += h.x; sy += h.y;
    MEANX[j] = sx / (j + 1); MEANY[j] = sy / (j + 1);
  });
  ROUNDS.forEach((r, i) => {
    const base = i === 0 ? 0 : ROUNDS[i - 1].upto;
    for (let j = base; j < r.upto; j++) {
      LANDT[j] = r.t + ((j - base) / (r.upto - base)) * r.dur;
    }
  });

  // ── The board ───────────────────────────────────────────────────────
  [BOARD.r, 88, 58, 28].forEach((r, i) => el('circle', {
    cx: BOARD.x, cy: BOARD.y, r,
    fill: i === 0 ? '#fafafa' : 'none', stroke: i === 0 ? '#999' : '#e2e2e2',
    'stroke-width': i === 0 ? 2 : 1.5
  }));
  el('circle', { cx: BOARD.x, cy: BOARD.y, r: 4, fill: GLOW_EDGE });

  // Landed hits, pre-created and revealed by count.
  const hitsG = el('g', {});
  const hitEls = HITS.map((h) => el('circle', {
    cx: h.x, cy: h.y, r: 2.2, fill: INK, 'fill-opacity': 0.55, opacity: 0
  }, hitsG));

  // Small pools for flights and impact flashes.
  const sprites = Array.from({ length: 16 }, () => el('line', {
    x1: 0, y1: 0, x2: 0, y2: 0, stroke: INK, 'stroke-width': 2,
    'stroke-linecap': 'round', opacity: 0 }));
  const flashes = Array.from({ length: 8 }, () => el('circle', {
    cx: 0, cy: 0, r: 4, fill: 'none', stroke: GLOW_EDGE,
    'stroke-width': 1.5, opacity: 0 }));

  // The estimate: centroid crosshair and grouping circle.
  const group = el('circle', { cx: BOARD.x, cy: BOARD.y, r: 0,
    fill: ACCENT, 'fill-opacity': 0.1, stroke: ACCENT,
    'stroke-width': 1.5, opacity: 0 });
  const chH = el('line', { stroke: ACCENT, 'stroke-width': 2,
    'stroke-linecap': 'round', opacity: 0 });
  const chV = el('line', { stroke: ACCENT, 'stroke-width': 2,
    'stroke-linecap': 'round', opacity: 0 });
  /* The equation's letters, put on the things they name.  The circle is the
     error the equation calls epsilon, so the label rides on its edge and
     moves with it; the console counts the calls the equation calls M. */
  const epsLabel = text('\u03b5', BOARD.x, BOARD.y, 20, ACCENT, 'start', 700);
  epsLabel.setAttribute('font-style', 'italic');
  /* It always lands on top of the darts, so it carries the paper colour as an
     outline and paints that behind the glyph. */
  epsLabel.setAttribute('stroke', PAPER);
  epsLabel.setAttribute('stroke-width', 3.5);
  epsLabel.setAttribute('paint-order', 'stroke');
  epsLabel.setAttribute('opacity', 0);

  // ── The console: launcher, counter, play control ────────────────────
  el('rect', { x: PANEL.x + 4, y: PANEL.y + 5, width: PANEL.w,
    height: PANEL.h, rx: 9, fill: '#000', opacity: 0.08 });
  el('rect', { x: PANEL.x, y: PANEL.y, width: PANEL.w, height: PANEL.h,
    rx: 9, fill: INK });
  const digits = text('0', PANEL.x + PANEL.w - 14, PANEL.y + 33, 20,
    '#f0f0f0', 'end', 700);
  digits.setAttribute('font-family',
    "'Ubuntu Mono', ui-monospace, Menlo, monospace");
  const mLabel = text('M', PANEL.x + 58, PANEL.y + 33, 16, '#f0f0f0', 'start', 700);
  mLabel.setAttribute('font-style', 'italic');
  mLabel.setAttribute('opacity', 0.62);
  text('darts', PANEL.x + PANEL.w / 2 + 22, PANEL.y + PANEL.h + 18, 13);
  const pop4 = text('M ×4', PANEL.x + PANEL.w - 14, PANEL.y - 10, 20,
    GLOW_EDGE, 'end', 700);
  pop4.setAttribute('opacity', 0);
  const pop2 = text('ε ÷2', BOARD.x - BOARD.r - 18, BOARD.y - 60, 20,
    ACCENT, 'end', 700);
  pop2.setAttribute('opacity', 0);

  const CX = PANEL.x + 26, CY = PANEL.y + PANEL.h / 2;
  const control = el('g', { class: 'cr-play no-nav', cursor: 'pointer',
    role: 'button', 'aria-label': 'play' });
  el('circle', { cx: CX, cy: CY, r: 17, fill: '#fff', opacity: 0.14 }, control);
  el('circle', { cx: CX, cy: CY, r: 17, fill: 'none', stroke: '#fff',
    opacity: 0.4, 'stroke-width': 1.5 }, control);
  const glyph = el('g', { fill: '#f0f0f0' }, control);
  let playing = false;

  // Cumulative darts landed by time t (linear within each round).
  const countAt = (t) => {
    let n = 0;
    ROUNDS.forEach((r, i) => {
      if (t <= r.t) return;
      const base = i === 0 ? 0 : ROUNDS[i - 1].upto;
      n = t >= r.t + r.dur ? r.upto
        : Math.floor(lerp(base, r.upto, (t - r.t) / r.dur));
    });
    return n;
  };

  const setState = (t) => {
    const n = countAt(t);
    digits.textContent = n.toLocaleString('en-US');

    hitEls.forEach((h, j) => h.setAttribute('opacity', j < n ? 1 : 0));

    // Flights: darts landing within the next FLIGHT seconds, drawn as short
    // streaks from the launcher.
    const ahead = Math.min(countAt(t + FLIGHT), N);
    sprites.forEach((s, i) => {
      const j = n + i;
      if (j >= ahead) { s.setAttribute('opacity', 0); return; }
      const u = clamp01((t - (LANDT[j] - FLIGHT)) / FLIGHT);
      const ub = Math.max(0, u - 0.07);
      const arc = (w) => -30 * 4 * w * (1 - w);
      const hx = HITS[j].x, hy = HITS[j].y;
      s.setAttribute('x1', lerp(LAUNCH.x, hx, ub));
      s.setAttribute('y1', lerp(LAUNCH.y, hy, ub) + arc(ub));
      s.setAttribute('x2', lerp(LAUNCH.x, hx, u));
      s.setAttribute('y2', lerp(LAUNCH.y, hy, u) + arc(u));
      s.setAttribute('opacity', 0.8);
    });

    // Impact flashes on the freshest landings.
    const fresh = n - countAt(t - 0.15);
    flashes.forEach((f, i) => {
      if (i >= Math.min(fresh, flashes.length) || n - 1 - i < 0) {
        f.setAttribute('opacity', 0);
        return;
      }
      const h = HITS[n - 1 - i];
      f.setAttribute('cx', h.x);
      f.setAttribute('cy', h.y);
      f.setAttribute('r', 4 + i * 1.5);
      f.setAttribute('opacity', 0.5 - i * 0.06);
    });

    // The estimate: honest centroid; grouping circle halves per round.
    if (n > 0) {
      const mx = MEANX[n - 1], my = MEANY[n - 1];
      const r = Math.min(80, GROUP_C / Math.sqrt(n));
      group.setAttribute('cx', mx);
      group.setAttribute('cy', my);
      group.setAttribute('r', r);
      group.setAttribute('opacity', 1);
      chH.setAttribute('x1', mx - 12); chH.setAttribute('x2', mx + 12);
      chH.setAttribute('y1', my); chH.setAttribute('y2', my);
      chV.setAttribute('x1', mx); chV.setAttribute('x2', mx);
      chV.setAttribute('y1', my - 12); chV.setAttribute('y2', my + 12);
      chH.setAttribute('opacity', 1);
      chV.setAttribute('opacity', 1);
      epsLabel.setAttribute('x', mx + r + 10);
      epsLabel.setAttribute('y', my - r - 8);
      epsLabel.setAttribute('opacity', 1);
    } else {
      group.setAttribute('opacity', 0);
      chH.setAttribute('opacity', 0);
      chV.setAttribute('opacity', 0);
      epsLabel.setAttribute('opacity', 0);
    }

    // The trade, popped during each between-rounds rest and at the end.
    let pop = 0;
    ROUNDS.forEach((r) => {
      const tEnd = r.t + r.dur;
      if (t > tEnd && t < tEnd + 1.4) {
        pop = Math.max(pop, Math.sin(Math.PI * (t - tEnd) / 1.4));
      }
    });
    pop4.setAttribute('opacity', pop);
    pop2.setAttribute('opacity', pop);
  };

  // ── Static frame for reduced motion (also the print fallback) ──────
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setState(T_DONE + 0.7);
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
    setState(Math.min(tt, T_DONE + 0.7));
  };
  requestAnimationFrame(frame);
})();
