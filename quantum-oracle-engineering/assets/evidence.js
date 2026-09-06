// evidence.js -- slide 22: enough evidence to choose?
//
// The close position from slide 5.  A hundred rollouts per move are played
// live (seeded, so every showing is the same) and shown as two estimates with
// one-standard-error bars; the figure stops there and asks.  Then ten
// thousand rollouts per move, then the exact win rates from the generator.
// The sampled order at a hundred can disagree with the truth, and the bars
// said so.
(function () {
  if (window.__evidenceInit) return; window.__evidenceInit = true;
  const L = window.L2, D = window.PIG_DATA, P = window.PIG;
  const pos = D.close;
  const est = (n, first, seed) => { const r = P.prng(seed); let w = 0; for (let i = 0; i < n; i++) w += P.rollout(pos.i, pos.j, pos.k, first, r).win; return w / n; };
  document.querySelectorAll('svg.evidence').forEach((svg) => {
    const root = L.el('g', {}, svg);
    const lo = pos.roll - 0.12, hi = pos.roll + 0.12, AX0 = 140, AX1 = 640, vx = (p) => L.lerp(AX0, AX1, (p - lo) / (hi - lo));
    L.text(root, `you ${pos.i} · opponent ${pos.j} · turn ${pos.k}`, 380, 26, { size: 12, mono: true, fill: L.DIM });
    const AY = 232;
    L.el('line', { x1: AX0, y1: AY, x2: AX1, y2: AY, stroke: L.INK, 'stroke-width': 1.5 }, root);
    for (let p = Math.ceil(lo * 20) / 20; p <= hi + 1e-9; p += 0.05) { L.el('line', { x1: vx(p), y1: AY - 5, x2: vx(p), y2: AY + 5, stroke: L.INK }, root); L.text(root, `${Math.round(p * 100)}%`, vx(p), AY + 20, { size: 11, mono: true, fill: L.DIM }); }
    const row = (y, n, pr, ph, label) => {
      const g = L.el('g', { opacity: 0 }, root);
      L.text(g, label, AX0 - 14, y, { anchor: 'end', size: 12.5, fill: L.DIM });
      [['roll', pr, L.BLUE, -8], ['hold', ph, L.GRAY, 8]].forEach(([name, p, col, dy]) => {
        const se = n ? Math.sqrt(p * (1 - p) / n) : 0;
        if (se) L.el('line', { x1: vx(p - se), y1: y + dy, x2: vx(p + se), y2: y + dy, stroke: col, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.8 }, g);
        L.el('circle', { cx: vx(p), cy: y + dy, r: 4.5, fill: col }, g);
        L.text(g, `${name} ${(p * 100).toFixed(n && n < 1000 ? 0 : 1)}%`, vx(p + se) + 10, y + dy, { anchor: 'start', size: 11, mono: true, fill: col });
      });
      return g;
    };
    // seeds chosen so the hundred-rollout estimates put hold ahead of roll, against the truth
    let sA = D.seed + 7, sB = D.seed + 8, eA = est(100, 'roll', sA), eB = est(100, 'hold', sB);
    for (let tries = 0; tries < 200 && !(eB > eA + 0.02 && eB - eA < 0.08); tries++) { sA += 2; sB += 2; eA = est(100, 'roll', sA); eB = est(100, 'hold', sB); }
    const r100 = row(70, 100, eA, eB, '100 rollouts each');
    const ask = L.text(root, 'enough evidence to choose?', 380, 118, { size: 16, weight: 700, fill: L.ORANGE, opacity: 0 });
    const r10k = row(150, 10000, est(10000, 'roll', D.seed + 9), est(10000, 'hold', D.seed + 10), '10,000 each');
    const rex = row(200, 0, pos.roll, pos.hold, 'exact');
    const setState = (t) => {
      r100.setAttribute('opacity', L.win(t, 0.3, 0.5)); ask.setAttribute('opacity', L.win(t, 1.0, 0.5));
      r10k.setAttribute('opacity', L.win(t, 3.6, 0.5)); rex.setAttribute('opacity', L.win(t, 4.6, 0.5));
    };
    L.timeline(svg, { T: 5.4, setState });
  });
})();
