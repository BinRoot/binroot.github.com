// l3-eq-gates.js -- slide 12: counter == rank, as gates, shown on two bits.
// XOR counter into scratch, XOR rank on top, flip every scratch bit: scratch
// is all ones only when counter equals rank.  One multi-controlled X, on the
// scratch bits (filled controls) and the occupancy qubit being zero (an open
// control), sets the mark.  Then undo.  A gold
// wash sweeps left to right so the room reads it in gate order.
(function () {
  const svg = document.getElementById('l3-eq-gates-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  const wires = ['counter₀', 'counter₁', 'rank₀', 'rank₁', 'scratch₀', 'scratch₁', 'occupied', 'mark'];
  const ops = [
    { t: 'ctrl', c: 0, w: 4 }, { t: 'ctrl', c: 1, w: 5 },
    { t: 'ctrl', c: 2, w: 4 }, { t: 'ctrl', c: 3, w: 5 },
    { t: 'box', w: [4, 4], label: 'X', bw: 26, sans: true }, { t: 'box', w: [5, 5], label: 'X', bw: 26, sans: true },
    { t: 'gap', k: 0.3 },
    { t: 'cbox', c: 4, w: [7], label: 'X', bw: 26, sans: true, fill: '#fdf1ec', stroke: L.ORANGE, ink: L.ORANGE },
    { t: 'gap', k: 0.3 },
    { t: 'box', w: [4, 4], label: 'X', bw: 26, sans: true }, { t: 'box', w: [5, 5], label: 'X', bw: 26, sans: true },
    { t: 'ctrl', c: 3, w: 5 }, { t: 'ctrl', c: 2, w: 4 },
    { t: 'ctrl', c: 1, w: 5 }, { t: 'ctrl', c: 0, w: 4 }
  ];
  const circ = L.circuit(root, { x: 90, y: 28, colW: 40, rowH: 31, labelW: 70, fontSize: 12, wires, ops });
  // extra controls on the multi-controlled X (scratch1 and empty)
  const mx = circ.colX[7];
  // scratch1: a filled control (must be 1).  occupied: an open control (must be 0, the cell is empty).
  L.el('circle', { cx: mx, cy: circ.wireY(5), r: 4.5, fill: L.ORANGE, transform: 'translate(90,28)' }, root);
  L.el('circle', { cx: mx, cy: circ.wireY(6), r: 4.5, fill: '#fff', stroke: L.ORANGE, 'stroke-width': 1.8, transform: 'translate(90,28)' }, root);
  L.text(root, 'open control: occupied = 0', 90 + mx, 28 + circ.wireY(6) + 14, { size: 10, fill: L.ORANGE, italic: true });
  L.el('line', { x1: mx, y1: circ.wireY(4), x2: mx, y2: circ.wireY(7), stroke: L.ORANGE, 'stroke-width': 1.8, transform: 'translate(90,28)' }, root);
  // phase captions under the strip
  const caps = [['compute', 0, 5], ['mark', 7, 7], ['uncompute', 9, 14]].map(([s, a, b]) => {
    const x0 = circ.colX[a] + 90 - 16, x1 = circ.colX[b] + 90 + 16, y = 28 + circ.wireY(7) + 26;
    const g = L.el('g', { opacity: 0 }, root);
    L.el('path', { d: `M ${x0} ${y} v 6 H ${x1} v -6`, fill: 'none', stroke: L.DIM, 'stroke-width': 1.2 }, g);
    L.text(g, s, (x0 + x1) / 2, y + 20, { size: 12.5, fill: s === 'mark' ? L.ORANGE : L.DIM, weight: s === 'mark' ? 700 : 400 });
    return { g, x1 };
  });
  const wash = L.el('rect', { x: 90 + circ.colX[0] - 20, y: 20, width: 0, height: 28 + circ.wireY(7) - 6, fill: L.GOLD, opacity: 0.18, rx: 6 }, root);
  root.insertBefore(wash, root.firstChild);
  L.timeline(svg, { T: 4.0, setState: (t) => {
    const u = L.win(t, 0.2, 3.0);
    wash.setAttribute('width', (circ.colX[14] + 90 + 20 - (90 + circ.colX[0] - 20)) * u);
    caps.forEach((c) => c.g.setAttribute('opacity', 90 + circ.colX[0] - 20 + (circ.colX[14] + 90 + 20 - (90 + circ.colX[0] - 20)) * u >= c.x1 ? 1 : 0));
  } });
})();
