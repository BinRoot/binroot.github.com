// loading-cost.js -- slide 32: the one-off data-loading bill.
//
// The task is stated on screen: find one entry among 1,000,000.  Two
// identical machines attempt it, differing only in what is inside them.
//
// Left, "one-off stored data": the phone book (one entry marked gold) feeds page by
// page down a fat arrow; the box fills with the million loaded records and
// the counter reads "1,000,000 records loaded".  Then a stop sign slams at
// its door and a grey line appears: a classical scan reads 1,000,000 too.
// The loading alone already spent the entire classical budget, so that
// loading has already consumed the scale of a classical scan.
//
// Right, "computed predicate": nothing enters.  The box holds one small circuit,
// the rule that decides whether a candidate is the target, and the search
// runs by pushing a pulse through that rule 1,000 times ("calls to the
// rule", the square root of a million), after which the marked entry slides
// out of the machine, the same gold row that was in the book, and a green
// check lands.  Gold means the target entry and nothing else; the pulse is
// white.  Grover earns its keep over a computed
// predicate; the trap is charging a one-off load as if access were free.
// Reusable qRAM is a different architecture and is handled in narration.
//
// Fixed timeline, runs once per arrival, replay button; reduced motion
// renders the final frame.
(function () {
  const svg = document.getElementById('loading-cost-fig');
  if (!svg) return;

  const ns = 'http://www.w3.org/2000/svg';
  const INK = '#2d3140';
  const RULE = '#bbb';
  const DIM = '#888';
  const FAINT = '#a9aeb6';
  const GRAY = '#9aa0a8';
  const ACCENT = '#456AAD';
  const GREEN = '#4D8C55';
  const STOPRED = '#c0392b';
  const GOLD = '#F2BF80';
  const GOLD_EDGE = '#D95032';

  const MIDY = 157;
  const BOOK = { x: 40, y: 118, w: 52, h: 78 };
  const LBOX = { x: 206, y: 116, w: 128, h: 82 };
  const RBOX = { x: 500, y: 116, w: 128, h: 82 };
  const FOUND = { x: 656, y: MIDY };
  const CHECK = { x: 700, y: MIDY };
  const N_LOAD = 1000000, N_QUERY = 1000;

  const LOAD0 = 0.4, LOAD1 = 4.6, STOP = 4.9, BASELINE = 5.3;
  const RIGHT_IN = 6.0, SRCH0 = 6.6, SRCH1 = 9.2, POP = 9.4, CHECK_T = 9.7;
  const T_END = 10.5;

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

  // The target entry, drawn the same way wherever it appears: a gold row,
  // matching the marked row in the book.
  const entry = (x, y, w, h, parent) => el('rect', {
    x: x - w / 2, y: y - h / 2, width: w, height: h, rx: 1.5,
    fill: GOLD, stroke: GOLD_EDGE, 'stroke-width': 1
  }, parent);

  // The same machine, drawn twice.
  const machine = (b, parent) => {
    el('rect', { x: b.x + 4, y: b.y + 5, width: b.w, height: b.h, rx: 9,
      fill: '#000', opacity: 0.08 }, parent);
    el('rect', { x: b.x, y: b.y, width: b.w, height: b.h, rx: 9,
      fill: INK }, parent);
    el('rect', { x: b.x + 8, y: b.y + 8, width: b.w - 16, height: 8, rx: 4,
      fill: '#fff', opacity: 0.06 }, parent);
  };

  // ── The task, and what each machine is ──────────────────────────────
  text('find one entry in 1,000,000', 380, 28, 15, INK, 'middle', 700);
  text('one-off stored data', LBOX.x + LBOX.w / 2, 58, 14, DIM, 'middle', 600);
  text('computed predicate', RBOX.x + RBOX.w / 2, 58, 14, DIM, 'middle', 600);

  // ── Left: the book, the fat pipe, the full machine ─────────────────
  const leftG = el('g', {});
  el('rect', { x: BOOK.x, y: BOOK.y, width: BOOK.w, height: BOOK.h,
    fill: '#e8eaee', stroke: GRAY, 'stroke-width': 1.6 }, leftG);
  for (let i = 1; i < 9; i++) {
    if (i === 5) continue;
    el('line', { x1: BOOK.x + 6, y1: BOOK.y + i * 8.4,
      x2: BOOK.x + BOOK.w - 6, y2: BOOK.y + i * 8.4,
      stroke: '#cfd3d9', 'stroke-width': 1 }, leftG);
  }
  // The one entry being looked for.
  el('rect', { x: BOOK.x + 6, y: BOOK.y + 5 * 8.4 - 3.5,
    width: BOOK.w - 12, height: 7, rx: 1.5, fill: GOLD,
    stroke: GOLD_EDGE, 'stroke-width': 0.9 }, leftG);
  el('rect', { x: BOOK.x - 8, y: BOOK.y, width: 10, height: BOOK.h, rx: 2,
    fill: ACCENT, opacity: 0.75 }, leftG);

  // Thickness is cost.
  const fatArrow = el('path', {
    d: `M 100 ${MIDY - 14} h 78 v -9 l 26 23 l -26 23 v -9 h -78 z`,
    fill: '#d9dce1', stroke: RULE, 'stroke-width': 1.2
  }, leftG);

  machine(LBOX, leftG);
  // What is inside the left machine: the million records, now loaded.
  const recs = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 13; c++) {
      recs.push(el('circle', {
        cx: LBOX.x + 13 + c * 8.6, cy: LBOX.y + 32 + r * 9.4,
        r: 1.9, fill: '#8e97a8', opacity: 0
      }, leftG));
    }
  }

  // Pages in flight.
  const pages = Array.from({ length: 9 }, () => {
    const g = el('g', { opacity: 0 }, leftG);
    el('rect', { x: -7, y: -9, width: 14, height: 18, rx: 1.5,
      fill: '#fff', stroke: GRAY, 'stroke-width': 1 }, g);
    [-4, 0, 4].forEach((dy) => el('line', { x1: -4, y1: dy, x2: 4, y2: dy,
      stroke: '#cfd3d9', 'stroke-width': 1 }, g));
    return g;
  });

  // The dead end, at the machine's door.
  const stop = el('g', { opacity: 0 });
  const oct = [];
  for (let i = 0; i < 8; i++) {
    const a = Math.PI / 8 + i * Math.PI / 4;
    oct.push((LBOX.x + 17 * Math.cos(a)).toFixed(1) + ',' +
             (MIDY + 17 * Math.sin(a)).toFixed(1));
  }
  el('polygon', { points: oct.join(' '), fill: STOPRED }, stop);
  el('rect', { x: LBOX.x - 9, y: MIDY - 2, width: 18, height: 4, rx: 1,
    fill: '#fff', opacity: 0.92 }, stop);

  const loadCount = text('0', LBOX.x + LBOX.w / 2, 104, 19, INK,
    'middle', 700);
  loadCount.setAttribute('font-family',
    "'Ubuntu Mono', ui-monospace, Menlo, monospace");
  text('records loaded', LBOX.x + LBOX.w / 2, 224, 13, DIM, 'middle', 600);

  // The baseline that makes the dead end legible: a classical scan reads the
  // same million.  Loading alone spent the whole classical budget.
  const baseline = text('one-off load ≈ classical scan',
    LBOX.x + LBOX.w / 2, 250, 12, FAINT, 'middle', 400);
  baseline.setAttribute('opacity', 0);

  // ── Right: the same machine, holding a rule instead of data ────────
  const rightG = el('g', { opacity: 0 });
  machine(RBOX, rightG);

  const wireY = [MIDY - 17, MIDY, MIDY + 17];
  const wx0 = RBOX.x + 14, wx1 = RBOX.x + RBOX.w - 14;
  wireY.forEach((y) => el('line', { x1: wx0, y1: y, x2: wx1, y2: y,
    stroke: '#7d8698', 'stroke-width': 1.4 }, rightG));
  const GATES = [
    { x: RBOX.x + 44, c: 0, t: 1 },
    { x: RBOX.x + 84, c: 1, t: 2 }
  ];
  const gateEls = GATES.map((g) => {
    const grp = el('g', {}, rightG);
    el('line', { x1: g.x, y1: wireY[g.c], x2: g.x, y2: wireY[g.t],
      stroke: '#c9cfda', 'stroke-width': 1.5 }, grp);
    el('circle', { cx: g.x, cy: wireY[g.c], r: 3.2, fill: '#c9cfda' }, grp);
    el('circle', { cx: g.x, cy: wireY[g.t], r: 6, fill: 'none',
      stroke: '#c9cfda', 'stroke-width': 1.5 }, grp);
    el('line', { x1: g.x - 6, y1: wireY[g.t], x2: g.x + 6, y2: wireY[g.t],
      stroke: '#c9cfda', 'stroke-width': 1.5 }, grp);
    return grp;
  });
  // One pass along the rule is one call.  White, not gold: gold means the
  // target entry and nothing else.
  const pulse = el('circle', { cx: wx0, cy: MIDY, r: 4, fill: '#ffffff',
    opacity: 0 }, rightG);

  const qCount = text('0', RBOX.x + RBOX.w / 2, 104, 19, INK, 'middle', 700,
    rightG);
  qCount.setAttribute('font-family',
    "'Ubuntu Mono', ui-monospace, Menlo, monospace");
  text('calls to the rule', RBOX.x + RBOX.w / 2, 224, 13, DIM, 'middle', 600,
    rightG);

  // The entry, found.
  const found = el('g', { opacity: 0 }, rightG);
  entry(FOUND.x, FOUND.y, 30, 9, found);
  const check = el('g', { opacity: 0 }, rightG);
  el('circle', { cx: CHECK.x, cy: CHECK.y, r: 14, fill: GREEN }, check);
  el('path', { d: `M ${CHECK.x - 5.5} ${CHECK.y} l 4 5 l 8 -9.5`,
    stroke: '#fff', 'stroke-width': 2.5, fill: 'none',
    'stroke-linecap': 'round' }, check);

  const setState = (t) => {
    // Loading: pages fly, records pile, counter climbs.
    const lu = ease(clamp01((t - LOAD0) / (LOAD1 - LOAD0)));
    loadCount.textContent = Math.round(N_LOAD * lu).toLocaleString('en-US');
    recs.forEach((r, k) => {
      r.setAttribute('opacity', k < lu * recs.length ? 0.9 : 0);
    });
    pages.forEach((p, i) => {
      if (t < LOAD0 || t > LOAD1) { p.setAttribute('opacity', 0); return; }
      const u = ((t - LOAD0) * 1.9 + i * 0.111) % 1;
      const x = lerp(BOOK.x + BOOK.w + 8, LBOX.x + 4, u);
      const y = MIDY + Math.sin(u * Math.PI * 2 + i) * 5;
      p.setAttribute('transform',
        'translate(' + x + ',' + y + ') rotate(' + (u * 40 - 20) + ')');
      p.setAttribute('opacity', u < 0.92 ? 1 : 0);
    });

    // The dead end, then the baseline that explains it.
    const su = clamp01((t - STOP) / 0.35);
    const ss = lerp(1.5, 1, ease(su));
    stop.setAttribute('opacity', su);
    stop.setAttribute('transform',
      'translate(' + LBOX.x + ',' + MIDY + ') scale(' + ss +
      ') translate(' + (-LBOX.x) + ',' + (-MIDY) + ')');
    fatArrow.setAttribute('opacity', 1 - 0.55 * su);
    baseline.setAttribute('opacity', clamp01((t - BASELINE) / 0.5));
    leftG.setAttribute('opacity', 1 - 0.22 * clamp01((t - RIGHT_IN) / 0.8));

    // The right machine: the rule runs, again and again.
    rightG.setAttribute('opacity', clamp01((t - RIGHT_IN) / 0.6));
    const qu = ease(clamp01((t - SRCH0) / (SRCH1 - SRCH0)));
    qCount.textContent = Math.round(N_QUERY * qu).toLocaleString('en-US');
    const running = t > SRCH0 && t < SRCH1;
    const paint = (lit) => gateEls.forEach((g, i) => {
      const near = lit
        ? Math.max(0, 1 - Math.abs(lit - GATES[i].x) / 12) : 0;
      g.querySelectorAll('circle, line').forEach((n) => {
        const c = near > 0.2 ? '#ffffff' : '#c9cfda';
        n.setAttribute('stroke', c);
        if (n.tagName === 'circle' && n.getAttribute('fill') !== 'none') {
          n.setAttribute('fill', c);
        }
      });
    });
    if (running) {
      const px = lerp(wx0, wx1, ((t - SRCH0) * 2.4) % 1);
      pulse.setAttribute('cx', px);
      pulse.setAttribute('opacity', 0.95);
      paint(px);
    } else {
      pulse.setAttribute('opacity', 0);
      paint(null);
    }

    const fu = ease(clamp01((t - POP) / 0.35));
    found.setAttribute('opacity', clamp01((t - POP) / 0.3));
    found.setAttribute('transform',
      'translate(' + lerp(-26, 0, fu) + ',0)');
    check.setAttribute('opacity', clamp01((t - CHECK_T) / 0.4));
  };

  // ── Replay control (no looping: the story runs once) ───────────────
  const RB = { x: 380, y: 300, r: 18 };
  const replay = el('g', { class: 'no-nav', cursor: 'pointer',
    role: 'button', 'aria-label': 'replay' });
  el('circle', { cx: RB.x, cy: RB.y, r: RB.r, fill: '#fff', stroke: RULE,
    'stroke-width': 1.5 }, replay);
  el('path', { d: 'M 4 -6.93 A 8 8 0 1 1 -6.93 -4', fill: 'none',
    stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round',
    transform: 'translate(' + RB.x + ',' + RB.y + ')' }, replay);
  el('polygon', { points: '6.6,-5.4 5.25,-9.1 2.75,-4.8', fill: INK,
    transform: 'translate(' + RB.x + ',' + RB.y + ')' }, replay);

  // ── Static frame for reduced motion (also the print fallback) ──────
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setState(T_END);
    replay.setAttribute('display', 'none');
    return;
  }

  // The animation runs once per arrival: page-load timing would have it
  // finished before anyone navigated here, so it starts when this slide
  // becomes current and resets when it leaves.
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
    play();      // standalone page: just run it
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
