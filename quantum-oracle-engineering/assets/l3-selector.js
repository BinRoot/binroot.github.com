// l3-selector.js -- slides 9 and 16: the uniform-prefix state.  2^w basis
// states as bars; the first m rise to amplitude 1/sqrt(m), the rest stay at
// zero.  One header line above, which also names the qubit count, the
// amplitude as a tick on the left, nothing else competing with the bars.  The same picture serves the move selector
// (m = 7 on 3 qubits) and the die (m = 20 on 5 qubits): the same trick twice.
// The move selector also shows the trace's board beside the bars, with the
// empty cells ranked r0..r6, so the seven and the rank are the same thing
// seen twice: a rank names an empty cell, not a board position.
(function () {
  if (window.__l3SelInit) return;
  window.__l3SelInit = true;
  const L = window.L2;
  const queue = window.__l3SelectorQueue || [];
  document.querySelectorAll('svg.l3-selector').forEach((svg, k) => {
    const d = queue[k] || { m: '9', w: '4' };
    const m = +d.m, w = +d.w, K = 1 << w;
    const root = L.el('g', {}, svg);
    const die = m === 20;
    const T = window.L3;
    const board = !die && T && T.scanBoard;
    const X0 = 110, X1 = board ? 540 : 700, Y0 = 232, H = 120;
    const bw = (X1 - X0) / K;
    L.text(root, die ? `a fair d20 on ${w} qubits` : `${m} legal cells on ${w} qubits`, 380, 34, { size: 17, weight: 700 });
    L.text(root, die ? `equal amplitude on faces 0 to 19, zero on 20 to 31` : `equal amplitude on ranks 0 to ${m - 1}, zero on ${m} to ${K - 1}`, 380, 60, { size: 13, fill: L.DIM });
    L.el('line', { x1: X0, y1: Y0, x2: X1, y2: Y0, stroke: L.INK, 'stroke-width': 1.4 }, root);
    L.el('line', { x1: X0, y1: Y0, x2: X0, y2: Y0 - H - 16, stroke: L.RULE, 'stroke-width': 1 }, root);
    const bars = [];
    // the trace's chosen rank is ringed on the board, so its bar is outlined
    // in the same orange: one rank, seen twice
    const pick = board ? T.rank : -1;
    for (let i = 0; i < K; i++) {
      const x = X0 + i * bw;
      bars.push(L.el('rect', { x: x + 2, y: Y0, width: Math.max(1, bw - 4), height: 0, rx: 3, fill: i < m ? L.BLUE : L.GRAY, opacity: i < m ? 0.9 : 0.35,
        stroke: i === pick ? L.ORANGE : 'none', 'stroke-width': 2.5 }, root));
      if (K <= 16 || i % 4 === 0 || i === K - 1) L.text(root, String(i), x + bw / 2, Y0 + 16, { size: 11, mono: true, weight: i === pick ? 700 : 400, fill: i === pick ? L.ORANGE : L.DIM });
    }
    L.text(root, die ? 'face' : 'rank', (X0 + X1) / 2, Y0 + 36, { size: 12, fill: L.DIM });
    const tick = L.el('line', { x1: X0 - 6, y1: Y0 - H, x2: X0, y2: Y0 - H, stroke: L.BLUE, 'stroke-width': 1.5, opacity: 0 }, root);
    const amp = L.text(root, `1/√${m}`, X0 - 10, Y0 - H, { anchor: 'end', size: 14, mono: true, fill: L.BLUE, weight: 700, opacity: 0 });
    const zero = L.text(root, '0', X0 - 10, Y0, { anchor: 'end', size: 12, mono: true, fill: L.DIM });
    if (board) {
      const B = L.board(root, { N: T.N, size: 114, x: 585, y: Y0 - H - 8, board: T.scanBoard });
      let r = 0;
      T.scanBoard.forEach((v, i) => {
        if (v) return;
        const chosen = r === T.rank;
        // a wood-coloured disc under each label, so the grid lines do not run through it
        L.el('circle', { cx: B.cx(i), cy: B.cy(i), r: B.r - 1, fill: L.WOOD }, B.g);
        if (chosen) L.el('circle', { cx: B.cx(i), cy: B.cy(i), r: B.r, fill: 'none', stroke: L.ORANGE, 'stroke-width': 2.5 }, B.g);
        L.text(B.g, 'r' + r, B.cx(i), B.cy(i) + 1, { size: 13, mono: true, weight: 700, fill: chosen ? L.ORANGE : L.BLUE });
        r++;
      });
      L.text(root, 'empty cells, ranked', 642, Y0 + 16, { size: 11, fill: L.DIM });
    }
    L.timeline(svg, { T: 2.4, setState: (t) => {
      const u = L.win(t, 0.3, 1.2, L.outQuart);
      bars.forEach((b, i) => { const h = i < m ? H * u : 3 * u; b.setAttribute('y', Y0 - h); b.setAttribute('height', h); });
      tick.setAttribute('opacity', L.win(t, 1.3, 0.4)); amp.setAttribute('opacity', L.win(t, 1.3, 0.4));
    } });
  });
})();
