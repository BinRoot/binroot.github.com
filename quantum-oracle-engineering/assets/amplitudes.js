// amplitudes.js -- slide 10: what changes on a quantum computer?
//
// Three panels, revealed in turn.  Amplitudes: four outcomes carry signed
// heights, not probabilities.  Measure: one outcome comes out, the rest are
// gone, which is one rollout again.  Interfere: before measuring, two paths
// to the same outcome add when their signs agree and cancel when they
// disagree, so the odds can be reshaped first.  Measuring every rollout as
// it happens throws that away and is plain sampling.
(function () {
  if (window.__amplitudesInit) return; window.__amplitudesInit = true;
  const L = window.L2;
  document.querySelectorAll('svg.amplitudes').forEach((svg) => {
    const root = L.el('g', {}, svg);
    const panel = (x0, title) => { L.text(root, title, x0 + 110, 30, { size: 14, weight: 700 }); return L.el('g', {}, root); };
    const AMP = [0.6, -0.4, 0.5, 0.45];
    const LAB = ['00', '01', '10', '11'];
    // panel 1: amplitudes
    const p1 = panel(30, 'amplitudes');
    const base1 = 150;
    L.el('line', { x1: 40, y1: base1, x2: 240, y2: base1, stroke: L.INK, 'stroke-width': 1.2 }, p1);
    const bars1 = AMP.map((a, i) => { const x = 60 + i * 46; L.text(p1, LAB[i], x + 12, base1 + 16, { size: 11, mono: true, fill: L.DIM }); return L.el('rect', { x, y: base1, width: 24, height: 0, fill: a < 0 ? L.ORANGE : L.BLUE, opacity: 0.85 }, p1); });
    L.text(p1, 'signed, and not yet odds', 140, 224, { size: 12, fill: L.DIM });
    // panel 2: measure
    const p2 = panel(270, 'measure');
    L.el('line', { x1: 280, y1: base1, x2: 480, y2: base1, stroke: L.INK, 'stroke-width': 1.2 }, p2);
    const bars2 = AMP.map((a, i) => { const x = 300 + i * 46; L.text(p2, LAB[i], x + 12, base1 + 16, { size: 11, mono: true, fill: L.DIM }); return L.el('rect', { x, y: base1 - Math.abs(a) * 120, width: 24, height: Math.abs(a) * 120, fill: a < 0 ? L.ORANGE : L.BLUE, opacity: 0.85 }, p2); });
    L.text(p2, 'one outcome: a rollout again', 380, 224, { size: 12, fill: L.DIM });
    // panel 3: interfere
    const p3 = panel(510, 'interfere first');
    const arrow = (x, y, len, col, parent) => { L.el('line', { x1: x, y1: y, x2: x, y2: y - len, stroke: col, 'stroke-width': 4, 'stroke-linecap': 'round' }, parent); L.el('polygon', { points: `${x},${y - len - 6} ${x - 5},${y - len + 2} ${x + 5},${y - len + 2}`, fill: col }, parent); };
    const g3a = L.el('g', { opacity: 0 }, p3), g3b = L.el('g', { opacity: 0 }, p3);
    arrow(560, 150, 40, L.BLUE, g3a); arrow(575, 150, 40, L.BLUE, g3a); L.text(g3a, '+', 567, 60, { size: 16, weight: 700, fill: L.GREEN }); arrow(600, 150, 80, L.GREEN, g3a);
    arrow(660, 150, 40, L.BLUE, g3b); L.el('line', { x1: 675, y1: 110, x2: 675, y2: 150, stroke: L.ORANGE, 'stroke-width': 4, 'stroke-linecap': 'round' }, g3b); L.el('polygon', { points: '675,156 670,148 680,148', fill: L.ORANGE }, g3b); L.text(g3b, '−', 667, 60, { size: 16, weight: 700, fill: L.RED }); L.el('circle', { cx: 700, cy: 150, r: 4, fill: L.RED }, g3b);
    L.text(p3, 'agree: add · disagree: cancel', 620, 224, { size: 12, fill: L.DIM });
    const foot = L.text(root, 'the odds are reshaped before anyone measures', 380, 272, { size: 13, weight: 700, fill: L.DIM, italic: true, opacity: 0 });
    const setState = (t) => {
      const u1 = L.win(t, 0.2, 0.8, L.outQuart);
      bars1.forEach((b, i) => { const h = Math.abs(AMP[i]) * 120 * u1; b.setAttribute('height', h); b.setAttribute('y', AMP[i] < 0 ? base1 : base1 - h); });
      const u2 = L.win(t, 1.4, 0.5);
      bars2.forEach((b, i) => b.setAttribute('opacity', i === 2 ? 0.85 : 0.85 - 0.75 * u2));
      g3a.setAttribute('opacity', L.win(t, 2.4, 0.5)); g3b.setAttribute('opacity', L.win(t, 3.0, 0.5));
      foot.setAttribute('opacity', L.win(t, 3.6, 0.5));
    };
    L.timeline(svg, { T: 4.4, setState });
  });
})();
