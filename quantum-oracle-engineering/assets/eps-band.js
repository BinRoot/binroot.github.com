// eps-band.js -- slide 15: the actual selection promise.
//
// k action cards stand on a value axis at their means v_i.  A bracket of
// width epsilon drops from the best one; every card inside it is an
// acceptable answer.  Then the bracket tightens below the best-runner-up gap
// g and only one card remains: choose epsilon below the gap and approximate
// selection recovers the exact winner.
(function () {
  const svg = document.getElementById('eps-band-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  const V = [0.50, 0.71, 0.36, 0.665, 0.43, 0.24, 0.58];    // arm means: spread out, except the winner and runner-up, 0.045 apart on purpose
  const AX0 = 80, AX1 = 700, AY = 200;
  const vx = (v) => L.lerp(AX0, AX1, v);
  L.el('line', { x1: AX0 - 10, y1: AY, x2: AX1 + 10, y2: AY, stroke: L.INK, 'stroke-width': 1.5 }, root);
  [0, 0.5, 1].forEach((v) => {
    L.el('line', { x1: vx(v), y1: AY - 5, x2: vx(v), y2: AY + 5, stroke: L.INK }, root);
    L.text(root, String(v), vx(v), AY + 20, { size: 12, fill: L.DIM });
  });
  L.text(root, 'v_i', (AX0 + AX1) / 2, AY + 44, { size: 14, fill: L.DIM, mono: true });
  const best = Math.max(...V);
  const sorted = [...V].sort((a, b) => b - a);
  const gap = sorted[0] - sorted[1];
  const cards = V.map((v, i) => {
    const g = L.el('g', { transform: `translate(${vx(v)},${AY - 50})` }, root);
    L.el('rect', { x: -8, y: -40, width: 16, height: 74, rx: 4, fill: '#fff', stroke: L.INK, 'stroke-width': 1.3 }, g);
    L.text(g, `a${i + 1}`, 0, -10, { size: 11, mono: true });
    L.el('line', { x1: 0, y1: 34, x2: 0, y2: 50, stroke: L.INK, 'stroke-width': 1.2 }, g);
    return { g, v };
  });
  const band = L.el('rect', { y: AY - 110, height: 110, rx: 6, fill: L.GREEN, opacity: 0.16 }, root);
  const brL = L.el('line', { y1: AY - 112, y2: AY + 2, stroke: L.GREEN, 'stroke-width': 2.5 }, root);
  const brR = L.el('line', { y1: AY - 112, y2: AY + 2, stroke: L.GREEN, 'stroke-width': 2.5 }, root);
  const epsLab = L.text(root, 'ε', 0, AY - 122, { size: 16, italic: true, fill: L.GREEN, weight: 700 });
  const gLab = L.text(root, 'g', 0, 28, { size: 14, italic: true, fill: L.ORANGE, opacity: 0 });   // above the bracket, which spans y 40 to 48
  const gBr = L.el('path', { fill: 'none', stroke: L.ORANGE, 'stroke-width': 2, opacity: 0 }, root);

  const setState = (t) => {
    const grow = L.win(t, 0.3, 0.9, L.outQuart);
    const shrink = L.win(t, 2.6, 1.1, L.outQuart);
    const eps = L.lerp(L.lerp(0, 0.10, grow), gap * 0.7, shrink);   // grown, the band holds the top two; tightened below g, only the winner
    const lo = best - eps;
    // the left edge is exact at best - eps: a card is inside iff its value is.
    // The right edge runs half a card past the best value, so the winning
    // card sits fully inside; no value lies beyond the best, so nothing is
    // misrepresented.  Cards are 16 wide so a card never straddles the edge.
    const x0 = vx(lo), x1 = vx(best) + 8;
    band.setAttribute('x', x0); band.setAttribute('width', Math.max(0, x1 - x0));
    brL.setAttribute('x1', x0); brL.setAttribute('x2', x0);
    brR.setAttribute('x1', x1); brR.setAttribute('x2', x1);
    epsLab.setAttribute('x', (x0 + x1) / 2);
    epsLab.setAttribute('opacity', grow);
    cards.forEach((c) => {
      const inside = c.v >= lo - 1e-9;
      c.g.setAttribute('opacity', grow > 0.5 ? (inside ? 1 : 0.35) : 1);
      c.g.firstChild.setAttribute('stroke', inside && grow > 0.5 ? L.GREEN : L.INK);
      c.g.firstChild.setAttribute('stroke-width', inside && grow > 0.5 ? 2.2 : 1.3);
    });
    // the gap bracket between best and runner-up appears with the shrink
    const gx0 = vx(sorted[1]), gx1 = vx(sorted[0]);
    gBr.setAttribute('d', `M ${gx0} 40 v 8 M ${gx1} 40 v 8 M ${gx0} 44 H ${gx1}`);
    gBr.setAttribute('opacity', L.win(t, 2.2, 0.4));
    gLab.setAttribute('x', (gx0 + gx1) / 2); gLab.setAttribute('opacity', L.win(t, 2.2, 0.4));
  };
  L.timeline(svg, { T: 4.2, setState });
})();
