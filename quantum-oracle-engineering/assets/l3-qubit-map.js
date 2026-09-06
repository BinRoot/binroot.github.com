// l3-qubit-map.js -- slide 30: one stacked bar of 169 qubits by register
// group, growing group by group, then the gate and depth counts beneath.
// Groups, read off the build's register list: dice 90 (9 cells x 2 rounds
// x 5), boards 36 (occupancy plus three colour boards), move records 16
// (4 placements x 4 bits), ranks 13 (4 + 3 + 3 + 3), the shared
// scratch pool 13 (rank-select's flag, prefix, equality and index bits;
// the event borrows 8 of them per cell), payoff 1.
(function () {
  const svg = document.getElementById('l3-qubit-map-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  const G = [['dice', 90, L.PURPLE], ['boards', 36, L.WOOD], ['move records', 16, L.GOLD], ['ranks', 13, L.BLUE], ['scratch', 13, L.ORANGE], ['payoff', 1, L.GREEN]];
  const TOTAL = G.reduce((s, g) => s + g[1], 0);
  const X0 = 60, X1 = 700, Y = 90, H = 56;
  const segs = []; let acc = 0;
  G.forEach(([name, n, col], i) => {
    const x = X0 + (X1 - X0) * acc / TOTAL, w = (X1 - X0) * n / TOTAL;
    const r = L.el('rect', { x, y: Y, width: 0, height: H, fill: col, opacity: 0.85 }, root);
    const lab = L.el('g', { opacity: 0 }, root);
    const lx = X0 + i * 108 + 4;
    L.el('rect', { x: lx, y: Y + H + 22, width: 14, height: 14, rx: 3, fill: col }, lab);
    L.text(lab, `${name} ${n}`, lx + 22, Y + H + 29, { anchor: 'start', size: 13, weight: 700, fill: col === L.WOOD || col === L.GOLD ? L.WOODLINE : col });
    segs.push({ r, lab, w }); acc += n;
  });
  const total = L.text(root, '', 380, 216, { size: 26, mono: true, weight: 700, opacity: 0 });
  const gates = L.text(root, '9,768 gates · depth 3,079', 380, 252, { size: 16, mono: true, opacity: 0 });
  const note = L.text(root, 'counted before decomposition to a native gate set', 380, 276, { size: 12, fill: L.DIM, italic: true, opacity: 0 });
  L.timeline(svg, { T: 4.2, setState: (t) => {
    segs.forEach((s, i) => { const u = L.win(t, 0.3 + i * 0.45, 0.5, L.outQuart); s.r.setAttribute('width', s.w * u); s.lab.setAttribute('opacity', u >= 1 ? 1 : 0); });
    total.textContent = `${TOTAL} qubits`; total.setAttribute('opacity', L.win(t, 2.7, 0.4));
    gates.setAttribute('opacity', L.win(t, 3.2, 0.4)); note.setAttribute('opacity', L.win(t, 3.5, 0.4));
  } });
})();
