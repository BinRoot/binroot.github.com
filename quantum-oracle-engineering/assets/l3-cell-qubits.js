// l3-cell-qubits.js -- slide 5: two qubits per cell.  The board on the left
// explodes, cell by cell, into a matching 3x3 grid on the right where every
// cell is a pair of qubit boxes: occupied, then colour.  Same layout on both
// sides, so the eye maps cell to pair without reading a table.
(function () {
  const svg = document.getElementById('l3-cell-qubits-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  const N = 3, BOARD = [0, 1, 0, 0, 2, 0, 1, 0, 0];
  const B = L.board(root, { N, size: 210, x: 40, y: 45, board: BOARD });
  // the register grid: each cell a pair of boxes
  const GX = 380, GY = 62, CELL = 108, BW = 40, BH = 40;
  L.text(root, 'occupied', GX + 22, GY - 22, { anchor: 'start', size: 12, fill: L.DIM });
  L.text(root, 'colour', GX + 22 + BW + 8, GY - 22, { anchor: 'start', size: 12, fill: L.DIM });
  const pairs = BOARD.map((v, i) => {
    const r = Math.floor(i / N), c = i % N;
    const x = GX + c * CELL, y = GY + r * 74;
    const g = L.el('g', { opacity: 0 }, root);
    const occ = v ? 1 : 0, col = v === 2 ? 1 : 0;
    L.el('rect', { x: x + 22, y, width: BW, height: BH, rx: 7, fill: occ ? L.INK : '#fff', stroke: L.INK, 'stroke-width': 1.5 }, g);
    L.text(g, String(occ), x + 22 + BW / 2, y + BH / 2, { size: 18, mono: true, weight: 700, fill: occ ? '#fff' : L.INK });
    L.el('rect', { x: x + 22 + BW + 8, y, width: BW, height: BH, rx: 7, fill: !occ ? '#f4f2ec' : col ? '#fff' : L.INK, stroke: occ ? L.INK : L.RULE, 'stroke-width': 1.5, 'stroke-dasharray': occ ? null : '4 3' }, g);
    L.text(g, occ ? String(col) : '·', x + 22 + BW + 8 + BW / 2, y + BH / 2, { size: 18, mono: true, weight: 700, fill: !occ ? L.GRAY : col ? L.INK : '#fff' });
    L.text(g, `cell ${i}`, x + 22 + BW + 4, y + BH + 13, { size: 10, mono: true, fill: L.DIM });
    return { g, i };
  });
  const flyer = L.el('circle', { r: 10, fill: L.ORANGE, opacity: 0 }, root);
  const total = L.text(root, '', 145, 282, { size: 16, weight: 700, mono: true, opacity: 0 });
  L.text(root, 'colour reads 0 black, 1 white, and means nothing while empty', 380 + 160, 292, { size: 11, fill: L.DIM, italic: true });
  const STEP = 0.32;
  L.timeline(svg, { T: STEP * 9 + 0.8, setState: (t) => {
    let n = 0;
    pairs.forEach((p, i) => { const o = L.win(t, 0.2 + i * STEP, 0.25); p.g.setAttribute('opacity', o); if (o >= 1) n++; });
    const k = Math.min(8, Math.floor(Math.max(0, t - 0.2) / STEP)), f = L.clamp01((t - 0.2 - k * STEP) / STEP);
    const r = Math.floor(k / N), c = k % N;
    flyer.setAttribute('cx', L.lerp(40 + B.cx(k), GX + c * CELL + 22 + BW + 4, L.ease(f)));
    flyer.setAttribute('cy', L.lerp(45 + B.cy(k), GY + r * 74 + BH / 2, L.ease(f)) - 30 * Math.sin(Math.PI * f));
    flyer.setAttribute('opacity', t > 0.2 && t < 0.2 + 9 * STEP ? 0.8 : 0);
    total.textContent = `${2 * n} qubits`; total.setAttribute('opacity', n > 0 ? 1 : 0);
  } });
})();
