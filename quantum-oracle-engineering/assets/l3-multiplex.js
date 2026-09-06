// l3-multiplex.js -- slide 22: five lanes, one per possible friend count.
// Each lane ANDs "count == c", "die < 4 - c", and "occupied" into the flip
// flag.  For this stone the count is 2, so lane 2 lights; lane 4 has no
// comparison at all, since a threshold of zero never flips.
(function () {
  const svg = document.getElementById('l3-multiplex-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  const C = 2, DIE = 1;
  L.text(root, 'this stone: count = 2, die = 1, occupied', 380, 30, { size: 14, weight: 700 });
  const lanes = [0, 1, 2, 3, 4].map((c, i) => {
    const y = 66 + i * 40, thr = 4 - c, live = thr > 0;
    const g = L.el('g', { opacity: live ? 1 : 0.4 }, root);
    L.text(g, `c = ${c}`, 90, y, { anchor: 'end', size: 13, mono: true });
    const cell = (x, s, on) => { L.el('rect', { x, y: y - 13, width: 118, height: 26, rx: 6, fill: on ? '#eaf4ec' : '#fff', stroke: on ? L.GREEN : L.RULE, 'stroke-width': 1.3 }, g); L.text(g, s, x + 59, y, { size: 12, mono: true, fill: on ? L.GREEN : L.DIM }); };
    cell(110, `count == ${c}`, c === C);
    cell(244, live ? `die < ${thr}` : 'never', live && DIE < thr);
    cell(378, 'occupied', true);
    L.el('line', { x1: 500, y1: y, x2: 560, y2: 150, stroke: c === C ? L.GREEN : L.FAINT, 'stroke-width': c === C ? 2.5 : 1.2 }, g);
    return { g, fire: live && c === C && DIE < thr };
  });
  const flag = L.el('g', {}, root);
  L.el('rect', { x: 566, y: 128, width: 130, height: 44, rx: 10, fill: '#fff', stroke: L.INK, 'stroke-width': 1.6 }, flag);
  const ftx = L.text(flag, 'flip flag 0', 631, 150, { size: 14, mono: true, weight: 700 });
  L.text(root, 'one lane fires, at most', 631, 190, { size: 12, fill: L.DIM, italic: true });
  L.timeline(svg, { T: 3.0, setState: (t) => {
    const lit = t > 1.6 && lanes.some((l) => l.fire);
    ftx.textContent = lit ? 'flip flag 1' : 'flip flag 0';
    flag.firstChild.setAttribute('fill', lit ? '#eaf4ec' : '#fff'); flag.firstChild.setAttribute('stroke', lit ? L.GREEN : L.INK);
    lanes.forEach((l, i) => l.g.setAttribute('transform', `translate(${(1 - L.win(t, 0.1 + i * 0.2, 0.4)) * -30},0)`));
  } });
})();
