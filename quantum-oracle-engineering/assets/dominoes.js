// dominoes.js -- slide 38: the cracked foundation.
//
// Left: four low-rank QML speedup claims stand on ONE slab (what that slab
// assumes is spoken, not printed).  Tang's 2018 classical analogue, only
// polynomially slower under comparable sampling access, snaps it: one jagged
// fissure, a jolt, debris, and then a real gap opening as
// the two halves tilt and drop.  The tiles are children of the halves, so
// they ride the failing ground and lean off their bottom corners, struck
// through and greyed.  They did not tip each other: they shared a
// foundation, which is why one technique reached all of them, and by 2020 a
// general framework covered the family.
//
// Right: a second slab holding separations that rest on no such assumption
// (Grover, amplitude estimation, Simon).
// The same shove arrives; those tiles rock and hold.  The amplitude
// estimation tile carries the deck's accent because it is the lever this
// course pulls.
//
// Layout rule learned the hard way: tiles pivot on a bottom corner so they
// never sink through the slab.
//
// Note the wording on the left: low-rank linear algebra, not linear algebra
// in general.  Sparse HHL is BQP-complete and stands.
//
// Runs once per arrival, replay button; reduced motion renders the final
// frame.
(function () {
  const svg = document.getElementById('dominoes-fig');
  if (!svg) return;

  const ns = 'http://www.w3.org/2000/svg';
  const INK = '#2d3140';
  const RULE = '#bbb';
  const DIM = '#888';
  const FAINT = '#a9aeb6';
  const ACCENT = '#456AAD';
  const STOPRED = '#c0392b';

  const TILE = { w: 80, h: 92 };
  const FONT = 10.5, LINE = 14;
  const SLAB_Y = 240, SLAB_H = 22;
  const LEFT = { x0: 36, x1: 414, crack: 225 };
  const RIGHT = { x0: 458, x1: 732 };
  const FALLEN = [
    { x: 87, a: ['recommender', 'systems'], lean: -1 },
    { x: 179, a: ['quantum', 'PCA'], lean: 1 },
    { x: 271, a: ['supervised', 'clustering'], lean: -1 },
    { x: 363, a: ['low-rank', 'linear', 'algebra'], lean: 1 }
  ];
  const STANDING = [
    { x: 504, a: ['Grover', '√N'], ours: false },
    { x: 595, a: ['amplitude', 'estimation', '1/ε'], ours: true },
    { x: 686, a: ['Simon', 'exponential'], ours: false }
  ];

  const CRACK0 = 1.0, CRACK1 = 1.3;
  const FALL0 = 1.7, FALL_STEP = 0.38, FALL_DUR = 0.6;
  const AFTER = 4.1, SHOVE = 5.0;
  const T_END = 8.4;

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

  // ── Tiles ───────────────────────────────────────────────────────────
  const makeTile = (t, accent, parent) => {
    const g = el('g', {}, parent);
    const top = SLAB_Y - TILE.h;
    el('rect', { x: t.x - TILE.w / 2, y: top, width: TILE.w, height: TILE.h,
      rx: 5, fill: accent ? '#eef2f9' : '#fff',
      stroke: accent ? ACCENT : INK, 'stroke-width': accent ? 2 : 1.4 }, g);
    const baseline = (i) =>
      top + TILE.h / 2 + (i - (t.a.length - 1) / 2) * LINE + 4;
    const textEls = t.a.map((s, i) =>
      text(s, t.x, baseline(i), FONT, accent ? ACCENT : INK, 'middle', 600, g));
    // One strike per line, through the middle of the glyphs (a line on the
    // baseline reads as an underline), sized to the word once it can be
    // measured.
    const strikes = t.a.map((s, i) => ({
      el: el('line', { x1: t.x, y1: baseline(i) - 3.6, x2: t.x,
        y2: baseline(i) - 3.6, stroke: STOPRED, 'stroke-width': 2,
        'stroke-linecap': 'round', opacity: 0 }, g),
      w: 0
    }));
    return { g, strikes, textEls, measured: false, x: t.x,
             lean: t.lean || 1 };
  };

  // ── Scenes ──────────────────────────────────────────────────────────
  // The left scene is one group so the break can jolt the whole thing; each
  // slab half owns the tiles standing on it, so they ride the ground.
  const leftScene = el('g', {});
  const rightScene = el('g', {});

  // The gap under the seam, revealed as the halves part.
  const gap = el('rect', { x: LEFT.crack - 1, y: SLAB_Y, width: 2,
    height: SLAB_H, fill: '#1b1e26', opacity: 0 }, leftScene);

  const halfL = el('g', {}, leftScene);
  const halfR = el('g', {}, leftScene);
  const slabPiece = (x0, x1, parent) => el('rect', {
    x: x0, y: SLAB_Y, width: x1 - x0, height: SLAB_H, rx: 3,
    fill: '#e2e4e8', stroke: RULE, 'stroke-width': 1.3
  }, parent);
  slabPiece(LEFT.x0, LEFT.crack, halfL);
  slabPiece(LEFT.crack, LEFT.x1, halfR);
  slabPiece(RIGHT.x0, RIGHT.x1, rightScene);

  const fallen = FALLEN.map((t) =>
    makeTile(t, false, t.x < LEFT.crack ? halfL : halfR));
  const standing = STANDING.map((t) => makeTile(t, t.ours, rightScene));

  // One fissure, no strays.  Both strokes are dash-revealed and the group
  // stays hidden until the break: a round cap on a zero-length dash renders
  // as a dot, which is what used to sit on the slab from the first frame.
  const crackD = `M ${LEFT.crack} ${SLAB_Y - 1} l 6 6 l -8 5 l 7 6 l -5 6`;
  const crackLen = 34;
  const crackG = el('g', { opacity: 0 }, leftScene);
  const crackStrokes = [
    el('path', { d: crackD, fill: 'none', stroke: '#1b1e26',
      'stroke-width': 5, opacity: 0.22, 'stroke-linecap': 'round' }, crackG),
    el('path', { d: crackD, fill: 'none', stroke: STOPRED,
      'stroke-width': 3.4, 'stroke-linecap': 'round' }, crackG)
  ];
  crackStrokes.forEach((p) => {
    p.setAttribute('stroke-dasharray', crackLen);
    p.setAttribute('stroke-dashoffset', crackLen);
  });

  // Debris and dust from the break.
  const DEBRIS = [
    [-46, -120], [22, -140], [-14, -155], [58, -105], [-70, -95], [38, -132]
  ];
  const debris = DEBRIS.map(() => el('rect', {
    x: -2.5, y: -2, width: 5, height: 4, rx: 1, fill: '#c2c6cc', opacity: 0
  }, leftScene));
  const dust = [0, 1].map(() => el('circle', {
    cx: LEFT.crack, cy: SLAB_Y + 6, r: 4, fill: '#cfd3d9', opacity: 0
  }, leftScene));

  // ── Labels, all outside the slab band ──────────────────────────────
  // What each foundation rests on is spoken, not printed.
  const tang = text('2018 · Tang', 222, 290, 13, STOPRED, 'end', 700);
  tang.setAttribute('opacity', 0);
  const framework = text('→ 2020 · general framework', 230, 290, 12,
    FAINT, 'start', 400);
  framework.setAttribute('opacity', 0);

  // The same disturbance travels outward from the break: a shockwave that
  // reaches the second foundation and achieves nothing.  An arrow said this
  // too, but an arrow has to be explained; a wave you can watch arrive.
  const WAVE_T = 1.5, WAVE_X1 = 756;
  const waves = [0, 1, 2].map(() => el('path', {
    d: '', fill: 'none', stroke: FAINT, 'stroke-width': 2, opacity: 0
  }));
  const arriveAt = (x) =>
    SHOVE + ((x - LEFT.crack) / (WAVE_X1 - LEFT.crack)) * WAVE_T;

  const setState = (t) => {
    // The fissure snaps open, the scene jolts, debris flies.
    const cu = ease(clamp01((t - CRACK0) / (CRACK1 - CRACK0)));
    crackG.setAttribute('opacity', cu > 0 ? 1 : 0);
    crackStrokes.forEach((p) =>
      p.setAttribute('stroke-dashoffset', crackLen * (1 - cu)));
    const since = t - CRACK1;
    if (since > 0 && since < 0.5) {
      const k = 6 * Math.exp(-7 * since);
      leftScene.setAttribute('transform', 'translate(' +
        (k * Math.sin(62 * since)) + ',' + (k * 0.5 * Math.cos(71 * since)) +
        ')');
    } else {
      leftScene.setAttribute('transform', 'translate(0,0)');
    }
    debris.forEach((d, i) => {
      const u = clamp01(since / 0.9);
      if (u <= 0 || u >= 1) { d.setAttribute('opacity', 0); return; }
      const [vx, vy] = DEBRIS[i];
      const x = LEFT.crack + vx * u;
      const y = SLAB_Y + 4 + vy * u + 300 * u * u;
      d.setAttribute('opacity', 1 - u);
      d.setAttribute('transform', 'translate(' + x + ',' + y +
        ') rotate(' + (u * 320 * (i % 2 ? 1 : -1)) + ')');
    });
    dust.forEach((c, i) => {
      const u = clamp01((since - i * 0.08) / 0.6);
      c.setAttribute('r', 4 + u * 26);
      c.setAttribute('opacity', u > 0 && u < 1 ? 0.5 * (1 - u) : 0);
    });

    // The halves tilt and drop, opening the gap; their tiles ride along.
    const sag = ease(clamp01((t - CRACK1 - 0.05) / 0.8));
    halfL.setAttribute('transform', 'translate(' + (-3 * sag) + ',' +
      (6 * sag) + ') rotate(' + (-1.6 * sag) + ' ' + LEFT.crack + ' ' +
      SLAB_Y + ')');
    halfR.setAttribute('transform', 'translate(' + (3 * sag) + ',' +
      (6 * sag) + ') rotate(' + (1.6 * sag) + ' ' + LEFT.crack + ' ' +
      SLAB_Y + ')');
    gap.setAttribute('x', LEFT.crack - 1 - 3 * sag);
    gap.setAttribute('width', 2 + 6 * sag);
    gap.setAttribute('opacity', 0.75 * sag);
    tang.setAttribute('opacity', clamp01((t - CRACK0 - 0.15) / 0.35));

    // The tiles lean off a bottom corner: planted, never sinking through.
    fallen.forEach((tile, i) => {
      const u = ease(clamp01((t - (FALL0 + i * FALL_STEP)) / FALL_DUR));
      const pivot = tile.x + tile.lean * TILE.w / 2;
      tile.g.setAttribute('transform',
        'rotate(' + (tile.lean * 15 * u) + ' ' + pivot + ' ' + SLAB_Y + ')');
      tile.g.setAttribute('opacity', lerp(1, 0.45, u));
      if (!tile.measured && u > 0) {
        tile.strikes.forEach((s, k) => {
          let w = 0;
          try { w = tile.textEls[k].getComputedTextLength(); } catch (e) { w = 0; }
          s.w = Math.min(TILE.w - 8, (w || TILE.w - 22) + 8);
          s.el.setAttribute('x1', tile.x - s.w / 2);
          s.el.setAttribute('x2', tile.x + s.w / 2);
          s.el.setAttribute('stroke-dasharray', s.w);
          s.el.setAttribute('stroke-dashoffset', s.w);
        });
        tile.measured = true;
      }
      tile.strikes.forEach((s, k) => {
        const su = clamp01((u - 0.1 - k * 0.07) / 0.4);
        s.el.setAttribute('opacity', su > 0 ? 1 : 0);
        s.el.setAttribute('stroke-dashoffset', s.w * (1 - su));
      });
    });
    framework.setAttribute('opacity', clamp01((t - AFTER) / 0.5));

    // The same shove reaches the other slab: everything rocks and holds.
    waves.forEach((w, i) => {
      const u = (t - SHOVE - i * 0.14) / WAVE_T;
      if (u <= 0 || u >= 1) { w.setAttribute('opacity', 0); return; }
      const x = lerp(LEFT.crack, WAVE_X1, u);
      w.setAttribute('d', 'M ' + (x - 8) + ' ' + (SLAB_Y - 78) + ' Q ' +
        (x + 14) + ' ' + (SLAB_Y - 30) + ' ' + (x - 8) + ' ' +
        (SLAB_Y + 16));
      w.setAttribute('opacity', 0.5 * (1 - u) * Math.min(1, u * 6));
    });
    standing.forEach((tile) => {
      const d = t - arriveAt(tile.x);
      const rock = d > 0 && d < 2.6
        ? 3.4 * Math.exp(-2.1 * d) * Math.cos(9 * d) : 0;
      tile.g.setAttribute('transform',
        'rotate(' + rock + ' ' + tile.x + ' ' + SLAB_Y + ')');
    });
  };

  // ── Replay control ──────────────────────────────────────────────────
  const RB = { x: 380, y: 328, r: 15 };
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
