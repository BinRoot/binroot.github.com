// go-deterministic.js -- unused since the deterministic-rules slide folded into solver-dice; formerly: the rules do not roll dice.
//
// One Go position, one move, and the same next position every time: the
// board is copied three times, the stone lands in each, and each copy comes
// out identical.  The blue task-die slot beside the boards stays empty.
(function () {
  const svg = document.getElementById('go-deterministic-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  const N = 7, S = 150;
  const STONES = [[1, 2, 1], [2, 2, 2], [3, 3, 1], [2, 4, 2], [4, 1, 1], [1, 5, 2], [5, 4, 1], [4, 5, 2]];
  const MOVE = [3, 2];

  const goBoard = (x, y) => {
    const g = L.el('g', { transform: `translate(${x},${y})` }, root);
    L.el('rect', { x: 0, y: 0, width: S, height: S, rx: 5, fill: L.WOOD, stroke: L.WOODLINE }, g);
    const cell = S / N, pad = cell / 2;
    for (let i = 0; i < N; i++) {
      L.el('line', { x1: pad + i * cell, y1: pad, x2: pad + i * cell, y2: S - pad, stroke: L.WOODLINE, 'stroke-width': 1 }, g);
      L.el('line', { x1: pad, y1: pad + i * cell, x2: S - pad, y2: pad + i * cell, stroke: L.WOODLINE, 'stroke-width': 1 }, g);
    }
    STONES.forEach(([r, c, col]) => L.stone(g, pad + c * cell, pad + r * cell, cell * 0.42, col));
    const mv = L.stone(g, pad + MOVE[1] * cell, pad + MOVE[0] * cell, cell * 0.42, 1, { opacity: 0, stroke: L.ORANGE, 'stroke-width': 2.5 });
    return { g, mv };
  };
  const before = goBoard(40, 60);
  const copies = [0, 1, 2].map((i) => goBoard(300, 10 + i * 100));
  copies.forEach((c) => c.g.setAttribute('opacity', 0));
  L.text(root, 'next position, every time', 375, 300, { size: 13, fill: L.DIM });
  // arrows
  const arrows = [0, 1, 2].map((i) => L.el('path', { d: `M 200 135 C 240 135, 250 ${85 + i * 100}, 292 ${85 + i * 100}`, fill: 'none', stroke: L.WIRE, 'stroke-width': 2, opacity: 0 }, root));
  // the empty die slot
  const slot = L.el('g', { transform: 'translate(600,150)' }, root);
  L.el('rect', { x: -60, y: -60, width: 120, height: 120, rx: 12, fill: 'none', stroke: L.BLUE, 'stroke-width': 2, 'stroke-dasharray': '8 6' }, slot);
  L.die(slot, 0, -6, 34, null, { fill: 'none', stroke: L.FAINT });
  L.text(slot, 'task dice', 0, 44, { size: 13, fill: L.BLUE });
  const none = L.text(slot, 'none', 0, -6, { size: 16, fill: L.GRAY, weight: 700, opacity: 0 });

  const setState = (t) => {
    before.mv.setAttribute('opacity', L.win(t, 0.3, 0.3));
    copies.forEach((c, i) => {
      const u = L.win(t, 0.9 + i * 0.35, 0.5);
      c.g.setAttribute('opacity', u);
      c.mv.setAttribute('opacity', u);
      arrows[i].setAttribute('opacity', u);
    });
    none.setAttribute('opacity', L.win(t, 2.4, 0.4));
  };
  L.timeline(svg, { T: 3.2, setState });
})();
