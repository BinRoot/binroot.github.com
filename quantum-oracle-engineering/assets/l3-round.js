// Assemble the two rounds, on the trace the local diagrams use.  Round 1's
// result stands alone at the left; round 2 is shown as its three steps, so
// the four changes between the two end states (two stones placed, two
// recoloured by the event) can each be seen happening.  The flipped cells
// carry the die that flipped them.
(function () {
  const svg = document.getElementById('l3-round-fig');
  if (!svg) return;
  const L = window.L2, D = window.L3, root = L.el('g', {}, svg);
  const r1 = D.rounds[0], r2 = D.rounds[1];
  const afterBlack = r2.start.slice(); afterBlack[r2.moves[0]] = 1;
  const SIZE = 108, Y = 52, XS = [38, 222, 406, 590];
  const boards = [
    [r1.after, 'after round 1', ''],
    [afterBlack, 'Black: rank ' + r2.ranks[0] + ' → cell ' + r2.moves[0], ''],
    [r2.before, 'White: rank ' + r2.ranks[1] + ' → cell ' + r2.moves[1], ''],
    [r2.after, 'event: two flips', '']
  ];
  boards.forEach(([b, cap], i) => {
    const B = L.board(root, { N: 3, size: SIZE, x: XS[i], y: Y, board: b });
    L.text(root, cap, XS[i] + SIZE / 2, Y + SIZE + 22, { size: 12, mono: true });
    if (i < 3) L.text(root, '→', XS[i] + SIZE + 38, Y + SIZE / 2, { size: 24, fill: L.DIM });
    if (i === 3) r2.flips.forEach((f, c) => {
      if (!f) return;
      L.el('circle', { cx: B.cx(c), cy: B.cy(c), r: B.r + 3, fill: 'none', stroke: L.ORANGE, 'stroke-width': 2.5 }, B.g);
      // the die that flipped it, beside the board on that cell's row
      L.die(B.g, SIZE + 22, B.cy(c), 12, r2.dice[c], { fill: '#fff', stroke: L.ORANGE, ink: L.ORANGE });
      L.el('line', { x1: B.cx(c) + B.r + 3, y1: B.cy(c), x2: SIZE + 9, y2: B.cy(c), stroke: L.ORANGE, 'stroke-width': 1, 'stroke-dasharray': '2 2' }, B.g);
    });
  });
  // round headings: one board for round 1, a bracket over the three of round 2
  L.text(root, 'round 1', XS[0] + SIZE / 2, 30, { size: 15, weight: 700 });
  const bx0 = XS[1], bx1 = XS[3] + SIZE;
  L.el('path', { d: `M ${bx0} 40 v -6 H ${bx1} v 6`, fill: 'none', stroke: L.DIM, 'stroke-width': 1.2 }, root);
  L.text(root, 'round 2', (bx0 + bx1) / 2, 24, { size: 15, weight: 700 });
  L.text(root, 'oracle.compose(round1, qubits=wires1, inplace=True)', 380, 240, { size: 12.5, mono: true });
  L.text(root, 'oracle.compose(round2, qubits=wires2, inplace=True)', 380, 262, { size: 12.5, mono: true });
  L.text(root, 'Fresh ranks, dice, move records, and destination colors for each round.', 380, 288, { size: 11.5, fill: L.DIM });
})();
