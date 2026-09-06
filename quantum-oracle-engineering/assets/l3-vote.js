// l3-vote.js -- the two hands-up votes and the answer to the first.
//
//   data-mode="line"     which line is hardest to make coherent (A..D)
//   data-mode="qubits"   how many qubits for 3x3, two rounds
//   data-mode="answer"   the four lines again, each with its verdict; B wins
(function () {
  if (window.__l3VoteInit) return;
  window.__l3VoteInit = true;
  const L = window.L2;
  const OPTS = {
    line: ['roll a d20', 'pick a random empty cell', 'count the friendly neighbors', 'black > white'],
    qubits: ['about 30', 'about 100', 'about 170', 'about 500'],
    answer: ['roll a d20', 'pick a random empty cell', 'count the friendly neighbors', 'black > white']
  };
  const VERDICT = [
    ['bookkeeping', '90 qubits, cheap gates', L.DIM],
    ['the hard one', 'no block to buy: a new primitive', L.GREEN],
    ['routine', 'flags and a counter', L.DIM],
    ['expensive, but off the shelf', 'the costliest block at this size', L.ORANGE]
  ];
  document.querySelectorAll('svg.l3-vote').forEach((svg) => {
    const mode = svg.dataset.mode || 'line';
    const root = L.el('g', {}, svg);
    const rows = OPTS[mode].map((s, i) => {
      const g = L.el('g', { opacity: 0 }, root);
      const y = 48 + i * 62, x = mode === 'answer' ? 60 : 200;
      const win = mode === 'answer' && i === 1;
      if (win) L.el('rect', { x: x - 30, y: y - 24, width: 660, height: 48, rx: 10, fill: '#eaf4ec', stroke: L.GREEN, 'stroke-width': 2 }, g);
      L.el('circle', { cx: x, cy: y, r: 17, fill: win ? L.GREEN : '#fff', stroke: win ? L.GREEN : L.INK, 'stroke-width': 1.5 }, g);
      L.text(g, 'ABCD'[i], x, y, { size: 15, weight: 700, mono: true, fill: win ? '#fff' : L.INK });
      L.text(g, s, x + 34, y, { anchor: 'start', size: 18, mono: mode !== 'qubits', weight: win ? 700 : 400 });
      if (mode === 'answer') {
        const [v, why, col] = VERDICT[i];
        L.text(g, v, 430, y - 8, { anchor: 'start', size: 14, weight: 700, fill: col });
        L.text(g, why, 430, y + 11, { anchor: 'start', size: 11.5, fill: L.DIM });
      }
      return g;
    });
    if (mode !== 'answer') L.text(root, 'hands up', 380, 292, { size: 13, fill: L.DIM, italic: true });
    L.timeline(svg, { T: 2.4, setState: (t) => rows.forEach((g, i) => g.setAttribute('opacity', L.win(t, 0.2 + i * 0.35, 0.4))) });
  });
})();
