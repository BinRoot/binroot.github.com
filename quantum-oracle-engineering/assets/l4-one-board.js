// l4-one-board.js -- slide 5: why three boards?
//
// Left: Lesson 3's three colour boards, one per round boundary, 27 qubits.
// Right: the shortcut, one board with an arrow back onto itself, 9 qubits.
// The two extra boards fade and the saving appears, then an orange question
// mark, because the next slide runs it.
(function () {
  if (window.__l4OneBoardInit) return; window.__l4OneBoardInit = true;
  const L = window.L2;
  document.querySelectorAll('svg.l4-one-board').forEach((svg) => {
    const root = L.el('g', {}, svg);
    const B0 = [1, 0, 0, 0, 2, 0, 0, 0, 0], B1 = [1, 2, 0, 0, 2, 0, 1, 0, 0], B2 = [1, 2, 0, 2, 1, 0, 1, 0, 2];
    const boards = [B0, B1, B2].map((b, i) => {
      const g = L.el('g', {}, root);
      L.board(g, { N: 3, size: 96, x: 40 + i * 128, y: 70, board: b });
      const lab = L.mathText(g, 88 + i * 128, 190, { base: 'color', sub: String(i), upright: true }, { size: 15, fill: L.DIM });
      if (i < 2) L.el('path', { d: `M ${140 + i * 128} 118 l 22 0 m -6 -6 l 6 6 l -6 6`, fill: 'none', stroke: L.INK, 'stroke-width': 1.6 }, g);
      return g;
    });
    const left = L.text(root, '27 qubits', 232, 224, { size: 15, weight: 700, mono: true });
    L.text(root, 'a fresh board every round', 232, 246, { size: 12.5, fill: L.DIM });
    // the one board
    const gx = 560;
    L.board(root, { N: 3, size: 96, x: gx, y: 70, board: B2 });
    L.el('path', { d: `M ${gx + 100} 84 A 30 30 0 1 1 ${gx + 100} 152`, fill: 'none', stroke: L.ORANGE, 'stroke-width': 2.2 }, root);
    L.el('polygon', { points: `${gx + 100},152 ${gx + 92},142 ${gx + 106},142`, fill: L.ORANGE }, root);
    L.text(root, '9 qubits', gx + 48, 224, { size: 15, weight: 700, mono: true });
    L.text(root, 'one board, flipped in place', gx + 48, 246, { size: 12.5, fill: L.DIM });
    const save = L.text(root, '18 qubits back', 478, 108, { size: 15, weight: 700, fill: L.GREEN, opacity: 0 });
    const q = L.text(root, '?', 478, 150, { size: 34, weight: 700, fill: L.ORANGE, opacity: 0 });
    const setState = (t) => {
      const u = L.win(t, 0.8, 0.8);
      boards[0].setAttribute('opacity', 1 - 0.75 * u);
      boards[1].setAttribute('opacity', 1 - 0.75 * u);
      save.setAttribute('opacity', L.win(t, 1.4, 0.4));
      q.setAttribute('opacity', L.win(t, 2.2, 0.4));
    };
    L.timeline(svg, { T: 2.8, setState });
  });
})();
