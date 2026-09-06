// l3-payoff-compare.js -- slide 28: black > white, in superposition, as a grid of value pairs.
// Every cell of the 10x10 grid is one (black, white) pair; the 45 above the
// diagonal are the patterns that fire the payoff qubit, the diagonal is the
// ties, and the 45 below stay dark.  The current board's pair lights last.
(function () {
  const svg = document.getElementById('l3-payoff-compare-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  const K = 10, S = 20, X = 130, Y = 40, CUR = [5, 3];
  L.text(root, 'white count', X + K * S / 2, Y - 18, { size: 12, fill: L.DIM });
  const yl = L.text(root, 'black count', 0, 0, { size: 12, fill: L.DIM }); yl.setAttribute('transform', `translate(${X - 26},${Y + K * S / 2}) rotate(-90)`);
  const cells = [];
  for (let b = 0; b < K; b++) for (let w = 0; w < K; w++) {
    const r = L.el('rect', { x: X + w * S + 1, y: Y + b * S + 1, width: S - 2, height: S - 2, rx: 3, fill: '#f3f3f3' }, root);
    cells.push({ r, b, w });
  }
  for (let i = 0; i < K; i++) { L.text(root, String(i), X + i * S + S / 2, Y + K * S + 12, { size: 9.5, mono: true, fill: L.DIM }); L.text(root, String(i), X - 10, Y + i * S + S / 2, { size: 9.5, mono: true, fill: L.DIM }); }
  const cur = L.el('rect', { x: X + CUR[1] * S - 1, y: Y + CUR[0] * S - 1, width: S + 2, height: S + 2, rx: 4, fill: 'none', stroke: L.ORANGE, 'stroke-width': 3, opacity: 0 }, root);
  const TX = 420;
  const n1 = L.text(root, '', TX, 80, { anchor: 'start', size: 15, weight: 700, opacity: 0 });
  const n3 = L.text(root, '', TX, 106, { anchor: 'start', size: 13, fill: L.DIM, opacity: 0 });
  const pay = L.el('g', { opacity: 0 }, root);
  L.el('rect', { x: TX, y: 170, width: 150, height: 44, rx: 10, fill: '#eaf4ec', stroke: L.GREEN, 'stroke-width': 2 }, pay);
  L.text(pay, 'payoff = 1', TX + 75, 192, { size: 15, mono: true, weight: 700, fill: L.GREEN });
  L.text(pay, `black ${CUR[0]} > white ${CUR[1]}`, TX + 75, 232, { size: 12.5, fill: L.DIM });
  L.timeline(svg, { T: 4.0, setState: (t) => {
    const u = L.win(t, 0.3, 1.4);
    cells.forEach((c, i) => { const on = c.b > c.w, tie = c.b === c.w; const reached = i / cells.length <= u;
      c.r.setAttribute('fill', !reached ? '#f3f3f3' : on ? L.BLUE : tie ? L.FAINT : '#f3f3f3'); c.r.setAttribute('opacity', on ? 0.85 : 1); });
    n1.textContent = 'every pair of totals is a branch'; n1.setAttribute('opacity', L.win(t, 1.8, 0.4));
    n3.textContent = '45 blue pairs must flip the payoff; ties must not'; n3.setAttribute('opacity', L.win(t, 2.2, 0.4));
    cur.setAttribute('opacity', L.win(t, 2.8, 0.4)); pay.setAttribute('opacity', L.win(t, 3.2, 0.4));
  } });
})();
