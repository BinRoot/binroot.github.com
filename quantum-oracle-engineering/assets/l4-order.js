// l4-order.js -- slides 14 and 15: place first, or unwind first?
//
// Two columns, each a board with five empties and a three-bit counter.
// Left, order A: scan, place, unwind.  Right, order B: scan, unwind, place.
// data-mode="ask" draws both orders and waits.  data-mode="answer" runs them
// side by side: both counters climb to five during the scan; A places its
// stone, then its unwind finds only four empties and stops at one; B unwinds
// to zero first and places afterwards.
(function () {
  if (window.__l4OrderInit) return; window.__l4OrderInit = true;
  const L = window.L2;
  const N = 3, BOARD = [1, 0, 2, 0, 1, 0, 0, 2, 0], R = 3;      // five empties: 1 3 5 6 8; rank 3 -> cell 6
  const EMPT = []; for (let i = 0; i < 9; i++) if (!BOARD[i]) EMPT.push(i);
  const TARGET = EMPT[R];
  document.querySelectorAll('svg.l4-order').forEach((svg) => {
    const answer = (svg.dataset.mode || 'ask') === 'answer';
    const root = L.el('g', {}, svg);
    const side = (x, title, order, col) => {
      const g = L.el('g', {}, root);
      L.text(g, title, x + 150, 28, { size: 14, weight: 700, fill: col });
      const B = L.board(g, { N, size: 138, x, y: 48, board: BOARD });
      // order blocks
      order.forEach((s, i) => {
        const bx = x + 160, by = 56 + i * 40;
        L.el('rect', { x: bx, y: by, width: 120, height: 30, rx: 5, fill: '#fff', stroke: s === 'place' ? L.WOODLINE : L.INK, 'stroke-width': 1.4 }, g);
        L.text(g, s, bx + 60, by + 15, { size: 13, mono: true });
        if (i < 2) L.el('path', { d: `M ${bx + 60} ${by + 30} l 0 10 m -4 -5 l 4 5 l 4 -5`, fill: 'none', stroke: L.INK, 'stroke-width': 1.3 }, g);
      });
      // counter
      L.text(g, 'counter', x + 69, 212, { size: 11.5, fill: L.DIM });
      const bits = [0, 1, 2].map((k) => { L.el('rect', { x: x + 12 + k * 40, y: 222, width: 34, height: 34, rx: 5, fill: '#fff', stroke: L.INK, 'stroke-width': 1.4 }, g); return L.text(g, '0', x + 29 + k * 40, 239, { size: 16, mono: true, weight: 700 }); });
      const val = L.text(g, '', x + 69, 280, { size: 14, mono: true, weight: 700, opacity: 0 });
      const stage = L.text(g, '', x + 220, 200, { size: 13, weight: 700, opacity: 0 });
      const ptr = L.el('rect', { width: 40, height: 40, rx: 6, fill: 'none', stroke: L.ORANGE, 'stroke-width': 2.5, opacity: 0 }, g);
      return { g, B, bits, val, stage, ptr, x };
    };
    const A = side(40, 'A: scan, place, unwind', ['scan', 'place', 'unwind'], L.INK);
    const Bs = side(400, 'B: scan, unwind, place', ['scan', 'unwind', 'place'], L.INK);
    if (!answer) { L.text(root, '?', 380, 150, { size: 40, weight: 700, fill: L.ORANGE }); return; }
    const STEP = 0.28, SCAN = STEP * 9, T = SCAN * 2 + 1.4 + 1.2;
    const paint = (S, count, board, cell, stageText) => {
      S.bits.forEach((b, j) => b.textContent = String((count >> (2 - j)) & 1));
      S.B.redraw(board);
      if (cell >= 0) { S.ptr.setAttribute('x', S.x + S.B.cx(cell) - 20); S.ptr.setAttribute('y', 48 + S.B.cy(cell) - 20); S.ptr.setAttribute('opacity', 1); } else S.ptr.setAttribute('opacity', 0);
      S.stage.textContent = stageText; S.stage.setAttribute('opacity', stageText ? 1 : 0);
    };
    const setState = (t) => {
      const placed = BOARD.slice(); placed[TARGET] = 1;
      // A: scan (0..SCAN), place (SCAN..SCAN+0.7), unwind (.. +SCAN), verdict
      if (t < SCAN) { const k = Math.min(8, Math.floor(t / STEP)); let c = 0; for (let i = 0; i <= k; i++) if (!BOARD[i]) c++; paint(A, c, BOARD, k, 'scan'); paint(Bs, c, BOARD, k, 'scan'); A.val.setAttribute('opacity', 0); Bs.val.setAttribute('opacity', 0); }
      else if (t < SCAN + 0.7) { paint(A, 5, placed, TARGET, 'place'); paint(Bs, 5, BOARD, -1, 'unwind'); }
      else if (t < SCAN + 0.7 + SCAN) {
        const k = 8 - Math.min(8, Math.floor((t - SCAN - 0.7) / STEP));
        let ca = 5; for (let i = 8; i >= k; i--) if (!placed[i]) ca--;
        let cb = 5; for (let i = 8; i >= k; i--) if (!BOARD[i]) cb--;
        paint(A, ca, placed, k, 'unwind'); paint(Bs, cb, BOARD, k, 'unwind');
      } else {
        const late = t >= SCAN * 2 + 0.7 + 0.7;
        paint(A, 1, placed, -1, 'done');
        paint(Bs, 0, late ? placed : BOARD, late ? TARGET : -1, late ? 'place' : 'unwound');
        A.val.textContent = '= 1, dirty'; A.val.setAttribute('fill', L.RED); A.val.setAttribute('opacity', 1);
        Bs.val.textContent = '= 0'; Bs.val.setAttribute('fill', L.GREEN); Bs.val.setAttribute('opacity', 1);
        A.bits.forEach((b) => b.setAttribute('fill', L.RED)); Bs.bits.forEach((b) => b.setAttribute('fill', L.GREEN));
        return;
      }
      A.bits.forEach((b) => b.setAttribute('fill', L.INK)); Bs.bits.forEach((b) => b.setAttribute('fill', L.INK));
    };
    L.timeline(svg, { T, setState });
  });
})();
