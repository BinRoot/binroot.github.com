// A total decoder has a defined out-of-range result, independent of preparation.
// Board and table only; the notes carry the policy discussion.
(function () {
  const svg = document.getElementById('l3-no-library-fig');
  if (!svg) return;
  const L = window.L2, root = L.el('g', {}, svg);
  const board = [1, 2, 0, 1, 2, 0, 0, 1, 2], empty = [2, 5, 6];
  const B = L.board(root, { N: 3, size: 180, x: 55, y: 55, board });
  empty.forEach((cell, r) => L.text(root, 'r' + r, 55 + B.cx(cell), 55 + B.cy(cell), { size: 13, mono: true, fill: L.ORANGE }));
  [['rank', 'index'], ['0', '2'], ['1', '5'], ['2', '6'], ['3–15', '9: sentinel → no-op']].forEach((row, i) => {
    const y = 45 + i * 39;
    L.text(root, row[0], 335, y, { size: 15, mono: i > 0, weight: i === 0 ? 700 : 400 });
    L.text(root, row[1], 485, y, { anchor: 'start', size: 15, mono: i > 0, weight: i === 0 ? 700 : 400, fill: i === 4 ? L.ORANGE : L.INK });
  });
})();
