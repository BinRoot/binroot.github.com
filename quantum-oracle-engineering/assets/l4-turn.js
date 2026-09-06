// l4-turn.js -- slide 4: forward once, backward once.
//
// Lesson 2's rotation Q as four boxes on one wire: A, S_good, A-dagger, S_0.
// A pointer sweeps the wire three turns.  Inside A a small board fills stone
// by stone while the pointer crosses it; inside A-dagger the same board
// empties in reverse order.  The turn counter ticks; the figure holds after
// the third turn.
(function () {
  if (window.__l4TurnInit) return; window.__l4TurnInit = true;
  const L = window.L2;
  document.querySelectorAll('svg.l4-turn').forEach((svg) => {
    const root = L.el('g', {}, svg);
    const WY = 160, X0 = 50, X1 = 720;
    L.el('line', { x1: X0, y1: WY, x2: X1, y2: WY, stroke: L.WIRE, 'stroke-width': 1.6 }, root);
    L.text(root, '|0⟩', X0 - 10, WY, { anchor: 'end', size: 16, serif: true, fill: L.DIM });
    const BOX = [
      { x: 90, w: 120, math: { base: 'A' }, board: 'fill' },
      { x: 250, w: 90, math: { base: 'S', sub: 'good' } },
      { x: 380, w: 120, math: { base: 'A', sup: '†' }, board: 'empty' },
      { x: 540, w: 90, math: { base: 'S', sub: '0' } }
    ];
    const ORDER = [0, 1, 3, 4];                        // stones placed, in order
    const boards = [];
    const boxes = BOX.map((b) => {
      const g = L.el('g', {}, root);
      const tall = !!b.board;
      const y0 = tall ? WY - 62 : WY - 30, h = tall ? 124 : 60;
      const r = L.el('rect', { x: b.x, y: y0, width: b.w, height: h, rx: 6, fill: '#fff', stroke: L.INK, 'stroke-width': 1.6 }, g);
      L.mathText(g, b.x + b.w / 2, tall ? y0 + 18 : WY, b.math, { size: 20 });
      if (b.board) boards.push({ B: L.board(g, { N: 3, size: 66, x: b.x + b.w / 2 - 33, y: y0 + 36 }), kind: b.board });
      return { g, r, b };
    });
    const ptr = L.el('circle', { cx: X0, cy: WY, r: 7, fill: L.ORANGE }, root);
    const turn = L.text(root, 'turn 1', 380, 30, { size: 16, weight: 700, mono: true });
    const sub = L.text(root, '', 380, 280, { size: 13, fill: L.DIM });
    const TURN = 2.8, TURNS = 3, T = TURN * TURNS + 0.4;
    const setState = (t) => {
      const k = Math.min(TURNS - 1, Math.floor(t / TURN)), u = t >= TURN * TURNS ? 1 : (t - k * TURN) / TURN;
      const x = L.lerp(X0, X1, u);
      ptr.setAttribute('cx', x);
      turn.textContent = `turn ${k + 1}`;
      boxes.forEach(({ r, b }) => r.setAttribute('stroke', x >= b.x && x <= b.x + b.w ? L.ORANGE : L.INK));
      boards.forEach(({ B, kind }, i) => {
        const b = BOX[kind === 'fill' ? 0 : 2];
        const f = L.clamp01((x - b.x) / b.w);
        const n = x < b.x ? (kind === 'fill' ? 0 : 4) : x > b.x + b.w ? (kind === 'fill' ? 4 : 0) : Math.round(kind === 'fill' ? f * 4 : (1 - f) * 4);
        const board = [0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (let j = 0; j < n; j++) board[ORDER[j]] = j % 2 ? 2 : 1;
        B.redraw(board);
      });
      sub.textContent = x < 220 ? 'the rollout runs forward' : x < 350 ? 'flip the sign of the wins' : x < 510 ? 'the rollout runs backward' : 'reflect about the start';
    };
    L.timeline(svg, { T, setState });
  });
})();
