// l4-occ.js -- slide 10: occupancy updates in place, and that is fine.
//
// The occupancy register as a row of nine cells.  Four placements land stones
// in it, each leaving a move-index chip beneath.  Then the tape runs backward:
// each chip, read in reverse order, lifts its own stone off.  Nothing had to be
// copied, because the record of every change is still there.
(function () {
  if (window.__l4OccInit) return; window.__l4OccInit = true;
  const L = window.L2;
  const MOVES = [4, 1, 6, 3], COL = [1, 2, 1, 2];
  document.querySelectorAll('svg.l4-occ').forEach((svg) => {
    const root = L.el('g', {}, svg);
    const CELL = 56, X0 = 380 - 4.5 * CELL, Y = 70;
    L.text(root, 'occupancy, one register for the whole rollout', 380, 36, { size: 14, weight: 700 });
    for (let i = 0; i < 9; i++) {
      L.el('rect', { x: X0 + i * CELL + 2, y: Y, width: CELL - 4, height: CELL - 4, rx: 6, fill: '#efe6d3', stroke: L.WOODLINE, 'stroke-width': 1.2 }, root);
      L.text(root, String(i), X0 + i * CELL + CELL / 2, Y + CELL + 10, { size: 11, fill: L.DIM, mono: true });
    }
    const stones = L.el('g', {}, root);
    const chips = MOVES.map((m, k) => {
      const g = L.el('g', { opacity: 0 }, root);
      const x = 150 + k * 150;
      L.el('rect', { x: x - 54, y: 180, width: 108, height: 34, rx: 8, fill: '#f3e8ff', stroke: L.PURPLE, 'stroke-width': 1.4 }, g);
      L.text(g, `move ${k + 1} = ${m}`, x, 197, { size: 14, mono: true, weight: 700, fill: L.PURPLE });
      return g;
    });
    const dir = L.text(root, '', 380, 250, { size: 15, weight: 700 });
    const sub = L.text(root, '', 380, 274, { size: 12.5, fill: L.DIM });
    const STEP = 0.8, T = STEP * 8 + 1.6;
    const setState = (t) => {
      let n;
      const fwdEnd = STEP * 4 + 0.8;
      if (t < fwdEnd) n = Math.min(4, Math.floor(t / STEP + 0.001));
      else n = Math.max(0, 4 - Math.floor((t - fwdEnd) / STEP + 0.001));
      stones.textContent = '';
      for (let k = 0; k < n; k++) L.stone(stones, X0 + MOVES[k] * CELL + CELL / 2, Y + CELL / 2 - 2, 17, COL[k]);
      chips.forEach((c, k) => c.setAttribute('opacity', k < (t < fwdEnd ? n : 4) ? 1 : 0.35));
      const back = t >= fwdEnd;
      dir.textContent = back ? (n === 0 ? 'back to empty' : 'backward') : 'forward';
      dir.setAttribute('fill', back ? L.BLUE : L.INK);
      sub.textContent = back ? 'each index lifts its own stone off' : 'each placement writes one cell and keeps its index';
    };
    L.timeline(svg, { T, setState });
  });
})();
