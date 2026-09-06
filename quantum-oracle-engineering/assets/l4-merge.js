// l4-merge.js -- slide 11: two boards, one result.
//
// Two one-row boards, each with rank 0, place a stone and reach the same
// board.  The two arrows merge, which is the shape of a step that forgets;
// a backward arrow from the result meets a question mark.  Then each path
// gets its move-index chip and the merge separates again.
(function () {
  if (window.__l4MergeInit) return; window.__l4MergeInit = true;
  const L = window.L2;
  document.querySelectorAll('svg.l4-merge').forEach((svg) => {
    const root = L.el('g', {}, svg);
    const CELL = 44;
    const strip = (x, y, cells, parent) => {
      const g = L.el('g', {}, parent || root);
      cells.forEach((v, i) => {
        L.el('rect', { x: x + i * CELL, y, width: CELL - 3, height: CELL - 3, rx: 5, fill: L.WOOD, stroke: L.WOODLINE, 'stroke-width': 1.2 }, g);
        if (v) L.stone(g, x + i * CELL + (CELL - 3) / 2, y + (CELL - 3) / 2, 14, v);
      });
      return g;
    };
    strip(70, 60, [0, 1, 0]); strip(70, 190, [1, 0, 0]);
    L.text(root, 'rank 0', 136, 118, { size: 13, mono: true, fill: L.PURPLE, weight: 700 });
    L.text(root, 'rank 0', 136, 248, { size: 13, mono: true, fill: L.PURPLE, weight: 700 });
    L.text(root, 'the first empty is cell 0', 136, 40, { size: 12, fill: L.DIM });
    L.text(root, 'the first empty is cell 1', 136, 170, { size: 12, fill: L.DIM });
    strip(560, 125, [1, 1, 0]);
    L.text(root, 'the same result', 626, 105, { size: 12, fill: L.DIM });
    const arrow = (x1, y1, x2, y2, col, parent) => {
      const g = L.el('g', {}, parent || root);
      L.el('path', { d: `M ${x1} ${y1} C ${x1 + 120} ${y1}, ${x2 - 120} ${y2}, ${x2} ${y2}`, fill: 'none', stroke: col, 'stroke-width': 2.2 }, g);
      L.el('polygon', { points: `${x2},${y2} ${x2 - 11},${y2 - 6} ${x2 - 11},${y2 + 6}`, fill: col }, g);
      return g;
    };
    const a1 = arrow(210, 80, 550, 145, L.INK), a2 = arrow(210, 210, 550, 145, L.INK);
    const back = L.el('g', { opacity: 0 }, root);
    L.el('path', { d: 'M 560 165 C 470 200, 400 200, 330 150', fill: 'none', stroke: L.RED, 'stroke-width': 2.2, 'stroke-dasharray': '6 4' }, back);
    L.text(back, '?', 330, 150, { size: 30, weight: 700, fill: L.RED });
    L.text(back, 'which board was it?', 440, 214, { size: 13, fill: L.RED, weight: 700 });
    const fix = L.el('g', { opacity: 0 }, root);
    [[0, 80], [1, 210]].forEach(([m, y]) => {
      L.el('rect', { x: 250, y: y - 14, width: 92, height: 28, rx: 7, fill: '#f3e8ff', stroke: L.PURPLE, 'stroke-width': 1.3 }, fix);
      L.text(fix, `move = ${m}`, 296, y, { size: 13, mono: true, weight: 700, fill: L.PURPLE }); });
    L.text(fix, 'kept, so the paths stay apart', 380, 272, { size: 13, fill: L.GREEN, weight: 700 });
    const setState = (t) => {
      [a1, a2].forEach((a) => a.setAttribute('opacity', L.win(t, 0.3, 0.6)));
      back.setAttribute('opacity', L.win(t, 1.4, 0.5));
      fix.setAttribute('opacity', L.win(t, 2.6, 0.5));
    };
    L.timeline(svg, { T: 3.4, setState });
  });
})();
