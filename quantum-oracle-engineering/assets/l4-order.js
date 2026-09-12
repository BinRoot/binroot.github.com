// l4-order.js -- slides 14 and 15: place first, or unwind first?
//
// Two columns: Lesson 3's round-2 board, seven empties, four-bit counter.
// Left, order A: scan, place, clear.  Right, order B: scan, clear, place.
// The clearing step is labelled "clear counter" rather than "unwind" so it
// is not mistaken for the global inverse: it undoes only the scratch, while
// the placement is the round's result and stays.  The notes say that; the
// blocks name operations only.
// data-mode="ask" draws both orders and waits.  data-mode="answer" runs them
// side by side: both counters climb to seven during the scan; A places its
// stone, then its clearing pass finds only six empties and stops at one; B
// clears to zero first and places afterwards, and each column says why.
(function () {
  if (window.__l4OrderInit) return; window.__l4OrderInit = true;
  const L = window.L2;
  const N = 3, BOARD = window.L3.scanBoard, R = window.L3.rank; // rank 2 -> cell 3
  const EMPT = []; for (let i = 0; i < 9; i++) if (!BOARD[i]) EMPT.push(i);
  const TARGET = EMPT[R];
  document.querySelectorAll('svg.l4-order').forEach((svg) => {
    const answer = (svg.dataset.mode || 'ask') === 'answer';
    const root = L.el('g', {}, svg);
    const side = (x, title, order, col) => {
      const g = L.el('g', {}, root);
      L.text(g, title, x + 150, 28, { size: 26, weight: 700, fill: col });
      const B = L.board(g, { N, size: 138, x, y: 48, board: BOARD });
      // order blocks
      const gates = [];
      const SHOW = { scan: 'scan', unwind: 'clear counter', place: 'place' };
      order.forEach((s, i) => {
        const bx = x + 160, by = 56 + i * 40, bw = 160;
        const gate = L.el('rect', { x: bx, y: by, width: bw, height: 30, rx: 5, fill: '#fff', stroke: s === 'place' ? L.WOODLINE : L.INK, 'stroke-width': 1.4 }, g);
        L.text(g, SHOW[s], bx + bw / 2, by + 15, { size: 18, mono: true });
        gates.push({ label: s, gate });
        if (i < 2) L.el('path', { d: `M ${bx + bw / 2} ${by + 30} l 0 10 m -4 -5 l 4 5 l 4 -5`, fill: 'none', stroke: L.INK, 'stroke-width': 1.3 }, g);
      });
      // counter, with room under it for the verdict line
      L.text(g, 'counter', x + 69, 200, { size: 24, fill: L.DIM });
      const bits = [0, 1, 2, 3].map((k) => { L.el('rect', { x: x + 5 + k * 34, y: 212, width: 30, height: 34, rx: 5, fill: '#fff', stroke: L.INK, 'stroke-width': 1.4 }, g); return L.text(g, '0', x + 20 + k * 34, 229, { size: 28, mono: true, weight: 700 }); });
      const val = L.text(g, '', x + 69, 268, { size: 26, mono: true, weight: 700, opacity: 0 });
      // why the counter ends where it does, beside the bits
      const why = L.text(g, '', x + 160, 229, { anchor: 'start', size: 13, opacity: 0 });
      const ptr = L.el('rect', { width: 40, height: 40, rx: 6, fill: 'none', stroke: L.ORANGE, 'stroke-width': 2.5, opacity: 0 }, g);
      return { g, B, bits, val, why, gates, ptr, x };
    };
    const A = side(40, 'Place first', ['scan', 'place', 'unwind'], L.INK);
    const Bs = side(400, 'Clear first', ['scan', 'unwind', 'place'], L.INK);
    if (!answer) { L.text(root, '?', 380, 150, { size: 40, weight: 700, fill: L.ORANGE }); return; }
    const verdict = L.text(root, 'clear the counter first, then place', 380, 292, { size: 14, weight: 700, opacity: 0 });
    const STEP = 0.28, SCAN = STEP * 9, T = SCAN * 2 + 1.4 + 1.2;
    const paint = (S, count, board, cell, stageText) => {
      S.bits.forEach((b, j) => b.textContent = String((count >> (3 - j)) & 1));
      S.B.redraw(board);
      if (cell >= 0) { S.ptr.setAttribute('x', S.x + S.B.cx(cell) - 20); S.ptr.setAttribute('y', 48 + S.B.cy(cell) - 20); S.ptr.setAttribute('opacity', 1); } else S.ptr.setAttribute('opacity', 0);
      S.gates.forEach(({ label, gate }) => gate.setAttribute('fill', label === stageText ? '#e9edf5' : '#fff'));
    };
    const setState = (t) => {
      const placed = BOARD.slice(); placed[TARGET] = 1;
      // A: scan (0..SCAN), place (SCAN..SCAN+0.7), unwind (.. +SCAN), verdict
      [A, Bs].forEach((S) => S.why.setAttribute('opacity', 0)); verdict.setAttribute('opacity', 0);
      if (t < SCAN) { const k = Math.min(8, Math.floor(t / STEP)); let c = 0; for (let i = 0; i <= k; i++) if (!BOARD[i]) c++; paint(A, c, BOARD, k, 'scan'); paint(Bs, c, BOARD, k, 'scan'); A.val.setAttribute('opacity', 0); Bs.val.setAttribute('opacity', 0); }
      else if (t < SCAN + 0.7) { paint(A, EMPT.length, placed, TARGET, 'place'); paint(Bs, EMPT.length, BOARD, -1, 'unwind'); }
      else if (t < SCAN + 0.7 + SCAN) {
        const k = 8 - Math.min(8, Math.floor((t - SCAN - 0.7) / STEP));
        let ca = EMPT.length; for (let i = 8; i >= k; i--) if (!placed[i]) ca--;
        let cb = EMPT.length; for (let i = 8; i >= k; i--) if (!BOARD[i]) cb--;
        paint(A, ca, placed, k, 'unwind'); paint(Bs, cb, BOARD, k, 'unwind');
      } else {
        const late = t >= SCAN * 2 + 0.7 + 0.7;
        paint(A, 1, placed, -1, 'done');
        paint(Bs, 0, late ? placed : BOARD, late ? TARGET : -1, late ? 'place' : 'unwound');
        A.val.textContent = '= 1, dirty'; A.val.setAttribute('fill', L.RED); A.val.setAttribute('opacity', 1);
        Bs.val.textContent = '= 0, clean'; Bs.val.setAttribute('fill', L.GREEN); Bs.val.setAttribute('opacity', 1);
        A.why.textContent = '6 empties left: off by one'; A.why.setAttribute('fill', L.RED); A.why.setAttribute('opacity', 1);
        Bs.why.textContent = 'the 7 empties the scan saw'; Bs.why.setAttribute('fill', L.GREEN); Bs.why.setAttribute('opacity', 1);
        verdict.setAttribute('opacity', late ? 1 : 0);
        A.bits.forEach((b) => b.setAttribute('fill', L.RED)); Bs.bits.forEach((b) => b.setAttribute('fill', L.GREEN));
        return;
      }
      A.bits.forEach((b) => b.setAttribute('fill', L.INK)); Bs.bits.forEach((b) => b.setAttribute('fill', L.INK));
    };
    L.timeline(svg, { T, setState });
  });
})();
