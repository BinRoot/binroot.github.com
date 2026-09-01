// scoreboard.js -- slide 16: two hourglasses.
//
// Left, classical: a glass packed with fine grains draining through a WIDE
// waist in a torrent.  Right, the one-query-lane quantum baseline priced in
// this lesson: six boulders and a single NARROW waist, squeezing through one
// at a time.  The right glass holds far less material and still runs long
// after the left one is dry at this operating point.
//
// The picture carries all three factors behind the claim without a counter:
//   fewer items          -> six boulders against a mountain of grains
//   each item costs more -> boulders are big and slow through the waist
//   one coherent lane    -> one narrow waist, strictly single file, while the
//                           classical baseline uses many ordinary cores
// The finishing times are 2:1, which is the chapter's 8.3 minutes against
// 17 minutes at a 10^-4 gap.
//
// The single file is an architecture choice, not a universal lower bound.
// Parallel amplitude-estimation constructions trade coherent depth for
// entangled width, connectivity, and memory.  This slide prices the simple
// one-lane baseline so its assumptions stay auditable.  The assumptions
// behind the 2:1 ratio (a 10^-4 gap, 5 ms per rollout, 1,000 classical cores,
// 10 ms per oracle pass, and C=10) are spoken, not printed.
//
// Drawing rules this file learned the hard way: contents go BETWEEN the
// glass fill and the glass outline (paint the fill, then the sand, then
// stroke the silhouette on top), and everything inside is clipped to the
// bulb it lives in, or it spills through the walls.
//
// Runs once per arrival, replay button; reduced motion renders the final
// frame.
(function () {
  const svg = document.getElementById('scoreboard-fig');
  if (!svg) return;

  const ns = 'http://www.w3.org/2000/svg';
  const INK = '#2d3140';
  const RULE = '#bbb';
  const DIM = '#888';
  const FAINT = '#a9aeb6';
  const GRAY = '#9aa0a8';
  const ACCENT = '#456AAD';
  const ACCENT_DK = '#2c4573';
  const GREEN = '#4D8C55';
  const GLASS_LINE = '#aeb4bd';

  // Matched vessels: same rim, same height, same shoulders.  Only the
  // throat differs because this figure compares many classical cores with
  // the lesson's one-coherent-lane baseline.  A wider quantum architecture
  // needs a different figure and a width-depth resource model.  The shoulder
  // control points are constants so the bodies coincide and only the last
  // stretch into the waist diverges.
  const CY = 148, W = 68, H = 84, SHOULDER = 28;
  const GL = { cx: 240, cy: CY, id: 'cl', nw: 15 };   // many at once
  const GQ = { cx: 570, cy: CY, id: 'qu', nw: 5 };    // one at a time

  const T0 = 0.6, DRAIN = 3.7;
  const QDUR = 1.0, QSTEP = 1.28, NB = 6;
  const Q_DONE = T0 + (NB - 1) * QSTEP + QDUR;
  const T_END = Q_DONE + 1.2;

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

  // Curved bulbs: flat rim, shoulder curving in to the waist.
  const upperD = (g) =>
    `M ${g.cx - W} ${g.cy - H} L ${g.cx + W} ${g.cy - H} ` +
    `C ${g.cx + W} ${g.cy - H + 34}, ${g.cx + SHOULDER} ${g.cy - 26}, ` +
    `${g.cx + g.nw} ${g.cy} L ${g.cx - g.nw} ${g.cy} ` +
    `C ${g.cx - SHOULDER} ${g.cy - 26}, ${g.cx - W} ${g.cy - H + 34}, ` +
    `${g.cx - W} ${g.cy - H} Z`;
  const lowerD = (g) =>
    `M ${g.cx - g.nw} ${g.cy} L ${g.cx + g.nw} ${g.cy} ` +
    `C ${g.cx + SHOULDER} ${g.cy + 26}, ${g.cx + W} ${g.cy + H - 34}, ` +
    `${g.cx + W} ${g.cy + H} L ${g.cx - W} ${g.cy + H} ` +
    `C ${g.cx - W} ${g.cy + H - 34}, ${g.cx - SHOULDER} ${g.cy + 26}, ` +
    `${g.cx - g.nw} ${g.cy} Z`;

  const defs = el('defs', {});
  const clipFor = (g, which, d) => {
    const cp = el('clipPath', { id: 'hg-' + g.id + '-' + which }, defs);
    el('path', { d }, cp);
    return 'url(#hg-' + g.id + '-' + which + ')';
  };

  // Per glass: fill, contents group (clipped), outline, frame.
  const buildGlass = (g) => {
    const up = upperD(g), lo = lowerD(g);
    el('path', { d: up, fill: '#fbfbfc' });
    el('path', { d: lo, fill: '#fbfbfc' });
    const clipUp = clipFor(g, 'up', up);
    const clipLo = clipFor(g, 'lo', lo);
    const contentsUp = el('g', { 'clip-path': clipUp });
    const contentsLo = el('g', { 'clip-path': clipLo });
    const both = el('clipPath', { id: 'hg-' + g.id + '-all' }, defs);
    el('path', { d: up }, both);
    el('path', { d: lo }, both);
    const contentsAll = el('g',
      { 'clip-path': 'url(#hg-' + g.id + '-all)' });
    // Silhouette over the contents, then the frame over everything.
    el('path', { d: up, fill: 'none', stroke: GLASS_LINE,
      'stroke-width': 2 });
    el('path', { d: lo, fill: 'none', stroke: GLASS_LINE,
      'stroke-width': 2 });
    el('path', { d: `M ${g.cx - W + 12} ${g.cy - H + 10} C ` +
      `${g.cx - W + 8} ${g.cy - H + 40}, ${g.cx - SHOULDER - 4} ` +
      `${g.cy - 34}, ${g.cx - g.nw - 6} ${g.cy - 6}`, fill: 'none',
      stroke: '#fff', 'stroke-width': 3, opacity: 0.6 });
    [-1, 1].forEach((s) => el('rect', {
      x: g.cx + s * (W + 8) - 3, y: g.cy - H - 4, width: 6,
      height: 2 * H + 8, rx: 3, fill: '#d5d8dd' }));
    [g.cy - H - 13, g.cy + H].forEach((y) => el('rect', {
      x: g.cx - W - 15, y, width: 2 * W + 30, height: 13, rx: 4,
      fill: '#e2e4e8', stroke: RULE, 'stroke-width': 1.2 }));
    return { contentsUp, contentsLo, contentsAll };
  };

  const L = buildGlass(GL);
  const Q = buildGlass(GQ);

  // ── Classical contents: sand, clipped by the bulbs ─────────────────
  const sandUp = el('rect', { x: GL.cx - W, width: 2 * W, fill: GRAY,
    opacity: 0.9 }, L.contentsUp);
  const sandLo = el('rect', { x: GL.cx - W, width: 2 * W, fill: GRAY,
    opacity: 0.9 }, L.contentsLo);
  const peak = el('polygon', { points: '', fill: GRAY, opacity: 0.9 },
    L.contentsLo);
  const stream = el('rect', { x: GL.cx - 12, width: 24, fill: GRAY,
    opacity: 0 }, L.contentsLo);
  const motes = Array.from({ length: 6 }, () => el('circle', {
    r: 1.7, fill: '#8a9099', opacity: 0 }, L.contentsLo));

  // ── Quantum contents: six boulders, clipped to the whole vessel ────
  const REST = [[-14, -28], [0, -28], [14, -28], [-9, -46], [9, -46],
                [0, -62]];
  const SLOT = [[-17, 70], [0, 70], [17, 70], [-9, 54], [9, 54], [0, 38]];
  const blob = (r, seed) => {
    const pts = [];
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const rr = r * (0.84 + 0.16 * Math.abs(Math.sin(seed + i * 1.7)));
      pts.push((rr * Math.cos(a)).toFixed(1) + ',' +
               (rr * Math.sin(a)).toFixed(1));
    }
    return pts.join(' ');
  };
  const boulders = REST.map((_, i) => el('polygon', {
    points: blob(8, i * 2.3), fill: ACCENT, stroke: ACCENT_DK,
    'stroke-width': 1.2
  }, Q.contentsAll));

  // ── Verdicts and captions ───────────────────────────────────────────
  const mark = (x, y, colour) => {
    const g = el('g', { opacity: 0 });
    el('circle', { cx: x, cy: y, r: 14, fill: colour }, g);
    el('path', { d: `M ${x - 5.5} ${y} l 4 5 l 8 -9.5`, stroke: '#fff',
      'stroke-width': 2.5, fill: 'none', 'stroke-linecap': 'round' }, g);
    return g;
  };
  const doneL = mark(GL.cx, 272, GREEN);
  const doneQ = mark(GQ.cx, 272, FAINT);
  const ring = el('circle', { cx: GL.cx, cy: 272, r: 14, fill: 'none',
    stroke: GREEN, 'stroke-width': 2, opacity: 0 });

  text('classical · samples', GL.cx, 302, 13, DIM, 'middle', 600);
  text('QPU · one query lane', GQ.cx, 302, 13, DIM, 'middle', 600);

  const setState = (t) => {
    // Classical: the upper body empties, the lower pile grows.
    const u = ease(clamp01((t - T0) / DRAIN));
    const ys = lerp(GL.cy - H, GL.cy, u);
    sandUp.setAttribute('y', ys);
    sandUp.setAttribute('height', Math.max(0, GL.cy - ys));
    const yp = lerp(GL.cy + H, GL.cy + 6, u);
    sandLo.setAttribute('y', yp);
    sandLo.setAttribute('height', Math.max(0, GL.cy + H - yp));
    peak.setAttribute('points',
      `${GL.cx - 26},${yp + 1} ${GL.cx + 26},${yp + 1} ` +
      `${GL.cx},${yp - 11}`);
    peak.setAttribute('opacity', u > 0.04 ? 0.9 : 0);
    const pouring = t > T0 && u < 1;
    stream.setAttribute('opacity', pouring ? 0.85 : 0);
    if (pouring) {
      stream.setAttribute('y', GL.cy);
      stream.setAttribute('height', Math.max(0, yp - GL.cy));
    }
    motes.forEach((m, i) => {
      if (!pouring) { m.setAttribute('opacity', 0); return; }
      const p = (t * 2.6 + i * 0.17) % 1;
      m.setAttribute('cx', GL.cx + Math.sin(i * 2.1 + t * 9) * 6);
      m.setAttribute('cy', lerp(GL.cy, yp - 4, p));
      m.setAttribute('opacity', 0.9);
    });

    // Quantum: one boulder at a time, squashing through the waist.
    boulders.forEach((b, i) => {
      const p = clamp01((t - (T0 + i * QSTEP)) / QDUR);
      const [rx, ry] = REST[i];
      const [sx, sy] = SLOT[i];
      let x, y, sq = 1;
      if (p <= 0) {
        x = GQ.cx + rx; y = GQ.cy + ry;
      } else if (p < 0.42) {
        const w = ease(p / 0.42);
        x = lerp(GQ.cx + rx, GQ.cx, w);
        y = lerp(GQ.cy + ry, GQ.cy - 16, w);
      } else if (p < 0.68) {
        const w = (p - 0.42) / 0.26;
        x = GQ.cx;
        y = lerp(GQ.cy - 16, GQ.cy + 16, w);
        sq = 0.55 + 0.45 * Math.abs(2 * w - 1);
      } else {
        const w = ease((p - 0.68) / 0.32);
        x = lerp(GQ.cx, GQ.cx + sx, w);
        y = lerp(GQ.cy + 16, GQ.cy + sy, w);
      }
      b.setAttribute('transform', 'translate(' + x + ',' + y +
        ') scale(' + sq.toFixed(3) + ',1)');
    });

    // One glass is dry while the other is still working.
    const dl = clamp01((t - (T0 + DRAIN)) / 0.35);
    doneL.setAttribute('opacity', dl);
    const rr = clamp01((t - T0 - DRAIN) / 0.9);
    ring.setAttribute('opacity', dl * (1 - rr));
    ring.setAttribute('r', 14 + 16 * rr);
    doneQ.setAttribute('opacity', clamp01((t - Q_DONE) / 0.35));
  };

  // ── Replay control ──────────────────────────────────────────────────
  const RB = { x: 405, y: 272, r: 15 };
  const replay = el('g', { class: 'no-nav', cursor: 'pointer',
    role: 'button', 'aria-label': 'replay' });
  el('circle', { cx: RB.x, cy: RB.y, r: RB.r, fill: '#fff', stroke: RULE,
    'stroke-width': 1.5 }, replay);
  el('path', { d: 'M 4 -6.93 A 8 8 0 1 1 -6.93 -4', fill: 'none',
    stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round',
    transform: 'translate(' + RB.x + ',' + RB.y + ')' }, replay);
  el('polygon', { points: '6.6,-5.4 5.25,-9.1 2.75,-4.8', fill: INK,
    transform: 'translate(' + RB.x + ',' + RB.y + ')' }, replay);

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setState(T_END);
    replay.setAttribute('display', 'none');
    return;
  }

  let playing = false, elapsed = 0, last = performance.now();
  const play = () => { elapsed = 0; playing = true; };
  replay.addEventListener('click', play);

  const slide = svg.closest('.slide');
  if (slide) {
    setState(0);
    if (slide.classList.contains('current')) play();
    new MutationObserver(() => {
      if (slide.classList.contains('current')) {
        if (!playing && elapsed === 0) play();
      } else {
        playing = false;
        elapsed = 0;
        setState(0);
      }
    }).observe(slide, { attributes: true, attributeFilter: ['class'] });
  } else {
    play();
  }

  const frame = (now) => {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    replay.setAttribute('opacity', playing ? 0.4 : 1);
    if (document.hidden || !playing) return;
    elapsed += dt;
    if (elapsed >= T_END) { elapsed = T_END; playing = false; }
    setState(elapsed);
  };
  requestAnimationFrame(frame);
})();
