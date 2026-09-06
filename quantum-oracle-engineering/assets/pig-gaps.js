// pig-gaps.js -- slide 5: when is the answer clear enough?
//
// Two positions, two panels.  Left, an easy pair: roll wins 76%, hold 44%;
// one standard error at 100 rollouts leaves daylight between them.  Right, a
// close pair with a gap of about half a point; at 100 rollouts the bars
// overlap completely, at 10,000 they still touch, and only around 100,000
// do they separate.  The gap is labelled on both.  Values are exact, from
// the generator; bars are one standard error.
(function () {
  if (window.__pigGapsInit) return; window.__pigGapsInit = true;
  const L = window.L2, D = window.PIG_DATA;
  document.querySelectorAll('svg.pig-gaps').forEach((svg) => {
    const root = L.el('g', {}, svg);
    const panel = (x0, title, pos, ns, lo, hi) => {
      const W = 300, AX0 = x0 + 30, AX1 = x0 + W - 20, vx = (p) => L.lerp(AX0, AX1, (p - lo) / (hi - lo));
      L.text(root, title, x0 + W / 2, 28, { size: 14, weight: 700 });
      L.text(root, `you ${pos.i} · opponent ${pos.j} · turn ${pos.k}`, x0 + W / 2, 48, { size: 11.5, fill: L.DIM, mono: true });
      const rows = ns.map((n, r) => {
        const y = 92 + r * 58;
        const g = L.el('g', { opacity: 0 }, root);
        L.text(g, `${n.toLocaleString('en-US')} rollouts each`, x0 + W / 2, y - 22, { size: 11.5, fill: L.DIM });
        [['roll', pos.roll, L.BLUE, -7], ['hold', pos.hold, L.GRAY, 7]].forEach(([name, p, col, dy]) => {
          const se = Math.sqrt(p * (1 - p) / n);
          L.el('line', { x1: vx(Math.max(lo, p - se)), y1: y + dy, x2: vx(Math.min(hi, p + se)), y2: y + dy, stroke: col, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.8 }, g);
          L.el('circle', { cx: vx(p), cy: y + dy, r: 4.5, fill: col }, g);
          L.text(g, name, AX0 - 8, y + dy, { anchor: 'end', size: 11, fill: col, weight: 700 });
        });
        return g;
      });
      // axis
      const AY = 92 + ns.length * 58 - 30;
      L.el('line', { x1: AX0, y1: AY, x2: AX1, y2: AY, stroke: L.INK, 'stroke-width': 1.2 }, root);
      const ticks = hi - lo > 0.2 ? [lo, (lo + hi) / 2, hi] : [lo, (lo + hi) / 2, hi];
      ticks.forEach((p) => { L.el('line', { x1: vx(p), y1: AY - 4, x2: vx(p), y2: AY + 4, stroke: L.INK }, root); L.text(root, `${(p * 100).toFixed(hi - lo > 0.2 ? 0 : 1)}%`, vx(p), AY + 16, { size: 10.5, mono: true, fill: L.DIM }); });
      // gap label
      const gap = L.el('g', { opacity: 0 }, root);
      const gy = AY + 40;
      L.el('path', { d: `M ${vx(Math.min(pos.roll, pos.hold))} ${gy} l 0 6 L ${vx(Math.max(pos.roll, pos.hold))} ${gy + 6} l 0 -6`, fill: 'none', stroke: L.ORANGE, 'stroke-width': 1.6 }, gap);
      L.text(gap, `gap ${(Math.abs(pos.roll - pos.hold) * 100).toFixed(hi - lo > 0.2 ? 0 : 1)} points`, (vx(pos.roll) + vx(pos.hold)) / 2, gy + 24, { size: 12.5, weight: 700, fill: L.ORANGE });
      return { rows, gap };
    };
    const A = panel(40, 'an easy comparison', D.easy, [100], 0.3, 0.9);
    const B = panel(420, 'a hard comparison', D.close, [100, 10000, 100000], D.close.roll - 0.03, D.close.roll + 0.03);
    const setState = (t) => {
      A.rows.forEach((g) => g.setAttribute('opacity', L.win(t, 0.3, 0.5))); A.gap.setAttribute('opacity', L.win(t, 1.0, 0.4));
      B.rows.forEach((g, i) => g.setAttribute('opacity', L.win(t, 1.6 + i * 0.8, 0.5))); B.gap.setAttribute('opacity', L.win(t, 4.2, 0.4));
    };
    L.timeline(svg, { T: 4.8, setState });
  });
})();
