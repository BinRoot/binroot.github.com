// hard-family.js -- slide 17: a family of almost-identical worlds.
//
// Four small bar charts, one per world, same six arms in each.  Base world:
// arm 0 stands at 1/2 + 4 eps, every other arm at 1/2.  In world j, arm j
// alone grows to 1/2 + 6 eps and the crown for "best arm" hops onto it.  The
// bars are drawn on the full 0..1 scale, so the four charts are visibly
// almost the same picture; only the crown moves.  That is the lower bound's
// whole trick: an algorithm that answers correctly must tell these apart.
(function () {
  const svg = document.getElementById('hard-family-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  const K = 6, EPS = 0.01;
  const HALF = 0.5, BASE0 = HALF + 4 * EPS, RISEN = HALF + 6 * EPS;
  const WORLDS = [0, 1, 2, 3];               // 0 is the base world; j > 0 moves arm j
  const CW = 140, GAP = 28, X0 = 50;         // chart width and spacing; leaves room for the 6-eps scale at the right
  const Y0 = 232, Y1 = 60;                   // value 0 and value 1 on the y axis
  const vy = (v) => L.lerp(Y0, Y1, v);
  const BW = 16, BS = (CW - 10) / K;

  const charts = WORLDS.map((w, i) => {
    const x = X0 + i * (CW + GAP);
    const g = L.el('g', { opacity: w === 0 ? 1 : 0 }, root);
    // axes and the 1/2 reference
    L.el('line', { x1: x, y1: Y0, x2: x + CW, y2: Y0, stroke: L.INK, 'stroke-width': 1.2 }, g);
    L.el('line', { x1: x, y1: Y0, x2: x, y2: Y1 - 6, stroke: L.RULE, 'stroke-width': 1 }, g);
    L.el('line', { x1: x, y1: vy(HALF), x2: x + CW, y2: vy(HALF), stroke: L.RULE, 'stroke-width': 1, 'stroke-dasharray': '3 3' }, g);
    if (i === 0) {
      L.text(g, '½', x - 8, vy(HALF), { anchor: 'end', size: 12, fill: L.DIM, mono: true });
      L.text(g, '1', x - 8, Y1, { anchor: 'end', size: 12, fill: L.DIM, mono: true });
      L.text(g, '0', x - 8, Y0, { anchor: 'end', size: 12, fill: L.DIM, mono: true });
      L.text(g, 'P(win)', x - 8, Y1 - 22, { anchor: 'end', size: 11, fill: L.DIM });
    }
    // bars
    const bars = [];
    for (let j = 0; j < K; j++) {
      const bx = x + 8 + j * BS + (BS - BW) / 2;
      const base = j === 0 ? BASE0 : HALF;
      const rect = L.el('rect', { x: bx, y: vy(base), width: BW, height: Y0 - vy(base), rx: 2,
        fill: j === 0 ? L.BLUE : L.GRAY, opacity: 0.9 }, g);
      L.text(g, String(j), bx + BW / 2, Y0 + 14, { size: 10.5, fill: L.DIM, mono: true });
      bars.push({ rect, bx, base });
    }
    // the crown: a small gold ring above the best arm
    const crown = L.el('g', {}, g);
    L.el('circle', { r: 6, fill: L.GOLD, stroke: '#b8862b', 'stroke-width': 1.2 }, crown);
    L.text(g, w === 0 ? 'base world' : `world ${w}`, x + CW / 2, Y0 + 40, { size: 13, weight: 700 });
    const best = L.text(g, '', x + CW / 2, Y0 + 58, { size: 12, fill: L.DIM, mono: true });
    return { w, g, bars, crown, best, x };
  });
  // the scale, once: how far the moved arm rises
  const scale = L.el('g', { opacity: 0 }, root);
  const sx = X0 + 3 * (CW + GAP) + CW + 8;
  L.el('line', { x1: sx, y1: vy(HALF), x2: sx, y2: vy(RISEN), stroke: L.GREEN, 'stroke-width': 2 }, scale);
  L.text(scale, '6ε', sx + 6, (vy(HALF) + vy(RISEN)) / 2, { anchor: 'start', size: 12, fill: L.GREEN, mono: true });

  const setChart = (c, rise) => {
    const bestArm = c.w === 0 ? 0 : (rise > 0.5 ? c.w : 0);
    c.bars.forEach((b, j) => {
      const v = (c.w !== 0 && j === c.w) ? L.lerp(HALF, RISEN, rise) : b.base;
      b.rect.setAttribute('y', vy(v)); b.rect.setAttribute('height', Y0 - vy(v));
      b.rect.setAttribute('fill', (c.w !== 0 && j === c.w && rise > 0.5) ? L.GREEN : j === 0 ? L.BLUE : L.GRAY);
    });
    const bb = c.bars[bestArm];
    const top = vy(bestArm === 0 ? BASE0 : L.lerp(HALF, RISEN, rise));
    c.crown.setAttribute('transform', `translate(${bb.bx + BW / 2},${top - 12})`);
    c.best.textContent = `best: arm ${bestArm}`;
  };
  const setState = (t) => {
    charts.forEach((c, i) => {
      if (c.w === 0) { setChart(c, 0); return; }
      const t0 = 0.6 + (i - 1) * 1.0;
      c.g.setAttribute('opacity', L.win(t, t0, 0.4));
      setChart(c, L.win(t, t0 + 0.4, 0.6, L.outQuart));
    });
    scale.setAttribute('opacity', L.win(t, 3.4, 0.5));
  };
  L.timeline(svg, { T: 4.2, setState });
})();
