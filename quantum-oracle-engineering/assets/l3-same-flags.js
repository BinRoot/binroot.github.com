// l3-same-flags.js -- slide 20: the centre stone and its four neighbours.
// One by one, each neighbour is tested: both occupied and the same colour
// sets a flag; every set flag increments the three-qubit count.
(function () {
  const svg = document.getElementById('l3-same-flags-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  const N = 3, X = 60, Y = 45, SIZE = 210;
  const BOARD = [0, 1, 0, 0, 1, 2, 0, 1, 0];        // centre black; up black, right white, down black, left empty
  const B = L.board(root, { N, size: SIZE, x: X, y: Y, board: BOARD });
  const nb = L.sway.neighbors(N)[4];
  const ring = L.el('circle', { cx: X + B.cx(4), cy: Y + B.cy(4), r: B.r + 4, fill: 'none', stroke: L.ORANGE, 'stroke-width': 3 }, root);
  const probe = L.el('circle', { r: B.r + 4, fill: 'none', stroke: L.BLUE, 'stroke-width': 2.5, 'stroke-dasharray': '5 3', opacity: 0 }, root);
  const RX = 420;
  L.text(root, 'same-colour flags', RX + 100, 50, { size: 13, fill: L.DIM });
  const flags = nb.map((j, k) => { const g = L.el('g', {}, root);
    L.el('rect', { x: RX + k * 50, y: 64, width: 40, height: 34, rx: 6, fill: '#fff', stroke: L.INK, 'stroke-width': 1.4 }, g);
    const tx = L.text(g, '0', RX + k * 50 + 20, 81, { size: 16, mono: true, weight: 700 });
    L.text(g, ['up', 'down', 'left', 'right'][k], RX + k * 50 + 20, 112, { size: 10, fill: L.DIM });
    return { tx, rect: g.firstChild }; });
  L.text(root, 'count', RX + 100, 156, { size: 13, fill: L.DIM });
  const bits = [0, 1, 2].map((k) => { L.el('rect', { x: RX + 30 + k * 50, y: 170, width: 40, height: 40, rx: 6, fill: '#fff', stroke: L.INK, 'stroke-width': 1.5 }, root);
    return L.text(root, '0', RX + 30 + k * 50 + 20, 190, { size: 18, mono: true, weight: 700 }); });
  const cap = L.text(root, '', RX + 100, 250, { size: 14, weight: 700, opacity: 0 });
  const rule = L.text(root, 'both occupied, colours equal', RX + 100, 276, { size: 12, fill: L.DIM, italic: true });
  const STEP = 0.9;
  L.timeline(svg, { T: STEP * 4 + 1.2, setState: (t) => {
    const k = Math.min(3, Math.floor(t / STEP));
    let c = 0;
    nb.forEach((j, i) => {
      const done = t >= (i + 1) * STEP - 0.15;
      const same = BOARD[j] === BOARD[4];
      flags[i].tx.textContent = done && same ? '1' : '0';
      flags[i].rect.setAttribute('fill', done && same ? '#eaf4ec' : '#fff');
      if (done && same) c++;
    });
    const j = nb[k];
    probe.setAttribute('cx', X + B.cx(j)); probe.setAttribute('cy', Y + B.cy(j)); probe.setAttribute('opacity', t < STEP * 4 ? 1 : 0);
    bits.forEach((b, i) => b.textContent = String((c >> (2 - i)) & 1));
    cap.textContent = t >= STEP * 4 ? `c = ${c} friends` : ''; cap.setAttribute('opacity', t >= STEP * 4 ? 1 : 0);
  } });
})();
