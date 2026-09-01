// the-cost.js -- slide 28: the cost, itemized.
//
// Three gap regimes, and what each costs.  Bars run on a log scale (a decade
// per fixed width), because the classical column spans eight decades and a
// linear axis would leave the first row invisible.  The numerals are the
// point of this slide, so they are allowed here: it is the deck's numbers
// anchor.
//
// A log axis read as if it were linear says the opposite of this slide: every
// row is a 2:1 pair of bars, so all three regimes look like the same 2x win
// when the bottom row is five orders of magnitude.  Three things stop that
// misreading, and none of them may be dropped.  Decade gridlines behind the
// bars, so a bar five decades longer is visibly five boxes longer.  Tick
// labels along the baseline naming the powers of ten, so the compression is
// declared rather than implied.  And a span bracket per row between the two
// bar ends carrying the ratio, whose LENGTH grows row to row (56px, 129px,
// 215px) even though the bar pair's proportions do not: that bracket is the
// only mark on the slide whose size tracks the actual separation.
//
// The counts are bare reciprocals of g^2 and g.  Variance and confidence
// constants enter both columns the same way and are omitted; the scaling
// separation is the claim, not the absolute figures.
(function () {
  const svg = document.getElementById('the-cost-fig');
  if (!svg) return;

  const ns = 'http://www.w3.org/2000/svg';
  const INK = '#2d3140';
  const RULE = '#bbb';
  const DIM = '#888';
  const GRAY = '#9aa0a8';
  const ACCENT = '#456AAD';
  const GRID = '#e7e4dd';
  const BG = '#faf8f4';          // slides.css --bg, so labels can knock out

  // gap label, classical count, its log10, quantum count, its log10, ratio
  const ROWS = [
    { g: '0.05', c: '400', cl: 2.6, q: '20', ql: 1.3, x: '×20' },
    { g: '10⁻³', c: '10⁶', cl: 6.0, q: '10³', ql: 3.0, x: '×1,000' },
    { g: '10⁻⁵', c: '10¹⁰', cl: 10.0, q: '10⁵', ql: 5.0, x: '×100,000' }
  ];
  const X0 = 190, PER_DECADE = 43, ROW_Y = [84, 162, 240], BAR_H = 20;
  const DECADES = 10;
  const AXIS_TOP = 44, AXIS_BOT = 282;
  const T_END = 4.4;

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
  const clamp01 = (u) => Math.max(0, Math.min(1, u));
  const outQuart = (u) => 1 - Math.pow(1 - u, 4);

  const root = el('g', {});

  // ── The log axis, drawn before the bars so it reads as the ground ────
  // One gridline per decade.  This is what stops a reader from taking bar
  // length for magnitude: the boxes are countable.
  const MONO = "'Ubuntu Mono', ui-monospace, Menlo, monospace";
  for (let d = 0; d <= DECADES; d++) {
    const x = X0 + d * PER_DECADE;
    el('line', { x1: x, y1: AXIS_TOP, x2: x, y2: AXIS_BOT,
      stroke: d === 0 ? RULE : GRID, 'stroke-width': d === 0 ? 2 : 1 }, root);
    if (d % 2) continue;
    const tick = text(d === 0 ? '1' : '10' + sup(d), x, AXIS_BOT + 20, 13,
      DIM, 'middle', 400, root);
    tick.setAttribute('font-family', MONO);
  }
  el('line', { x1: X0, y1: AXIS_BOT, x2: X0 + DECADES * PER_DECADE,
    y2: AXIS_BOT, stroke: RULE, 'stroke-width': 1.5 }, root);
  text('bare scaling counts · constants omitted · log scale',
    X0 + DECADES * PER_DECADE / 2, AXIS_BOT + 44, 13, DIM, 'middle', 400,
    root);

  /* The three numerals down the left are gaps, and nothing said so: a reader
     met 0.05 and two powers of ten with no idea what they measured.  The
     header sits on the same right edge as the values it names. */
  const gapHdr = text('gap g', X0 - 22, 34, 13, DIM, 'end', 400, root);
  gapHdr.setAttribute('font-family', MONO);

  const rows = ROWS.map((r, i) => {
    const y = ROW_Y[i];
    const g = el('g', { opacity: 0 }, root);
    const gap = text(r.g, X0 - 22, y + 6, 19, INK, 'end', 700, g);
    gap.setAttribute('font-family', MONO);
    const cBar = el('rect', { x: X0, y: y - 30, width: 0,
      height: BAR_H, rx: 3, fill: GRAY }, g);
    const qBar = el('rect', { x: X0, y: y + 10, width: 0, height: BAR_H,
      rx: 3, fill: ACCENT }, g);
    const cNum = text(r.c, X0, y - 14, 17, INK, 'start', 700, g);
    const qNum = text(r.q, X0, y + 26, 17, ACCENT, 'start', 700, g);
    [cNum, qNum].forEach((n) => n.setAttribute('font-family', MONO));

    // The span bracket: the one mark whose length tracks the real ratio.
    const span = el('g', { opacity: 0 }, g);
    const rule = el('line', { x1: X0, y1: y, x2: X0, y2: y, stroke: INK,
      'stroke-width': 1.2 }, span);
    const capL = el('line', { x1: X0, y1: y - 5, x2: X0, y2: y + 5,
      stroke: INK, 'stroke-width': 1.2 }, span);
    const capR = el('line', { x1: X0, y1: y - 5, x2: X0, y2: y + 5,
      stroke: INK, 'stroke-width': 1.2 }, span);
    const knock = el('rect', { x: X0, y: y - 9, width: 0, height: 18,
      fill: BG }, span);
    const ratio = text(r.x, X0, y + 5, 14, INK, 'middle', 700, span);
    ratio.setAttribute('font-family', MONO);

    return { r, y, g, cBar, qBar, cNum, qNum, span, rule, capL, capR,
             knock, ratio };
  });

  function sup(n) {
    const D = '⁰¹²³⁴⁵⁶⁷⁸⁹';
    return String(n).split('').map((c) => D[+c]).join('');
  }

  const setState = (t) => {
    rows.forEach((row, i) => {
      const t0 = 0.25 + i * 0.55;
      row.g.setAttribute('opacity', clamp01((t - t0) / 0.25));
      const u = outQuart(clamp01((t - t0 - 0.1) / 0.45));
      const cw = row.r.cl * PER_DECADE * u;
      const qw = row.r.ql * PER_DECADE * u;
      row.cBar.setAttribute('width', cw);
      row.qBar.setAttribute('width', qw);
      row.cNum.setAttribute('x', X0 + cw + 10);
      row.qNum.setAttribute('x', X0 + qw + 10);
      const shown = u > 0.9 ? 1 : 0;
      row.cNum.setAttribute('opacity', shown);
      row.qNum.setAttribute('opacity', shown);

      // The bracket lands after the pair has settled, so the eye reads the
      // bars first and then gets told what it just failed to see.
      const s = outQuart(clamp01((t - t0 - 0.5) / 0.4));
      row.span.setAttribute('opacity', s);
      const a = X0 + row.r.ql * PER_DECADE, b = X0 + row.r.cl * PER_DECADE;
      const bx = a + (b - a) * s;
      row.rule.setAttribute('x1', a);
      row.rule.setAttribute('x2', bx);
      row.capL.setAttribute('x1', a);
      row.capL.setAttribute('x2', a);
      row.capR.setAttribute('x1', bx);
      row.capR.setAttribute('x2', bx);
      const mid = (a + bx) / 2, kw = 6 + (b - a) * 0.42 * s;
      row.knock.setAttribute('x', mid - kw / 2);
      row.knock.setAttribute('width', kw);
      row.ratio.setAttribute('x', mid);
    });
  };

  const RB = { x: 722, y: 334, r: 14 };
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
