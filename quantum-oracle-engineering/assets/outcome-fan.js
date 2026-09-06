// outcome-fan.js -- slide 30: local rules, global uncertainty.
//
// The curated board runs one Sway event; each stone's roll becomes a branch
// in a binary outcome tree on the right, whose leaves are labelled
// "exponentially many flip patterns" rather than one dramatic count.  The
// path the actual dice took lights up in gold, then the event replays with
// a fresh seed and a different path lights.
(function () {
  const svg = document.getElementById('outcome-fan-fig');
  if (!svg) return;
  const L = window.L2;
  const D = window.SWAY_DATA;
  const N = D.N, nb = L.sway.neighbors(N);
  const root = L.el('g', {}, svg);
  const B = L.board(root, { N, size: 200, x: 30, y: 50, board: D.board });
  // occupied stones in the order the tree branches
  const occ = [];
  for (let i = 0; i < N * N; i++) if (D.board[i]) occ.push(i);
  const LEVELS = Math.min(4, occ.length);
  // tree
  const TX0 = 340, TW = 390, TY = 40, LH = 44;
  const nodes = [[{ x: TX0 + TW / 2, y: TY }]];
  const edges = [];
  for (let lv = 1; lv <= LEVELS; lv++) {
    const count = 1 << lv, row = [];
    for (let i = 0; i < count; i++) {
      const x = TX0 + (i + 0.5) * TW / count, y = TY + lv * LH;
      const p = nodes[lv - 1][Math.floor(i / 2)];
      edges.push({ el: L.el('line', { x1: p.x, y1: p.y, x2: x, y2: y, stroke: L.INK, 'stroke-width': 1.3 }, root), lv, i });
      row.push({ x, y });
    }
    nodes.push(row);
  }
  nodes.forEach((row, lv) => row.forEach((p) => L.el('circle', { cx: p.x, cy: p.y, r: lv === 0 ? 5 : 3.2, fill: L.INK }, root)));
  L.text(root, '⋮', TX0 + TW / 2, TY + (LEVELS + 1) * LH - 14, { size: 18, weight: 700, fill: L.DIM });
  L.text(root, `${occ.length} stones roll  →  up to 2^${occ.length} flip patterns`, TX0 + TW / 2, TY + (LEVELS + 1) * LH + 14, { size: 13, fill: L.DIM, mono: true });

  let cycle = -1, dice = null, post = null, path = null;
  const CYC = 3.2;
  const setState = (t) => {
    const c = Math.floor(t / CYC), u = (t % CYC) / CYC;
    if (c !== cycle) {
      cycle = c;
      const rnd = L.prng(D.seed + 500 + c * 31);
      dice = L.sway.rollDice(N * N, rnd);
      post = L.sway.event(Uint8Array.from(D.board), nb, dice);
      path = occ.slice(0, LEVELS).map((i) => (post[i] !== D.board[i] ? 1 : 0));
    }
    const rolling = u > 0.15 && u < 0.6, done = u >= 0.6;
    B.redraw(done ? post : D.board);
    if (rolling) {
      const k = Math.floor((u - 0.15) / 0.45 * occ.length);
      occ.forEach((i, j) => {
        if (j <= k) L.el('circle', { cx: B.cx(i), cy: B.cy(i), r: B.r + 3, fill: 'none', stroke: post[i] !== D.board[i] ? L.ORANGE : L.GREEN, 'stroke-width': 2 }, B.stones);
      });
    }
    // light the path level by level as stones roll
    let idx = 0;
    edges.forEach((e) => { e.el.setAttribute('stroke', L.INK); e.el.setAttribute('stroke-width', 1.3); });
    const lit = rolling ? Math.min(LEVELS, Math.floor((u - 0.15) / 0.45 * occ.length) + 1) : done ? LEVELS : 0;
    for (let lv = 1; lv <= lit; lv++) {
      idx = idx * 2 + path[lv - 1];
      const e = edges.find((ee) => ee.lv === lv && ee.i === idx);
      if (e) { e.el.setAttribute('stroke', L.GOLD); e.el.setAttribute('stroke-width', 4); }
    }
  };
  L.timeline(svg, { T: CYC * 20, setState, loop: true });
})();
