// l3-no-library.js -- slide 14: a shelf of standard circuit blocks with one
// dashed, empty slot labelled rank-select.  The blocks arrive one by one; the
// slot stays empty until a hand-built block drops into it.
(function () {
  const svg = document.getElementById('l3-no-library-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  L.el('line', { x1: 60, y1: 200, x2: 700, y2: 200, stroke: L.INK, 'stroke-width': 3 }, root);
  L.el('rect', { x: 60, y: 200, width: 640, height: 8, fill: L.WOOD, stroke: L.WOODLINE }, root);
  const BLOCKS = ['adder', 'comparator', 'QFT', 'diffusion', 'state prep'];
  const items = BLOCKS.map((s, i) => {
    const x = 80 + i * 108;
    const g = L.el('g', { opacity: 0 }, root);
    L.el('rect', { x, y: 130, width: 90, height: 68, rx: 8, fill: '#fff', stroke: L.INK, 'stroke-width': 1.5 }, g);
    L.text(g, s, x + 45, 164, { size: 13, weight: 600 });
    return g;
  });
  const sx = 80 + 5 * 108;
  const slot = L.el('g', {}, root);
  L.el('rect', { x: sx, y: 130, width: 90, height: 68, rx: 8, fill: 'none', stroke: L.RULE, 'stroke-width': 1.5, 'stroke-dasharray': '6 4' }, slot);
  const q = L.text(slot, '?', sx + 45, 166, { size: 30, weight: 700, fill: L.GRAY });
  L.text(root, 'rank-select', sx + 45, 226, { size: 13, weight: 700, fill: L.ORANGE });
  L.text(root, 'select the r-th set bit of a register in superposition', 380, 60, { size: 15, weight: 700 });
  const sub = L.text(root, '', 380, 88, { size: 13, fill: L.DIM, opacity: 0 });
  const built = L.el('g', { opacity: 0 }, root);
  L.el('rect', { x: sx, y: 130, width: 90, height: 68, rx: 8, fill: '#fdf1ec', stroke: L.ORANGE, 'stroke-width': 2 }, built);
  L.text(built, 'built here', sx + 45, 158, { size: 12.5, weight: 700, fill: L.ORANGE });
  L.text(built, 'N × w gates', sx + 45, 178, { size: 11.5, mono: true, fill: L.ORANGE });
  L.timeline(svg, { T: 4.2, setState: (t) => {
    items.forEach((g, i) => g.setAttribute('opacity', L.win(t, 0.2 + i * 0.3, 0.3)));
    sub.textContent = 'every library has the first five; none has the sixth'; sub.setAttribute('opacity', L.win(t, 1.9, 0.4));
    const b = L.win(t, 2.8, 0.6, L.backOut);
    built.setAttribute('opacity', b > 0 ? 1 : 0);
    built.setAttribute('transform', `translate(0,${(1 - b) * -60})`);
    q.setAttribute('opacity', 1 - L.win(t, 2.8, 0.3));
  } });
})();
