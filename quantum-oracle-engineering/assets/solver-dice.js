// solver-dice.js -- slide 13: MCTS brought its own dice.
//
// One deterministic Go game tree.  A grey solver die hops between branches
// choosing which to explore, six hops.  Then, three seconds apart, stronger
// solvers take the die's place, each drawn as what it changes on the very
// same tree: pruning fades the branches it skips, learned priors thicken the
// branches it favours, a value network scores the leaves and rolls nothing.
// The tree itself never changes, and a caption says so under all three.  The
// sequence plays once and holds on the value network.
(function () {
  const svg = document.getElementById('solver-dice-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  // tree
  const ROOT = { x: 380, y: 40 };
  const lvl1 = [200, 320, 440, 560].map((x) => ({ x, y: 120 }));
  const lvl2 = [];
  lvl1.forEach((p, i) => { [-32, 0, 32].forEach((d) => lvl2.push({ x: p.x + d, y: 200, parent: i })); });
  const e1 = lvl1.map((p) => L.el('line', { x1: ROOT.x, y1: ROOT.y, x2: p.x, y2: p.y, stroke: L.INK, 'stroke-width': 1.5 }, root));
  const e2 = lvl2.map((p) => L.el('line', { x1: lvl1[p.parent].x, y1: 120, x2: p.x, y2: p.y, stroke: L.INK, 'stroke-width': 1.2 }, root));
  L.el('circle', { cx: ROOT.x, cy: ROOT.y, r: 6, fill: L.INK }, root);
  const d1 = lvl1.map((p) => L.el('circle', { cx: p.x, cy: p.y, r: 5, fill: L.INK }, root));
  const d2 = lvl2.map((p) => L.el('circle', { cx: p.x, cy: p.y, r: 3.5, fill: L.INK }, root));

  // the solver die, hopping
  const tool = L.el('g', {}, root);
  L.die(tool, 0, 0, 22, 4, { fill: '#e6e6e6', stroke: L.GRAY, ink: L.INK });
  const highlight = L.el('circle', { r: 11, fill: 'none', stroke: L.GOLD, 'stroke-width': 4 }, root);
  const HOPS = [1, 3, 0, 2, 1, 3];                 // six hops, then the die rests

  // the three presses
  const STATES = [
    { name: 'solver die', gloss: 'a die picks which branch to explore next' },
    { name: 'pruning', gloss: 'branches that cannot matter are skipped' },
    { name: 'learned priors', gloss: 'promising branches are explored first' },
    { name: 'value network', gloss: 'positions are scored; nothing is rolled' }
  ];
  const PRIOR = [0.15, 0.55, 0.3, 1.0];                   // how much each branch is favoured
  const VALUE = [0.2, 0.35, 0.3, 0.55, 0.7, 0.5, 0.4, 0.45, 0.35, 0.8, 0.95, 0.75];
  const name = L.text(root, STATES[0].name, 380, 252, { size: 16, weight: 700, fill: L.GRAY });
  const gloss = L.text(root, STATES[0].gloss, 380, 274, { size: 12.5, fill: L.DIM });
  const same = L.text(root, 'the tree never changes', 380, 298, { size: 12.5, fill: L.GREEN, weight: 700, opacity: 0 });

  let n = 0;
  const paint = () => {
    const st = STATES[n];
    name.textContent = st.name; gloss.textContent = st.gloss;
    name.setAttribute('fill', n === 0 ? L.GRAY : L.INK);
    same.setAttribute('opacity', n > 0 ? 1 : 0);
    tool.setAttribute('opacity', n === 0 ? 1 : 0);
    highlight.setAttribute('opacity', n === 0 ? 0.9 : 0);
    e1.forEach((e, i) => {
      e.setAttribute('opacity', n === 1 && (i === 0 || i === 2) ? 0.15 : 1);
      e.setAttribute('stroke-width', n === 2 ? 1 + 5 * PRIOR[i] : 1.5);
    });
    e2.forEach((e, j) => {
      const i = lvl2[j].parent;
      e.setAttribute('opacity', n === 1 && (i === 0 || i === 2) ? 0.15 : 1);
      e.setAttribute('stroke-width', n === 2 ? 0.8 + 3 * PRIOR[i] : 1.2);
    });
    d1.forEach((d, i) => d.setAttribute('opacity', n === 1 && (i === 0 || i === 2) ? 0.15 : 1));
    d2.forEach((d, j) => {
      const i = lvl2[j].parent;
      d.setAttribute('opacity', n === 1 && (i === 0 || i === 2) ? 0.15 : 1);
      d.setAttribute('r', n === 3 ? 6 : 3.5);
      d.setAttribute('fill', n === 3 ? L.mix(L.GRAY, L.BLUE, VALUE[j]) : L.INK);
    });
  };
  paint();

  // six hops, about three seconds; then a new solver every three seconds
  const HOP = 0.55, HOPS_T = HOP * HOPS.length, STAGE = 3.0;
  const setState = (t) => {
    const want = t < HOPS_T ? 0 : Math.min(3, 1 + Math.floor((t - HOPS_T) / STAGE));
    if (want !== n) { n = want; paint(); }
    const k = Math.min(HOPS.length - 1, Math.floor(t / HOP));
    const f = k === HOPS.length - 1 && t >= HOPS.length * HOP ? 1 : L.ease((t % HOP) / HOP);
    const from = lvl1[HOPS[(k + HOPS.length - 1) % HOPS.length]], to = lvl1[HOPS[k]];
    const x = L.lerp(from.x, to.x, f), y = 120 - 44 - 40 * Math.sin(Math.PI * f);
    tool.setAttribute('transform', `translate(${x},${y})`);
    highlight.setAttribute('cx', to.x); highlight.setAttribute('cy', 120);
  };
  L.timeline(svg, { T: HOPS_T + 3 * STAGE, setState });
})();
