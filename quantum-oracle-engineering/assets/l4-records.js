// l4-records.js -- slide 12: keep what the outcome does not determine.
//
// Two columns.  Records: registers the inverse will have to read, because the
// board after a step does not determine them.  Scratch: temporary results uncomputed while their
// inputs are still available, before another block borrows the pool.  Rows fade in.
(function () {
  if (window.__l4RecordsInit) return; window.__l4RecordsInit = true;
  const L = window.L2;
  const REC = [['dice', 90, 'the randomness'], ['boards', 36, 'occupancy and three colour boards'], ['move indices', 16, 'four placements'], ['ranks', 13, 'four rank registers']];
  const SCR = [['prefix counter', 4, 'empties so far'], ['equality bits', 4, 'counter = rank?'], ['temporary index', 4, 'copied to a retained move record'], ['flag', 1, 'one match found']];
  document.querySelectorAll('svg.l4-records').forEach((svg) => {
    const root = L.el('g', {}, svg);
    const col = (x, title, sub, rows, colour) => {
      const g = L.el('g', {}, root);
      L.el('rect', { x: x - 150, y: 18, width: 300, height: 268, rx: 10, fill: '#fff', stroke: colour, 'stroke-width': 1.6 }, g);
      L.text(g, title, x, 44, { size: 28, weight: 700, fill: colour });
      const items = rows.map(([n, q, d], i) => {
        const y = 100 + i * 44;
        const r = L.el('g', { opacity: 0 }, g);
        L.text(r, n, x - 130, y, { anchor: 'start', size: 24, weight: 700 });
        L.text(r, String(q), x + 130, y, { anchor: 'end', size: 24, mono: true, weight: 700, fill: colour });
        return r;
      });
      const total = L.text(g, '', x, 276, { size: 30, mono: true, weight: 700, fill: colour, opacity: 0 });
      return { items, total, sum: rows.reduce((s, r) => s + r[1], 0) };
    };
    const A = col(200, 'records', 'retained until their consumers unwind', REC, L.BLUE);
    const B = col(560, 'rank-select scratch', 'zero before the next borrower', SCR, L.ORANGE);
    const setState = (t) => {
      [A, B].forEach((c, ci) => {
        c.items.forEach((r, i) => r.setAttribute('opacity', L.win(t, 0.3 + ci * 0.2 + i * 0.3, 0.4)));
        c.total.textContent = `${c.sum} qubits`; c.total.setAttribute('opacity', L.win(t, 1.8 + ci * 0.2, 0.4));
      });
    };
    L.timeline(svg, { T: 2.8, setState });
  });
})();
