// reframe.js -- slide 29: the reframe.
//
// Wordless, and a callback: the two glyphs are the ones already stencilled on
// gates one and two back on slides 10 and 11.  The die (does the best
// classical method still sample?)
// dims and shrinks away; the narrow-gap mark (how small is the gap?) takes
// the frame, and its jaws close until the gap between them is a hairline.
// Passing the sampling gate is not enough; the next question is how fine a
// distinction the task forces.
(function () {
  const svg = document.getElementById('reframe-fig');
  if (!svg) return;

  const ns = 'http://www.w3.org/2000/svg';
  const INK = '#2d3140';
  const RULE = '#bbb';
  const FAINT = '#c9ced6';
  const ACCENT = '#456AAD';
  const WARN = '#D95032';
  const T_END = 4.8;

  const el = (name, attrs, parent) => {
    const node = document.createElementNS(ns, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    (parent || svg).appendChild(node);
    return node;
  };
  const clamp01 = (u) => Math.max(0, Math.min(1, u));
  const lerp = (a, b, u) => a + (b - a) * u;
  const outQuart = (u) => 1 - Math.pow(1 - u, 4);
  const backOut = (u) => {
    const p = u - 1, k = 2.4;
    return 1 + (k + 1) * p * p * p + k * p * p;
  };

  // ── The die, as worn by gate one ────────────────────────────────────
  const die = el('g', {});
  el('rect', { x: -34, y: -34, width: 68, height: 68, rx: 13,
    fill: ACCENT }, die);
  [[-14, -14], [14, 14], [0, 0], [-14, 14], [14, -14]].forEach(([x, y]) =>
    el('circle', { cx: x, cy: y, r: 6, fill: '#fff' }, die));

  // ── The gap mark, as worn by gate two ───────────────────────────────
  const gapG = el('g', {});
  const jawL = el('line', { x1: 0, y1: -60, x2: 0, y2: 60, stroke: INK,
    'stroke-width': 7, 'stroke-linecap': 'round' }, gapG);
  const jawR = el('line', { x1: 0, y1: -60, x2: 0, y2: 60, stroke: INK,
    'stroke-width': 7, 'stroke-linecap': 'round' }, gapG);
  const armL = el('line', { x1: -150, y1: 0, x2: 0, y2: 0, stroke: INK,
    'stroke-width': 5, 'stroke-linecap': 'round' }, gapG);
  const armR = el('line', { x1: 0, y1: 0, x2: 150, y2: 0, stroke: INK,
    'stroke-width': 5, 'stroke-linecap': 'round' }, gapG);
  const slot = el('rect', { x: 0, y: -60, width: 0, height: 120,
    fill: WARN, opacity: 0 }, gapG);

  const setState = (t) => {
    // The die holds the frame, then gives it up.
    const inU = clamp01(t / 0.45);
    const outU = outQuart(clamp01((t - 1.15) / 0.7));
    const dieS = backOut(Math.max(0.001, inU)) * lerp(1, 0.34, outU);
    die.setAttribute('transform', 'translate(' +
      lerp(380, 132, outU) + ',150) scale(' + dieS.toFixed(3) + ')');
    die.setAttribute('opacity', lerp(1, 0.22, outU));

    // The gap mark arrives and closes its jaws.
    const gu = backOut(Math.max(0.001, clamp01((t - 1.5) / 0.55)));
    const close = outQuart(clamp01((t - 2.35) / 1.1));
    const half = lerp(96, 7, close);
    gapG.setAttribute('transform', 'translate(452,150) scale(' +
      Math.min(1, gu).toFixed(3) + ')');
    gapG.setAttribute('opacity', clamp01((t - 1.5) / 0.3));
    jawL.setAttribute('x1', -half); jawL.setAttribute('x2', -half);
    jawR.setAttribute('x1', half); jawR.setAttribute('x2', half);
    armL.setAttribute('x2', -half); armR.setAttribute('x1', half);
    slot.setAttribute('x', -half);
    slot.setAttribute('width', 2 * half);
    slot.setAttribute('opacity', close * (0.16 + 0.10 * Math.sin(t * 5)));
  };

  const RB = { x: 722, y: 274, r: 14 };
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
      } else { playing = false; elapsed = 0; setState(0); }
    }).observe(slide, { attributes: true, attributeFilter: ['class'] });
  } else { play(); }

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
