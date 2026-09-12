// The generic comparator has 45 winning patterns. Only pairs with total
// occupancy four can occur in this two-round example. Highlight our (3,1).
(function () {
  const svg = document.getElementById('l3-payoff-compare-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  const K = 10, S = 20, X = 130, Y = 40, CUR = [window.L3.black, window.L3.white];
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
  L.text(root, 'A truth table includes inputs absent from this rollout.', 380, 285, { size: 12, fill: L.DIM, italic: true });
  const pay = L.el('g', { opacity: 0 }, root);
  L.el('rect', { x: TX, y: 170, width: 150, height: 44, rx: 10, fill: '#eaf4ec', stroke: L.GREEN, 'stroke-width': 2 }, pay);
  L.text(pay, 'payoff = 1', TX + 75, 192, { size: 15, mono: true, weight: 700, fill: L.GREEN });
  L.text(pay, `black ${CUR[0]} > white ${CUR[1]}`, TX + 75, 232, { size: 12.5, fill: L.DIM });
  L.timeline(svg, { T: 4.0, setState: (t) => {
    const u = L.win(t, 0.3, 1.4);
    cells.forEach((c, i) => { const on = c.b > c.w, tie = c.b === c.w; const reached = i / cells.length <= u;
      c.r.setAttribute('fill', !reached ? '#f3f3f3' : on ? L.BLUE : tie ? L.FAINT : '#f3f3f3'); c.r.setAttribute('opacity', c.b + c.w === 4 ? 1 : 0.18);
      c.r.setAttribute('stroke', c.b + c.w === 4 ? L.INK : 'none'); });
    n1.textContent = 'generic comparator: 45 winning patterns'; n1.setAttribute('opacity', L.win(t, 1.8, 0.4));
    n3.textContent = 'outlined pairs have black + white = 4'; n3.setAttribute('opacity', L.win(t, 2.2, 0.4));
    cur.setAttribute('opacity', L.win(t, 2.8, 0.4)); pay.setAttribute('opacity', L.win(t, 3.2, 0.4));
  } });
})();
