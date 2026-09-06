// l3-scratch.js -- slide 24: the event's scratch pool.  Four same-colour
// flags, a three-qubit count, five comparison flags, one work qubit: thirteen
// qubits that fill while a cell is being decided and empty before the next.
// A pointer walks the nine cells; a counter tallies the reuse.
(function () {
  const svg = document.getElementById('l3-scratch-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  const N = 3, X = 50, Y = 60, SIZE = 180;
  const BOARD = [1, 2, 0, 1, 1, 2, 0, 2, 1];
  const B = L.board(root, { N, size: SIZE, x: X, y: Y, board: BOARD });
  const ptr = L.el('rect', { width: SIZE / N - 6, height: SIZE / N - 6, rx: 6, fill: 'none', stroke: L.ORANGE, 'stroke-width': 3 }, root);
  const GROUPS = [['same', 4, L.GREEN], ['count', 3, L.BLUE], ['die <', 5, L.PURPLE], ['work', 1, L.ORANGE]];
  const PX = 300, PY = 90;
  const boxes = []; let x = PX;
  GROUPS.forEach(([name, n, col]) => {
    L.text(root, name, x + (n * 30) / 2 - 4, PY - 18, { size: 12, fill: L.DIM });
    for (let i = 0; i < n; i++) { boxes.push({ r: L.el('rect', { x, y: PY, width: 24, height: 40, rx: 5, fill: '#fff', stroke: col, 'stroke-width': 1.5 }, root), col }); x += 30; }
    x += 14;
  });
  L.text(root, '13 qubits of scratch', PX + 200, PY + 66, { size: 14, weight: 700 });
  const state = L.text(root, '', PX + 200, PY + 92, { size: 13, fill: L.DIM });
  const reuse = L.text(root, 'reused 0 times', PX + 200, PY + 150, { size: 20, mono: true, weight: 700 });
  const STEP = 0.7;
  L.timeline(svg, { T: STEP * 9 + 0.8, setState: (t) => {
    const k = Math.min(8, Math.floor(t / STEP)), u = (t - k * STEP) / STEP;
    ptr.setAttribute('x', X + B.cx(k) - (SIZE / N - 6) / 2); ptr.setAttribute('y', Y + B.cy(k) - (SIZE / N - 6) / 2);
    const full = u > 0.2 && u < 0.7 && t < STEP * 9;
    boxes.forEach((b) => b.r.setAttribute('fill', full ? b.col : '#fff'));
    state.textContent = t >= STEP * 9 ? 'all clean' : full ? `cell ${k}: computing` : `cell ${k}: emptied`;
    reuse.textContent = `reused ${Math.min(9, Math.floor(t / STEP) + (u > 0.7 ? 1 : 0))} times`;
  } });
})();
