// tree-crisp.js -- slide 21: a deterministic world.
//
// Every node is a board position, not a symbol.  A tic-tac-toe tree grows out
// of a six-mark board with X to move, and then solves itself from the bottom
// up: terminal boards show their result (a struck three-in-a-row, or a full
// board with no line), and each parent adopts a result from its children,
// until the root carries a value.  X plays dark, O plays blue, so whose turn
// it is at each level is visible in the boards themselves; no chevrons, no
// labels, no numbers.
//
// Why tic-tac-toe: it is the smallest fully solved deterministic game, so
// the slide's claim is literally true of the object on screen.  The value of
// this position exists AND is computable.  Faint stubs run off the frame,
// because this is a crop: the same claim about Go's roughly 10^170 nodes
// leaves the value determined and forever uncomputed.  Determined is not the
// same as affordable, which is where slides 23 and 24 go.
//
// One colour, one meaning: red marks a completed three-in-a-row (an outcome
// on a board), green marks the value climbing the tree (the reasoning about
// those outcomes).  They were both red once, which made a struck line and a
// lit edge look like the same event.
//
// The value each node settles on is carried by its frame: a solid dark frame
// means the mover wins this line, a light dashed frame means a draw.  The
// alternation is the game's own logic: X takes the best available result, O
// takes the worst for X, which is why B settles for the draw even though a
// win sits under it.
//
// Motion follows the deck's energy rules: fast attack into a slow settle,
// overshoot on arrival, a flash at each resolution, a kick when the root
// locks, and overlapping beats.
(function () {
  const svg = document.getElementById('tree-crisp-fig');
  if (!svg) return;

  const ns = 'http://www.w3.org/2000/svg';
  const INK = '#2d3140';
  const RULE = '#bbb';
  const WIRE = '#8a90a0';
  const GHOST = '#e6e8ec';
  const ACCENT = '#456AAD';
  const WIN = '#D95032';        // a completed three-in-a-row: the outcome
  const CLIMB_C = '#4D8C55';    // the value climbing the tree: the reasoning
  const B = 46;                       // board side
  const T_END = 5.8;

  // The position: X and O have three marks each, X to move, three cells
  // open.  X has a win available at cell 6 (the 2-4-6 diagonal).
  const R = ['X', 'O', 'X', 'O', 'X', '', '', '', 'O'];
  const put = (cells, i, m) => cells.map((c, k) => (k === i ? m : c));

  const A = put(R, 6, 'X');                       // X wins at once
  const Bb = put(R, 5, 'X');                      // X plays on, O to move
  const B1 = put(Bb, 6, 'O');                     // O blocks
  const B2 = put(Bb, 7, 'O');                     // O does not block
  const B1L = put(B1, 7, 'X');                    // board full: draw
  const B2L = put(B2, 6, 'X');                    // X takes the diagonal

  // x, y, cells, win line, parent, value: 1 = the mover's win, 0 = draw.
  const NODES = [
    { x: 380, y: 46, c: R, w: null, p: null, v: 1, big: true },
    { x: 160, y: 132, c: A, w: [2, 4, 6], p: 0, v: 1, term: true },
    { x: 470, y: 132, c: Bb, w: null, p: 0, v: 0 },
    { x: 382, y: 218, c: B1, w: null, p: 2, v: 0 },
    { x: 572, y: 218, c: B2, w: null, p: 2, v: 1 },
    { x: 382, y: 300, c: B1L, w: null, p: 3, v: 0, term: true },
    { x: 572, y: 300, c: B2L, w: [2, 4, 6], p: 4, v: 1, term: true }
  ];

  const el = (name, attrs, parent) => {
    const node = document.createElementNS(ns, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    (parent || svg).appendChild(node);
    return node;
  };
  const clamp01 = (u) => Math.max(0, Math.min(1, u));
  const outQuart = (u) => 1 - Math.pow(1 - u, 4);
  const backOut = (u, s) => {
    const k = s === undefined ? 2.4 : s;
    const p = u - 1;
    return 1 + (k + 1) * p * p * p + k * p * p;
  };

  const root = el('g', {});

  // ── The crop: this position came from somewhere, and has siblings we
  //    are not drawing.
  [`M 380 46 L 288 -16`, `M 380 46 L 472 -16`, `M 380 46 L 792 122`]
    .forEach((d) => el('path', { d, fill: 'none', stroke: GHOST,
      'stroke-width': 1.8 }, root));

  // ── One board ───────────────────────────────────────────────────────
  const drawBoard = (n, g) => {
    const s = B / 3;
    el('rect', { x: -B / 2, y: -B / 2, width: B, height: B, rx: 3,
      fill: '#fff', stroke: RULE, 'stroke-width': 1.2 }, g);
    [-s / 2, s / 2].forEach((d) => {
      el('line', { x1: d, y1: -B / 2 + 3, x2: d, y2: B / 2 - 3,
        stroke: '#dfe2e7', 'stroke-width': 1.2 }, g);
      el('line', { x1: -B / 2 + 3, y1: d, x2: B / 2 - 3, y2: d,
        stroke: '#dfe2e7', 'stroke-width': 1.2 }, g);
    });
    n.c.forEach((m, i) => {
      if (!m) return;
      const cx = ((i % 3) - 1) * s, cy = (Math.floor(i / 3) - 1) * s;
      if (m === 'X') {
        el('path', { d: `M ${cx - 4} ${cy - 4} L ${cx + 4} ${cy + 4} ` +
          `M ${cx + 4} ${cy - 4} L ${cx - 4} ${cy + 4}`, stroke: INK,
          'stroke-width': 2.1, 'stroke-linecap': 'round' }, g);
      } else {
        el('circle', { cx, cy, r: 4.6, fill: 'none', stroke: ACCENT,
          'stroke-width': 2.1 }, g);
      }
    });
  };

  // ── Edges ───────────────────────────────────────────────────────────
  const edges = NODES.map((n, i) => {
    if (n.p === null) return null;
    const p = NODES[n.p];
    const len = Math.hypot(n.x - p.x, n.y - p.y);
    const base = el('line', { x1: p.x, y1: p.y, x2: n.x, y2: n.y,
      stroke: WIRE, 'stroke-width': 1.8, 'stroke-dasharray': len,
      'stroke-dashoffset': len }, root);
    const lit = el('line', { x1: n.x, y1: n.y, x2: p.x, y2: p.y,
      stroke: CLIMB_C, 'stroke-width': 3, 'stroke-linecap': 'round',
      'stroke-dasharray': len, 'stroke-dashoffset': len, opacity: 0 }, root);
    return { base, lit, len, depth: 0 };
  });
  // Depth per node, for staggering.
  const depthOf = (i) => NODES[i].p === null ? 0 : depthOf(NODES[i].p) + 1;
  NODES.forEach((n, i) => { n.depth = depthOf(i); });

  // ── Boards ──────────────────────────────────────────────────────────
  const bodies = NODES.map((n) => {
    const g = el('g', { transform: 'translate(' + n.x + ',' + n.y +
      ') scale(0)' }, root);
    drawBoard(n, g);
    // The value frame, drawn on resolve.
    const frame = el('rect', { x: -B / 2 - 4, y: -B / 2 - 4, width: B + 8,
      height: B + 8, rx: 5, fill: 'none', stroke: INK, 'stroke-width': 2.6,
      opacity: 0 }, g);
    // The struck line, for terminal boards that were won.
    let strike = null;
    if (n.w) {
      const s = B / 3;
      const a = n.w[0], c = n.w[2];
      const ax = ((a % 3) - 1) * s, ay = (Math.floor(a / 3) - 1) * s;
      const cx = ((c % 3) - 1) * s, cy = (Math.floor(c / 3) - 1) * s;
      const len = Math.hypot(cx - ax, cy - ay) + 12;
      strike = el('line', { x1: ax * 1.18, y1: ay * 1.18, x2: cx * 1.18,
        y2: cy * 1.18, stroke: WIN, 'stroke-width': 3.4,
        'stroke-linecap': 'round', 'stroke-dasharray': len,
        'stroke-dashoffset': len }, g);
      strike.__len = len;
    }
    const ring = el('circle', { cx: 0, cy: 0, r: B * 0.7, fill: 'none',
      stroke: CLIMB_C, 'stroke-width': 2.5, opacity: 0 }, g);
    return { g, frame, strike, ring };
  });

  // ── Choreography ────────────────────────────────────────────────────
  const GROW = [0.10, 0.50, 1.00, 1.48];   // by depth
  const GROW_D = 0.32;
  const TERM = 2.10;                       // terminal boards show results
  const CLIMB = [2.62, 3.12, 3.62];        // depth 2, then 1, then root

  const setState = (t) => {
    let jolt = 0;

    edges.forEach((e, i) => {
      if (!e) return;
      const u = outQuart(clamp01((t - GROW[NODES[i].depth]) / GROW_D));
      e.base.setAttribute('stroke-dashoffset', e.len * (1 - u));
    });

    NODES.forEach((n, i) => {
      const t0 = n.depth === 0 ? GROW[0] : GROW[n.depth] + GROW_D * 0.5;
      const u = clamp01((t - t0) / 0.3);
      const s = u <= 0 ? 0 : backOut(u) * (n.big ? 1.06 : 1);
      bodies[i].g.setAttribute('transform',
        'translate(' + n.x + ',' + n.y + ') scale(' + s.toFixed(3) + ')');
    });

    // Terminal boards: strike the winning line, or take a draw frame.
    NODES.forEach((n, i) => {
      if (!n.term) return;
      const u = clamp01((t - TERM - n.depth * 0.08) / 0.3);
      const b = bodies[i];
      if (b.strike) {
        b.strike.setAttribute('stroke-dashoffset',
          b.strike.__len * (1 - outQuart(u)));
      }
      b.frame.setAttribute('opacity', u > 0.4 ? 1 : 0);
      b.frame.setAttribute('stroke', n.v ? INK : '#c9ced6');
      b.frame.setAttribute('stroke-dasharray', n.v ? 'none' : '5,4');
      if (u > 0 && u < 1) {
        b.ring.setAttribute('opacity', 0.8 * (1 - u));
        b.ring.setAttribute('r', B * 0.7 + 14 * u);
      } else {
        b.ring.setAttribute('opacity', 0);
      }
    });

    // The value climbs: each layer's edges light child to parent, then the
    // parent takes a value from its children.
    [2, 1, 0].forEach((depth, k) => {
      const t0 = CLIMB[k];
      const u = clamp01((t - t0) / 0.3);
      edges.forEach((e, i) => {
        if (!e || NODES[i].depth !== depth + 1) return;
        e.lit.setAttribute('opacity', u > 0 ? 0.95 : 0);
        e.lit.setAttribute('stroke-dashoffset', e.len * (1 - u));
      });
      NODES.forEach((n, i) => {
        if (n.depth !== depth || n.term) return;
        const v = clamp01((t - t0 - 0.26) / 0.24);
        const b = bodies[i];
        b.frame.setAttribute('opacity', v > 0.4 ? 1 : 0);
        b.frame.setAttribute('stroke', n.v ? INK : '#c9ced6');
        b.frame.setAttribute('stroke-dasharray', n.v ? 'none' : '5,4');
        if (v > 0 && v < 1) {
          const big = depth === 0;
          b.ring.setAttribute('opacity', 0.85 * (1 - v));
          b.ring.setAttribute('r', B * 0.7 + (big ? 46 : 16) * v);
          b.g.setAttribute('transform', 'translate(' + n.x + ',' + n.y +
            ') scale(' + (1 + 0.12 * Math.sin(Math.PI * v)) + ')');
          if (big) {
            const d = t - t0 - 0.26;
            jolt = 5 * Math.exp(-8 * d) * Math.sin(58 * d);
          }
        } else if (v >= 1) {
          b.ring.setAttribute('opacity', 0);
        }
      });
    });

    root.setAttribute('transform', 'translate(0,' + jolt.toFixed(2) + ')');
  };

  // ── Replay control ──────────────────────────────────────────────────
  const RB = { x: 74, y: 300, r: 15 };
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
