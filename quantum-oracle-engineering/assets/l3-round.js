// l3-round.js -- slide 25: three blocks slide together into one round, the
// round is stamped twice, and the Qiskit shape of that appears beneath.
(function () {
  const svg = document.getElementById('l3-round-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  const BLK = [['select + place', 'Black', '#dbeafe', '#7db8f0', '#1e3a5f'], ['select + place', 'White', '#eef0f3', '#9aa0a8', '#2d3140'], ['Sway event', 'every stone', '#fff0e0', '#e8a860', '#6b3010']];
  const blocks = BLK.map(([a, b, f, s, ink], i) => {
    const g = L.el('g', {}, root);
    L.el('rect', { x: -70, y: -34, width: 140, height: 68, rx: 10, fill: f, stroke: s, 'stroke-width': 1.5 }, g);
    L.text(g, a, 0, -8, { size: 13, weight: 700, fill: ink }); L.text(g, b, 0, 12, { size: 12, fill: ink });
    return g;
  });
  const frame = L.el('rect', { x: 130, y: 44, width: 500, height: 112, rx: 14, fill: 'none', stroke: L.INK, 'stroke-width': 2, opacity: 0 }, root);
  const rlab = L.text(root, 'round', 380, 62, { size: 14, weight: 700, opacity: 0 });
  const twice = L.el('g', { opacity: 0 }, root);
  [0, 1].forEach((k) => { L.el('rect', { x: 200 + k * 200, y: 176, width: 160, height: 36, rx: 8, fill: '#fff', stroke: L.INK, 'stroke-width': 1.5 }, twice); L.text(twice, `round ${k + 1}`, 280 + k * 200, 194, { size: 13, weight: 700 }); });
  L.el('line', { x1: 360, y1: 194, x2: 400, y2: 194, stroke: L.INK, 'stroke-width': 1.5 }, twice);
  L.text(twice, 'then the payoff', 640, 194, { anchor: 'start', size: 12, fill: L.DIM });
  const code = L.el('g', { opacity: 0 }, root);
  ['round = black.compose(white).compose(event)', 'oracle = round.compose(round).compose(payoff)'].forEach((s, i) => L.text(code, s, 380, 244 + i * 22, { size: 13, mono: true, fill: L.DIM }));
  L.timeline(svg, { T: 4.0, setState: (t) => {
    const u = L.win(t, 0.3, 1.2, L.backOut);
    blocks.forEach((g, i) => g.setAttribute('transform', `translate(${L.lerp([120, 380, 640][i], [220, 380, 540][i], u)},100)`));
    frame.setAttribute('opacity', L.win(t, 1.5, 0.4)); rlab.setAttribute('opacity', L.win(t, 1.5, 0.4));
    twice.setAttribute('opacity', L.win(t, 2.2, 0.5)); code.setAttribute('opacity', L.win(t, 3.0, 0.5));
  } });
})();
