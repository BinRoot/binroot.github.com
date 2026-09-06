// pig-count.js -- slide 4: repeat, then count wins.
//
// Ten outcome tiles fill in (seven wins), then the estimate lands on a
// percentage line with an uncertainty bar: 70% give or take 15.  A hundred
// rollouts narrow it to 63% give or take 5, a thousand to 58.5% give or take
// 1.6.  Last, the exact win rate of "roll" under the fixed strategy, 59.6%,
// computed by the generator, drops in as a tick.  Uncertainty bars are one
// standard error of a binomial proportion.
(function () {
  if (window.__pigCountInit) return; window.__pigCountInit = true;
  const L = window.L2, D = window.PIG_DATA;
  document.querySelectorAll('svg.pig-count').forEach((svg) => {
    const root = L.el('g', {}, svg);
    // tiles
    const tiles = D.ten.map((w, i) => {
      const x = 200 + i * 38;
      const g = L.el('g', { opacity: 0 }, root);
      L.el('rect', { x, y: 30, width: 32, height: 32, rx: 6, fill: w ? L.GREEN : '#fff', stroke: w ? L.GREEN : L.RULE, 'stroke-width': 1.5 }, g);
      L.text(g, String(w), x + 16, 46, { size: 15, mono: true, weight: 700, fill: w ? '#fff' : L.DIM });
      return g;
    });
    const tally = L.text(root, '', 380, 84, { size: 15, weight: 700, opacity: 0 });
    // the line
    const AX0 = 120, AX1 = 640, AY = 200, vx = (p) => L.lerp(AX0, AX1, p);
    L.el('line', { x1: AX0, y1: AY, x2: AX1, y2: AY, stroke: L.INK, 'stroke-width': 1.5 }, root);
    [0, 0.25, 0.5, 0.75, 1].forEach((p) => { L.el('line', { x1: vx(p), y1: AY - 5, x2: vx(p), y2: AY + 5, stroke: L.INK }, root); L.text(root, `${Math.round(p * 100)}%`, vx(p), AY + 22, { size: 12, mono: true, fill: L.DIM }); });
    L.text(root, 'win rate of "roll", estimated', 380, 118, { size: 13, fill: L.DIM });
    const est = [[10, D.est['10']], [100, D.est['100']], [1000, D.est['1000']]].map(([n, p], i) => {
      const se = Math.sqrt(p * (1 - p) / n), y = AY - 58 + i * 20;
      const g = L.el('g', { opacity: 0 }, root);
      L.el('line', { x1: vx(p - se), y1: y, x2: vx(p + se), y2: y, stroke: L.BLUE, 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
      L.el('circle', { cx: vx(p), cy: y, r: 5, fill: L.BLUE }, g);
      L.text(g, `${n.toLocaleString('en-US')} rollouts: ${(p * 100).toFixed(n >= 1000 ? 1 : 0)}% ± ${(se * 100).toFixed(n >= 1000 ? 1 : 0)}`, vx(p + se) + 12, y, { anchor: 'start', size: 12, mono: true, fill: L.BLUE });
      return g;
    });
    const truth = L.el('g', { opacity: 0 }, root);
    L.el('line', { x1: vx(D.exact.roll), y1: AY - 70, x2: vx(D.exact.roll), y2: AY + 6, stroke: L.ORANGE, 'stroke-width': 2, 'stroke-dasharray': '4 3' }, truth);
    L.text(truth, `exact: ${(D.exact.roll * 100).toFixed(1)}%`, vx(D.exact.roll), AY + 44, { size: 12.5, mono: true, weight: 700, fill: L.ORANGE });
    L.text(root, 'a Monte Carlo estimate', 380, 282, { size: 13, weight: 700, fill: L.DIM, italic: true });
    const setState = (t) => {
      tiles.forEach((g, i) => g.setAttribute('opacity', L.win(t, 0.2 + i * 0.16, 0.2)));
      const wins = D.ten.reduce((a, b) => a + b, 0);
      tally.textContent = `${wins} of 10`; tally.setAttribute('opacity', L.win(t, 2.0, 0.4));
      est.forEach((g, i) => g.setAttribute('opacity', L.win(t, 2.6 + i * 0.8, 0.4)));
      truth.setAttribute('opacity', L.win(t, 5.2, 0.5));
    };
    L.timeline(svg, { T: 6, setState });
  });
})();
