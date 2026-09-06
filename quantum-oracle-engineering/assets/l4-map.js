// l4-map.js -- slide 19: records and scratch, 169.
//
// Lesson 3's stacked bar with its six groups, then two braces beneath: the
// records the inverse reads (dice, boards, move indices, ranks: 155) and the
// scratch pool (13), with the payoff on its own.
(function () {
  if (window.__l4MapInit) return; window.__l4MapInit = true;
  const L = window.L2;
  const G = [['dice', 90, L.PURPLE], ['boards', 36, L.WOOD], ['move indices', 16, L.GOLD], ['ranks', 13, L.BLUE], ['scratch', 13, L.ORANGE], ['payoff', 1, L.GREEN]];
  document.querySelectorAll('svg.l4-map').forEach((svg) => {
    const root = L.el('g', {}, svg);
    const TOTAL = 169, X0 = 60, X1 = 700, Y = 70, H = 56;
    const segs = []; let acc = 0;
    G.forEach(([name, n, col], i) => {
      const x = X0 + (X1 - X0) * acc / TOTAL, w = (X1 - X0) * n / TOTAL;
      const r = L.el('rect', { x, y: Y, width: 0, height: H, fill: col, opacity: 0.85 }, root);
      const lab = L.el('g', { opacity: 0 }, root);
      const lx = X0 + i * 108 + 4;
      L.el('rect', { x: lx, y: Y + H + 16, width: 12, height: 12, rx: 3, fill: col }, lab);
      L.text(lab, `${name} ${n}`, lx + 18, Y + H + 22, { anchor: 'start', size: 12, weight: 700, fill: col === L.WOOD || col === L.GOLD ? L.WOODLINE : col });
      segs.push({ r, lab, w, x }); acc += n;
    });
    const brace = (xa, xb, y, label, col) => {
      const g = L.el('g', { opacity: 0 }, root);
      L.el('path', { d: `M ${xa} ${y} l 0 8 L ${xb} ${y + 8} l 0 -8`, fill: 'none', stroke: col, 'stroke-width': 1.6 }, g);
      L.text(g, label, (xa + xb) / 2, y + 26, { size: 14, weight: 700, fill: col });
      return g;
    };
    const recEnd = X0 + (X1 - X0) * 155 / TOTAL, scrEnd = X0 + (X1 - X0) * 168 / TOTAL;
    const b1 = brace(X0, recEnd - 2, Y + H + 44, 'records, 155: the inverse reads every one', L.BLUE);
    const b2 = brace(recEnd + 2, scrEnd - 1, Y + H + 44, 'scratch, 13', L.ORANGE);
    L.text(root, '169 qubits', 380, 36, { size: 22, mono: true, weight: 700 });
    const setState = (t) => {
      segs.forEach((s, i) => { const u = L.win(t, 0.2 + i * 0.35, 0.5, L.outQuart); s.r.setAttribute('width', s.w * u); s.lab.setAttribute('opacity', u >= 1 ? 1 : 0); });
      b1.setAttribute('opacity', L.win(t, 2.6, 0.5)); b2.setAttribute('opacity', L.win(t, 3.0, 0.5));
    };
    L.timeline(svg, { T: 3.8, setState });
  });
})();
