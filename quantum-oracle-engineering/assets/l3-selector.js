// l3-selector.js -- slides 9 and 16: the uniform-prefix state.  2^w basis
// states as bars; the first m rise to amplitude 1/sqrt(m), the rest stay at
// zero.  One header line above, the amplitude as a tick on the left, nothing
// else competing with the bars.  The same picture serves the move selector
// (m = 9 on 4 qubits) and the die (m = 20 on 5 qubits): the same trick twice.
(function () {
  if (window.__l3SelInit) return;
  window.__l3SelInit = true;
  const L = window.L2;
  const queue = window.__l3SelectorQueue || [];
  document.querySelectorAll('svg.l3-selector').forEach((svg, k) => {
    const d = queue[k] || { m: '9', w: '4' };
    const m = +d.m, w = +d.w, K = 1 << w;
    const root = L.el('g', {}, svg);
    const X0 = 110, X1 = 700, Y0 = 232, H = 120;
    const bw = (X1 - X0) / K;
    const die = m === 20;
    L.text(root, die ? `a fair d20 on ${w} qubits` : `${m} legal cells on ${w} qubits`, 380, 34, { size: 17, weight: 700 });
    L.text(root, die ? `equal amplitude on faces 0 to 19, zero on 20 to 31` : `equal amplitude on ranks 0 to ${m - 1}, zero on ${m} to ${K - 1}`, 380, 60, { size: 13, fill: L.DIM });
    // the register, as w small boxes at the left
    for (let b = 0; b < w; b++) L.el('rect', { x: 20, y: Y0 - H - 8 + b * 22, width: 18, height: 18, rx: 4, fill: '#f3e8ff', stroke: L.PURPLE, 'stroke-width': 1.3, 'stroke-dasharray': '3 2' }, root);
    L.el('line', { x1: X0, y1: Y0, x2: X1, y2: Y0, stroke: L.INK, 'stroke-width': 1.4 }, root);
    L.el('line', { x1: X0, y1: Y0, x2: X0, y2: Y0 - H - 16, stroke: L.RULE, 'stroke-width': 1 }, root);
    const bars = [];
    for (let i = 0; i < K; i++) {
      const x = X0 + i * bw;
      bars.push(L.el('rect', { x: x + 2, y: Y0, width: Math.max(1, bw - 4), height: 0, rx: 3, fill: i < m ? L.BLUE : L.GRAY, opacity: i < m ? 0.9 : 0.35 }, root));
      if (K <= 16 || i % 4 === 0 || i === K - 1) L.text(root, String(i), x + bw / 2, Y0 + 16, { size: 11, mono: true, fill: L.DIM });
    }
    L.text(root, die ? 'face' : 'rank', (X0 + X1) / 2, Y0 + 36, { size: 12, fill: L.DIM });
    const tick = L.el('line', { x1: X0 - 6, y1: Y0 - H, x2: X0, y2: Y0 - H, stroke: L.BLUE, 'stroke-width': 1.5, opacity: 0 }, root);
    const amp = L.text(root, `1/√${m}`, X0 - 10, Y0 - H, { anchor: 'end', size: 14, mono: true, fill: L.BLUE, weight: 700, opacity: 0 });
    const zero = L.text(root, '0', X0 - 10, Y0, { anchor: 'end', size: 12, mono: true, fill: L.DIM });
    L.timeline(svg, { T: 2.4, setState: (t) => {
      const u = L.win(t, 0.3, 1.2, L.outQuart);
      bars.forEach((b, i) => { const h = i < m ? H * u : 3 * u; b.setAttribute('y', Y0 - h); b.setAttribute('height', h); });
      tick.setAttribute('opacity', L.win(t, 1.3, 0.4)); amp.setAttribute('opacity', L.win(t, 1.3, 0.4));
    } });
  });
})();
