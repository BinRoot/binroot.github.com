// pattern-worlds.js -- slide 29: one rule, many worlds.
//
// The Sway post's "Can't unsee it" figure, recreated: four 6x6 boards in
// four skins (opinion dynamics, market adoption, cultural competition,
// epidemic spread).  Here they do more than sit still: every few seconds all
// four run the same synchronous event under the same local rule (a stone
// with c like neighbours flips with probability (4-c)/20), with the same
// dice, so the room watches one dynamic wearing four costumes.  Isolated
// stones flip; clusters hold.  Sway, revealed on slide 25, is the smallest
// member of this class, and the paper's main instantiation is the fourth
// board.
(function () {
  const svg = document.getElementById('pattern-worlds-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  const N = 6, nb = L.sway.neighbors(N);
  const SIZE = 140, GAP = 52, X0 = (760 - (4 * SIZE + 3 * GAP)) / 2, Y0 = 20;
  const worlds = L.WORLDS.map((w, i) => {
    const x = X0 + i * (SIZE + GAP);
    const b = L.themedBoard(root, { N, size: SIZE, x, y: Y0, theme: w.t, board: w.board });
    L.text(root, w.title, x + SIZE / 2, Y0 + SIZE + 22, { size: 14, weight: 700 });
    return { b, base: Uint8Array.from(w.board), cur: Uint8Array.from(w.board), x };
  });
  const rule = L.text(root, 'one local rule: neighbours reinforce · isolation exposes · the environment shakes', 380, Y0 + SIZE + 64, { size: 13, fill: L.INK, weight: 600 });
  const flash = L.el('g', {}, root);

  const CYC = 3.0;
  let cycle = -1, dice = null;
  const setState = (t) => {
    const c = Math.floor(t / CYC), u = (t % CYC) / CYC;
    if (c !== cycle) {
      cycle = c;
      const rnd = L.prng(4242 + c * 17);
      dice = L.sway.rollDice(N * N, rnd);            // the same dice for all four
      if (c > 0) worlds.forEach((w) => { w.cur = L.sway.event(w.cur, nb, dice); });
    }
    // beat: 0..0.55 rest on the current board, 0.55..0.75 mark the stones that will flip, 0.75.. show the result
    flash.textContent = '';
    worlds.forEach((w) => {
      const next = L.sway.event(w.cur, nb, dice);
      const show = u >= 0.75 ? next : w.cur;
      w.b.redraw(show);
      if (u >= 0.55 && u < 0.75) {
        for (let i = 0; i < N * N; i++) {
          if (w.cur[i] && next[i] !== w.cur[i]) {
            L.el('circle', { cx: w.x + w.b.cx(i), cy: Y0 + w.b.cy(i), r: w.b.r + 3, fill: 'none', stroke: L.ORANGE, 'stroke-width': 2.2 }, flash);
          }
        }
      }
    });
    // after the reveal, the shown board becomes current for the next cycle (handled at the cycle boundary above)
    if (u >= 0.75) worlds.forEach((w) => { w.pending = true; });
  };
  L.timeline(svg, { T: CYC * 40, setState, loop: true });
})();
