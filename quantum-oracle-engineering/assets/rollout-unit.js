// rollout-unit.js -- slide 5: one rollout, one disposable result.
//
// A stone sits at the root of a game tree drawn left to right: H levels of
// binary branching, the leaves against the horizon wall (L2.gameTree).  The
// tree is faint and permanent; it is the game.  One future unfolds as a path
// down the tree, one edge per tick, a small die appearing at every branch
// where a random choice was made.  At the leaf the path yields that leaf's
// bit, blue for 1 and grey for 0, which drops into a jar on the right; the
// running fraction fills the slim gauge beside the jar.  The moment the bit
// is banked, the path and its dice dissolve: the simulator kept the bit and
// threw the future away.  Then the next future unfolds.
(function () {
  const svg = document.getElementById('rollout-unit-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  const H = 5, X0 = 70, X1 = 520, AXY = 262, YTOP = 46, YBOT = 242;
  const dx = (X1 - X0) / H;

  // time axis with H ticks
  L.el('line', { x1: X0 - 10, y1: AXY, x2: X1 + 18, y2: AXY, stroke: L.RULE, 'stroke-width': 1.5 }, root);
  for (let h = 0; h <= H; h++) L.el('line', { x1: X0 + h * dx, y1: AXY - 5, x2: X0 + h * dx, y2: AXY + 5, stroke: L.RULE, 'stroke-width': 1.5 }, root);
  // the horizon: a dashed wall the future runs into
  L.el('line', { x1: X1, y1: 40, x2: X1, y2: AXY, stroke: L.RULE, 'stroke-width': 1.5, 'stroke-dasharray': '6 5' }, root);
  L.text(root, 'H', X1, 26, { size: 17, mono: true, fill: L.DIM });

  // the game tree, and the fixed first action at its root
  const T = L.gameTree(root, { H, X0, X1, YTOP, YBOT });
  const YMID = T.YMID;
  L.el('circle', { cx: X0, cy: YMID, r: 20, fill: 'none', stroke: L.ORANGE, 'stroke-width': 2.5, opacity: 0.85 }, root);
  L.stone(root, X0, YMID, 13, 1);

  // the jar and its gauge
  const JX = 645, JT = 92, JB = 262, JW = 96;
  L.el('path', { d: `M ${JX - JW / 2} ${JT} V ${JB} H ${JX + JW / 2} V ${JT}`, fill: 'none', stroke: L.INK, 'stroke-width': 2, 'stroke-linejoin': 'round' }, root);
  const GX = JX + JW / 2 + 22;
  L.el('rect', { x: GX - 7, y: JT, width: 14, height: JB - JT, rx: 7, fill: '#eceef2' }, root);
  const gauge = L.el('rect', { x: GX - 7, y: JB, width: 14, height: 0, rx: 7, fill: L.BLUE }, root);
  const settled = L.el('g', {}, root);

  // one future: its path down the tree, its dice, its bit
  const fut = L.el('g', {}, root);
  const path = L.el('path', { fill: 'none', stroke: L.BLUE, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, fut);
  const dice = [];
  for (let h = 0; h < H; h++) dice.push(L.die(fut, 0, 0, 11, null, { fill: '#fff', stroke: L.INK }));
  const head = L.el('circle', { r: 7, fill: L.INK }, fut);
  const coin = L.el('g', { opacity: 0 }, root);
  const coinDot = L.el('circle', { r: 13 }, coin);
  const coinLab = L.text(coin, '', 0, 0, { size: 14, weight: 700, fill: '#fff', mono: true });

  // futures come from a fixed seed, so the deck plays the same way twice and
  // any frame (a reduced-motion still, a print) can be rebuilt from its index.
  // Each step is one branch of the tree; the bit is the leaf's.
  let rnd = L.prng(2027);
  const makeFuture = () => {
    const idx = [0], ys = [YMID];
    for (let h = 1; h <= H; h++) {
      idx.push(2 * idx[h - 1] + (rnd() < 0.5 ? 0 : 1));
      ys.push(T.nodeY(h, idx[h]));
    }
    return { ys, bit: T.leafBit[idx[H]] };
  };
  const pilePos = (k) => ({ x: JX - 35 + (k % 6) * 14, y: JB - 9 - Math.floor(k / 6) * 13 });
  const MAXC = 36;
  let banked = 0, ones = 0, F = null, cycle = -1;
  const bank = (f) => {
    if (banked >= MAXC) { settled.textContent = ''; banked = 0; ones = 0; }
    const p = pilePos(banked);
    L.el('circle', { cx: p.x, cy: p.y, r: 6.5, fill: f.bit ? L.BLUE : L.GRAY }, settled);
    banked++; ones += f.bit;
    const frac = ones / banked;
    gauge.setAttribute('y', JB - (JB - JT) * frac); gauge.setAttribute('height', (JB - JT) * frac);
  };
  const rebuild = (c) => {
    rnd = L.prng(2027); settled.textContent = ''; banked = 0; ones = 0;
    gauge.setAttribute('height', 0);
    for (let k = 0; k < c; k++) bank(makeFuture());
    F = makeFuture();
  };

  const CYC = 3.2;
  const setState = (t) => {
    const c = Math.floor(t / CYC), u = (t % CYC) / CYC;
    if (c !== cycle) {
      if (c === cycle + 1 && F) { bank(F); F = makeFuture(); } else rebuild(c);
      cycle = c;
    }
    // 0 .. 0.55: the path unfolds, one branch per beat, a die at each branch
    // 0.55 .. 0.7: the bit appears at the leaf
    // 0.7 .. 0.9: the bit flies to the jar while the path dissolves
    const prog = Math.min(H, (u / 0.55) * H);
    const seg = Math.floor(prog), f = prog - seg;
    let d = `M ${X0} ${F.ys[0]}`;
    for (let h = 1; h <= Math.min(seg, H); h++) d += ` L ${X0 + h * dx} ${F.ys[h]}`;
    let hx = X0 + Math.min(prog, H) * dx, hy = F.ys[Math.min(seg, H)];
    if (seg < H) { hy = L.lerp(F.ys[seg], F.ys[seg + 1], f); d += ` L ${hx} ${hy}`; }
    path.setAttribute('d', d);
    dice.forEach((g, h) => {
      const shown = h < seg;
      g.setAttribute('opacity', shown ? 1 : 0);
      g.setAttribute('transform', `translate(${X0 + (h + 0.5) * dx},${Math.min(F.ys[h], F.ys[h + 1]) - 24})`);
    });
    head.setAttribute('cx', hx); head.setAttribute('cy', hy);
    head.setAttribute('opacity', u < 0.55 ? 1 : 0);
    const dissolve = L.win(u, 0.7, 0.2);
    fut.setAttribute('opacity', 1 - dissolve);
    // the bit
    const target = pilePos(banked >= MAXC ? 0 : banked);
    const fly = L.win(u, 0.7, 0.2, L.ease);
    const cx = L.lerp(X1, target.x, fly), cy = L.lerp(F.ys[H], target.y, fly) - 60 * Math.sin(Math.PI * fly);
    coin.setAttribute('opacity', u >= 0.55 && u < 0.9 ? 1 : 0);
    coin.setAttribute('transform', `translate(${cx},${cy}) scale(${L.lerp(1, 0.5, fly)})`);
    coinDot.setAttribute('fill', F.bit ? L.BLUE : L.GRAY);
    coinLab.textContent = String(F.bit);
  };
  L.timeline(svg, { T: CYC * 20.5, setState, loop: true });
})();
