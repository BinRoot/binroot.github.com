// l4-inplace.js -- slides 6 and 7: the in-place event against the synchronous one.
//
// One board after the round's placements and one set of dice, chosen so the
// two circuits disagree in two cells.  data-mode="run": a pointer walks the
// nine cells; the left board flips each stone the moment it decides, the
// right board (Lesson 3's) only marks its decisions and flips them together at
// the end; the cells that differ get red rings.  data-mode="diagnose": frozen
// at cell two, with its friend count before and after cell one flipped, and
// the exact win rates of the two games.
//
// Rules: a stone flips when its d20 is below 4 - k, k its friendly neighbours.
// Board (row-major): B B . / W B . / . W .   dice: 1 2 - 3 10 - - 15 -
//   synchronous: cell 1 flips (1 < 3), cell 4 flips (3 < 4)     -> W B . / B B . / . W .
//   in place:    cell 1 flips, then cell 2 sees k = 1 and flips (2 < 3),
//                cell 4 sees cell 1 as W, k = 1, 3 < 3 fails  -> W W . / W B . / . W .
(function () {
  if (window.__l4InplaceInit) return; window.__l4InplaceInit = true;
  const L = window.L2;
  const N = 3, BOARD = [1, 1, 0, 2, 1, 0, 0, 2, 0], DICE = [1, 2, 0, 3, 10, 0, 0, 15, 0];
  const nb = L.sway.neighbors(N);
  const thr = (b, i) => 4 - L.sway.friendly(b, nb, i);
  // in-place trajectory: board after processing cells 0..k
  const seq = []; { const b = Uint8Array.from(BOARD); for (let i = 0; i < 9; i++) { if (b[i] && DICE[i] < thr(b, i)) b[i] = 3 - b[i]; seq.push(Uint8Array.from(b)); } }
  const sync = L.sway.event(BOARD, nb, DICE);
  const syncFlips = []; for (let i = 0; i < 9; i++) if (BOARD[i] && DICE[i] < thr(BOARD, i)) syncFlips.push(i);
  const differ = []; for (let i = 0; i < 9; i++) if (seq[8][i] !== sync[i]) differ.push(i);
  document.querySelectorAll('svg.l4-inplace').forEach((svg) => {
    const mode = svg.dataset.mode || 'run';
    const root = L.el('g', {}, svg);
    const SIZE = 186, Y = 52;
    const left = L.board(root, { N, size: SIZE, x: 70, y: Y, board: BOARD });
    const right = L.board(root, { N, size: SIZE, x: 504, y: Y, board: BOARD });
    L.text(root, 'the shortcut: flip as you go', 70 + SIZE / 2, 30, { size: 14, weight: 700, fill: L.ORANGE });
    L.text(root, "Lesson 3: decide, then flip", 504 + SIZE / 2, 30, { size: 14, weight: 700 });
    const cellPos = (B, X, i) => [X + B.cx(i), Y + B.cy(i)];
    const ptrL = L.el('rect', { width: SIZE / N - 6, height: SIZE / N - 6, rx: 6, fill: 'none', stroke: L.ORANGE, 'stroke-width': 3, opacity: 0 }, root);
    const ptrR = L.el('rect', { width: SIZE / N - 6, height: SIZE / N - 6, rx: 6, fill: 'none', stroke: L.INK, 'stroke-width': 2, opacity: 0 }, root);
    const marks = L.el('g', {}, root), rings = L.el('g', {}, root);
    // middle column
    const MX = 380;
    const cellT = L.text(root, '', MX, 90, { size: 15, weight: 700, mono: true, opacity: 0 });
    const kT = L.text(root, '', MX, 118, { size: 13, fill: L.DIM, opacity: 0 });
    const dT = L.text(root, '', MX, 140, { size: 13, fill: L.DIM, opacity: 0 });
    const vT = L.text(root, '', MX, 168, { size: 14, weight: 700, opacity: 0 });
    const die = L.el('g', { opacity: 0 }, root);
    const ring = (B, X, i, col, parent) => { const [cx, cy] = cellPos(B, X, i); L.el('circle', { cx, cy, r: B.r + 5, fill: 'none', stroke: col, 'stroke-width': 3 }, parent); };
    const place = (ptr, B, X, i) => { const [cx, cy] = cellPos(B, X, i); ptr.setAttribute('x', cx - (SIZE / N - 6) / 2); ptr.setAttribute('y', cy - (SIZE / N - 6) / 2); ptr.setAttribute('opacity', 1); };
    if (mode === 'diagnose') {
      left.redraw(seq[0]); right.redraw(BOARD);
      place(ptrL, left, 70, 1); place(ptrR, right, 504, 1);
      ring(left, 70, 0, L.RED, rings);
      L.text(root, 'cell one already flipped', 70 + SIZE / 2, Y + SIZE + 26, { size: 13, fill: L.RED, weight: 700 });
      L.text(root, 'friends of cell two: 1', 70 + SIZE / 2, Y + SIZE + 46, { size: 13, fill: L.DIM });
      L.text(root, 'the board the rules mean', 504 + SIZE / 2, Y + SIZE + 26, { size: 13, weight: 700 });
      L.text(root, 'friends of cell two: 2', 504 + SIZE / 2, Y + SIZE + 46, { size: 13, fill: L.DIM });
      L.die(die, MX, 96, 20, DICE[1], { fill: '#fff', stroke: L.INK }); die.setAttribute('opacity', 1);
      L.text(root, 'die 2', MX, 128, { size: 12, fill: L.DIM });
      L.text(root, 'threshold 3: flips', MX, 154, { size: 13, weight: 700, fill: L.ORANGE });
      L.text(root, 'threshold 2: stays', MX, 176, { size: 13, weight: 700 });
      const g = L.el('g', {}, root);
      L.text(g, '.275', MX - 60, 236, { size: 26, weight: 700, mono: true, fill: L.ORANGE });
      L.text(g, 'the shortcut', MX - 60, 262, { size: 12, fill: L.DIM });
      L.text(g, '.271', MX + 60, 236, { size: 26, weight: 700, mono: true });
      L.text(g, 'the game', MX + 60, 262, { size: 12, fill: L.DIM });
      L.text(g, 'Black wins, exact, 3 × 3, two rounds', MX, 290, { size: 12, fill: L.DIM, italic: true });
      return;
    }
    const STEP = 0.8, T = STEP * 9 + 1.8;
    const setState = (t) => {
      const k = Math.min(8, Math.floor(t / STEP)), done = t >= STEP * 9, verdict = t >= STEP * 9 + 0.8;
      left.redraw(seq[k]);
      right.redraw(done ? sync : BOARD);
      marks.textContent = ''; rings.textContent = '';
      if (!done) { place(ptrL, left, 70, k); place(ptrR, right, 504, k); } else { ptrL.setAttribute('opacity', 0); ptrR.setAttribute('opacity', 0); }
      syncFlips.filter((i) => i <= k && !done).forEach((i) => ring(right, 504, i, L.ORANGE, marks));
      const occ = !!BOARD[k] || !!seq[Math.max(0, k - 1)][k];
      const b = k > 0 ? seq[k - 1] : BOARD;
      if (!done && b[k]) {
        const kk = L.sway.friendly(b, nb, k), th = 4 - kk, flips = DICE[k] < th;
        cellT.textContent = `cell ${k + 1}`; kT.textContent = `friends ${kk}, threshold ${th}`; dT.textContent = `die ${DICE[k]}`;
        vT.textContent = flips ? 'flips' : 'stays'; vT.setAttribute('fill', flips ? L.ORANGE : L.INK);
        die.textContent = ''; L.die(die, MX, 206, 18, DICE[k], { fill: flips ? L.ORANGE : '#fff', stroke: L.INK, ink: flips ? '#fff' : L.INK });
        [cellT, kT, dT, vT, die].forEach((e) => e.setAttribute('opacity', 1));
      } else if (!done) {
        cellT.textContent = `cell ${k + 1}`; kT.textContent = 'empty'; dT.textContent = ''; vT.textContent = '';
        cellT.setAttribute('opacity', 1); kT.setAttribute('opacity', 1); dT.setAttribute('opacity', 0); vT.setAttribute('opacity', 0); die.setAttribute('opacity', 0);
      } else {
        cellT.textContent = verdict ? 'two cells differ' : 'both done'; cellT.setAttribute('fill', verdict ? L.RED : L.INK);
        kT.textContent = verdict ? 'same board, same dice' : ''; dT.textContent = ''; vT.textContent = verdict ? 'where is the bug?' : '';
        vT.setAttribute('fill', L.INK);
        [cellT, kT, vT].forEach((e) => e.setAttribute('opacity', 1)); dT.setAttribute('opacity', 0); die.setAttribute('opacity', 0);
        if (verdict) differ.forEach((i) => { ring(left, 70, i, L.RED, rings); ring(right, 504, i, L.RED, rings); });
      }
    };
    L.timeline(svg, { T, setState });
  });
})();
