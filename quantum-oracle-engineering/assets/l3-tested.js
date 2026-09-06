// l3-tested.js -- slide 31: two checks.  Left, 256 seeded branches as a 16x16
// grid of ticks turning green one by one: circuit and classical rollout agree
// bit for bit.  Right, the circuit's aggregate win rate, .281 +/- .028, as an
// interval on a number line with the exact .271 inside it.
(function () {
  const svg = document.getElementById('l3-tested-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  const X = 60, Y = 50, S = 12;
  L.text(root, '256 seeds, bit for bit', X + 8 * S, Y - 20, { size: 14, weight: 700 });
  const ticks = [];
  for (let i = 0; i < 256; i++) ticks.push(L.el('rect', { x: X + (i % 16) * S + 1, y: Y + Math.floor(i / 16) * S + 1, width: S - 2, height: S - 2, rx: 2, fill: '#eee' }, root));
  const agree = L.text(root, '', X + 8 * S, Y + 16 * S + 22, { size: 13, mono: true, fill: L.GREEN, weight: 700, opacity: 0 });
  // interval
  const AX0 = 330, AX1 = 700, AY = 170, lo = 0.20, hi = 0.36;
  const vx = (v) => L.lerp(AX0, AX1, (v - lo) / (hi - lo));
  L.text(root, 'win rate, 3 × 3, two rounds', (AX0 + AX1) / 2, Y - 20, { size: 14, weight: 700 });
  L.el('line', { x1: AX0, y1: AY, x2: AX1, y2: AY, stroke: L.INK, 'stroke-width': 1.5 }, root);
  [0.20, 0.24, 0.28, 0.32, 0.36].forEach((v) => { L.el('line', { x1: vx(v), y1: AY - 5, x2: vx(v), y2: AY + 5, stroke: L.INK }, root); L.text(root, v.toFixed(2), vx(v), AY + 20, { size: 11, mono: true, fill: L.DIM }); });
  const band = L.el('rect', { x: vx(0.281 - 0.028), y: AY - 16, width: 0, height: 32, rx: 5, fill: L.BLUE, opacity: 0.35 }, root);
  const mean = L.el('line', { x1: vx(0.281), y1: AY - 22, x2: vx(0.281), y2: AY + 22, stroke: L.BLUE, 'stroke-width': 3, opacity: 0 }, root);
  const mlab = L.text(root, 'circuit: .281 ± .028', vx(0.281), AY - 34, { size: 13, mono: true, fill: L.BLUE, weight: 700, opacity: 0 });
  const exact = L.el('line', { x1: vx(0.271), y1: AY - 30, x2: vx(0.271), y2: AY + 30, stroke: L.ORANGE, 'stroke-width': 2.5, 'stroke-dasharray': '5 3', opacity: 0 }, root);
  const elab = L.text(root, 'exact: .271', vx(0.271), AY + 48, { size: 13, mono: true, fill: L.ORANGE, weight: 700, opacity: 0 });
  const verdict = L.text(root, 'inside the interval', (AX0 + AX1) / 2, AY + 80, { size: 14, weight: 700, fill: L.GREEN, opacity: 0 });
  L.timeline(svg, { T: 4.6, setState: (t) => {
    const u = L.win(t, 0.2, 2.0);
    ticks.forEach((r, i) => r.setAttribute('fill', i / 256 <= u ? L.GREEN : '#eee'));
    agree.textContent = u >= 1 ? '256 / 256 agree' : `${Math.floor(256 * u)} / 256`; agree.setAttribute('opacity', 1);
    const b = L.win(t, 2.2, 0.6, L.outQuart);
    band.setAttribute('width', (vx(0.281 + 0.028) - vx(0.281 - 0.028)) * b);
    mean.setAttribute('opacity', L.win(t, 2.6, 0.3)); mlab.setAttribute('opacity', L.win(t, 2.6, 0.3));
    exact.setAttribute('opacity', L.win(t, 3.2, 0.3)); elab.setAttribute('opacity', L.win(t, 3.2, 0.3));
    verdict.setAttribute('opacity', L.win(t, 3.8, 0.4));
  } });
})();
