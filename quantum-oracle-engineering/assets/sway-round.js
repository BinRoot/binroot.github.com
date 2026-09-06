// sway-round.js -- slide 26: Black, White, then the board.
//
// One round on the curated board, played slowly and once (about eight
// seconds), then held on its final state:
//   1.2 s  Black places on a random empty cell (orange ring)
//   2.7 s  White places
//   4.2 s  every stone shows its d20, held long enough to read
//   5.2 s  the dice that flip their stone turn orange
//   6.7 s  the flips land together, the dice go, the round counter ticks
// The round is seeded, so it plays the same way every time.
(function () {
  const svg = document.getElementById('sway-round-fig');
  if (!svg) return;
  const L = window.L2;
  const D = window.SWAY_DATA;
  const N = D.N, nb = L.sway.neighbors(N);
  const root = L.el('g', {}, svg);
  const B = L.board(root, { N, size: 230, x: 60, y: 40, board: D.board });
  // beat labels on the right
  const BX = 420;
  const beats = ['Black places', 'White places', 'Sway!'].map((s, i) => {
    const g = L.el('g', { transform: `translate(${BX},${90 + i * 56})` }, root);
    L.el('circle', { cx: 0, cy: 0, r: 16, fill: '#fff', stroke: L.INK, 'stroke-width': 1.4 }, g);
    L.text(g, String(i + 1), 0, 0, { size: 14, weight: 700, mono: true });
    L.text(g, s, 30, 0, { anchor: 'start', size: 18, weight: i === 2 ? 700 : 400, fill: i === 2 ? L.ORANGE : L.INK });
    return g;
  });
  const hLab = L.text(root, 'round 1 of 3', 620, 60, { size: 15, weight: 700, fill: L.DIM });
  const gloss = L.text(root, '', BX - 16, 262, { anchor: 'start', size: 13, fill: L.DIM });
  const dieG = L.el('g', {}, root);

  // one seeded round
  const rnd = L.prng(D.seed + 300);
  let board = Uint8Array.from(D.board);
  let e = L.sway.empties(board);
  const b = e[Math.floor(rnd() * e.length)]; board[b] = 1;
  e = L.sway.empties(board);
  const w = e[Math.floor(rnd() * e.length)]; board[w] = 2;
  const pre = Uint8Array.from(board);
  const dice = L.sway.rollDice(N * N, rnd);
  const post = L.sway.event(board, nb, dice);

  const GLOSS = ['Black to move', 'Black places on an empty cell', 'White places on an empty cell',
    'every stone rolls a d20', 'the flips land together; on to round 2'];
  const paint = (n, hot) => {
    const shown = Uint8Array.from(D.board);
    if (n >= 1) shown[b] = 1;
    if (n >= 2) shown[w] = 2;
    B.redraw(n >= 4 ? post : shown);
    const ring = (i) => L.el('circle', { cx: B.cx(i), cy: B.cy(i), r: B.r + 3, fill: 'none', stroke: L.ORANGE, 'stroke-width': 2.5 }, B.stones);
    if (n === 1) ring(b);
    if (n === 2) ring(w);
    dieG.textContent = '';
    if (n === 3) for (let i = 0; i < N * N; i++) {
      if (!pre[i]) continue;
      const k = L.sway.friendly(pre, nb, i);
      const flips = dice[i] < 4 - k;
      const mark = hot && flips;
      L.die(dieG, B.cx(i) + 60, B.cy(i) + 38, 11, dice[i] + 1, { fill: mark ? L.ORANGE : '#fff', stroke: L.INK, ink: mark ? '#fff' : L.INK });
    }
    beats.forEach((g, i) => {
      const active = (n === 1 && i === 0) || (n === 2 && i === 1) || (n >= 3 && i === 2);
      g.setAttribute('opacity', n === 0 || active ? 1 : 0.4);
    });
    hLab.textContent = n >= 4 ? `round 2 of ${D.H}` : `round 1 of ${D.H}`;
    gloss.textContent = n === 3 && hot ? 'an orange die flips its stone' : GLOSS[n];
  };
  const BEATS = [1.2, 2.7, 4.2, 6.7];
  const setState = (t) => {
    const n = BEATS.filter((b) => t >= b).length;
    paint(n, t >= 5.2);
  };
  L.timeline(svg, { T: 8.6, setState });
})();
