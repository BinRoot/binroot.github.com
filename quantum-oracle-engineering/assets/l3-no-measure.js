// Same rank, genuinely different positions; the answer waits for an advance.
(function () {
  const svg = document.getElementById('l3-no-measure-fig');
  if (!svg) return;
  const L = window.L2, D = window.L3, root = L.el('g', {}, svg);
  const R = D.rank, boards = [D.scanBoard, D.alternate];
  L.text(root, 'Both branches have seven empty cells. Rank r = ' + R + ' is zero-based.', 380, 28, { size: 14 });
  const answer = L.el('g', { class: 'step' }, root);
  boards.forEach((board, k) => {
    const x = 75 + k * 420, y = 70;
    const B = L.board(root, { N: D.N, size: 170, x, y, board });
    L.text(root, k ? 'another branch' : 'our trace, round 2', x + 85, 54, { size: 13, weight: 700 });
    const empty = board.flatMap((v, i) => v ? [] : [i]);
    board.forEach((v, i) => { if (!v) L.text(root, String(i), x + B.cx(i), y + B.cy(i), { size: 12, mono: true, fill: L.DIM }); });
    const cell = empty[R];
    L.el('circle', { cx: x + B.cx(cell), cy: y + B.cy(cell), r: B.r + 5, fill: 'none', stroke: L.ORANGE, 'stroke-width': 3 }, answer);
    L.text(answer, 'rank ' + R + ' → cell ' + cell, x + 85, 263, { size: 14, weight: 700, fill: L.ORANGE });
  });
  L.text(root, 'Which cell', 380, 130, { size: 16, weight: 700 });
  L.text(root, 'in each branch?', 380, 153, { size: 16, weight: 700 });
  L.text(root, 'numbers label cell indices', 380, 198, { size: 11, fill: L.DIM });
  L.text(answer, 'Decode coherently: the board controls the answer; we do not measure it.', 380, 291, { size: 12.5, fill: L.DIM });
  // Keep the reveal above the boards while using the deck's normal step controls.
  root.appendChild(answer);
})();
