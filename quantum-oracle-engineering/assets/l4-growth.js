// l4-growth.js -- slide 20: grow the board.
//
// Total qubits, on a log axis, for the two-round oracle as built by the
// register layout of Lesson 3 at 3x3, 4x4, 5x5, 6x6, 9x9 and 19x19, with the
// scratch pool's share written on each bar; then a seventh, hatched bar for a
// full 19x19 game (181 rounds) from the register formula, which no machine
// here could build.  Bars rise one by one.
//
// Counts are from the Qiskit build: 169/13, 275/14, 407/16, 572/19, 1213/22,
// 5155/28 (qubits/scratch).  Gates at two rounds: 9.7k, 20k, 36k, 63k, 216k,
// 3.2M.  The full-game projection: 398,795 qubits, 28 scratch.
(function () {
  if (window.__l4GrowthInit) return; window.__l4GrowthInit = true;
  const L = window.L2;
  const D = [['3×3', 169, 13], ['4×4', 275, 14], ['5×5', 407, 16], ['6×6', 572, 19], ['9×9', 1213, 22], ['19×19', 5155, 28], ['19×19, full game', 398795, 28, true]];
  document.querySelectorAll('svg.l4-growth').forEach((svg) => {
    const root = L.el('g', {}, svg);
    const X0 = 90, BW = 64, GAP = 30, BASE = 250, TOP = 50, lo = Math.log10(100), hi = Math.log10(600000);
    const yOf = (v) => BASE - (BASE - TOP) * (Math.log10(v) - lo) / (hi - lo);
    [100, 1000, 10000, 100000].forEach((v) => { L.el('line', { x1: X0 - 20, y1: yOf(v), x2: 740, y2: yOf(v), stroke: L.FAINT, 'stroke-width': 1 }, root); L.text(root, v >= 1000 ? `${v / 1000}k` : String(v), X0 - 26, yOf(v), { anchor: 'end', size: 11, fill: L.DIM, mono: true }); });
    L.text(root, 'qubits, two rounds', 380, 24, { size: 14, weight: 700 });
    const hatch = L.el('pattern', { id: 'l4-hatch', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, root);
    L.el('rect', { width: 6, height: 6, fill: '#fff' }, hatch); L.el('rect', { width: 3, height: 6, fill: L.GRAY }, hatch);
    const bars = D.map(([name, q, s, proj], i) => {
      const x = X0 + i * (BW + GAP);
      const g = L.el('g', {}, root);
      const r = L.el('rect', { x, y: BASE, width: BW, height: 0, fill: proj ? 'url(#l4-hatch)' : L.BLUE, stroke: proj ? L.GRAY : 'none', 'stroke-width': 1.2, opacity: 0.9 }, g);
      const lab = L.el('g', { opacity: 0 }, g);
      L.text(lab, q.toLocaleString('en-US'), x + BW / 2, yOf(q) - 12, { size: 12.5, mono: true, weight: 700, fill: proj ? L.DIM : L.INK });
      L.text(lab, `${s} scratch`, x + BW / 2, yOf(q) - 27, { size: 10.5, fill: L.ORANGE, weight: 700 });
      L.text(g, name, x + BW / 2, BASE + 16, { size: proj ? 10.5 : 12, fill: proj ? L.DIM : L.INK, weight: 700 });
      if (proj) L.text(g, 'projected', x + BW / 2, BASE + 30, { size: 10, fill: L.DIM, italic: true });
      return { r, lab, x, h: BASE - yOf(q) };
    });
    L.text(root, 'records grow with cells × rounds; scratch with the logarithm of cells', 380, 296, { size: 12.5, fill: L.DIM, italic: true });
    const setState = (t) => bars.forEach((b, i) => { const u = L.win(t, 0.2 + i * 0.35, 0.6, L.outQuart); b.r.setAttribute('height', b.h * u); b.r.setAttribute('y', BASE - b.h * u); b.lab.setAttribute('opacity', u >= 1 ? 1 : 0); });
    L.timeline(svg, { T: 3.6, setState });
  });
})();
