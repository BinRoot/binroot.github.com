// Separate the random-rollout benchmark from a candidate action's value.
(function () {
  const svg = document.getElementById('l3-contract-fig');
  if (!svg) return;
  const L = window.L2, root = L.el('g', {}, svg);
  const cards = [
    ['input', 'empty 3 × 3 board', 'two rounds', 'ranks + dice in registers'],
    ['rollout A', 'place → event', 'place → event', 'count the final colors'],
    ['output', 'one payoff bit', '1 when Black > White', 'scratch 0; records retained']
  ];
  cards.forEach((lines, i) => {
    const x = 25 + i * 255;
    L.el('rect', { x, y: 32, width: 220, height: 148, rx: 10, fill: '#fff', stroke: L.RULE, 'stroke-width': 1.5 }, root);
    lines.forEach((s, j) => L.text(root, s, x + 110, 57 + j * 32, { size: j ? 13 : 17, weight: j ? 400 : 700, fill: j === 0 ? L.BLUE : L.INK }));
    if (i < 2) L.text(root, '→', x + 237, 105, { size: 24 });
  });
  L.text(root, 'Today: both players choose uniformly among legal cells.', 380, 220, { size: 15, weight: 700 });
  L.text(root, 'To evaluate action i: supply that first move, then randomize the continuation.', 380, 249, { size: 13, fill: L.DIM });
  L.text(root, 'The benchmark win rate is an average over first moves.', 380, 278, { size: 13, fill: L.DIM, italic: true });
})();
