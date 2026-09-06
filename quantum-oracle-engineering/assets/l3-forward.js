// l3-forward.js -- slide 33: the oracle's blocks with a forward sweep, a
// greyed reverse arrow marked with a question, and the five-question
// checklist with three ticks and two left open for Lesson 4.
(function () {
  const svg = document.getElementById('l3-forward-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  const BL = ['round 1', 'round 2', 'payoff'];
  BL.forEach((s, i) => { const x = 130 + i * 180; L.el('rect', { x, y: 40, width: 140, height: 44, rx: 8, fill: '#fff', stroke: L.INK, 'stroke-width': 1.5 }, root); L.text(root, s, x + 70, 62, { size: 13, weight: 700 }); });
  const fwd = L.el('rect', { x: 130, y: 96, width: 0, height: 6, rx: 3, fill: L.BLUE }, root);
  L.text(root, 'forward: today', 130, 118, { anchor: 'start', size: 12, fill: L.BLUE, weight: 700 });
  const back = L.el('g', { opacity: 0 }, root);
  L.el('line', { x1: 630, y1: 130, x2: 130, y2: 130, stroke: L.GRAY, 'stroke-width': 3, 'stroke-dasharray': '8 6' }, back);
  L.el('polygon', { points: '130,130 144,122 144,138', fill: L.GRAY }, back);
  L.text(back, 'backward?  Lesson 4', 630, 148, { anchor: 'end', size: 12, fill: L.GRAY, weight: 700 });
  const Q = [['round semantics defined', true], ['old and new state kept apart', true], ['selection scratch erased before the board changes', false], ['every branch from read-only randomness', true], ['runs backward once the payoff is marked', false]];
  const rows = Q.map(([s, ok], i) => { const g = L.el('g', { opacity: 0 }, root); const y = 182 + i * 24;
    L.el('circle', { cx: 150, cy: y, r: 8, fill: ok ? L.GREEN : '#fff', stroke: ok ? L.GREEN : L.RULE, 'stroke-width': 1.5 }, g);
    if (ok) L.el('path', { d: `M 146 ${y} l 3 3 l 5 -6`, fill: 'none', stroke: '#fff', 'stroke-width': 2 }, g);
    L.text(g, s, 170, y, { anchor: 'start', size: 13, fill: ok ? L.INK : L.DIM }); if (!ok) L.text(g, 'Lesson 4', 640, y, { anchor: 'end', size: 12, fill: L.GRAY, weight: 700 }); return g; });
  L.timeline(svg, { T: 4.2, setState: (t) => {
    fwd.setAttribute('width', 500 * L.win(t, 0.2, 1.2)); back.setAttribute('opacity', L.win(t, 1.6, 0.5));
    rows.forEach((g, i) => g.setAttribute('opacity', L.win(t, 2.2 + i * 0.3, 0.3)));
  } });
})();
