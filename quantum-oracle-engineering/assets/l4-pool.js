// l4-pool.js -- slide 13: thirteen qubits, borrowed by every block.
//
// Left, the pool: thirteen slots.  Right, the rollout as a row of blocks
// along a time axis.  A pointer sweeps; slots fill while a block holds them
// (rank-select takes all 13, each event cell takes 8, the payoff count takes
// 9) and empty to a green zero between blocks.  Under the axis the usage
// trace draws itself.
(function () {
  if (window.__l4PoolInit) return; window.__l4PoolInit = true;
  const L = window.L2;
  const BLOCKS = [];
  for (let r = 0; r < 2; r++) {
    BLOCKS.push({ n: 'select', use: 13, w: 3 }, { n: 'place', use: 0, w: 1 }, { n: 'select', use: 13, w: 3 }, { n: 'place', use: 0, w: 1 });
    for (let c = 0; c < 9; c++) BLOCKS.push({ n: c === 0 ? 'event' : '', use: 8, w: 1, cell: true });
  }
  BLOCKS.push({ n: 'payoff', use: 9, w: 3 });
  const TOTAL = BLOCKS.reduce((s, b) => s + b.w, 0);
  document.querySelectorAll('svg.l4-pool').forEach((svg) => {
    const root = L.el('g', {}, svg);
    // the pool
    const PX = 60, PY = 40, SH = 14;
    L.text(root, 'scratch pool', PX + 24, 26, { size: 13, weight: 700 });
    const slots = []; for (let i = 0; i < 13; i++) slots.push(L.el('rect', { x: PX, y: PY + (12 - i) * (SH + 2), width: 48, height: SH, rx: 3, fill: '#eee', stroke: L.RULE, 'stroke-width': 1 }, root));
    const used = L.text(root, '0', PX + 24, PY + 13 * (SH + 2) + 16, { size: 16, mono: true, weight: 700, fill: L.GREEN });
    // the axis
    const AX0 = 170, AX1 = 720, AY = 150, sx = (u) => L.lerp(AX0, AX1, u / TOTAL);
    L.el('line', { x1: AX0, y1: AY, x2: AX1, y2: AY, stroke: L.WIRE, 'stroke-width': 1.5 }, root);
    let acc = 0;
    BLOCKS.forEach((b) => {
      const x0 = sx(acc), x1 = sx(acc + b.w);
      const col = b.n === 'payoff' ? L.GREEN : b.cell ? L.ORANGE : b.n === 'select' ? L.BLUE : L.INK;
      L.el('rect', { x: x0 + 1, y: AY - 14, width: x1 - x0 - 2, height: 28, rx: 3, fill: '#fff', stroke: col, 'stroke-width': 1.3 }, root);
      if (b.n && b.n !== 'place') L.text(root, b.n, b.cell ? x0 + 30 : (x0 + x1) / 2, AY - 24, { size: 10.5, fill: col, weight: 700 });
      b.x0 = x0; b.x1 = x1; acc += b.w;
    });
    L.text(root, 'round 1', sx(TOTAL * 0.23), 200, { size: 12, fill: L.DIM }); L.text(root, 'round 2', sx(TOTAL * 0.7), 200, { size: 12, fill: L.DIM });
    // usage trace
    const TY0 = 280, TH = 60;
    L.el('line', { x1: AX0, y1: TY0, x2: AX1, y2: TY0, stroke: L.GREEN, 'stroke-width': 1.2, 'stroke-dasharray': '3 4' }, root);
    L.text(root, 'zero', AX0 - 8, TY0, { anchor: 'end', size: 11, fill: L.GREEN });
    L.text(root, '13', AX0 - 8, TY0 - TH, { anchor: 'end', size: 11, fill: L.DIM });
    const trace = L.el('path', { fill: 'none', stroke: L.ORANGE, 'stroke-width': 2 }, root);
    const ptr = L.el('line', { x1: AX0, y1: AY - 32, x2: AX0, y2: TY0 + 4, stroke: L.ORANGE, 'stroke-width': 1.5, opacity: 0.7 }, root);
    const useAt = (x) => { for (const b of BLOCKS) if (x >= b.x0 && x < b.x1) return b.use; return 0; };
    const T = 7;
    const setState = (t) => {
      const x = L.lerp(AX0, AX1 + 8, Math.min(1, t / (T - 0.8)));
      ptr.setAttribute('x1', x); ptr.setAttribute('x2', x);
      const u = useAt(x - 0.01);
      slots.forEach((s, i) => s.setAttribute('fill', i < u ? L.ORANGE : '#eee'));
      used.textContent = String(u); used.setAttribute('fill', u ? L.ORANGE : L.GREEN);
      let d = `M ${AX0} ${TY0}`;
      for (let xx = AX0; xx <= Math.min(x, AX1); xx += 2) d += ` L ${xx} ${TY0 - TH * useAt(xx) / 13}`;
      trace.setAttribute('d', d);
    };
    L.timeline(svg, { T, setState });
  });
})();
