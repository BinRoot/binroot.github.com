// rollout-sway.js -- slide 31: now make the rollout Sway.
//
// Slide 5's four-part pipeline returns with Sway inside it: the fixed first
// move (candidate A from the data), H rounds of the paper's policy on a small
// live board, the horizon counter, and a payoff bit that lands in a running
// average.  Each pass uses a fresh seed; the caption names the policy.
(function () {
  const svg = document.getElementById('rollout-sway-fig');
  if (!svg) return;
  const L = window.L2;
  const D = window.SWAY_DATA;
  const N = D.N, H = D.H, nb = L.sway.neighbors(N);
  const root = L.el('g', {}, svg);
  const Y = 118;
  const box = (x, w, top, sub) => {
    L.el('rect', { x, y: Y - 60, width: w, height: 124, rx: 8, fill: '#fff', stroke: L.INK, 'stroke-width': 1.5 }, root);
    L.text(root, top, x + w / 2, Y - 44, { size: 13, weight: 600 });
    if (sub) L.text(root, sub, x + w / 2, Y + 50, { size: 11, fill: L.DIM, mono: true });
  };
  box(30, 120, 'first move', 'the arm');
  box(180, 250, 'H rounds, fixed policy', 'random legal cell · d20 · sway');
  box(460, 90, 'horizon', `H = ${H}`);
  box(580, 150, 'payoff', 'Black > White ?');
  [150, 430, 550].forEach((x) => L.el('polygon', { points: `${x + 28},${Y} ${x + 16},${Y - 5} ${x + 16},${Y + 5}`, fill: L.WIRE }, root));
  [150, 430, 550].forEach((x) => L.el('line', { x1: x + 2, y1: Y, x2: x + 18, y2: Y, stroke: L.WIRE, 'stroke-width': 2 }, root));
  const cand = D.candidates[0];
  const first = cand.r * N + cand.c;
  // small board in box 1 (arm) and live board in box 2
  const B1 = L.board(root, { N, size: 70, x: 55, y: Y - 34, board: D.board });
  L.stone(B1.stones, B1.cx(first), B1.cy(first), B1.r, 1, { stroke: L.ORANGE, 'stroke-width': 2 });
  L.text(root, `move ${cand.label}`, 90, Y + 44 - 8, { size: 11, fill: L.ORANGE, weight: 700 });
  const B2 = L.board(root, { N, size: 84, x: 200, y: Y - 40, board: D.board });
  const hLab = L.text(root, 'h = 0', 505, Y, { size: 20, mono: true, weight: 700 });
  const bit = L.text(root, '', 655, Y + 4, { size: 30, mono: true, weight: 700 });
  const avg = L.text(root, 'running average: —', 380, 262, { size: 14, mono: true, fill: L.DIM });
  const tokens = L.el('g', {}, root);

  let cycle = -1, traj = null, wins = 0, count = 0;
  const CYC = 4.0;
  const build = (c) => {
    const rnd = L.prng(D.seed + 900 + c * 13);
    let board = Uint8Array.from(D.board);
    const frames = [];
    for (let h = 0; h < H; h++) {
      let e = L.sway.empties(board);
      board[h === 0 ? first : e[Math.floor(rnd() * e.length)]] = 1;
      frames.push(Uint8Array.from(board));
      e = L.sway.empties(board);
      board[e[Math.floor(rnd() * e.length)]] = 2;
      frames.push(Uint8Array.from(board));
      board = L.sway.event(board, nb, L.sway.rollDice(N * N, rnd));
      frames.push(Uint8Array.from(board));
    }
    return { frames, payoff: L.sway.payoff(board) };
  };
  const setState = (t) => {
    const c = Math.floor(t / CYC), u = (t % CYC) / CYC;
    if (c !== cycle) {
      if (cycle >= 0 && traj) { wins += traj.payoff; count++; }
      cycle = c; traj = build(c);
    }
    // frames advance through the middle box during u in [0.15, 0.7]
    const nf = traj.frames.length;
    const fi = u < 0.15 ? -1 : u < 0.7 ? Math.min(nf - 1, Math.floor((u - 0.15) / 0.55 * nf)) : nf - 1;
    B2.redraw(fi < 0 ? D.board : traj.frames[fi]);
    hLab.textContent = `h = ${fi < 0 ? 0 : Math.min(H, Math.floor(fi / 3) + (fi % 3 === 2 ? 1 : 0))}`;
    bit.textContent = u > 0.78 ? String(traj.payoff) : '';
    bit.setAttribute('fill', traj.payoff ? L.BLUE : L.GRAY);
    avg.textContent = count ? `running average: ${(wins / count).toFixed(2)}  (${count} rollouts)` : 'running average: —';
    tokens.textContent = '';
    if (u < 0.15) L.el('circle', { cx: L.lerp(90, 200, u / 0.15), cy: Y, r: 6, fill: L.INK }, tokens);
    else if (u >= 0.7 && u < 0.78) L.el('circle', { cx: L.lerp(430, 640, (u - 0.7) / 0.08), cy: Y, r: 6, fill: L.INK }, tokens);
  };
  L.timeline(svg, { T: CYC * 30, setState, loop: true });
})();
