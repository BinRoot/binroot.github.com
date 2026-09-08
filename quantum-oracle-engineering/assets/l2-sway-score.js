(function () {
  const svg = document.getElementById('l2-score-fig');
  if (!svg) return;
  const L = window.L2, root = L.el('g', {}, svg);
  const cases = [[6, 4], [4, 6], [5, 5]].map(([b, w], k) => {
    const x = 150 + 300 * k;
    L.text(root, ['Black ahead', 'White ahead', 'A tie'][k], x, 22, { size: 22, weight: 600 });
    const board = L.board(root, { N: 4, size: 148, x: x - 74, y: 52 });
    const cells = [0, 5, 10, 3, 12, 7, 1, 6, 11, 14];
    let bi = 0, wi = 0;
    const stones = cells.map((cell, i) => {
      const color = i < b ? 1 : 2, n = color === 1 ? bi++ : wi++;
      const from = [x - 74 + board.cx(cell), 52 + board.cy(cell)];
      const to = [x - 85 + n * 29, color === 1 ? 235 : 270];
      return { node: L.stone(root, ...from, 13, color), from, to };
    });
    const counts = L.el('g', {}, root);
    L.text(counts, String(b), x + 106, 235, { size: 20, weight: 700 });
    L.text(counts, String(w), x + 106, 270, { size: 20, weight: 700 });
    const result = L.el('g', {}, root);
    L.el('rect', { x: x - 95, y: 301, width: 190, height: 35, rx: 17, fill: b > w ? L.BLUE : '#e7e5df' }, result);
    L.text(result, `payoff  ${b > w ? 1 : 0}`, x, 319, { size: 23, weight: 700, fill: b > w ? '#fff' : L.INK });
    return { stones, counts, result };
  });
  L.beats(svg, {
    stops: [0, 1, 2, 3], labels: ['Three final boards', 'Count the stones', 'Score the wins', 'Reveal the tie'],
    draw: (t) => cases.forEach((c, k) => {
      const u = L.clamp01(t);
      c.stones.forEach(({ node, from, to }) => {
        node.setAttribute('cx', L.lerp(from[0], to[0], u));
        node.setAttribute('cy', L.lerp(from[1], to[1], u));
      });
      c.counts.setAttribute('opacity', u);
      c.result.setAttribute('opacity', L.clamp01(t - (k === 2 ? 2 : 1)));
    })
  });
})();
