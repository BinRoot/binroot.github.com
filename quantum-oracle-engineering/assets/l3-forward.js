// The forward choices are implemented. Lesson 4 explains why their order matters.
(function () {
  const svg = document.getElementById('l3-forward-fig');
  if (!svg) return;
  const L = window.L2, root = L.el('g', {}, svg);
  ['round 1', 'round 2', 'payoff'].forEach((s, i) => {
    const x = 130 + i * 180;
    L.el('rect', { x, y: 28, width: 140, height: 44, rx: 8, fill: '#fff', stroke: L.INK, 'stroke-width': 1.5 }, root);
    L.text(root, s, x + 70, 50, { size: 13, weight: 700 });
  });
  L.text(root, 'A followed by A† returns the input—even for the wrong game.', 380, 109, { size: 15, weight: 700 });
  const rows = ['round semantics defined', 'old colors preserved; flips written to the next register', 'selection scratch cleared before placement', 'randomness kept in explicit registers'];
  rows.forEach((s, i) => {
    const y = 153 + i * 29;
    L.text(root, '✓', 100, y, { size: 19, fill: L.GREEN, weight: 700 });
    L.text(root, s, 125, y, { anchor: 'start', size: 14 });
  });
  L.text(root, 'Lesson 4: change the ordering and diagnose what breaks.', 380, 287, { size: 15, weight: 700, fill: L.ORANGE });
})();
