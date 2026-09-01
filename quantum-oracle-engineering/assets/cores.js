// cores.js -- slide 30: the classical counterpunch.
//
// The slide has exactly one spoken payload:
//
//     "Every core somebody adds moves the bar the QPU has to clear."
//
// So the figure has exactly one moving thing: the bar.  A wall-clock axis
// runs right to left, faster toward the left.  A marker sits where the
// classical side finishes, and everything to its left is the room the QPU has
// to land in.  Add ten times the cores, the marker steps left, and the room
// shrinks.  Four steps, 1 to 1,000 cores, each leaving a ghost behind so the
// direction of travel is visible in the final frame without replaying.
//
// What this replaces, and why.  The previous version followed the outline
// literally: a pile of grains, a wall of eighty cores, and a dial carrying one
// long sweep against one short one.  That put the setup on screen and left
// the payload as a small red tick added at the end.  Three objects had to be
// decoded before the sentence landed, and the sentence was the smallest mark
// in the frame.  Inverted here: the bar is the subject, the core count is a
// numeral on it, and the pile and the dial are gone entirely.
//
// There is deliberately NO numeric axis.  An earlier cut put the core count
// at each stop -- 1, 10, 100, 1,000 sitting in a row along the axis -- and
// that reads as an axis scale, at which point the biggest number is at the
// far LEFT and the picture looks backwards.  The numbers are cores and the
// positions are time; printing four of them in a line conflates the two.
// So only the current bar is labelled, and it carries the word as well as the
// figure ("1,000 cores").  One number on one moving mark cannot be mistaken
// for a scale, and the ghosts behind it are plain unlabelled dashes: they
// record where the bar has been, which is all they need to say.
//
// Direction is carried by the arrowhead and one word, "faster", at the left
// end.  More cores finish sooner, so the bar travels toward faster, and the
// room left of it closes.
(function () {
  const svg = document.getElementById('cores-fig');
  if (!svg) return;

  const ns = 'http://www.w3.org/2000/svg';
  const INK = '#2d3140';
  const RULE = '#bbb';
  const DIM = '#888';
  const GHOST = '#d6d9de';
  const ACCENT = '#456AAD';
  const WARN = '#D95032';
  const MONO = "'Ubuntu Mono', ui-monospace, Menlo, monospace";

  const X_LEFT = 96;
  const BAND_TOP = 78, BAND_BOT = 190;
  const NUM_Y = 62;

  // One stop per decade of cores; the marker's x is where the classical side
  // finishes with that many.
  const STOPS = [
    { label: '1 core', x: 648 },
    { label: '10 cores', x: 482 },
    { label: '100 cores', x: 316 },
    { label: '1,000 cores', x: 150 }
  ];
  const DWELL = 1.0, SLIDE = 0.5;
  const T_END = STOPS.length * DWELL + 1.4;

  const el = (name, attrs, parent) => {
    const node = document.createElementNS(ns, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    (parent || svg).appendChild(node);
    return node;
  };
  const clamp01 = (u) => Math.max(0, Math.min(1, u));
  const lerp = (a, b, u) => a + (b - a) * u;
  const outQuart = (u) => 1 - Math.pow(1 - u, 4);
  const text = (s, x, y, size, fill, anchor, weight, family, parent) => {
    const t = el('text', {
      x, y, 'text-anchor': anchor || 'middle', fill: fill || DIM,
      'font-size': size, 'font-weight': weight || 600,
      'font-family': family || "'Ubuntu', sans-serif"
    }, parent);
    t.textContent = s;
    return t;
  };

  const root = el('g', {});

  // Keep the assumption visible when the slide is read without speaker notes.
  text('ideal scaling baseline · communication omitted', 393, 24, 12, DIM,
    'middle', 500, null, root);

  // ── The room the QPU has to land in, and its shrinking right edge ───
  const room = el('rect', {
    x: X_LEFT, y: BAND_TOP, width: 0, height: BAND_BOT - BAND_TOP,
    fill: ACCENT, opacity: 0.13
  }, root);

  // ── The wall clock: faster to the left ──────────────────────────────
  el('line', { x1: X_LEFT, y1: BAND_BOT, x2: 690, y2: BAND_BOT,
    stroke: RULE, 'stroke-width': 1.5 }, root);
  el('polygon', { points: '0,0 9,-5 9,5', fill: RULE,
    transform: 'translate(' + X_LEFT + ',' + BAND_BOT + ')' }, root);
  // Outside the axis entirely, so the span bracket below can never reach it.
  text('faster', X_LEFT - 14, BAND_BOT + 5, 13, DIM, 'end', 600, null, root);

  // ── Ghosts: where the bar stood at each earlier core count ──────────
  const ghosts = STOPS.map((s) => {
    const g = el('g', { opacity: 0 }, root);
    el('line', { x1: s.x, y1: BAND_TOP, x2: s.x, y2: BAND_BOT,
      stroke: GHOST, 'stroke-width': 2, 'stroke-dasharray': '3,4' }, g);
    return { g };
  });

  // ── The bar itself: the one thing that moves ────────────────────────
  const bar = el('g', {}, root);
  el('line', { x1: 0, y1: BAND_TOP - 14, x2: 0, y2: BAND_BOT + 10,
    stroke: WARN, 'stroke-width': 4, 'stroke-linecap': 'round' }, bar);
  const barNum = text('1 core', 0, NUM_Y, 21, INK, 'middle', 700, MONO, bar);

  // ── One label, on a bracket that shrinks with the room ──────────────
  // Riding the midpoint rather than sitting at a fixed x, so the words stay
  // attached to the thing that is closing.
  const SPAN_Y = BAND_BOT + 20;
  const spanRule = el('line', { x1: X_LEFT, y1: SPAN_Y, x2: X_LEFT,
    y2: SPAN_Y, stroke: ACCENT, 'stroke-width': 1.4 }, root);
  const capL = el('line', { x1: X_LEFT, y1: SPAN_Y - 5, x2: X_LEFT,
    y2: SPAN_Y + 5, stroke: ACCENT, 'stroke-width': 1.4 }, root);
  const capR = el('line', { x1: X_LEFT, y1: SPAN_Y - 5, x2: X_LEFT,
    y2: SPAN_Y + 5, stroke: ACCENT, 'stroke-width': 1.4 }, root);
  const roomLabel = text('room for the QPU', X_LEFT, SPAN_Y + 26, 15, ACCENT,
    'middle', 700, null, root);

  const setState = (t) => {
    // Which stop are we at, and how far into the slide toward it?
    let i = 0;
    while (i < STOPS.length - 1 && t >= (i + 1) * DWELL) i++;
    const into = clamp01((t - i * DWELL) / SLIDE);
    const from = i === 0 ? STOPS[0].x : STOPS[i - 1].x;
    const x = i === 0 ? STOPS[0].x : lerp(from, STOPS[i].x, outQuart(into));

    bar.setAttribute('transform', 'translate(' + x.toFixed(2) + ',0)');
    barNum.textContent = (i === 0 || into > 0.55)
      ? STOPS[i].label : STOPS[i - 1].label;
    const w = Math.max(0, x - X_LEFT);
    room.setAttribute('width', w.toFixed(2));
    spanRule.setAttribute('x2', x);
    capR.setAttribute('x1', x);
    capR.setAttribute('x2', x);
    roomLabel.setAttribute('x', X_LEFT + w / 2);

    // A ghost appears once the bar has left that position behind.
    ghosts.forEach((gh, k) => {
      gh.g.setAttribute('opacity', k < i ? 1 : 0);
    });
  };

  const RB = { x: 716, y: 250, r: 14 };
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
