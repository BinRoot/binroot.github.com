// l4-dirty.js -- slide 16: dirty scratch, wrong game.
//
// Four rows, one per placement, each a strip of rank cells (9, 8, 7, 6).  The
// counter starts each placement holding the number of stones placed so far,
// so every rank lands one cell early per unit of dirt: the first ranks place
// nothing (red) and the last empties are never chosen (grey).  Rows appear
// one at a time; the exact win rates close the figure.
(function () {
  if (window.__l4DirtyInit) return; window.__l4DirtyInit = true;
  const L = window.L2;
  const ROWS = [['Black, round 1', 9, 0], ['White, round 1', 8, 1], ['Black, round 2', 7, 2], ['White, round 2', 6, 3]];
  document.querySelectorAll('svg.l4-dirty').forEach((svg) => {
    const root = L.el('g', {}, svg);
    const CELL = 34, X0 = 250, Y0 = 40;
    L.text(root, 'rank register', X0 + 4.5 * CELL, 22, { size: 12, fill: L.DIM });
    L.text(root, 'counter starts at', 130, 22, { size: 12, fill: L.DIM });
    const rows = ROWS.map(([name, m, d], r) => {
      const g = L.el('g', { opacity: 0 }, root);
      const y = Y0 + r * 48;
      L.text(g, name, 20, y + 16, { anchor: 'start', size: 13, weight: 700 });
      L.text(g, String(d), 130, y + 16, { size: 18, mono: true, weight: 700, fill: d ? L.RED : L.GREEN });
      for (let r2 = 0; r2 < m; r2++) {
        const dead = r2 < d;
        L.el('rect', { x: X0 + r2 * CELL, y, width: CELL - 4, height: 32, rx: 5, fill: dead ? '#fbe3e0' : '#f3e8ff', stroke: dead ? L.RED : L.PURPLE, 'stroke-width': 1.3 }, g);
        L.text(g, dead ? '×' : String(r2 - d), X0 + r2 * CELL + (CELL - 4) / 2, y + 16, { size: 12, mono: true, fill: dead ? L.RED : L.PURPLE, weight: dead ? 700 : 400 });
      }
      L.text(g, d ? `${d} of ${m} ranks place nothing` : 'every rank places a stone', X0 + m * CELL + 10, y + 16, { anchor: 'start', size: 11.5, fill: d ? L.RED : L.DIM });
      return g;
    });
    const verdict = L.el('g', { opacity: 0 }, root);
    L.text(verdict, '.439', 300, 262, { size: 26, weight: 700, mono: true, fill: L.RED });
    L.text(verdict, 'with the dirty counter', 300, 286, { size: 12, fill: L.DIM });
    L.text(verdict, '.271', 460, 262, { size: 26, weight: 700, mono: true });
    L.text(verdict, 'the game', 460, 286, { size: 12, fill: L.DIM });
    L.text(verdict, 'Black wins, exact', 380, 240, { size: 12, fill: L.DIM, italic: true });
    const setState = (t) => {
      rows.forEach((g, i) => g.setAttribute('opacity', L.win(t, 0.3 + i * 0.5, 0.4)));
      verdict.setAttribute('opacity', L.win(t, 2.6, 0.5));
    };
    L.timeline(svg, { T: 3.4, setState });
  });
})();
