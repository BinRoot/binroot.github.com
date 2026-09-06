// close-coins.js -- unused since the close-coins slide folded into the bandit card; formerly: close coins are expensive to distinguish.
//
// Two Bernoulli coins at 1/2 and 1/2 + eps.  A pull counter runs; each
// coin's one-sigma interval narrows like 1/sqrt(n) on a shared axis, and
// the two intervals keep overlapping until the counter reaches order 1/eps^2.
// The scorecard corner marks Q1 yes and Q2 "yes on close instances".
(function () {
  const svg = document.getElementById('close-coins-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  const EPS = 0.05, N_SEP = Math.round(1 / (EPS * EPS));     // 400
  const AX0 = 140, AX1 = 700, AY = 170;
  const vx = (v) => L.lerp(AX0, AX1, (v - 0.3) / 0.5);           // 0.3 .. 0.8
  L.el('line', { x1: AX0, y1: AY, x2: AX1, y2: AY, stroke: L.INK, 'stroke-width': 1.5 }, root);
  [0.3, 0.5, 0.7].forEach((v) => { L.el('line', { x1: vx(v), y1: AY - 5, x2: vx(v), y2: AY + 5, stroke: L.INK }, root); L.text(root, v.toFixed(1), vx(v), AY + 20, { size: 11, fill: L.DIM }); });
  const arm = (p, y, color, label) => {
    const g = L.el('g', {}, root);
    L.el('circle', { cx: 80, cy: y, r: 22, fill: color === L.BLUE ? L.BLUE : '#fff', stroke: L.INK, 'stroke-width': 1.4 }, g);
    L.text(g, label, 80, y, { size: 12, mono: true, weight: 700, fill: color === L.BLUE ? '#fff' : L.INK });
    const band = L.el('rect', { y: y - 10, height: 20, rx: 5, fill: color, opacity: 0.35 }, g);
    const mean = L.el('line', { y1: y - 14, y2: y + 14, stroke: color, 'stroke-width': 3 }, g);
    return { set: (n) => { const hw = 0.5 / Math.sqrt(Math.max(1, n)); const x0 = Math.max(AX0, vx(p - hw)), x1 = Math.min(AX1, vx(p + hw)); band.setAttribute('x', x0); band.setAttribute('width', Math.max(2, x1 - x0)); mean.setAttribute('x1', vx(p)); mean.setAttribute('x2', vx(p)); }, hw: (n) => 0.5 / Math.sqrt(Math.max(1, n)) };
  };
  const a = arm(0.5, 90, L.GRAY, '½'), b = arm(0.5 + EPS, 130, L.BLUE, '½+ε');
  const counter = L.text(root, 'pulls: 1', 420, 44, { size: 22, mono: true, weight: 700 });
  const status = L.text(root, 'intervals overlap', 420, 230, { size: 15, weight: 700, fill: L.RED });
  // corner scorecard
  const sc = L.el('g', { transform: 'translate(640,40)' }, root);
  [['Q1', 'yes', L.GREEN], ['Q2', 'yes, close', L.GREEN]].forEach(([q, s, c], i) => {
    L.text(sc, q, 0, i * 22, { anchor: 'start', size: 12, mono: true, fill: L.DIM });
    L.text(sc, s, 30, i * 22, { anchor: 'start', size: 12, weight: 700, fill: c });
  });

  const setState = (t) => {
    // n grows geometrically so the slow tail is visible
    const n = Math.max(1, Math.round(Math.exp(L.lerp(0, Math.log(N_SEP * 1.6), L.clamp01(t / 5)))));
    a.set(n); b.set(n);
    counter.textContent = `pulls per arm: ${n}`;
    const sep = a.hw(n) * 2 <= EPS;
    status.textContent = sep ? 'intervals separate' : 'intervals overlap';
    status.setAttribute('fill', sep ? L.GREEN : L.RED);
  };
  L.timeline(svg, { T: 5.6, setState });
})();
