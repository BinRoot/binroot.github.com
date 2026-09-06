// l4-stranded.js -- slide 9: once the colour changes, the comparison is stranded.
//
// One cell's block in the in-place circuit, as a five-wire diagram: compare
// the cell's colour with a neighbour's into a scratch bit, count, set the flip
// flag, flip the cell IN PLACE, then uncompute flag, count, compare.  A pointer
// sweeps it with a register readout underneath.  The flag and count return to
// zero, because what they read did not change.  The comparison bit does not:
// it compares against the colour the flip just changed, and ends at 1.
(function () {
  if (window.__l4StrandedInit) return; window.__l4StrandedInit = true;
  const L = window.L2;
  document.querySelectorAll('svg.l4-stranded').forEach((svg) => {
    const root = L.el('g', {}, svg);
    const C = L.circuit(root, {
      x: 20, y: 44, colW: 78, rowH: 34, labelW: 96, fontSize: 12,
      wires: ['color, cell', 'color, nbr', 'same', 'count', 'flag'],
      ops: [
        { t: 'box', w: [0, 2], label: 'same?', size: 12 },
        { t: 'cbox', c: 2, w: [3], label: '+1', size: 12 },
        { t: 'box', w: [3, 4], label: ['die <', 'thr'], size: 11 },
        { t: 'ctrl', c: 4, w: 0 },
        { t: 'box', w: [3, 4], label: ['die <', 'thr'], size: 11, dash: true },
        { t: 'cbox', c: 2, w: [3], label: '−1', size: 12, dash: true },
        { t: 'box', w: [0, 2], label: 'same?', size: 12, dash: true }
      ]
    });
    L.text(root, 'compute', C.colX[1], 26, { size: 12, fill: L.DIM });
    L.text(root, 'flip in place', C.colX[3], 26, { size: 12, fill: L.ORANGE, weight: 700 });
    L.text(root, 'uncompute', C.colX[5], 26, { size: 12, fill: L.DIM });
    // readout: values after each column, for the branch where the cell flips
    //            cell  nbr  same count flag
    const STATES = [
      ['B', 'B', 0, 0, 0],   // start
      ['B', 'B', 1, 0, 0],   // same? -> 1
      ['B', 'B', 1, 1, 0],   // count
      ['B', 'B', 1, 1, 1],   // flag: die below threshold
      ['W', 'B', 1, 1, 1],   // the flip, in place
      ['W', 'B', 1, 1, 0],   // flag back to 0: count and die unchanged
      ['W', 'B', 1, 0, 0],   // count back to 0
      ['W', 'B', 1, 0, 0]    // same? recomputed against W: 0, xor 1 -> 1, stranded
    ];
    const RY = 262;
    const names = ['cell', 'nbr', 'same', 'count', 'flag'];
    const chips = names.map((n, i) => {
      const x = 150 + i * 82;
      L.text(root, n, x, RY - 30, { size: 12, fill: L.DIM });
      L.el('rect', { x: x - 22, y: RY - 16, width: 44, height: 32, rx: 6, fill: '#fff', stroke: L.INK, 'stroke-width': 1.4 }, root);
      return L.text(root, '', x, RY, { size: 17, weight: 700, mono: true });
    });
    const ptr = L.el('line', { x1: 0, y1: 36, x2: 0, y2: 196, stroke: L.ORANGE, 'stroke-width': 2, opacity: 0.8 }, root);
    const verdict = L.text(root, '', 610, RY, { anchor: 'start', size: 14, weight: 700, fill: L.RED, opacity: 0 });
    const STEP = 0.75, T = STEP * 8 + 1.2;
    const setState = (t) => {
      const k = Math.min(7, Math.floor(t / STEP));
      const st = STATES[k];
      const x = k === 0 ? C.colX[0] - 30 : C.colX[k - 1] + 30;
      ptr.setAttribute('x1', 20 + x); ptr.setAttribute('x2', 20 + x);
      chips.forEach((c, i) => {
        c.textContent = String(st[i]);
        const bad = k === 7 && i === 2;
        c.setAttribute('fill', bad ? L.RED : i === 0 && st[0] === 'W' ? L.ORANGE : L.INK);
      });
      verdict.textContent = k === 7 ? 'stranded' : '';
      verdict.setAttribute('opacity', k === 7 ? 1 : 0);
    };
    L.timeline(svg, { T, setState });
  });
})();
