// l4-branch.js -- slide 17: every branch is a classical run.
//
// Three seeded branches, one per row: the seed's dice and ranks go in, the
// classical rollout's final board and the circuit's final board come out and
// match, and the thirteen scratch bits read zero.  Rows appear in turn, then
// the closing line about linearity.  Boards are generated from the seed with
// the shared Sway engine so every row is a true rollout.
(function () {
  if (window.__l4BranchInit) return; window.__l4BranchInit = true;
  const L = window.L2;
  const N = 3, nb = L.sway.neighbors(N);
  const run = (seed) => {
    const rnd = L.prng(seed); let b = new Uint8Array(9);
    for (let h = 0; h < 2; h++) {
      let e = L.sway.empties(b); b[e[Math.floor(rnd() * e.length)]] = 1;
      e = L.sway.empties(b); b[e[Math.floor(rnd() * e.length)]] = 2;
      b = L.sway.event(b, nb, L.sway.rollDice(9, rnd));
    }
    return b;
  };
  const SEEDS = [17, 2026, 404];
  document.querySelectorAll('svg.l4-branch').forEach((svg) => {
    const root = L.el('g', {}, svg);
    L.text(root, 'seed', 70, 26, { size: 12, fill: L.DIM });
    L.text(root, 'classical rollout', 250, 26, { size: 12, fill: L.DIM });
    L.text(root, 'the circuit, as a permutation', 430, 26, { size: 12, fill: L.DIM });
    L.text(root, 'scratch after', 630, 26, { size: 12, fill: L.DIM });
    const rows = SEEDS.map((s, i) => {
      const g = L.el('g', { opacity: 0 }, root);
      const y = 44 + i * 70, b = run(s);
      L.text(g, String(s), 70, y + 30, { size: 15, mono: true, weight: 700 });
      L.board(g, { N, size: 60, x: 220, y, board: b });
      L.text(g, '=', 340, y + 30, { size: 20, weight: 700, fill: L.GREEN });
      L.board(g, { N, size: 60, x: 400, y, board: b });
      L.text(g, '0000000000000', 630, y + 24, { size: 13, mono: true, fill: L.GREEN, weight: 700 });
      L.el('circle', { cx: 630, cy: y + 46, r: 8, fill: L.GREEN }, g);
      L.el('path', { d: `M 626 ${y + 46} l 3 3 l 5.5 -6`, fill: 'none', stroke: '#fff', 'stroke-width': 1.8, 'stroke-linecap': 'round' }, g);
      return g;
    });
    const line = L.text(root, 'a basis state in, a basis state out; linearity carries the seeds to the superposition', 380, 278, { size: 13, fill: L.DIM, italic: true, opacity: 0 });
    const setState = (t) => { rows.forEach((g, i) => g.setAttribute('opacity', L.win(t, 0.3 + i * 0.6, 0.4))); line.setAttribute('opacity', L.win(t, 2.3, 0.5)); };
    L.timeline(svg, { T: 3, setState });
  });
})();
