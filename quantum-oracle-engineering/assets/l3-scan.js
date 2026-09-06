// l3-scan.js -- slides 11 and 13: the rank-select scan.
//
//   data-mode="scan"    a pointer walks the nine cells; a three-qubit counter
//                       of empties ticks up; at the empty cell whose counter
//                       equals r the mark fires and the cell's index is
//                       written to the move register
//   data-mode="unwind"  the same walk backward: the counter decrements at
//                       each empty cell and ends at zero; only then does
//                       the move register place the stone
(function () {
  if (window.__l3ScanInit) return;
  window.__l3ScanInit = true;
  const L = window.L2;
  const N = 3, BOARD = [0, 1, 0, 0, 2, 0, 1, 0, 0], R = 3;
  document.querySelectorAll('svg.l3-scan').forEach((svg) => {
    const mode = svg.dataset.mode || 'scan';
    const root = L.el('g', {}, svg);
    const X = 60, Y = 40, SIZE = 210;
    const board = BOARD.slice();
    const B = L.board(root, { N, size: SIZE, x: X, y: Y, board });
    const empt = []; let rk = 0, target = -1;
    for (let i = 0; i < N * N; i++) if (!board[i]) { empt.push(i); if (rk === R) target = i; rk++; }
    const ptr = L.el('rect', { width: SIZE / N - 6, height: SIZE / N - 6, rx: 6, fill: 'none', stroke: L.ORANGE, 'stroke-width': 3 }, root);
    const mark = L.el('circle', { cx: X + B.cx(target), cy: Y + B.cy(target), r: B.r + 4, fill: 'none', stroke: L.GOLD, 'stroke-width': 4, opacity: 0 }, root);
    // counter and rank
    const RX = 420;
    L.text(root, 'empties so far', RX + 66, 52, { size: 12, fill: L.DIM });
    const bits = [0, 1, 2].map((k) => { L.el('rect', { x: RX + k * 46, y: 66, width: 40, height: 40, rx: 6, fill: '#fff', stroke: L.INK, 'stroke-width': 1.5 }, root);
      return L.text(root, '0', RX + k * 46 + 20, 86, { size: 18, mono: true, weight: 700 }); });
    const cnt = L.text(root, '= 0', RX + 150, 86, { anchor: 'start', size: 16, mono: true, fill: L.DIM });
    L.text(root, 'rank r', RX + 66, 140, { size: 12, fill: L.DIM });
    L.el('rect', { x: RX + 20, y: 154, width: 92, height: 40, rx: 6, fill: '#f3e8ff', stroke: L.PURPLE, 'stroke-width': 1.5 }, root);
    L.text(root, `r = ${R}`, RX + 66, 174, { size: 18, mono: true, weight: 700, fill: L.PURPLE });
    const status = L.text(root, '', RX + 120, 236, { size: 15, weight: 700, opacity: 0 });
    const sub = L.text(root, '', RX + 120, 262, { size: 12.5, fill: L.DIM, opacity: 0 });
    const STEP = 0.55, T = STEP * 9 + 1.6;
    const setState = (t) => {
      const k = Math.min(8, Math.floor(t / STEP));
      const seq = mode === 'scan' ? k : 8 - k;
      ptr.setAttribute('x', X + B.cx(seq) - (SIZE / N - 6) / 2); ptr.setAttribute('y', Y + B.cy(seq) - (SIZE / N - 6) / 2);
      // counter value after processing cell seq
      let c;
      if (mode === 'scan') { c = 0; for (let i = 0; i <= seq; i++) if (!BOARD[i]) c++; }
      else { c = empt.length; for (let i = 8; i >= seq; i--) if (!BOARD[i]) c--; }
      bits.forEach((b, j) => b.textContent = String((c >> (2 - j)) & 1));
      cnt.textContent = `= ${c}`;
      if (mode === 'scan') {
        const hit = seq >= target && t > STEP * target + 0.3;
        mark.setAttribute('opacity', hit ? 1 : 0);
        status.textContent = hit ? `empty and counter = ${R}: mark` : 'empty? counter = r?';
        sub.textContent = hit ? `the move register takes the index, ${target}` : '';
        status.setAttribute('opacity', 1); sub.setAttribute('opacity', hit ? 1 : 0);
      } else {
        const done = t >= STEP * 9, landed = t >= STEP * 9 + 0.7;
        if (landed && board[target] !== 1) { board[target] = 1; B.redraw(board); }
        if (!landed && board[target] === 1) { board[target] = 0; B.redraw(board); }
        status.textContent = landed ? 'now the stone lands' : done ? 'counter back to zero' : 'undo each increment';
        sub.textContent = landed ? 'one controlled gate reads the move register' : done ? 'ready for the next placement' : '';
        status.setAttribute('opacity', 1); sub.setAttribute('opacity', done ? 1 : 0);
        mark.setAttribute('opacity', landed ? 1 : 0);
      }
    };
    L.timeline(svg, { T, setState });
  });
})();
