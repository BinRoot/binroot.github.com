// vote-board.js -- slide 32: where would you play?
//
// The curated board, large, with its three candidate moves labelled A, B, C.
// The room votes by hands, spoken.  Then two presses reveal,
// in order, the local support count each move would have, and the
// forty-thousand-rollout screen estimate for each with its 95% interval,
// from the allMoves table in assets/sway-data.js (the heavier run of four
// hundred thousand waits for slide 36).  At forty thousand the two close
// moves' intervals still overlap; that overlap is the bridge to slide 33.
(function () {
  const svg = document.getElementById('vote-board-fig');
  if (!svg) return;
  const L = window.L2;
  const D = window.SWAY_DATA;
  const N = D.N;
  const root = L.el('g', {}, svg);
  const B = L.board(root, { N, size: 270, x: 40, y: 20, board: D.board });
  const COL = { A: L.BLUE, B: L.ORANGE, C: L.PURPLE };
  // the screen pass: every empty cell at 40,000 rollouts, mean and count only,
  // so the 95% half-width is recomputed here exactly as the generator does it
  const screen = Object.fromEntries((D.allMoves || []).map((m) => [m.cell, m]));
  const estFor = (c) => {
    const m = screen[c.r * N + c.c];
    if (!m) return { mean: c.mean, lo: c.lo, hi: c.hi, n: c.n };
    const hw = 1.96 * Math.sqrt(m.mean * (1 - m.mean) / m.n);
    return { mean: m.mean, lo: m.mean - hw, hi: m.mean + hw, n: m.n };
  };
  D.candidates.forEach((c) => {
    const i = c.r * N + c.c;
    L.el('circle', { cx: B.cx(i) + 40, cy: B.cy(i) + 20, r: B.r, fill: '#fff', stroke: COL[c.label], 'stroke-width': 2.5, opacity: 0.9 }, root);
    L.text(root, c.label, B.cx(i) + 40, B.cy(i) + 20, { size: 18, weight: 700, fill: COL[c.label] });
  });
  // right column: one row per candidate; the room votes by hands, nothing is
  // counted on screen.  Two presses reveal support counts, then estimates.
  const RX = 360;
  // two presses for the whole column: every support count together, then every
  // estimate together (the rows use absolute coordinates, so the groups can
  // live at the root)
  const supportG = L.el('g', { class: 'step' }, root);
  const estG = L.el('g', { class: 'step' }, root);
  const rows = D.candidates.map((c, k) => {
    const y = 60 + k * 82;
    const g = L.el('g', {}, root);
    L.el('circle', { cx: RX, cy: y, r: 18, fill: '#fff', stroke: COL[c.label], 'stroke-width': 2.5 }, g);
    L.text(g, c.label, RX, y, { size: 18, weight: 700, fill: COL[c.label] });
    // support (step 1)
    const s1 = L.el('g', {}, supportG);
    L.text(s1, `${c.support} friend${c.support === 1 ? '' : 's'}`, RX + 40, y - 6, { anchor: 'start', size: 13, fill: L.DIM });
    // estimate (step 2)
    const s2 = L.el('g', {}, estG);
    const e = estFor(c);
    const AX0 = RX + 40, AX1 = 720, lo = 0.40, hi = 0.48;
    const vx = (v) => L.lerp(AX0, AX1, (v - lo) / (hi - lo));
    L.el('line', { x1: AX0, y1: y + 18, x2: AX1, y2: y + 18, stroke: L.FAINT }, s2);
    L.el('rect', { x: vx(e.lo), y: y + 10, width: vx(e.hi) - vx(e.lo), height: 16, rx: 4, fill: COL[c.label], opacity: 0.35 }, s2);
    L.el('line', { x1: vx(e.mean), y1: y + 6, x2: vx(e.mean), y2: y + 30, stroke: COL[c.label], 'stroke-width': 3 }, s2);
    L.text(s2, e.mean.toFixed(3), vx(e.mean), y + 42, { size: 12, mono: true, fill: COL[c.label] });
    if (k === D.candidates.length - 1) L.text(s2, `${e.n.toLocaleString()} rollouts per move, 95% intervals`, (AX0 + AX1) / 2, y + 62, { size: 11, fill: L.DIM });
    return g;
  });
})();
