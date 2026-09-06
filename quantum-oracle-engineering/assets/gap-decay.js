// gap-decay.js -- slide 34: why the gaps shrink.
//
// The single-stone decay model, drawn as a semi-log chart.  Hold a stone's
// support fixed at c friends; each Sway event flips it with probability
// p = (4 - c)/20, so its expected contribution to the final margin is
// multiplied by (1 - 2p) per event.  One curve per support count sweeps in
// over the timeline, with the numbers in a table at the right.  Two presses
// then add the R = 40 mark on the typical-support curve (0.8^40, about
// 1.3e-4) and the 32x32 caption.  The c = 4 line is flat at 1: a fully
// surrounded stone never flips while its support holds.  It is an
// approximation (support churns as neighbours flip), which the slide's badge
// states.
(function () {
  const svg = document.getElementById('gap-decay-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  const X0 = 92, X1 = 500, Y0 = 34, Y1 = 232;      // R runs 0..60 across; value runs 1 down to 1e-5
  const RMAX = 60, DEC = 5, FLOOR = Math.pow(10, -DEC);
  const vx = (R) => L.lerp(X0, X1, R / RMAX);
  const vy = (v) => L.lerp(Y0, Y1, Math.min(DEC, -Math.log10(v)) / DEC);

  // ── axes ──
  for (let d = 0; d <= DEC; d++) {
    const y = vy(Math.pow(10, -d));
    L.el('line', { x1: X0, y1: y, x2: X1, y2: y, stroke: L.FAINT, 'stroke-width': 1 }, root);
    L.el('line', { x1: X0 - 5, y1: y, x2: X0, y2: y, stroke: L.INK }, root);
    if (d === 0) L.text(root, '1', X0 - 10, y, { anchor: 'end', size: 11, fill: L.DIM, mono: true });
    else {
      L.text(root, '10', X0 - 18, y + 1, { anchor: 'end', size: 11, fill: L.DIM, mono: true });
      L.text(root, '−' + d, X0 - 17, y - 5, { anchor: 'start', size: 8, fill: L.DIM, mono: true });
    }
  }
  L.el('line', { x1: X0, y1: Y1, x2: X1 + 8, y2: Y1, stroke: L.INK, 'stroke-width': 1.4 }, root);
  L.el('line', { x1: X0, y1: Y1, x2: X0, y2: Y0 - 8, stroke: L.INK, 'stroke-width': 1.4 }, root);
  for (let R = 0; R <= RMAX; R += 10) {
    L.el('line', { x1: vx(R), y1: Y1, x2: vx(R), y2: Y1 + 5, stroke: L.INK }, root);
    L.text(root, String(R), vx(R), Y1 + 17, { size: 11, fill: L.DIM, mono: true });
  }
  L.text(root, 'Sway events since the placement, R', (X0 + X1) / 2, Y1 + 36, { size: 12, fill: L.DIM });
  const yl = L.text(root, 'expected contribution to the final margin', 0, 0, { size: 12, fill: L.DIM });
  yl.setAttribute('transform', `translate(30,${(Y0 + Y1) / 2}) rotate(-90)`);

  // ── the curves and the table ──
  const ROWS = [
    { c: 0, color: L.RED,    after: '1.3×10⁻⁹' },
    { c: 1, color: L.ORANGE, after: '6.4×10⁻⁷' },
    { c: 2, color: L.BLUE,   after: '1.3×10⁻⁴' },
    { c: 3, color: L.GREEN,  after: '0.015' },
    { c: 4, color: L.GRAY,   after: '1' }
  ];
  const TX = 548, TY = 46, TR = 28;
  [['friends', TX, 'start'], ['1 − 2p', TX + 80, 'middle'], ['after 40', TX + 170, 'end']]
    .forEach(([s, x, a]) => L.text(root, s, x, TY, { anchor: a, size: 11, fill: L.DIM }));
  L.el('line', { x1: TX - 4, y1: TY + 12, x2: TX + 176, y2: TY + 12, stroke: L.RULE }, root);
  const curves = ROWS.map((k, i) => {
    const p = (4 - k.c) / 20, f = 1 - 2 * p;
    const path = L.el('path', { fill: 'none', stroke: k.color, 'stroke-width': k.c === 2 ? 3.2 : 2,
      'stroke-linecap': 'round', 'stroke-dasharray': k.c === 4 ? '6 4' : null }, root);
    const y = TY + 30 + i * TR, bold = k.c === 2;
    L.el('rect', { x: TX - 4, y: y - 6, width: 12, height: 12, rx: 2, fill: k.color }, root);
    L.text(root, `c = ${k.c}`, TX + 16, y, { anchor: 'start', size: 12.5, mono: true, weight: bold ? 700 : 400 });
    L.text(root, f.toFixed(2), TX + 80, y, { size: 12.5, mono: true, weight: bold ? 700 : 400 });
    L.text(root, k.after, TX + 170, y, { anchor: 'end', size: 12.5, mono: true, weight: bold ? 700 : 400, fill: bold ? k.color : L.INK });
    return { f, path };
  });
  L.text(root, 'c = 4 never flips while its support holds', TX + 86, TY + 30 + ROWS.length * TR + 2, { size: 10.5, fill: L.DIM, italic: true });

  // ── press 1: the R = 40 mark on the typical-support curve ──
  const mark = L.el('g', { class: 'step' }, root);
  const mv = Math.pow(0.8, 40), mx = vx(40), my = vy(mv);
  L.el('line', { x1: mx, y1: my, x2: mx, y2: Y1, stroke: L.BLUE, 'stroke-width': 1.2, 'stroke-dasharray': '4 3' }, mark);
  L.el('line', { x1: X0, y1: my, x2: mx, y2: my, stroke: L.BLUE, 'stroke-width': 1.2, 'stroke-dasharray': '4 3' }, mark);
  L.el('circle', { cx: mx, cy: my, r: 6, fill: '#fff', stroke: L.BLUE, 'stroke-width': 2.5 }, mark);
  L.text(mark, '0.8⁴⁰ ≈ 1.3 × 10⁻⁴', mx + 12, my - 14, { anchor: 'start', size: 13, weight: 700, fill: L.BLUE, mono: true });

  // ── press 2: the caption ──
  const cap = L.el('g', { class: 'step' }, root);
  L.text(cap, 'Fixed-support model: expected color margin after 40 events. Win-rate gaps need separate measurement.',
    380, 284, { size: 13, weight: 700, fill: L.ORANGE });

  const setState = (t) => {
    const R = L.lerp(0, RMAX, L.win(t, 0.3, 2.2, L.ease));
    curves.forEach((k) => {
      let d = '';
      for (let r = 0; r <= R + 1e-9; r += 0.5) {
        const v = Math.pow(k.f, r);
        if (v < FLOOR) break;
        d += (d ? ' L ' : 'M ') + vx(r).toFixed(1) + ' ' + vy(v).toFixed(1);
      }
      k.path.setAttribute('d', d);
    });
  };
  L.timeline(svg, { T: 2.8, setState });
})();
