// l3-neighborhood.js -- slide 7: corner, edge, centre.  A highlight visits
// the three kinds of cell; its orthogonal neighbours light, and the three-qubit
// count register on the right shows the neighbour count in binary.
(function () {
  const svg = document.getElementById('l3-neighborhood-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  const N = 3, SIZE = 210, X = 70, Y = 45;
  const B = L.board(root, { N, size: SIZE, x: X, y: Y, board: [0, 0, 0, 0, 0, 0, 0, 0, 0] });
  const nb = L.sway.neighbors(N);
  const VISITS = [{ cell: 0, name: 'corner' }, { cell: 1, name: 'edge' }, { cell: 4, name: 'centre' }];
  const hl = L.el('rect', { width: SIZE / N - 6, height: SIZE / N - 6, rx: 6, fill: 'none', stroke: L.ORANGE, 'stroke-width': 3 }, root);
  const nbs = nb.flat().length ? [] : [];
  const marks = [];
  for (let i = 0; i < N * N; i++) marks.push(L.el('circle', { cx: X + B.cx(i), cy: Y + B.cy(i), r: 12, fill: L.BLUE, opacity: 0 }, root));
  // count register
  const RX = 440, RY = 120;
  L.text(root, 'friendly-neighbour count', RX + 90, RY - 40, { size: 13, fill: L.DIM });
  const bits = [2, 1, 0].map((b, k) => {
    const g = L.el('g', {}, root);
    L.el('rect', { x: RX + k * 60, y: RY - 22, width: 44, height: 44, rx: 6, fill: '#fff', stroke: L.INK, 'stroke-width': 1.5 }, g);
    const tx = L.text(g, '0', RX + k * 60 + 22, RY, { size: 20, mono: true, weight: 700 });
    L.text(g, `2${['²', '¹', '⁰'][k]}`, RX + k * 60 + 22, RY + 36, { size: 11, fill: L.DIM, mono: true });
    return tx;
  });
  const name = L.text(root, '', RX + 90, RY + 74, { size: 15, weight: 700 });
  const dec = L.text(root, '', RX + 90, RY + 98, { size: 13, fill: L.DIM });
  L.text(root, 'three qubits cover 0 to 4', RX + 90, 282, { size: 12, fill: L.DIM, italic: true });
  const setState = (t) => {
    const k = Math.min(2, Math.floor(t / 1.6));
    const v = VISITS[k], c = v.cell, d = nb[c].length;
    hl.setAttribute('x', X + B.cx(c) - (SIZE / N - 6) / 2); hl.setAttribute('y', Y + B.cy(c) - (SIZE / N - 6) / 2);
    marks.forEach((m, i) => m.setAttribute('opacity', nb[c].includes(i) ? L.win(t, k * 1.6 + 0.3, 0.4) : 0));
    const shown = t > k * 1.6 + 0.6 ? d : 0;
    bits.forEach((b, j) => { b.textContent = String((shown >> (2 - j)) & 1); });
    name.textContent = `${v.name}: ${d} neighbours`;
    dec.textContent = shown ? `count = ${d}` : '';
  };
  L.timeline(svg, { T: 4.8, setState, still: 4.7 });
})();
