// far-line.js -- slide 39: how far is the far line.
//
// Lesson 1's break-even inequality, t_oracle < t_roll / (C P g), read once
// with the numbers this lesson produced and nothing claimed.  Inputs: a 32x32
// board, a top-two gap g = 1e-4 (slide 34), about 5 ms per classical rollout,
// amplitude-estimation overhead C = 10.  Classical: 1/g^2 = 1e8 rollouts, so
// 5e5 s on one core (5.8 days) and 500 s on a thousand cores (8.3 min).
// Quantum: C/g = 1e5 coherent calls, so 100 s at 1 ms per call, 17 min at
// 10 ms, 2.8 h at 100 ms.  Against a thousand cores the threshold is
// 5 ms / (10 * 1000 * 1e-4) = 5 ms per call.  Every QPU bar is an assumption
// about hardware that does not exist; the caption says so.
(function () {
  const svg = document.getElementById('far-line-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  const X0 = 250, X1 = 700, LO = 1, HI = 7;              // log10 seconds, 10 s .. 10^7 s
  const vx = (s) => L.lerp(X0, X1, (Math.log10(s) - LO) / (HI - LO));
  L.text(root, 'Assumed pairwise case · g = 10⁻⁴ · 5 ms per classical rollout · C = 10', 380, 22, { size: 13, fill: L.DIM });
  // axis
  const AY = 236;
  L.el('line', { x1: X0, y1: AY, x2: X1, y2: AY, stroke: L.INK, 'stroke-width': 1.4 }, root);
  [[10, '10 s'], [60, '1 min'], [3600, '1 h'], [86400, '1 day'], [2592000, '30 days']].forEach(([s, lab]) => {
    L.el('line', { x1: vx(s), y1: AY, x2: vx(s), y2: AY + 5, stroke: L.INK }, root);
    L.text(root, lab, vx(s), AY + 18, { size: 11, fill: L.DIM, mono: true });
  });
  const ROWS = [
    { lab: 'classical, 1 core', s: 5e5, out: '5.8 days', color: L.GRAY },
    { lab: 'classical, 1,000 cores', s: 500, out: '8.3 min', color: L.GRAY },
    { lab: 'QPU, 1 ms per call', s: 100, out: '100 s', color: L.BLUE },
    { lab: 'QPU, 10 ms per call', s: 1000, out: '17 min', color: L.BLUE },
    { lab: 'QPU, 100 ms per call', s: 1e4, out: '2.8 h', color: L.BLUE }
  ];
  const bars = ROWS.map((r, i) => {
    const y = 56 + i * 34;
    L.text(root, r.lab, X0 - 14, y, { anchor: 'end', size: 13, weight: i < 2 ? 400 : 600, fill: i < 2 ? L.INK : L.BLUE });
    const bar = L.el('rect', { x: X0, y: y - 10, width: 0, height: 20, rx: 4, fill: r.color, opacity: 0.8 }, root);
    const out = L.text(root, r.out, X0, y, { anchor: 'start', size: 12.5, mono: true, weight: 700, fill: r.color, opacity: 0 });
    return { ...r, y, bar, out };
  });
  // the threshold: the QPU beats a thousand cores if a call beats 5 ms
  const thr = L.el('g', { opacity: 0 }, root);
  L.el('line', { x1: vx(500), y1: 40, x2: vx(500), y2: AY, stroke: L.ORANGE, 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }, thr);
  L.text(thr, 'to beat a thousand cores: under 5 ms per call', 380, 270, { size: 13, weight: 700, fill: L.ORANGE });
  L.text(root, 'Assumed timings · fixed pair of actions · full k-action selection adds search cost', 380, 290, { size: 11.5, fill: L.DIM });

  const setState = (t) => {
    bars.forEach((b, i) => {
      const u = L.win(t, 0.3 + (i < 2 ? i * 0.5 : 1.6 + (i - 2) * 0.5), 0.7, L.outQuart);
      const w = (vx(b.s) - X0) * u;
      b.bar.setAttribute('width', Math.max(0, w));
      b.out.setAttribute('x', X0 + w + 8);
      b.out.setAttribute('opacity', u >= 1 ? 1 : 0);
    });
    thr.setAttribute('opacity', L.win(t, 3.4, 0.5));
  };
  L.timeline(svg, { T: 4.2, setState });
})();
