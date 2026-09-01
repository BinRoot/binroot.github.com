// estimate-box.js -- slide 14's classical side of the access comparison.
//
// An expectation lives inside a closed black box.  This figure shows
// classical sampling access; the equation above it contrasts that access with
// the coherent unitary and inverse required by amplitude estimation.  Balls
// pop from a round port on the box's face, fly a ballistic
// arc into a gray jar (0) or a blue jar (1), fall inside under gravity with
// a small bounce, and settle into a staggered pile.  The vertical gauge
// tracks the running mean, gliding smoothly, wrapped in a 95% Wilson
// interval that narrows as draws accumulate.  When the draws run out, the
// hidden truth line fades in beside the estimate.  Fixed timeline, no
// randomness at runtime; reduced motion renders the completed frame.
(function () {
  const svg = document.getElementById('estimate-box');
  if (!svg) return;

  const ns = 'http://www.w3.org/2000/svg';
  const INK = '#2d3140';
  const RULE = '#bbb';
  const DIM = '#888';
  const GRAY = '#9aa0a8';
  const ACCENT = '#456AAD';
  const GLOW_EDGE = '#D95032';

  // Designed outcome sequence: 21 blue of 30, running fraction 0.7 with an
  // unsteady start.
  const SEQ = [1, 0, 1, 1, 0, 0, 1, 1, 1, 0,
               1, 1, 0, 1, 1, 1, 0, 1, 1, 0,
               1, 1, 1, 0, 1, 1, 0, 1, 1, 1];
  const P_TRUE = 0.7;
  const BLUE_PREFIX = [];
  SEQ.reduce((acc, v, i) => (BLUE_PREFIX[i] = acc + v), 0);

  const BOX = { x: 240, y: 100, w: 120, h: 80 };
  // The hole is on TOP, centered: balls pop up and arc LEFT for a 0, RIGHT
  // for a 1, the way a lottery machine draws.
  const PORT = { x: BOX.x + BOX.w / 2, y: BOX.y - 2 };
  // Gray (0) to the box's LEFT, blue (1) to its RIGHT: the throw direction
  // is the outcome, and more blue means a taller right pile and a higher
  // gauge reading.
  const BINS = [
    { x: 150, top: 176 },   // gray, outcome 0
    { x: 450, top: 176 }    // blue, outcome 1
  ];
  const GAUGE = { x: 590, y0: 252, y1: 62, w: 26 };
  const T0 = 0.6, CADENCE = 0.35, FLIGHT = 0.8, TWEEN = 0.3;
  const ARC = 55;           // apex height above the launch-to-jar chord
  const LAST_LAND = T0 + (SEQ.length - 1) * CADENCE + FLIGHT;
  const REVEAL = LAST_LAND + 0.4;
  const T = REVEAL + 2.2;

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
  const lerp = (a, b, u) => a + (b - a) * u;
  const clamp01 = (u) => Math.max(0, Math.min(1, u));
  const ease = (u) => u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
  const py = (p) => lerp(GAUGE.y0, GAUGE.y1, p);

  // ── The sealed box and its port ─────────────────────────────────────
  el('rect', { x: BOX.x + 4, y: BOX.y + 6, width: BOX.w, height: BOX.h,
    rx: 10, fill: '#000', opacity: 0.08 });
  el('rect', { x: BOX.x, y: BOX.y, width: BOX.w, height: BOX.h, rx: 10,
    fill: INK });
  el('rect', { x: BOX.x + 8, y: BOX.y + 8, width: BOX.w - 16, height: 10,
    rx: 5, fill: '#fff', opacity: 0.06 });
  el('ellipse', { cx: PORT.x, cy: BOX.y, rx: 8, ry: 3.5, fill: '#3a3d45',
    stroke: '#565b66', 'stroke-width': 1.5 });

  // ── Jars ────────────────────────────────────────────────────────────
  BINS.forEach((b, v) => {
    el('path', {
      d: `M ${b.x - 24} ${b.top} v 74 h 48 v -74`,
      fill: 'none', stroke: RULE, 'stroke-width': 2,
      'stroke-linejoin': 'round'
    });
    text(String(v), b.x, b.top + 92, 14);
  });

  // Staggered pile packing: rows alternate four and three balls, like shot
  // in a jar.
  const pilePos = (bin, k) => {
    let row = 0, left = k;
    for (;;) {
      const cap = row % 2 === 0 ? 4 : 3;
      if (left < cap) {
        const xs = row % 2 === 0 ? [-18, -6, 6, 18] : [-12, 0, 12];
        return { x: bin.x + xs[left], y: bin.top + 68 - row * 10 };
      }
      left -= cap;
      row++;
    }
  };
  const balls = SEQ.map((v) => el('circle', {
    cx: 0, cy: 0, r: 5, fill: v ? ACCENT : GRAY, opacity: 0 }));

  // ── The gauge: a vertical scale, 0 at the bottom, 1 at the top ──────
  el('line', { x1: GAUGE.x, y1: GAUGE.y0, x2: GAUGE.x, y2: GAUGE.y1,
    stroke: RULE, 'stroke-width': 2 });
  [[GAUGE.y0, '0'], [GAUGE.y1, '1']].forEach(([y, s]) => {
    el('line', { x1: GAUGE.x - 5, y1: y, x2: GAUGE.x + 5, y2: y,
      stroke: RULE, 'stroke-width': 2 });
    text(s, GAUGE.x + 22, y + 4, 13);
  });
  const band = el('rect', { x: GAUGE.x - GAUGE.w / 2, y: py(0), width: GAUGE.w,
    height: 0, rx: 4, fill: ACCENT, opacity: 0.18 });
  const marker = el('line', { x1: GAUGE.x - 16, y1: py(0),
    x2: GAUGE.x + 16, y2: py(0),
    stroke: INK, 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0 });
  const truth = el('line', { x1: GAUGE.x - 24, y1: py(P_TRUE),
    x2: GAUGE.x + 24, y2: py(P_TRUE), stroke: GLOW_EDGE, 'stroke-width': 2,
    'stroke-dasharray': '4,3', opacity: 0 });

  // A small pool of dots: flights overlap because a throw outlives the
  // cadence.
  const pool = [0, 1, 2].map(() => el('circle', {
    cx: 0, cy: 0, r: 5, opacity: 0 }));

  // 95% Wilson score interval: honest uncertainty that stays sane at small
  // n and at estimates of 0 or 1.
  const wilson = (n) => {
    if (n === 0) return null;
    const p = BLUE_PREFIX[n - 1] / n;
    const z = 1.96, z2 = z * z;
    const denom = 1 + z2 / n;
    const center = (p + z2 / (2 * n)) / denom;
    const half = (z / denom) * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n));
    return { est: p, lo: Math.max(0, center - half),
             hi: Math.min(1, center + half) };
  };

  // One throw: ballistic arc to the jar mouth, gravity fall inside, one
  // small bounce, rest.
  const throwPath = (k, u) => {
    const v = SEQ[k];
    const bin = BINS[v];
    const rest = pilePos(bin, v ? BLUE_PREFIX[k] - 1
                                : (k + 1) - BLUE_PREFIX[k] - 1);
    if (u < 0.55) {
      const w = u / 0.55;                      // constant horizontal speed
      const x = lerp(PORT.x, bin.x, w);
      // A parabola whose takeoff is steeply upward out of the hole.
      const y = lerp(PORT.y, bin.top - 8, w) - ARC * 4 * w * (1 - w);
      return { x, y };
    }
    const w = (u - 0.55) / 0.45;
    const x = lerp(bin.x, rest.x, Math.min(1, w * 1.6));
    if (w < 0.7) {
      const f = (w / 0.7) * (w / 0.7);         // gravity: accelerating fall
      return { x, y: lerp(bin.top - 8, rest.y, f) };
    }
    const b = (w - 0.7) / 0.3;                 // one damped bounce
    return { x, y: rest.y - 6 * Math.sin(Math.PI * b) * (1 - b) };
  };

  const setState = (t) => {
    // Landed count plus every throw currently in the air.
    let landed = 0;
    const flights = [];
    for (let k = 0; k < SEQ.length; k++) {
      const tk = T0 + k * CADENCE;
      if (t >= tk + FLIGHT) landed = k + 1;
      else if (t >= tk) flights.push({ k, u: (t - tk) / FLIGHT });
      else break;
    }

    // Settled piles.
    let nb = 0, ng = 0;
    SEQ.forEach((v, k) => {
      const ball = balls[k];
      if (k < landed) {
        const pos = v ? pilePos(BINS[1], nb++) : pilePos(BINS[0], ng++);
        ball.setAttribute('cx', pos.x);
        ball.setAttribute('cy', pos.y);
        ball.setAttribute('opacity', 1);
      } else {
        ball.setAttribute('opacity', 0);
      }
    });

    // Throws in the air.
    pool.forEach((d) => d.setAttribute('opacity', 0));
    flights.forEach((f, i) => {
      const d = pool[i % pool.length];
      const pos = throwPath(f.k, f.u);
      d.setAttribute('opacity', 1);
      d.setAttribute('fill', SEQ[f.k] ? ACCENT : GRAY);
      d.setAttribute('cx', pos.x);
      d.setAttribute('cy', pos.y);
    });

    // Gauge: glide smoothly from the previous estimate to the current one
    // over TWEEN seconds after each landing.
    if (landed > 0) {
      const cur = wilson(landed);
      const prev = wilson(landed - 1) || cur;
      const tLand = T0 + (landed - 1) * CADENCE + FLIGHT;
      const w = ease(clamp01((t - tLand) / TWEEN));
      const est = lerp(prev.est, cur.est, w);
      const lo = lerp(prev.lo, cur.lo, w);
      const hi = lerp(prev.hi, cur.hi, w);
      marker.setAttribute('opacity', Math.min(1, (t - T0 - FLIGHT) * 3));
      marker.setAttribute('y1', py(est));
      marker.setAttribute('y2', py(est));
      band.setAttribute('y', py(hi));
      band.setAttribute('height', Math.max(0, py(lo) - py(hi)));
    } else {
      marker.setAttribute('opacity', 0);
      band.setAttribute('height', 0);
    }

    // The reveal: truth was there all along.
    truth.setAttribute('opacity',
      clamp01((t - REVEAL) / 0.5) * (0.7 + 0.3 * Math.sin(t * 4)));
  };

  // ── Play/pause, drawn on the machine itself ─────────────────────────
  // The switch is on the box: press the machine and it starts drawing.
  // The no-nav class keeps taps on it from flipping the slide.
  const CX = BOX.x + BOX.w / 2, CY = BOX.y + BOX.h / 2;
  const control = el('g', { class: 'eb-play no-nav', cursor: 'pointer',
    role: 'button', 'aria-label': 'play' });
  el('circle', { cx: CX, cy: CY, r: 22, fill: '#fff', opacity: 0.14 }, control);
  el('circle', { cx: CX, cy: CY, r: 22, fill: 'none', stroke: '#fff',
    opacity: 0.4, 'stroke-width': 1.5 }, control);
  const glyph = el('g', { fill: '#f0f0f0' }, control);
  let playing = false;

  // ── Static frame for reduced motion (also the print fallback) ──────
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setState(REVEAL + 0.8);
    control.setAttribute('display', 'none');
    return;
  }

  const setIcon = () => {
    glyph.innerHTML = playing
      ? '<rect x="' + (CX - 8) + '" y="' + (CY - 10) +
        '" width="6" height="20" rx="1.5"/>' +
        '<rect x="' + (CX + 2) + '" y="' + (CY - 10) +
        '" width="6" height="20" rx="1.5"/>'
      : '<polygon points="' + (CX - 6) + ',' + (CY - 11) + ' ' +
        (CX + 13) + ',' + CY + ' ' + (CX - 6) + ',' + (CY + 11) + '"/>';
    control.setAttribute('aria-label', playing ? 'pause' : 'play');
    control.setAttribute('opacity', playing ? 0.55 : 1);
  };
  setIcon();
  control.addEventListener('click', () => {
    playing = !playing;
    setIcon();
  });

  // The clock only advances while playing, so pause freezes the frame and
  // the deck opens on the untouched starting state.
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
    setState(Math.min(tt, REVEAL + 1.2));
  };
  requestAnimationFrame(frame);
})();
