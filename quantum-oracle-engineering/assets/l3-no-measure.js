// l3-no-measure.js -- slide 10: two branches of the same superposition, two
// boards with different empties.  The same rank r = 3 names a different cell
// in each.  A meter between them, struck through: measuring to find out is
// exactly the forbidden move, so the decoding must happen in every branch.
(function () {
  const svg = document.getElementById('l3-no-measure-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  const N = 3, R = 3;
  const BR = [[0, 1, 0, 0, 2, 0, 1, 0, 0], [1, 0, 2, 0, 0, 0, 0, 1, 0]];
  const panels = BR.map((b, k) => {
    const x = 60 + k * 420, y = 50;
    const g = L.el('g', {}, root);
    const B = L.board(g, { N, size: 180, x, y, board: b });
    L.text(g, `branch ${k + 1}`, x + 90, 34, { size: 14, weight: 700, fill: L.DIM });
    let rank = 0; const nums = [], target = { i: -1 };
    for (let i = 0; i < N * N; i++) {
      if (b[i]) continue;
      const tx = L.text(g, String(rank), x + B.cx(i), y + B.cy(i), { size: 14, mono: true, fill: L.DIM, opacity: 0 });
      nums.push(tx); if (rank === R) target.i = i; rank++;
    }
    const ring = L.el('circle', { cx: x + B.cx(target.i), cy: y + B.cy(target.i), r: B.r + 4, fill: 'none', stroke: L.ORANGE, 'stroke-width': 3, opacity: 0 }, g);
    return { g, nums, ring, cell: target.i, x };
  });
  const rlab = L.text(root, 'r = 3', 380, 40, { size: 20, mono: true, weight: 700, fill: L.ORANGE, opacity: 0 });
  const cap = L.text(root, '', 380, 280, { size: 14, weight: 700, opacity: 0 });
  // the meter, struck
  const meter = L.el('g', { transform: 'translate(380,150)', opacity: 0 }, root);
  L.el('path', { d: 'M -26 14 A 26 26 0 0 1 26 14', fill: 'none', stroke: L.INK, 'stroke-width': 2.5 }, meter);
  L.el('line', { x1: 0, y1: 14, x2: 16, y2: -12, stroke: L.INK, 'stroke-width': 2.5 }, meter);
  L.text(meter, 'measure?', 0, 40, { size: 12, fill: L.DIM });
  const strike = L.el('line', { x1: 350, y1: 190, x2: 410, y2: 110, stroke: L.RED, 'stroke-width': 3.5, 'stroke-linecap': 'round', opacity: 0 }, root);
  L.timeline(svg, { T: 4.4, setState: (t) => {
    const a = L.win(t, 0.3, 0.5);
    panels.forEach((p) => p.nums.forEach((n) => n.setAttribute('opacity', a)));
    rlab.setAttribute('opacity', L.win(t, 1.0, 0.4));
    panels.forEach((p) => p.ring.setAttribute('opacity', L.win(t, 1.4, 0.4)));
    cap.textContent = 'same r, different cell'; cap.setAttribute('opacity', L.win(t, 1.9, 0.4));
    meter.setAttribute('opacity', L.win(t, 2.6, 0.4));
    strike.setAttribute('opacity', L.win(t, 3.2, 0.3));
  } });
})();
