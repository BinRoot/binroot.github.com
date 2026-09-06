// l4-records.js -- slide 12: keep what the outcome does not determine.
//
// Two columns.  Records: registers the inverse will have to read, because the
// board after a step does not determine them.  Scratch: everything the
// records determine, so it can and must return to zero.  Rows fade in.
(function () {
  if (window.__l4RecordsInit) return; window.__l4RecordsInit = true;
  const L = window.L2;
  const REC = [['dice', 90, 'the randomness'], ['boards', 36, 'occupancy and three colour boards'], ['move indices', 16, 'four placements'], ['ranks', 13, 'four rank registers']];
  const SCR = [['prefix counter', 4, 'empties so far'], ['equality bits', 4, 'counter = rank?'], ['cell index', 4, 'the match'], ['flag', 1, 'one match found']];
  document.querySelectorAll('svg.l4-records').forEach((svg) => {
    const root = L.el('g', {}, svg);
    const col = (x, title, sub, rows, colour) => {
      const g = L.el('g', {}, root);
      L.el('rect', { x: x - 150, y: 18, width: 300, height: 268, rx: 10, fill: '#fff', stroke: colour, 'stroke-width': 1.6 }, g);
      L.text(g, title, x, 44, { size: 17, weight: 700, fill: colour });
      L.text(g, sub, x, 66, { size: 12, fill: L.DIM, italic: true });
      const items = rows.map(([n, q, d], i) => {
        const y = 100 + i * 44;
        const r = L.el('g', { opacity: 0 }, g);
        L.text(r, n, x - 130, y, { anchor: 'start', size: 15, weight: 700 });
        L.text(r, String(q), x + 130, y, { anchor: 'end', size: 15, mono: true, weight: 700, fill: colour });
        L.text(r, d, x - 130, y + 18, { anchor: 'start', size: 11.5, fill: L.DIM });
        return r;
      });
      const total = L.text(g, '', x, 276, { size: 13, mono: true, weight: 700, fill: colour, opacity: 0 });
      return { items, total, sum: rows.reduce((s, r) => s + r[1], 0) };
    };
    const A = col(200, 'records', 'kept: the outcome does not determine them', REC, L.BLUE);
    const B = col(560, 'scratch', 'returns to zero before the next block', SCR, L.ORANGE);
    const setState = (t) => {
      [A, B].forEach((c, ci) => {
        c.items.forEach((r, i) => r.setAttribute('opacity', L.win(t, 0.3 + ci * 0.2 + i * 0.3, 0.4)));
        c.total.textContent = `${c.sum} qubits`; c.total.setAttribute('opacity', L.win(t, 1.8 + ci * 0.2, 0.4));
      });
    };
    L.timeline(svg, { T: 2.8, setState });
  });
})();
