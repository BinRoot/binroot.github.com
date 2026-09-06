// l3-board-copies.js -- slide 6: a fresh board every round.
//
// Top: the classical habit, one board rewritten in place.  Its stones change
// through the rounds on the same eighteen qubits, then the whole thing is
// struck through.  Below: the rule, three boards side by side, start, after
// round 1, after round 2, each its own eighteen qubits.
(function () {
  const svg = document.getElementById('l3-board-copies-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  const N = 3;
  const STATES = [[0, 1, 0, 0, 2, 0, 1, 0, 0], [0, 1, 0, 0, 2, 1, 1, 0, 2], [2, 1, 0, 0, 2, 1, 1, 1, 2]];
  // the habit: one board, rewritten
  const H = L.board(root, { N, size: 86, x: 70, y: 18, board: STATES[0] });
  const hlab = L.text(root, 'one board, rewritten', 176, 44, { anchor: 'start', size: 13, fill: L.DIM });
  const hsub = L.text(root, 'start', 176, 66, { anchor: 'start', size: 12, mono: true, fill: L.DIM });
  const strike = L.el('line', { x1: 66, y1: 108, x2: 160, y2: 14, stroke: L.RED, 'stroke-width': 3.5, 'stroke-linecap': 'round', opacity: 0 }, root);
  // the rule: three boards
  const boards = STATES.map((b, i) => {
    const g = L.el('g', { opacity: 0 }, root);
    const x = 100 + i * 220;
    L.board(g, { N, size: 130, x, y: 130, board: b });
    L.text(g, ['start', 'after round 1', 'after round 2'][i], x + 65, 282, { size: 14, weight: 700 });
    L.text(g, i === 0 ? '18 qubits' : '+18 qubits', x + 65, 122, { size: 12, mono: true, fill: i === 0 ? L.DIM : L.BLUE });
    if (i > 0) { L.el('line', { x1: x - 80, y1: 195, x2: x - 12, y2: 195, stroke: L.INK, 'stroke-width': 2 }, g); L.el('polygon', { points: `${x - 10},195 ${x - 20},189 ${x - 20},201`, fill: L.INK }, g); }
    return g;
  });
  L.timeline(svg, { T: 4.6, setState: (t) => {
    // the habit board rewrites itself: state 0 at t<0.8, 1 at t<1.6, 2 after
    const k = t < 0.8 ? 0 : t < 1.6 ? 1 : 2;
    H.redraw(STATES[k]);
    hsub.textContent = ['start', 'round 1 written over it', 'round 2 written over it'][k];
    strike.setAttribute('opacity', L.win(t, 2.2, 0.3));
    boards.forEach((g, i) => g.setAttribute('opacity', L.win(t, 2.6 + i * 0.5, 0.5)));
  } });
})();
