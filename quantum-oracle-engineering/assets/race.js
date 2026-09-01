// race.js -- slide 41: both machines on one clock.
//
// Two lanes, same start, same clock.  The equations above the figure state
// the wall-clock models; this animation makes their different shapes visible.
// The classical side spreads its rollouts across cores, so its work goes
// WIDE: many cheap samples running at once.  The displayed quantum side is
// the lesson's one-coherent-query-lane baseline, so its work goes LONG: each
// block is a whole rollout oracle.  Parallel amplitude estimation needs a
// different width-depth model.  The next slide solves the two displayed
// baseline expressions for the break-even oracle time.
//
// Neither lane finishes.  Both run off the right edge under a fade, because
// who wins depends on the four numbers and slide 16 has already shown one
// operating point where the classical side takes it.  Drawing a finish here
// -- a checkmark, a shorter bar, anything -- would assert a verdict two
// slides early.  The fade is load-bearing, not decoration.
//
// The two vocabularies are carried over deliberately: many-thin-and-light for
// samples, few-heavy-and-solid for queries, the same contrast as the balance
// on slide 13 and the hourglasses on slide 16.
(function () {
  const svg = document.getElementById('race-fig');
  if (!svg) return;

  const ns = 'http://www.w3.org/2000/svg';
  const DIM = '#888';
  const RULE = '#cfd3d9';
  const GRAY = '#9aa0a8';
  const ACCENT = '#456AAD';
  const BG = '#faf8f4';          // slides.css --bg, for the right-edge fade

  const X0 = 126;                // both lanes start on the same tick
  const FADE = 640, X_END = 760;

  const ROWS = 9, ROW_PITCH = 12, BAR_H = 7, TOP_Y = 30;
  const BLK_W = 62, BLK_GAP = 8, BLK_H = 32, BOT_Y = 178;
  const BLOCKS = 9;
  const AX_Y = 234, H = 258;

  const T_END = 3.6;

  const el = (name, attrs, parent) => {
    const node = document.createElementNS(ns, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
    (parent || svg).appendChild(node);
    return node;
  };
  const clamp01 = (u) => Math.max(0, Math.min(1, u));
  const label = (s, x, y, parent) => {
    const t = el('text', {
      x, y, 'text-anchor': 'end', fill: DIM, 'font-size': 15,
      'font-weight': 600, 'font-family': "'Ubuntu', sans-serif"
    }, parent);
    t.textContent = s;
    return t;
  };

  const defs = el('defs', {});
  const grad = el('linearGradient', {
    id: 'race-fade', x1: FADE, y1: 0, x2: X_END, y2: 0,
    gradientUnits: 'userSpaceOnUse'
  }, defs);
  el('stop', { offset: '0%', 'stop-color': BG, 'stop-opacity': 0 }, grad);
  el('stop', { offset: '100%', 'stop-color': BG, 'stop-opacity': 1 }, grad);

  const root = el('g', {});

  // ── Classical: the work goes wide ───────────────────────────────────
  const wide = el('g', { opacity: 0 }, root);
  for (let r = 0; r < ROWS; r++) {
    el('rect', {
      x: X0, y: TOP_Y + r * ROW_PITCH, width: X_END - X0, height: BAR_H,
      rx: 3.5, fill: GRAY, opacity: 0.75
    }, wide);
  }
  label('classical', X0 - 22, TOP_Y + (ROWS * ROW_PITCH) / 2, root);

  // ── Quantum: the work goes long ─────────────────────────────────────
  const long = el('g', {}, root);
  const blocks = [];
  for (let i = 0; i < BLOCKS; i++) {
    blocks.push(el('rect', {
      x: X0 + i * (BLK_W + BLK_GAP), y: BOT_Y, width: BLK_W, height: BLK_H,
      rx: 4, fill: ACCENT, opacity: 0
    }, long));
  }
  label('QPU · one lane', X0 - 22, BOT_Y + BLK_H / 2 + 5, root);

  // ── One clock, no marks on it ───────────────────────────────────────
  el('line', { x1: X0, y1: AX_Y, x2: X_END, y2: AX_Y, stroke: RULE,
    'stroke-width': 1.5 }, root);
  el('line', { x1: X0, y1: AX_Y - 6, x2: X0, y2: AX_Y + 6, stroke: RULE,
    'stroke-width': 1.5 }, root);

  // The fade sits above everything, so both lanes and the clock run off frame.
  el('rect', { x: FADE, y: 0, width: X_END - FADE, height: H,
    fill: 'url(#race-fade)' }, root);

  const setState = (t) => {
    // All at once: that IS the classical side's advantage.
    wide.setAttribute('opacity', clamp01(t / 0.5));
    // One after another: that IS the quantum side's constraint.
    blocks.forEach((b, i) => {
      b.setAttribute('opacity', 0.88 * clamp01((t - 0.7 - i * 0.28) / 0.22));
    });
  };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setState(T_END);
    return;
  }

  let playing = false, elapsed = 0, last = performance.now();
  const play = () => { elapsed = 0; playing = true; };

  const slide = svg.closest('.slide');
  if (slide) {
    setState(0);
    if (slide.classList.contains('current')) play();
    new MutationObserver(() => {
      if (slide.classList.contains('current')) {
        if (!playing && elapsed === 0) play();
      } else { playing = false; elapsed = 0; setState(0); }
    }).observe(slide, { attributes: true, attributeFilter: ['class'] });
  } else { play(); }

  const frame = (now) => {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (document.hidden || !playing) return;
    elapsed += dt;
    if (elapsed >= T_END) { elapsed = T_END; playing = false; }
    setState(elapsed);
  };
  requestAnimationFrame(frame);
})();
