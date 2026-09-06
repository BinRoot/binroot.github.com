// pig-table.js -- slide 17: Pig, solved.
//
// The escape hatch on the running example.  Value iteration over Pig's
// 505,000 positions (my score, opponent's score, turn total) gives the exact
// win rate of every move; the generator did it in three seconds.  Shown here
// is one slice of the resulting policy, opponent at 30: my score down the
// side, turn total across, blue where rolling is right and grey where holding
// is.  The table paints row by row, then the count and the citation.
(function () {
  if (window.__pigTableInit) return; window.__pigTableInit = true;
  const L = window.L2, D = window.PIG_DATA;
  document.querySelectorAll('svg.pig-table').forEach((svg) => {
    const root = L.el('g', {}, svg);
    const X = 250, Y = 40, C = 2.3, N = D.GOAL;
    L.text(root, `opponent at ${D.optSliceJ}: roll or hold?`, X + N * C / 2, 24, { size: 13, weight: 700 });
    L.text(root, 'turn total →', X + N * C / 2, Y + N * C + 16, { size: 11.5, fill: L.DIM });
    const yl = L.text(root, '← my score', X - 14, Y + N * C / 2, { size: 11.5, fill: L.DIM }); yl.setAttribute('transform', `rotate(-90 ${X - 14} ${Y + N * C / 2})`);
    L.el('rect', { x: X - 1, y: Y - 1, width: N * C + 2, height: N * C + 2, fill: 'none', stroke: L.RULE, 'stroke-width': 1 }, root);
    const rows = D.optSlice.map((row, i) => {
      const g = L.el('g', { opacity: 0 }, root);
      // run-length paint
      let k = 0;
      while (k < N) {
        const ch = row[k]; let k2 = k; while (k2 < N && row[k2] === ch) k2++;
        if (ch !== '.') L.el('rect', { x: X + k * C, y: Y + i * C, width: (k2 - k) * C, height: C, fill: ch === '1' ? L.BLUE : L.GRAY, opacity: 0.85 }, g);
        k = k2;
      }
      return g;
    });
    // legend
    const lg = L.el('g', {}, root);
    L.el('rect', { x: 40, y: 60, width: 14, height: 14, rx: 3, fill: L.BLUE }, lg); L.text(lg, 'roll', 62, 67, { anchor: 'start', size: 13, fill: L.BLUE, weight: 700 });
    L.el('rect', { x: 40, y: 86, width: 14, height: 14, rx: 3, fill: L.GRAY }, lg); L.text(lg, 'hold', 62, 93, { anchor: 'start', size: 13, fill: L.GRAY, weight: 700 });
    const count = L.el('g', { opacity: 0 }, root);
    L.text(count, D.states.toLocaleString('en-US'), 120, 170, { size: 26, mono: true, weight: 700 });
    L.text(count, 'positions, one table', 120, 194, { size: 12.5, fill: L.DIM });
    L.text(count, 'no rollouts', 120, 214, { size: 13, weight: 700, fill: L.GREEN });
    const cite = L.text(root, 'Neller and Presser, 2004', 120, 262, { size: 11.5, fill: L.DIM, italic: true, opacity: 0 });
    // the opening position's row marker is off-slice; mark the slice's own example instead
    const setState = (t) => {
      const n = Math.floor(L.win(t, 0.2, 2.2, L.outQuart) * N);
      rows.forEach((g, i) => g.setAttribute('opacity', i < n ? 1 : 0));
      count.setAttribute('opacity', L.win(t, 2.6, 0.5)); cite.setAttribute('opacity', L.win(t, 3.1, 0.5));
    };
    L.timeline(svg, { T: 3.8, setState });
  });
})();
