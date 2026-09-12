// The prefix counter means "empty cells strictly before this cell".
// Every cell has two beats: compare against the prefix, then increment it.
(function () {
  if (window.__l3ScanInit) return;
  window.__l3ScanInit = true;
  const L = window.L2, D = window.L3, N = D.N, BOARD = D.scanBoard, R = D.rank;
  const empty = BOARD.flatMap((v, i) => v ? [] : [i]), target = empty[R];
  document.querySelectorAll('svg.l3-scan').forEach(svg => {
    const mode = svg.dataset.mode || 'scan', root = L.el('g', {}, svg);
    const X = 45, Y = 48, SIZE = 200, board = BOARD.slice();
    const B = L.board(root, { N, size: SIZE, x: X, y: Y, board });
    const ptr = L.el('rect', { width: SIZE / N - 6, height: SIZE / N - 6, rx: 6, fill: 'none', stroke: L.ORANGE, 'stroke-width': 3 }, root);
    const mark = L.el('circle', { cx: X + B.cx(target), cy: Y + B.cy(target), r: B.r + 4, fill: 'none', stroke: L.GOLD, 'stroke-width': 3, opacity: 0 }, root);
    const RX = 365;
    L.text(root, 'prefix counter: 4 qubits (0–9)', RX + 124, 51, { size: 13, fill: L.DIM });
    const bits = [3, 2, 1, 0].map((b, k) => {
      L.el('rect', { x: RX + k * 44, y: 67, width: 38, height: 38, rx: 6, fill: '#fff', stroke: L.INK, 'stroke-width': 1.4 }, root);
      return L.text(root, '0', RX + k * 44 + 19, 86, { size: 18, mono: true, weight: 700 });
    });
    const count = L.text(root, '', RX + 192, 86, { anchor: 'start', size: 16, mono: true, fill: L.DIM });
    L.text(root, 'rank r = ' + R, RX + 124, 141, { size: 18, mono: true, weight: 700, fill: L.PURPLE });
    const status = L.text(root, '', RX + 124, 190, { size: 14, weight: 700 });
    const sub = L.text(root, '', RX + 124, 219, { size: 12.5, fill: L.DIM });
    const foot = L.text(root, 'round 2: Black selects cell ' + target, 380, 282, { size: 13, fill: L.DIM, opacity: 0 });
    // Paced to be talked over: one beat per cell, a word or two of status
    // per cell (the presenter says the rest), the counter ticking late in
    // the beat, and the matching cell held longer.  About 18 s, no presses.
    const STEP = 1.8, HOLD = mode === 'scan' ? 1.6 : 0;
    const starts = []; let acc = 0;
    for (let i = 0; i < 9; i++) {
      starts.push(acc);
      const cell = mode === 'scan' ? i : 8 - i;
      acc += STEP + (mode === 'scan' && cell === target ? HOLD : 0);
    }
    const end = acc;
    L.timeline(svg, { T: end + 1.6, setState: t => {
      let k = 0; while (k < 8 && t >= starts[k + 1]) k++;
      const cell = mode === 'scan' ? k : 8 - k;
      const beat = (k < 8 ? starts[k + 1] : end) - starts[k];
      const incremented = t - starts[k] >= beat * 0.6;
      const done = t >= end, landed = mode === 'unwind' && t >= end + 0.7;
      const prior = BOARD.slice(0, cell).filter(v => !v).length;
      let c = mode === 'scan' ? prior + Number(incremented && !BOARD[cell]) : BOARD.slice(0, cell + Number(!incremented)).filter(v => !v).length;
      if (done) c = mode === 'scan' ? empty.length : 0;
      bits.forEach((b, j) => { b.textContent = String((c >> (3 - j)) & 1); });
      count.textContent = '= ' + c;
      ptr.setAttribute('x', X + B.cx(cell) - (SIZE / N - 6) / 2);
      ptr.setAttribute('y', Y + B.cy(cell) - (SIZE / N - 6) / 2);
      ptr.setAttribute('opacity', done ? 0 : 1);
      foot.setAttribute('opacity', done ? 1 : 0);
      if (mode === 'scan') {
        mark.setAttribute('opacity', t >= starts[target] ? 1 : 0);
        status.textContent = done ? 'move index = ' + target : BOARD[cell] ? 'occupied' : cell === target ? 'match' : 'empty';
        sub.textContent = done ? 'unwind next' : '';
      } else {
        board[target] = landed ? 1 : 0; B.redraw(board);
        mark.setAttribute('opacity', 1);
        status.textContent = landed ? 'place Black' : done ? 'counter back to zero' : BOARD[cell] ? 'occupied' : 'undo';
        sub.textContent = '';
      }
    } });
  });
})();
