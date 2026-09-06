// flip-table.js -- slide 27: friends make a stone harder to sway.
//
// One centre stone gains friendly orthogonal neighbours, zero through four.
// Beside it a d20 shows the flip threshold stepping 4/20, 3/20, 2/20, 1/20,
// 0/20: the die faces that would flip the stone are shaded.  Edge and corner
// cells cannot reach four friends, which the small corner inset says
// without words.
(function () {
  const svg = document.getElementById('flip-table-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  // mini 3x3 board with the centre stone
  const B = L.board(root, { N: 3, size: 180, x: 40, y: 50 });
  const center = 4, around = [1, 7, 3, 5];
  // threshold column: five rows, one per c
  const rows = [0, 1, 2, 3, 4].map((c) => {
    const y = 58 + c * 46;
    const g = L.el('g', {}, root);
    L.text(g, `${c} friend${c === 1 ? '' : 's'}`, 300, y, { anchor: 'start', size: 14, mono: true });
    // 20 faces as a strip: shaded ones flip
    for (let f = 0; f < 20; f++) {
      L.el('rect', { x: 400 + f * 13, y: y - 9, width: 11, height: 18, rx: 2, fill: f < 4 - c ? L.ORANGE : '#eceef2', stroke: L.RULE, 'stroke-width': 0.6 }, g);
    }
    L.text(g, `${4 - c}/20`, 690, y, { anchor: 'start', size: 15, mono: true, weight: 700, fill: 4 - c ? L.ORANGE : L.GREEN });
    return g;
  });
  const marker = L.el('rect', { x: 290, width: 450, height: 40, rx: 8, fill: L.GOLD, opacity: 0.25 }, root);
  root.insertBefore(marker, rows[0]);
  const die = L.die(root, 130, 268, 22, null, {});
  // inset: a corner cell can have at most 2 neighbours
  const inset = L.el('g', { transform: 'translate(220,240)' }, root);
  L.board(inset, { N: 3, size: 60, x: 0, y: 0, board: [1, 1, 0, 1, 0, 0, 0, 0, 0] });
  L.text(inset, 'corner: 2 at most', 30, 74, { size: 11, fill: L.DIM });

  const setState = (t) => {
    const c = Math.min(4, Math.floor(t / 1.0));
    const board = new Uint8Array(9);
    board[center] = 1;
    for (let k = 0; k < c; k++) board[around[k]] = 1;
    B.redraw(board);
    marker.setAttribute('y', 58 + c * 46 - 20);
    rows.forEach((r, i) => r.setAttribute('opacity', i === c ? 1 : 0.5));
    // the die shows a face; shade it when it would flip
    const face = [3, 2, 1, 6, 9][c];
    die.textContent = '';
    L.die(root, 0, 0, 0, null, {});
    const flips = face - 1 < 4 - c;
    const d2 = L.die(die, 0, 0, 22, face, { fill: flips ? L.ORANGE : '#fff', ink: flips ? '#fff' : L.INK });
  };
  L.timeline(svg, { T: 5.4, setState });
})();
