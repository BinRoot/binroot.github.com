// l4-life.js -- slide 8: you already know this bug.
//
// Conway's Life on two 7x7 grids from the same seed, a toad (a period-two
// oscillator).  Left: the textbook update, every cell decided from the old
// generation, so the toad breathes in and out.  Right: the update done in
// place in reading order, each cell reading neighbours that already changed,
// so the toad grows into something else.  Cells that differ from the left
// grid are ringed orange.  Six generations, then hold.
(function () {
  if (window.__l4LifeInit) return; window.__l4LifeInit = true;
  const L = window.L2;
  const W = 7, HGT = 7, TOAD = [[3, 2], [3, 3], [3, 4], [4, 1], [4, 2], [4, 3]];
  const fresh = () => { const g = []; for (let r = 0; r < HGT; r++) g.push(new Array(W).fill(0)); TOAD.forEach(([r, c]) => { g[r][c] = 1; }); return g; };
  const nbs = (g, r, c) => { let n = 0; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { if (!dr && !dc) continue; const rr = r + dr, cc = c + dc; if (rr >= 0 && cc >= 0 && rr < HGT && cc < W) n += g[rr][cc]; } return n; };
  const rule = (alive, n) => (alive && (n === 2 || n === 3)) || (!alive && n === 3) ? 1 : 0;
  const stepBuffered = (g) => { const out = g.map((row) => row.slice()); for (let r = 0; r < HGT; r++) for (let c = 0; c < W; c++) out[r][c] = rule(g[r][c], nbs(g, r, c)); return out; };
  const stepInPlace = (g) => { const out = g.map((row) => row.slice()); for (let r = 0; r < HGT; r++) for (let c = 0; c < W; c++) out[r][c] = rule(out[r][c], nbs(out, r, c)); return out; };
  const GENS = 6;
  const A = [fresh()], B = [fresh()];
  for (let i = 0; i < GENS; i++) { A.push(stepBuffered(A[i])); B.push(stepInPlace(B[i])); }
  document.querySelectorAll('svg.l4-life').forEach((svg) => {
    const root = L.el('g', {}, svg);
    const CELL = 26, Y = 56;
    const grid = (x, title, col) => {
      const g = L.el('g', {}, root);
      L.text(g, title, x + W * CELL / 2, 34, { size: 14, weight: 700, fill: col });
      const cells = [];
      for (let r = 0; r < HGT; r++) for (let c = 0; c < W; c++) cells.push(L.el('rect', { x: x + c * CELL + 1, y: Y + r * CELL + 1, width: CELL - 2, height: CELL - 2, rx: 3, fill: '#eee' }, g));
      const marks = L.el('g', {}, g);
      return { cells, marks, x };
    };
    const gl = grid(110, 'two buffers', L.INK), gr = grid(470, 'in place, reading order', L.ORANGE);
    const gen = L.text(root, 'generation 0', 380, 150, { size: 15, weight: 700, mono: true });
    const sub = L.text(root, '', 380, 176, { size: 12.5, fill: L.DIM });
    const paint = (n) => {
      const a = A[n], b = B[n];
      gl.cells.forEach((cel, i) => cel.setAttribute('fill', a[Math.floor(i / W)][i % W] ? L.INK : '#eee'));
      gr.cells.forEach((cel, i) => cel.setAttribute('fill', b[Math.floor(i / W)][i % W] ? L.INK : '#eee'));
      gr.marks.textContent = '';
      for (let i = 0; i < W * HGT; i++) { const r = Math.floor(i / W), c = i % W; if (a[r][c] !== b[r][c]) L.el('rect', { x: gr.x + c * CELL + 1, y: Y + r * CELL + 1, width: CELL - 2, height: CELL - 2, rx: 3, fill: 'none', stroke: L.ORANGE, 'stroke-width': 2.2 }, gr.marks); }
      gen.textContent = `generation ${n}`;
      sub.textContent = n === 0 ? 'the same toad' : 'orange: cells that differ';
    };
    const STEP = 0.9;
    L.timeline(svg, { T: STEP * GENS + 1.2, setState: (t) => paint(Math.min(GENS, Math.floor(t / STEP))) });
  });
})();
